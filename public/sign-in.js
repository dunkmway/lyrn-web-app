//set firebase auth persistence
setSession();

// login functionality
const usernameField = document.getElementById("email");
const passwordField = document.getElementById("password");
const loginButton = document.querySelector('.button')
const errorElem = document.querySelector(".error");

usernameField.addEventListener("keyup", function(event) {
  if(event.code === 'Enter') {
      event.preventDefault()
      login();
  }
});

passwordField.addEventListener("keyup", function(event) {
  if(event.code === 'Enter') {
      event.preventDefault()
      login();
  }
});

loginButton.addEventListener("keyup", function(event) {
  if(event.code === 'Enter') {
      event.preventDefault()
      login();
  }
});

async function login() {
  errorElem.style.display = "none";

  const username = usernameField.value;
  const password = passwordField.value;

  try {
    await firebase.auth().signInWithEmailAndPassword(username, password)
    goToDashboard();
  }
  catch(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      errorElem.textContent = errorMessage;
      errorElem.style.display = 'block';
      if (errorCode != "auth/invalid-email" && errorCode != "auth/wrong-password" && errorCode != "auth/user-not-found") {
        handleFirebaseErrors(error, window.location.href);
      }
  };
}

async function forgotPassword() {
  errorElem.style.display = 'none';
  //check the email field for an email
  const email = usernameField.value;

  if (email) {
    customConfirm(
      `Yeah I know how that feels...Would you like us to send you an email so that you can reset your password?`,
      'Yes!',
      'No',
      () => {
        const resetPassword = firebase.functions().httpsCallable('sign_in-resetPasswordUnauthenticated');
        resetPassword({
          email: email
        })
        .then((result) => {
          console.log(result.data)
          customConfirm(
            result.data,
            'Ok',
            '',
            () => {},
            () => {}
          )
        })
        .catch((error) => {
          console.log(error)
          errorElem.textContent = error.message;
          errorElem.style.display = 'block';
        })
      },
      () => {}
    )
  }
  else {
    errorElem.textContent = 'Please fill in your email so we can help you reset your password.';
    errorElem.style.display = 'block';
  }
}

function setSession() {
//set auth persistence to session
return firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
.then(function() {
  // console.log("set persistence")
// Existing and future Auth states are now persisted in the current
// session only. Closing the window would clear any existing state even
// if a user forgets to sign out.
// ...
// New sign-in will be persisted with session persistence.
return firebase.auth().signInWithEmailAndPassword(email, password);
})
.catch(function(error) {
  // Handle Errors here.
  // this always throws an error but works...
});
}