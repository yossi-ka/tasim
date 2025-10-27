import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer, limit, deleteDoc } from "firebase/firestore";

export const getActiveRentalsByStatus = async (status) => {
    const rentalsRef = collection(db, "rentals");
    const q = query(rentalsRef,
        where("isActive", "==", true),
        where("rentalStatus", "==", status),
        orderBy("fromDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getActiveRentals = async () => {
    const rentalsRef = collection(db, "rentals");
    const q = query(rentalsRef, where("isActive", "==", true));

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return [];
    }

    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    await Promise.all(
        data.map(async (rental) => {
            if (rental.regularCustomerId) {
                const customerRef = doc(db, "customers", rental.regularCustomerId);
                const customerSnap = await getDoc(customerRef);
                rental.customerName = customerSnap.data().name;
            }
        })
    );

    return data;
}

export const getHistoricalRentals = async () => {
    const rentalsRef = collection(db, "rentals");
    const q = query(rentalsRef, where("isActive", "==", false), orderBy("fromDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const createRental = async (data, userId) => {
    const rentalsRef = collection(db, "rentals");
    const newRental = {
        ...data,
        createdBy: userId,
        updatedBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true,
        rentalStatus: 1, // סטטוס התחלתי
    };
    const docRef = await addDoc(rentalsRef, newRental);
    return { id: docRef.id, ...newRental };
}

export const updateRental = async (id, data, userId) => {
    const rentalRef = doc(db, "rentals", id);
    const updatedRental = {
        ...data,
        updatedBy: userId,
        updatedAt: Timestamp.now()
    };
    await updateDoc(rentalRef, updatedRental);
    return { id, ...updatedRental };
}

export const deleteRental = async (id) => {
    const rentalRef = doc(db, "rentals", id);
    await deleteDoc(rentalRef);
    return { id };
}



export const getrentalsByStatus = async (status) => {
    console.log('Fetching rentals with status:', status);
    const rentalsRef = collection(db, "rentals");
    const q = query(rentalsRef, status ? where("rentalstatus", "==", status) : null, orderBy("updateDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {

        const [phone1 = "", phone2 = "", phone3 = ""] = doc.data().phones || [];
        return {
            id: doc.id,
            ...doc.data(),
            phone1,
            phone2,
            phone3
        }
    });
}



export const updaterental = async (id, data, userId) => {
    const docRef = doc(db, 'rentals', id);

    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return { id, ...data }
}

export const uploadrentals = async (rentalsData, userId) => {
    const rentalsCollection = collection(db, 'rentals');
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        // קריאה אחת לקבלת כל מספרי ההזמנות הקיימים
        console.log('Fetching existing rental IDs...');
        const existingrentalsQuery = query(rentalsCollection);
        const existingrentalsSnapshot = await getDocs(existingrentalsQuery);

        // יצירת Set של מספרי הזמנות קיימים לבדיקה מהירה
        const existingrentalIds = new Set();
        existingrentalsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.nbsrentalId) {
                existingrentalIds.add(data.nbsrentalId);
            }
        });

        console.log(`Found ${existingrentalIds.size} existing rentals`);

        // סינון ההזמנות - רק אלה שלא קיימות
        const newrentals = [];
        const skippedrentals = [];

        for (const rentalData of rentalsData) {
            const { nbsrentalId } = rentalData;

            if (!nbsrentalId) {
                console.warn('rental without nbsrentalId, skipping:', rentalData);
                continue;
            }

            if (existingrentalIds.has(nbsrentalId)) {
                // ההזמנה כבר קיימת - דילוג
                skippedrentals.push(nbsrentalId);
                console.log(`rental ${nbsrentalId} already exists, skipping`);
            } else {
                // הזמנה חדשה
                newrentals.push(rentalData);
            }
        }

        console.log(`Processing ${newrentals.length} new rentals, skipping ${skippedrentals.length} existing rentals`);

        // העלאה של ההזמנות החדשות בbatches של Firestore
        const uploadedrentals = [];
        for (let i = 0; i < newrentals.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchrentals = newrentals.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const rentalData of batchrentals) {
                // יצירת מסמך חדש בקולקציה (עם ID אוטומטי)
                const newrentalRef = doc(rentalsCollection);

                // הוספת המידע הנדרש
                const rentalWithMetadata = {
                    ...rentalData,
                    rentalstatus: 1,
                    createdBy: userId,
                    createdDate: Timestamp.now(),
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                    isActive: true,
                };

                batch.set(newrentalRef, rentalWithMetadata);
                batchResults.push({ id: newrentalRef.id, ...rentalWithMetadata });
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                uploadedrentals.push(...batchResults);
                console.log(`Uploaded batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} rentals`);
            }
        }

        return {
            success: true,
            totalProcessed: rentalsData.length,
            newrentalsCount: uploadedrentals.length,
            skippedCount: skippedrentals.length,
            newrentals: uploadedrentals,
            skippedrentalIds: skippedrentals
        };

    } catch (error) {
        console.error('Error uploading rentals:', error);
        throw new Error(`שגיאה בהעלאת ההזמנות: ${error.message}`);
    }
}

