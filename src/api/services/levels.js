
import { db } from '../../firebase-config'
import { getDocs, query, collection, orderBy } from 'firebase/firestore'

export const getLevels = async () => {

    const q = query(collection(db, 'levels'))
    const data = await getDocs(q)
    return data.docs.map(d => ({
        ...d.data(),
        id: d.id,
    }))
}
