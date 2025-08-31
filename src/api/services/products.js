import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer, arrayUnion, arrayRemove } from "firebase/firestore";

export const getAllProducts = async () => {
    console.log('Fetching all products');
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        if (!isNaN(data.lastBuyPrice) && !isNaN(data.price)) {
            data.profit = data.price - data.lastBuyPrice;
            data.profitPercentage = data.lastBuyPrice ? (data.profit / data.lastBuyPrice) * 100 : 0;
        }
        return { id: doc.id, ...data };
    });
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
        lastBuyAt: null,
        lastBuyPrice: null
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


export const updateProductsPrices = async (pricesData, userId) => {
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        // שלב 1: משיכת כל המוצרים
        const productsRef = collection(db, "products");
        const productsSnapshot = await getDocs(productsRef);

        // שלב 2: יצירת מפה לפי nbsProductId עם מחיר נוכחי
        const productIdToDocIdMap = new Map();
        const productIds = [];
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.nbsProductId) {
                const productInfo = {
                    documentId: doc.id,
                    currentPrice: data.price || 0
                };
                // שמירה גם כמחרוזת וגם כמספר לגמישות
                productIdToDocIdMap.set(data.nbsProductId, productInfo);
                productIdToDocIdMap.set(String(data.nbsProductId), productInfo);
                productIdToDocIdMap.set(Number(data.nbsProductId), productInfo);
                productIds.push(data.nbsProductId);
            }
        });

        // שלב 3: סינון הנתונים - רק שורות תקינות
        const validPricesData = [];
        const skippedRows = [];
        const notFoundProducts = [];
        const processedProductIds = new Set(); // למניעת כפילויות

        for (let i = 0; i < pricesData.length; i++) {
            const row = pricesData[i];
            const { productCode, price } = row;

            // דילוג על שורות עם עמודות ריקות
            if (!productCode || price === undefined || price === null) {
                skippedRows.push({
                    rowIndex: i + 1,
                    reason: 'Missing productCode or price',
                    data: row
                });
                continue;
            }

            // בדיקת כפילויות
            if (processedProductIds.has(productCode)) {
                skippedRows.push({
                    rowIndex: i + 1,
                    reason: 'Duplicate productCode',
                    data: row
                });
                continue;
            }

            // איתור document ID לפי קוד מוצר
            const productInfo = productIdToDocIdMap.get(productCode);
            if (!productInfo) {
                // נסה גם עם המרה למחרוזת ולמספר
                const productCodeStr = String(productCode);
                const productCodeNum = Number(productCode);
                const productInfoStr = productIdToDocIdMap.get(productCodeStr);
                const productInfoNum = productIdToDocIdMap.get(productCodeNum);

                if (productInfoStr) {
                    // בדיקה אם המחיר השתנה
                    if (productInfoStr.currentPrice === price) {
                        skippedRows.push({
                            rowIndex: i + 1,
                            reason: 'Price unchanged',
                            data: row
                        });
                        continue;
                    }
                    processedProductIds.add(productCode);
                    validPricesData.push({
                        documentId: productInfoStr.documentId,
                        productCode: productCodeStr,
                        price,
                        currentPrice: productInfoStr.currentPrice,
                        rowIndex: i + 1
                    });
                    continue;
                } else if (productInfoNum) {
                    // בדיקה אם המחיר השתנה
                    if (productInfoNum.currentPrice === price) {
                        skippedRows.push({
                            rowIndex: i + 1,
                            reason: 'Price unchanged',
                            data: row
                        });
                        continue;
                    }
                    processedProductIds.add(productCode);
                    validPricesData.push({
                        documentId: productInfoNum.documentId,
                        productCode: productCodeNum,
                        price,
                        currentPrice: productInfoNum.currentPrice,
                        rowIndex: i + 1
                    });
                    continue;
                }

                notFoundProducts.push({
                    rowIndex: i + 1,
                    productCode,
                    data: row
                });
                continue;
            }

            // בדיקה אם המחיר השתנה
            if (productInfo.currentPrice === price) {
                skippedRows.push({
                    rowIndex: i + 1,
                    reason: 'Price unchanged',
                    data: row
                });
                continue;
            }

            // הוספה לרשימת הנתונים התקינים
            processedProductIds.add(productCode);
            validPricesData.push({
                documentId: productInfo.documentId,
                productCode,
                price,
                currentPrice: productInfo.currentPrice,
                rowIndex: i + 1
            });
        }

        // שלב 4: עדכון בbatches של Firestore
        const updatedProducts = [];
        let actualUpdatedCount = 0;
        for (let i = 0; i < validPricesData.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchData = validPricesData.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const item of batchData) {
                const { documentId, productCode, price } = item;

                // הוספת העדכון לbatch
                const productDocRef = doc(db, 'products', documentId);
                batch.update(productDocRef, {
                    price: price,
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                });

                batchResults.push(item);
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                actualUpdatedCount += batchResults.length;
                updatedProducts.push(...batchResults);
            }
        }

        return {
            success: true,
            totalProcessed: pricesData.length,
            updatedCount: actualUpdatedCount,
            skippedCount: skippedRows.length,
            notFoundCount: notFoundProducts.length,
            updatedProducts,
            skippedRows,
            notFoundProducts
        };

    } catch (error) {
        console.error('Error updating products prices:', error);
        throw new Error(`שגיאה בעדכון מחירי המוצרים: ${error.message}`);
    }
}