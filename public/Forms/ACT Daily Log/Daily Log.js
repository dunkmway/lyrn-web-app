let test_view_type = 'none'
let testData;
fetch("../Test Data/Tests.json").then(response => response.json()).then(data => testData = JSON.parse(data));

function initialSetup() {
  const studentUID = queryStrings()["student"];

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
      console.log(test, section, numberOfPassages)

      for (let passage = 0; passage < numberOfPassages - 1; passage++) {
        test_boxes[i].appendChild(createElements(["p"], ["testP"], [""], [""], ["psg" + (passage + 1).toString()], "border"));
      }
        test_boxes[i].appendChild(createElements(["p"], ["testP"], [""], [""], ["psg" + numberOfPassages.toString()], ""));
        test_boxes[i].className = test_boxes[i].className + " grid" + numberOfPassages.toString()
        console.log("Class = ", test_boxes[i].className)
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
  let popup = document.getElementById("testAnswersPopup")
  popup.display = "flex";

  let headerText = document.getElementById("headerText")
  headerText.innerHTML = test

  let allAnswers = testData[test][section.toLowerCase() + "Answers"];
  let passageAnswers = []

  for (let answer = 0; answer < allAnswers.length; answer++) {
    if (allAnswers[answer]["passageNumber"] == passageNumber) {
      passageAnswers.push(allAnswers[answer][answer + 1])
    }
  }

  let passage = document.getElementById("passage");
  for (let answer = 0; answer < passageAnswers.length; answer++) {
    passage.appendChild(createElements(["div", "div", "div"], ["popupNumber", "popupDash", "popupAnswer"], [], [], [(answer + 1).toString(), "-", passageAnswers[answer]], "input-row-center"))
  }
}


// Change the colors of the test boxes
let homeworkTests = document.getElementById("homeworkTests");
homeworkTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "yellow";
      event.target.setAttribute("data-testType", "homework")
      //popupGradeTest(event.target.getAttribute("data-test"), event.target.getAttribute("data-section"), 1);
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
    if (event.target.parentNode.style.backgroundColor == '') {
      event.target.parentNode.style.backgroundColor = "green";
      event.target.parentNode.parentNode.setAttribute("data-testType", "inCenter")
    }
    //else if (event.target.parentNode.style.backgroundColor == 'yellow') {
      //event.target.parentNode.style.backgroundColor = "green";
    //}
    //else if (event.target.parentNode.style.backgroundColor == 'green') {
      //event.target.parentNode.style.backgroundColor = "red";
    //}
    else {
      event.target.parentNode.style.backgroundColor = "";
      let children = event.target.parentNode.parentNode.querySelectorAll("div")
      let can_change_back = true;
      for (let child = 0; child < children.length; child++) {
        if (children[child].style.backgroundColor != "") {
          can_change_back = false;
          break;
        }
      }
      if (can_change_back == true) {
        event.target.parentNode.parentNode.setAttribute("data-testType", "none")
      }
    }
  }
})

// Change the colors of the test boxes
let inCenterTests = document.getElementById("inCenterTests");
inCenterTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "yellow";
      event.target.setAttribute("data-testType", "homework")
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
    if (event.target.parentNode.style.backgroundColor == '') {
      event.target.parentNode.style.backgroundColor = "green";
      event.target.parentNode.parentNode.setAttribute("data-testType", "inCenter")
    }
    //else if (event.target.parentNode.style.backgroundColor == 'yellow') {
      //event.target.parentNode.style.backgroundColor = "green";
    //}
    //else if (event.target.parentNode.style.backgroundColor == 'green') {
      //event.target.parentNode.style.backgroundColor = "red";
    //}
    else {
      event.target.parentNode.style.backgroundColor = "";
      let children = event.target.parentNode.parentNode.querySelectorAll("div")
      let can_change_back = true;
      for (let child = 0; child < children.length; child++) {
        if (children[child].style.backgroundColor != "") {
          can_change_back = false;
          break;
        }
      }
      if (can_change_back == true) {
        event.target.parentNode.parentNode.setAttribute("data-testType", "none")
      }
    }
  }
})

// Change the colors of the test boxes
let otherTests = document.getElementById("otherTests");
otherTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    if (event.target.style.backgroundColor == '') {
      event.target.style.backgroundColor = "yellow";
      event.target.setAttribute("data-testType", "homework")
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
    if (event.target.parentNode.style.backgroundColor == '') {
      event.target.parentNode.style.backgroundColor = "green";
      event.target.parentNode.parentNode.setAttribute("data-testType", "inCenter")
    }
    //else if (event.target.parentNode.style.backgroundColor == 'yellow') {
      //event.target.parentNode.style.backgroundColor = "green";
    //}
    //else if (event.target.parentNode.style.backgroundColor == 'green') {
      //event.target.parentNode.style.backgroundColor = "red";
    //}
    else {
      event.target.parentNode.style.backgroundColor = "";
      let children = event.target.parentNode.parentNode.querySelectorAll("div")
      let can_change_back = true;
      for (let child = 0; child < children.length; child++) {
        if (children[child].style.backgroundColor != "") {
          can_change_back = false;
          break;
        }
      }
      if (can_change_back == true) {
        event.target.parentNode.parentNode.setAttribute("data-testType", "none")
      }
    }
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
  });

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
    return Promise.resolve("There is no feedback...");
  }
}

function goToDashboard() {
  window.history.back();
}

function submitSessionInfo() {
  let sessionInfo = {};

  let dailyLogSessions = document.getElementById("dailyLog").querySelectorAll("div[id^='session']");
  let numSessions = dailyLogSessions.length;

  let sectionInfo = {};
  for (let i = 0; i < numSessions; i++) {
    let section = dailyLogSessions[i].querySelector(`#section${i+1}`).value;
    let time = dailyLogSessions[i].querySelector(`#time${i+1}`).value;
    let sectionNotes = dailyLogSessions[i].querySelector(`#sectionNotes${i+1}`).value;

    sectionInfo[section] = {
      time: time,
      sectionNotes: sectionNotes
    }
  }

  var d = new Date();
  //FIXME: for now the time will be set to when it was submitted but once the event is on the calendar this time will be that time
  let sessionTime = d.getTime();

  sessionInfo["sections"] = sectionInfo;
  sessionInfo["tutor"] = firebase.auth().currentUser.uid;

  //set this session doc to firebase
  const studentUID = queryStrings()["student"];


  let sessionDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc(sessionTime.toString());
  return sessionDocRef.set(sessionInfo)
  .then((result) => {
    console.log("session successfully saved to firebase");
  })
  .catch((error) => {
    console.error(error);
  });
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