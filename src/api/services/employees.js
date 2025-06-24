import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";


export const getAllemployees = async () => {
    const employeesRef = collection(db, "employees");
    const q = query(employeesRef, orderBy("lastName"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


export const addEmployee = async (data, userId) => {
    const docRef = await addDoc(collection(db, 'employees'), {
        ...data,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data }
}

export const updateEmployee = async (id, data, userId) => {
    const docRef = doc(db, 'employees', id);
    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });

    return { id, ...data }
}

/*
export const addSapak = async (data, userId) => {
    const docRef = await addDoc(collection(db, 'sapakim'), {
        ...data,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data }
}

export const updateSapak = async (id, data, userId) => {
    const docRef = doc(db, 'sapakim', id);
    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });

    return { id, ...data }
}
*/