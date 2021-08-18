// Set variables coming from Fb
let student_profile_data = {};
let student_math_program_profile_data = {};
let current_lesson_data = undefined; // Student's lesson data
let lesson_info = undefined; // Names for each of the lessons to be taught in the program
let program_links = undefined; // Links to Khan academy

// student info
const CURRENT_STUDENT_UID = queryStrings()['student'];
const CURRENT_STUDENT_TYPE = "mathProgram";

// Set the math program data
let student_grade = 0;
let note_flag = false;
let lesson_flag_counter = 0;
let session_date = new Date()
let css_colors = {'assigned' : 'yellow', 'needs help' : 'red', 'mastered' : 'green', 'not assigned' : 'blank'}
let storage = firebase.storage();

function main() {
  retrieveInitialData()
  .then(() => {
    setStudentProfile();
    setStudentSTProfile();
    setProfilePic();
    getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general');
    allowExpectationChange();
    getLessonNames();
    getLinks();
  })
}
main();

let grade_element = document.getElementById('student-grade')
grade_element.addEventListener('change', (e) => {
  student_grade = e.target.value;
  current_lesson_data['grade'] = student_grade;
  populateLessons()
})

let lesson_list = document.getElementById('lessonList');
lesson_list.addEventListener('click', (e) => {
  if (e.target.getAttribute('onclick') == undefined && e.target.className.includes('button2')) {
    let section = e.target.getAttribute('data-section');
    let lesson = e.target.getAttribute('data-lesson');

    // Make sure the lesson and section exist
    if (current_lesson_data[student_grade]?.[section]?.[lesson] == undefined) {
      setObjectValue([student_grade, section, lesson, 'date'], session_date.getTime(), current_lesson_data);
      setObjectValue([student_grade, section, lesson, 'status'], 'needs help', current_lesson_data);
    }

    if (current_lesson_data[student_grade][section][lesson]['status'] == 'not assigned') {
      setObjectValue([student_grade, section, lesson, 'date'], session_date.getTime(), current_lesson_data);
      setObjectValue([student_grade, section, lesson, 'status'], 'needs help', current_lesson_data);
      lesson_flag_counter += 1;
      populateLessons()
    }
    else if (current_lesson_data[student_grade][section][lesson]['status'] == 'needs help') {
      setObjectValue([student_grade, section, lesson, 'date'], session_date.getTime(), current_lesson_data);
      setObjectValue([student_grade, section, lesson, 'status'], 'assigned', current_lesson_data);
      lesson_flag_counter += 1;
      populateLessons()
    }
    else if (current_lesson_data[student_grade][section][lesson]['status'] == 'assigned') {
      setObjectValue([student_grade, section, lesson, 'date'], session_date.getTime(), current_lesson_data);
      setObjectValue([student_grade, section, lesson, 'status'], 'mastered', current_lesson_data);
      lesson_flag_counter += 1;
      populateLessons()
    }
    else if (current_lesson_data[student_grade][section][lesson]['status'] == 'mastered') {
      setObjectValue([student_grade, section, lesson, 'date'], 0, current_lesson_data);
      setObjectValue([student_grade, section, lesson, 'status'], 'not assigned', current_lesson_data);
      lesson_flag_counter -= 3;
      populateLessons()
    }
  }
})

