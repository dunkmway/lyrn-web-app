let test_view_type = 'none';
let testAnswers = {};
let testData;
fetch("../Test Data/Tests.json").then(response => response.json()).then(data => testData = JSON.parse(data));

function initialSetup() {
  const studentUID = queryStrings()["student"];

  if (studentUID) {
    //get the student's general data
    const studentDocRef = firebase.firestore().collection("Students").doc(studentUID);
    studentDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        let studentFirstName = doc.get("studentFirstName");
        let studentLastName = doc.get("studentLastName");

        let studentNameElem = document.getElementById("studentName");
        studentNameElem.textContent = studentFirstName + " " + studentLastName;
      }
    })
    .catch((error) => {
      console.log(error);
      console.log(error.code);
      console.log(error.message);
      console.log(error.details);
    });
  }
}

function createElements(elementType = [], classes = [], attributes = [], values = [], text = [], flexType = "input-row") {
  if (elementType.length >= 0) {
    let elements = createElement("div", flexType);

    if (attributes.length == values.length && attributes.length >= 0) {
      for (let i = 0; i < elementType.length; i++) {
        elements.appendChild(createElement(elementType[i], classes[i], attributes[i], values[i], text[i]));
      }
    }

    return elements;

  }
}

  function createElement(elementType, classes = "", attributes = [], values = [], text = "") {
    let question = document.createElement(elementType);

    if (attributes.length == values.length && attributes.length > 0) {
      for (let i = 0; i < attributes.length; i++) {
        question.setAttribute(attributes[i], values[i]);
      }
    }

    if (classes != "") {
      question.className = classes;
    }

    if (text != "") {
      question.innerHTML = text;
    }
    return question;

  }

  function combineElements(objects = [], flexType = "input-row")
  {
    let item = createElement("div", flexType, [], [], "");

    if (objects.length > 1)
    {
      for (let i = 0; i < objects.length; i++)
      {
        item.appendChild(objects[i]);
      }
    }

    return item;

  }

function addSession(self) {
  session_count = document.querySelectorAll("div[id^=\"session\"]").length;
  ele = document.getElementById("session1").cloneNode(true);
  ele.id = "session" + (session_count + 1).toString();
  ele.querySelector("label[for=\"time1\"]").htmlFor = "time" + (session_count + 1).toString();
  ele.querySelector("#time1").id = "time" + (session_count + 1).toString();
  ele.querySelector("label[for=\"section1\"]").htmlFor = "section" + (session_count + 1).toString();
  ele.querySelector("#section1").id = "section" + (session_count + 1).toString();
  ele.querySelector("#sectionNotes1").id = "sectionNotes" + (session_count + 1).toString();
  ele.querySelector("textarea[id^='sectionNotes']").value = "";
  ele.querySelector("button[onclick=\"openForm('1', this)\"]").setAttribute("onclick", "openForm('" + (session_count + 1).toString() + "', this)");

  if (session_count < 4) {
    self.parentNode.parentNode.parentNode.insertBefore(ele, self.parentNode.parentNode)
  }
  
}

function removeSession(self) {
  sessions = document.querySelectorAll("div[id^=\"session\"]");
  session_count = sessions.length;

  if (session_count > 1) {
    sessions[session_count - 1].remove();
  }
}

/*
 * This will set the display the form of the id you pass in and all the other forms are set to 'none'
 */
function openForm(id, element) {
  let forms = ["inCenterTestsForm", "homeworkTestsForm", "otherTestsForm", "dailyLog", "englishLessonsForm", "mathLessonsForm", "readingLessonsForm", "scienceLessonsForm"];
  if (id == '1' || id == '2' || id == '3' || id == '4') {
    let section = document.getElementById("section" + id);
    if (section.value != "") {
      id = section.value.toLowerCase() + "LessonsForm";
    }
    else {
      id = "dailyLog";
    }
  }

  if (id == "inCenterTestsForm" && !element.className.includes("testTab")) {
    changeTests("inCenter");
  }
  else if (id == "homeworkTestsForm" && !element.className.includes("testTab")) {
    changeTests("homework");
  }

  for (let i = 0; i < forms.length; i++) {
    let form = document.getElementById(forms[i]);
    if (forms[i] != id) {
      form.style.display = "none";
    }
    else {
      if (id == "dailyLog") {
        form.style.display = "block"
      }
      else {
        form.style.display = "flex";
      }
    }
  }
}

