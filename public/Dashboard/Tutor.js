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
  let tableData = [];
  let promises = []
  let currentLocations = ["mhOjmqiieW6zrHcvsElp", "tykwKFrvmQ8xg2kFfEeA"]
  for (let i = 0; i < currentLocations.length; i++) {
    const locationDocRef = firebase.firestore().collection("Locations").doc(currentLocations[i])
    let locationProm = locationDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        let locationName = doc.get("locationName");
        let activeStudents = doc.get("activeStudents");

        if (activeStudents) {
          for (const studentUID in activeStudents) {
            const student = {
              ...activeStudents[studentUID],
              studentUID: studentUID,
              status: "active",
              location: locationName,
            }

            //adjust name to be last, first
            student.studentName = student.studentLastName + ", " + student.studentFirstName

            tableData.push(student);
          }
        }
      }
    })
    .catch((error) => {
      console.log(error);
      handleFirebaseErrors(error, window.location.href);
    });
    promises.push(locationProm);
  }

  return Promise.all(promises)
  .then(() => {
    let studentTable = $('#student-table').DataTable( {
      data: tableData,
      columns: [
        { data: 'studentName' },
        { data: 'location'}
      ],
      "scrollY": "400px",
      "scrollCollapse": true,
      "paging": false
    } );

    studentTable.on('click', (args) => {
      if (args?.target?._DT_CellIndex) {
        let studentUID = tableData[args.target._DT_CellIndex.row].studentUID;
        setupNavigationModal(studentUID);
        document.getElementById("navigationSection").style.display = "flex";
      }
      
    });
  })
  .catch((error) => {
    console.log(error);
    handleFirebaseErrors(error, window.location.href);
  });
}

function setupNavigationModal(studentUID) {
  const modal = document.getElementById("navigationSection");
  let queryStr = "?student=" + studentUID;

  document.getElementById("actNav").onclick = () => {
    modal.style.display = 'none';
    window.location.href = "../Forms/ACT Daily Log/Daily Log.html" + queryStr
  };
  document.getElementById("subjectTutoringNav").onclick = () => {
    modal.style.display = 'none';
    window.location.href = "../subject-tutoring-dash.html" + queryStr
  };
  document.getElementById("mathProgramNav").onclick = () => {
    modal.style.display = 'none';
    window.location.href = "../math-program.html" + queryStr
  };
  document.getElementById("phonicsProgramNav").onclick = () => {
    modal.style.display = 'none';
    window.location.href = "../phonics-program.html" + queryStr
  };
}


function actStudentSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../Forms/ACT Daily Log/Daily Log.html" + queryStr;
}

function subjectTutoringStudentSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../subject-tutoring-dash.html" + queryStr;
}

function mathProgramSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../math-program.html" + queryStr;
}

function phonicsProgramSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../phonics-program.html" + queryStr;
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
          handleFirebaseErrors(error, window.location.href);
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

function submitFeedback() {
  let submitBtn = document.getElementById("feedback_submit_btn");
  let errorMsg = document.getElementById("feedback_error_msg");

  submitBtn.disabled = true;
  errorMsg.textContent = "";

  let feedbackInput = document.getElementById("feedback_input");

  //check for a valid input
  if (feedbackInput.value.trim() != "") {
    let valid = confirm("Are you sure you're ready to submit this feedback?");
    if (valid) {
      const feedbackRef = firebase.firestore().collection("Feedback").doc();
      feedbackRef.set({
        user: firebase.auth().currentUser.uid,
        feedback: feedbackInput.value,
        timestamp: (new Date().getTime())
      })
      .then(() => {
        feedbackInput.value = "";
        submitBtn.disabled = false;
        errorMsg.textContent = "We got it! Thanks for the feedback";
      })
      .catch((error) => {
        handleFirebaseErrors(error, window.location.href);
        submitBtn.disabled = false;
        errorMsg.textContent = "You're feedback was too honest for the computer to process. Please try again later.";
      })
    }
  }
  else {
    document.getElementById("feedback_error_msg").textContent = "...you didn't even write anything."
    submitBtn.disabled = false;
  }
} 