let student_profile_data = {};
let student_notes_data = {};
let student_st_profile_data = {};

let currentClasses = [];
let currentGrades = [];
let isGradeUpdated = false;

const CURRENT_STUDENT_UID = queryStrings()['student'];
const CURRENT_STUDENT_TYPE = "subjectTutoring";

let storage = firebase.storage();

function main() {
  retrieveInitialData()
  .then(() => {
    setStudentProfile();
    setStudentSTProfile();
    setProfilePic();
    getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general');
    //getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'grades');
    setupStudentGrades(CURRENT_STUDENT_UID);
    allowExpectationChange();
  })
}

function retrieveInitialData() {
  let profileProm = getStudentProfile(CURRENT_STUDENT_UID);
  let stProfileProm = getStudentSTProfile(CURRENT_STUDENT_UID); 

  let promises = [profileProm, stProfileProm];
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

function setupStudentGrades(studentUID) {
  //place today's date into the first row
  document.getElementById('gradeToday').textContent = convertFromDateInt(new Date().getTime())['mm/dd/yyyy'];

  //fill in the classes
  const classes = student_st_profile_data.classes ?? [];

  for (let i = 0; i < 8; i++) {
    let newRow = document.createElement('th');
    newRow.innerHTML = `<div><span contentEditable onfocusout="updateCurrentClasses()">${classes[i] ?? 'no class'}</span></div>`;
    newRow.classList.add('rotate-45');
    document.getElementById('gradeTableHeaders').appendChild(newRow)
  }
  //add in the blank space
  let newRow = document.createElement('th');
  newRow.innerHTML = `<div><span</span></div>`;
  newRow.classList.add('rotate-45');
  document.getElementById('gradeTableHeaders').appendChild(newRow)

  //fill in the grades
  const grades = student_st_profile_data.grades ?? [];
  currentGrades = grades;

  grades.forEach(row => {
    const dateStr = row.date;
    const gradeList = row.grades;

    //check if grades have already been updated for today and instead place them in the first row
    if (dateStr == convertFromDateInt(new Date().getTime())['mm/dd/yyyy']) {
      isGradeUpdated = true;
      document.querySelectorAll('td[contentEditable="true"').forEach((element, index) => {
        element.textContent = gradeList[index];
      });
    }
    else {
      let newRow = document.createElement('tr');
      newRow.innerHTML = (`
        <th class="row-header">${dateStr}</th>
        <td>${gradeList[0] ?? ''}</td>
        <td>${gradeList[1] ?? ''}</td>
        <td>${gradeList[2] ?? ''}</td>
        <td>${gradeList[3] ?? ''}</td>
        <td>${gradeList[4] ?? ''}</td>
        <td>${gradeList[5] ?? ''}</td>
        <td>${gradeList[6] ?? ''}</td>
        <td>${gradeList[7] ?? ''}</td>
      `)
      document.getElementById('gradeTableBody').appendChild(newRow);
    }
  })
}

function updateCurrentClasses() {
  let classes = [];

  document.getElementById('gradeTableHeaders').querySelectorAll('span[contentEditable="true"]').forEach(classElement => {
    classes.push(classElement.textContent);
  })

  currentClasses = classes;
  console.log(currentClasses);

  firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('Subject-Tutoring').doc('profile').set({
    classes: currentClasses
  }, {merge : true})
  .then(() => {
    console.log('succesfully updates classes');
  })
  .catch((error) => {
    console.log(error);
  })
}

function updateGradeList() {
  let rowToday = {};
  let gradesToday = [];

  rowToday.date = document.getElementById('gradeToday').textContent;

  document.querySelectorAll('td[contentEditable="true"').forEach(element => {
    gradesToday.push(element.textContent);
  })

  rowToday.grades = gradesToday;
  //check if grades have already been updated for today
  if (!isGradeUpdated) {currentGrades.splice(0,0,rowToday);}
  else {currentGrades.splice(0,1,rowToday);}
  isGradeUpdated = true;

  firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('Subject-Tutoring').doc('profile').set({
    grades: currentGrades
  }, {merge : true})
  .then(() => {
  })
  .catch((error) => {
    console.log(error);
    alert('We are having issues right now updating this grade. Try again later.')
  })
}

function resetGrades() {
  if (!confirm('Are you sure you want to reset this students classes and grades? This action cannot be undone and will remove all data in THIS TABLE!')) {return}
  firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('Subject-Tutoring').doc('profile').update({
    grades: firebase.firestore.FieldValue.delete(),
    classes: firebase.firestore.FieldValue.delete()
  })
  .then(() => {
    console.log('succesfully reset table');
    location.reload();
  })
  .catch((error) => {
    console.log(error);
  })
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

function openHelp() {
  document.getElementById("helpModal").style.display = "flex";
}

function closeHelp(e) {
  if (e.target !== e.currentTarget) return;
  document.getElementById("helpModal").style.display = "none";
}

function setProfilePic() {
  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/ACT/Images/' + CURRENT_STUDENT_UID)
  ref.getDownloadURL()
  .then((url) => {
    document.getElementById('studentProfilePic').src=url;
  })
  .catch((error) => {
    console.log("No image found")
  })

  // Done allow a tutor to change the picture
  firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (role == 'tutor') {
          document.getElementById('fileLabel').style.display = 'none'
        }
      })
    }
  })
}


function updateProfilePic() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
        .then((idTokenResult) => {
          let role = idTokenResult.claims.role;
          if (role == 'admin' || role == 'dev' || role == 'secretary') {
            const data = document.getElementById('fileInput')
            //document.getElementById('studentProfilePic').style.src = data.files[0]
            let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/ACT/Images/' + CURRENT_STUDENT_UID)
            let thisref = ref.put(data.files[0])
            thisref.on('state_changed', function (snapshot) {


            }, function (error) {
              console.log(error)
            }, function () {
              // Uploaded completed successfully, now we can get the download URL
              thisref.snapshot.ref.getDownloadURL().then(function (downloadURL) {

                // Setting image
                document.getElementById('studentProfilePic').src = downloadURL;
              });
            });
          }
        })
    }
  })
}

main();