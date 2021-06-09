let student_profile_data = {};
let student_notes_data = {};
let student_st_profile_data = {};

const CURRENT_STUDENT_UID = queryStrings()['student'];
const CURRENT_STUDENT_TYPE = "subjectTutoring";

main();
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
      student_profile_data = doc.data();
    }
  })
}

function getStudentNotes(studentUID) {
  const studentNotesRef = firebase.firestore().collection('Students').doc(studentUID).collection('Subject-Tutoring').doc('notes');
  return studentNotesRef.get()
  .then((doc) => {
    if (doc.exists) {
      student_notes_data = doc.data();
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

//all of the notes stuff
// function getNotes(type) {
//   const notes = studentNotesData[type];
//   let noteTimes = [];
//   for (const time in notes) {
//     noteTimes.push(parseInt(time));
//   }

//   noteTimes.sort((a,b) => {return a-b});
//   for (let i = 0; i < noteTimes.length; i++) {
//     setNotes(type, notes[noteTimes[i]]["note"], noteTimes[i], notes[noteTimes[i]]["user"], notes[noteTimes[i]]["isSessionNote"]);
//   }
// }

function getMessages(type) {
  const getStudentMessages = firebase.functions().httpsCallable('getStudentMessages');
  getStudentMessages({
    studentUID: CURRENT_STUDENT_UID,
    studentType: CURRENT_STUDENT_TYPE,
    conversationType: type,
  })
  .then((res) => {
    const messages = res.data;
    messages.forEach((message) => setMessage(message, type));
  })
  .catch((error) => {
    handleFirebaseErrors(error, window.location.href);
    console.log(error);
  })
}

function setMessage(mes, type) {
  const currentUser = firebase.auth().currentUser;
  currentUser.getIdTokenResult()
  .then((idTokenResult) => {
    const currentUserRole = idTokenResult.claims.role;

    //all the messages
    let messageBlock = document.getElementById('student-' + type + '-notes');
    //the div that contains the time and message
    let messageDiv = document.createElement('div');
    //the message itself
    let message = document.createElement('div');
    //time for the message
    let timeElem = document.createElement('p');

    //display the time above the mesasge
    timeElem.innerHTML = convertFromDateInt(mes.timestamp)['shortDate'];
    timeElem.classList.add('time');
    messageDiv.appendChild(timeElem);

    //set up the message
    message.innerHTML = mes.message;
    //author's name element
    let authorElem = document.createElement('p');
    authorElem.classList.add("author");
    message.appendChild(authorElem);
    authorElem.innerHTML = mes.author;

    //give the message an id
    messageDiv.setAttribute('data-id', mes.id);
    message.classList.add("student-note");

    //current user's message should be on the right
    if (mes.currentUserIsAuthor) {
      messageDiv.classList.add("right");
    }
    else {
      messageDiv.classList.add("left");
    }

    //see if the message is important
    if (mes.isImportant) {
      message.classList.add("important");
    }

    //only give the option to delete if the currentUser is the author, admin, or dev.
    if ((mes.currentUserIsAuthor || currentUserRole == "admin" || currentUserRole == "dev")) {
      let deleteMessage = document.createElement('div');
      deleteMessage.classList.add("delete");
      let theX = document.createElement('p');
      theX.innerHTML = "X";
      theX.classList.add('no-margins');
      deleteMessage.appendChild(theX);
      deleteMessage.addEventListener('click', (event) => deleteMessage(event));
      message.appendChild(deleteMessage);
    }
    
    messageDiv.appendChild(message);
    messageBlock.appendChild(messageDiv);
    document.getElementById('student-' + type + '-notes-input').value = null;
    
    messageDiv.scrollIntoView();
    // scrollBottomMessages(type);
  })
  .catch((error) =>  {
    handleFirebaseErrors(error, window.location.href);
    console.log(error);
  });
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
            scrollBottomMessages(type);
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
            scrollBottomMessages(type);
          })
          .catch((error) => handleFirebaseErrors(error, window.location.href));

          if (isSessionNote) {
            message.classList.add('session');
          }
          

          //only give the option to delete if the currentUser is the author, admin, or dev. Don't allow to delete if session notes
          if ((author == currentUser || role == "admin" || role == "dev") && !isSessionNote) {
            let deleteWrapper = document.createElement('div');
            deleteWrapper.classList.add("delete");
            let theX = document.createElement('p');
            theX.innerHTML = "X";
            theX.classList.add('no-margins');
            deleteWrapper.appendChild(theX);
            deleteWrapper.addEventListener('click', (event) => deleteMessage(event));
            message.appendChild(deleteWrapper);
          }
          
          messageDiv.appendChild(message);
          messageBlock.appendChild(messageDiv);
          document.getElementById('student-' + type + '-notes-input').value = null;
          messageDiv.scrollIntoView();
          scrollBottomMessages(type);
        }
      })
      .catch((error) =>  {
        handleFirebaseErrors(error, window.location.href);
        console.log(error);
      });
    }
  });
}

function deleteMessage(event) {
  let message = event.target.closest(".student-note").parentNode;
  let confirmation = confirm("Are you sure you want to delete this message?");
  if (confirmation) {
    const id = message.dataset.id;
    const messageDocRef = firebase.firestore().collection("Student-Chats").doc(id);
    messageDocRef.delete()
    .then(() => {
      message.remove();
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
    })
  }
}

function scrollBottomMessages(type) {
  let messages = document.getElementById("student-" + type + "-notes");
  messages.scrollTop = messages.scrollHeight;
}

function sendMessage(student, studentType, conversationType, message, timestamp, author) {
  const conversation = student + '-' + studentType + '-' + conversationType;
  const saveStudentMessage = firebase.functions().httpsCallable('saveStudentMessage');
  saveStudentMessage({
    conversation: conversation,
    timestamp: timestamp,
    message: message,
    author: author,
  })
  .then((result) => {
    const mes = result.data;
    setMessage(mes, conversationType);
  })
  .catch((error) => {
    console.log(error);
    handleFirebaseErrors(error, window.location.href);
  });
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

document.getElementById("student-general-notes-input").addEventListener('keydown', (event) =>  {
  if (event.repeat) {return};
  if (!event.ctrlKey && event.key == "Enter") {
    event.preventDefault();
    const currentUser = firebase.auth().currentUser.uid;
    const message = document.getElementById('student-general-notes-input').value;
    const time = new Date().getTime();
    sendMessage(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general', message, time, currentUser);
  }
});

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