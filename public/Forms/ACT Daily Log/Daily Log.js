/* Global Variables */

// The actual tests with their answers and scaled scores
let testData;
fetch("../Test Data/Tests.json").then(response => response.json()).then(data => testData = JSON.parse(data))//.then(() => console.log(testData));

// Student test information
let oldTestAnswers = {};
let testAnswers = {};
let tempAnswers = {};
initialSetup();

// Other needed info
let coloring = {'Completed' : 'green', 'in-time' : 'green', 'not in time' : 'greenShade', 'poor conditions' : 'greenShade', 'previously completed' : 'greenShade', 'forgot' : 'orange', 'assigned' : 'yellow', 'reassigned' : 'yellow', 'in-center' : 'red', 'partial' : 'greenShade', 'did not do' : 'gray', 'white' : 'white', 'guess' : 'pink'};
let test_view_type = undefined;
let lastView = 'Daily Log';
let mark_type = 'answer';
let tab = 'none';
let newStatus = undefined;
let keys_to_skip = ['Status', 'TestType', 'ScaledScore', 'Score', 'Date', 'Time', 'GuessEndPoints']
let date = new Date()
let storage = firebase.storage();

function initialSetup() {
  //FIXME: This needs to set to the date of the session according to schedule and not just the time that the page was loaded
  const studentUID = queryStrings()["student"];

  if (studentUID) {
    //get the student's general data
    // const studentDocRef = firebase.firestore().collection("Students").doc(studentUID);
    // studentDocRef.get()
    // .then((doc) => {
    //   if (doc.exists) {
    //     let studentFirstName = doc.get("studentFirstName");
    //     let studentLastName = doc.get("studentLastName");

    //     let studentNameElem = document.getElementById("studentName");
    //     //studentNameElem.textContent = studentFirstName + " " + studentLastName;
    //   }
    // })
    // .catch((error) => {
    //   console.log(error);
    //   console.log(error.code);
    //   console.log(error.message);
    //   console.log(error.details);
    // });

    //get the student's hw scores
    let hwDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("hw");
    //need to somehow get this promise to return when complete....
    return hwDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        oldTestAnswers = doc.data();
        testAnswers = JSON.parse(JSON.stringify(oldTestAnswers));
        // console.log(oldTestAnswers);
        // console.log(testAnswers);

        //updateTestTypes();
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, document.currentScript.src);
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
  // Make sure there is something passed into the function
  if (elementType.length >= 0) {
    let elements = createElement("div", divClasses);

    // Iterate through each of the elements that need created
    if (attributes.length == values.length && attributes.length >= 0) {
      for (let i = 0; i < elementType.length; i++) {
        elements.appendChild(createElement(elementType[i], classes[i], attributes[i], values[i], text[i]));
      }
    }

    // Return the element
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

/**
 * Combine an array of html elements into a div
 * @param {Array} objects array of html elements
 * @param {Array} class class for the parent div
 * @returns {HTMLElement} a single html div containing the array of elements
 */
function combineElements(objects = [], flexType = [])
{
  // Create the parent Div
  let item = createElement("div", flexType, [], [], "");

  // Append each of the elements to the parent div
  if (objects.length > 1)
  {
    for (let i = 0; i < objects.length; i++)
    {
      item.appendChild(objects[i]);
    }
  }

  // Return the parent div
  return item;

}

/**
 * Add a new session to the daily log
 * @param {self} this the element that called this function
 */
function addSession(self) {
  // Count how many sessions are currently in the log
  session_count = document.querySelectorAll("div[id^=\"session\"]").length;

  // If there are fewer than 4 sessions, create a new one
  if (session_count < 4) {
    // Clone the first session
    ele = document.getElementById("session1").cloneNode(true);

    // Reset various values for the new session
    ele.id = "session" + (session_count + 1).toString();
    ele.querySelector("label[for=\"time1\"]").htmlFor = "time" + (session_count + 1).toString();
    ele.querySelector("#time1").id = "time" + (session_count + 1).toString();
    ele.querySelector("label[for=\"section1\"]").htmlFor = "section" + (session_count + 1).toString();
    ele.querySelector("#section1").id = "section" + (session_count + 1).toString();
    ele.querySelector("#sectionNotes1").id = "sectionNotes" + (session_count + 1).toString();
    ele.querySelector("textarea[id^='sectionNotes']").value = "";
    ele.querySelector("button[onclick=\"openForm('1')\"]").setAttribute("onclick", "openForm('" + (session_count + 1).toString() + "')");

    // Insert the new session
    self.parentNode.parentNode.parentNode.insertBefore(ele, self.parentNode.parentNode)
  }
  
}

/**
 * Deletes the last session
 * @param {self} this the element that called this function
 */
function removeSession(self) {
  // Grab all of the sessions
  sessions = document.querySelectorAll("div[id^=\"session\"]");

  // Count the number of sessions
  session_count = sessions.length;

  // If there is more than 1 session, remove the last one
  if (session_count > 1) {
    sessions[session_count - 1].remove();
  }
}

/**
 * Hide all forms except for the one passed in
 * @param {String} id the id of the form to display
 * @param {String} test_view_type the type of tests to display, if applicable
 */
function openForm(id = undefined, view_type = undefined, element = undefined, pNumber = undefined) {

  // Change the test view type
  if (view_type != undefined) {
    test_view_type = view_type;
  }

  // An array of all the forms that could be displayed
  let forms = ["inCenterTestsForm", "homeworkTestsForm", "otherTestsForm", "dailyLog", "englishLessonsForm", "mathLessonsForm", "readingLessonsForm", "scienceLessonsForm", "testAnswersPopup"];

  // If selecting a lessons form, adjust the id accordingly
  if (id == '1' || id == '2' || id == '3' || id == '4') {
    let section = document.getElementById("section" + id);
    if (section.value != "") {
      id = section.value.toLowerCase() + "LessonsForm";
    }
    else {
      lastView = 'none'
      id = "dailyLog";
    }
  }

  // if opening a test form, reset it
  if (id != undefined && id.includes('Tests')) {
    // clear the test formatting
    clearInCenterFormating();

    // Reset the toggle buttons (between answer and guess)
    toggleButtons('answer');

    // Add final guess point for passages if needed
    const info = getTestInfo();
    if (info[2] != undefined) {
      for (let i = 0; i < testData[info[0]][info[1].toLowerCase() + "Answers"][testData[info[0]][info[1].toLowerCase() + "Answers"].length - 1]["passageNumber"]; i++) {
        checkPassageGuesses(i + 1);
      }
    }

    // update test visuals
    updateTestGraphics(test_view_type);

  }
  else if (id != undefined && id.includes('Popup')) {
    // clear the popup
    removeAnswers();

    // Get the test, section, and passageNumber
    let test = undefined;
    let section = undefined;
    let passageNumber = undefined;
    if (element != undefined) {
      test = element.getAttribute("data-test") ?? element.parentNode.getAttribute("data-test");
      section = element.getAttribute("data-section") ?? element.parentNode.getAttribute("data-section");
      passageNumber = element.getAttribute("data-passageNumber");
    }
    else {
      let headerText = document.getElementById("answersPopupHeader").innerHTML;
      test = headerText.split(" - ")[0];
      section = headerText.split(" - ")[1];
      passageNumber = headerText.split(" - ")[2];
    }

    if (pNumber != undefined) {
      passageNumber = pNumber;
    }

    // update popup visuals
    updatePopupGraphics(id, test, section, (passageNumber ?? 1));
  }

  // Hide all forms except for the one selected
  for (let i = 0; i < forms.length; i++) {
    let form = document.getElementById(forms[i]);
    if (forms[i] != id) {
      form.style.display = "none";
    }
    else {
      if (id == "dailyLog") {

        if (lastView == "dailyLog") {
          if (tab == 'dailyLog') {
            swap();
            tab = 'none';
          }
          form.style.display = "none"
          lastView = 'none';
        }

        else {
          if (tab == 'none') {
            swap();
            tab = 'dailyLog';
          }
          lastView = id;
          form.style.display = "block"
        }

      }
      else {
        if (!id.includes('Popup')) {
          lastView = id;
        }
        form.style.display = "flex";
      }
    }
  }

  // Close the print popup if it is open
  togglePrintPopup();

  //console.log("temp", tempAnswers);
  //console.log("test", testAnswers);

  // Open the last form / popup
  if (id == undefined) {
    openForm(lastView);
  }
}

/**
 * Delete the children of every test box
 */
function clearInCenterFormating() {
  // Get a list of all test boxes
  let test_boxes = document.querySelectorAll("div[data-section]")

  // Iterate through each test and delete their children
  for (let box = 0; box < test_boxes.length; box++) {
    if (test_boxes[box].childElementCount > 1) {
      let children = test_boxes[box].querySelectorAll("div");
      for (let child = 0; child < children.length; child++) {
        children[child].remove();
      }
    }

    // Remove the class 'grid*' from the test box
    let classes = ['grid1', 'grid2', 'grid3', 'grid4', 'grid5', 'grid6', 'grid7', 'grid8', 'grid9', 'grid10']
    for (let c = 0; c < classes.length; c++) {
      test_boxes[box].classList.remove(classes[c]);
    }

    // Remove the color classes
    let colors = Object.values(coloring);
    for (let c = 0; c < colors.length; c++) {
      test_boxes[box].classList.remove(colors[c]);
    }

    // Remove the 'homeworkBox' class
    test_boxes[box].classList.remove('homeworkBox');

    // Remove the 'highlight' class
    test_boxes[box].classList.remove('highlight');

    // Clear the popup
    let popup = document.getElementById("perfectScorePopup")
    popup.classList.remove("show")

    // Reset the innerHTML text
    test_boxes[box].innerHTML = "";
  }
}

function updateTestGraphics(test_view_type) {
  // Get a list of all test boxes
  let test_boxes = document.querySelectorAll("div[data-section]")

  // For each box, if it is needed:
  //   1) Add children
  //   2) set the background color
  //   3) Set the score, and text color
  for (let box = 0; box < test_boxes.length; box++) {
    let test = test_boxes[box].getAttribute("data-test")
    let section = test_boxes[box].getAttribute("data-section")
    let test_type = testAnswers[test]?.[section]?.["TestType"]
    if ((test_type ?? test_view_type) == 'inCenter') {
      updateInCenterTest(test_boxes[box], test, section)
    }
    //else if ((test_type ?? test_view_type) == 'homework') {
    else {
      updateHomeworkTest(test_boxes[box], test, section)
    }
  }
}

function updateInCenterTest(testBox, test, section) {
  // Get the number of passages for the given test
  const numAnswers = testData[test][section.toLowerCase() + "Answers"].length
  const numberOfPassages = testData[test][section.toLowerCase() + "Answers"][numAnswers - 1]["passageNumber"]

  // Create the passages within the test
  for (let child = 0; child < numberOfPassages; child++) {
    // Initial passage element
    let ele = createElement("div", ["border"], ["data-passageNumber"], [(child + 1).toString()], (child + 1).toString(), "border");
    
    // if the passage exists within the testAnswers, color it and set its score
    if (testAnswers[test]?.[section]?.[child + 1] != undefined && testAnswers[test]?.[section]?.[child + 1]?.['Status'] == 'Completed') {
      ele.classList.add(coloring['in-time']) // color it green

      // Get the total number of questions in the passage
      let numberOfQuestions = 0;
      for (let i = 0; i < testData[test][section.toLowerCase() + "Answers"].length; i++) {
        if (testData[test][section.toLowerCase() + "Answers"][i]["passageNumber"] == (child + 1)) {
          numberOfQuestions += 1;
        }
      }

      // Set the score
      ele.innerHTML = (numberOfQuestions - Object.keys(testAnswers[test][section][child + 1]["Answers"]).length).toString() + " / " + numberOfQuestions.toString()
    }
    else if (testAnswers[test]?.[section]?.[child + 1]?.['Status'] != undefined) {
      ele.innerHTML = 'Completed';
      ele.classList.add(coloring['previously completed']) // color it light green
    }


    // Add the child to the test
    testBox.appendChild(ele)
  }

  // Set the correct grid number (determined by the number of passages)
  testBox.className = testBox.className + " grid" + numberOfPassages.toString()
}

function updateHomeworkTest(testBox, test, section) {
  // Get the status from the testAnswers, if it exists
  let status = testAnswers[test]?.[section]?.["Status"];

  // If it does exist, change the background color and inner html
  if (status != undefined) {
    testBox.classList.add(coloring[testAnswers[test][section]["Status"]]);
    //testBox.innerHTML = testAnswers[test]?.[section]?.["ScaledScore"] ?? "";
    testBox.innerHTML = testAnswers[test]?.[section]?.["ScaledScore"] ?? "";
    if (testBox.innerHTML != "") {
      testBox.classList.add("homeworkBox");
    }
    else {
      //testBox.innerHTML = convertFromDateInt(testAnswers[test]?.[section]?.['Date'])['shortDate'] ?? ""; // Show the date
      // Adding 8 hours to show the number of days since it was assigned / not finished
      if (testAnswers[test]?.[section]?.['Status'] != 'previously completed') {
        testBox.innerHTML = Math.floor((date.getTime() + 28800000 - testAnswers[test]?.[section]?.['Date']) / 86400000).toString() + " days ago" ?? "";
      }
      else {
        testBox.innerHTML = "Previously Completed"
        testBox.classList.add("white");
      }
    }
  }
}

function setHomeworkStatus(status, gradeHomework = "False", element = undefined) {
  // Get the test and section from the header
  let headerText = document.getElementById("answersPopupHeader").innerHTML;
  let test = headerText.split(" - ")[0];
  let section = headerText.split(" - ")[1];

  // Reset the test and section if working with an assigned test
  if (element != undefined) {
    test = element.getAttribute("data-test")
    section = element.getAttribute("data-section")
  }
  const oldStatus = oldTestAnswers[test]?.[section]?.['Status']

  // Set the status and testType in the testAnswers
  let current_status = testAnswers[test]?.[section]?.['Status']

  if ((current_status == undefined || current_status == 'forgot' || current_status == 'assigned' || current_status == 'did not do') &&
      (status == 'forgot' || status == 'assigned' || status == 'did not do')) {
    // Didn't mean to assign the homework, undo it
    if (current_status == 'assigned' && status == 'assigned') {
      delete testAnswers[test][section];
      if (Object.keys(testAnswers[test]).length == 0) {
        delete testAnswers[test]
      }
    }
    // Set the homework to 'assigned'
    else if (status == 'assigned' && current_status == undefined) {
      if (oldStatus == 'assigned') {
        setObjectValue([test, section], oldTestAnswers[test][section], testAnswers);
      }
      else {
        setObjectValue([test, section, "Status"], status, testAnswers)
        setObjectValue([test, section, "TestType"], 'homework', testAnswers)
        setObjectValue([test, section, 'Date'], date.getTime(), testAnswers);
      }
    }
    // homework is being reassigned
    else if (status == 'assigned' && current_status == 'did not do') {
      setObjectValue([test, section, "Status"], 'reassigned', testAnswers)
      setObjectValue([test, section, "TestType"], 'homework', testAnswers)
      setObjectValue([test, section, 'Date'], date.getTime(), testAnswers);
    }
    // homework was either left at home ('forgot') or they didn't do it
    else if (current_status != undefined && status != 'assigned') {
      setObjectValue([test, section, "Status"], status, testAnswers)
      setObjectValue([test, section, "TestType"], 'homework', testAnswers)
    }
  }
  // Previously completed
  else if ((current_status == undefined || current_status == 'assigned' || current_status == 'reassigned') && status == 'previously completed') {
    setObjectValue([test, section, "Status"], status, testAnswers)
    setObjectValue([test, section, "TestType"], 'homework', testAnswers)
    setObjectValue([test, section, 'Date'], date.getTime(), testAnswers);
  }
  // Partially completed
  else if (current_status == 'assigned' || current_status == 'reassigned' || status == 'partial') {
    newStatus = status;
  }

  // Open Test to print (if needed)
  if (current_status == undefined && (status == 'assigned' || status == 'reassigned')) {
    openTest(test, section);
  }

  // Exit the popup
  let popup = document.getElementById("submitHomeworkPopup")
  if (gradeHomework == 'True' && (current_status == 'assigned' || current_status == 'reassigned' || current_status == 'forgot')) {
    newStatus = status;
    submitAnswersPopup();
  }
  else if (status == 'previously completed' || status == 'assigned' || status == 'reassigned' || ((status == 'forgot' || status == 'did not do') && (current_status == 'assigned' || current_status == 'reassigned') ) ) {
    popup.classList.remove("show");
    openForm(lastView);
  }
  else if (gradeHomework == 'True' && (current_status != 'assigned' && current_status != 'reassigned' && current_status != 'forgot')) {
    resetMessages();
    let assignMessage = document.getElementById("assignFirst")
    assignMessage.style.display = "inline";
  }

}

function updatePopupGraphics(id, test, section, passageNumber) {

  // Change the header for both popups with the test, section, and passageNumber (if applicable)
  let popups = document.querySelectorAll("div[id$=\"PopupHeader\"]");
  for (let i = 0; i < popups.length; i++) {
    if (passageNumber != undefined) {
      popups[i].innerHTML = test + " - " + section + " - " + passageNumber
    }
    else {
      if (popups[i].id.includes('answers')) {
        popups[i].innerHTML = test + " - " + section + " - 1"
      }
      else {
        popups[i].innerHTML = test + " - " + section
      }
    }
  }

  // Check to see if either left arrow or right arrows need to be hidden
  let last_passage_number = testData[test][section.toLowerCase() + "Answers"][testData[test][section.toLowerCase() + "Answers"].length - 1]["passageNumber"]
  let leftArrow = document.getElementById("leftArrow")
  let rightArrow = document.getElementById("rightArrow")

  if (passageNumber != 1 && passageNumber != undefined && test_view_type == 'homework') {
    leftArrow.parentNode.style.visibility = "visible"
  }

  if (passageNumber != last_passage_number && test_view_type == 'homework') {
    rightArrow.parentNode.style.visibility = "visible"
  }

  // Get a list of all the answers for the given section
  let allAnswers = testData[test][section.toLowerCase() + "Answers"];
  let passageAnswers = []
  let passageNumbers = []

  // Set the temp Answers, if needed
  if (!(test in tempAnswers) || !(section in tempAnswers[test])) {
    tempAnswers = {}
    setObjectValue([test, section, passageNumber, "Answers"], [], tempAnswers);
    setObjectValue([test, section, passageNumber, "Time"], 0, tempAnswers);
    if (testAnswers[test]?.[section] != undefined) {
      tempAnswers[test][section] = JSON.parse(JSON.stringify(testAnswers[test][section]))
    }
  }

  // Add the passageNumber if needed
  if (!(passageNumber in tempAnswers[test][section])) {
    setObjectValue([test, section, passageNumber, "Answers"], [], tempAnswers);
    setObjectValue([test, section, passageNumber, "Time"], 0, tempAnswers);
  }

  // Get the answers for the passage passed in
  for (let answer = 0; answer < allAnswers.length; answer++) {
    if (allAnswers[answer]["passageNumber"] == (passageNumber ?? '1')) {
      passageAnswers.push(allAnswers[answer][answer + 1])
      passageNumbers.push(answer + 1)
    }
  }

  // Display the answers, (color them too if needed)
  let passage = document.getElementById("passage");
  for (let answer = 0; answer < passageAnswers.length; answer++) {
    if (answer == 0) {
      if (shouldMarkAsGuessed(test, section, passageNumbers[answer]) == false) {
        ele = createElements(["div", "div", "div"], [["popupValue"], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "firstAnswer", "button2"]);
      } 
      else {
        ele = createElements(["div", "div", "div"], [["popupValue", coloring['guess']], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "firstAnswer", "button2"]);
      }
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer])
      ele.setAttribute("data-answer", passageAnswers[answer])
      if (tempAnswers[test][section][passageNumber]["Answers"].includes((passageNumbers[answer]).toString())) {
        ele.classList.add('red')
      }
    }
    else {
      if (shouldMarkAsGuessed(test, section, passageNumbers[answer]) == false) {
        ele = createElements(["div", "div", "div"], [["popupValue"], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "button2"]);
      }
      else {
        ele = createElements(["div", "div", "div"], [["popupValue", coloring['guess']], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "button2"]);
      }
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer]);
      ele.setAttribute("data-answer", passageAnswers[answer]);
      if (tempAnswers[test][section][passageNumber]["Answers"].includes((passageNumbers[answer]).toString())) {
        ele.classList.add('red')
      }
    }
  }

  // Set the time
  if (test_view_type == 'inCenter') {
    let timeMinutes = document.getElementById("time-minutes")
    let timeSeconds = document.getElementById("time-seconds")
    timeMinutes.value = Math.floor(tempAnswers[test][section][passageNumber]["Time"] / 60)
    timeSeconds.value = tempAnswers[test][section][passageNumber]["Time"] % 60 
    timeMinutes.parentNode.style.visibility = "visible";
  }

  // Reset the toggles back to marking answers
  //toggleButtons('answer');

}

