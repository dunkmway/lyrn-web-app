// Set the Fb objects
let current_lesson_data = undefined;
let student_phonics_program_profile_data = {};
let student_profile_data = {};
let storage = firebase.storage();
let lesson_data = undefined;

// student info
const CURRENT_STUDENT_UID = queryStrings()['student'];
const CURRENT_STUDENT_TYPE = "phonicsProgram";

// Flags
let note_flag = false;
let lesson_flag_counter = 0;

// Set other global variables
let session_date = new Date()
let css_colors = {'assigned' : 'yellow', 'needs help' : 'red', 'mastered' : 'green', 'not assigned' : 'blank'}

main();
function main() {
  retrieveInitialData()
  .then(() => {
    setStudentProfile();
    setStudentSTProfile();
    setProfilePic();
    getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general');
    allowExpectationChange();
    getLessonNames();
  })
}

let lesson_list = document.getElementById('lessonList');

lesson_list.addEventListener('click', (e) => {
  if (e.target.className.includes('button2')) {
    let section = e.target.getAttribute('data-section');
    let lesson = e.target.getAttribute('data-lesson');
    if (current_lesson_data[section][lesson]['status'] == 'not assigned') {
      setObjectValue([section, lesson, 'date'], session_date.getTime(), current_lesson_data);
      setObjectValue([section, lesson, 'status'], 'needs help', current_lesson_data);
      lesson_flag_counter += 1;
      populateLessons()
    }
    else if (current_lesson_data[section][lesson]['status'] == 'needs help') {
      setObjectValue([section, lesson, 'date'], session_date.getTime(), current_lesson_data);
      setObjectValue([section, lesson, 'status'], 'assigned', current_lesson_data);
      lesson_flag_counter += 1;
      populateLessons()
    }
    else if (current_lesson_data[section][lesson]['status'] == 'assigned') {
      setObjectValue([section, lesson, 'date'], session_date.getTime(), current_lesson_data);
      setObjectValue([section, lesson, 'status'], 'mastered', current_lesson_data);
      lesson_flag_counter += 1;
      populateLessons()
    }
    else if (current_lesson_data[section][lesson]['status'] == 'mastered') {
      setObjectValue([section, lesson, 'date'], 0, current_lesson_data);
      setObjectValue([section, lesson, 'status'], 'not assigned', current_lesson_data);
      lesson_flag_counter -= 3;
      populateLessons()
    }
  }
})

function retrieveInitialData() {
  let student = queryStrings()['student'];

  let profileProm = getStudentProfile(student);
  let phonicsProgramProfileProm = getStudentPhonicsProgramProfile(student); 

  let promises = [profileProm, phonicsProgramProfileProm];
  return Promise.all(promises);
}

function getStudentProfile(studentUId) {
  const studentProfileRef = firebase.firestore().collection('Students').doc(studentUId);
  return studentProfileRef.get()
  .then((doc) => {
    if (doc.exists) {
      student_profile_data = doc.data();
    }
  })
}

function getStudentPhonicsProgramProfile(studentUId) {
  const studentPhonicsProgramRef = firebase.firestore().collection('Students').doc(studentUId).collection('Phonics-Program').doc('profile');
  return studentPhonicsProgramRef.get()
  .then((doc) => {
    if (doc.exists) {
      student_phonics_program_profile_data = doc.data();
    }
  })
}

function setStudentProfile() {
  document.getElementById('student-name').innerHTML = student_profile_data['studentFirstName'] + " " + student_profile_data['studentLastName'];
}

function setStudentSTProfile() {
  document.getElementById('student-expectation').innerHTML = student_phonics_program_profile_data['expectation'] || "No expectation set."
}

