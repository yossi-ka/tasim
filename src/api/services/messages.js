import { db } from '../../firebase-config'
import { 
    addDoc, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    orderBy, 
    query, 
    Timestamp, 
    updateDoc, 
    where, 
    writeBatch,
    limit,
    startAfter
} from "firebase/firestore";

// ========================================
// פונקציות עבור הודעות (Messages)
// ========================================

/**
 * קבלת הודעות בשיחה
 */
export const getMessagesByConversation = async (conversationId, limitCount = 50) => {
    const messagesRef = collection(db, "messages");
    const q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc"),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * קבלת הודעות ישנות יותר (עבור pagination)
 */
export const getOlderMessages = async (conversationId, lastMessage, limitCount = 20) => {
    const messagesRef = collection(db, "messages");
    const q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "desc"),
        startAfter(lastMessage.timestamp),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
}

/**
 * הוספת הודעה חדשה
 */
export const addMessage = async (messageData) => {
    const docRef = await addDoc(collection(db, 'messages'), {
        conversationId: messageData.conversationId,
        role: messageData.role, // "user" או "system"
        message: messageData.message,
        fileId: messageData.fileId || "",
        fileType: messageData.fileType || "",
        fileName: messageData.fileName || "",
        fileSize: messageData.fileSize || "",
        transcription: messageData.transcription || "",
        isForFollowUp: messageData.isForFollowUp || false,
        tags: messageData.tags || [],
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    
    const newMessage = { 
        id: docRef.id, 
        ...messageData, 
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
    
    return newMessage;
}

/**
 * עדכון שיחה כנקראה על ידי המערכת
 */
export const markConversationAsReadBySystem = async (conversationId, lastMessageId) => {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        lastReadBySystem: lastMessageId,
        unreadCountBySystem: 0,
        updatedAt: Timestamp.now()
    });
    return { conversationId, lastReadBySystem: lastMessageId };
};

/**
 * עדכון שיחה כנקראה על ידי המשתמש
 */
export const markConversationAsReadByUser = async (conversationId, lastMessageId) => {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        lastReadByUser: lastMessageId,
        unreadCountByUser: 0,
        updatedAt: Timestamp.now()
    });
    return { conversationId, lastReadByUser: lastMessageId };
};

// ========================================
// פונקציות עבור תמלול (Transcription)
// ========================================

/**
 * עדכון תמלול הודעה
 */
export const updateMessageTranscription = async (messageId, transcription) => {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
        transcription,
        updatedAt: Timestamp.now()
    });
    return { messageId, transcription };
}

// ========================================
// פונקציות עבור תיוג הודעות (Message Tags)
// ========================================

/**
 * הוספת תגיות להודעה
 */
export const addMessageTags = async (messageId, tags) => {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
        tags: Array.isArray(tags) ? tags : [tags],
        updatedAt: Timestamp.now()
    });
    return { messageId, tags };
}

/**
 * הסרת תגיות מהודעה
 */
export const removeMessageTags = async (messageId, tagsToRemove) => {
    const messageDoc = await getDoc(doc(db, 'messages', messageId));
    if (!messageDoc.exists()) {
        throw new Error("Message not found!");
    }
    
    const currentTags = messageDoc.data().tags || [];
    const updatedTags = currentTags.filter(tag => !tagsToRemove.includes(tag));
    
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
        tags: updatedTags,
        updatedAt: Timestamp.now()
    });
    
    return { messageId, tags: updatedTags };
}

// ========================================
// פונקציות עבור סימון לטיפול בהמשך (Follow-up)
// ========================================

/**
 * סימון הודעה לטיפול בהמשך
 */
export const markMessageForFollowUp = async (messageId) => {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
        isForFollowUp: true,
        updatedAt: Timestamp.now()
    });
    
    return { messageId, isForFollowUp: true };
}

/**
 * ביטול סימון הודעה לטיפול בהמשך
 */
export const unmarkMessageForFollowUp = async (messageId) => {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
        isForFollowUp: false,
        updatedAt: Timestamp.now()
    });
    
    return { messageId, isForFollowUp: false };
}

