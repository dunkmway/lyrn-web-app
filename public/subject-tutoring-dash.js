let student_profile_data = {};
let student_notes_data = {};
let student_st_profile_data = {};

const CURRENT_STUDENT_UID = queryStrings()['student'];
const CURRENT_STUDENT_TYPE = "subjectTutoring";

function main() {
  retrieveInitialData()
  .then(() => {
    setStudentProfile();
    setStudentSTProfile();
    getMessages('general');
    allowExpectationChange();
  })
}

function retrieveInitialData() {
  let profileProm = getStudentProfile(CURRENT_STUDENT_UID);
  let stProfileProm = getStudentSTProfile(CURRENT_STUDENT_UID); 

  let promises = [profileProm, notesProm, stProfileProm];
  return Promise.all(promises);
}

function getStudentProfile(studentUID) {
  const studentProfileRef = firebase.firestore().collection('Students').doc(studentUID);
  return studentProfileRef.get()
  .then((doc) => {
    if (doc.exists) {
      student_profile_data = doc.data();
    }
  })
}

function getStudentSTProfile(studentUID) {
  const studentSTProfileRef = firebase.firestore().collection('Students').doc(studentUID).collection('Subject-Tutoring').doc('profile');
  return studentSTProfileRef.get()
  .then((doc) => {
    if (doc.exists) {
      student_st_profile_data = doc.data();
    }
  })
}

function setStudentProfile() {
  document.getElementById('student-name').innerHTML = student_profile_data['studentFirstName'] + " " + student_profile_data['studentLastName'];
}

function setStudentSTProfile() {
  document.getElementById('student-expectation').value = student_st_profile_data['expectation'] || "No expectation set."
}

function allowExpectationChange() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (role == 'admin' || role == 'dev' || role == 'secretary') {
          document.getElementById("student-expectation").disabled = false;
          document.getElementById("student-expectation").addEventListener('keydown', updateStudentExpectation)
        }
      })
      .catch((error) => console.log(error));
      // .catch((error) => handleFirebaseErrors(error, window.location.href));
    }
  });
}

function updateStudentExpectation(event) {
  if (event.repeat) {return};
  if (!event.ctrlKey && event.key == "Enter") {
    event.preventDefault();
    let studentExpectationElem = document.getElementById('student-expectation');
    let expectationStr = studentExpectationElem.value;

    studentExpectationElem.style.borderColor = null;

    const studentSTProfileRef = firebase.firestore().collection('Students').doc(queryStrings()['student']).collection('Subject-Tutoring').doc('profile');
    studentSTProfileRef.get()
    .then((doc) => {
      if(doc.exists) {
        studentSTProfileRef.update({
          expectation : expectationStr
        })
        .then(() => {
          studentExpectationElem.style.borderColor = "green";
        })
        .catch((error) => handleFirebaseErrors(error, window.location.href));
      }
      else {
        studentSTProfileRef.set({
          expectation : expectationStr
        })
        .then(() => {
          studentExpectationElem.style.borderColor = "green";
        })
        .catch((error) => handleFirebaseErrors(error, window.location.href));
      }
    })
    .catch((error) => handleFirebaseErrors(error, window.location.href));
  }
}

document.getElementById("generalStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general'));

document.getElementById("student-general-info").addEventListener("dblclick", () => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        const role = idTokenResult.claims.role;
        if (role == 'dev' || role == 'admin' || role == 'secretary' ) {
          let queryStr = "?student=" + CURRENT_STUDENT_UID;
          window.location.href = "inquiry.html" + queryStr;
        }
      })
    }
  });
});

main();