export const getSummaryByStatus = async () => {
    const rentalsRef = collection(db, "rentals");

    // יצירת queries לכל סטטוס במקביל
    const countPromises = [
        getCountFromServer(query(rentalsRef)), // כל ההזמנות
        getCountFromServer(query(rentalsRef, where("rentalstatus", "==", 1))), // start
        getCountFromServer(query(rentalsRef, where("rentalstatus", "==", 2))), // likut
        getCountFromServer(query(rentalsRef, where("rentalstatus", "==", 3))), // mamtinLemishloach
        getCountFromServer(query(rentalsRef, where("rentalstatus", "==", 4))), // mishloach
        getCountFromServer(query(rentalsRef, where("rentalstatus", "==", 5))), // end
        getCountFromServer(query(rentalsRef, where("rentalstatus", "==", 6))), // kvitzat likut
        getCountFromServer(query(rentalsRef, where("rentalstatus", "==", 7)))  // kfuim-start
    ];

    try {
        const results = await Promise.all(countPromises);

        const summary = {
            all: results[0].data().count,
            start: results[1].data().count,
            likut: results[2].data().count,
            mamtinLemishloach: results[3].data().count,
            mishloach: results[4].data().count,
            end: results[5].data().count,
            kvitzatLikut: results[6].data().count,
            kfuimStart: results[7].data().count
        };

        return summary;
    } catch (error) {
        console.error('Error getting summary by status:', error);
        throw new Error(`שגיאה בקבלת סיכום לפי סטטוס: ${error.message}`);
    }
}

