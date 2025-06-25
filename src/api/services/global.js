import { db } from '../../firebase-config'
import { getDocs, query, collection, orderBy, where, updateDoc, doc, addDoc, Timestamp, getDoc } from 'firebase/firestore'


export const getLookupData = async () => {
    console.log("Fetching lookup data...");
    const employeesQ = query(collection(db, 'employees'), orderBy("lastName"));
    const employeesActiveQ = query(collection(db, 'employees'), where("isActive", "==", true), orderBy("lastName"));

    const res = await Promise.all([
        getDocs(employeesQ).then((res) => res.docs.map(d => {
            const data = d.data();
            return {
                code: d?.id,
                name: (data?.firstName || "") + " " + (data?.lastName || ""),
                tableCode: "employees",
                parentID: null
            }
        })),
        getDocs(employeesActiveQ).then((res) => res.docs.map(d => {
            const data = d.data();
            return {
                code: d?.id,
                name: (data?.firstName || "") + " " + (data?.lastName || ""),
                tableCode: "employeesActive",
                parentID: null
            }
        })),
    ])

    console.log("Lookup data fetched successfully", res);

    return res.reduce((acc, val) => acc.concat(val), []);

}

const convertFirebaseData = (res, nameKey, tableCode, parent = null) => {
    return res.docs.map(d => ({
        code: d?.id,
        name: d?.data()?.[nameKey],
        tableCode,
        parentID: parent ? d?.data()?.[parent] : null
    }));
}