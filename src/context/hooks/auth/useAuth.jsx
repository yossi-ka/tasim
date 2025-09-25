import React, { useState } from 'react'

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase-config';

const useAuth = () => {
    const auth = getAuth();

    const [user, setUser] = useState('loading');

    const restartUser = (user) => {
        console.log(user, "restartUser")
        if (user) return setUser(user)
        setUser('loading')
    }

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                const q = query(collection(db, 'users'), where('email', '==', u.email))
                const fullData = await (getDocs(q)).then(docs => {
                    if (docs.docs.length === 0) return null
                    return { ...docs.docs[0].data(), id: docs.docs[0].id }
                })
                if (!fullData) return setUser(null)
                setUser({ ...u, ...fullData })
            } else {
                setUser(null)
            }
        });
        return () => unsubscribe();
    }, []);

    return { user, restartUser }
}
export default useAuth