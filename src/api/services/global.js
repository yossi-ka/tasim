import { db } from '../../firebase-config'
import { getDocs, query, collection, orderBy, where, updateDoc, doc, addDoc, Timestamp, getDoc } from 'firebase/firestore'


export const getLookupData = async () => {

    const employeesQ = query(collection(db, 'employees'), orderBy("lastName"));
    const employeesActiveQ = query(collection(db, 'employees'), where("isActive", "==", true), orderBy("lastName"));
    //collectionsGroupLines
    const collectionsGroupLinesQ = query(collection(db, 'collectionsGroupLines'), orderBy("name"));

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
        getDocs(collectionsGroupLinesQ).then((res) => convertFirebaseData(res, "name", "collectionsGroupLines", null)),
    ])

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