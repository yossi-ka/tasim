const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { db } = require("../firebase-config");

//טריגר למוצרים בחשבוניות
const productPriceUpdate = onDocumentWritten("invoiceProducts/{productId}", async (change) => {
    const data = change.data.after.data();

    //למצוא את המוצר בטבלת המוצרים
    const productDoc = await db.doc(`products/${data.id}`).get();
    if (!productDoc.exists) {
        console.log("Product not found");
        return;
    }

    const productData = productDoc.data();
    const productLastBuyAt = productData.lastBuyAt ? productData.lastBuyAt.toDate() : null;
    const productLastBuyPrice = productData.lastBuyPrice || null;

    //למצוא את החשובנית בטבלת החשבוניות לפי המזהה
    const invoiceDoc = await db.doc(`invoices/${data.invoiceId}`).get();
    if (!invoiceDoc.exists) {
        console.log("Invoice not found");
        return;
    }

    const invoiceData = invoiceDoc.data();
    const invoiceDate = invoiceData.invoiceDate.toDate();

    if (productLastBuyAt && productLastBuyAt >= invoiceDate ||
        productLastBuyPrice && productLastBuyPrice === data.unitPrice) {
        return; // אין צורך לעדכן
    }

    //אם יותר גדול - לעדכן את השדות lastBuyAt ו- lastBuyPrice
    try {
        await db.doc(`products/${data.id}`).update({
            lastBuyAt: invoiceDate,
            lastBuyPrice: data.unitPrice
        });
    } catch (error) {
        console.error("💥 Error updating product:", error);
    }
});

module.exports = {
    productPriceUpdate
};