function retrieveInitialData() {
  let student = queryStrings()['student'];

  let profileProm = getStudentProfile(student);
  let stProfileProm = getStudentMathProgramProfile(student); 

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

function getStudentMathProgramProfile(studentUID) {
  const studentMathProgramProfileRef = firebase.firestore().collection('Students').doc(studentUID).collection('Math-Program').doc('profile');
  return studentMathProgramProfileRef.get()
  .then((doc) => {
    if (doc.exists) {
      student_math_program_profile_data = doc.data();
    }
  })
}

function setStudentProfile() {
  document.getElementById('student-name').innerHTML = student_profile_data['studentFirstName'] + " " + student_profile_data['studentLastName'];
}

function setStudentSTProfile() {
  document.getElementById('student-expectation').innerHTML = student_math_program_profile_data['expectation'] || "No expectation set."
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

    const studentMathProgramProfileRef = firebase.firestore().collection('Students').doc(queryStrings()['student']).collection('Math-Program').doc('profile');
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
// =======
// //all of the notes stuff
// function getNotes(type) {
//   const notes = student_notes_data[type];
//   let noteTimes = [];
//   for (const time in notes) {
//     noteTimes.push(parseInt(time));
//   }

//   noteTimes.sort((a,b) => {return a-b});
//   for (let i = 0; i < noteTimes.length; i++) {
//     setNotes(type, notes[noteTimes[i]]["note"], noteTimes[i], notes[noteTimes[i]]["user"], notes[noteTimes[i]]["isSessionNote"]);
//   }
// }

// function setNotes(type, note, time, author, isSessionNote) {
//   firebase.auth().onAuthStateChanged((user) => {
//     const currentUser = user?.uid ?? null;
//     if (user) {
//       user.getIdTokenResult()
//       .then((idTokenResult) => {
//         let role = idTokenResult.claims.role;
//         if (note) {
//           //all the messages
//           let messageBlock = document.getElementById('student-' + type + '-notes');
//           //the div that contains the time and message
//           let messageDiv = document.createElement('div');
//           //the message itself
//           let message = document.createElement('div');
//           //time for the message
//           let timeElem = document.createElement('p');

//           //display the time above the mesasge
//           timeElem.innerHTML = convertFromDateInt(time)['shortDate'];
//           timeElem.classList.add('time');
//           messageDiv.appendChild(timeElem);

//           //set up the message
//           message.innerHTML = note;
//           //author's name element
//           let authorElem = document.createElement('p');
//           authorElem.classList.add("author");
//           message.appendChild(authorElem);

//           const getUserDisplayName = firebase.functions().httpsCallable('getUserDisplayName');
//           getUserDisplayName({
//             uid : author
//           })
//           .then((result) => {
//             const authorName = result.data ?? "anonymous";
//             authorElem.innerHTML = authorName;
//             scrollBottomNotes(type);
//           })
//           .catch((error) => handleFirebaseErrors(error, window.location.href));

//           messageDiv.setAttribute('data-time', time);
//           message.classList.add("student-note");
//           if (currentUser == author) {
//             messageDiv.classList.add("right");
//           }
//           else {
//             messageDiv.classList.add("left");
//           }

//           const getUserRole = firebase.functions().httpsCallable('getUserRole');
//           getUserRole({
//             uid : author
//           })
//           .then((result) => {
//             const authorRole = result.data ?? null;
//             if (authorRole == "admin") {
//               message.classList.add("important");
//             }
//             scrollBottomNotes(type);
//           })
//           .catch((error) => handleFirebaseErrors(error, window.location.href));

//           if (isSessionNote) {
//             message.classList.add('session');
//           }
          

//           //only give the option to delete if the currentUser is the author, admin, or dev. Don't allow to delete if session notes
//           if ((author == currentUser || role == "admin" || role == "dev") && !isSessionNote) {
//             let deleteMessage = document.createElement('div');
//             deleteMessage.classList.add("delete");
//             let theX = document.createElement('p');
//             theX.innerHTML = "X";
//             theX.classList.add('no-margins');
//             deleteMessage.appendChild(theX);
//             deleteMessage.addEventListener('click', (event) => deleteNote(type, event));
//             message.appendChild(deleteMessage);
//           }
          
//           messageDiv.appendChild(message);
//           messageBlock.appendChild(messageDiv);
//           document.getElementById('student-' + type + '-notes-input').value = null;
//           scrollBottomNotes(type);
//         }
//       })
//       .catch((error) =>  {
//         handleFirebaseErrors(error, window.location.href);
//         console.log(error);
//       });
//     }
//   });
// }

// function deleteNote(type, event) {
//   let message = event.target.closest(".student-note").parentNode;
//   let confirmation = confirm("Are you sure you want to delete this message?");
//   if (confirmation) {
//     const currentStudent = queryStrings()['student'];
//     const time = message.dataset.time;
//     const studentNotesDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("Math-Program").doc("notes");
//     studentNotesDocRef.update({
//       [`${type}.${time}`] : firebase.firestore.FieldValue.delete()
//     })
//     .then(() => {
//       message.remove();
//     })
//     .catch((error) => {
//       handleFirebaseErrors(error, window.location.href);
//     })
//   }
// }

// function scrollBottomNotes(type) {
//   let notes = document.getElementById("student-" + type + "-notes");
//   notes.scrollTop = notes.scrollHeight;
// }

// function sendNotes(type, note, time, author, isSessionNote = false) {
//   const data = {
//     user : author,
//     note : note,
//     isSessionNote : isSessionNote
//   } 

//   const currentStudent = queryStrings()['student'];

//   if (note) {
//     //upload the note to firebase
//     const studentNotesDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("Math-Program").doc("notes");
//     studentNotesDocRef.get()
//     .then((doc) => {
//       if (doc.exists) {
//         return studentNotesDocRef.update({
//           [`${type}.${time}`] : data
//         })
//         .then(() => {
//           //send the note into the message div
//           note_flag = true;
//           setNotes(type, note, time, author, isSessionNote);
//         })
//         .catch((error) => {
//           handleFirebaseErrors(error, window.location.href);
//         });
//       }
//       else {
//         return studentNotesDocRef.set({
//           [`${type}`] : {
//             [`${time}`] : data
//           }
//         })
//         .then(() => {
//           //send the note into the message div
//           note_flag = true;
//           setNotes(type, note, time, author, isSessionNote);
//         })
//         .catch((error) => {
//           handleFirebaseErrors(error, window.location.href);
//         });
//       }
//     })
//     .catch((error) => {
//       handleFirebaseErrors(error, window.location.href);
//       console.log(error);
//     });
//   }
//   else {
//     return Promise.resolve("No note.")
//   }
// }

// document.getElementById("student-log-notes-input").addEventListener('keydown', (event) =>  {
//   if (!event.ctrlKey && event.key == "Enter") {
//     event.preventDefault();
//     const currentUser = firebase.auth().currentUser.uid;
//     const note = document.getElementById('student-log-notes-input').value;
//     const time = new Date().getTime();
//     sendNotes('log', note, time, currentUser);
//   }
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
  document.getElementById('programLink').setAttribute('href', program_links[student_grade])
  let gradeLessons = lesson_info[student_grade]

  // Add the lessons
  //let sections = Object.keys(gradeLessons)
  let sections = gradeLessons['order']
  for (let i = 0; i < sections.length; i++) {
    // Add the section
    const element1 = createElement('div', ['sectionGridBox'], [], [], sections[i])
    const element2 = createElement('div', ['sectionGridBox'], [], [], "")
    element1.style.fontWeight = 'bold'
    lesson_list.append(element1);
    lesson_list.append(element2);
    
    // Add the lessons
    for (let j = 0; j < Object.values(gradeLessons[sections[i]]).length; j++) {
      const lesson = gradeLessons[sections[i]][j]
      let element1 = undefined
      if (sections[i] == 'Tests') {
        element1 = createElement('div', ['gridBox', 'button2'], ['onclick'], ["openTest('" + lesson.split('-')[0] + "')"] , lesson);
      }
      else if (sections[i] == 'Multiplication Tables') {
        element1 = createElement('div', ['gridBox', 'button2'], ['onclick'], ["openMultiplicationTable('" + lesson + "')"] , lesson);
      }
      else {
        element1 = createElement('div', ['gridBox'], [], [] , lesson);
      }
      const element2 = createElement('div', ['gridBox', 'button2'], ['data-section', 'data-lesson'], [sections[i], lesson], "")
      if (current_lesson_data[student_grade]?.[sections[i]]?.[lesson]?.['date'] != undefined) {
        element2.classList.add(css_colors[current_lesson_data[student_grade][sections[i]][lesson]['status']])
        if (current_lesson_data[student_grade]?.[sections[i]]?.[lesson]?.['date'] != 0) {
          element2.innerHTML = convertFromDateInt(current_lesson_data[student_grade][sections[i]][lesson]['date'])['shortDate'];
        }
      }
      lesson_list.append(element1);
      lesson_list.append(element2);
    }
  }
}

function initializeEmptyLessonsMap() {
  current_lesson_data = {'grade' : student_grade, 0 : {}, 1 : {}, 2 : {}, 3 : {}, 4 : {}, 5 : {}, 6 : {}, 7 : {}, 8 : {}, 9 : {}, 10 : {}, 11 : {}, 12 : {}};
  for (let g = 0; g < 13; g++) {
    const gradeLessons = lesson_info[g]
    const sections = Object.keys(gradeLessons);
    let lessons = undefined;
    let tmp = {};
    for (let i = 0; i < sections.length; i++) {
      if (sections[i] != 'order') {
        lessons = Object.values(gradeLessons[sections[i]]);
        for (let j = 0; j < lessons.length; j++) {
          setObjectValue([sections[i], lessons[j], 'date'], 0, tmp);
          setObjectValue([sections[i], lessons[j], 'status'], 'not assigned', tmp);
        }
      }
    }
    setObjectValue([g], tmp, current_lesson_data)
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
    lessonsRef = firebase.firestore().collection('Students').doc(student).collection('Math-Program').doc('lessons')

    lessonsRef.get()
    .then((doc) => {
      if (doc.exists) {
        current_lesson_data = doc.data();
        student_grade = doc.data()['grade'];
      }
      else {
        if (current_lesson_data == undefined) {
          initializeEmptyLessonsMap();
        }
      }
    })
    .then(() => {
      updateStudentLessonInfo();
      populateLessons();
      document.getElementById('student-grade').value = student_grade;
      resolve();})
    .catch((error) => reject('Fb error:' + error))
  })
}

