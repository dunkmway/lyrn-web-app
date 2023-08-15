import './_authorization';
import app from './_firebase';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from "firebase/functions";

import Dialog from './_Dialog';

const auth = getAuth(app);
const functions = getFunctions(app);

let formElement,
    usernameField,
    passwordField,
    errorElem,
    forgot

window.addEventListener('DOMContentLoaded', ()=> {
  // setup the dom elements after the content has loaded

  formElement = document.getElementById('signin');
  usernameField = document.getElementById("email");
  passwordField = document.getElementById("password");
  errorElem = document.querySelector(".error");
  forgot = document.querySelector(".forgot");

  // set up any event listeners
  forgot.addEventListener('click', forgotPassword);
  
  formElement.addEventListener("submit", function(event) {
      event.preventDefault()
      login();
  });
})


async function login() {
  errorElem.style.display = "none";

  const username = usernameField.value;
  const password = passwordField.value;

  try {
    await signInWithEmailAndPassword(auth, username, password);
  }
  catch(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      errorElem.textContent = errorMessage;
      errorElem.style.display = 'block';
      if (errorCode != "auth/invalid-email" && errorCode != "auth/wrong-password" && errorCode != "auth/user-not-found") {
        console.error(error);
      }
  };
}

async function forgotPassword() {
  errorElem.style.display = 'none';
  //check the email field for an email
  const email = usernameField.value;

  if (email) {
    const confirm = await Dialog.confirm('Would you like us to send you an email so that you can reset your password?')
    if (confirm) {
      const resetPassword = httpsCallable(functions, 'sign_in-resetPasswordUnauthenticated');
        resetPassword({
          email: email
        })
        .then((result) => {
          Dialog.alert(result.data)
        })
        .catch((error) => {
          console.log(error)
          errorElem.textContent = error.message;
          errorElem.style.display = 'block';
        })
    }

  }
  else {
    errorElem.textContent = 'Please fill in your email so we can help you reset your password.';
    errorElem.style.display = 'block';
  }
}
