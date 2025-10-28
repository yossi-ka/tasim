import { db } from '../../firebase-config'
import { getDocs, query, collection, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'

// קבלת כל המכשירים
export const getAllDevices = async () => {
    try {
        const q = query(collection(db, 'devices'), orderBy("name"));
        const querySnapshot = await getDocs(q);

        const result = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return result;

    } catch (error) {
        console.error("Error getting devices:", error);
        throw error;
    }
};

// הוספת מכשיר חדש
export const addDevice = async (deviceData) => {
    try {
        const docRef = await addDoc(collection(db, 'devices'), {
            ...deviceData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            status: 1
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding device:", error);
        throw error;
    }
};

// עדכון מכשיר
export const updateDevice = async (deviceId, deviceData) => {
    try {
        const deviceRef = doc(db, 'devices', deviceId);
        await updateDoc(deviceRef, {
            ...deviceData,
            updatedAt: Timestamp.now()
        });

        return deviceId;
    } catch (error) {
        console.error("Error updating device:", error);
        throw error;
    }
};