function shouldMarkAsGuessed(test, section, question) {
  const guessEndPoints = tempAnswers[test]?.[section]?.['GuessEndPoints']
  if (guessEndPoints == undefined) {
    return false
  }
  else {
    let pointIndex = 0;
    for (let point = 0; point < guessEndPoints.length; point++) {
      if (parseInt(guessEndPoints[point]) >= parseInt(question)) {
        pointIndex = point;
        break;
      }
    }
    if (question == guessEndPoints[pointIndex]){
      return true;
    }
    else if (guessEndPoints.length % 2 == 0) {
      if (parseInt(question) < parseInt(guessEndPoints[pointIndex])) {
        if (pointIndex % 2 == 1) {
          return true;
        }
        else {
          return false;
        }
      }
      else {
        return false;
      }
    }
    else {
      if (parseInt(question) < parseInt(guessEndPoints[pointIndex])) {
        if (pointIndex % 2 == 1) {
          return true;
        }
        else {
          return false;
        }
      }
      else {
        return true;
      }
    }
  }
}

function resetMessages() {
  // Reset the messages
  let guessMessage = document.getElementById("guessFirst");
  let gradeMessage = document.getElementById("gradeFirst");
  let assignMessage = document.getElementById("assignFirst")
  guessMessage.style.display = "none";
  gradeMessage.style.display = "none";
  assignMessage.style.display = "none";
}