function changeTests(formType) {
  if (formType == "inCenter" && test_view_type != "inCenter") {
    test_view_type = "inCenter"
    test_boxes = document.querySelectorAll("div[data-testType=\"none\"]")
    for (let i = 0; i < test_boxes.length; i++ ) {
      let test = test_boxes[i].getAttribute("data-test")
      let section = test_boxes[i].getAttribute("data-section").toLowerCase()
      let numberOfPassages = testData[test][section + "Answers"][testData[test][section + "Answers"].length - 1]["passageNumber"];
      //console.log(test, section, numberOfPassages)

      for (let passage = 0; passage < numberOfPassages - 1; passage++) {
        test_boxes[i].appendChild(createElements(["p"], ["testP"], [["data-passageNumber"], []], [[(passage + 1).toString()], []], ["psg" + (passage + 1).toString()], "border"));
      }
        test_boxes[i].appendChild(createElements(["p"], ["testP"], [["data-passageNumber"], []], [[numberOfPassages.toString()], []], ["psg" + numberOfPassages.toString()], ""));
        test_boxes[i].className = test_boxes[i].className + " grid" + numberOfPassages.toString()
        //console.log("Class = ", test_boxes[i].className)
    }
  }
  else if (formType == "homework" && test_view_type != "homework") {
    test_view_type = "homework";
    test_boxes = document.querySelectorAll("div[data-testType=\"none\"]")
    for (let i = 0; i < test_boxes.length; i++) {
      let children = test_boxes[i].querySelectorAll("div");
      for (let k = 0; k < children.length; k++) {
        children[k].remove()
      }
    }
  }
}

function popupGradeTest(test, section, passageNumber) {
  // Display the popup for grading tests
  let popup = document.getElementById("testAnswersPopup")
  popup.style.display = "flex";

  // Change the Popup Header Title
  let headerText = document.getElementById("headerText")
  headerText.innerHTML = test + " - " + section;

  // Set a few custom attributes
  popup.setAttribute("data-test", test)
  popup.setAttribute("data-section", section)
  popup.setAttribute("data-passage", passageNumber)

  // Remove the answers (if they are there)
  removeAnswers();

  // Get a list of all the answers for the given section
  let allAnswers = testData[test][section.toLowerCase() + "Answers"];
  let passageAnswers = []
  let passageNumbers = []

  // Get the answers for the passage passed in
  for (let answer = 0; answer < allAnswers.length; answer++) {
    if (allAnswers[answer]["passageNumber"] == passageNumber) {
      passageAnswers.push(allAnswers[answer][answer + 1])
      passageNumbers.push(answer + 1)
    }
  }

  // Display the answers
  let passage = document.getElementById("passage");
  for (let answer = 0; answer < passageAnswers.length; answer++) {
    if (answer == 0) {
      ele = createElements(["div", "div", "div"], ["popupNumber", "popupDash", "popupAnswer"], [], [], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], "input-row-center firstAnswer button2");
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer])
      ele.setAttribute("data-answer", passageAnswers[answer])
      ele.setAttribute("data-isCorrect", "True")
    }
    else {
      ele = createElements(["div", "div", "div"], ["popupNumber", "popupDash", "popupAnswer"], [], [], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], "input-row-center button2");
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer])
      ele.setAttribute("data-answer", passageAnswers[answer])
      ele.setAttribute("data-isCorrect", "True")
    }
  }

  // Check to see if the answers should be populated
  if (test in testAnswers) {
    if (section in testAnswers[test]) {
      if (passageNumber in testAnswers[test][section]) {
        answerAreaChildren = passage.getElementsByClassName("input-row-center")
        for (let i = 0; i < passageAnswers.length; i++) {
          if (testAnswers[test][section][passageNumber][passageNumbers[i]] == 'False') {
            answerAreaChildren[i].style.backgroundColor = 'red';
            answerAreaChildren[i].setAttribute("data-isCorrect", "False");
          }
        }
      }
    }
  }
}

function removeAnswers() {
  // Remove the answers (if they are there)
  let answerArea = document.getElementById("passage")
  if (answerArea.childElementCount > 0) {
    answerAreaChildren = answerArea.getElementsByClassName("input-row-center")
    num_children = answerAreaChildren.length;
    for (let i = 0; i < num_children; i++) {
      answerAreaChildren[num_children - i - 1].remove();
    }
  }
}

function exitAnswersPopup() {

  // Remove the answers
  removeAnswers();

  // Hide the answers popup
  let answersPopup = document.getElementById("testAnswersPopup");
  answersPopup.style.display = "none"

}

