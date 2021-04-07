//FIXME: need to grab which location we are looking at
//currently stuck on Sandy
let currentLocation = "tykwKFrvmQ8xg2kFfEeA";






const locationDocRef = firebase.firestore().collection("Locations").doc(currentLocation)
locationDocRef.get()
.then((doc) => {
  if (doc.exists) {
    let locationName = doc.get("locationName");
    document.getElementById("locationName").textContent = locationName;

    let activeStudents = doc.get("activeStudents");

    if (activeStudents) {
      const activeStudentElem = document.getElementById("activeStudents");
      for (const object in activeStudents) {
        let option = document.createElement("option");
        option.value = object;
        option.innerText = activeStudents[object]["studentFirstName"] + " " + activeStudents[object]["studentLastName"];
        activeStudentElem.appendChild(option);
      }
    }
  }
})
.catch((error) => {
  console.log(error);
  console.log(error.code);
  console.log(error.message);
  console.log(error.details);
});

function activeStudentSelected(e) {
  let studentUID = e.value;
  let queryStr = "?student=" + studentUID;
  window.location.href = "../Forms/ACT Daily Log/Daily Log.html" + queryStr;
}

function resetPassword() {
  let confirmation = confirm("Are you sure you want to reset your password?");
  if (confirmation) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        var auth = firebase.auth();
        var emailAddress = user.email;

        auth.sendPasswordResetEmail(emailAddress)
        .then(function() {
          // Email sent.
          alert("An email has been sent to your email to continue with your password reset.");
        })
        .catch(function(error) {
          // An error happened.
          alert("There was an issue with your password reset. \nPlease try again later.");
        });
      } else {
        // No user is signed in.
        alert("Oops! No one is signed in to change the password");
      }
    });
  }
}