function submitLessons() {
  document.getElementById('errorMessage').style.display = 'none'
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
                lessonsRef = firebase.firestore().collection('Students').doc(student).collection('Math-Program').doc('lessons')

                lessonsRef.set(current_lesson_data).then(() => goToDashboard())
                .catch((error) => reject('Fb error:' + error))
              }
            }
            else {
              document.getElementById('errorMessage').style.display = 'block'
              document.getElementById('errorMessage').innerHTML = 'Please mark a lesson'
            }
          }
          else {
            document.getElementById('errorMessage').style.display = 'block'
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

function openHelp() {
  document.getElementById("helpModal").style.display = "flex";
}

function closeHelp(e) {
  if (e.target !== e.currentTarget) return;
  document.getElementById("helpModal").style.display = "none";
}

function getLessonNames() {
  let ref = firebase.firestore().collection('Dynamic-Content').doc('math-program-lessons')
  ref.get()
  .then((doc) => {
    lesson_info = doc.data()['lessons']
    getLessons()
  })
  .catch((error) => handleFirebaseErrors(error, window.location.href));
}

function getLinks() {
  let ref = firebase.firestore().collection('Dynamic-Content').doc('math-program-links')
  ref.get()
  .then((doc) => {
    program_links = doc.data()['links']
  })
  .catch((error) => handleFirebaseErrors(error, window.location.href));
}

function openTest(type) {

  if (type == 'Pre' || type == 'Post') {
    let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/Math Program/' + type + ' Test - ' + student_grade.toString() + '.pdf');
    ref.getDownloadURL().then((url) => {
      open(url);
    })
  }

}

function openMultiplicationTable(number) {

  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/Math Program/Multiplication Tables/' + number + '.pdf');
  ref.getDownloadURL().then((url) => {
    open(url);
  })

}

function updateStudentLessonInfo() {
  let obj = {}
  const grades = Object.keys(lesson_info)
  for (let i = 0; i < grades.length; i++) {
    if (!(grades[i] in current_lesson_data)) {
      obj = {}
      setObjectValue([grades[i]], obj, current_lesson_data)
    }
    const sections = Object.keys(lesson_info[grades[i]])
    const lessons = Object.values(lesson_info[grades[i]])
    for (let j = 0; j < sections.length; j++) {
      if (!(sections[j] in current_lesson_data[grades[i]])) {
        obj = {}
        setObjectValue([grades[i], sections[j]], obj, current_lesson_data)
      }
      for (let k = 0; k < lessons[j].length; k++) {
        if (!(lessons[j][k] in current_lesson_data[grades[i]][sections[j]])) {
          obj = {}
          setObjectValue([grades[i], sections[j], lessons[j][k]], obj, current_lesson_data)
          setObjectValue([grades[i], sections[j], lessons[j][k], 'date'],   0, current_lesson_data)
          setObjectValue([grades[i], sections[j], lessons[j][k], 'status'], 'not assigned', current_lesson_data)
        }
      }
    }
  }
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