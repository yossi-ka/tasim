const { onRequest } = require("firebase-functions/v2/https");
const { fixText } = require("../utils");
const { db } = require("../firebase-config");
const { Timestamp } = require("firebase-admin/firestore");


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

        await db.collection('conversations').doc(conversation.id).update({
            lastReadByUser: Timestamp.now(),
            unreadCountByUser: 0, // איפוס ספירת הודעות שלא נק
        });

        return res.send("id_list_message=" + resText);

    } catch (error) {
        console.error('שגיאה בפונקציית getMessagesForYemot:', error);
        return res.status(500).json({
            error: 'שגיאה פנימית בשרת',
            details: error.message
        });
    }
});

/**
 * חיפוש שיחה לפי מספר טלפון
 */
async function findConversationByPhone(phone) {
    try {
        const conversationsRef = db.collection('conversations');
        const q = conversationsRef
            .where('phone', '==', phone)
            .where('isActive', '==', true)
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

function formatDate(firebaseTimestamp) {
    const dateObj = firebaseTimestamp.toDate ? firebaseTimestamp.toDate() : new Date(firebaseTimestamp);
    const now = new Date();
    const msgDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const hours = dateObj.getHours().toString().padStart(2, '0');
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


module.exports = {
    getMessagesForYemot
};
