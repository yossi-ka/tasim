const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { db } = require("../firebase-config");

/**
 * תהליך רקע שרץ כשנוצרת הודעה חדשה
 * מעדכן את פרטי השיחה ומנהל מונים של הודעות שלא נקראו
 */
const onMessageCreated = onDocumentCreated("messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const messageData = snapshot.data();
    const messageId = event.params.messageId;

    console.log(`תהליך רקע: נוצרה הודעה חדשה ${messageId}`);

    try {
        // הרצת טרנזקציה לעדכון השיחה
        await db.runTransaction(async (transaction) => {
            await updateConversationOnNewMessage(transaction, messageData, messageId);
        });

        console.log(`עדכון השיחה הושלם בהצלחה עבור הודעה ${messageId}`);

    } catch (error) {
        console.error(`שגיאה בעדכון השיחה עבור הודעה ${messageId}:`, error);
        throw error;
    }
});

/**
 * תהליך רקע שרץ כשהודעה מתעדכנת
 * מטפל בעדכונים כמו סימון לטיפול בהמשך
 */
const onMessageUpdated = onDocumentUpdated("messages/{messageId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const messageId = event.params.messageId;

    console.log(`תהליך רקע: הודעה ${messageId} עודכנה`);

    try {
        // בדיקה אם השתנה הסטטוס של טיפול בהמשך
        if (beforeData.isForFollowUp !== afterData.isForFollowUp) {
            await updateConversationPendingStatus(afterData.conversationId);
        }

    } catch (error) {
        console.error(`שגיאה בעדכון השיחה עבור הודעה מעודכנת ${messageId}:`, error);
    }
});

/**
 * עדכון השיחה בעקבות הודעה חדשה - בתוך טרנזקציה
 */
async function updateConversationOnNewMessage(transaction, messageData, messageId) {
    const { conversationId, role, message, timestamp, fileType, fileName } = messageData;

    // בדיקה אם השיחה קיימת
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await transaction.get(conversationRef);

    let conversationData;
    let isNewConversation = false;

    if (!conversationDoc.exists) {
        // יצירת שיחה חדשה אם לא קיימת
        console.log(`יצירת שיחה חדשה: ${conversationId}`);
        
        conversationData = await createNewConversation(messageData);
        isNewConversation = true;
    } else {
        // קבלת נתוני השיחה הקיימת
        conversationData = conversationDoc.data();
    }

    // חישוב עדכונים למונים של הודעות שלא נקראו
    const updates = calculateUnreadUpdates(conversationData, role);

    // הכנת ההודעה האחרונה להצגה
    const lastMessage = {
        id: messageId,
        message: message || (fileType === 'audio' ? 'הקלטה קולית' : 'קובץ'),
        role: role,
        timestamp: timestamp,
        fileType: fileType || '',
        fileName: fileName || ''
    };

    // עדכון השיחה
    const conversationUpdate = {
        lastMessageTime: timestamp,
        lastMessage: lastMessage,
        updatedAt: new Date(),
        ...updates
    };

    // בדיקה אם יש הודעות לטיפול בהמשך
    if (messageData.isForFollowUp) {
        conversationUpdate.hasPendingMessages = true;
    }

    if (isNewConversation) {
        // יצירת שיחה חדשה
        transaction.set(conversationRef, {
            ...conversationData,
            ...conversationUpdate
        });
    } else {
        // עדכון שיחה קיימת
        transaction.update(conversationRef, conversationUpdate);
    }

    console.log(`עדכון השיחה ${conversationId}:`, conversationUpdate);
}

/**
 * יצירת שיחה חדשה בהתבסס על נתוני ההודעה
 */
async function createNewConversation(messageData) {
    const { conversationId } = messageData;
    
    // ניסיון לקבל פרטים נוספים על הלקוח לפי הטלפון (אם יש)
    // TODO: להוסיף לוגיקה לחיפוש פרטי לקוח במערכת
    
    return {
        id: conversationId,
        customerId: "", // יעודכן בהמשך כשיהיה מידע על הלקוח
        phone: "", // יעודכן לפי הצורך
        customerName: "", // יעודכן לפי הצורך
        lastReadBySystem: "",
        lastReadByUser: "",
        unreadCountBySystem: 0,
        unreadCountByUser: 0,
        hasPendingMessages: false,
        isActive: true,
        createdAt: new Date()
    };
}

/**
 * חישוב עדכונים למונים של הודעות שלא נקראו
 */
function calculateUnreadUpdates(conversationData, messageRole) {
    const updates = {};

    if (messageRole === 'user') {
        // הודעה מהמשתמש - העלאת מונה הודעות שלא נקראו מהמערכת
        updates.unreadCountBySystem = (conversationData.unreadCountBySystem || 0) + 1;
    } else if (messageRole === 'system') {
        // הודעה מהמערכת - העלאת מונה הודעות שלא נקראו מהמשתמש
        updates.unreadCountByUser = (conversationData.unreadCountByUser || 0) + 1;
    }

    return updates;
}

/**
 * עדכון סטטוס הודעות לטיפול בהמשך בשיחה
 */
async function updateConversationPendingStatus(conversationId) {
    const messagesRef = db.collection('messages');
    const q = messagesRef
        .where('conversationId', '==', conversationId)
        .where('isForFollowUp', '==', true)
        .limit(1);

    const querySnapshot = await q.get();
    const hasPendingMessages = !querySnapshot.empty;

    // עדכון השיחה
    const conversationRef = db.collection('conversations').doc(conversationId);
    await conversationRef.update({
        hasPendingMessages: hasPendingMessages,
        updatedAt: new Date()
    });

    console.log(`עדכון סטטוס הודעות לטיפול בשיחה ${conversationId}: ${hasPendingMessages}`);
}

module.exports = {
    onMessageCreated,
    onMessageUpdated
};