function getPassageFirstQuestion(passageNumber) {
  const info = getTestInfo();

  for (let i = 0; i < testData[info[0]][info[1].toLowerCase() + "Answers"].length; i++) {
    if (parseInt(testData[info[0]][info[1].toLowerCase() + "Answers"][i]['passageNumber']) == parseInt(passageNumber)) {
      return i + 1;
    }
  }
}

function getPassageLastQuestion(passageNumber) {
  const info = getTestInfo();

  for (let i = 0; i < testData[info[0]][info[1].toLowerCase() + "Answers"].length; i++) {
    if (parseInt(testData[info[0]][info[1].toLowerCase() + "Answers"][i]['passageNumber']) == (parseInt(passageNumber) + 1)) {
      return i;
    }
  }

  return testData[info[0]][info[1].toLowerCase() + "Answers"].length;
}

function checkPassageGuesses(passageNumber, submitting = 'False') {
  const info = getTestInfo();

  const start = getPassageFirstQuestion(passageNumber);
  const end = getPassageLastQuestion(passageNumber);

  let count = 0;
  const guessEndPoints = tempAnswers[info[0]]?.[info[1]]?.['GuessEndPoints'] ?? [];
  for (let i = 0; i < guessEndPoints.length; i++) {
    if (parseInt(guessEndPoints[i]) >= start && parseInt(guessEndPoints[i]) <= end) {
      // Add the endpoint to the testAnswers if it's not there
      if (submitting == 'True') {
        if (testAnswers[info[0]]?.[info[1]]?.['GuessEndPoints'] == undefined) {
          setObjectValue([info[0], info[1], 'GuessEndPoints'], [], testAnswers);
        }
        if (!testAnswers[info[0]][info[1]]['GuessEndPoints'].includes(guessEndPoints[i]) || (i > 0 && guessEndPoints[i] == guessEndPoints[i - 1])) {
          testAnswers[info[0]][info[1]]['GuessEndPoints'].push(guessEndPoints[i])
        }
      }
      count++;
    }
  }

  // Add an end point if needed
  if (count % 2 == 1) {
    tempAnswers[info[0]][info[1]]['GuessEndPoints'].push(end.toString());
    
    // Add it to the testAnswers
    if (submitting == 'True' && !testAnswers[info[0]][info[1]]['GuessEndPoints'].includes(end.toString())) {
      testAnswers[info[0]][info[1]]['GuessEndPoints'].push(end.toString())
    }
    guess_start = 0;
    guess_end = end.toString()
  }
}

