import app from "./_firebase";
import { getFirestore, doc, collection, addDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore"

const db = getFirestore(app);

export async function createAnalyticsEvent(data) {
    if (window.location.hostname == 'localhost' || window.location.hostname == '127.0.0.1') return;

    let analyticsID = localStorage.getItem('analyticsID_v1');
    if (!analyticsID) {
      analyticsID = doc(collection(db, "Analytics")).id
      localStorage.setItem('analyticsID_v1', analyticsID);
      await updateDoc(doc(db, 'Analytics', '_Aggregate'), {
        analyticsIDs: arrayUnion(analyticsID)
      });
    }

    await addDoc(collection(db, 'Analytics'), {
      ...data,
      createdAt: serverTimestamp(),
      analyticsID,
      page: window.location.pathname
    });

    return;
}

function checkForLead() {
    const params = new URLSearchParams(document.location.search);
    const source = params.get("source");

    if (source) {
        createAnalyticsEvent({
            eventID: 'source',
            data: { source }
        })
    }
}

checkForLead()