/**
 * עדכון סטטוס הודעה לטיפול בהמשך
 */
export const updateMessageForFollowUp = async (messageId, isForFollowUp) => {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
        isForFollowUp,
        updatedAt: Timestamp.now()
    });
    
    return { messageId, isForFollowUp };
}

/**
 * קבלת הודעות המסומנות לטיפול בהמשך
 */
export const getPendingMessages = async (conversationId = null) => {
    const messagesRef = collection(db, "messages");
    let q;
    
    if (conversationId) {
        // הודעות לטיפול בשיחה ספציפית
        q = query(
            messagesRef,
            where("conversationId", "==", conversationId),
            where("isForFollowUp", "==", true),
            orderBy("timestamp", "asc")
        );
    } else {
        // כל ההודעות לטיפול
        q = query(
            messagesRef,
            where("isForFollowUp", "==", true),
            orderBy("timestamp", "desc")
        );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ========================================
// פונקציות עזר לעדכון שיחות
// ========================================

/**
 * עדכון שיחה עם הודעה חדשה וחישוב הודעות לא נקראות
 */
export const updateConversationWithNewMessage = async (conversationId, newMessage) => {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
        throw new Error("Conversation not found!");
    }
    
    const conversation = conversationDoc.data();
    
    // חישוב הודעות לא נקראות
    let unreadCountBySystem = conversation.unreadCountBySystem || 0;
    let unreadCountByUser = conversation.unreadCountByUser || 0;
    
    if (newMessage.role === 'user') {
        unreadCountBySystem += 1;
    } else if (newMessage.role === 'system') {
        unreadCountByUser += 1;
    }
    
    // בדיקה אם יש הודעות לטיפול בהמשך
    const messagesRef = collection(db, "messages");
    const pendingQuery = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        where("isForFollowUp", "==", true)
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    const hasPendingMessages = pendingSnapshot.size > 0;
    
    // עדכון השיחה
    await updateDoc(conversationRef, {
        lastMessage: newMessage,
        lastMessageTime: newMessage.timestamp,
        unreadCountBySystem,
        unreadCountByUser,
        hasPendingMessages,
        updatedAt: Timestamp.now()
    });
    
    return { conversationId, unreadCountBySystem, unreadCountByUser, hasPendingMessages };
};

/**
 * חישוב מחדש של הודעות לא נקראות לשיחה
 */
export const recalculateUnreadCount = async (conversationId) => {
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (!conversationDoc.exists()) {
        throw new Error("Conversation not found!");
    }
    
    const conversation = conversationDoc.data();
    const messagesRef = collection(db, "messages");
    
    // ספירת הודעות משתמש שלא נקראו במערכת
    let unreadBySystemQuery;
    if (conversation.lastReadBySystem) {
        unreadBySystemQuery = query(
            messagesRef,
            where("conversationId", "==", conversationId),
            where("role", "==", "user"),
            where("timestamp", ">", conversation.lastReadBySystem)
        );
    } else {
        unreadBySystemQuery = query(
            messagesRef,
            where("conversationId", "==", conversationId),
            where("role", "==", "user")
        );
    }
    
    // ספירת הודעות מערכת שלא נקראו במשתמש
    let unreadByUserQuery;
    if (conversation.lastReadByUser) {
        unreadByUserQuery = query(
            messagesRef,
            where("conversationId", "==", conversationId),
            where("role", "==", "system"),
            where("timestamp", ">", conversation.lastReadByUser)
        );
    } else {
        unreadByUserQuery = query(
            messagesRef,
            where("conversationId", "==", conversationId),
            where("role", "==", "system")
        );
    }
    
    const [unreadBySystemSnapshot, unreadByUserSnapshot] = await Promise.all([
        getDocs(unreadBySystemQuery),
        getDocs(unreadByUserQuery)
    ]);
    
    const unreadCountBySystem = unreadBySystemSnapshot.size;
    const unreadCountByUser = unreadByUserSnapshot.size;
    
    // עדכון השיחה
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        unreadCountBySystem,
        unreadCountByUser,
        updatedAt: Timestamp.now()
    });
    
    return { conversationId, unreadCountBySystem, unreadCountByUser };
};
