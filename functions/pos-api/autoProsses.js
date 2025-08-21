
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { sendEmail } = require("../emails/sendEmail");
const { db } = require("../firebase-config");
const { yemotRequest } = require("../api");
const { Timestamp } = require("firebase-admin/firestore");


const newChalukaMessage = onDocumentCreated("orderMessages/{message}", async (event) => {

    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }
    const data = snapshot.data();

    const { orderId, message, employeeId } = data;

    let order = null
    if (orderId) {
        const buildQ = await db.doc('orders/' + orderId).get()
        if (!buildQ.exists) {
            console.log("No such document!");
            return;
        }

        order = buildQ.data();
    }
    const userQ = await db.doc('employees/' + employeeId).get()
    const userData = userQ.data();
    const userName = (userData.firstName || "") + " " + (userData.lastName || "");

    // יצירת HTML מעוצב עם פרטי הזמנה
    const createEmailHTML = () => {
        const currentDate = new Date().toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let orderDetailsHTML = '';

        if (order) {
            const fullName = (order.lastName || "") + "-" + (order.firstName || "");
            const orderDetails = {
                nbsOrderId: order.nbsOrderId || "",
                fullName: fullName,
                street: order.street || "",
                houseNumber: order.houseNumber || "",
                entrance: order.entrance || "",
                floor: order.floor || "",
                apartment: order.apartment || "",
                phone: order.phone || "",
            };

            orderDetailsHTML = `
                <div style="background: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; margin: 20px 0; overflow: hidden;">
                    <div style="background: #f8f9fa; padding: 15px 20px; border-bottom: 1px solid #e1e8ed; font-weight: 600; color: #495057;">
                        📦 פרטי הזמנה
                    </div>
                    <div style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f3f4;">
                            <span style="font-weight: 600; color: #667eea; min-width: 100px;">מספר הזמנה:</span>
                            <span style="flex: 1; text-align: left; color: #333; font-weight: 500;">#${orderDetails.nbsOrderId}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f3f4;">
                            <span style="font-weight: 600; color: #667eea; min-width: 100px;">שם מלא:</span>
                            <span style="flex: 1; text-align: left; color: #333; font-weight: 500;">${orderDetails.fullName}</span>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <strong style="color: #667eea;">📍 כתובת משלוח:</strong>
                            <div style="margin-top: 10px; padding: 15px; background: #f8f9ff; border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                    <span style="font-weight: 600; color: #667eea;">רחוב:</span>
                                    <span style="color: #333; font-weight: 500;">${orderDetails.street}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                    <span style="font-weight: 600; color: #667eea;">מספר בית:</span>
                                    <span style="color: #333; font-weight: 500;">${orderDetails.houseNumber}</span>
                                </div>
                                ${orderDetails.entrance ? `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                    <span style="font-weight: 600; color: #667eea;">כניסה:</span>
                                    <span style="color: #333; font-weight: 500;">${orderDetails.entrance}</span>
                                </div>
                                ` : ''}
                                ${orderDetails.floor ? `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                    <span style="font-weight: 600; color: #667eea;">קומה:</span>
                                    <span style="color: #333; font-weight: 500;">${orderDetails.floor}</span>
                                </div>
                                ` : ''}
                                ${orderDetails.apartment ? `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                    <span style="font-weight: 600; color: #667eea;">דירה:</span>
                                    <span style="color: #333; font-weight: 500;">${orderDetails.apartment}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${orderDetails.phone ? `
                        <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin-top: 15px;">
                            <strong style="color: #667eea;">📞 פרטי קשר:</strong>
                            <div style="margin-top: 8px; font-weight: 600; color: #333;">
                                ${orderDetails.phone}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>הודעה חדשה</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; margin: 0; padding: 20px; color: #333; direction: rtl;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 600;">💬 הודעה חדשה</h1>
                </div>
                
                <div style="padding: 30px;">
                    <div style="background: #f8f9ff; border-right: 4px solid #667eea; padding: 20px; margin-bottom: 25px; border-radius: 8px;">
                        <div style="font-weight: 600; font-size: 18px; color: #667eea; margin-bottom: 10px;">💬 הודעה מאת: ${userName}</div>
                        <div style="line-height: 1.6; color: #555; margin-bottom: 10px;">${message}</div>
                        <div style="color: #8a9ba8; font-size: 14px; margin-top: 10px;">⏰ נשלח בתאריך: ${currentDate}</div>
                    </div>
                    
                    ${orderDetailsHTML}
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed; color: #6c757d; font-size: 14px;">
                    <div>המשך יום מקסים,</div>
                    <div style="margin-top: 5px; font-weight: 600;">ויאללה לעבודה 💪</div>
                    <div style="margin-top: 10px;">מערכת ניהול הזמנות - כנפי נשרים</div>
                    <div style="margin-top: 5px;">© ${new Date().getFullYear()} כל הזכויות שמורות</div>
                </div>
            </div>
        </body>
        </html>
        `;
    };

    const html = createEmailHTML();

    // const emailes = ['kenig91255@gmail.com'].join(',')
    const emailes = ['sa5091111@gmail.com'].join(',')

    // יצירת נושא דינמי בהתאם לסוג ההודעה
    const subject = order ?
        `הודעה חדשה - הזמנה #${order.nbsOrderId || 'ללא מספר'}` :
        'הודעה חדשה';

    await sendEmail({
        to: emailes,
        replyTo: 'sa5091111@gmail.com',
        subject: subject,
        body: html
    })


});


// טריגר: כאשר סטטוס של orderProduct משתנה מ-2 ל-3, לעדכן את collectionGroupProducts אם צריך
const onOrderProductStatusChange = onDocumentUpdated("orderProducts/{orderProductId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (!before || !after) return;
    // נבדוק אם הסטטוס השתנה מ-2 ל-3
    if (before.status !== after.status && (after.status === 3 || after.status === 4)) {
        const { productId, collectionGroupId, orderId } = after;
        if (!productId || !collectionGroupId || !orderId) return;
        // בדיקה אם יש עוד orderProducts עם אותו productId ו-collectionGroupId בסטטוס 2 (באמצעות count)
        const countSnap = await db.collection('orderProducts')
            .where('productId', '==', productId)
            .where('collectionGroupId', '==', collectionGroupId)
            .where('status', '==', 2)
            .count()
            .get();
        if (countSnap.data().count === 0) {
            // עדכון הרשומה המתאימה ב-collectionGroupProducts לסטטוס 3
            const cgProductSnap = await db.collection('collectionGroupProducts')
                .where('productId', '==', productId)
                .where('collectionGroupId', '==', collectionGroupId)
                .get();
            if (!cgProductSnap.empty) {
                const batch = db.batch();
                cgProductSnap.docs.forEach(doc => {
                    batch.update(doc.ref, { status: 3 });
                });
                await batch.commit();
            }
        }

        // בדיקה אם אין עוד orderProducts עם אותו orderId וסטטוס 2
        const orderProductsCountSnap = await db.collection('orderProducts')
            .where('orderId', '==', orderId)
            .where('status', '==', 2)
            .count()
            .get();
        if (orderProductsCountSnap.data().count === 0) {
            // עדכון סטטוס ההזמנה ל-3 (מוכנה)
            await db.collection('orders').doc(orderId).update({ orderStatus: 3 });
        }
    }

    if (before.status !== after.status && after.collectionGroupId) {
        console.log(`Status changed from ${before.status} to ${after.status} for orderProduct in collectionGroup: ${after.collectionGroupId}`);

        const collectionGroup = await db.collection('collectionsGroups').doc(after.collectionGroupId).get();
        if (!collectionGroup.exists) {
            console.log(`CollectionGroup ${after.collectionGroupId} not found`);
            return;
        }
        const collectionGroupData = collectionGroup.data();

        console.log(`CollectionGroup current status: ${collectionGroupData.status}`);

        // נעדכן את הסטטוס של הקבוצה אם צריך
        if (collectionGroupData.status !== 2) {
            console.log(`CollectionGroup status is not 2, skipping update`);
            return;
        }

        const countSnap = await db.collection('orderProducts')
            .where('collectionGroupId', '==', after.collectionGroupId)
            .where('status', '==', 2)
            .count()
            .get();

        const remainingCount = countSnap.data().count;
        console.log(`Remaining orderProducts with status 2 in collectionGroup ${after.collectionGroupId}: ${remainingCount}`);

        if (remainingCount !== 0) {
            console.log(`Still have ${remainingCount} orderProducts with status 2, not updating collectionGroup`);
            return;
        }

        const batch = db.batch();
        const collectionGroupProducts = await db.collection('collectionGroupProducts')
            .where('collectionGroupId', '==', after.collectionGroupId)
            .where('status', '!=', 3)
            .get();

        console.log(`Found ${collectionGroupProducts.docs.length} collectionGroupProducts to update:`, collectionGroupProducts.docs.map(doc => doc.id));

        // collectionGroupProducts.forEach(doc => {
        //     batch.update(doc.ref, { status: 3 });
        // });

        batch.update(db.collection('collectionsGroups').doc(after.collectionGroupId), {
            status: 3,
            updatedAt: Timestamp.now()
        });
        console.log(`Updating collectionGroup ${after.collectionGroupId} status to 3`);

        await batch.commit();
        console.log(`Successfully updated collectionGroup ${after.collectionGroupId} to status 3`);
    }
});

