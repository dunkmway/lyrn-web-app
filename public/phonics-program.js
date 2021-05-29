// Set the Fb objects
let current_lesson_data = undefined;
let student_phonics_program_profile_data = {};
let student_notes_data = {};
let student_profile_data = {};
let storage = firebase.storage();

// Flags
let note_flag = false;
let lesson_flag_counter = 0;

// Set other global variables
let session_date = new Date()
let css_colors = {'assigned' : 'yellow', 'needs help' : 'red', 'mastered' : 'green', 'not assigned' : 'blank'}

getLessons()
main();
function main() {
  retrieveInitialData()
  .then(() => {
    setStudentProfile();
    setStudentSTProfile();
    getNotes('log');
  })
}

const lesson_data = {'Consonants (Say, Sound, Write)' : ['b, f, m, k, r, t', 'p, j, h, s, n, d', 'c, l, g, w, y, v, z, q, x'], // These lessons are missing in Fb storage
                    'Short Vowels' : ['a', 'i', 'u', 'e', 'o'],
                    'Initial Consonant Blends' : ['bl, cl, fl, gl', 'sk, sl, pl', 'cr, dr, gr', 'br, fr, pr, tr', 'sm, sn, sp', 'st, sw, tw'],
                    'Final Consonat Blends' : ['-mp, -sk, -st', '-ft, -lt, -nt', '-lf, -lp, -nd, -nk'],
                    'Two and Three Letter Words' : ['Long vowel at end'],
                    'Silent -e Words' : ['Silent e', 'Silent e with blends'],
                    'Diagraphs / Trigraphs' : ['sh', 'th, wh', 'ch/tch', 'ng'],
                    'ee-ea' : ['ee-ea'],
                    'ai-ay' : ['ai-ay'],
                    'oa-ow' : ['oa-ow'],
                    'Compound Words' : ['Compound words'],
                    'Common Endings' : ['-ful, -ing, -est, -ed, -ness'],
                    'Rules for Syllable Division (Between 2-Consonants)' : ['VC/CV rule', 'VC/V rule'],
                    'Open and Closed Syllables' : ['Open/closed syllables'],
                    'Syllables ending in -y and -le' : ['Syllables ending in -y and -le'],
                    'Vowel and Digraph Syllables' : ['Vowel/digraph syllables'],
                    'Three-Syllable Words' : ['3-syllable words'],
                    'Three sounds of -ed' : ['-ed = (ed)', '-ed = (d/t)'],
                    'Word Families' : ['-all/-alk', '-old, -olt, -oll', '-ild, -ind', 'qu'],
                    'Three-Letter Blends' : ['thr, shr, scr', 'str, spr, spl'],
                    '-ey Words' : ['-ey words'],
                    'Vowel Plus r' : ['ar words', 'or', 'er, ir, ur', 'wor, war'],
                    'Second Sound of ea' : ['igh', 'oo', 'ea', 'ie'],
                    'Dipthongs' : ['oi/oy', 'ou/ow', 'au/aw', 'ew/ui/ue/ou'],
                    'Soft c and g and Silent Consonants' : ['Soft c', 'Soft g', '-dge', '-mb', 'kn', 'wr', 'Silent t', 'Silent h', 'ear = (air)', 'ph', 'ei/eigh'],
                    'Suffixes and Endings' : ['-ness, -less', '-ous, -or', '-ist, -ity', '-ture, -ment', '-able, -ible', '-sion, -tion', '-ance, -ence', '-tive, -sive', '-ify, -ize', 'endings']}

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
  let notesProm = getStudentNotes(student);
  let phonicsProgramProfileProm = getStudentPhonicsProgramProfile(student); 

  let promises = [profileProm, notesProm, phonicsProgramProfileProm];
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