function resetAnswersPopup() {
  // Remove the answers (if they are there)
  let answerArea = document.getElementById("passage")
  answerAreaChildren = answerArea.getElementsByClassName("input-row-center")
  num_children = answerAreaChildren.length;
  for (let i = 0; i < num_children; i++) {
    answerAreaChildren[num_children - i - 1].style.backgroundColor = '';
    answerAreaChildren[num_children - i - 1].setAttribute("data-isCorrect", "True");
  }
}

function removePassage() {

  let answersPopup = document.getElementById("testAnswersPopup");

  let test = answersPopup.getAttribute("data-test");
  let section = answersPopup.getAttribute("data-section")
  let passageNumber = answersPopup.getAttribute("data-passage")

  let can_remove = false;
  if (test in testAnswers) {
    if (section in testAnswers[test]) {
      if (passageNumber in testAnswers[test][section]) {
        can_remove = true;
      }
    }
  }

  if (can_remove == true) {
    // Remove the passage from the testAnswers
    delete testAnswers[test][section][passageNumber];

    // Find the corresponding passage on the list of tests and change the backgroundColor to ''
    let location = document.querySelectorAll("div[data-test=\"" + test + "\"].gridBox")
    if (section == "English") {
      location = location[1]
    }
    else if (section == "Math") {
      location = location[2]
    }
    else if (section == "Reading") {
      location = location[3]
    }
    else {
      location = location[4]
    }
    location = location.querySelectorAll("div")[passageNumber - 1]
    location.style.backgroundColor = ''

    // Check to see if the section should be reverted back to 'none'
    let children = location.parentNode.querySelectorAll("div")
    let can_change_back = true;
    for (let child = 0; child < children.length; child++) {
      if (children[child].style.backgroundColor != "") {
        console.log("can't go back")
        can_change_back = false;
        break;
      }
    }
    if (can_change_back == true) {
      location.parentNode.setAttribute("data-testType", "none")
      delete testAnswers[test][section];
    }
  }

  // Exit the Popup
  exitAnswersPopup();

}

function submitAnswersPopup() {

  let answersPopup = document.getElementById("testAnswersPopup");
  let answerArea = document.getElementById("passage")

  let test = answersPopup.getAttribute("data-test");
  let section = answersPopup.getAttribute("data-section")
  let passageNumber = answersPopup.getAttribute("data-passage")
  
  // Create a dictionary of the answers
  let answers = {};
  let answerAreaChildren = answerArea.getElementsByClassName("input-row-center")
  let num_children = answerAreaChildren.length;
  for (let i = 0; i < num_children; i++) {
    answers[answerAreaChildren[i].getAttribute("data-question")] = answerAreaChildren[i].getAttribute("data-isCorrect");
  }

  // Create the test saving structure, if it doesn't already exist
  if (test in testAnswers) {
    if (section in testAnswers[test]) {
      if (passageNumber in testAnswers[test][section]) {
        //delete testAnswers[test][section][passageNumber]
      }
    }
    else {
      testAnswers[test][section] = {}
    }
  }
  else {
    testAnswers[test] = {}
    testAnswers[test][section] = {}
  }

  // Overwrite / Add the answers into the tests dictonary
  testAnswers[test][section][passageNumber] = answers;

  // Find the corresponding passage on the list of tests and mark it green
  let location = document.querySelectorAll("div[data-test=\"" + test + "\"].gridBox")
  if (section == "English") {
    location = location[1]
  }
  else if (section == "Math") {
    location = location[2]
  }
  else if (section == "Reading") {
    location = location[3]
  }
  else {
    location = location[4]
  }
  location = location.querySelectorAll("div")[passageNumber - 1]
  location.style.backgroundColor = 'green'

  // Change the test to an in-center test
  location.parentNode.setAttribute("data-testType", "inCenter")

  // Clear the popup
  exitAnswersPopup()

}


/************************************************************************
 *                          EVENT LISTENERS                             *
 ************************************************************************/

let popupAnswers = document.getElementById("passage")
popupAnswers.addEventListener('click', function(event) {
  if (event.target.parentNode.className.includes('input-row-center')) {
    if (event.target.parentNode.style.backgroundColor == '') {
      event.target.parentNode.style.backgroundColor = 'red'
      event.target.parentNode.setAttribute("data-isCorrect", "False")
    }
    else {
      event.target.parentNode.style.backgroundColor = '';
    }
  }
})

