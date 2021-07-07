//FIXME: need to grab which location we are looking at
//currently stuck on Sandy
let currentLocation = "";
let currentLocations = [
  {
    id: "mhOjmqiieW6zrHcvsElp",
    name: "Lehi"
  },
  {
    id: "tykwKFrvmQ8xg2kFfEeA",
    name: "Sandy"
  }
]
initialSetupData();


function initialSetupData() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      getSecretaryProfile(user.uid)
      .then((doc) => {
        if (doc.exists) {
          setSecretaryProfile(doc.data());
          setStudentTable();
        }
        else setSecretaryProfile();
      })

    } else {
      // No user is signed in.
    }
  });
}

function setStudentTable() {
  let tableData = [];
  let promises = [];

  //get array of location ids
  let locationUIDs = [];
  currentLocations.forEach((location) => {
    locationUIDs.push(location.id);
  })

  //query all students whose types are in the current locations array
  return firebase.firestore().collection('Students').where('location', 'in', locationUIDs).get()
  .then((studentQuerySnapshot) => {
    studentQuerySnapshot.forEach((studentDoc) => {
      const studentData = studentDoc.data();

      //convert type string to array
      let studentTypesTable = "";
      studentData.studentTypes.forEach((type) => {
        switch(type) {
          case 'act':
            studentTypesTable += 'ACT, ';
            break;
          case 'subjectTutoring':
            studentTypesTable += 'Subject-Tutoring, ';
            break;
          case 'mathProgram':
            studentTypesTable += 'Math-Program, ';
            break;
          case 'phonicsProgram':
            studentTypesTable += 'Phonics-Program, ';
            break;
          default:
            //nothing
        }
      })
      studentTypesTable = studentTypesTable.substring(0, studentTypesTable.length - 2);

      //figure out the location name
      let locationName = "";
      currentLocations.forEach((location) => {
        if (studentData.location == location.id) {
          locationName = location.name;
        }
      })

      promises.push(getParentData(studentData.parent)
      .then((parentData) => {

        const student = {
          studentUID: studentDoc.id,
          studentName: studentData.studentLastName + ", " + studentData.studentFirstName,
          studentTypes: studentData.studentTypes,
          studentTypesTable: studentTypesTable,
          location: locationName,
          parentUID: parentData.parentUID,
          parentName: parentData.parentLastName + ", " + parentData.parentFirstName, 
        }

        tableData.push(student);
      }));
    });

    //all of the student objects have been created
    Promise.all(promises)
    .then(() => {
      let studentTable = $('#student-table').DataTable( {
        data: tableData,
        columns: [
          { data: 'studentName' },
          { data: 'studentTypesTable'},
          { data: 'location'},
          { data: 'parentName'},
        ],
        "scrollY": "400px",
        "scrollCollapse": true,
        "paging": false
      } );
    
      studentTable.on('click', (args) => {
        //this should fix some "cannot read property of undefined" errors
        if (args?.target?._DT_CellIndex) {
          let studentUID = tableData[args.target._DT_CellIndex.row].studentUID;
          setupNavigationModal(studentUID);
          document.getElementById("navigationSection").style.display = "flex";
        }
      })
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      console.log(error);
    })

  })
  .catch((error) => {
    handleFirebaseErrors(error, window.location.href);
    console.log(error);
  });
}

function goToInquiry(studentUID = null) {
  let queryStr = '';
  if (studentUID) {
    queryStr = "?student=" + studentUID;
  }
  window.location.href = "../inquiry.html" + queryStr;
}

function actStudentSelected(studentUID) {
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
          handleFirebaseErrors(error, window.location.href);
        });
      } else {
        // No user is signed in.
        alert("Oops! No one is signed in to change the password");
      }
    });
  }
}

function getSecretaryProfile(secretaryUID) {
  const secretaryProfileRef = firebase.firestore().collection("Secretaries").doc(secretaryUID);
  return secretaryProfileRef.get();
}

function setSecretaryProfile(profileData = {}) {
  if (profileData['secretaryFirstName'] && profileData['secretaryLastName']) {
    document.getElementById('secretary-name').textContent = "Welcome " + profileData['secretaryFirstName'] + " " + profileData['secretaryLastName'] + "!";
  }
  else {
    document.getElementById('secretary-name').textContent = "Welcome Secretary!";
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