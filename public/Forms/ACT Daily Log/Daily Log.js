// The actual tests with their answers and scaled scores
let testData = {};

// Student test information
let oldTestAnswers = {};
let testAnswers = {};
let tempAnswers = {};

// Current tests in use
const hwTests  = ['C02', 'A11', '71E', 'A10', 'MC2', 'B05', 'D03', '74C']
const icTests  = ['C03', 'B02', 'A09', 'B04', 'MC3', '74F', 'Z15', '72C']
const othTests = ['67C', 'ST1', '64E', '61C', '59F', '69A', 'ST2', '66F',
                  '61F', '55C', '58E', '71C', '71G', '68G', '68A', '72F',
                  '71H', 'C01', '67A', '63C', '61D', '73E', '73C', '71A',
                  '66C', '65E', '63F', '63D', '72G', '69F', '70G', '65C', '74H']
        
// Other needed info
const coloring = {'Completed' : 'green', 'in-time' : 'green', 'not in time' : 'greenShade', 'poor conditions' : 'greenShade', 'previously completed' : 'greenShade', 'forgot' : 'orange', 'assigned' : 'yellow', 'reassigned' : 'yellow', 'in-center' : 'red', 'partial' : 'greenShade', 'did not do' : 'gray', 'white' : 'white', 'guess' : 'pink'};
const keys_to_skip = ['Status', 'TestType', 'ScaledScore', 'Score', 'Date', 'Time', 'GuessEndPoints']
const date = new Date()
let test_view_type = undefined;
let mark_type = 'answer';
let newStatus = undefined;
let storage = firebase.storage();

current_test = undefined;
current_section = undefined;
current_passage_number = undefined;

const CURRENT_STUDENT_UID = queryStrings()['student'];
const CURRENT_STUDENT_TYPE = "act";

initialSetup();

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

function initialSetup() {
  // Grab the test data from Fb
  grabTestData();
  getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general');
  getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'english');
  getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'math');
  getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'reading');
  getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'science');

  //FIXME: This needs to set to the date of the session according to schedule and not just the time that the page was loaded
  const studentUID = queryStrings()["student"];

  if (studentUID) {
    //get the student's hw scores
    let hwDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("hw");

    //need to somehow get this promise to return when complete....
    return hwDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        oldTestAnswers = doc.data();
        testAnswers = JSON.parse(JSON.stringify(oldTestAnswers));
        checkForAssignedHomeworks();
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
    });
  }
}

function grabTestData() {
  // Fb reference
  let ref = firebase.firestore().collection('Dynamic-Content').doc('act-tests').collection('Test-Data')

  // Grab all tests from the Dynamic-Content collection and piece them together
  ref.get()
  .then((snapshot) => {
    snapshot.forEach((doc) => {
      testData[doc.id] = doc.data()
    })
  })
}

function changeSection(section) {

  // Setup the forms
  let goodForms = [section + 'Section']
  const allForms = ["compositeSection", "englishSection", "mathSection", "readingSection", "scienceSection"];

  // Hide all forms except for the desired form(s)
  let form = undefined;
  for (let i = 0; i < allForms.length; i++) {
    form = document.getElementById(allForms[i]);
    if (goodForms.includes(allForms[i])) {
      form.style.display = "flex";
    }
    else {
      form.style.display = "none";
    }
  }
}

function swap(section, swapTo) {
  console.log(section, swapTo)
  let chat = document.getElementById(section + 'Chat')
  let lessons = document.getElementById(section + 'LessonsForm')

  if (swapTo == 'chat') {
    chat.classList.remove('hidden')
    lessons.classList.add('hidden')
  }
  else if (swapTo == 'lessons') {
    chat.classList.add('hidden')
    lessons.classList.remove('hidden')
  }
}

function nextPassage() {
  current_passage_number += 1;
  swapTestForm(current_test, current_section, current_passage_number)
}

