import { db } from '../../firebase-config'
import { getAllRouteOrders } from './routeOrders';

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer } from "firebase/firestore";

export const getAllCustomers = async () => {
    console.log('Fetching all customers');
    
    try {
        // שלב 1: קבלת כל הלקוחות
        const customersRef = collection(db, "customers");
        const q = query(customersRef, orderBy("registrationDate", "desc"));
        const querySnapshot = await getDocs(q);
        const customers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // שלב 2: קבלת כל המסלולים
        console.log('Fetching all route orders');
        const routeOrders = await getAllRouteOrders();
        
        // שלב 3: יצירת Map למסלולים לפי רחוב ובנין לחיפוש מהיר
        const routeMap = new Map();
        routeOrders.forEach(route => {
            if (route.street && route.buildingNumber) {
                const key = `${route.street}-${route.buildingNumber}`;
                routeMap.set(key, route.orderNumber || 0);
            }
        });
        
        console.log(`Created route map with ${routeMap.size} entries`);
        
        // שלב 4: שילוב הנתונים - הוספת deliveryIndex לכל לקוח
        const customersWithDeliveryIndex = customers.map(customer => {
            const street = customer.street;
            const buildingNumber = customer.houseNumber; // מיפוי houseNumber -> buildingNumber
            
            let deliveryIndex = 0; // ערך ברירת מחדל
            
            if (street && buildingNumber) {
                const key = `${street}-${buildingNumber}`;
                const routeOrderNumber = routeMap.get(key);
                if (routeOrderNumber !== undefined) {
                    deliveryIndex = routeOrderNumber;
                }
            }
            
            return {
                ...customer,
                deliveryIndex
            };
        });
        
        console.log(`Successfully processed ${customersWithDeliveryIndex.length} customers with delivery index`);
        return customersWithDeliveryIndex;
        
    } catch (error) {
        console.error('Error fetching customers with delivery index:', error);
        throw new Error(`שגיאה בקבלת לקוחות עם אינדקס משלוח: ${error.message}`);
    }
}

export const getCustomerById = async (id) => {
    const docRef = doc(db, 'customers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

export const addCustomer = async (data, userId) => {
    const docRef = await addDoc(collection(db, 'customers'), {
        ...data,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data }
}

export const updateCustomer = async (id, data, userId) => {
    const docRef = doc(db, 'customers', id);

    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return { id, ...data }
}

export const uploadCustomers = async (customersData, userId) => {
    const customersCollection = collection(db, 'customers');
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        // קריאה אחת לקבלת כל הלקוחות הקיימים
        console.log('Fetching existing customers...');
        const existingCustomersQuery = query(customersCollection);
        const existingCustomersSnapshot = await getDocs(existingCustomersQuery);

        // יצירת Map של לקוחות קיימים לפי customerNumber
        const existingCustomersMap = new Map();
        existingCustomersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.customerNumber) {
                existingCustomersMap.set(data.customerNumber, {
                    id: doc.id,
                    data: data
                });
            }
        });

        console.log(`Found ${existingCustomersMap.size} existing customers`);

        // הפרדה בין לקוחות חדשים ולקוחות לעדכון
        const newCustomers = [];
        const customersToUpdate = [];
        const skippedCustomers = [];

        for (const customerData of customersData) {
            const { customerNumber } = customerData;

            if (!customerNumber) {
                console.warn('Customer without customerNumber, skipping:', customerData);
                skippedCustomers.push({ reason: 'Missing customerNumber', data: customerData });
                continue;
            }

            if (existingCustomersMap.has(customerNumber)) {
                // לקוח קיים - הוספה לרשימת העדכונים
                const existingCustomer = existingCustomersMap.get(customerNumber);
                customersToUpdate.push({
                    id: existingCustomer.id,
                    customerNumber,
                    newData: customerData,
                    existingData: existingCustomer.data
                });
                console.log(`Customer ${customerNumber} exists, will be updated`);
            } else {
                // לקוח חדש
                newCustomers.push(customerData);
            }
        }

        console.log(`Processing ${newCustomers.length} new customers and ${customersToUpdate.length} existing customers for update`);

        const addedCustomers = [];
        const updatedCustomers = [];

        // שלב 1: הוספת לקוחות חדשים
        for (let i = 0; i < newCustomers.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchCustomers = newCustomers.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const customerData of batchCustomers) {
                // יצירת מסמך חדש בקולקציה (עם ID אוטומטי)
                const newCustomerRef = doc(customersCollection);

                // הוספת המידע הנדרש
                const customerWithMetadata = {
                    ...customerData,
                    createdBy: userId,
                    createdDate: Timestamp.now(),
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                    isActive: true,
                };

                batch.set(newCustomerRef, customerWithMetadata);
                batchResults.push({ id: newCustomerRef.id, ...customerWithMetadata });
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                addedCustomers.push(...batchResults);
                console.log(`Added batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} new customers`);
            }
        }

        // שלב 2: עדכון לקוחות קיימים
        for (let i = 0; i < customersToUpdate.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchCustomers = customersToUpdate.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const customerUpdate of batchCustomers) {
                const { id, newData, existingData } = customerUpdate;
                
                // שמירה על נתונים קיימים חשובים
                const updatedCustomerData = {
                    ...newData,
                    createdBy: existingData.createdBy || userId, // שמירה על יוצר המקורי
                    createdDate: existingData.createdDate || Timestamp.now(), // שמירה על תאריך יצירה מקורי
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                    isActive: existingData.isActive !== undefined ? existingData.isActive : true, // שמירה על סטטוס קיים
                };

                const customerDocRef = doc(db, 'customers', id);
                batch.update(customerDocRef, updatedCustomerData);
                batchResults.push({ id, ...updatedCustomerData });
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                updatedCustomers.push(...batchResults);
                console.log(`Updated batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} existing customers`);
            }
        }

        return {
            success: true,
            totalProcessed: customersData.length,
            newCustomersCount: addedCustomers.length,
            updatedCustomersCount: updatedCustomers.length,
            skippedCount: skippedCustomers.length,
            addedCustomers,
            updatedCustomers,
            skippedCustomers
        };

    } catch (error) {
        console.error('Error uploading/updating customers:', error);
        throw new Error(`שגיאה בהעלאת/עדכון הלקוחות: ${error.message}`);
    }
}

