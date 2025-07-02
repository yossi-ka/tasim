import { db } from '../../firebase-config'
import { 
    addDoc,
    collection, 
    doc,
    getDoc,
    getDocs, 
    orderBy, 
    query, 
    where,
    Timestamp,
    updateDoc,
    getCountFromServer,
    sum,
    getAggregateFromServer
} from "firebase/firestore";

// ========================================
// פונקציות עבור שיחות (Conversations)
// ========================================

/**
 * קבלת כל השיחות הפעילות מסודרות לפי הודעה אחרונה
 */
export const getAllConversations = async () => {
    const conversationsRef = collection(db, "conversations");
    const q = query(
        conversationsRef, 
        where("isActive", "==", true),
        orderBy("lastMessageTime", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * קבלת שיחות עם הודעות לטיפול בהמשך
 */
export const getConversationsWithPendingMessages = async () => {
    const conversationsRef = collection(db, "conversations");
    const q = query(
        conversationsRef, 
        where("isActive", "==", true),
        where("hasPendingMessages", "==", true),
        orderBy("lastMessageTime", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * קבלת שיחה לפי מזהה
 */
export const getConversationById = async (id) => {
    const docRef = doc(db, 'conversations', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("Conversation not found!");
    }
};

/**
 * יצירת שיחה חדשה
 */
export const createConversation = async (data) => {
    const docRef = await addDoc(collection(db, 'conversations'), {
        customerId: data.customerId || "",
        phone: data.phone || "",
        customerName: data.customerName || "",
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
    return { id: docRef.id, ...data };
};

/**
 * עדכון פרטי שיחה
 */
export const updateConversation = async (id, data) => {
    const docRef = doc(db, 'conversations', id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
    return { id, ...data };
};

/**
 * חיפוש שיחה לפי מזהה לקוח או טלפון
 */
export const findConversationByCustomerOrPhone = async (customerId, phone) => {
    const conversationsRef = collection(db, "conversations");
    let q;
    
    if (customerId) {
        // חיפוש לפי מזהה לקוח
        q = query(
            conversationsRef, 
            where("customerId", "==", customerId),
            where("isActive", "==", true)
        );
    } else if (phone) {
        // חיפוש לפי טלפון (רק אם אין מזהה לקוח)
        q = query(
            conversationsRef, 
            where("phone", "==", phone),
            where("customerId", "==", ""),
            where("isActive", "==", true)
        );
    } else {
        return null;
    }
    
    const querySnapshot = await getDocs(q);
    const conversations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return conversations.length > 0 ? conversations[0] : null;
};

/**
 * יצירת או מציאת שיחה לפי פרטי לקוח
 */
export const findOrCreateConversation = async (customerId, phone, customerName) => {
    // חיפוש שיחה קיימת
    let conversation = await findConversationByCustomerOrPhone(customerId, phone);
    
    if (!conversation) {
        // יצירת שיחה חדשה
        const conversationData = {
            customerId: customerId || "",
            phone: phone || "",
            customerName: customerName || "",
        };
        
        conversation = await createConversation(conversationData);
    }
    
    return conversation;
};

// ========================================
// פונקציות זמניות למעבר הדרגתי
// ========================================

/**
 * נתונים זמניים לבדיקות - יוסרו כשהטבלה תהיה מוכנה
 */
export const getAllConversationsTemp = async () => {
    const tempConversations = [
        {
            id: "1",
            customerId: "cust_001",
            phone: "",
            customerName: 'יוסי כהן',
            lastMessageTime: Timestamp.now(),
            lastMessage: { id: "msg_1", message: 'שלום, איך אתה?', role: 'user', timestamp: Timestamp.now() },
            lastReadBySystem: "",
            lastReadByUser: "msg_1",
            unreadCountBySystem: 2,
            unreadCountByUser: 0,
            hasPendingMessages: true,
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        },
        {
            id: "2",
            customerId: "cust_002", 
            phone: "",
            customerName: 'מרים לוי',
            lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 86400000)),
            lastMessage: { id: "msg_2", message: 'תודה על העזרה', role: 'user', timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000)) },
            lastReadBySystem: "msg_2",
            lastReadByUser: "msg_2",
            unreadCountBySystem: 0,
            unreadCountByUser: 0,
            hasPendingMessages: false,
            isActive: true,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
            updatedAt: Timestamp.fromDate(new Date(Date.now() - 86400000))
        },
        {
            id: "3",
            customerId: "cust_003",
            phone: "",
            customerName: 'דוד ישראלי',
            lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 7200000)),
            lastMessage: { id: "msg_3", message: 'נשמח לקבל תשובה', role: 'user', timestamp: Timestamp.fromDate(new Date(Date.now() - 7200000)) },
            lastReadBySystem: "",
            lastReadByUser: "msg_3",
            unreadCountBySystem: 1,
            unreadCountByUser: 0,
            hasPendingMessages: true,
            isActive: true,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000)),
            updatedAt: Timestamp.fromDate(new Date(Date.now() - 7200000))
        },
        {
            id: "4",
            customerId: "",
            phone: "054-7777777",
            customerName: 'שרה אברהם',
            lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 259200000)),
            lastMessage: { id: "msg_4", message: 'הייתי בפגישה', role: 'user', timestamp: Timestamp.fromDate(new Date(Date.now() - 259200000)) },
            lastReadBySystem: "msg_4",
            lastReadByUser: "msg_4",
            unreadCountBySystem: 0,
            unreadCountByUser: 0,
            hasPendingMessages: false,
            isActive: true,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 259200000)),
            updatedAt: Timestamp.fromDate(new Date(Date.now() - 259200000))
        },
        {
            id: "5",
            customerId: "",
            phone: "055-9999999",
            customerName: 'מיכאל דוד',
            lastMessageTime: Timestamp.fromDate(new Date(Date.now() - 3600000)),
            lastMessage: { id: "msg_5", message: 'אנא צור קשר', role: 'user', timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000)) },
            lastReadBySystem: "",
            lastReadByUser: "msg_5",
            unreadCountBySystem: 3,
            unreadCountByUser: 0,
            hasPendingMessages: true,
            isActive: true,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000)),
            updatedAt: Timestamp.fromDate(new Date(Date.now() - 3600000))
        }
    ];
    
    return tempConversations.sort((a, b) => 
        b.lastMessageTime.toDate().getTime() - a.lastMessageTime.toDate().getTime()
    );
};