function submitAnswersPopup(passageGradeType = 'False', swap = 'False') {
  // Grab the test info
  let info = getTestInfo();
  const status = testAnswers[info[0]]?.[info[1]]?.['Status']
  const guesses = tempAnswers[info[0]]?.[info[1]]?.['GuessEndPoints']
  let oldStatus = oldTestAnswers[info[0]]?.[info[1]]?.['Status']
  let last_passage_number = testData[info[0]][info[1].toLowerCase() + "Answers"][testData[info[0]][info[1].toLowerCase() + "Answers"].length - 1]["passageNumber"]

  // Toggle the submit button popups
  let popup = document.getElementById("submitHomeworkPopup")
  let popup2 = document.getElementById("perfectScorePopup")
  if (swap == 'True') {
    resetMessages();
    if (test_view_type == 'homework') {
      popup.classList.toggle("show");
    }
    else if (test_view_type == 'inCenter') {
      popup2.classList.toggle("show")
    }
    return;
  }

  // Find and define the message elements
  let guessMessage = document.getElementById("guessFirst");
  let gradeMessage = document.getElementById("gradeFirst");

  // Check to see if the test / passage can be graded
  if (test_view_type == 'inCenter' && swap == 'False') {
    if (oldTestAnswers[info[0]]?.[info[1]]?.[info[2]] == undefined) {
      if (passageGradeType != 'grade') {
        setObjectValue([info[0], info[1], info[2]], tempAnswers[info[0]][info[1]][info[2]], testAnswers);
        setObjectValue([info[0], info[1], info[2], 'Status'], passageGradeType, testAnswers);
        setObjectValue([info[0], info[1], 'TestType'], 'inCenter', testAnswers);
      }
      else {
        setObjectValue([info[0], info[1], info[2]], tempAnswers[info[0]][info[1]][info[2]], testAnswers);
        setObjectValue([info[0], info[1], info[2], 'Status'], 'Completed', testAnswers);
        setObjectValue([info[0], info[1], 'TestType'], 'inCenter', testAnswers);
      }
      checkPassageGuesses(info[2], 'True');
    }
    else {
      // reset the temp answers
      setObjectValue([info[0], info[1], info[2]], testAnswers[info[0]][info[1]][info[2]], tempAnswers);
    }
  }
  else if (test_view_type == 'homework' && info[2] == last_passage_number && (oldStatus != 'in-time' && oldStatus != 'in-center' && oldStatus != 'over-time' && oldStatus != 'not-timed' && oldStatus != 'partial')) {

    if (newStatus != 'partial' || (newStatus == 'partial' && guesses != undefined)) {
      // Calculate how many questions they got correct
      let totalMissed = 0;
      for (const [key, value] of Object.entries(tempAnswers[info[0]][info[1]])) {
        if (!keys_to_skip.includes(key)) {
          totalMissed += tempAnswers[info[0]][info[1]][key]['Answers'].length
        }
      }
      let score = testData[info[0]][info[1].toLowerCase() + "Answers"].length - totalMissed;
    
      // Calculate the scaled score
      let scaleScore = 0;
      for (const [key, value] of Object.entries(testData[info[0]][info[1].toLowerCase() + "Scores"])) {
        if (score >= parseInt(value, 10)) {
          scaledScore = 36 - parseInt(key);
          break;
        }
      }

      // Set the information
      if (info[2] == last_passage_number) {
        setObjectValue([info[0], info[1]], tempAnswers[info[0]][info[1]], testAnswers);
        setObjectValue([info[0], info[1], 'TestType'], 'homework', testAnswers);
        setObjectValue([info[0], info[1], 'Date'], date.getTime(), testAnswers);
        setObjectValue([info[0], info[1], 'Score'], score, testAnswers);
        setObjectValue([info[0], info[1], 'ScaledScore'], scaledScore, testAnswers);
        setObjectValue([info[0], info[1], 'Status'], (newStatus), testAnswers);
      }
    }
    else {
      guessMessage.style.display = "inline";
    }
  }
  else {
    gradeMessage.style.display = "inline";
  }

  // Go back to one of the test forms
  if (!(info[2] != last_passage_number && test_view_type == 'homework') && (newStatus != 'partial' || (newStatus == 'partial' && guesses != undefined)) && swap == 'False') {
    popup.classList.remove("show");
    openForm(lastView);
  }
}