// Change the colors of the test boxes
let homeworkTests = document.getElementById("homeworkTests");
homeworkTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "yellow";
      event.target.setAttribute("data-testType", "homework")
      popupGradeTest(event.target.getAttribute("data-test"), event.target.getAttribute("data-section"), 1);
    }
    else if (event.target.style.backgroundColor == 'yellow') {
      event.target.style.backgroundColor = "green";
    }
    else if (event.target.style.backgroundColor == 'green') {
      event.target.style.backgroundColor = "red";
    }
    else {
      event.target.style.backgroundColor = "";
      event.target.setAttribute("data-testType", "none")
    }
  }
  else if (event.target.className.includes("testP") && test_view_type == "inCenter") {
    popupGradeTest(event.target.parentNode.parentNode.getAttribute("data-test"), event.target.parentNode.parentNode.getAttribute("data-section"), event.target.getAttribute("data-passagenumber"));
  }
})

// Change the colors of the test boxes
let inCenterTests = document.getElementById("inCenterTests");
inCenterTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "yellow";
      event.target.setAttribute("data-testType", "homework")
      popupGradeTest(event.target.getAttribute("data-test"), event.target.getAttribute("data-section"), 1);
    }
    else if (event.target.style.backgroundColor == 'yellow') {
      event.target.style.backgroundColor = "green";
    }
    else if (event.target.style.backgroundColor == 'green') {
      event.target.style.backgroundColor = "red";
    }
    else {
      event.target.style.backgroundColor = "";
      event.target.setAttribute("data-testType", "none")
    }
  }
  else if (event.target.className.includes("testP") && test_view_type == "inCenter") {
    popupGradeTest(event.target.parentNode.parentNode.getAttribute("data-test"), event.target.parentNode.parentNode.getAttribute("data-section"), event.target.getAttribute("data-passagenumber"));
  }
})

// Change the colors of the test boxes
let otherTests = document.getElementById("otherTests");
otherTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "yellow";
      event.target.setAttribute("data-testType", "homework")
      popupGradeTest(event.target.getAttribute("data-test"), event.target.getAttribute("data-section"), 1);
    }
    else if (event.target.style.backgroundColor == 'yellow') {
      event.target.style.backgroundColor = "green";
    }
    else if (event.target.style.backgroundColor == 'green') {
      event.target.style.backgroundColor = "red";
    }
    else {
      event.target.style.backgroundColor = "";
      event.target.setAttribute("data-testType", "none")
    }
  }
  else if (event.target.className.includes("testP") && test_view_type == "inCenter") {
    popupGradeTest(event.target.parentNode.parentNode.getAttribute("data-test"), event.target.parentNode.parentNode.getAttribute("data-section"), event.target.getAttribute("data-passagenumber"));
  }
})

// Change the colors of the test boxes
let englishLessons = document.getElementById("englishLessons");
englishLessons.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2")) {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "green";
    }
    else if (event.target.style.backgroundColor == 'green') {
      event.target.style.backgroundColor = "yellow";
    }
    else if (event.target.style.backgroundColor == 'yellow') {
      event.target.style.backgroundColor = "red";
    }
    else {
      event.target.style.backgroundColor = "";
    }
  }
})

// Change the colors of the test boxes
let mathLessons = document.getElementById("mathLessons");
mathLessons.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2")) {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "green";
    }
    else if (event.target.style.backgroundColor == 'green') {
      event.target.style.backgroundColor = "yellow";
    }
    else if (event.target.style.backgroundColor == 'yellow') {
      event.target.style.backgroundColor = "red";
    }
    else {
      event.target.style.backgroundColor = "";
    }
  }
})

// Change the colors of the test boxes
let readingLessons = document.getElementById("readingLessons");
readingLessons.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2")) {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "green";
    }
    else if (event.target.style.backgroundColor == 'green') {
      event.target.style.backgroundColor = "yellow";
    }
    else if (event.target.style.backgroundColor == 'yellow') {
      event.target.style.backgroundColor = "red";
    }
    else {
      event.target.style.backgroundColor = "";
    }
  }
})

// Change the colors of the test boxes
let scienceLessons = document.getElementById("scienceLessons");
scienceLessons.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2")) {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "green";
    }
    else if (event.target.style.backgroundColor == 'green') {
      event.target.style.backgroundColor = "yellow";
    }
    else if (event.target.style.backgroundColor == 'yellow') {
      event.target.style.backgroundColor = "red";
    }
    else {
      event.target.style.backgroundColor = "";
    }
  }
})

