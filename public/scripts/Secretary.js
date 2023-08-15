/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**************************!*\
  !*** ./src/Secretary.js ***!
  \**************************/
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
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VjcmV0YXJ5LmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVkscUJBQXFCO0FBQ2pDLFlBQVksMEJBQTBCO0FBQ3RDLFlBQVksaUJBQWlCO0FBQzdCLFlBQVksbUJBQW1CO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRSIsInNvdXJjZXMiOlsid2VicGFjazovL2x5cm5fd2ViX2FwcF9jbGVhbi8uL3NyYy9TZWNyZXRhcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy9GSVhNRTogbmVlZCB0byBncmFiIHdoaWNoIGxvY2F0aW9uIHdlIGFyZSBsb29raW5nIGF0XHJcbi8vY3VycmVudGx5IHN0dWNrIG9uIFNhbmR5XHJcbmxldCBjdXJyZW50TG9jYXRpb24gPSBcIlwiO1xyXG5sZXQgY3VycmVudExvY2F0aW9ucyA9IFtcclxuICB7XHJcbiAgICBpZDogXCJtaE9qbXFpaWVXNnpySGN2c0VscFwiLFxyXG4gICAgbmFtZTogXCJMZWhpXCJcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiBcInR5a3dLRnJ2bVE4eGcya0ZmRWVBXCIsXHJcbiAgICBuYW1lOiBcIlNhbmR5XCJcclxuICB9XHJcbl1cclxuaW5pdGlhbFNldHVwRGF0YSgpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxTZXR1cERhdGEoKSB7XHJcbiAgZmlyZWJhc2UuYXV0aCgpLm9uQXV0aFN0YXRlQ2hhbmdlZChmdW5jdGlvbih1c2VyKSB7XHJcbiAgICBpZiAodXNlcikge1xyXG4gICAgICAvLyBVc2VyIGlzIHNpZ25lZCBpbi5cclxuICAgICAgZ2V0U2VjcmV0YXJ5UHJvZmlsZSh1c2VyLnVpZClcclxuICAgICAgLnRoZW4oKGRvYykgPT4ge1xyXG4gICAgICAgIGlmIChkb2MuZXhpc3RzKSB7XHJcbiAgICAgICAgICBzZXRTZWNyZXRhcnlQcm9maWxlKGRvYy5kYXRhKCkpO1xyXG4gICAgICAgICAgc2V0U3R1ZGVudFRhYmxlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Ugc2V0U2VjcmV0YXJ5UHJvZmlsZSgpO1xyXG4gICAgICB9KVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIE5vIHVzZXIgaXMgc2lnbmVkIGluLlxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRTdHVkZW50VGFibGUoKSB7XHJcbiAgbGV0IHRhYmxlRGF0YSA9IFtdO1xyXG4gIGxldCBwcm9taXNlcyA9IFtdO1xyXG5cclxuICAvL2dldCBhcnJheSBvZiBsb2NhdGlvbiBpZHNcclxuICBsZXQgbG9jYXRpb25VSURzID0gW107XHJcbiAgY3VycmVudExvY2F0aW9ucy5mb3JFYWNoKChsb2NhdGlvbikgPT4ge1xyXG4gICAgbG9jYXRpb25VSURzLnB1c2gobG9jYXRpb24uaWQpO1xyXG4gIH0pXHJcblxyXG4gIC8vcXVlcnkgYWxsIHN0dWRlbnRzIHdob3NlIHR5cGVzIGFyZSBpbiB0aGUgY3VycmVudCBsb2NhdGlvbnMgYXJyYXlcclxuICByZXR1cm4gZmlyZWJhc2UuZmlyZXN0b3JlKCkuY29sbGVjdGlvbignU3R1ZGVudHMnKS53aGVyZSgnbG9jYXRpb24nLCAnaW4nLCBsb2NhdGlvblVJRHMpLmdldCgpXHJcbiAgLnRoZW4oKHN0dWRlbnRRdWVyeVNuYXBzaG90KSA9PiB7XHJcbiAgICBzdHVkZW50UXVlcnlTbmFwc2hvdC5mb3JFYWNoKChzdHVkZW50RG9jKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0dWRlbnREYXRhID0gc3R1ZGVudERvYy5kYXRhKCk7XHJcblxyXG4gICAgICAvL2NvbnZlcnQgdHlwZSBzdHJpbmcgdG8gYXJyYXlcclxuICAgICAgbGV0IHN0dWRlbnRUeXBlc1RhYmxlID0gXCJcIjtcclxuICAgICAgc3R1ZGVudERhdGEuc3R1ZGVudFR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcclxuICAgICAgICBzd2l0Y2godHlwZSkge1xyXG4gICAgICAgICAgY2FzZSAnYWN0JzpcclxuICAgICAgICAgICAgc3R1ZGVudFR5cGVzVGFibGUgKz0gJ0FDVCwgJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdzdWJqZWN0VHV0b3JpbmcnOlxyXG4gICAgICAgICAgICBzdHVkZW50VHlwZXNUYWJsZSArPSAnU3ViamVjdC1UdXRvcmluZywgJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdtYXRoUHJvZ3JhbSc6XHJcbiAgICAgICAgICAgIHN0dWRlbnRUeXBlc1RhYmxlICs9ICdNYXRoLVByb2dyYW0sICc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAncGhvbmljc1Byb2dyYW0nOlxyXG4gICAgICAgICAgICBzdHVkZW50VHlwZXNUYWJsZSArPSAnUGhvbmljcy1Qcm9ncmFtLCAnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIC8vbm90aGluZ1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgc3R1ZGVudFR5cGVzVGFibGUgPSBzdHVkZW50VHlwZXNUYWJsZS5zdWJzdHJpbmcoMCwgc3R1ZGVudFR5cGVzVGFibGUubGVuZ3RoIC0gMik7XHJcblxyXG4gICAgICAvL2ZpZ3VyZSBvdXQgdGhlIGxvY2F0aW9uIG5hbWVcclxuICAgICAgbGV0IGxvY2F0aW9uTmFtZSA9IFwiXCI7XHJcbiAgICAgIGN1cnJlbnRMb2NhdGlvbnMuZm9yRWFjaCgobG9jYXRpb24pID0+IHtcclxuICAgICAgICBpZiAoc3R1ZGVudERhdGEubG9jYXRpb24gPT0gbG9jYXRpb24uaWQpIHtcclxuICAgICAgICAgIGxvY2F0aW9uTmFtZSA9IGxvY2F0aW9uLm5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcHJvbWlzZXMucHVzaChnZXRQYXJlbnREYXRhKHN0dWRlbnREYXRhLnBhcmVudClcclxuICAgICAgLnRoZW4oKHBhcmVudERhdGEpID0+IHtcclxuXHJcbiAgICAgICAgY29uc3Qgc3R1ZGVudCA9IHtcclxuICAgICAgICAgIHN0dWRlbnRVSUQ6IHN0dWRlbnREb2MuaWQsXHJcbiAgICAgICAgICBzdHVkZW50TmFtZTogc3R1ZGVudERhdGEuc3R1ZGVudExhc3ROYW1lICsgXCIsIFwiICsgc3R1ZGVudERhdGEuc3R1ZGVudEZpcnN0TmFtZSxcclxuICAgICAgICAgIHN0dWRlbnRUeXBlczogc3R1ZGVudERhdGEuc3R1ZGVudFR5cGVzLFxyXG4gICAgICAgICAgc3R1ZGVudFR5cGVzVGFibGU6IHN0dWRlbnRUeXBlc1RhYmxlLFxyXG4gICAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uTmFtZSxcclxuICAgICAgICAgIHBhcmVudFVJRDogcGFyZW50RGF0YS5wYXJlbnRVSUQsXHJcbiAgICAgICAgICBwYXJlbnROYW1lOiBwYXJlbnREYXRhLnBhcmVudExhc3ROYW1lICsgXCIsIFwiICsgcGFyZW50RGF0YS5wYXJlbnRGaXJzdE5hbWUsIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGFibGVEYXRhLnB1c2goc3R1ZGVudCk7XHJcbiAgICAgIH0pKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vYWxsIG9mIHRoZSBzdHVkZW50IG9iamVjdHMgaGF2ZSBiZWVuIGNyZWF0ZWRcclxuICAgIFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICBsZXQgc3R1ZGVudFRhYmxlID0gJCgnI3N0dWRlbnQtdGFibGUnKS5EYXRhVGFibGUoIHtcclxuICAgICAgICBkYXRhOiB0YWJsZURhdGEsXHJcbiAgICAgICAgY29sdW1uczogW1xyXG4gICAgICAgICAgeyBkYXRhOiAnc3R1ZGVudE5hbWUnIH0sXHJcbiAgICAgICAgICB7IGRhdGE6ICdzdHVkZW50VHlwZXNUYWJsZSd9LFxyXG4gICAgICAgICAgeyBkYXRhOiAnbG9jYXRpb24nfSxcclxuICAgICAgICAgIHsgZGF0YTogJ3BhcmVudE5hbWUnfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIFwic2Nyb2xsWVwiOiBcIjQwMHB4XCIsXHJcbiAgICAgICAgXCJzY3JvbGxDb2xsYXBzZVwiOiB0cnVlLFxyXG4gICAgICAgIFwicGFnaW5nXCI6IGZhbHNlXHJcbiAgICAgIH0gKTtcclxuICAgIFxyXG4gICAgICBzdHVkZW50VGFibGUub24oJ2NsaWNrJywgKGFyZ3MpID0+IHtcclxuICAgICAgICAvL3RoaXMgc2hvdWxkIGZpeCBzb21lIFwiY2Fubm90IHJlYWQgcHJvcGVydHkgb2YgdW5kZWZpbmVkXCIgZXJyb3JzXHJcbiAgICAgICAgaWYgKGFyZ3M/LnRhcmdldD8uX0RUX0NlbGxJbmRleCkge1xyXG4gICAgICAgICAgbGV0IHN0dWRlbnRVSUQgPSB0YWJsZURhdGFbYXJncy50YXJnZXQuX0RUX0NlbGxJbmRleC5yb3ddLnN0dWRlbnRVSUQ7XHJcbiAgICAgICAgICBzZXR1cE5hdmlnYXRpb25Nb2RhbChzdHVkZW50VUlEKTtcclxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2aWdhdGlvblNlY3Rpb25cIikuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgIGhhbmRsZUZpcmViYXNlRXJyb3JzKGVycm9yLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgIH0pXHJcblxyXG4gIH0pXHJcbiAgLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgaGFuZGxlRmlyZWJhc2VFcnJvcnMoZXJyb3IsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ29Ub0lucXVpcnkoc3R1ZGVudFVJRCA9IG51bGwpIHtcclxuICBsZXQgcXVlcnlTdHIgPSAnJztcclxuICBpZiAoc3R1ZGVudFVJRCkge1xyXG4gICAgcXVlcnlTdHIgPSBcIj9zdHVkZW50PVwiICsgc3R1ZGVudFVJRDtcclxuICB9XHJcbiAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi4uL2lucXVpcnkuaHRtbFwiICsgcXVlcnlTdHI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFjdFN0dWRlbnRTZWxlY3RlZChzdHVkZW50VUlEKSB7XHJcbiAgbGV0IHF1ZXJ5U3RyID0gXCI/c3R1ZGVudD1cIiArIHN0dWRlbnRVSUQ7XHJcbiAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi4uL0Zvcm1zL0FDVCBEYWlseSBMb2cvRGFpbHkgTG9nLmh0bWxcIiArIHF1ZXJ5U3RyO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXNldFBhc3N3b3JkKCkge1xyXG4gIGxldCBjb25maXJtYXRpb24gPSBjb25maXJtKFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlc2V0IHlvdXIgcGFzc3dvcmQ/XCIpO1xyXG4gIGlmIChjb25maXJtYXRpb24pIHtcclxuICAgIGZpcmViYXNlLmF1dGgoKS5vbkF1dGhTdGF0ZUNoYW5nZWQoZnVuY3Rpb24odXNlcikge1xyXG4gICAgICBpZiAodXNlcikge1xyXG4gICAgICAgIHZhciBhdXRoID0gZmlyZWJhc2UuYXV0aCgpO1xyXG4gICAgICAgIHZhciBlbWFpbEFkZHJlc3MgPSB1c2VyLmVtYWlsO1xyXG5cclxuICAgICAgICBhdXRoLnNlbmRQYXNzd29yZFJlc2V0RW1haWwoZW1haWxBZGRyZXNzKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgLy8gRW1haWwgc2VudC5cclxuICAgICAgICAgIGFsZXJ0KFwiQW4gZW1haWwgaGFzIGJlZW4gc2VudCB0byB5b3VyIGVtYWlsIHRvIGNvbnRpbnVlIHdpdGggeW91ciBwYXNzd29yZCByZXNldC5cIik7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICAgIC8vIEFuIGVycm9yIGhhcHBlbmVkLlxyXG4gICAgICAgICAgYWxlcnQoXCJUaGVyZSB3YXMgYW4gaXNzdWUgd2l0aCB5b3VyIHBhc3N3b3JkIHJlc2V0LiBcXG5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiKTtcclxuICAgICAgICAgIGhhbmRsZUZpcmViYXNlRXJyb3JzKGVycm9yLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm8gdXNlciBpcyBzaWduZWQgaW4uXHJcbiAgICAgICAgYWxlcnQoXCJPb3BzISBObyBvbmUgaXMgc2lnbmVkIGluIHRvIGNoYW5nZSB0aGUgcGFzc3dvcmRcIik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U2VjcmV0YXJ5UHJvZmlsZShzZWNyZXRhcnlVSUQpIHtcclxuICBjb25zdCBzZWNyZXRhcnlQcm9maWxlUmVmID0gZmlyZWJhc2UuZmlyZXN0b3JlKCkuY29sbGVjdGlvbihcIlNlY3JldGFyaWVzXCIpLmRvYyhzZWNyZXRhcnlVSUQpO1xyXG4gIHJldHVybiBzZWNyZXRhcnlQcm9maWxlUmVmLmdldCgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRTZWNyZXRhcnlQcm9maWxlKHByb2ZpbGVEYXRhID0ge30pIHtcclxuICBpZiAocHJvZmlsZURhdGFbJ3NlY3JldGFyeUZpcnN0TmFtZSddICYmIHByb2ZpbGVEYXRhWydzZWNyZXRhcnlMYXN0TmFtZSddKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VjcmV0YXJ5LW5hbWUnKS50ZXh0Q29udGVudCA9IFwiV2VsY29tZSBcIiArIHByb2ZpbGVEYXRhWydzZWNyZXRhcnlGaXJzdE5hbWUnXSArIFwiIFwiICsgcHJvZmlsZURhdGFbJ3NlY3JldGFyeUxhc3ROYW1lJ10gKyBcIiFcIjtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VjcmV0YXJ5LW5hbWUnKS50ZXh0Q29udGVudCA9IFwiV2VsY29tZSBTZWNyZXRhcnkhXCI7XHJcbiAgfVxyXG5cclxuICBpZiAocHJvZmlsZURhdGFbJ2xvY2F0aW9uJ10pIHtcclxuICAgIGN1cnJlbnRMb2NhdGlvbiA9IHByb2ZpbGVEYXRhWydsb2NhdGlvbiddO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc3VibWl0RmVlZGJhY2soKSB7XHJcbiAgbGV0IHN1Ym1pdEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2tfc3VibWl0X2J0blwiKTtcclxuICBsZXQgZXJyb3JNc2cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrX2Vycm9yX21zZ1wiKTtcclxuXHJcbiAgc3VibWl0QnRuLmRpc2FibGVkID0gdHJ1ZTtcclxuICBlcnJvck1zZy50ZXh0Q29udGVudCA9IFwiXCI7XHJcblxyXG4gIGxldCBmZWVkYmFja0lucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFja19pbnB1dFwiKTtcclxuXHJcbiAgLy9jaGVjayBmb3IgYSB2YWxpZCBpbnB1dFxyXG4gIGlmIChmZWVkYmFja0lucHV0LnZhbHVlLnRyaW0oKSAhPSBcIlwiKSB7XHJcbiAgICBsZXQgdmFsaWQgPSBjb25maXJtKFwiQXJlIHlvdSBzdXJlIHlvdSdyZSByZWFkeSB0byBzdWJtaXQgdGhpcyBmZWVkYmFjaz9cIik7XHJcbiAgICBpZiAodmFsaWQpIHtcclxuICAgICAgY29uc3QgZmVlZGJhY2tSZWYgPSBmaXJlYmFzZS5maXJlc3RvcmUoKS5jb2xsZWN0aW9uKFwiRmVlZGJhY2tcIikuZG9jKCk7XHJcbiAgICAgIGZlZWRiYWNrUmVmLnNldCh7XHJcbiAgICAgICAgdXNlcjogZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyLnVpZCxcclxuICAgICAgICBmZWVkYmFjazogZmVlZGJhY2tJbnB1dC52YWx1ZSxcclxuICAgICAgICB0aW1lc3RhbXA6IChuZXcgRGF0ZSgpLmdldFRpbWUoKSlcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIGZlZWRiYWNrSW5wdXQudmFsdWUgPSBcIlwiO1xyXG4gICAgICAgIHN1Ym1pdEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIGVycm9yTXNnLnRleHRDb250ZW50ID0gXCJXZSBnb3QgaXQhIFRoYW5rcyBmb3IgdGhlIGZlZWRiYWNrXCI7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgICBoYW5kbGVGaXJlYmFzZUVycm9ycyhlcnJvciwgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG4gICAgICAgIHN1Ym1pdEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIGVycm9yTXNnLnRleHRDb250ZW50ID0gXCJZb3UncmUgZmVlZGJhY2sgd2FzIHRvbyBob25lc3QgZm9yIHRoZSBjb21wdXRlciB0byBwcm9jZXNzLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiO1xyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2tfZXJyb3JfbXNnXCIpLnRleHRDb250ZW50ID0gXCIuLi55b3UgZGlkbid0IGV2ZW4gd3JpdGUgYW55dGhpbmcuXCJcclxuICAgIHN1Ym1pdEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gIH1cclxufSAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=