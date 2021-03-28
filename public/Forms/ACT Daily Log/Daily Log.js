let test_view_type = 'none';
let oldTestAnswers = {};
let testAnswers = {};
let testData;
fetch("../Test Data/Tests.json").then(response => response.json()).then(data => testData = JSON.parse(data)).then(initialTestSet());
initialSetup();

last_test = "";
last_section = "";
last_passageNumber = undefined;

function initialSetup() {
  console.log("In initial setup");
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

    //get the student's hw scores
    let hwDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("hw");
    //need to somehow get this promise to return when complete....
    return hwDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        oldTestAnswers = doc.data();
        testAnswers = JSON.parse(JSON.stringify(oldTestAnswers));
        console.log(oldTestAnswers);
        console.log(testAnswers);

        updateTestTypes();
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

/**
 * create html elements and return them in a parent div
 * @param {[String]} elementType tag names for the elements that will be created
 * @param {[[String]]} classes classes for each element
 * @param {[[String]]} attributes attributes for each element
 * @param {[[String]]} values values for each attribute for each element
 * @param {[String]} text innerhtml for each element
 * @param {[String]} divClasses calsses for the parent div for the elements
 * @returns {HTMLElement} html div whose children are the requested elements
 */
function createElements(elementType = [], classes = [[]], attributes = [[]], values = [[]], text = [], divClasses = []) {
  if (elementType.length >= 0) {
    let elements = createElement("div", divClasses);

    if (attributes.length == values.length && attributes.length >= 0) {
      for (let i = 0; i < elementType.length; i++) {
        elements.appendChild(createElement(elementType[i], classes[i], attributes[i], values[i], text[i]));
      }
    }

    return elements;

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
  let element = document.createElement(elementType);

  if (attributes.length == values.length && attributes.length > 0) {
    for (let i = 0; i < attributes.length; i++) {
      element.setAttribute(attributes[i], values[i]);
    }
  }

  for (let i = 0; i < classes.length; i++) {
    element.classList.add(classes[i]);
  }

  if (text != "") {
    element.innerHTML = text;
  }
  return element;
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
  let forms = ["inCenterTestsForm", "homeworkTestsForm", "otherTestsForm", "dailyLog", "englishLessonsForm", "mathLessonsForm", "readingLessonsForm", "scienceLessonsForm", "testAnswersPopup", "homeworkPopup"];
  if (id == '1' || id == '2' || id == '3' || id == '4') {
    let section = document.getElementById("section" + id);
    if (section.value != "") {
      id = section.value.toLowerCase() + "LessonsForm";
    }
    else {
      id = "dailyLog";
    }
  }

  // Deselect the last test, if needed
  deSelect()

  // Reset the visibility of the first two buttons in the Test forms
  if (id.includes('Tests')) {
    hwDiv = document.getElementById("homeworkStatusDiv");
    inCenterDiv = document.getElementById("inCenterStatusDiv");
    otherDiv = document.getElementById("otherStatusDiv");

    hwDiv.style.visibility = "visible";
    inCenterTests.style.visibility = "visible";
    otherDiv.style.visibility = "visible";
  }

  if (id == "inCenterTestsForm" && !element.className.includes("testTab")) {
    changeTests("inCenter");
  }
  else if (id == "homeworkTestsForm" && !element.className.includes("testTab")) {
    if (element.id == "assignHomework") {
      changeTests("assign");
      hwDiv = document.getElementById("homeworkStatusDiv");
      inCenterDiv = document.getElementById("inCenterStatusDiv");
      otherDiv = document.getElementById("otherStatusDiv");

      hwDiv.style.visibility = "hidden";
      inCenterTests.style.visibility = "hidden";
      otherDiv.style.visibility = "hidden";
    }
    else {
      changeTests("homework");
    }
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

/**
 * change test type and update visuals for the test page
 * @param {String} formType default test type that will be displayed
 */
function changeTests(formType) {
  if (formType == "inCenter") {
    test_view_type = "inCenter"
    test_boxes = document.querySelectorAll("div[data-testType=\"none\"], div[data-testType=\"inCenter\"]")
    for (let i = 0; i < test_boxes.length; i++ ) {
      let test = test_boxes[i].getAttribute("data-test")
      let section = test_boxes[i].getAttribute("data-section").toLowerCase()
      let numberOfPassages = testData[test][section + "Answers"][testData[test][section + "Answers"].length - 1]["passageNumber"];
      //console.log(test, section, numberOfPassages)

      for (let passage = 0; passage < numberOfPassages; passage++) {
        test_boxes[i].appendChild(createElements(["p"], [["testP"]], [["data-passageNumber"]], [[(passage + 1).toString()]], [(passage + 1).toString()], ["border"]));
      }
        test_boxes[i].className = test_boxes[i].className + " grid" + numberOfPassages.toString()
    }

    // Color the in-center boxes green initially - Initial Set
    for (const [test, value1] of Object.entries(testAnswers)) {
      for (const [section, value2] of Object.entries(testAnswers[test])) {
        let testType = testAnswers[test][section]["testType"];
        if (testType == 'inCenter') {
          for (const [passageNumber, value2] of Object.entries(testAnswers[test][section])) {
            if (passageNumber != 'testType') {
              let element = findTestDiv(test, section, passageNumber);
              element.style.backgroundColor = 'green';
              element.querySelector("p").innerHTML = testAnswers[test]?.[section]?.[passageNumber]?.["TotalCorrect"].toString() + " / " + Object.keys(testAnswers[test]?.[section]?.[passageNumber]?.["Answers"]).length.toString()

            }
          }
        }
      }
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
  else if (formType == "assign" && test_view_type != "assign") {
    test_view_type = "assign";
    test_boxes = document.querySelectorAll("div[data-testType=\"none\"]")
    for (let i = 0; i < test_boxes.length; i++) {
      let children = test_boxes[i].querySelectorAll("div");
      for (let k = 0; k < children.length; k++) {
        children[k].remove()
      }
    }
  }
}

/**
 * update the test div blocks to have the same test type as the test answer object
 */
function updateTestTypes() {
  let test_boxes = document.querySelectorAll("div[data-testType]")
  for (let i = 0; i < test_boxes.length; i++ ) {
    let test = test_boxes[i].getAttribute("data-test")
    let section = test_boxes[i].getAttribute("data-section")

    //if the test is an incenter test then set it as such
    if (testAnswers[test]?.[section]?.["testType"]) {
      test_boxes[i].setAttribute("data-testType", testAnswers[test]?.[section]?.["testType"]);
    }
  }
}

function initialTestSet() {
  for (const [test, value1] of Object.entries(testAnswers)) {
    for (const [section, value2] of Object.entries(testAnswers[test])) {
      let testType = testAnswers[test][section]["testType"]
      element = findTestDiv(test, section)
      element.setAttribute("data-testType", testType)
      if (testType == 'homework') {
        element.innerHTML = testAnswers[test][section]["Score"]
      }
    }
  }

  //FIXME: Double check that we don't need this here. It is handled in the update test visuals section.
  // // Color the homework boxes green initially
  // homework_boxes = document.querySelectorAll("div[data-testType=\"homework\"]")
  // for (let i = 0; i < homework_boxes.length; i++) {
  //   let test = homework_boxes[i].getAttribute("data-test")
  //   let section = homework_boxes[i].getAttribute("data-section")
  //   let status = testAnswers[test][section]["Status"]
  //   let score = testAnswers[test][section]["Score"]
  //   if (status == 'Completed') {
  //     homework_boxes[i].style.backgroundColor = 'green';
  //     homework_boxes[i].innerHTML = score;
  //   }
  //   else if (status == 'Assigned') {
  //     homework_boxes[i].style.backgroundColor = 'yellow';
  //   }
  //   else if (status == 'Incomplete') {
  //     if (score.toString() != '-1') {
  //       homework_boxes[i].style.backgroundColor = 'gray';
  //       homework_boxes[i].innerHTML = score;
  //     }
  //     else {
  //       homework_boxes[i].style.backgroundColor = 'red';
  //     }
  //   }
    
  // }

}

function findTestDiv(test, section, passageNumber = undefined) {
  // Find the corresponding passage on the list of tests and change the backgroundColor to ''
  let locations = document.querySelectorAll("div[data-test=\"" + test + "\"].gridBox")
  let location;
  if (section == "English") {
    location = locations[1]
  }
  else if (section == "Math") {
    location = locations[2]
  }
  else if (section == "Reading") {
    location = locations[3]
  }
  else {
    location = locations[4]
  }

  if (passageNumber == undefined) {
    return location
  }
  else {
    let passageLocation = location.querySelectorAll("div")[passageNumber - 1]
    return passageLocation;
  }
}

function previousPassage(element) {

  let test = element.parentNode.parentNode.parentNode.getAttribute("data-test");
  let section = element.parentNode.parentNode.parentNode.getAttribute("data-section");
  let passageNumber = parseInt(element.parentNode.parentNode.parentNode.getAttribute("data-passage"));

  exitAnswersPopup();
  popupGradeTest(test, section, (passageNumber - 1));
}

function nextPassage(element) {

  let test = element.parentNode.parentNode.parentNode.getAttribute("data-test");
  let section = element.parentNode.parentNode.parentNode.getAttribute("data-section");
  let passageNumber = element.parentNode.parentNode.parentNode.getAttribute("data-passage");
  if (passageNumber == 'undefined') {
    passageNumber = '1'
  }
  passageNumber = parseInt(passageNumber, 10) + 1;

  submitAnswersPopup();

  // Deselect the homework box temporarily, so popuGradeTest functions correctly
  if (test_view_type == 'homework') {
    deSelect()
  }

  popupGradeTest(test, section, (passageNumber.toString()));
}

function deSelect() {

  // Unhighlight the last test selected
  if (last_test != "") {
    testLocation = findTestDiv(last_test, last_section, last_passageNumber);
    if (testLocation == null) {
      testLocation = findTestDiv(last_test, last_section, undefined);
    }
    testLocation.style.borderStyle = "";
    testLocation.style.borderWidth = "";
    testLocation.style.borderColor = "";
  }  

}

function popupGradeTest(test, section, passageNumber = undefined) {

  // Check to see if they pressed the same test again. If so, just exit out
  let testLocation = findTestDiv(test, section, passageNumber);
  if (testLocation == null) {
    testLocation = findTestDiv(test, section, undefined);
  }
  if (testLocation.style.borderColor == "cyan") {
    exitAnswersPopup();
    return
  }

  // Display the popup for grading tests
  let popup = document.getElementById("testAnswersPopup")
  popup.style.display = "flex";

  // Make sure the left and right arrows are visible
  let last_passage_number = testData[test][section.toLowerCase() + "Answers"][testData[test][section.toLowerCase() + "Answers"].length - 1]["passageNumber"]
  let leftArrow = document.getElementById("leftArrow")
  let rightArrow = document.getElementById("rightArrow")
  leftArrow.parentNode.style.visibility = "visible"
  rightArrow.parentNode.style.visibility = "visible"

  // Check to see if either left arrow or right arrows need to be hidden
  if (passageNumber == 1 || passageNumber == undefined) {
    leftArrow.parentNode.style.visibility = "hidden"
  }
  else if (passageNumber == last_passage_number) {
    rightArrow.parentNode.style.visibility = "hidden"
  }

  // Hide the homework popup, if applicable
  if (passageNumber == undefined) {
    let tmpPopup = document.getElementById("homeworkPopup");
    tmpPopup.style.display = "none"
  }

  // Change the Popup Header Title
  let headerText = document.getElementById("headerText")
  if (test_view_type != 'homework') { headerText.innerHTML = test + " - " + section + " - P" + passageNumber; }
  else { headerText.innerHTML = test + " - " + section; }

  // Clear the previously highlighted test if it wasn't already
  if (last_test != "") {
    testLocation = findTestDiv(last_test, last_section, last_passageNumber);
    if (testLocation == null) {
      testLocation = findTestDiv(last_test, last_section, undefined);
    }
    testLocation.style.borderStyle = "";
    testLocation.style.borderWidth = "";
    testLocation.style.borderColor = "";
  }  

  // Highlight the passage that is pulled up
  testLocation = findTestDiv(test, section, passageNumber);
  if (testLocation == null) {
    testLocation = findTestDiv(last_test, last_section, undefined);
  }
  testLocation.style.borderStyle = "solid";
  testLocation.style.borderWidth = "3px";
  testLocation.style.borderColor = "cyan";

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
    if (allAnswers[answer]["passageNumber"] == (passageNumber ?? '1')) {
      passageAnswers.push(allAnswers[answer][answer + 1])
      passageNumbers.push(answer + 1)
    }
  }

  // Display the answers
  let passage = document.getElementById("passage");
  for (let answer = 0; answer < passageAnswers.length; answer++) {
    if (answer == 0) {
      ele = createElements(["div", "div", "div"], [["popupNumber"], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "firstAnswer", "button2"]);
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer])
      ele.setAttribute("data-answer", passageAnswers[answer])
      ele.setAttribute("data-isCorrect", "true")
    }
    else {
      ele = createElements(["div", "div", "div"], [["popupNumber"], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "button2"]);
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer])
      ele.setAttribute("data-answer", passageAnswers[answer])
      ele.setAttribute("data-isCorrect", "true")
    }
  }

  // Check to see if the answers should be populated - Initialize the In-Center tests
  if (test in testAnswers) {
    if (section in testAnswers[test]) {
      if (passageNumber in testAnswers[test][section]) {
        answerAreaChildren = passage.getElementsByClassName("input-row-center")
        for (let i = 0; i < passageAnswers.length; i++) {
          if (!testAnswers[test][section][passageNumber][passageNumbers[i]]) {
            //Matthew
            //this was changed to be an actual boolean value as shown above
//           if (testAnswers[test][section][passageNumber]["Answers"][passageNumbers[i]] == 'False') {
            answerAreaChildren[i].style.backgroundColor = 'red';
            answerAreaChildren[i].setAttribute("data-isCorrect", "false");
          }
        }
      }
    }
  }

  // Update the last test, section, and passageNumber
  last_test = test;
  last_section = section;
  last_passageNumber = passageNumber;

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

function exitAnswersPopup(start_element = undefined) {

  // Remove the answers
  removeAnswers();

  // Remove the border
  let popup = document.getElementById("testAnswersPopup");
  if (popup.getAttribute("data-test") == undefined) {
    popup = document.getElementById("homeworkPopup")
  }

  let test = popup.getAttribute("data-test");
  let section = popup.getAttribute("data-section");
  let passageNumber = popup.getAttribute("data-passage");

  if (start_element != undefined) {
    test = start_element.parentNode.parentNode.getAttribute("data-test")
    section = start_element.parentNode.parentNode.getAttribute("data-section")
    if (test == null) {
      test = start_element.getAttribute("data-test")
      section = start_element.getAttribute("data-section")
      passageNumber = undefined;
    }
  }

  testLocation = findTestDiv(test, section, passageNumber);
  if (testLocation == null) {
    testLocation = findTestDiv(test, section, undefined);
  }
  testLocation.style.borderStyle = "";
  testLocation.style.borderWidth = "";
  testLocation.style.borderColor = "";

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
    answerAreaChildren[num_children - i - 1].setAttribute("data-isCorrect", "true");
  }
}

function removePassage(start_element = undefined) {

  let answersPopup = document.getElementById("testAnswersPopup");

  let test = answersPopup.getAttribute("data-test");
  let section = answersPopup.getAttribute("data-section")
  let passageNumber = answersPopup.getAttribute("data-passage")

  if (start_element != undefined) {
    test = start_element.parentNode.parentNode.getAttribute("data-test")
    section = start_element.parentNode.parentNode.getAttribute("data-section")
  }

  // Continue here
  if (test == null) {
    test = start_element.getAttribute("data-test")
    section = start_element.getAttribute("data-section")
  }


  let can_remove = false;
  let can_remove_section = false;
  if (test_view_type != "homework") {
    if (test in testAnswers) {
      if (section in testAnswers[test]) {
          can_remove_section = true;
        if (passageNumber in testAnswers[test][section]) {
          can_remove = true;

          // Remove the passage from the testAnswers
          delete testAnswers[test][section][passageNumber];
        }
      }
    }
  }

  //if (can_remove == true || (test_view_type == "homework" && can_remove_section == true)) {
  if (can_remove == true || test_view_type == "homework") {
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

    if (can_remove == true) {
      location = location.querySelectorAll("div")[passageNumber - 1]
    }
    location.style.backgroundColor = ''
    if (test_view_type != 'homework') {
      location.querySelector("p").innerHTML = passageNumber.toString();
    }
    else {
      location.innerHTML = '';
    }

    // Check to see if the section should be reverted back to 'none'
    let children = location.parentNode.querySelectorAll("div")
    let can_change_back = true;
    if (test_view_type != "homework") {
      for (let child = 0; child < children.length; child++) {
        if (children[child].style.backgroundColor != "") {
          can_change_back = false;
          break;
        }
      }
    }

    if (test in testAnswers) {
      if (!(section in testAnswers[test])) {
        can_change_back = false;
      }
    }
    else {
      can_change_back = false;
    }

    if (can_change_back == true) {
      if (test_view_type != "homework") {
        location.parentNode.setAttribute("data-testType", "none")
      }
      else {
        location.setAttribute("data-testType", "none")
      }
      delete testAnswers[test][section];
      if (testAnswers[test].length == undefined) {
        delete testAnswers[test]
      }
    }
  }

  // Exit the Answers Popup
  exitAnswersPopup(start_element);

  // Exit the homework Popup, if applicable
  if (start_element != undefined) {
    exitHomeworkPopup();
  }

}

function submitAnswersPopup() {

  console.log(testAnswers);

  let answersPopup = document.getElementById("testAnswersPopup");
  let answerArea = document.getElementById("passage")

  let test = answersPopup.getAttribute("data-test");
  let section = answersPopup.getAttribute("data-section")
  let passageNumber = (answersPopup.getAttribute("data-passage"))
  if (passageNumber == 'undefined') {
    passageNumber = '1';
  }
  let last_passage_number = testData[test][section.toLowerCase() + "Answers"][testData[test][section.toLowerCase() + "Answers"].length - 1]["passageNumber"]
  
  // Create a dictionary of the answers
  let answers = {};
  let numberOfCorrectAnswers = 0;
  let answerAreaChildren = answerArea.getElementsByClassName("input-row-center")
  let num_children = answerAreaChildren.length;
  for (let i = 0; i < num_children; i++) {
    answers[answerAreaChildren[i].getAttribute("data-question")] = (answerAreaChildren[i].getAttribute("data-isCorrect") == 'true');
            //matthew
            //again the variable type is now a boolean
    //answers[answerAreaChildren[i].getAttribute("data-question")] = answerAreaChildren[i].getAttribute("data-isCorrect");
    //if (answerAreaChildren[i].getAttribute("data-isCorrect") == 'True') {
    if (answers[answerAreaChildren[i].getAttribute("data-question")]) {
      numberOfCorrectAnswers += 1;
    }
  }

  // Create the test saving structure, if it doesn't already exist
  if (test in testAnswers) {
    if (section in testAnswers[test]) {
      if (passageNumber in testAnswers[test][section]) {
        testAnswers[test][section][passageNumber]["Answers"] = answers;
        testAnswers[test][section][passageNumber]["TotalCorrect"] = numberOfCorrectAnswers;
      }
      else {
        testAnswers[test][section][passageNumber] = {}
        testAnswers[test][section][passageNumber]["Answers"] = answers;
        testAnswers[test][section][passageNumber]["TotalCorrect"] = numberOfCorrectAnswers;
      }
    }
    else {
      testAnswers[test][section] = {}
      testAnswers[test][section][passageNumber] = {}
      testAnswers[test][section][passageNumber]["Answers"] = {}
      testAnswers[test][section]["testType"] = test_view_type
      testAnswers[test][section][passageNumber]["Answers"] = answers;
      testAnswers[test][section][passageNumber]["TotalCorrect"] = numberOfCorrectAnswers;
    }
  }
  else {
    testAnswers[test] = {}
    testAnswers[test][section] = {}
    testAnswers[test][section][passageNumber] = {}
    testAnswers[test][section][passageNumber]["Answers"] = {}
    testAnswers[test][section]["testType"] = test_view_type
    testAnswers[test][section][passageNumber]["Answers"] = answers;
    testAnswers[test][section][passageNumber]["TotalCorrect"] = numberOfCorrectAnswers;
  }

            //Duncan's stuff don't think we need it
//   // Overwrite / Add the answers into the tests dictonary
//   testAnswers[test][section][passageNumber] = answers;

//   /************************************
//    * This was replaced by the next two functions
//    ************************************/
//   // // Find the corresponding passage on the list of tests and mark it green
//   // let location = document.querySelectorAll("div[data-test=\"" + test + "\"].gridBox")
//   // if (section == "English") {
//   //   location = location[1]
//   // }
//   // else if (section == "Math") {
//   //   location = location[2]
//   // }
//   // else if (section == "Reading") {
//   //   location = location[3]
//   // }
//   // else {
//   //   location = location[4]
//   // }
//   // location = location.querySelectorAll("div")[passageNumber - 1]
//   // location.style.backgroundColor = 'green'

//   // // Change the test to an in-center test
//   // location.parentNode.setAttribute("data-testType", "inCenter")
            //End
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

  if (test_view_type != 'homework') {
    location = location.querySelectorAll("div")[passageNumber - 1]
  }

  if (test_view_type != 'homework' || (test_view_type == 'homework' && passageNumber == last_passage_number)) {
    let totalCorrect = 0
    let totalAnswers = 0
    for (const [key, psg] of Object.entries(testAnswers[test][section])) {
      if (key != "testType" && key != "Score" && key != "Status") {
        totalCorrect += psg["TotalCorrect"]
        //FIXME: This thing throws an error while trying to submit the test. Don't see what it's doing
        //totalAnswers += Object.keys(psg["Answers"]).length
      }
    }
    let scaleScore = 0;
    for (const [key, value] of Object.entries(testData[test][section.toLowerCase() + "Scores"])) {
      if (parseInt(totalCorrect, 10) >= parseInt(value, 10)) {
        scaledScore = 36 - parseInt(key);
        break;
      }
    }

    if (test_view_type == 'homework') {
      testAnswers[test][section]["Score"] = scaledScore
      location.innerHTML = scaledScore;
      if (testAnswers[test][section]["Status"] == 'Incomplete') {
        location.style.backgroundColor = 'red'
      }
      else {
        testAnswers[test][section]["Status"] = "Completed"
        location.style.backgroundColor = 'green'
      }
    }
    else {
      location.style.backgroundColor = 'green'
    }
  }

  // Change the test type
  if (test_view_type == 'homework') {
    location.setAttribute("data-testType", test_view_type);
  }
  else {
    location.parentNode.setAttribute("data-testType", test_view_type);
    location.querySelector("p").innerHTML = numberOfCorrectAnswers.toString() + " / " + num_children.toString();
  }


  //update the test types
  //updateTestTypes();

  //update the test visuals
  //updateTestVisuals();

  // Clear the popup
  if (test_view_type != 'homework' || (test_view_type == 'homework' && passageNumber == last_passage_number)) {
    exitAnswersPopup()
  }

}

function setHomeworkStatus(status, gradeHomework = "False") {
  let popup = document.getElementById("homeworkPopup");

  let test = popup.getAttribute("data-test");
  let section = popup.getAttribute("data-section");

  if (test in testAnswers) {
    if (section in testAnswers[test]) {
      testAnswers[test][section]["Status"] = status;
    }
    else {
      testAnswers[test][section] = {}
      testAnswers[test][section]["Status"] = status;
    }
  }
  else {
      testAnswers[test] = {}
      testAnswers[test][section] = {}
      testAnswers[test][section]["Status"] = status;
  }

  let location = findTestDiv(test, section);
  if (status == 'Assigned') {
    location.style.backgroundColor = 'rgb(218, 165, 32)';
    location.setAttribute("data-testType", 'homework');
    testAnswers[test][section]["testType"] = 'homework';
    exitHomeworkPopup();
  }
  else if (status == 'Incomplete') {
    if (gradeHomework == 'False') {
      location.style.backgroundColor = 'gray';
      location.setAttribute("data-testType", 'homework')
      testAnswers[test][section]["testType"] = 'homework';
      exitHomeworkPopup();
    }
    else {
      location.setAttribute("data-testType", 'homework');
      testAnswers[test][section]["testType"] = 'homework';
      deSelect();
      popupGradeTest(test, section);
    }
  }

}

function gradeHomework(test, section) {

  // Change the Popup Header Title
  let headerText = document.getElementById("homeworkHeaderText")
  headerText.innerHTML = test + " - " + section;

  // Hide the answers popup
  let popup = document.getElementById("testAnswersPopup")
  popup.style.display = "none";

  // Check to see if they pressed the same test again. If so, just exit out
  let testLocation = findTestDiv(test, section, undefined);
  if (testLocation.style.borderColor == "cyan") {
    if (test in testAnswers) {
      if (section in testAnswers[test]) {
        let last_passage_number = testData[test][section.toLowerCase() + "Answers"][testData[test][section.toLowerCase() + "Answers"].length - 1]["passageNumber"];
        if ((Object.keys(testAnswers[test][section]).length - 1) < last_passage_number) {
          removePassage(testLocation);
          return
        }
      }
    }
    exitHomeworkPopup();
    return
  }

  // Display the popup
  popup = document.getElementById("homeworkPopup");
  popup.style.display = "flex"

  // Set the test and section for the popup
  popup.setAttribute("data-test", test);
  popup.setAttribute("data-section", section);

  // Clear the previously highlighted test if it wasn't already
  if (last_test != "") {
    testLocation = findTestDiv(last_test, last_section);
    testLocation.style.borderStyle = "";
    testLocation.style.borderWidth = "";
    testLocation.style.borderColor = "";
  }  

  // Highlight the passage that is pulled up
  testLocation = findTestDiv(test, section);
  testLocation.style.borderStyle = "solid";
  testLocation.style.borderWidth = "3px";
  testLocation.style.borderColor = "cyan";

  // Update the last test and section
  last_test = test;
  last_section = section;

}

function gradeTest() {

  let popup = document.getElementById("homeworkPopup");

  let test = popup.getAttribute("data-test");
  let section = popup.getAttribute("data-section");

  testLocation = findTestDiv(test, section);
  testLocation.style.borderStyle = "";
  testLocation.style.borderWidth = "";
  testLocation.style.borderColor = "";

  popupGradeTest(test, section);
}

function exitHomeworkPopup() {

  // Remove the border
  let popup = document.getElementById("homeworkPopup");

  let test = popup.getAttribute("data-test");
  let section = popup.getAttribute("data-section");

  testLocation = findTestDiv(test, section);
  testLocation.style.borderStyle = "";
  testLocation.style.borderWidth = "";
  testLocation.style.borderColor = "";

  // Hide the homework popup
  let answersPopup = document.getElementById("homeworkPopup");
  answersPopup.style.display = "none"

}

function assignHomework(element) {
  let test = element.getAttribute("data-test");
  let section = element.getAttribute("data-section");
  if (element.style.backgroundColor == '') {
    element.style.backgroundColor = "rgb(218, 165, 32)";
    element.setAttribute("data-testType", "homework")
    if (test in testAnswers) {
      if (section in testAnswers[test]) {
        testAnswers[test][section]["testType"] = "homework"
      }
      else {
        testAnswers[test][section] = {}
        testAnswers[test][section]["testType"] = "homework"
      }
    }
    else {
      testAnswers[test] = {}
      testAnswers[test][section] = {}
      testAnswers[test][section]["testType"] = "homework"
    }
  }
  else {
    element.style.backgroundColor = "";
    element.setAttribute("data-testType", "none")
    console.log(Object.keys(testAnswers[test]).length)
    if (Object.keys(testAnswers[test]).length > 0) {
      delete testAnswers[test][section];
    }
    else {
      delete testAnswers[test];
    }
    console.log(testAnswers);
  }
}

/************************************************************************
 *                          EVENT LISTENERS                             *
 ************************************************************************/

// Listen for wrong answers
let popupAnswers = document.getElementById("passage")
popupAnswers.addEventListener('click', function(event) {
  if (event.target.parentNode.className.includes('input-row-center')) {
    if (event.target.parentNode.style.backgroundColor == '') {
      event.target.parentNode.style.backgroundColor = 'red'
      event.target.parentNode.setAttribute("data-isCorrect", "false")
    }
    else {
      event.target.parentNode.style.backgroundColor = '';
            //want this to be a boolean
      event.target.parentNode.setAttribute("data-isCorrect", "true")
      //event.target.parentNode.setAttribute("data-isCorrect", "True")
    }
  }
})

// Change the colors of the test boxes
let homeworkTests = document.getElementById("homeworkTests");
homeworkTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    gradeHomework(event.target.getAttribute("data-test"), event.target.getAttribute("data-section"));
  }
  else if (event.target.className.includes("button2") && test_view_type == "assign") {
    assignHomework(event.target);
  }
  else if (event.target.className.includes("testP") && test_view_type == "inCenter") {
    popupGradeTest(event.target.parentNode.parentNode.getAttribute("data-test"), event.target.parentNode.parentNode.getAttribute("data-section"), event.target.getAttribute("data-passagenumber"));
  }
})

