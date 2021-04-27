//set firebase auth persistence
setSession();

// login functionality
usernameField = document.getElementById("username");
passwordField = document.getElementById("password");
errMsgElem = document.getElementById("errMsg");
errMsgElem.style.display = "none";

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

function login() {
  errMsgElem.style.display = "none";

  var username = usernameField.value;
  var password = passwordField.value;

  firebase.auth().signInWithEmailAndPassword(username, password)
  .then((result) => {
    // console.log(result);
    result.user.getIdTokenResult()
    .then((idTokenResult) => {
      // Confirm the user is an Admin.
      let role = idTokenResult.claims.role;

      switch (role) {
        case "student":
          window.location.href = "../Dashboard/Student.html";
          break;
        case "parent":
          window.location.href = "../Dashboard/Parent.html";
          break;
        case "tutor":
          window.location.href = "../Dashboard/Tutor.html";
          break;
        case "secretary":
          window.location.href = "../Dashboard/Secretary.html";
          break;
        case "admin":
          window.location.href = "../Dashboard/Admin.html";
          break;
        case "dev":
          window.location.href = "../Dashboard/Dev.html";
          break;
        default:
          errMsgElem.textContent = "Oops! You have no role. Let us know so we can fix that.";
          errMsgElem.style.display = 'block';
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, document.currentScript.src);
    });

    //window.location.href = "../post-sign-in.html";
  })
  .catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      errMsgElem.textContent = errorMessage;
      errMsgElem.style.display = 'block';
      if (errorCode != "auth/invalid-email" && errorCode != "auth/wrong-password" && errorCode != "auth/user-not-found") {
        handleFirebaseErrors(error, document.currentScript.src);
      }
  });
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