/**
 * פונקציה לקבלת שיחות עם הודעות לטיפול בהמשך - זמני
 */
export const getConversationsWithPendingMessagesTemp = async () => {
    const allConversations = await getAllConversationsTemp();
    return allConversations.filter(conv => conv.hasPendingMessages);
};

/**
 * קבלת מספר ההודעות הכולל ומספר ההודעות לטיפול
 */
export const getMessagesCounts = async () => {
    try {
        // ספירת הודעות לא נקראות - סכום של unreadCountBySystem מכל השיחות
        const conversationsRef = collection(db, "conversations");
        const activeConversationsQuery = query(
            conversationsRef,
            where("isActive", "==", true)
        );
        
        const unreadCountSnapshot = await getAggregateFromServer(activeConversationsQuery, {
            totalUnread: sum('unreadCountBySystem')
        });
        
        // ספירת הודעות לטיפול - מספר הודעות שמסומנות לטיפול
        const messagesRef = collection(db, "messages");
        const pendingMessagesQuery = query(
            messagesRef,
            where("isForFollowUp", "==", true)
        );
        const pendingMessagesSnapshot = await getCountFromServer(pendingMessagesQuery);
        
        return {
            messages: unreadCountSnapshot.data().totalUnread || 0,
            pending: pendingMessagesSnapshot.data().count || 0
        };
    } catch (error) {
        console.error('Error getting messages counts:', error);
        return {
            messages: 0,
            pending: 0
        };
    }
};
