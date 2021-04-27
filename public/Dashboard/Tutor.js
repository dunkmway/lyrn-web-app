//FIXME: need to grab which location we are looking at
//currently stuck on Sandy
let currentLocation = "";
initialSetupData();


function initialSetupData() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      getTutorProfile(user.uid)
      .then((doc) => {
        if (doc.exists) {
          setTutorProfile(doc.data());
          setStudentTable();
        }
        else setTutorProfile();
      })

    } else {
      // No user is signed in.
    }
  });
}

function setStudentTable() {
  const locationDocRef = firebase.firestore().collection("Locations").doc(currentLocation)
  locationDocRef.get()
  .then((doc) => {
    if (doc.exists) {
      let locationName = doc.get("locationName");
      //document.getElementById("locationName").textContent = locationName;

      let activeStudents = doc.get("activeStudents");


      let tableData = [];

      if (activeStudents) {
        for (const studentUID in activeStudents) {
          const student = {
            ...activeStudents[studentUID],
            studentUID: studentUID,
            status: "active"
          }
          tableData.push(student);
        }
      }

      let studentTable = $('#student-table').DataTable( {
        data: tableData,
        columns: [
          { data: 'studentFirstName' },
          { data: 'studentLastName' }
        ],
        "scrollY": "400px",
        "scrollCollapse": true,
        "paging": false
      } );

      studentTable.on('click', (args1) => {
        let studentUID = tableData[args1.target._DT_CellIndex.row].studentUID;
        let status = tableData[args1.target._DT_CellIndex.row].status;

        switch (status) {
          case "active":
            activeStudentSelected(studentUID);
            break;
          default:
            console.log("ERROR: This student isn't active or pending!!!")
        }
        
      })
    }
  })
  .catch((error) => {
    handleFirebaseErrors(error, document.currentScript.src);
  });
}


function activeStudentSelected(studentUID) {
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
          handleFirebaseErrors(error, document.currentScript.src);
        });
      } else {
        // No user is signed in.
        alert("Oops! No one is signed in to change the password");
      }
    });
  }
}

function getTutorProfile(tutorUID) {
  const tutorProfileRef = firebase.firestore().collection("Tutors").doc(tutorUID);
  return tutorProfileRef.get();
}

function setTutorProfile(profileData = {}) {
  if (profileData['tutorFirstName'] && profileData['tutorLastName']) {
    document.getElementById('tutor-name').textContent = "Welcome " + profileData['tutorFirstName'] + " " + profileData['tutorLastName'] + "!";
  }
  else {
    document.getElementById('tutor-name').textContent = "Welcome Tutor!";
  }

  if (profileData['location']) {
    currentLocation = profileData['location'];
  }
}