function getStudentNotes(studentUId) {
  const studentNotesRef = firebase.firestore().collection('Students').doc(studentUId).collection('Phonics-Program').doc('notes');
  return studentNotesRef.get()
  .then((doc) => {
    if (doc.exists) {
      student_notes_data = doc.data();
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

function queryStrings() {
  var GET = {};
  var queryString = window.location.search.replace(/^\?/, '');
  queryString.split(/\&/).forEach(function(keyValuePair) {
      var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
      var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
      GET[paramName] = paramValue;
  });

  return GET;
}

function setStudentProfile() {
  document.getElementById('student-name').innerHTML = student_profile_data['studentFirstName'] + " " + student_profile_data['studentLastName'];
}

function setStudentSTProfile() {
  document.getElementById('student-expectation').innerHTML = student_phonics_program_profile_data['expectation'] || "No expectation set."
}

function updateStudentExpectation() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (role == 'admin' || role == 'dev' || role == 'secretary') {
          const studentUId = queryStrings()['student'];
          let studentExpectationElem = document.getElementById('student-expectation');
          let parent = studentExpectationElem.parentNode;
          let expectationTag = studentExpectationElem.tagName;
          if (expectationTag == "INPUT") {
            //update the goal and send it back to an H2 tag
            let expectationStr = studentExpectationElem.value;
            const studentPhonicsProgramRef = firebase.firestore().collection('Students').doc(studentUId).collection('Phonics-Program').doc('profile');
            studentPhonicsProgramRef.get()
            .then((doc) => {
              if(doc.exists) {
                studentPhonicsProgramRef.update({
                  expectation : expectationStr
                })
                .then(() => {
                  //remove the input and replace it with the text
                  studentExpectationElem.remove();
                  let newElem = document.createElement('h2');
                  newElem.id = 'student-expectation';
                  newElem.innerHTML = expectationStr;
                  parent.appendChild(newElem);
                })
                .catch((error) => handleFirebaseErrors(error, window.location.href));
              }
              else {
                studentPhonicsProgramRef.set({
                  expectation : expectationStr
                })
                .then(() => {
                  //remove the input and replace it with the text
                  studentExpectationElem.remove();
                  let newElem = document.createElement('h2');
                  newElem.id = 'student-expectation';
                  newElem.innerHTML = expectationStr;
                  parent.appendChild(newElem);
                })
                .catch((error) => handleFirebaseErrors(error, window.location.href));
              }
            })
          }
          else {
            //turn the element into an input to allow for changes
            let expectationStr = studentExpectationElem.innerHTML;
            studentExpectationElem.remove();
            let newElem = document.createElement('input');
            newElem.id = 'student-expectation';
            newElem.value = expectationStr;
            newElem.classList.add("expectation-input");
            parent.appendChild(newElem);
          }
        }
      })
      .catch((error) => handleFirebaseErrors(error, window.location.href));
    }
  });
}

//all of the notes stuff
function getNotes(type) {
  const notes = student_notes_data[type];
  let noteTimes = [];
  for (const time in notes) {
    noteTimes.push(parseInt(time));
  }

  noteTimes.sort((a,b) => {return a-b});
  for (let i = 0; i < noteTimes.length; i++) {
    setNotes(type, notes[noteTimes[i]]["note"], noteTimes[i], notes[noteTimes[i]]["user"], notes[noteTimes[i]]["isSessionNote"]);
  }
}

