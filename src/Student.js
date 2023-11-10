import app from "./_firebase";
import { query, getFirestore, collection, limit, where, getDocs } from "firebase/firestore";
import { requestSignOut, getCurrentUser } from "./_authorization";

const db = getFirestore(app);

window.signOut = requestSignOut;
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    renderSalutation();
    const free = document.querySelector('.free');
    const self = document.querySelector('.self');
    const tutor = document.querySelector('.tutor');

    const user = await getCurrentUser();

    free.href = `${location.origin}/test-taker/${user.uid}?mode=marketing`;
    // self.href = `${location.origin}/self-guided`

    const isEnrolled = await isStudentInOneOnOne(user.uid);
    tutor.href = isEnrolled ? `${location.origin}/test-taker/${user.uid}` : `${location.origin}/pricing?program=one-on-one`;
}

async function renderSalutation() {
    const currentUser = await getCurrentUser();
    const name = currentUser.displayName.split(' ')[0];
  
    document.getElementById('salutation').textContent = `Hey ${name}!`
}

// we will determine if a student is taking a program if they have any non marketing assignments
async function isStudentInOneOnOne(studentUID) {
    const q = query(
        collection(db, 'ACT-Assignments'),
        where('student', '==', studentUID),
        where('type', '!=', 'marketing'),
        limit(1)
    )

    const querySnapshot = await getDocs(q);
    return querySnapshot.size == 1;
}