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
  console.log(mes);
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