export const changerentalsStatus = async (ids, data, userId) => {

    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error("ids must be a non-empty array");
    }

    const FIRESTORE_BATCH_SIZE = 500;
    const updatedrentals = [];
    // קבלת collectionIndex הגבוה ביותר של השבוע הנוכחי
    // נחפש את כל המסמכים שיש להם collectionIndex ונוצרו/עודכנו השבוע (updateStatus בשבוע הנוכחי)
    // ואז נמצא את הערך המקסימלי כדי שנוכל להקצות max+1
    let collectionIndexCounterStart = 0;
    try {
        // חשב התחלת השבוע (יום ראשון 00:00) לפי זמן מקומי/UTC כפי שמתועד ב-Timestamp
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday
        // חישוב תאריך יום ראשון של השבוע הנוכחי
        const diffToSunday = day; // days since Sunday
        const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSunday);
        sunday.setHours(0, 0, 0, 0);

        // שאילתה: כל ההזמנות שיש להן collectionIndex וש- updateStatus >= תחילת השבוע
        const rentalsRef = collection(db, 'rentals');
        const q = query(rentalsRef,
            where('updateStatus', '>=', Timestamp.fromDate(sunday)),
            orderBy('collectionIndex', 'desc'),
            limit(1)
        );
        const snapshot = await getDocs(q);
        collectionIndexCounterStart = snapshot.empty ? 0 : snapshot.docs[0].data().collectionIndex || 0;
    } catch (err) {
        console.error('Error computing collectionIndex max:', err);
        // לא נזרוק שגיאה כי נשמור על עבודה רגילה בלי collectionIndex
        collectionIndexCounterStart = 0;
    }

    // נשתמש במונה מקומי כדי להקצות collectionIndex ייחודי לכל מסמך שצריך
    let collectionIndexCounter = collectionIndexCounterStart;

    for (let i = 0; i < ids.length; i += FIRESTORE_BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchIds = ids.slice(i, i + FIRESTORE_BATCH_SIZE);
        let batchHasOps = false;

        for (const id of batchIds) {
            const docRef = doc(db, 'rentals', id);
            const rentalDoc = await getDoc(docRef);
            if (!rentalDoc.exists()) {
                console.warn(`rental ${id} not found, skipping`);
                continue;
            }

            const rentalData = rentalDoc.data();

            const objToUpdate = {
                ...data,
                updateBy: userId,
                // הערכים של תאריכים
                updateDate: Timestamp.now(),
                updateStatus: Timestamp.now(),
            };

            // תנאים להוספת collectionIndex:
            // - סטטוס קודם היה 1
            // - סטטוס חדש (data.rentalstatus) הוא 2
            // - במסמך עדיין אין collectionIndex
            try {
                const prevStatus = rentalData.rentalstatus;
                const newStatus = data.rentalstatus;
                const hasCollectionIndex = rentalData.collectionIndex !== undefined && rentalData.collectionIndex !== null;

                if (prevStatus === 1 && newStatus === 2 && !hasCollectionIndex) {
                    collectionIndexCounter += 1;
                    objToUpdate.collectionIndex = collectionIndexCounter;
                }
            } catch (e) {
                // במקרה של בעיה בקריאת נתוני המסמך, רק נמשיך בלי collectionIndex
                console.warn('Error checking collectionIndex conditions for rental', id, e);
            }

            batch.update(docRef, objToUpdate);
            batchHasOps = true;
            updatedrentals.push(id);
        }

        if (batchHasOps) {
            await batch.commit();
        }
    }

    return { updatedrentalIds: updatedrentals, ...data };
}

