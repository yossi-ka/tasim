import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer } from "firebase/firestore";

export const getAllInvoices = async () => {
    console.log('Fetching all invoices');
    const invoicesRef = collection(db, "invoices");
    const q = query(invoicesRef, orderBy("invoiceDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getInvoiceById = async (id) => {
    const docRef = doc(db, 'invoices', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

export const addInvoice = async (data, userId) => {
    console.log('addInvoice נקראה עם הנתונים:', data);
    
    const products = data.products || [];
    console.log('מוצרים שנמצאו:', products);
    
    // יצירת עותק של הנתונים בלי המוצרים
    const invoiceData = { ...data };
    delete invoiceData.products;
    
    const batch = writeBatch(db);
    const invRef = doc(collection(db, 'invoices'));

    if(invoiceData.invoiceDate && !(invoiceData.invoiceDate instanceof Timestamp)) {
        invoiceData.invoiceDate = Timestamp.fromDate(new Date(invoiceData.invoiceDate));
    }
    if(invoiceData.dueDate && !(invoiceData.dueDate instanceof Timestamp)) {
        invoiceData.dueDate = Timestamp.fromDate(new Date(invoiceData.dueDate));
    }   

    invoiceData.totalRows = products.length;
    invoiceData.totalAmount = products.reduce((total, product) => total + (product.unitPrice * product.quantity), 0);
    invoiceData.totalQuantity = products.reduce((total, product) => total + (product.quantity || 0), 0);   

    
    batch.set(invRef, {
        ...invoiceData,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    products.forEach(product => {
        console.log('מעבד מוצר:', product);
        
        // ניקוי ערכים undefined
        const cleanProduct = {};
        Object.keys(product).forEach(key => {
            if (product[key] !== undefined && product[key] !== null) {
                cleanProduct[key] = product[key];
            }
        });
        
        console.log('מוצר נקי:', cleanProduct);
        
        const productRef = doc(collection(db, 'invoiceProducts'));
        batch.set(productRef, {
            ...cleanProduct,
            invoiceId: invRef.id,
            createdDate: Timestamp.now(),
        });
    });

    await batch.commit();
    console.log('החשבונית נשמרה בהצלחה עם ID:', invRef.id);

    return { id: invRef.id, ...invoiceData }
}

export const uploadInvoices = async (invoicesData, userId) => {
    const invoicesCollection = collection(db, 'invoices');
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        // קריאה אחת לקבלת כל מספרי החשבוניות הקיימות
        console.log('Fetching existing invoice numbers...');
        const existingInvoicesQuery = query(invoicesCollection);
        const existingInvoicesSnapshot = await getDocs(existingInvoicesQuery);

        // יצירת Set של מספרי חשבוניות קיימות לבדיקה מהירה
        const existingInvoiceNumbers = new Set();
        existingInvoicesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.invoiceNumber) {
                existingInvoiceNumbers.add(data.invoiceNumber);
            }
        });

        console.log(`Found ${existingInvoiceNumbers.size} existing invoices`);

        // סינון החשבוניות - רק אלה שלא קיימות
        const newInvoices = [];
        const skippedInvoices = [];

        for (const invoiceData of invoicesData) {
            const { invoiceNumber } = invoiceData;

            if (!invoiceNumber) {
                console.warn('Invoice without invoiceNumber, skipping:', invoiceData);
                continue;
            }

            if (existingInvoiceNumbers.has(invoiceNumber)) {
                // החשבונית כבר קיימת - דילוג
                skippedInvoices.push(invoiceNumber);
                console.log(`Invoice ${invoiceNumber} already exists, skipping`);
            } else {
                // חשבונית חדשה
                newInvoices.push(invoiceData);
            }
        }

        console.log(`Processing ${newInvoices.length} new invoices, skipping ${skippedInvoices.length} existing invoices`);

        // העלאה של החשבוניות החדשות בbatches של Firestore
        const uploadedInvoices = [];
        for (let i = 0; i < newInvoices.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchInvoices = newInvoices.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const invoiceData of batchInvoices) {
                // יצירת מסמך חדש בקולקציה (עם ID אוטומטי)
                const newInvoiceRef = doc(invoicesCollection);

                // הוספת המידע הנדרש
                const invoiceWithMetadata = {
                    ...invoiceData,
                    createdBy: userId,
                    createdDate: Timestamp.now(),
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                    isActive: true,
                };

                batch.set(newInvoiceRef, invoiceWithMetadata);
                batchResults.push({ id: newInvoiceRef.id, ...invoiceWithMetadata });
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                uploadedInvoices.push(...batchResults);
                console.log(`Uploaded batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} invoices`);
            }
        }

        return {
            success: true,
            totalProcessed: invoicesData.length,
            newInvoicesCount: uploadedInvoices.length,
            skippedCount: skippedInvoices.length,
            newInvoices: uploadedInvoices,
            skippedInvoiceNumbers: skippedInvoices
        };

    } catch (error) {
        console.error('Error uploading invoices:', error);
        throw new Error(`שגיאה בהעלאת החשבוניות: ${error.message}`);
    }
}

export const getInvoicesCount = async () => {
    const invoicesRef = collection(db, "invoices");
    const countQuery = query(invoicesRef, where("isActive", "==", true));

    try {
        const countSnapshot = await getCountFromServer(countQuery);
        return countSnapshot.data().count;
    } catch (error) {
        console.error('Error getting invoices count:', error);
        throw new Error(`שגיאה בקבלת מספר החשבוניות: ${error.message}`);
    }
}

export const deleteInvoice = async (id, userId) => {
    const docRef = doc(db, 'invoices', id);
    
    await updateDoc(docRef, {
        isActive: false,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    
    return { id, isActive: false }
}

export const getInvoiceProducts = async (invoiceId) => {
    const q = query(collection(db, "invoiceProducts"), where("invoiceId", "==", invoiceId));
    const productsSnapshot = await getDocs(q);
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return products;
}
