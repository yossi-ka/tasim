const { onRequest } = require("firebase-functions/v2/https");
const { fixText, isDST, uploadFileBufferToStorage, createSTT } = require("../utils");
const { db } = require("../firebase-config");
const { Timestamp } = require("firebase-admin/firestore");
const { removeFromList } = require("./services");
const { yemotRequest } = require("../api");
const uuid = require("uuid").v4;



/**
 * פונקציית Firebase onRequest לקבלת הודעות עבור ימות המשיח
 * מקבלת טלפון ומחזירה הודעות שלא נקראו במפורמט של ימות המשיח
 */
const getMessagesForYemot = onRequest(async (req, res) => {

    try {
        // קבלת פרמטר הטלפון
        const apiPhone = req.query.ApiPhone;

        if (!apiPhone) {
            return res.send('id_list_message=טלפון לא מזוהה.');
        }

        console.log(`קבלת בקשה עבור טלפון: ${apiPhone}`);

        // חיפוש שיחה לפי טלפון
        let conversation = await findConversationByPhone(apiPhone);

        // TODO: בהמשך להוסיף חיפוש לפי לקוח
        // if (!conversation) {
        //     conversation = await findConversationByCustomerId(customerId);
        // }

        // בדיקה אם קיימת שיחה
        if (!conversation) {
            console.log(`לא נמצאה שיחה עבור טלפון: ${apiPhone}`);
            return res.send('id_list_message=אין הודעה להשמעה.');
        }

        console.log(`נמצאה שיחה: ${conversation.id}`);

        // קבלת הודעות שלא נקראו מהמערכת
        const messages = await getSystemMessages(conversation.id);

        if (!messages || messages.length === 0) {
            return res.send('id_list_message=אין הודעה להשמעה.');
        }

        let resText = ""
        const amountOfUnreadMessages = conversation.unreadCountByUser || 0;
        if (amountOfUnreadMessages > 0) {
            resText += `t-יש.n-${amountOfUnreadMessages}.t-הודעות שלא נקראו.`;
        }

        // הכנת פורמט ימות המשיח
        resText += formatMessagesForYemot(messages);

        // החזרת תוצאה ללקוח מיד
        const response = "id_list_message=" + resText + "m-1005.";
        res.send(response);

        // ביצוע פעולות ברקע ללא חסימה
        updateConversationInBackground(conversation.id, apiPhone).catch(error => {
            console.error('שגיאה בעדכון שיחה ברקע:', error);
        });

        return;

    } catch (error) {
        console.error('שגיאה בפונקציית getMessagesForYemot:', error);
        return res.status(500).json({
            error: 'שגיאה פנימית בשרת',
            details: error.message
        });
    }
});

const addMessageFromYemot = onRequest(async (req, res) => {
    const { Phone, Booking } = req.query;

    // בדיקה בסיסית ותגובה מיידית
    if (!Phone || !Booking) {
        return res.status(400).send({
            status: "error",
            message: "Phone and Booking parameters are required"
        });
    }

    // שליחת תגובה מיידית למשתמש
    res.status(200).send({
        status: "success",
        message: "הבקשה התקבלה ומתעבדת"
    });

    // עיבוד אסינכרוני ברקע
    processVoiceMessage(Phone, Booking).catch(error => {
        console.error('שגיאה בעיבוד הודעה קולית ברקע:', error);
    });
})



const getOrdersForYemot = onRequest(async (req, res) => {
    const { ApiPhone, isOnlyLast, isOnlyMiss } = req.query;
    if (!ApiPhone) {
        return res.status(400).send({
            status: "error",
            message: "ApiPhone parameter is required"
        });
    }
    try {
        const getLastOrders = await db.collection('orders')
            .where('phones', 'array-contains', ApiPhone)
            .where('isSentTzintuk', '==', true)
            .orderBy('sentTzintukAt', 'desc')
            .limit(isOnlyLast ? 1 : 5)
            .get();

        if (getLastOrders.empty) {
            return res.send('id_list_message=אין נתונים להשמעה.');
        }

        const ids = getLastOrders.docs.map(doc => doc.id);
        console.log(`נמצאו ${ids.length} הזמנות עבור הטלפון: ${ApiPhone}`);
        const orderMissProducts = await db.collection('orderProducts')
            .where('orderId', 'in', ids)
            .where('status', '==', 4)
            .get();

        const missedProducts = orderMissProducts.docs.map(doc => doc.data());

        const mappedProducts = missedProducts.reduce((acc, product) => {
            const orderId = product.orderId;
            if (!acc[orderId]) acc[orderId] = [];
            acc[orderId].push(product);
            return acc;
        }, {});

        const orders = getLastOrders.docs.map(doc => {
            const orderData = doc.data();
            const orderId = doc.id;
            const products = mappedProducts[orderId] || [];
            return {
                ...orderData,
                products: products,
            }
        })

        if (isOnlyLast) {
            const formattedLastOrder = formatLastOrderForYemot(orders[0]);
            return res.send(`id_list_message=${formattedLastOrder}`);
        }

        if (isOnlyMiss) {
            const formattedMissedProducts = formatMissedProductsForYemot(orders[0]);
            return res.send(`id_list_message=${formattedMissedProducts}`);
        }

        const formattedOrders = formatOrdersForYemot(orders);
        return res.send(`id_list_message=${formattedOrders}`);


    } catch (error) {
        console.error('שגיאה בפונקציית getOrdersForYemot:', error);
        return res.status(500).json({
            error: 'שגיאה פנימית בשרת',
            details: error.message
        });
    }
})