function resetAnswers() {
  // Remove the answers
  removeAnswers();
  
  // Grab the test info
  let info = getTestInfo();

  // Reset the tempAnswers array for the given passage
  let status = tempAnswers[info[0]]?.[info[1]]?.['Status'];
  if (status == undefined || status == 'assigned' || status == 'reassigned') {
    tempAnswers[info[0]][info[1]][info[2]]['Answers'] = [];
    tempAnswers[info[0]][info[1]][info[2]]['Time'] = 0;
  }

  // Set up the testAnswersPopup again
  openForm('testAnswersPopup');
}

function getTestInfo() {
  let headerText = document.getElementById("answersPopupHeader").innerHTML;
  let test = headerText.split(" - ")[0] ?? undefined;
  let section = headerText.split(" - ")[1] ?? undefined;
  let passageNumber = headerText.split(" - ")[2] ?? undefined;

  return [test, section, passageNumber]
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

  // Hide the arrows
  let leftArrow = document.getElementById("leftArrow")
  let rightArrow = document.getElementById("rightArrow")
  leftArrow.parentNode.style.visibility = "hidden"
  rightArrow.parentNode.style.visibility = "hidden"

  // Reset the time
  let timeMinutes = document.getElementById("time-minutes")
  let timeSeconds = document.getElementById("time-seconds")
  timeMinutes.parentNode.style.visibility = "hidden";

  timeMinutes.value = "0"
  timeSeconds.value = "0"

  // Remove the 'highlight' class
  let test_boxes = document.querySelectorAll("div[data-section]")
  for (let box = 0; box < test_boxes.length; box++) {
    test_boxes[box].classList.remove('highlight');
  }

}