//כשההזמנה מגיעה ליעד
const onOrderStatusChangeTo5 = onDocumentUpdated("orders/{orderId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (!before || !after) return;

    const phones = Array.isArray(after.phones) ? after.phones : [];
    // נבדוק אם הסטטוס השתנה ל-5
    if (before.orderStatus !== 5 && after.orderStatus === 5 && after.isSentTzintuk != false) {
        if (phones.length > 0) {
            console.log("Sending IVR message to phones:", phones);
            await yemotRequest("CallExtensionBridging", {
                phones: phones,
                ivrPath: "ivr2:/system/orders",
            })

            //update isSentTzintuk
            await db.collection('orders').doc(event.data.after.id).update({
                isSentTzintuk: true,
                sentTzintukAt: Timestamp.now()
            });
        }
    }
    //שליחת צינתוק מוצרים חסרים
    if (!before.isMissingSendTzintuk && after.isMissingSendTzintuk) {
        if (phones.length > 0) {
            console.log("Sending IVR message to phones:", phones);
            await yemotRequest("CallExtensionBridging", {
                phones: phones,
                ivrPath: "ivr2:/system/miss",
            })

            //update isSentTzintuk
            await db.collection('orders').doc(event.data.after.id).update({
                isSentTzintuk: true,
                sentTzintukAt: Timestamp.now()
            });
        }
    }
})

module.exports = {
    newChalukaMessage,
    onOrderProductStatusChange,
    onOrderStatusChangeTo5
};