function updateStudentExpectation(event) {
  if (event.repeat) {return};
  if (!event.ctrlKey && event.key == "Enter") {
    event.preventDefault();
    let studentExpectationElem = document.getElementById('student-expectation');
    let expectationStr = studentExpectationElem.value;

    studentExpectationElem.style.borderColor = null;

    const studentMathProgramProfileRef = firebase.firestore().collection('Students').doc(queryStrings()['student']).collection('Phonics-Program').doc('profile');
    studentMathProgramProfileRef.get()
    .then((doc) => {
      if(doc.exists) {
        studentMathProgramProfileRef.update({
          expectation : expectationStr
        })
        .then(() => {
          studentExpectationElem.style.borderColor = "green";
        })
        .catch((error) => handleFirebaseErrors(error, window.location.href));
      }
      else {
        studentMathProgramProfileRef.set({
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

document.getElementById("generalStudentMessagesInput").addEventListener('keydown', (event) =>  {
  if (event.key == 'Enter') {
    note_flag = true;
    submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general');
  }
});

function removeLessons() {
  let children = lesson_list.querySelectorAll('div');
  const numChildren = children.length;
  for (let child = 0; child < numChildren; child++) {
    children[child].remove()
  }
}

function populateLessons() {
  removeLessons();

  // Add the lessons
  let sections = lesson_data['order']

  for (let i = 0; i < sections.length; i++) {
    // Add the section
    const element1 = createElement('div', ['sectionGridBox'], [], [], sections[i])
    const element2 = createElement('div', ['sectionGridBox'], [], [], "")
    element1.style.fontWeight = 'bold'
    lesson_list.append(element1);
    lesson_list.append(element2);
    
    // Add the lessons
    for (let j = 0; j < Object.values(lesson_data[sections[i]]).length; j++) {
      const lesson = lesson_data[sections[i]][j]
      const element1 = createElement('div', ['gridBox'], ['onclick'], ["openLesson('" + lesson + "')"] , lesson);
      element1.style.cursor = 'pointer';
      const element2 = createElement('div', ['gridBox', 'button2'], ['data-section', 'data-lesson'], [sections[i], lesson], "")
      element2.classList.add(css_colors[current_lesson_data[sections[i]][lesson]['status']])
      if (current_lesson_data[sections[i]][lesson]['date'] != 0) {
        element2.innerHTML = convertFromDateInt(current_lesson_data[sections[i]][lesson]['date'])['shortDate'];
      }
      lesson_list.append(element1);
      lesson_list.append(element2);
    }
  }
}

function initializeEmptyLessonsMap() {
  current_lesson_data = {}
  const sections = Object.keys(lesson_data);

  // Remove 'order' from sections
  const index = sections.indexOf('order');
  if (index > -1) {
    sections.splice(index, 1);
  }

  let lessons = undefined;
  for (let i = 0; i < sections.length; i++) {
    lessons = Object.values(lesson_data[sections[i]]);
    for (let j = 0; j < lessons.length; j++) {
      setObjectValue([sections[i], lessons[j], 'date'], 0, current_lesson_data);
      setObjectValue([sections[i], lessons[j], 'status'], 'not assigned', current_lesson_data);
    }
  }
}

/**
 * create html element
 * @param {String} elementType tag name for the element that will be created
 * @param {[String]} classes classes for the element
 * @param {[String]} attributes attributes for the element
 * @param {[String]} values values for each attribute for the element
 * @param {String} text innerhtml for the element
 * @returns {HTMLElement} html element of the given tag
 */
function createElement(elementType, classes = [], attributes = [], values = [], text = "") {
  // Initialize the element
  let element = document.createElement(elementType);

  // Set each of the specified attributes for the element
  if (attributes.length == values.length && attributes.length > 0) {
    for (let i = 0; i < attributes.length; i++) {
      element.setAttribute(attributes[i], values[i]);
    }
  }

  // Add the classes to the element
  for (let i = 0; i < classes.length; i++) {
    element.classList.add(classes[i]);
  }

  // Set the inner html text
  if (text != "") {
    element.innerHTML = text;
  }

  // Return the element
  return element;
}

function getLessons() {
  return new Promise((resolve, reject) => {
    let student = queryStrings()['student'];
    lessonsRef = firebase.firestore().collection('Students').doc(student).collection('Phonics-Program').doc('lessons')

    lessonsRef.get()
    .then((doc) => {
      if (doc.exists) {
        current_lesson_data = doc.data();
      }
      else {
        if (current_lesson_data == undefined) {
          initializeEmptyLessonsMap();
        }
      }
      checkForMissingLessons();
      populateLessons();
    })
    .then(() => resolve())
    .catch((error) => reject('Fb error:' + error))
  })
}

function checkForMissingLessons() {
  console.log("checking")
  const sections = Object.keys(lesson_data)
  for (let i = 0; i < sections.length; i++) {
    if (sections[i] != 'order') {
      if (!(sections[i] in current_lesson_data)) {
        let obj = {}
        for (let j = 0; j < lesson_data[sections[i]].length; j++) {
          obj[lesson_data[sections[i]]] = {'date' : 0, 'status' : 'not assigned'}
        }
        setObjectValue([sections[i]], obj, current_lesson_data)
      }
      else {
        for (let j = 0; j < lesson_data[sections[i]].length; j++) {
          const lesson = lesson_data[sections[i]][j]
          if (!(lesson in current_lesson_data[sections[i]])) {
            setObjectValue([sections[i], lesson], {'date' : 0, 'status' : 'not assigned'}, current_lesson_data)
          }
        }
      }
    }
  }
}

function submitLessons() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        user.getIdTokenResult()
        .then((idTokenResult) => {
          let role = idTokenResult.claims.role;
          if (note_flag == true || role == 'admin' || role == 'dev') {
            if (lesson_flag_counter > 0 || role == 'admin' || role == 'dev') {
              let confirmation = undefined
              if (role == 'admin' || role == 'dev') {
                confirmation = window.confirm("Are you sure you are ready submit your changes");
              }
              else {
                confirmation = window.confirm("Are you sure you are ready to submit this session?");
              }
              if (confirmation == true) {
                let student = queryStrings()['student'];
                lessonsRef = firebase.firestore().collection('Students').doc(student).collection('Phonics-Program').doc('lessons')

                lessonsRef.set(current_lesson_data).then(() => goToDashboard())
                .catch((error) => reject('Fb error:' + error))
              }
            }
            else {
              document.getElementById('errorMessage').innerHTML = 'Please mark a lesson'
            }
          }
          else {
            document.getElementById('errorMessage').innerHTML = 'Please enter a comment for what occurred during the session'
          }
      })
      .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      });
    }
    else {
      console.log("bad user")
    }
  })
}

function openLesson(lesson) {

  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/Phonics Program/Lesson pdfs/' + (lesson.replaceAll('/', ', ')) + '.pdf');
  ref.getDownloadURL().then((url) => {
      open(url);
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

function getLessonNames() {
  let ref = firebase.firestore().collection('Dynamic-Content').doc('phonics-program-lessons')
  ref.get()
  .then((doc) => {
    lesson_data = doc.data()['lessons']
    getLessons()
  })
  .catch((error) => handleFirebaseErrors(error, window.location.href));
}

// document.getElementById("student-general-info").addEventListener("dblclick", () => {
//   firebase.auth().onAuthStateChanged((user) => {
//     if (user) {
//       user.getIdTokenResult()
//       .then((idTokenResult) => {
//         let role = idTokenResult.claims.role;
//         if (role == 'dev' || role == 'admin' || role == 'secretary' ) {
//           const studentUID = queryStrings()['student']
//           let queryStr = "?student=" + studentUID;
//           window.location.href = "inquiry.html" + queryStr;
//         }
//       })
//     }
//   });
// });

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