function removeTest() {
  // Get the test and section from the header
  let headerText = document.getElementById("answersPopupHeader").innerHTML;
  let test = headerText.split(" - ")[0];
  let section = headerText.split(" - ")[1];
  let oldStatus = oldTestAnswers[test]?.[section]?.['Status']

  // Make sure that the section exists
  if (testAnswers[test]?.[section] != undefined && (oldStatus == undefined || oldStatus == 'assigned')) {
    // Delete the section
    delete testAnswers[test][section]

    // Check to see if the test needs deleted
    if (objectChildCount([test], testAnswers) == 0) {
      delete testAnswers[test]
    }

    if (oldStatus == 'assigned') {
      setObjectValue([test, section], oldTestAnswers[test][section], testAnswers);
    }
  }

  // Return to the last view
  openForm(lastView)

}

function removePassage() {

  if (test_view_type == 'homework') {
    removeTest();
    return;
  }

  // Get the test and section from the header
  let headerText = document.getElementById("answersPopupHeader").innerHTML;
  let test = headerText.split(" - ")[0];
  let section = headerText.split(" - ")[1];
  let passageNumber = headerText.split(" - ")[2];

  // Make sure that the section exists
  if (testAnswers[test]?.[section]?.[passageNumber] != undefined && test_view_type == 'inCenter') {
    // Delete the passage
    delete testAnswers[test][section][passageNumber]
    delete tempAnswers[test][section][passageNumber]

    // Check to see if the section needs deleted
    if (objectChildCount([test, section], testAnswers) == 0) {
      delete testAnswers[test][section]
    }

    // Check to see if the test needs deleted
    if (objectChildCount([test], testAnswers) == 0) {
      delete testAnswers[test]
    }
  }

  // Return to the last view
  openForm(lastView)

}