function setNotes(type, note, time, author, isSessionNote) {
  firebase.auth().onAuthStateChanged((user) => {
    const currentUser = user?.uid ?? null;
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (note) {
          //all the messages
          let messageBlock = document.getElementById('student-' + type + '-notes');
          //the div that contains the time and message
          let messageDiv = document.createElement('div');
          //the message itself
          let message = document.createElement('div');
          //time for the message
          let timeElem = document.createElement('p');

          //display the time above the mesasge
          timeElem.innerHTML = convertFromDateInt(time)['shortDate'];
          timeElem.classList.add('time');
          messageDiv.appendChild(timeElem);

          //set up the message
          message.innerHTML = note;
          //author's name element
          let authorElem = document.createElement('p');
          authorElem.classList.add("author");
          message.appendChild(authorElem);

          const getUserDisplayName = firebase.functions().httpsCallable('getUserDisplayName');
          getUserDisplayName({
            uid : author
          })
          .then((result) => {
            const authorName = result.data ?? "anonymous";
            authorElem.innerHTML = authorName;
            scrollBottomNotes(type);
          })
          .catch((error) => handleFirebaseErrors(error, window.location.href));

          messageDiv.setAttribute('data-time', time);
          message.classList.add("student-note");
          if (currentUser == author) {
            messageDiv.classList.add("right");
          }
          else {
            messageDiv.classList.add("left");
          }

          const getUserRole = firebase.functions().httpsCallable('getUserRole');
          getUserRole({
            uid : author
          })
          .then((result) => {
            const authorRole = result.data ?? null;
            if (authorRole == "admin") {
              message.classList.add("important");
            }
            scrollBottomNotes(type);
          })
          .catch((error) => handleFirebaseErrors(error, window.location.href));

          if (isSessionNote) {
            message.classList.add('session');
          }
          

          //only give the option to delete if the currentUser is the author, admin, or dev. Don't allow to delete if session notes
          if ((author == currentUser || role == "admin" || role == "dev") && !isSessionNote) {
            let deleteMessage = document.createElement('div');
            deleteMessage.classList.add("delete");
            let theX = document.createElement('p');
            theX.innerHTML = "X";
            theX.classList.add('no-margins');
            deleteMessage.appendChild(theX);
            deleteMessage.addEventListener('click', (event) => deleteNote(type, event));
            message.appendChild(deleteMessage);
          }
          
          messageDiv.appendChild(message);
          messageBlock.appendChild(messageDiv);
          document.getElementById('student-' + type + '-notes-input').value = null;
          scrollBottomNotes(type);
        }
      })
      .catch((error) =>  {
        handleFirebaseErrors(error, window.location.href);
        console.log(error);
      });
    }
  });
}

function deleteNote(type, event) {
  let message = event.target.closest(".student-note").parentNode;
  let confirmation = confirm("Are you sure you want to delete this message?");
  if (confirmation) {
    const currentStudent = queryStrings()['student'];
    const time = message.dataset.time;
    const studentNotesDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("Phonics-Program").doc("notes");
    studentNotesDocRef.update({
      [`${type}.${time}`] : firebase.firestore.FieldValue.delete()
    })
    .then(() => {
      message.remove();
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
    })
  }
}

function scrollBottomNotes(type) {
  let notes = document.getElementById("student-" + type + "-notes");
  notes.scrollTop = notes.scrollHeight;
}

function sendNotes(type, note, time, author, isSessionNote = false) {
  const data = {
    user : author,
    note : note,
    isSessionNote : isSessionNote
  } 

  const currentStudent = queryStrings()['student'];

  if (note) {
    //upload the note to firebase
    const studentNotesDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("Phonics-Program").doc("notes");
    studentNotesDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        return studentNotesDocRef.update({
          [`${type}.${time}`] : data
        })
        .then(() => {
          //send the note into the message div
          note_flag = true;
          setNotes(type, note, time, author, isSessionNote);
        })
        .catch((error) => {
          handleFirebaseErrors(error, window.location.href);
        });
      }
      else {
        return studentNotesDocRef.set({
          [`${type}`] : {
            [`${time}`] : data
          }
        })
        .then(() => {
          //send the note into the message div
          note_flag = true;
          setNotes(type, note, time, author, isSessionNote);
        })
        .catch((error) => {
          handleFirebaseErrors(error, window.location.href);
        });
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      console.log(error);
    });
  }
  else {
    return Promise.resolve("No note.")
  }
}

document.getElementById("student-log-notes-input").addEventListener('keydown', (event) =>  {
  if (!event.ctrlKey && event.key == "Enter") {
    event.preventDefault();
    const currentUser = firebase.auth().currentUser.uid;
    const note = document.getElementById('student-log-notes-input').value;
    const time = session_date.getTime();
    sendNotes('log', note, time, currentUser);
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
  let sections = Object.keys(lesson_data)
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
      populateLessons();
    })
    .then(() => resolve())
    .catch((error) => reject('Fb error:' + error))
  })
}

function submitLessons() {
  if (note_flag == true) {
    if (lesson_flag_counter > 0) {
      const confirmation = window.confirm("Are you sure you are ready to submit this session?");
      if (confirmation == true) {
        const student = queryStrings()['student'];
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
}

function openLesson(lesson) {

  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/Phonics Program/Lesson pdfs/' + (lesson.replaceAll('/', ', ')) + '.pdf');
  ref.getDownloadURL().then((url) => {
      open(url);
    })

}