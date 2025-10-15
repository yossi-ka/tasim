
import { db, functions } from '../../firebase-config'
import { getDocs, query, collection, orderBy, where, updateDoc, doc } from 'firebase/firestore'
import { httpsCallable } from "firebase/functions";

export const getSubscribers = async (isDelete) => {

    // console.log(new Date().getTime(), "0")

    const q = query(collection(db, 'subscribers'), where("projectId", "==", isDelete ? 2 : 1))
    const data = await getDocs(q)

    const res = data.docs.map(d => {
        const docData = d.data();
        return {
            ...docData,
            registrationDate: docData.registrationDate.toDate(),
            id: d.id,
            registrationSource: docData.registrationSource === "yemot"
                ? "yemot"
                : docData.registrationSubSource
                    ? "nedarim"
                    : "web"
        };
    });

    const referralCounts = res.reduce((acc, d) => {
        if (d.referralCode) {
            acc[d.referralCode] = (acc[d.referralCode] || 0) + 1;
        }
        return acc;
    }, {});

    const response = res.map(d => ({
        ...d,
        amountOfMembers: referralCounts[d.subscriberId] || 0,
        amountOfTickets: (Math.floor((referralCounts[d.subscriberId] || 0) / 5) * 3) + 1,
        isMoreThan5: (referralCounts[d.subscriberId] || 0) >= 5,
        referralCode: isNaN(d.referralCode) || ("" + d.referralCode).length > 5 ? "" : d.referralCode
    }));
    response.sort((a, b) => b.registrationDate - a.registrationDate)

    return response;
}

export const updateSubscriber = async (id, data) => {
    try {
        await updateDoc(doc(db, "subscribers", id), data)
        return true
    } catch (e) {
        // return false
        throw e
    }
}



// export const getSubscribersF = async (projectId) => {
//     const getSubscribers = httpsCallable(functions, 'getSubscribers');
//     return (await getSubscribers({ projectId })).data.subscribers;

// }
