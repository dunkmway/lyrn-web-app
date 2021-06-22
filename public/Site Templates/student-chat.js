function getStudentMessages(studentUID, studentType, conversationType) {
  const getStudentMessages = firebase.functions().httpsCallable('getStudentMessages');
  getStudentMessages({
    studentUID: studentUID,
    studentType: studentType,
    conversationType: conversationType,
  })
  .then((res) => {
    const messages = res.data;
    messages.forEach((message) => setStudentMessage(message, conversationType));
  })
  .catch((error) => {
    handleFirebaseErrors(error, window.location.href);
    console.log(error);
  })
}

function setStudentMessage(mes, type) {
  const currentUser = firebase.auth().currentUser;
  currentUser.getIdTokenResult()
  .then((idTokenResult) => {
    const currentUserRole = idTokenResult.claims.role;

    //all the messages
    let messageBlock = document.getElementById(type + 'StudentMessages');
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
    message.classList.add("studentMessage");

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
      theX.classList.add('noMargins');
      deleteMessage.appendChild(theX);
      deleteMessage.addEventListener('click', (event) => deleteMessage(event));
      message.appendChild(deleteMessage);
    }
    
    messageDiv.appendChild(message);
    messageBlock.appendChild(messageDiv);
    document.getElementById(type + 'StudentMessagesInput').value = null;
    
    messageDiv.scrollIntoView();
    // scrollBottomMessages(type);
  })
  .catch((error) =>  {
    handleFirebaseErrors(error, window.location.href);
    console.log(error);
  });
}

function deleteStudentMessage(event) {
  let message = event.target.closest(".studentMessage").parentNode;
  let confirmation = confirm("Are you sure you want to delete this message?");
  if (confirmation) {
    const id = message.dataset.id;
    const messageDocRef = firebase.firestore().collection("Student-Chats").doc(id);
    messageDocRef.delete()
    .then(() => {
      message.remove();
      session_message_count -= 1;
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
    })
  }
}

function submitStudentMessage(event, studentUID, studentType, conversationType) {
  if (event.repeat) {return};
  if (!event.ctrlKey && event.key == "Enter") {
    event.preventDefault();
    const message = document.getElementById(conversationType + 'StudentMessagesInput').value;
    const time = new Date().getTime();
    sendStudentMessage(studentUID, studentType, conversationType, message, time);
  }
} 

function sendStudentMessage(studentUID, studentType, conversationType, message, timestamp) {
  const conversation = studentUID + '-' + studentType + '-' + conversationType;
  const saveStudentMessage = firebase.functions().httpsCallable('saveStudentMessage');
  saveStudentMessage({
    conversation: conversation,
    timestamp: timestamp,
    message: message,
  })
  .then((result) => {
    const mes = result.data;
    setStudentMessage(mes, conversationType);
    session_message_count += 1;
  })
  .catch((error) => {
    console.log(error);
    handleFirebaseErrors(error, window.location.href);
  });
}