// Change the colors of the test boxes
let inCenterTests = document.getElementById("inCenterTests");
inCenterTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    gradeHomework(event.target.getAttribute("data-test"), event.target.getAttribute("data-section"));
  }
  else if (event.target.className.includes("button2") && test_view_type == "assign") {
    assignHomework(event.target);
  }
  else if (event.target.className.includes("testP") && test_view_type == "inCenter") {
    popupGradeTest(event.target.parentNode.parentNode.getAttribute("data-test"), event.target.parentNode.parentNode.getAttribute("data-section"), event.target.getAttribute("data-passagenumber"));
  }
})

// Change the colors of the test boxes
let otherTests = document.getElementById("otherTests");
otherTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && test_view_type == "homework") {
    gradeHomework(event.target.getAttribute("data-test"), event.target.getAttribute("data-section"));
  }
  else if (event.target.className.includes("button2") && test_view_type == "assign") {
    assignHomework(event.target);
  }
  else if (event.target.className.includes("testP") && test_view_type == "inCenter") {
    popupGradeTest(event.target.parentNode.parentNode.getAttribute("data-test"), event.target.parentNode.parentNode.getAttribute("data-section"), event.target.getAttribute("data-passagenumber"));
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
      //let feedbackProm = submitFeedback();
      let sessionProm = submitSessionInfo();
      let hwProm = submitHW();
      let lessonProm = setLessonData();

      let promises = [sessionProm, hwProm, lessonProm];
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

function submitHW() {
  const studentUID = queryStrings()["student"];
  if (studentUID) {
    let hwDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("hw");
    //need to somehow get this promise to return when complete....
    return hwDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        //doc exists - update the doc
        return hwDocRef.update({
          ...testAnswers
        })
      }
      else {
        //doc does not exist - set the doc
        return hwDocRef.set({
          ...testAnswers
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

function validateHW() {

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

//TESTING
function goToTesting() {
  window.location.href = '../../../student-info-test.html?student=' + queryStrings()["student"];
}