export const getCustomersCount = async () => {
    const customersRef = collection(db, "customers");
    const countQuery = query(customersRef, where("isActive", "==", true));
    
    try {
        const countSnapshot = await getCountFromServer(countQuery);
        return countSnapshot.data().count;
    } catch (error) {
        console.error('Error getting customers count:', error);
        throw new Error(`שגיאה בקבלת מספר הלקוחות: ${error.message}`);
    }
}

export const updateCustomersDeliveryIndex = async (deliveryData, userId) => {
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        console.log('Starting delivery index update process...');
        
        // שלב 1: משיכת כל הלקוחות
        console.log('Fetching all customers...');
        const customersRef = collection(db, "customers");
        const customersSnapshot = await getDocs(customersRef);
        
        // שלב 2: יצירת מפה לפי customerNumber
        console.log('Creating customer number to ID mapping...');
        const customerNumberToIdMap = new Map();
        customersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.customerNumber) {
                customerNumberToIdMap.set(data.customerNumber, doc.id);
            }
        });
        
        console.log(`Found ${customerNumberToIdMap.size} customers with customer numbers`);
        
        // שלב 3: סינון הנתונים - רק שורות תקינות
        const validDeliveryData = [];
        const skippedRows = [];
        const notFoundCustomers = [];
        
        for (let i = 0; i < deliveryData.length; i++) {
            const row = deliveryData[i];
            const { deliveryIndex, customerNumber } = row;
            
            // דילוג על שורות עם עמודות ריקות
            if (!deliveryIndex || !customerNumber) {
                console.log(`Skipping row ${i + 1}: missing deliveryIndex (${deliveryIndex}) or customerNumber (${customerNumber})`);
                skippedRows.push({
                    rowIndex: i + 1,
                    reason: 'Missing deliveryIndex or customerNumber',
                    data: row
                });
                continue;
            }
            
            // איתור ID לפי מספר לקוח
            const customerId = customerNumberToIdMap.get(customerNumber);
            if (!customerId) {
                console.log(`Customer number ${customerNumber} not found in database`);
                notFoundCustomers.push({
                    rowIndex: i + 1,
                    customerNumber,
                    data: row
                });
                continue;
            }
            
            // הוספה לרשימת הנתונים התקינים
            validDeliveryData.push({
                customerId,
                customerNumber,
                deliveryIndex,
                rowIndex: i + 1
            });
        }
        
        console.log(`Processing ${validDeliveryData.length} valid updates, skipping ${skippedRows.length} rows, ${notFoundCustomers.length} customers not found`);
        
        // שלב 4: עדכון בbatches של Firestore
        const updatedCustomers = [];
        for (let i = 0; i < validDeliveryData.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchData = validDeliveryData.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];
            
            for (const item of batchData) {
                const { customerId, customerNumber, deliveryIndex } = item;
                
                // הוספת העדכון לbatch
                const customerDocRef = doc(db, 'customers', customerId);
                batch.update(customerDocRef, {
                    deliveryIndex: deliveryIndex,
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                });
                
                batchResults.push(item);
            }
            
            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                updatedCustomers.push(...batchResults);
                console.log(`Updated batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} customers`);
            }
        }
        
        console.log(`Update process completed. Updated: ${updatedCustomers.length}, Skipped: ${skippedRows.length}, Not found: ${notFoundCustomers.length}`);
        
        return {
            success: true,
            totalProcessed: deliveryData.length,
            updatedCount: updatedCustomers.length,
            skippedCount: skippedRows.length,
            notFoundCount: notFoundCustomers.length,
            updatedCustomers,
            skippedRows,
            notFoundCustomers
        };
        
    } catch (error) {
        console.error('Error updating customers delivery index:', error);
        throw new Error(`שגיאה בעדכון אינדקס משלוח הלקוחות: ${error.message}`);
    }
}


