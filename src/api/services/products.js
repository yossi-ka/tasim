import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer, arrayUnion, arrayRemove } from "firebase/firestore";

export const getAllProducts = async () => {
    console.log('Fetching all products');
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getProductById = async (id) => {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

export const addProduct = async (data, userId) => {
    const docRef = await addDoc(collection(db, 'products'), {
        ...data,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data }
}

export const updateProduct = async (id, data, userId) => {
    const docRef = doc(db, 'products', id);

    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return { id, ...data }
}

export const uploadProducts = async (productsData, userId) => {
    const productsCollection = collection(db, 'products');
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        // קריאה אחת לקבלת כל קודי המוצרים הקיימים
        console.log('Fetching existing product IDs...');
        const existingProductsQuery = query(productsCollection);
        const existingProductsSnapshot = await getDocs(existingProductsQuery);

        // יצירת Set של קודי מוצרים קיימים לבדיקה מהירה
        const existingProductIds = new Set();
        existingProductsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.nbsProductId) {
                existingProductIds.add(data.nbsProductId);
            }
        });

        console.log(`Found ${existingProductIds.size} existing products`);

        // סינון המוצרים - רק אלה שלא קיימים
        const newProducts = [];
        const skippedProducts = [];

        for (const productData of productsData) {
            const { nbsProductId } = productData;

            if (!nbsProductId) {
                console.warn('Product without nbsProductId, skipping:', productData);
                continue;
            }

            if (existingProductIds.has(nbsProductId)) {
                // המוצר כבר קיים - דילוג
                skippedProducts.push(nbsProductId);
                console.log(`Product ${nbsProductId} already exists, skipping`);
            } else {
                // מוצר חדש
                newProducts.push(productData);
            }
        }

        console.log(`Processing ${newProducts.length} new products, skipping ${skippedProducts.length} existing products`);

        // העלאה של המוצרים החדשים בbatches של Firestore
        const uploadedProducts = [];
        for (let i = 0; i < newProducts.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchProducts = newProducts.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const productData of batchProducts) {
                // יצירת מסמך חדש בקולקציה (עם ID אוטומטי)
                const newProductRef = doc(productsCollection);

                // הוספת המידע הנדרש
                const productWithMetadata = {
                    ...productData,
                    createdBy: userId,
                    createdDate: Timestamp.now(),
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                    isActive: true,
                };

                batch.set(newProductRef, productWithMetadata);
                batchResults.push({ id: newProductRef.id, ...productWithMetadata });
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                uploadedProducts.push(...batchResults);
                console.log(`Uploaded batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} products`);
            }
        }

        return {
            success: true,
            totalProcessed: productsData.length,
            newProductsCount: uploadedProducts.length,
            skippedCount: skippedProducts.length,
            newProducts: uploadedProducts,
            skippedProductIds: skippedProducts
        };

    } catch (error) {
        console.error('Error uploading products:', error);
        throw new Error(`שגיאה בהעלאת המוצרים: ${error.message}`);
    }
}

export const getProductsCount = async () => {
    const productsRef = collection(db, "products");
    const countQuery = query(productsRef, where("isActive", "==", true));

    try {
        const countSnapshot = await getCountFromServer(countQuery);
        return countSnapshot.data().count;
    } catch (error) {
        console.error('Error getting products count:', error);
        throw new Error(`שגיאה בקבלת מספר המוצרים: ${error.message}`);
    }
}

export const updateCategories = async (products, category, type, userId) => {

    const batch = writeBatch(db);
    const productsCollection = collection(db, 'products');


    products.forEach(product => {
        const productRef = doc(productsCollection, product);
        if (type === "add") {
            batch.update(productRef, {
                categories: arrayUnion(category),
                updateBy: userId,
                updateDate: Timestamp.now(),
            });
        } else if (type === "remove") {
            batch.update(productRef, {
                categories: arrayRemove(category),
                updateBy: userId,
                updateDate: Timestamp.now(),
            });
        }
    })

    await batch.commit();
}

export const updateIsQuantityForShipping = async (products, isQuantityForShipping, userId) => {
    const batch = writeBatch(db);
    const productsCollection = collection(db, 'products');

    products.forEach(product => {
        const productRef = doc(productsCollection, product);
        batch.update(productRef, {
            isQuantityForShipping,
            updateBy: userId,
            updateDate: Timestamp.now(),
        });
    });

    await batch.commit();
}



export const checkProductPlace = async (productId, place) => {
    const q = query(collection(db, "products"), where("__name__", "!=", productId), where("productPlace", "==", place));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null; // מקום המוצר פנוי
    } else {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0]; // מקום המוצר תפוס
    }
}
