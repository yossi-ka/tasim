import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer } from "firebase/firestore";

export const getAllSuppliers = async () => {
    console.log('Fetching all suppliers');
    const suppliersRef = collection(db, "suppliers");
    const q = query(suppliersRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getSupplierById = async (id) => {
    const docRef = doc(db, 'suppliers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

export const addSupplier = async (data, userId) => {
    const docRef = await addDoc(collection(db, 'suppliers'), {
        ...data,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data }
}

export const updateSupplier = async (id, data, userId) => {
    const docRef = doc(db, 'suppliers', id);

    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return { id, ...data }
}

export const uploadSuppliers = async (suppliersData, userId) => {
    const suppliersCollection = collection(db, 'suppliers');
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        // קריאה אחת לקבלת כל מספרי הספקים הקיימים
        console.log('Fetching existing supplier codes...');
        const existingSuppliersQuery = query(suppliersCollection);
        const existingSuppliersSnapshot = await getDocs(existingSuppliersQuery);

        // יצירת Set של קודי ספקים קיימים לבדיקה מהירה
        const existingSupplierCodes = new Set();
        existingSuppliersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.supplierCode) {
                existingSupplierCodes.add(data.supplierCode);
            }
        });

        console.log(`Found ${existingSupplierCodes.size} existing suppliers`);

        // סינון הספקים - רק אלה שלא קיימים
        const newSuppliers = [];
        const skippedSuppliers = [];

        for (const supplierData of suppliersData) {
            const { supplierCode } = supplierData;

            if (!supplierCode) {
                console.warn('Supplier without supplierCode, skipping:', supplierData);
                continue;
            }

            if (existingSupplierCodes.has(supplierCode)) {
                // הספק כבר קיים - דילוג
                skippedSuppliers.push(supplierCode);
                console.log(`Supplier ${supplierCode} already exists, skipping`);
            } else {
                // ספק חדש
                newSuppliers.push(supplierData);
            }
        }

        console.log(`Processing ${newSuppliers.length} new suppliers, skipping ${skippedSuppliers.length} existing suppliers`);

        // העלאה של הספקים החדשים בbatches של Firestore
        const uploadedSuppliers = [];
        for (let i = 0; i < newSuppliers.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchSuppliers = newSuppliers.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const supplierData of batchSuppliers) {
                // יצירת מסמך חדש בקולקציה (עם ID אוטומטי)
                const newSupplierRef = doc(suppliersCollection);

                // הוספת המידע הנדרש
                const supplierWithMetadata = {
                    ...supplierData,
                    createdBy: userId,
                    createdDate: Timestamp.now(),
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                    isActive: true,
                };

                batch.set(newSupplierRef, supplierWithMetadata);
                batchResults.push({ id: newSupplierRef.id, ...supplierWithMetadata });
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                uploadedSuppliers.push(...batchResults);
                console.log(`Uploaded batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} suppliers`);
            }
        }

        return {
            success: true,
            totalProcessed: suppliersData.length,
            newSuppliersCount: uploadedSuppliers.length,
            skippedCount: skippedSuppliers.length,
            newSuppliers: uploadedSuppliers,
            skippedSupplierCodes: skippedSuppliers
        };

    } catch (error) {
        console.error('Error uploading suppliers:', error);
        throw new Error(`שגיאה בהעלאת הספקים: ${error.message}`);
    }
}

export const getSuppliersCount = async () => {
    const suppliersRef = collection(db, "suppliers");
    const countQuery = query(suppliersRef, where("isActive", "==", true));

    try {
        const countSnapshot = await getCountFromServer(countQuery);
        return countSnapshot.data().count;
    } catch (error) {
        console.error('Error getting suppliers count:', error);
        throw new Error(`שגיאה בקבלת מספר הספקים: ${error.message}`);
    }
}

export const deleteSupplier = async (id, userId) => {
    const docRef = doc(db, 'suppliers', id);
    
    await updateDoc(docRef, {
        isActive: false,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    
    return { id, isActive: false }
}
