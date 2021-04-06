/* Global Variables */

// The actual tests with their answers and scaled scores
let testData;
fetch("../Test Data/Tests.json").then(response => response.json()).then(data => testData = JSON.parse(data)).then(() => console.log(testData));

// Student test information
let oldTestAnswers = {};
let testAnswers = {};
let tempAnswers = {};
let sessionTime;
initialSetup();

// Other needed info
let coloring = {'in-time' : 'green', 'over-time' : 'greenShade', 'not-timed' : 'greenShade', 'forgot' : 'orange', 'assigned' : 'yellow', 'in-center' : 'red', 'partial' : 'greenShade', 'did not do' : 'gray'};
let test_view_type = undefined;
let lastView = 'Daily Log';
let newStatus = undefined;
//testAnswers = {'MC3' : {'English' : {'testType' : 'homework'}, 'Math' : {'testType' : 'homework'}, 'Reading' : {'testType' : 'inCenter'}, 'Science' : {'testType' : 'inCenter'}}}
/*testAnswers = {'MC3' : {
  "English": {
      "1": {
          "Answers": [
              "1",
              "2",
              "3",
              "10",
              "11",
              "15"
          ]
      },
      "2": {
          "Answers": [
              "16",
              "17",
              "21",
              "26",
              "27",
              "30"
          ]
      },
      "3": {
          "Answers": [
              "31",
              "32",
              "33",
              "34",
              "35",
              "36",
              "37",
              "38",
              "39",
              "40",
              "41",
              "42",
              "43",
              "44",
              "45"
          ]
      },
      "4": {
          "Answers": []
      },
      "5": {
          "Answers": [
              "61",
              "62",
              "63",
              "64",
              "65",
              "66",
              "67",
              "68",
              "69",
              "70",
              "71",
              "72",
              "73",
              "74",
              "75"
          ]
      },
      "TestType": "homework",
      "Status": "Incomplete"
  },
  "Math": {
      "1": {
          "Answers": []
      },
      "2": {
          "Answers": []
      },
      "3": {
          "Answers": [
              "21",
              "24",
              "27",
              "30"
          ]
      },
      "4": {
          "Answers": [
              "31",
              "32",
              "33",
              "34",
              "35",
              "36",
              "37",
              "38",
              "39",
              "40"
          ]
      },
      "5": {
          "Answers": [
              "41",
              "44",
              "47",
              "49",
              "50"
          ]
      },
      "6": {
          "Answers": []
      },
      "TestType": "homework",
      "ScaledScore": 31,
      "Status": "Completed"
  },
  "Reading": {
      //"1": {
          //"Answers": {
              //"1": true,
              //"2": true,
              //"3": false,
              //"4": true,
              //"5": true,
              //"6": false,
              //"7": true,
              //"8": true,
              //"9": true,
              //"10": true
          //},
          //"TotalCorrect": 8
      //},
      "2": {
          "Answers": [
              "11",
              "12",
              "13",
              "18",
              "20"
          ]
      },
      "3": {
          "Answers": []
      },
      "4": {
          "Answers": [
              "31",
              "32",
              "33",
              "34",
              "35",
              "36",
              "37",
              "38",
              "39",
              "40"
          ]
      },
      "TestType": "inCenter",
      "ScaledScore": 28,
      "Status": "Completed"
  },
  "Science": {
      "1": {
          "Answers": [
              "1",
              "2",
              "6"
          ]
      },
      "2": {
          "Answers": [
              "7",
              "8",
              "9",
              "10",
              "11",
              "12"
          ]
      },
      "3": {
          "Answers": [
              "13",
              "14",
              "18",
              "19"
          ]
      },
      "4": {
          "Answers": []
      },
      "5": {
          "Answers": [
              "27",
              "28",
              "29",
              "30",
              "31",
              "32",
              "33"
          ]
      },
      "6": {
          "Answers": [
              "34",
              "35",
              "39",
              "40"
          ]
      },
      "TestType": "inCenter",
      "ScaledScore": 29,
      "Status": "Completed"
  }
}}*/