// פונקציה נפרדת לעיבוד ההודעה ברקע
async function processVoiceMessage(Phone, Booking) {
    try {
        const fileName = Booking + ".wav";
        console.log(`[BACKGROUND] מנסה להוריד קובץ: ${fileName} עבור טלפון: ${Phone}`);

        const fileData = await yemotRequest("DownloadFile", `path=ivr2:voicemail/${fileName}`);
        console.log('[BACKGROUND] תגובה מ-yemotRequest:', typeof fileData);

        // בדיקה אם התשובה מכילה שגיאה
        if (fileData && fileData.success === false) {
            throw new Error(`שגיאה בהורדת הקובץ: ${fileData.message || 'לא ידוע'}`);
        }

        // המרת ArrayBuffer ל-Buffer
        const fileBuffer = Buffer.from(fileData, 'binary');
        const id = uuid();
        const destination = `voicemail/${id}.wav`;

        console.log(`[BACKGROUND] מנסה להעלות קובץ ליעד: ${destination}`);
        const result = await uploadFileBufferToStorage(fileBuffer, destination);
        if (result.success === false) {
            throw new Error(`שגיאה בהעלאת קובץ: ${result.message}`);
        }

        console.log(`[BACKGROUND] הקובץ ${fileName} הועלה בהצלחה ליעד: ${destination}`);

        let conversationId = "";
        // מציאת שיחה לפי הטלפון
        let conversation = await findConversationByPhone(Phone);
        if (!conversation) {
            // יצירת שיחה חדשה אם לא קיימת
            const customer = await findCustomerByPhone(Phone);
            const customerName = customer ? ((customer.lastName || "") + " " + (customer.firstName || "")) : null;
            conversation = await db.collection('conversations').add({
                customerId: "",
                phone: Phone,
                customerName: customerName,
                lastMessageTime: Timestamp.now(),
                lastMessage: null,
                lastReadBySystem: "",
                lastReadByUser: "",
                unreadCountBySystem: 0,
                unreadCountByUser: 0,
                hasPendingMessages: false,
                isActive: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            conversationId = conversation.id;
            console.log(`[BACKGROUND] שיחה חדשה נוצרה עבור טלפון: ${Phone}`);
        } else {
            conversationId = conversation.id;
            console.log(`[BACKGROUND] שיחה קיימת נמצאה עבור טלפון: ${Phone}`);
        }

        // const transcription = await createSTT(fileBuffer)
        // console.log(`[BACKGROUND] תמלול הושלם עבור קובץ: ${fileName}`);
        // console.log(transcription);
        // יצירת הודעה חדשה
        const messageData = {
            conversationId: conversationId,
            role: "user",
            message: "הודעה קולית",
            fileId: id,
            fileType: "audio",
            fileName: fileName,
            filePath: destination,
            fileSize: fileBuffer.length,
            transcription: "",
            isForFollowUp: false,
            tags: [],
            timestamp: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        // הוספת הודעה למסד הנתונים
        await db.collection('messages').add(messageData);
        console.log(`[BACKGROUND] הודעה חדשה נוספה לשיחה ${conversationId} עבור טלפון: ${Phone} - קובץ: ${fileName}`);

    } catch (error) {
        console.error(`[BACKGROUND ERROR] שגיאה בעיבוד הודעה קולית עבור טלפון ${Phone}, קובץ ${Booking}:`, error);
        // כאן אפשר להוסיף לוגיקה נוספת כמו שליחת התראה או שמירה בטבלת שגיאות
    }
}

/**
 * חיפוש שיחה לפי מספר טלפון
 */
async function findConversationByPhone(phone) {
    try {
        const conversationsRef = db.collection('conversations');
        const q = conversationsRef
            .where('phone', '==', phone)
            // .where('isActive', '==', true)
            .limit(1);

        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('שגיאה בחיפוש שיחה לפי טלפון:', error);
        throw error;
    }
}

async function findCustomerByPhone(phone) {
    try {
        const customersRef = db.collection('customers');
        const q = customersRef
            .where('phone', 'array-contains', phone)
            .limit(1);

        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('שגיאה בחיפוש לקוח לפי טלפון:', error);
    }
}

/**
 * קבלת הודעות שלא נקראו מהמערכת
 */
async function getSystemMessages(conversationId) {
    try {
        const messagesRef = db.collection('messages');

        // קבלת השיחה כדי לדעת מה ההודעה האחרונה שנקראה
        const conversationDoc = await db.collection('conversations').doc(conversationId).get();
        const conversation = conversationDoc.data();

        let query = messagesRef
            .where('conversationId', '==', conversationId)
            .where('role', '==', 'system') // רק הודעות מהמערכת
            .orderBy('timestamp', 'desc')
            .limit(20);

        // אם יש הודעה אחרונה שנקראה ע"י המשתמש, נביא רק הודעות אחריה
        if (conversation.lastReadByUser) {
            // TODO: הוסף לוגיקה לסינון הודעות שלא נקראו
            // query = query.where('timestamp', '>', lastReadTimestamp);
        }

        const querySnapshot = await query.get();

        const messages = [];
        querySnapshot.forEach(doc => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return messages;

    } catch (error) {
        console.error('שגיאה בקבלת הודעות שלא נקראו:', error);
        throw error;
    }
}

/**
 * עיצוב הודעות בפורמט של ימות המשיח
 */
function formatMessagesForYemot(messages) {

    const formattedMessages = messages.map(msg => {
        const dateText = msg.timestamp ? formatDate(msg.timestamp) : '';
        return `${dateText}t-${fixText(msg.message)}.`;
    });

    return formattedMessages.join("m-1006.");
}

function formatOrdersForYemot(orders) {

    const formattedOrders = orders.map(order => {

        const isMiss = order.products.length > 0;

        const orderDate = order.sentTzintukAt ? formatDate(order.sentTzintukAt) : '';

        // הזמנהה ללא מוצרים חסרים מוכנה
        if (!isMiss) {
            return `f-m105.n-${order.nbsOrderId}.f-106.${orderDate}.`;
        }

        const products = order.products.map(product => {
            const name = product.productName.replace(/\([^)]+\)/, '').trim();
            return `t-${fixText(name)}.`
        }).join("f-107.");

        //הזמנה עם מוצרים חסרים מוכנה
        if (order.status === 5) {
            return `f-m105.n-${order.nbsOrderId}.f-m106.${orderDate}.f-m103.${products}f-m108.`;
        } else {
            return `f-m105.n-${order.nbsOrderId}.f-m109.${products}f-m104.`;
        }

        // return `f-m105.n-${order.nbsOrderId}.n-${orderDate}.n-${productsText}`;
    });

    return formattedOrders.join("m-1006.");
}

function formatLastOrderForYemot(order) {
    return `f-m100.n-${order.nbsOrderId}.f-m101.g-hangup.`
}

function formatMissedProductsForYemot(order) {
    const products = order.products.map(product => {
        const name = product.productName.replace(/\([^)]+\)/, '').trim();
        return `t-${fixText(name)}.`
    }).join("f-m107.");
    return `f-m102.n-${order.nbsOrderId}.f-m103.${products}f-m104.g-hangup.`
}



function formatDate(firebaseTimestamp) {
    const dateObj = firebaseTimestamp.toDate ? firebaseTimestamp.toDate() : new Date(firebaseTimestamp);
    const now = new Date();
    const msgDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let ilHour = dateObj.getHours() + 2;
    //שעון קיץ
    if (isDST(dateObj)) ilHour = ilHour + 1;

    if (ilHour > 23) ilHour = ilHour - 24;

    const hours = ilHour.toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const timeStr = `t-בשעה.n-${hours}.n-${minutes}.`;

    if (msgDate.getTime() === today.getTime()) {
        return `t-היום.${timeStr}`;
    } else if (msgDate.getTime() === yesterday.getTime()) {
        return `t-אתמול.${timeStr}`;
    } else {
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `t-בתאריך.date-${day}/${month}/${year}.${timeStr}`;
    }
}

// TODO: פונקציה לחיפוש שיחה לפי מזהה לקוח (להוסיף בהמשך)
// async function findConversationByCustomerId(customerId) {
//     try {
//         const conversationsRef = db.collection('conversations');
//         const q = conversationsRef
//             .where('customerId', '==', customerId)
//             .where('isActive', '==', true)
//             .limit(1);
//
//         const querySnapshot = await q.get();
//
//         if (querySnapshot.empty) {
//             return null;
//         }
//
//         const doc = querySnapshot.docs[0];
//         return {
//             id: doc.id,
//             ...doc.data()
//         };
//     } catch (error) {
//         console.error('שגיאה בחיפוש שיחה לפי לקוח:', error);
//         throw error;
//     }
// }

// פונקציה לעדכון שיחה ברקע
async function updateConversationInBackground(conversationId, apiPhone) {
    try {
        await db.collection('conversations').doc(conversationId).update({
            lastReadByUser: Timestamp.now(),
            unreadCountByUser: 0, // איפוס ספירת הודעות שלא נקראו
        });

        await removeFromList(apiPhone);

        console.log(`עדכון שיחה ברקע הושלם בהצלחה עבור: ${conversationId}`);
    } catch (error) {
        console.error('שגיאה בעדכון שיחה ברקע:', error);
        throw error;
    }
}

module.exports = {
    getMessagesForYemot,
    addMessageFromYemot,
    getOrdersForYemot
};
