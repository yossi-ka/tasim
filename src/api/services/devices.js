import { db } from '../../firebase-config'
import { getDocs, query, collection, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'

// קבלת כל המכשירים
export const getAllDevices = async () => {
    try {
        const q = query(collection(db, 'devices'), orderBy("sheetsId"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
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
            statusId: 'HtNkG0cT6i9RZATzL95d'
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

// מחיקת מכשיר
export const deleteDevice = async (deviceId) => {
    try {
        const deviceRef = doc(db, 'devices', deviceId);
        await deleteDoc(deviceRef);

        return deviceId;
    } catch (error) {
        console.error("Error deleting device:", error);
        throw error;
    }
};