function initialSetup() {
  //FIXME: This needs to set to the date of the session according to schedule and not just the time that the page was loaded
  sessionTime = new Date();
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

        //updateTestTypes();
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

  console.log("temp", tempAnswers);
  console.log("test", testAnswers);

  // Change the test view type
  if (view_type != undefined) {
    test_view_type = view_type;
  }

  // An array of all the forms that could be displayed
  let forms = ["inCenterTestsForm", "homeworkTestsForm", "otherTestsForm", "dailyLog", "englishLessonsForm", "mathLessonsForm", "readingLessonsForm", "scienceLessonsForm", "testAnswersPopup", "homeworkPopup"];

  // If selecting a lessons form, adjust the id accordingly
  if (id == '1' || id == '2' || id == '3' || id == '4') {
    let section = document.getElementById("section" + id);
    if (section.value != "") {
      id = section.value.toLowerCase() + "LessonsForm";
    }
    else {
      id = "dailyLog";
    }
  }

  // if opening a test form, reset it
  if (id != undefined && id.includes('Tests')) {
    // clear the test formatting
    clearInCenterFormating();

    // update test visuals
    updateTestGraphics(test_view_type);

    // Change what was last viewed
    lastView = id;

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
    updatePopupGraphics(id, test, section, passageNumber);
  }

  // Hide all forms except for the one selected
  for (let i = 0; i < forms.length; i++) {
    let form = document.getElementById(forms[i]);
    if (forms[i] != id) {
      if (id != 'homeworkPopup' || !form.id.includes('Tests')) {
        form.style.display = "none";
      }
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
    if (testAnswers[test]?.[section]?.[child + 1] != undefined) {
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
    testBox.classList.add("homeworkBox");
    testBox.innerHTML = testAnswers[test]?.[section]?.["ScaledScore"] ?? "";
  }
}

function setHomeworkStatus(status, gradeHomework = "False", element = undefined) {
  // Get the test and section from the header
  let headerText = document.getElementById("homeworkPopupHeader").innerHTML;
  let test = headerText.split(" - ")[0];
  let section = headerText.split(" - ")[1];

  // Reset the test and section if working with an assigned test
  if (element != undefined) {
    test = element.getAttribute("data-test")
    section = element.getAttribute("data-section")
  }

  // Set the status and testType in the testAnswers
  let current_status = testAnswers[test]?.[section]?.['Status']

  if ((current_status == undefined || current_status == 'forgot' || current_status == 'assigned' || current_status == 'did not do') && (status == 'forgot' || status == 'assigned' || status == 'did not do')) {
    if (current_status == 'assigned' && status == 'assigned') {
      delete testAnswers[test][section];
      if (Object.keys(testAnswers[test]).length == 0) {
        delete testAnswers[test]
      }
    }
    else {
      setObjectValue([test, section, "Status"], status, testAnswers)
      setObjectValue([test, section, "TestType"], 'homework', testAnswers)
    }
  }
  else {
    newStatus = status;
  }

  // Exit the popup
  if (gradeHomework == 'True') {
    openForm('testAnswersPopup');
  }
  else {
    openForm(lastView);
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

  // This is all that needs done
  if (id == 'homeworkPopup') {
    return;
  }

  // Check to see if either left arrow or right arrows need to be hidden
  let last_passage_number = testData[test][section.toLowerCase() + "Answers"][testData[test][section.toLowerCase() + "Answers"].length - 1]["passageNumber"]
  let leftArrow = document.getElementById("leftArrow")
  let rightArrow = document.getElementById("rightArrow")

  if (passageNumber != 1 && passageNumber != undefined) {
    leftArrow.parentNode.style.visibility = "visible"
  }

  if (passageNumber != last_passage_number) {
    rightArrow.parentNode.style.visibility = "visible"
  }

  // Set the answers// Get a list of all the answers for the given section
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
      ele = createElements(["div", "div", "div"], [["popupValue"], ["popupDash"], ["popupValue"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "firstAnswer", "button2"]);
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer])
      ele.setAttribute("data-answer", passageAnswers[answer])
      if (tempAnswers[test][section][passageNumber]["Answers"].includes((passageNumbers[answer]).toString())) {
        ele.classList.add('red')
      }
    }
    else {
      ele = createElements(["div", "div", "div"], [["popupValue"], ["popupDash"], ["popupValue"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "button2"]);
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer]);
      ele.setAttribute("data-answer", passageAnswers[answer]);
      if (tempAnswers[test][section][passageNumber]["Answers"].includes((passageNumbers[answer]).toString())) {
        ele.classList.add('red')
      }
    }
  }

  // Set the time
  let timeMinutes = document.getElementById("time-minutes")
  let timeSeconds = document.getElementById("time-seconds")
  timeMinutes.value = Math.floor(tempAnswers[test][section][passageNumber]["Time"] / 60)
  timeSeconds.value = tempAnswers[test][section][passageNumber]["Time"] % 60 
}

function submitAnswersPopup() {
  // Grab the test info
  let info = getTestInfo();
  let status = testAnswers[info[0]]?.[info[1]]?.['Status']
  let oldStatus = oldTestAnswers[info[0]]?.[info[1]]?.['Status']
  let last_passage_number = testData[info[0]][info[1].toLowerCase() + "Answers"][testData[info[0]][info[1].toLowerCase() + "Answers"].length - 1]["passageNumber"]

  if (test_view_type == 'inCenter') {
    setObjectValue([info[0], info[1], info[2]], tempAnswers[info[0]][info[1]][info[2]], testAnswers);
    setObjectValue([info[0], info[1], 'TestType'], 'inCenter', testAnswers);
  }
  else if (test_view_type == 'homework' && info[2] == last_passage_number && (oldStatus != 'in-time' && oldStatus != 'in-center' && oldStatus != 'over-time' && oldStatus != 'not-timed' && oldStatus != 'partial')) {

    // Calculate how many questions they got correct
    let keys_to_skip = ['Status', 'TestType', 'ScaledScore', 'Score', 'Date', 'Time']
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
    let date = sessionTime;
    if (info[2] == last_passage_number) {
      setObjectValue([info[0], info[1]], tempAnswers[info[0]][info[1]], testAnswers);
      setObjectValue([info[0], info[1], 'TestType'], 'homework', testAnswers);
      setObjectValue([info[0], info[1], 'Date'], date.getTime(), testAnswers);
      setObjectValue([info[0], info[1], 'Score'], score, testAnswers);
      setObjectValue([info[0], info[1], 'ScaledScore'], scaledScore, testAnswers);
      setObjectValue([info[0], info[1], 'Status'], (newStatus), testAnswers);
    }
  }

  // Go back to one of the test forms
  if (!(info[2] != last_passage_number && test_view_type == 'homework')) {
    openForm(lastView);
  }
}

