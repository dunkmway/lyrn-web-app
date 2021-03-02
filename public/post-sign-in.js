//FIXME: need to grab which location we are looking at
let currentWTLocation = "Sandy"






const locationDocRef = firebase.firestore().collection("Locations").doc(currentWTLocation)
locationDocRef.get()
.then((doc) => {
  if (doc.exists) {
    let pendingStudents = doc.get("pendingStudents");
    if (pendingStudents) {
      const pendingStudentElem = document.getElementById("pendingStudents");
      for (let i = 0; i < pendingStudents.length; i++) {
        let option = document.createElement("option");
        option.value = pendingStudents[i]["parentUID"];
        option.innerText = pendingStudents[i]["studentFirstName"] + " " + pendingStudents[i]["studentLastName"];
        pendingStudentElem.appendChild(option);
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


function goToInquiry() {
  window.location.href = "inquiry.html";
}

function pendingStudentSelected(e) {
  console.log(e.value);
}