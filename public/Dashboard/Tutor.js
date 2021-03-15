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