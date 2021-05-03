let studentProfileData = {};
let studentNotesData = {};
let studentSTProfileData = {};

main();
function main() {
  retrieveInitialData()
  .then(() => {
    setStudentProfile();
    setStudentSTProfile();
    getNotes('log');
  })
}

function retrieveInitialData() {
  let student = queryStrings()['student'];

  let profileProm = getStudentProfile(student);
  let notesProm = getStudentNotes(student);
  let stProfileProm = getStudentSTProfile(student); 

  let promises = [profileProm, notesProm, stProfileProm];
  return Promise.all(promises);
}

function getStudentProfile(studentUID) {
  const studentProfileRef = firebase.firestore().collection('Students').doc(studentUID);
  return studentProfileRef.get()
  .then((doc) => {
    if (doc.exists) {
      studentProfileData = doc.data();
    }
  })
}

function getStudentNotes(studentUID) {
  const studentNotesRef = firebase.firestore().collection('Students').doc(studentUID).collection('Subject-Tutoring').doc('notes');
  return studentNotesRef.get()
  .then((doc) => {
    if (doc.exists) {
      studentNotesData = doc.data();
    }
  })
}

function getStudentSTProfile(studentUID) {
  const studentSTProfileRef = firebase.firestore().collection('Students').doc(studentUID).collection('Subject-Tutoring').doc('profile');
  return studentSTProfileRef.get()
  .then((doc) => {
    if (doc.exists) {
      studentSTProfileData = doc.data();
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
  document.getElementById('student-name').innerHTML = studentProfileData['studentFirstName'] + " " + studentProfileData['studentLastName'];
}

function setStudentSTProfile() {
  document.getElementById('student-expectation').innerHTML = studentSTProfileData['expectation'] || "No expectation set."
}

function updateStudentExpectation() {
  const studentUID = queryStrings()['student'];
  let studentExpectationElem = document.getElementById('student-expectation');
  let parent = studentExpectationElem.parentNode;
  let expectationTag = studentExpectationElem.tagName;
  if (expectationTag == "INPUT") {
    //update the goal and send it back to an H2 tag
    let expectationStr = studentExpectationElem.value;
    const studentSTProfileRef = firebase.firestore().collection('Students').doc(studentUID).collection('Subject-Tutoring').doc('profile');
    studentSTProfileRef.get()
    .then((doc) => {
      if(doc.exists) {
        studentSTProfileRef.update({
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
        .catch((error) => handleFirebaseErrors(error, document.currentScript.src));
      }
      else {
        studentSTProfileRef.set({
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
        .catch((error) => handleFirebaseErrors(error, document.currentScript.src));
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

//all of the notes stuff
function getNotes(type) {
  const notes = studentNotesData[type];
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
          .catch((error) => handleFirebaseErrors(error, document.currentScript.src));

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
          .catch((error) => handleFirebaseErrors(error, document.currentScript.src));

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
        handleFirebaseErrors(error, document.currentScript.src);
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
    const studentNotesDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("Subject-Tutoring").doc("notes");
    studentNotesDocRef.update({
      [`${type}.${time}`] : firebase.firestore.FieldValue.delete()
    })
    .then(() => {
      message.remove();
    })
    .catch((error) => {
      handleFirebaseErrors(error, document.currentScript.src);
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
    const studentNotesDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("Subject-Tutoring").doc("notes");
    studentNotesDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        return studentNotesDocRef.update({
          [`${type}.${time}`] : data
        })
        .then(() => {
          //send the note into the message div
          setNotes(type, note, time, author, isSessionNote);
        })
        .catch((error) => {
          handleFirebaseErrors(error, document.currentScript.src);
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
          setNotes(type, note, time, author, isSessionNote);
        })
        .catch((error) => {
          handleFirebaseErrors(error, document.currentScript.src);
        });
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, document.currentScript.src);
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
    const time = new Date().getTime();
    sendNotes('log', note, time, currentUser);
  }
});