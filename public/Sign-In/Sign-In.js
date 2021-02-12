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
      .then(function() {
          console.log("user logged in");
          window.location.href = "../Forms/New Parent Form/New Parent Form.html";
      })
      .catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log('Error code: ' + errorCode);
          console.log('Error message: ' + errorMessage);
          errMsgElem.textContent = errorMessage;
          errMsgElem.style.display = 'block';
      });
}