function resetAnswers() {
  // Remove the answers
  removeAnswers();
  
  // Grab the test info
  let info = getTestInfo();

  // Reset the tempAnswers array for the given passage
  tempAnswers[info[0]][info[1]][info[2]]['Answers'] = [];
  tempAnswers[info[0]][info[1]][info[2]]['Time'] = 0;

  // Set up the testAnswersPopup again
  openForm('testAnswersPopup');
}

function getTestInfo() {
  let headerText = document.getElementById("answersPopupHeader").innerHTML;
  let test = headerText.split(" - ")[0];
  let section = headerText.split(" - ")[1];
  let passageNumber = headerText.split(" - ")[2];

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

  timeMinutes.value = "0"
  timeSeconds.value = "0"
}

function removeTest() {
  // Get the test and section from the header
  let headerText = document.getElementById("homeworkPopupHeader").innerHTML;
  let test = headerText.split(" - ")[0];
  let section = headerText.split(" - ")[1];
  let oldStatus = oldTestAnswers[test]?.[section]?.['Status']

  // Make sure that the section exists
  if (testAnswers[test]?.[section] != undefined && oldStatus != 'in-time' && oldStatus != 'in-center') {
    // Delete the section
    delete testAnswers[test][section]

    // Check to see if the test needs deleted
    if (objectChildCount([test], testAnswers) == 0) {
      delete testAnswers[test]
    }
  }

  // Return to the last view
  openForm(lastView)

}

function removePassage() {
  // Get the test and section from the header
  let headerText = document.getElementById("homeworkPopupHeader").innerHTML;
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
  // Initialize an array to store the keys to skip in the counting process below
  let keys_to_skip = ['Status', 'TestType', 'Score', 'ScaledScore', 'Date', 'Time']

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

//TESTING
function goToTesting() {
  window.location.href = '../../student-info-test.html?student=' + queryStrings()["student"];
}

function validateSessionInfo() {
  let dailyLogSessions = document.getElementById("dailyLog").querySelectorAll("div[id^='session']");
  let numSessions = dailyLogSessions.length;

  for (let i = 0; i < numSessions; i++) {
    let section = dailyLogSessions[i].querySelector(`#section${i+1}`);
    let time = dailyLogSessions[i].querySelector(`#time${i+1}`);
    if (section.value == "" || time.value == "") {
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
  for (let i = 0; i < numSessions; i++) {
    let section = dailyLogSessions[i].querySelector(`#section${i+1}`);
    let time = dailyLogSessions[i].querySelector(`#time${i+1}`);
    let sectionNotes = dailyLogSessions[i].querySelector(`#sectionNotes${i+1}`);

    sectionInfo[section.value] = {
      time: parseInt(time.value),
      sectionNotes: sectionNotes.value
    }
  }

  //FIXME: for now the time will be set to when it was submitted but once the event is on the calendar this time will be that time
  //This is handled above by the sessionTime global variable in initialSetup()
  let sessionTimeNum = sessionTime.getTime();
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

function assignHomework(element) {
  let test = element.getAttribute("data-test")
  let section = element.getAttribute("data-section")

  let status = testAnswers[test]?.[section]?.['Status']
  console.log("status:", status)

  switch (status) {
    case "in-time":
      break;
    case "over-time":
      break;
    case "not-timed":
      break;
    case "partial":
      break;
    case "in-center":
      break;
    case "forgot":
      setObjectValue([test, section, 'Status'], 'assigned', testAnswers)
      setObjectValue([test, section, 'TestType'], 'homework', testAnswers)
      break;
    case "did not do":
      setObjectValue([test, section, 'Status'], 'assigned', testAnswers)
      setObjectValue([test, section, 'TestType'], 'homework', testAnswers)
      break;
    case "assigned":
      delete testAnswers[test][section];
      if (Object.keys(testAnswers[test]).length == 0) {
        delete testAnswers[test]
      }
      break;
    default:
      setObjectValue([test, section, 'Status'], 'assigned', testAnswers)
      setObjectValue([test, section, 'TestType'], 'homework', testAnswers)
      break;
  }
  
  console.log(lastView)
  openForm(lastView)
}