function objectChildCount(path, object) {

  // Initialize a variable
  let location = object;

  // Move to the location in the object
  for (let i = 0; i < path.length; i++) {
    location = location[path[i]]
  }

  count = 0;
  object_keys = Object.keys(location);
  for (let i = 0; i < object_keys.length; i++) {
    if (!keys_to_skip.includes(object_keys[i])) {
      count += 1
    }
  }

  return count
}

function nextPassage(element) {

  let info = getTestInfo();

  openForm('testAnswersPopup', undefined, undefined, parseInt(info[2], 10) + 1)

}

function previousPassage(element) {

  let info = getTestInfo();

  openForm('testAnswersPopup', undefined, undefined, parseInt(info[2], 10) - 1)

}

function submitDailyLog() {
  document.getElementById("errMsg").textContent = "";
  if (validateSessionInfo() && validateHW()) {
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
        // console.log("Everything submitted");
        removeUnloadListener();
        window.location.reload();
        //window.history.back();
      })
      .catch((error) => {
        handleFirebaseErrors(error, document.currentScript.src);
        document.getElementById("errMsg").textContent = error;
        document.getElementById("spinnyBoi").style.display = "none";
      });
    }
  }
  else {
    //not validated
    //error messages should be handled in each function
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
      // console.log("feedback saved");
    })
    .catch((error) => {
      handleFirebaseErrors(error, document.currentScript.src);
    });
  }
  else {
    return Promise.resolve("There is no feedback");
  }
}

function goToDashboard() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;

        switch (role) {
          case "student":
            window.location.replace(location.origin + "/Dashboard/Student");
            break;
          case "parent":
            window.location.replace(location.origin + "/Dashboard/Parent");
            break;
          case "tutor":
            window.location.replace(location.origin + "/Dashboard/Tutor");
            break;
          case "secretary":
            window.location.replace(location.origin + "/Dashboard/Secretary");
            break;
          case "admin":
            window.location.replace(location.origin + "/Dashboard/Admin");
            break;
          case "dev":
            window.location.replace(location.origin + "/Dashboard/Admin");
            break;
          default:
            
        }
      })
      .catch((error) => {
        handleFirebaseErrors(error, document.currentScript.src);
      });
    }
    else {
      window.location.replace(location.origin + "/Sign-In/Sign-In");
    }
  });
}

//TESTING
function goToTesting() {
  window.location.href = '../../student-info-test.html?student=' + queryStrings()["student"];
}