export const getLatestImportStatus = async () => {
    try {
        const importrentalsRef = collection(db, "importrentals");
        const q = query(importrentalsRef, orderBy("createdAt", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        // המרת Timestamp לתאריך רגיל
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            complitedAt: data.complitedAt?.toDate()
        };
    } catch (error) {
        console.error('Error fetching latest import status:', error);
        throw error;
    }
}

export const syncrentalNumbers = async (userId) => {
    try {
        console.log('🚀 Starting rental numbers sync...');

        // 1. שליפת הזמנות בסטטוס 1
        console.log('🔍 Fetching rentals with status 1...');
        const rentalsRef = collection(db, "rentals");
        const rentalsQuery = query(rentalsRef, where("rentalstatus", "==", 1));
        const rentalsSnapshot = await getDocs(rentalsQuery);

        if (rentalsSnapshot.empty) {
            return {
                success: true,
                message: 'לא נמצאו הזמנות בסטטוס 1 לסנכרון',
                updatedCount: 0
            };
        }

        console.log(`📋 Found ${rentalsSnapshot.size} rentals with status 1`);

        // 2. טעינת מיפוי לקוחות (לפי nbsCustomerId)
        console.log('🔄 Loading customer mapping...');
        const customersRef = collection(db, "customers");
        const customersSnapshot = await getDocs(customersRef);

        const customerMapping = new Map();
        customersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.customerNumber) {
                customerMapping.set(data.customerNumber, {
                    id: doc.id,
                    customerNumber: data.customerNumber,
                    street: data.street || null,
                    houseNumber: data.houseNumber || null
                });
            }
        });
        console.log(`📋 Loaded ${customerMapping.size} customers for mapping`);

        // 3. טעינת מיפוי מסלולים (רשימה עם סדר כתובות)
        console.log('🔄 Loading route rentals mapping...');
        const routerentalsRef = collection(db, "routerentals");
        const routerentalsQuery = query(routerentalsRef, where("isActive", "==", true));
        const routerentalsSnapshot = await getDocs(routerentalsQuery);

        const routeMapping = new Map();
        routerentalsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.street && data.buildingNumber && data.rentalNumber !== undefined) {
                const key = `${data.street}-${data.buildingNumber}`;
                routeMapping.set(key, {
                    street: data.street,
                    buildingNumber: data.buildingNumber,
                    rentalNumber: data.rentalNumber
                });
            }
        });
        console.log(`📋 Loaded ${routeMapping.size} route rentals for mapping`);

        // 4. עדכון deliveryIndex להזמנות
        const BATCH_SIZE = 500;
        let currentBatch = writeBatch(db);
        let batchOperations = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;

        console.log('🔄 Processing rentals for delivery index update...');

        for (const rentalDoc of rentalsSnapshot.docs) {
            const rentalData = rentalDoc.data();
            const nbsCustomerId = rentalData.nbsCustomerId;

            if (!nbsCustomerId) {
                console.log(`⚠️ rental ${rentalData.nbsrentalId} has no nbsCustomerId, skipping`);
                totalSkipped++;
                continue;
            }

            // מציאת הלקוח לפי nbsCustomerId
            const mappedCustomer = customerMapping.get(nbsCustomerId);
            if (!mappedCustomer) {
                console.log(`⚠️ Customer ${nbsCustomerId} not found for rental ${rentalData.nbsrentalId}, skipping`);
                totalSkipped++;
                continue;
            }

            // חישוב deliveryIndex מטבלת המסלולים
            let newDeliveryIndex = 0;
            if (mappedCustomer.street && mappedCustomer.houseNumber) {
                const routeKey = `${mappedCustomer.street}-${mappedCustomer.houseNumber}`;
                const routerental = routeMapping.get(routeKey);
                if (routerental) {
                    newDeliveryIndex = routerental.rentalNumber;
                }
            }

            // בדיקה אם יש צורך בעדכון
            const currentDeliveryIndex = rentalData.deliveryIndex || 0;
            if (currentDeliveryIndex === newDeliveryIndex) {
                continue; // אין צורך בעדכון
            }

            console.log(`📦 Updating rental ${rentalData.nbsrentalId}: deliveryIndex ${currentDeliveryIndex} -> ${newDeliveryIndex}`);

            // הוספה לbatch
            const rentalRef = doc(db, 'rentals', rentalDoc.id);
            currentBatch.update(rentalRef, {
                deliveryIndex: newDeliveryIndex,
                updateBy: userId,
                updateDate: Timestamp.now()
            });

            batchOperations++;
            totalUpdated++;

            // שליחת batch כשמגיעים לגבול
            if (batchOperations >= BATCH_SIZE) {
                await currentBatch.commit();
                console.log(`✅ Batch committed with ${batchOperations} operations`);
                currentBatch = writeBatch(db);
                batchOperations = 0;
            }
        }

        // שליחת batch אחרון אם יש פעולות
        if (batchOperations > 0) {
            await currentBatch.commit();
            console.log(`✅ Final batch committed with ${batchOperations} operations`);
        }

        const message = `סנכרון מספרים הושלם בהצלחה. עודכנו: ${totalUpdated} הזמנות, דולגו: ${totalSkipped} הזמנות`;
        console.log(`✅ ${message}`);

        return {
            success: true,
            message,
            updatedCount: totalUpdated,
            skippedCount: totalSkipped
        };

    } catch (error) {
        console.error('💥 Error syncing rental numbers:', error);
        throw new Error(`שגיאה בסנכרון מספרים: ${error.message}`);
    }
}
