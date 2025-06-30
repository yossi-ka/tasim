import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer } from "firebase/firestore";

export const getAllCustomers = async () => {
    console.log('Fetching all customers');
    const customersRef = collection(db, "customers");
    const q = query(customersRef, orderBy("registrationDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        // קריאה אחת לקבלת כל מספרי הלקוחות הקיימים
        console.log('Fetching existing customer IDs...');
        const existingCustomersQuery = query(customersCollection);
        const existingCustomersSnapshot = await getDocs(existingCustomersQuery);

        // יצירת Set של מספרי לקוחות קיימים לבדיקה מהירה
        const existingCustomerIds = new Set();
        existingCustomersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.customerNumber) {
                existingCustomerIds.add(data.customerNumber);
            }
        });

        console.log(`Found ${existingCustomerIds.size} existing customers`);

        // סינון הלקוחות - רק אלה שלא קיימים
        const newCustomers = [];
        const skippedCustomers = [];

        for (const customerData of customersData) {
            const { customerNumber } = customerData;

            if (!customerNumber) {
                console.warn('Customer without customerNumber, skipping:', customerData);
                continue;
            }

            if (existingCustomerIds.has(customerNumber)) {
                // הלקוח כבר קיים - דילוג
                skippedCustomers.push(customerNumber);
                console.log(`Customer ${customerNumber} already exists, skipping`);
            } else {
                // לקוח חדש
                newCustomers.push(customerData);
            }
        }

        console.log(`Processing ${newCustomers.length} new customers, skipping ${skippedCustomers.length} existing customers`);

        // העלאה של הלקוחות החדשים בbatches של Firestore
        const uploadedCustomers = [];
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
                uploadedCustomers.push(...batchResults);
                console.log(`Uploaded batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} customers`);
            }
        }

        return {
            success: true,
            totalProcessed: customersData.length,
            newCustomersCount: uploadedCustomers.length,
            skippedCount: skippedCustomers.length,
            newCustomers: uploadedCustomers,
            skippedCustomerIds: skippedCustomers
        };

    } catch (error) {
        console.error('Error uploading customers:', error);
        throw new Error(`שגיאה בהעלאת הלקוחות: ${error.message}`);
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