function previousPassage() {
  current_passage_number -= 1;
  swapTestForm(current_test, current_section, current_passage_number)
}

function swapTestForm(test, section = undefined, passageNumber = undefined) {
  let testForm = document.getElementById('testAnswersPopup')
  let chatForm = document.getElementById('generalChat')

  // Change which tab is active
  changeHeaders(test, section)

  // Reset the answers
  removeAnswers()

  // Swap which popup is being displayed+
  if (test == 'Chat') {
    // swap which popup is being viewed
    chatForm.style.display = 'flex'
    testForm.style.display = 'none'
  }
  else {

    // Change the test view type
    test_view_type = 'homework'

    // Change the current test, section, and passage number variables
    current_test = test;
    current_section = section;
    current_passage_number = passageNumber ?? 1;

    // swap which popup is being viewed
    chatForm.style.display = 'none'
    testForm.style.display = 'flex'

    // Display the test form
    updatePopupGraphics(test, section, (passageNumber ?? 1));
  }

}

function changeHeaders(test, section = undefined) {
  let chatHeaders = document.getElementById('generalHeader').querySelectorAll('h2')
  let testHeaders = document.getElementById('answersPopupHeader').querySelectorAll('h2')
  let text = 'Chat'

  // Set the Search Text
  if (test != 'Chat') {
    text = test + " - " + section[0].toUpperCase()
  }

  // Change both the chat and test headers
  for (let i = 0; i < chatHeaders.length; i++) {
    if (chatHeaders[i].innerHTML != text) {
      chatHeaders[i].parentNode.classList.remove('activeTab')
    }
    else {
      chatHeaders[i].parentNode.classList.add('activeTab')
    }
  }

  for (let i = 0; i < testHeaders.length; i++) {
    if (testHeaders[i].innerHTML != text) {
      testHeaders[i].parentNode.classList.remove('activeTab')
    }
    else {
      testHeaders[i].parentNode.classList.add('activeTab')
    }
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

function checkForAssignedHomeworks() {
  let location = document.getElementById('generalHeader')
  let location2 = document.getElementById('answersPopupHeader')
  let tests = Object.keys(testAnswers)
  const sections = ['English', 'Math', 'Reading', 'Science']
  for (let test = 0; test < tests.length; test++) {
    for (let sec = 0; sec < sections.length; sec++) {
      if (testAnswers[tests[test]][sections[sec]]?.['Status'] == 'assigned' || testAnswers[tests[test]][sections[sec]]?.['Status'] == 'reassigned') {
        let tab = createElements(['h2'], [[]], [['onclick']], [["swapTestForm('" + tests[test] + "', '" + sections[sec] + "')"]], [tests[test] + ' - ' + sections[sec][0].toUpperCase()], ['headingBlock', 'noselect', 'cursor', sections[sec].toLowerCase() + 'Color'])
        let tab2 = createElements(['h2'], [[]], [['onclick']], [["swapTestForm('" + tests[test] + "', '" + sections[sec] + "')"]], [tests[test] + ' - ' + sections[sec][0].toUpperCase()], ['headingBlock', 'noselect', 'cursor', sections[sec].toLowerCase() + 'Color'])
        tab.setAttribute('onclick', "swapTestForm('" + tests[test] + "', '" + sections[sec] + "')")
        tab2.setAttribute('onclick', "swapTestForm('" + tests[test] + "', '" + sections[sec] + "')")
        location.append(tab)
        location2.append(tab2)
      }
    }
  }
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
}

function updatePopupGraphics(test, section, passageNumber = 1) {

  // Check to see if either left arrow or right arrows need to be hidden
  let lastPassageNumber = testData[test][section.toLowerCase() + "Answers"][testData[test][section.toLowerCase() + "Answers"].length - 1]["passageNumber"]
  let leftArrow = document.getElementById("leftArrow")
  let rightArrow = document.getElementById("rightArrow")

  if (passageNumber != 1 && passageNumber != undefined && test_view_type == 'homework') {
    leftArrow.parentNode.style.visibility = "visible"
  }

  if (passageNumber != lastPassageNumber && test_view_type == 'homework') {
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
        ele = createElements(["div", "div", "div"], [["popupValue"], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "firstAnswer", "cursor"]);
      } 
      else {
        ele = createElements(["div", "div", "div"], [["popupValue", coloring['guess']], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "firstAnswer", "cursor"]);
      }
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer])
      ele.setAttribute("data-answer", passageAnswers[answer])
      ele.classList.add('redOnHover')
      if (tempAnswers[test][section][passageNumber]["Answers"].includes((passageNumbers[answer]).toString())) {
        ele.classList.add('Qred')
      }
    }
    else {
      if (shouldMarkAsGuessed(test, section, passageNumbers[answer]) == false) {
        ele = createElements(["div", "div", "div"], [["popupValue"], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "cursor"]);
      }
      else {
        ele = createElements(["div", "div", "div"], [["popupValue", coloring['guess']], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "cursor"]);
      }
      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer]);
      ele.setAttribute("data-answer", passageAnswers[answer]);
      ele.classList.add('redOnHover')
      if (tempAnswers[test][section][passageNumber]["Answers"].includes((passageNumbers[answer]).toString())) {
        ele.classList.add('Qred')
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

function resetAnswers() {
  // Remove the answers
  removeAnswers();
  
  // Reset the tempAnswers array for the given passage
  let status = tempAnswers[current_test]?.[current_section]?.['Status'];
  if (status == undefined || status == 'assigned' || status == 'reassigned') {
    tempAnswers[current_test][current_section][current_passage_number]['Answers'] = [];
    tempAnswers[current_test][current_section][current_passage_number]['Time'] = 0;
  }

  // Set up the testAnswersPopup again
  swapTestForm(current_test, current_section, current_passage_number)
}

function removeTest() {
  // Get the test and section from the header
  let oldStatus = oldTestAnswers[current_test]?.[current_section]?.['Status']

  // Make sure that the section exists
  if (testAnswers[current_test]?.[current_section] != undefined && (oldStatus == undefined || oldStatus == 'assigned')) {
    // Delete the section
    delete testAnswers[current_test][current_section]

    // Check to see if the test needs deleted
    if (objectChildCount([current_test], testAnswers) == 0) {
      delete testAnswers[current_test]
    }

    // If it was assigned before this session, mark it as assigned again
    if (oldStatus == 'assigned') {
      setObjectValue([current_test, current_section], oldTestAnswers[current_test][current_section], testAnswers);
    }
  }

  // Return to the last view
  swapTestForm(current_test, current_section, current_passage_number)
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

function resetMessages() {
  // Reset the messages
  let guessMessage = document.getElementById("guessFirst");
  let gradeMessage = document.getElementById("gradeFirst");
  let assignMessage = document.getElementById("assignFirst")
  let alreadyGradedTest = document.getElementById("alreadyGradedTest")
  guessMessage.style.display = "none";
  gradeMessage.style.display = "none";
  assignMessage.style.display = "none";
  alreadyGradedTest.style.display = "none";
}

function submitAnswersPopup(passageGradeType = 'False', swap = 'False') {
  // Grab the test info
  const status = testAnswers[current_test]?.[current_section]?.['Status']
  const guesses = tempAnswers[current_test]?.[current_section]?.['GuessEndPoints']
  let oldStatus = oldTestAnswers[current_test]?.[current_section]?.['Status']
  let lastPassageNumber = testData[current_test][current_section.toLowerCase() + "Answers"][testData[current_test][current_section.toLowerCase() + "Answers"].length - 1]["passageNumber"]

  // Check to see if the test can be submitted (all passages have been looked at)
  let canSubmitTest = false;
  if (test_view_type == 'homework') {
    let pCount = 0;
    for (const [key, value] of Object.entries(tempAnswers[current_test][current_section])) {
      if (!keys_to_skip.includes(key)) {
        pCount++;
      }
    }
    if (pCount == lastPassageNumber) {
      canSubmitTest = true;
    }
  }

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
    if (oldTestAnswers[current_test]?.[current_section]?.[current_passage_number] == undefined) {
      if (passageGradeType != 'grade') {
        setObjectValue([current_test, current_section, current_passage_number], tempAnswers[current_test][current_section][current_passage_number], testAnswers);
        setObjectValue([current_test, current_section, current_passage_number, 'Status'], passageGradeType, testAnswers);
        setObjectValue([current_test, current_section, 'TestType'], 'inCenter', testAnswers);
      }
      else {
        setObjectValue([current_test, current_section, current_passage_number], tempAnswers[current_test][current_section][current_passage_number], testAnswers);
        setObjectValue([current_test, current_section, current_passage_number, 'Status'], 'Completed', testAnswers);
        setObjectValue([current_test, current_section, 'TestType'], 'inCenter', testAnswers);
      }
      checkPassageGuesses(current_passage_number, 'True');
    }
    else {
      // reset the temp answers
      setObjectValue([current_test, current_section, current_passage_number], testAnswers[current_test][current_section][current_passage_number], tempAnswers);
    }
  }
  //else if (test_view_type == 'homework' && current_passage_number == lastPassageNumber && (oldStatus != 'in-time' && oldStatus != 'in-center' && oldStatus != 'over-time' && oldStatus != 'not-timed' && oldStatus != 'partial')) {
  else if (test_view_type == 'homework' && canSubmitTest == true && (oldStatus != 'in-time' && oldStatus != 'in-center' && oldStatus != 'over-time' && oldStatus != 'not-timed' && oldStatus != 'partial')) {

    if (newStatus != 'partial' || (newStatus == 'partial' && guesses != undefined)) {
      // Calculate how many questions they got correct
      let totalMissed = 0;
      for (const [key, value] of Object.entries(tempAnswers[current_test][current_section])) {
        if (!keys_to_skip.includes(key)) {
          totalMissed += tempAnswers[current_test][current_section][key]['Answers'].length
        }
      }
      let score = testData[current_test][current_section.toLowerCase() + "Answers"].length - totalMissed;
    
      // Calculate the scaled score
      let scaleScore = 0;
      for (const [key, value] of Object.entries(testData[current_test][current_section.toLowerCase() + "Scores"])) {
        if (score >= parseInt(value, 10)) {
          scaledScore = 36 - parseInt(key);
          break;
        }
      }

      // Set the information
      if (canSubmitTest == true) {
        //(ADD FUNCTION HERE)
        setObjectValue([current_test, current_section], tempAnswers[current_test][current_section], testAnswers);
        setObjectValue([current_test, current_section, 'TestType'], 'homework', testAnswers);
        setObjectValue([current_test, current_section, 'Date'], date.getTime(), testAnswers);
        setObjectValue([current_test, current_section, 'Score'], score, testAnswers);
        setObjectValue([current_test, current_section, 'Status'], (newStatus), testAnswers);
        if (newStatus == 'in-time' || newStatus == 'in-center') {
          setObjectValue([current_test, current_section, 'ScaledScore'], scaledScore, testAnswers);
        }
        else {
          delete testAnswers[current_test][current_section]['ScaledScore']
        }
      }
    }
    else {
      guessMessage.style.display = "inline";
    }
  }
  else {
    console.log(canSubmitTest)
    gradeMessage.style.display = "inline";
  }

  // Go back to one of the test forms
  if (!(canSubmitTest == false && test_view_type == 'homework') && (newStatus != 'partial' || (newStatus == 'partial' && guesses != undefined)) && swap == 'False') {
    popup.classList.remove("show");
    openForm(lastView);
  }
}