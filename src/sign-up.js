import "./_authorization";
import app from "./_firebase";
import { getAuth, createUserWithEmailAndPassword, updateProfile, getIdToken } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"
import { getFirestore, setDoc, doc, serverTimestamp } from "firebase/firestore"
import { createAnalyticsEvent } from "./_runAnalytics";
import Dialog from "./_Dialog"

const auth = getAuth(app);
const functions = getFunctions(app);
const db = getFirestore(app);

//form submission
document.getElementById('signup').addEventListener('submit', async (event) => {
  isLoading(true);
  event.preventDefault();
  const target = event.target;
  const registrationData = Object.fromEntries(new FormData(target).entries())
  const errorMsg = document.getElementById('error');

  errorMsg.innerText = '';
  errorMsg.hidden = true;

  //verify that the passwords match
  if (registrationData.password != registrationData.confirmPassword) {
    errorMsg.textContent = 'Your password does not match'
    errorMsg.hidden = false;
    isLoading(false);
    return;
  }

  //create the user account
  createUserWithEmailAndPassword(auth, registrationData.email.trim().toLowerCase(), registrationData.password)
  .then(async (userCredential) => {
    // Signed in 
    const user = userCredential.user;

    createAnalyticsEvent({
      eventID: 'sign-up',
      data: {
        user: user.uid
      }
    })

    //update user profile
    updateProfile(user, {
      displayName: registrationData.firstName.trim() + ' ' + registrationData.lastName.trim()
    })
  
    //set up their role
    const addUserRole = httpsCallable(functions, 'addUserRole');
    await addUserRole({ role: 'student' });

    //set up their user profile
    const userDocRef = doc(db, 'Users', user.uid);
    await setDoc(userDocRef, {
      firstName : registrationData.firstName.trim(),
      lastName : registrationData.lastName.trim(),
      email : registrationData.email.trim().toLowerCase(),
      role : 'student',
      location : 'WIZWBumUoo7Ywkc3pl2G', //hard coded for the online location
      createdAt : serverTimestamp()
    })

    // refresh the user token
    await getIdToken(user, true);

    target.reset();

    isLoading(false);
    window.location.href = location.origin + `/test-taker/${user.uid}`;
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode, errorMessage);

    Dialog.alert(error.message)
    isLoading(false);
  });
})

function isLoading(bool) {
  document.querySelector('main').className = bool ? 'loading' : '';
}