function validateSessionInfo() {
  let dailyLogSessions = document.getElementById("dailyLog").querySelectorAll("div[id^='session']");
  let numSessions = dailyLogSessions.length;

  for (let i = 0; i < numSessions; i++) {
    let section = dailyLogSessions[i].querySelector(`#section${i+1}`);
    let notes = dailyLogSessions[i].querySelector(`#sectionNotes${i+1}`);
    let time = dailyLogSessions[i].querySelector(`#time${i+1}`);
    if (section.value == "" || notes.value == "" || time.value == "") {
      document.getElementById("errMsg").textContent = "Please make sure that the log is completely filled out";
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
  let sessionTimeNum = date.getTime();
  let currentUser = firebase.auth().currentUser;

  if (currentUser) {
    let tutor = currentUser.uid;
    const studentUID = queryStrings()["student"];
    if (studentUID) {
      //create the session info
      let sessionNoteProms = [];

      for (let i = 0; i < numSessions; i++) {
        let section = dailyLogSessions[i].querySelector(`#section${i+1}`);
        let time = dailyLogSessions[i].querySelector(`#time${i+1}`);
        let sectionNotes = dailyLogSessions[i].querySelector(`#sectionNotes${i+1}`);
    
        sessionNoteProms.push(sendNotes(section.value.toLowerCase(), sectionNotes.value, sessionTimeNum, tutor, true));
    
        sectionInfo[section.value] = {
          time: parseInt(time.value),
          sectionNotes: sectionNotes.value
        }
      }

      Promise.all(sessionNoteProms).then(() => {
        sessionInfo["incompleteHomework"] = numHomeworkNotComplete();
        sessionInfo["sections"] = sectionInfo;
        sessionInfo["tutor"] = tutor;

        let sessionDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("sessions");
        //need to somehow get this promise to return when complete....
        return sessionDocRef.get()
        .then((doc) => {
          if (doc.exists) {
            //doc exists - update the doc
            return sessionDocRef.update({
              [`${sessionTimeNum.toString()}`]: sessionInfo,
              // englishTotalTime: firebase.firestore.FieldValue.increment(sectionInfo.English?.time ?? 0),
              // mathTotalTime: firebase.firestore.FieldValue.increment(sectionInfo.Math?.time ?? 0),
              // readingTotalTime: firebase.firestore.FieldValue.increment(sectionInfo.Reading?.time ?? 0),
              // scienceTotalTime: firebase.firestore.FieldValue.increment(sectionInfo.Science?.time ?? 0),
              // [`tutors.${tutor}`]: firebase.firestore.FieldValue.increment(1)
            })
          }
          else {
            //doc does not exist - set the doc
            return sessionDocRef.set({
              [`${sessionTimeNum.toString()}`]: sessionInfo,
              // englishTotalTime: sectionInfo.English?.time ?? 0,
              // mathTotalTime: sectionInfo.Math?.time ?? 0,
              // readingTotalTime: sectionInfo.Reading?.time ?? 0,
              // scienceTotalTime: sectionInfo.Science?.time ?? 0,
              // tutors: {[`${tutor}`]: 1}
            })
          }
        })
        .catch((error) => {
          handleFirebaseErrors(error, document.currentScript.src);
          return Promise.reject(error);
        });
      })
      .catch((error) => {
        handleFirebaseErrors(error, document.currentScript.src);
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
      handleFirebaseErrors(error, document.currentScript.src);
      return Promise.reject(error);
    });
  }
  else {
    console.log("There is no student selected!!!");
    return Promise.reject("There is no student selected!!!");
  }
}

function validateHW() {
  //FIXME: check for hw not done and add to object
  //find all of the hw that was assigned last session and check if it's status has changed
  for (const test in oldTestAnswers) {
    for (const section in oldTestAnswers[test]) {
      if (oldTestAnswers[test][section]["TestType"] == "homework") {
        if (oldTestAnswers[test][section]["Status"] == "assigned") {
          if (testAnswers[test][section]["Status"] == "assigned") {
            document.getElementById("errMsg").textContent = "Please report on test " + test + " " + section;
            return false;
          }
        }
      }
    }
  }
  return true;
}

function numHomeworkNotComplete() {
  let incomplete = 0;

  //check for assigned hw on old data
  for (const test in oldTestAnswers) {
    for (const section in oldTestAnswers[test]) {
      if (oldTestAnswers[test][section]["TestType"] == "homework") {
        if (oldTestAnswers[test][section]["Status"] == "assigned") {
          if (testAnswers[test][section]["Status"] == "forgot" || testAnswers[test][section]["Status"] == "did not do") {
            incomplete++;
          }
        }
      }
    }
  }
  //return the result
  return incomplete;
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

function getArrayIndex(value, arr) {
  // Find and return the index for the value
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == value) {
      return i;
    }
  }

  return -1;
}

function openTest(test, section = undefined) {

  let path = test + (section != undefined ? (" - " + section) : "");
  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Tests/' + path + '.pdf');
  ref.getDownloadURL().then((url) => {
      open(url);
    })

}

function swap() {
  let nav = document.getElementById("sideNav");
  nav.classList.toggle("nav_disabled")
  nav.classList.toggle("nav_enabled")
}

function toggleButtons(active) {
  // Find the buttons to toggle
  let answerButton = document.getElementById("answerButton");
  let guessButton = document.getElementById("guessButton");

  // Swap the buttons (if needed)
  if (active == 'answer') {
    mark_type = 'answer';
    answerButton.classList.add("buttonToggleOn")
    answerButton.classList.remove("buttonToggleOff")
    guessButton.classList.add("buttonToggleOff")
    guessButton.classList.remove("buttonToggleOn")
  }
  else if (active == 'guess') {
    mark_type = 'guess';
    answerButton.classList.remove("buttonToggleOn")
    answerButton.classList.add("buttonToggleOff")
    guessButton.classList.add("buttonToggleOn")
    guessButton.classList.remove("buttonToggleOff")
  }
}

function togglePrintPopup(test = undefined) {

  // Grab the printPopup element
  let popup = document.getElementById("printPopup");

  // Either display or hide the popup
  if (test == popup.getAttribute('data-test') || test == undefined) {
    popup.classList.remove("show");
    popup.setAttribute('data-test', 'None')
  }
  else {
    popup.classList.add("show");
    popup.setAttribute("data-test", test);
  }

}

function popupPrint(section = undefined) {
  let popup = document.getElementById("printPopup");
  openTest(popup.getAttribute("data-test"), section);
}

function adjustPrintPopup() {
  
  // No test selected, do nothing
  if (scrollingTarget == undefined) {
    return;
  }

  // Set needed variables
  let popup = document.getElementById("printPopup");
  const testLocation = scrollingTarget.getBoundingClientRect().top + (scrollingTarget.clientHeight * 0.5) + 5
  const pageBottom = window.innerHeight;
  const offset = popup.getBoundingClientRect().height * 0.5;

  // Set the min height for scrolling
  let minHeight = document.getElementById('homeworkTestHeaders').getBoundingClientRect().bottom;
  if (minHeight == 0) {
    minHeight = document.getElementById('inCenterTestHeaders').getBoundingClientRect().bottom;
    if (minHeight == 0) {
      minHeight = document.getElementById('otherTestHeaders').getBoundingClientRect().bottom;
    }
  }

  // Set the min height for scrolling
  let maxHeight = document.getElementById('homeworkSubmitDiv').getBoundingClientRect().top;
  if (maxHeight == 0) {
    maxHeight = document.getElementById('inCenterSubmitDiv').getBoundingClientRect().top;
    if (minHeight == 0) {
      maxHeight = document.getElementById('otherSubmitDiv').getBoundingClientRect().top;
    }
  }

  // Set the height for the printPopup
  // Normal
  if (testLocation < maxHeight && testLocation > minHeight) {
    if (testLocation + offset >= pageBottom) {
      popup.style.top = (window.innerHeight - popup.clientHeight).toString() + 'px';
    }
    else if (testLocation - offset <= 0) {
      popup.style.top = '0px';
    }
    else {
      popup.style.top = ( testLocation - offset).toString() + 'px';
    }
  }
  // Off the bottom of the page
  else if (testLocation + offset >= pageBottom) {
    popup.style.top = (window.innerHeight - popup.clientHeight).toString() + 'px';
  }
  // Off the top of the page
  else if (testLocation - offset <= 0 && testLocation > minHeight) {
    popup.style.top = '0px';
  }
  // Before minHeight
  else if (testLocation < minHeight) {
    popup.style.top = (minHeight - offset).toString() + 'px';
  }
  // After maxHeight
  else if (testLocation > maxHeight) {
    popup.style.top = (maxHeight - offset).toString() + 'px';
  }
}