import { db } from '../../firebase-config'
import { getDocs, query, collection, orderBy, where, updateDoc, doc, addDoc, Timestamp, getDoc } from 'firebase/firestore'


export const getLookupData = async () => {

    const deviceModelsQ = query(collection(db, 'deviceModels'), orderBy("name"));

    const res = await Promise.all([
        getDocs(deviceModelsQ).then((res) => convertFirebaseData(res, "name", "deviceModels", null)),
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