function submitDailyLog() {
  document.getElementById("errMsg").textContent = "";
  //FIXME: need to add validation here and not in the individual submits
  //this is so that the confirmation message doesn't pop up unless everything is ready to submit
  if (validateSessionInfo()) {
    let confirmation = confirm("Are you sure you are ready to submit this whole session?\nYou will not be able to go back and change your notes."); 
    if (confirmation) {
      document.getElementById("spinnyBoi").style.display = "block";
      let feedbackProm = submitFeedback();
      let sessionProm = submitSessionInfo();

      let promises = [feedbackProm, sessionProm];
      Promise.all(promises)
      .then((result) => {
        console.log("Everything submitted");
        window.history.back();
      })
      .catch((error) => {
        console.error(error);
        document.getElementById("errMsg").textContent = error;
        document.getElementById("spinnyBoi").style.display = "none";
      });
    }
  }
  else {
    document.getElementById("errMsg").textContent = "Please make sure that the log is completely filled out";
  }
}

function validateFeedback() {
  return (document.getElementById("feedback").value != "");
}

function submitFeedback() {
  if (document.getElementById("feedback").value != "") {
    return firebase.firestore().collection("feedback").doc().set({
      feedback: document.getElementById("feedback").value,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      console.log("feedback saved");
    })
    .catch((error) => {
      console.error(error);
    });
  }
  else {
    return Promise.resolve("There is no feedback");
  }
}

function goToDashboard() {
  let confirmation = confirm("Are you sure you want to go back to your dashbaord?\nThis will delete all of this log's changes.");
  if (confirmation) {
    window.history.back();
  }
}

function validateSessionInfo() {
  let dailyLogSessions = document.getElementById("dailyLog").querySelectorAll("div[id^='session']");
  let numSessions = dailyLogSessions.length;

  for (let i = 0; i < numSessions; i++) {
    let section = dailyLogSessions[i].querySelector(`#section${i+1}`);
    let time = dailyLogSessions[i].querySelector(`#time${i+1}`);
    if (section.value == "" || time.value == "") {
      return false;
    }
  }
  return true;
}

function submitSessionInfo() {
  let sessionInfo = {};

  let dailyLogSessions = document.getElementById("dailyLog").querySelectorAll("div[id^='session']");
  let numSessions = dailyLogSessions.length;

  let sectionInfo = {};
  for (let i = 0; i < numSessions; i++) {
    let section = dailyLogSessions[i].querySelector(`#section${i+1}`);
    let time = dailyLogSessions[i].querySelector(`#time${i+1}`);
    let sectionNotes = dailyLogSessions[i].querySelector(`#sectionNotes${i+1}`);

    sectionInfo[section.value] = {
      time: parseInt(time.value),
      sectionNotes: sectionNotes.value
    }
  }

  var d = new Date();
  //FIXME: for now the time will be set to when it was submitted but once the event is on the calendar this time will be that time
  let sessionTime = d.getTime();
  let currentUser = firebase.auth().currentUser;
  if (currentUser) {
    let tutor = currentUser.uid;

    sessionInfo["sections"] = sectionInfo;
    sessionInfo["tutor"] = tutor;
    //set this session doc to firebase
    const studentUID = queryStrings()["student"];

    if (studentUID) {
      let sessionDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("sessions");
      //need to somehow get this promise to return when complete....
      return sessionDocRef.get()
      .then((doc) => {
        if (doc.exists) {
          //doc exists - update the doc
          return sessionDocRef.update({
            [`${sessionTime.toString()}`]: sessionInfo,
            englishTotalTime: firebase.firestore.FieldValue.increment(sectionInfo.English?.time ?? 0),
            mathTotalTime: firebase.firestore.FieldValue.increment(sectionInfo.Math?.time ?? 0),
            readingTotalTime: firebase.firestore.FieldValue.increment(sectionInfo.Reading?.time ?? 0),
            scienceTotalTime: firebase.firestore.FieldValue.increment(sectionInfo.Science?.time ?? 0),
            [`tutors.${tutor}`]: firebase.firestore.FieldValue.increment(1)
          })
        }
        else {
          //doc does not exist - set the doc
          return sessionDocRef.set({
            [`${sessionTime.toString()}`]: sessionInfo,
            englishTotalTime: sectionInfo.English?.time ?? 0,
            mathTotalTime: sectionInfo.Math?.time ?? 0,
            readingTotalTime: sectionInfo.Reading?.time ?? 0,
            scienceTotalTime: sectionInfo.Science?.time ?? 0,
            tutors: {[`${tutor}`]: 1}
          })
        }
      })
      .catch((error) => {
        console.error(error);
        return Promise.reject(error);
      });
    }
    else {
      console.log("There is no student selected!!!");
      return Promise.reject("There is no student selected!!!");
    }
  }
  else {
    //there is no tutor logged in
    console.log("There is no tutor logged in!!!")
    return Promise.reject("There is no tutor logged in!!!")
  }

  
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