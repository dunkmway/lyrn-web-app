// The actual tests with their answers and scaled scores
// https://codepen.io/mayuMPH/pen/ZjxGEY  - range slider
let test_answers_data = {};
let test_answers_grading = {};
let ids = [];

// Student test information
let student_tests = {};
let tempAnswers = {};

// Current tests in use
const hwTests  = ['C02', 'A11', '71E', 'A10', 'MC2', 'B05', 'D03', '74C']
const icTests  = ['C03', 'B02', 'A09', 'B04', 'MC3', '74F', 'Z15', '72C']
const othTests = ['67C', 'ST1', '64E', '61C', '59F', '69A', 'ST2', '66F',
                  '61F', '55C', '58E', '71C', '71G', '68G', '68A', '72F',
                  '71H', 'C01', '67A', '63C', '61D', '73E', '73C', '71A',
                  '66C', '65E', '63F', '63D', '72G', '69F', '70G', '65C', '74H']
        
// Other needed info
const coloring = {'Completed' : 'green', 'in-time' : 'green', 'not in time' : 'greenShade', 'poor conditions' : 'greenShade', 'previously completed' : 'greenShade', 'assigned' : 'yellow', 'in-center' : 'red', 'partial' : 'greenShade', 'white' : 'white'};
const keys_to_skip = ['Status', 'TestType', 'ScaledScore', 'Score', 'Date', 'Time']
const date = new Date()
let test_view_type = undefined;
let new_status = undefined;
let storage = firebase.storage();
let tests_to_grade = {};
let session_message_count = 0;
let homework_count = 0;
let numAssignedTests = 0;
let notAssigningFlag = false;
let practice_test_element = undefined;
let start_time = 0;
let session_timer = undefined;
let wheel_timer = undefined;
let timers = {
  'grading' : 0,
  'composite' : 0,
  'english' : 0,
  'math' : 0,
  'reading' : 0,
  'science' : 0
}

current_homework_test = undefined;
current_homework_section = undefined;
current_homework_passage_number = undefined;
current_practice_test = undefined;
current_practice_section = undefined;
current_practice_passage_number = undefined;

const CURRENT_STUDENT_UID = queryStrings()['student'];
const CURRENT_STUDENT_TYPE = "act";

function getStudentTests(studentUID) {
  const ref = firebase.firestore().collection('ACT-Student-Tests').where('student', '==', studentUID)
  return ref.get()
  .then((querySnapshot) => {
    let finalObj = {}
    let assignedTests = []
    let practiceTests = []
    querySnapshot.forEach((doc) => {
      let data = doc.data();
      let obj = {}
      obj['date'] = data.date;
      obj['questions'] = data.questions;
      obj['score'] = data.score;
      if (data.type == 'homework') {
        obj['scaledScore'] = data.scaledScore;
      }
      obj['status'] = data.status;
      obj['type'] = data.type;

      // Grab the tests that are in an assigned state that were assigned more than 14 hours before the session started
      if (data.status == 'assigned') {
        assignedTests.push({ 'test' : data.test,
                             'section' : data.section,
                             'id' : doc.id })
      }
      else if (data.type == 'practice') {
        practiceTests.push({ 'test' : data.test,
                             'section' : data.section,
                             'passageNumber' : data.passageNumber,
                             'id' : doc.id})
      }

      if (data.type == 'homework') {
        setObjectValue([data.section, data.test], obj, finalObj)
      }
      else if (data.type == 'practice') {
        setObjectValue([data.section, data.test, data.passageNumber], obj, finalObj)
      }
    })

    // add the assigned tests
    setObjectValue(['assignedTests'], assignedTests, finalObj)
    setObjectValue(['practiceTests'], practiceTests, finalObj)
    return finalObj;
  })
}


initialSetup();

function initialSetup() {
  // Grab the test answers data from Fb
  grabTestAnswersData()
  .then(() => {
    // Grab the student's tests
    getStudentTests(CURRENT_STUDENT_UID)
    .then((res) => {
      // set the working tests object and the old tests object
      student_tests = res;
      setTestCarousel();
      checkForAssignedHomeworks();
      insertPracticeTests();
      //getElapsedTime();
    })
    .catch(() => console.log("I hate assigned promises"))
  })
  .catch((error) => {
    console.log(error)
  })

  // Grab the Chat Messages
  for (let i = 0; i < sections.length; i++) {
    getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, sections[i]);
  }
  getStudentMessages(CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general');

}

function grabTestAnswersData() {
  // Fb reference
  let ref = firebase.firestore().collection('Dynamic-Content').doc('act-tests').collection('Test-Data')

  // Grab all tests from the Dynamic-Content collection and piece them together
  return ref.get()
  .then((snapshot) => {
    snapshot.forEach((doc) => {
      test_answers_data[doc.id] = doc.data()
    })
  })
}

function changeSection(section) {

  // Hide the popups
  hidePopups();

  // Set the test_view_type
  if (section == 'composite') {
    test_view_type == 'homework'
  }
  else {
    test_view_type == 'practice'
  }

  // Setup the forms
  let goodForms = [section + 'Section']
  const allForms = ["compositeSection", "englishSection", "mathSection", "readingSection", "scienceSection"];

  // Update the section Title
  document.getElementById('sectionTitle').textContent = section.charAt(0).toUpperCase() + section.slice(1);

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

  getElapsedTime();
}

/*
Swap between the lessons and chat
*/
function swap(section, swapTo) {
  let chat = document.getElementById(section + 'Chat')
  let lessons = document.getElementById(section + 'LessonsForm')
  let practice = document.getElementById(section + 'Practice')

  // Re-enable the back swipe to go back a page
  document.querySelector('body').style.overscrollBehaviorX = null;


  if (swapTo == 'chat') {
    chat.classList.remove('hidden')
    lessons.classList.add('hidden')
    practice.classList.add('hidden')
  }
  else if (swapTo == 'lessons') {
    chat.classList.add('hidden')
    lessons.classList.remove('hidden')
    practice.classList.add('hidden')
  }
  else if (swapTo == 'practice') {
  // Disable the back swipe to go back a page
    document.querySelector('body').style.overscrollBehaviorX = 'contain';

    chat.classList.add('hidden')
    lessons.classList.add('hidden')
    practice.classList.remove('hidden')
  }
}

function nextPassage() {
  current_homework_passage_number += 1;
  swapTestForm(current_homework_test, current_homework_section, current_homework_passage_number)
}

function previousPassage() {
  current_homework_passage_number -= 1;
  swapTestForm(current_homework_test, current_homework_section, current_homework_passage_number)
}

function swapTestForm(test, section = undefined, passageNumber = undefined) {
  let testForm = document.getElementById('testAnswersPopup')
  let chatForm = document.getElementById('generalChat')

  // Change which tab is active
  changeHeaders(test, section)

  // Reset the HTML answers
  removeAnswersFromHTMLForm()

  // Hide the popups
  hidePopups();

  // Swap which popup is being displayed+
  if (test == 'Chat') {
    // swap which popup is being viewed
    chatForm.style.display = 'flex'
    testForm.style.display = 'none'
  }
  else {

    // Change the current test, section, and passage number variables
    current_homework_test = test;
    current_homework_section = section;
    current_homework_passage_number = passageNumber ?? 1;

    // swap which popup is being viewed
    chatForm.style.display = 'none'
    testForm.style.display = 'flex'

    // Display the test form
    updateHomeworkGraphics(test, section, (passageNumber ?? 1));
  }

}

function hidePopups() {
  let popups = document.getElementsByClassName('popup')
  for (let i = 0; i < popups.length; i++) {
    popups[i].classList.remove("show");
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

function insertPracticeTests() {
  const testList = student_tests['practiceTests'];

  for (let i = 0; i < testList.length; i++) {
    const test = testList[i]['test']
    const section = testList[i]['section']
    const passageNumber = testList[i]['passageNumber']
    setObjectValue([test, section, passageNumber, 'questions'], student_tests[section][test][passageNumber]['questions'], test_answers_grading)
  }
}

function checkForAssignedHomeworks() {
  let location = document.getElementById('generalHeader')
  let location2 = document.getElementById('answersPopupHeader')
  let statusBars = document.getElementsByClassName('meter')
  const testList = student_tests['assignedTests'];

  // For each test that needs to be graded
  for (let i = 0; i < testList.length; i++) {
    const test = testList[i]['test']
    const section = testList[i]['section']
    const id = testList[i]['id']

    // Make sure that the test was assigned before the current day
    if (student_tests[section][test]['date'] < convertFromDateInt(date.getTime())['startOfDayInt']) {
      // Create the array for the test that needs graded this session
      setObjectValue([test, section, 'questions'], student_tests[section][test]['questions'], test_answers_grading)

      // Create the tab for grading
      let tab = createElements(['h2'], [[]], [[]], [[]], [test + ' - ' + section[0].toUpperCase()], ['headingBlock', 'noselect', 'cursor', section + 'Color'])
      let tab2 = createElements(['h2'], [[]], [[]], [[]], [test + ' - ' + section[0].toUpperCase()], ['headingBlock', 'noselect', 'cursor', section + 'Color'])
      tab.setAttribute('onclick', "swapTestForm('" + test + "', '" + section + "')")
      tab2.setAttribute('onclick', "swapTestForm('" + test + "', '" + section + "')")
      location.append(tab)
      location2.append(tab2)

      // Add blank status bars below each test
      for (let i = 0; i < statusBars.length; i++) {
        let ele = createElement('div', ['statusBar'], [], [], '')
        statusBars[i].append(ele);
      }

      // Lower the homework count for each test that needs graded
      homework_count -= 1;
    }
    else {

      ids.push({
        'type' : 'homework',
        'section' : section,
        'action' : 'assign',
        'id' : id
      })

      document.getElementById('assign' + section.charAt(0).toUpperCase() + section.slice(1)).classList.add('hidden')
      document.getElementById('unassign' + section.charAt(0).toUpperCase() + section.slice(1)).classList.remove('hidden')
    }
  }

}

function removeAnswersFromHTMLForm(type = 'homework', section = undefined) {
  // Remove the answers (if they are there)
  let answerArea = document.getElementById("passage")
  if (type == 'practice') {
    answerArea = document.getElementById(section + "Passage")
  }

  // Remove the answers
  if (answerArea.childElementCount > 0) {
    answerAreaChildren = answerArea.getElementsByClassName("input-row-center")
    num_children = answerAreaChildren.length;
    for (let i = 0; i < num_children; i++) {
      answerAreaChildren[num_children - i - 1].remove();
    }
  }

  // Hide the arrows
  if (type == 'homework') {
    let leftArrow = document.getElementById("leftArrow")
    let rightArrow = document.getElementById("rightArrow")
    leftArrow.parentNode.style.visibility = "hidden"
    rightArrow.parentNode.style.visibility = "hidden"
  }
}

function openPracticeTest(test, section, passageNumber, element = undefined) {
  // Remove the highlighting from the previous element
  if (element != undefined) {
    if (practice_test_element != undefined) {
      practice_test_element.classList.remove('selectedElement')
    }

    // update the selected element
    practice_test_element = element;

    // Add the highlighting
    element.classList.add('selectedElement')
  }


  // Update the current test / section / passage number
  current_practice_test = test;
  current_practice_section = section;
  current_practice_passage_number = passageNumber;

  // Add the test / section / passage if not already there
  if (test in test_answers_grading) {
    if (section in test_answers_grading[test]) {
      if (!(passageNumber in test_answers_grading[test][section])) {
        setObjectValue([test, section, passageNumber, 'questions'], initializeEmptyPassageAnswers(test, section, passageNumber), test_answers_grading)
      }
    }
    else {
      setObjectValue([test, section, passageNumber, 'questions'], initializeEmptyPassageAnswers(test, section, passageNumber), test_answers_grading)
    }
  }
  else {
    setObjectValue([test, section, passageNumber, 'questions'], initializeEmptyPassageAnswers(test, section, passageNumber), test_answers_grading)
  }

  // Update the answers
  removeAnswersFromHTMLForm('practice', section)
  updatePracticeGraphics(test, section, passageNumber)
}

function updatePracticeGraphics(test, section, passageNumber) {

  // Get a list of all the answers for the given section
  let allAnswers = test_answers_data[test][section + "Answers"];
  let passageAnswers = []
  let passageNumbers = []

  // Get the answers for the passage passed in
  for (let answer = 0; answer < allAnswers.length; answer++) {
    if (allAnswers[answer]["passageNumber"] == (passageNumber ?? '1')) {
      passageAnswers.push(allAnswers[answer][answer + 1])
      passageNumbers.push(answer + 1)
    }
  }

  // Graph the DOM element
  let passage = document.getElementById(section + "Passage")

  // Display the answers, (color them too if needed)
  for (let answer = 0; answer < passageAnswers.length; answer++) {
    ele = createElements(["div", "div", "div"], [["popupValue"], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "cursor"]);
    passage.appendChild(ele);
    ele.setAttribute("data-question", passageNumbers[answer]);
    ele.setAttribute("data-answer", passageAnswers[answer]);
    ele.classList.add('redOnHover')
    if (test_answers_grading[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['isWrong'] == true) {
      ele.querySelectorAll('div')[0].classList.add('Qred')
    }
  }
}

function updateHomeworkGraphics(test, section, passageNumber = 1) {

  // Check to see if either left arrow or right arrows need to be hidden
  let lastPassageNumber = test_answers_data[test][section + "Answers"][test_answers_data[test][section + "Answers"].length - 1]["passageNumber"]
  let leftArrow = document.getElementById("leftArrow")
  let rightArrow = document.getElementById("rightArrow")

  if (passageNumber != 1 && passageNumber != undefined) {
    leftArrow.parentNode.style.visibility = "visible"
  }

  if (passageNumber != lastPassageNumber) {
    rightArrow.parentNode.style.visibility = "visible"
  }

  // Get a list of all the answers for the given section
  let allAnswers = test_answers_data[test][section + "Answers"];
  let passageAnswers = []
  let passageNumbers = []

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
    ele = createElements(["div", "div", "div"], [["popupValue"], ["popupDash"], ["popupAnswer"]], [[]], [[]], [(passageNumbers[answer]).toString(), "-", passageAnswers[answer]], ["input-row-center", "cursor"]);
    passage.appendChild(ele);
    ele.setAttribute("data-question", passageNumbers[answer]);
    ele.setAttribute("data-answer", passageAnswers[answer]);
    ele.classList.add('redOnHover')
    if (test_answers_grading[test][section]['questions'][passageNumbers[answer] - 1]['isWrong'] == true) {
      ele.querySelectorAll('div')[0].classList.add('Qred')
    }
  }
}

function resetAnswers() {

  // grab the test and section
  const test = current_homework_test;
  const section = current_homework_section;
  const passageNumber = current_homework_passage_number;

  // Disable the button until everything is done
  document.getElementById('resetHomework').disabled = true;
  document.getElementById('submitHomework').disabled = true;

  // Remove the answers
  removeAnswersFromHTMLForm();
  
  // Reset the answers for the working test
  let questions = test_answers_grading[test][section]['questions']
  for (let i = 0; i < questions.length; i++) {
    test_answers_grading[test][section]['questions'][i]['isWrong'] = false
  }

  // Reset the test if need be
  const id = student_tests['assignedTests'].filter(function(val) { return val.section == section && val.test == test})[0]['id']
  let ref = firebase.firestore().collection('ACT-Student-Tests').doc(id)
  const studentQuestions = initializeEmptyAnswers(test, section);

  ref.update({
    ['questions'] : studentQuestions,
    ['status'] : student_tests[section][test]['status'],
    ['date'] : student_tests[section][test]['date'],
    ['score'] : student_tests[section][test]['score'],
    ['scaledScore'] : student_tests[section][test]['scaledScore']
  })

  // Successfully reset the test
  .then(() => {
    document.getElementById('resetHomework').disabled = false;
    document.getElementById('submitHomework').disabled = false;

    // Remove the green bar status if it's there
    updateStatusBar(test, section, true)
    
    // Lower the homework count by 1
    homework_count -= 1;

  })

  // Wasn't able to reset the test
  .catch((error) => {
    console.log(error)
    document.getElementById('resetHomework').disabled = false;
    document.getElementById('submitHomework').disabled = false;
  })

  // Set up the student_testsPopup again
  swapTestForm(test, section, passageNumber)
}

function toggleHomeworkPopup() {
  // hide the error message
  document.getElementById("gradeFirst").style.display = "none";

  // Toggle the submit button popups
  document.getElementById("submitHomeworkPopup").classList.toggle("show");
}

function gradeHomework(status) {


  // grab the test and section
  const test = current_homework_test;
  const section = current_homework_section;
  const passageNumber = current_homework_passage_number;

  // Set the status bar as loading
  updateStatusBar(test, section, false, 'loading')

  // Close the popup
  hidePopups()

  // Disable the buttons until it this function has done its job
  document.getElementById('resetHomework').disabled = true;
  document.getElementById('submitHomework').disabled = true;

  // Calculate how many questions they missed and got correct
  let totalMissed = test_answers_grading[test][section]['questions'].filter(function(val) { return val.isWrong == true} ).length;
  let score = test_answers_grading[test][section]['questions'].length - totalMissed;

  // Calculate the scaled score
  let scaledScore = -1;
  if (['in-time', 'in-center'].includes(status)) {
    for (const [key, value] of Object.entries(test_answers_data[test][section.toLowerCase() + "Scores"])) {
      if (score >= parseInt(value, 10)) {
        scaledScore = 36 - parseInt(key);
        break;
      }
    }
  }

  // Change the score and questions back if they're not applicable
  if (['forgot', 'previously completed'].includes(status)) {
    score = -1;
    setObjectValue([test, section, 'questions'], initializeEmptyAnswers(test, section), test_answers_grading)
    if (status == 'forgot') {
      status = 'assigned'
    }
  }

  // Set the information
  const id = student_tests['assignedTests'].filter(function(val) { return val.section == section && val.test == test})[0]['id']

  // Get the ref
  let ref = firebase.firestore().collection('ACT-Student-Tests').doc(id)

  // Remove the test if they didn't do it, so it can be reassigned
  if (status == 'did not do') {
    ref.delete()
    .then(() => {
      // Re-enable the buttons
      document.getElementById('resetHomework').disabled = false;
      document.getElementById('submitHomework').disabled = false;

      // Update the status bar to mark the test as completed
      updateStatusBar(test, section)

      // up the homework count
      homework_count += 1;
    })
    .catch((error) => {
      console.log(error)
    })
  }
  else {
    ref.update({
      ['questions'] : test_answers_grading[test][section]['questions'],
      ['score'] : score,
      ['scaledScore'] : scaledScore,
      ['status'] : status
    })
    .then(() => {
      // Re-enable the buttons
      document.getElementById('resetHomework').disabled = false;
      document.getElementById('submitHomework').disabled = false;

      // Update the status bar to mark the test as completed
      updateStatusBar(test, section)

      // up the homework count
      homework_count += 1;

      // Check to see if the session has been sufficiently finished
      submitSession()
    })
    .catch((error) => {
      // Re-enable the buttons
      document.getElementById('resetHomework').disabled = false;
      document.getElementById('submitHomework').disabled = false;

      // Update the status bar to mark the test as completed
      updateStatusBar(test, section, false, 'red')

      console.log(error)
    })
  }

}

function togglePracticePopup(section) {
  // Toggle the submit button popups
  document.getElementById(section + "SubmitPracticePopup").classList.toggle("show");
}

function toggleGradeButtons(disable = true) {
  submitButtons = document.querySelectorAll("button[id$='SubmitPractice']")
  resetButtons = document.querySelectorAll("button[id$='ResetPractice']")

  for (let i = 0; i < submitButtons.length; i++) {
    submitButtons[i].disabled = disable;
    resetButtons[i].disabled = disable;
  }
}

function resetPractice() {

  // Grab the current test / section / passage
  const test = current_practice_test;
  const section = current_practice_section;
  const passageNumber = current_practice_passage_number;

  // grab the current oval element
  let element = practice_test_element;

  // Reset the colors
  removeColors(element)
  element.classList.add('selfLoadingRing')

  // Close the popup
  hidePopups()

  // Disable the buttons until it this function has done its job
  toggleGradeButtons(true);

  // Check to see if it's a previously completed practice passage
  let id = student_tests['practiceTests'].filter(function(val) { return val.section == section && val.test == test && val.passageNumber == passageNumber})

  // Make sure that it isn't an old test
  if (id.length == 0) {

    id = ids.filter(function(val) { return val.section == section && val.test == test && val.passageNumber == passageNumber})[0]['id']
    const ref = firebase.firestore().collection('ACT-Student-Tests').doc(id)
    console.log(id)

    ref.delete()
    .then(() => {
      toggleGradeButtons(false);
      element.classList.remove('selfLoadingRing')
      setObjectValue([test, section, passageNumber, 'questions'], initializeEmptyPassageAnswers(test, section, passageNumber), test_answers_grading)
      openPracticeTest(test, section, passageNumber)
    })
    .catch((error) => {
      toggleGradeButtons(false);
      element.classList.remove('selfLoadingRing')
      element.classList.add('red')
      console.log(error)
    })
  }
  else {
    const testDate = student_tests[section]?.[test]?.[passageNumber]?.['date']
    if (testDate != undefined && testDate > convertFromDateInt(date.getTime())['startOfDayInt']) {
      const ref = firebase.firestore().collection('ACT-Student-Tests').doc(id[0]['id'])
      ref.delete()
      .then(() => {
        toggleGradeButtons(false);
        element.classList.remove('selfLoadingRing')
        setObjectValue([test, section, passageNumber, 'questions'], initializeEmptyPassageAnswers(test, section, passageNumber), test_answers_grading)
        openPracticeTest(test, section, passageNumber)
      })
      .catch((error) => {
        toggleGradeButtons(false);
        element.classList.remove('selfLoadingRing')
        element.classList.add('red')
        console.log(error)
      })
    }
    else {
      console.log("Can't Remove")
      toggleGradeButtons(false);
      element.classList.remove('selfLoadingRing')
    }
  }
}

function gradePractice(status) {

  // Grab the current test / section / passage
  const test = current_practice_test;
  const section = current_practice_section;
  const passageNumber = current_practice_passage_number;

  // grab the current oval element
  let element = practice_test_element;

  // Reset the colors and set the loading ring
  removeColors(element)
  element.classList.add('selfLoadingRing')

  // Close the popup
  hidePopups()

  // Disable the buttons until it this function has done its job
  toggleGradeButtons(true);

  // Calculate how many questions they missed and got correct
  let totalMissed = test_answers_grading[test][section][passageNumber]['questions'].filter(function(val) { return val.isWrong == true} ).length;
  let score = test_answers_grading[test][section][passageNumber]['questions'].length - totalMissed;

  // Change the score back if it's not applicable
  if (['together', 'popcorn', 'prior'].includes(status)) {
    score = -1;
  }

  // Check to see if it's a previously completed practice passage
  let id = student_tests['practiceTests'].filter(function(val) { return val.section == section && val.test == test && val.passageNumber == passageNumber})

  // Make sure that it isn't an old test
  if (id.length == 0) {
    console.log("submitting")

    // Get the ref
    let refStart = firebase.firestore().collection('ACT-Student-Tests')

    // Check to see if it has been submitted already
    id = ids.filter(function(val) { return val.section == section && val.test == test && val.passageNumber == passageNumber})

    // It hasn't been submitted yet
    if (id.length == 0) {
      console.log('New test')
      const ref = refStart.doc()
      ref.set({
        'test' : test,
        'section' : section,
        'passageNumber' : passageNumber,
        'student' : CURRENT_STUDENT_UID,
        'questions' : test_answers_grading[test][section][passageNumber]['questions'],
        'date' : date.getTime(),
        'type' : 'practice',
        'status' : status,
        'score' : score
      })
      .then(() => {
        toggleGradeButtons(false);
        element.classList.remove('selfLoadingRing')
        element.classList.add('green')
      })
      .catch((error) => {
        toggleGradeButtons(false);
        element.classList.remove('selfLoadingRing')
        element.classList.add('red')
        console.log(error)
      })

      // Save the id: might be updated / changed later on in the session
      ids.push({
        'test' : test,
        'section' : section,
        'passageNumber' : passageNumber,
        'id' : ref.id
      })
    }
    else {
      console.log('already set test')
      id = id[0]['id']
      refStart.doc(id).set({
        'test' : test,
        'section' : section,
        'passageNumber' : passageNumber,
        'student' : CURRENT_STUDENT_UID,
        'questions' : test_answers_grading[test][section][passageNumber]['questions'],
        'date' : date.getTime(),
        'type' : 'practice',
        'status' : status,
        'score' : score
      })
      .then(() => {
        toggleGradeButtons(false);
        element.classList.remove('selfLoadingRing')
        element.classList.add('green')
      })
      .catch((error) => {
        toggleGradeButtons(false);
        element.classList.remove('selfLoadingRing')
        element.classList.add('red')
        console.log(error)
      })
    }

    openPracticeTest(test, section, passageNumber)

  }
  else {
    const testDate = student_tests[section]?.[test]?.[passageNumber]?.['date']
    if (testDate != undefined && testDate > convertFromDateInt(date.getTime())['startOfDayInt']) {
      id = id[0]['id']
      const ref = firebase.firestore().collection('ACT-Student-Tests').doc(id)
      ref.set({
        'test' : test,
        'section' : section,
        'passageNumber' : passageNumber,
        'student' : CURRENT_STUDENT_UID,
        'questions' : test_answers_grading[test][section][passageNumber]['questions'],
        'date' : date.getTime(),
        'type' : 'practice',
        'status' : status,
        'score' : score
      })
      .then(() => {
        toggleGradeButtons(false);
        element.classList.remove('selfLoadingRing')
        element.classList.add('green')
      })
      .catch((error) => {
        toggleGradeButtons(false);
        element.classList.remove('selfLoadingRing')
        element.classList.add('red')
        console.log(error)
      })
    }
    else {
      console.log("Can't set")
      element.classList.remove('selfLoadingRing')
      toggleGradeButtons(false);
    }
  }

}

function assignHomework(section) {
  // Disable the buttons until homework has been assigned
  let assign = document.getElementById('assign' + section.charAt(0).toUpperCase() + section.slice(1))
  let unassign = document.getElementById('unassign' + section.charAt(0).toUpperCase() + section.slice(1))
  assign.disabled = true;
  unassign.disabled = true;

  // Initialize the object to send to Fb
  let obj = {}

  // Find the next test
  let test = undefined;
  if (section in student_tests) {
    for (let i = 0; i < hwTests.length; i++) {
      if (hwTests[i] in student_tests[section]) {
      }
      else {
        test = hwTests[i]
        break;
      }
    }
  }
  else {
    test = hwTests[0]
  }

  // They have completed all of the normal hw tests, so start going through the 'other' tests
  if (test == undefined) {
    if (section in student_tests) {
      for (let i = 0; i < othTests.length; i++) {
        if (othTests[i] in student_tests[section]) {
        }
        else {
          test = othTests[i]
          break;
        }
      }
    }
    else {
      test = othTests[0]
    }
  }

  // Initialize the questions array
  let studentQuestions = initializeEmptyAnswers(test, section);

  // Initialize the object to send to FB
  setObjectValue(['test'], test, obj);
  setObjectValue(['section'], section, obj);
  setObjectValue(['student'], CURRENT_STUDENT_UID, obj);
  setObjectValue(['questions'], studentQuestions, obj);
  setObjectValue(['date'], date.getTime(), obj);
  setObjectValue(['type'], 'homework', obj);
  setObjectValue(['status'], 'assigned', obj);
  setObjectValue(['score'], -1, obj);
  setObjectValue(['scaledScore'], -1, obj);

  // Send the object to Fb
  let ref = firebase.firestore().collection('ACT-Student-Tests').doc()
  ref.set(obj)

  // Indicate that the test has been assigned
  .then(() => {
    // Swap buttons
    assign.classList.add('hidden')
    unassign.classList.remove('hidden')

    // Re-enable the buttons again
    assign.disabled = false;
    unassign.disabled = false;

    ids.push({
      'type' : 'homework',
      'section' : section,
      'action' : 'assign',
      'id' : ref.id
    })

    numAssignedTests += 1;
    submitSession()
  })
  
  // Indicate that the test wasn't assigned successfully
  .catch((error) => {
    console.log(error)
    assign.disabled = false;
    unassign.disabled = false;
  })

  // Open the test to print
  openTest(test, section)
}

function initializeEmptyAnswers(test, section) {
  const questions = test_answers_data[test][section + "Answers"]
  let studentQuestions = [];
  for (let i = 0; i < questions.length; i++) {
    studentQuestions.push({
      'isWrong' : false,
      'passageNumber' : questions[i]['passageNumber']
    })
  }

  return studentQuestions;
}

function initializeEmptyPassageAnswers(test, section, passageNumber) {
  const questions = test_answers_data[test][section + "Answers"].filter(function(val) { return val.passageNumber == passageNumber})
  let studentQuestions = [];
  for (let i = 0; i < questions.length; i++) {
    let questionNumber = undefined
    const keys = Object.keys(questions[i])
    for (let j = 0; j < keys.length; j++) {
      if (parseInt(keys[j]) > 0 && parseInt(keys[j]) < 76) {
        questionNumber = keys[j]
        break;
      }
    }
    studentQuestions.push({
      'isWrong' : false,
      'question' : questionNumber
    })
  }

  return studentQuestions;
}

function unassignHomework(section) {
  // Disable the buttons until homework has been assigned
  let assign = document.getElementById('assign' + section.charAt(0).toUpperCase() + section.slice(1))
  let unassign = document.getElementById('unassign' + section.charAt(0).toUpperCase() + section.slice(1))
  assign.disabled = true;
  unassign.disabled = true;

  // Get the document id to remove
  const id = ids.filter(function(val) { return val.type == 'homework' && val.section == section && val.action == 'assign'})[0]['id']

  // Remove the id from the list of document ids
  ids = ids.filter(function(val) { return val.type != 'homework' || val.section != section || val.action != 'assign'})

  // Send the request to Fb to remove the assigned test
  let ref = firebase.firestore().collection('ACT-Student-Tests').doc(id)
  ref.delete()

  // Indicate that the test has been unassigned
  .then(() => {
    // Swap which button is being showed
    assign.classList.remove('hidden')
    unassign.classList.add('hidden')

    // Re-enable the buttons again
    assign.disabled = false;
    unassign.disabled = false;

    numAssignedTests -= 1;
    submitSession()
  })
  
  // Indicate that the test wasn't unassigned successfully
  .catch((error) => {
    console.log(error)
  })
}

function updateStatusBar(test, section, remove = false, colorClass = 'green') {

  const searchText = test + " - " + section[0].toUpperCase()

  let headerTabs = document.getElementById('answersPopupHeader').querySelectorAll('h2')
  let statusBars = document.getElementsByClassName('meter')

  for (let loc = 0; loc < headerTabs.length; loc++) {
    if (headerTabs[loc] != undefined && headerTabs[loc].innerHTML == searchText) {
      for (let i = 0; i < statusBars.length; i++) {
        let bars = statusBars[i].querySelectorAll('div')
        bars[loc].classList.remove('loading')
        if (remove == false) {
          bars[loc].classList.add(colorClass)
        }
        else {
          bars[loc].classList.remove(colorClass)
        }
      }
    }
  }
}

function checkTests() {

  // Check all of the tests that needed graded at the start of the session
  const testList = student_tests['assignedTests'];
  for (let i = 0; i < testList.length; i++) {
    const test = testList[i]['test']
    const section = testList[i]['section']

    let status = student_tests[section][test]['status']
    if (status == 'assigned') {
      return false;
    }
  }

  return true;
}

function notAssigningHomework(section) {
  if (notAssigningFlag == false) {
    numAssignedTests += 1;
    notAssigningFlag = true;

    let buttons = document.querySelectorAll("button[id$='NotAssigning']")
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.add('submitable')
    }
  }
  else {
    numAssignedTests -= 1;

    let buttons = document.querySelectorAll("button[id$='NotAssigning']")
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove('submitable')
    }
  }

  submitSession()
}

function submitSession() {
  getElapsedTime();

  if (homework_count == 0) {
    if (session_message_count > 0) {
      if (numAssignedTests > 0) {
        document.getElementById('submitSession').classList.add('submitable')
        console.log(timers)
      }
      else {
        document.getElementById('submitSession').classList.remove('submitable')
        console.log("Please assign homework")
      }
    }
    else {
      document.getElementById('submitSession').classList.remove('submitable')
      console.log("Please enter a new message")
    }
  }
  else {
    document.getElementById('submitSession').classList.remove('submitable')
    console.log("Please grade all tests")
  }
}

function getElapsedTime() {

  // Set the current time
  const section = document.getElementById('sectionTitle').innerHTML.toLowerCase()
  
  // Set the current time
  let time = Date.now()

  // Update the last time
  if (session_timer == undefined) {
    start_time = time;
  }
  else {
    timers[session_timer] += time - start_time;
  }

  // Update which section we are changing to
  session_timer = section;
}

function openTest(test, section = undefined) {

  let path = test + (section != undefined ? (" - " + section.charAt(0).toUpperCase() + section.slice(1)) : "");
  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Tests/' + path + '.pdf');
  ref.getDownloadURL().then((url) => {
      open(url);
    })

}

function setTestCarousel(type = 'practice') {
  if (type == 'practice') {
    for (let i = 0; i < sections.length; i++) {
      let testCount = 0;
      for (let j = 0; j < icTests.length; j++) {
        const data = test_answers_data[icTests[j]][sections[i] + 'Answers'];

        let item = createElement('div', ['input-column-center', 'carouselItem'], [], [], '')
        let test = icTests[j]
        let testItem = createElement('div', ['practiceTest'], [], [], test)
        item.append(testItem)

        let ovalDiv = createElement('div', ['input-row-center'], [], [], '')
        for (let k = 0; k < data[data.length - 1]['passageNumber']; k++) {
          let ovalItem = createElement('div', ['oval'], ['onclick'], ["openPracticeTest('" + test + "', '" + sections[i] + "', '" + (k + 1).toString() + "', this)"], (k + 1).toString())
          if (sections[i] in student_tests) {
            if (test in student_tests[sections[i]]) {
              if ((k + 1) in student_tests[sections[i]][test]) {
                ovalItem.classList.add("green")
              }
            }
          }
          ovalDiv.append(ovalItem)
        }
        item.append(ovalDiv)

        let carousel = document.getElementById(sections[i] + 'Carousel')
        carousel.append(item)
        testCount += 1;
      }

    }
  }
}

function squareUp(element, section) {
  element.parentNode.style.borderRadius = "0px";
  document.getElementById(section + 'Text').style.display = null;
  //element.innerHTML = section.charAt(0).toUpperCase() + section.slice(1);
}

function squareDown(element, section) {
  element.parentNode.style.borderRadius = null;
  document.getElementById(section + 'Text').style.display = 'none';
  //element.innerHTML = '';
}

function hideTitle() {
  document.getElementById('sectionTitle').style.display = "none"
}

function showTitle() {
  document.getElementById('sectionTitle').style.display = null;
}


/*function circularText(txt, offset) {

  const h = Math.min(window.innerHeight * 0.33, window.innerWidth * 0.33)

  let classIndex = document.getElementById(txt.toLowerCase() + "Text");
  txt = txt.split("");

  const deg = 90 / 12;
  let origin = (12 - txt.length) * deg / 2;
  origin += offset;

  txt.forEach((ea) => {
    rad = origin / 180 * Math.PI;
    if (['Reading', 'Science'].includes(txt)) {
      rad = Math.PI - rad;
    }
    const top = (h / 2) * ( 1 - Math.cos(rad))
    const left = (h / 4) * ( 2 + (1.5 * Math.sin(rad)))

    let item = createElement('p', [], [], [], ea);
    item.style.position = 'absolute';
    item.style.transformOrigin = '0 100%';
    item.style.transform = 'rotate(' + origin.toString() + 'deg)';
    item.style.left = left + 'px';
    item.style.top = top + 'px';

    classIndex.append(item)
    origin += deg;
  });

}

circularText("Math", 0);
circularText("English", -86);
circularText("Reading", 180);
circularText("Science", 80);*/

function transferLessons() {
  console.log('Starting Lessons')
  const ref = firebase.firestore().collection('Students')
  let id = undefined;
  let count = 0;
  ref.get()
  .then((querySnapshot) => {
    // For each student
    querySnapshot.forEach((doc) => {
      id = doc.id
      const newRef = ref.doc(id).collection('ACT').doc('lessons')
      newRef.get()
      .then((d) => {
        // Make sure the doc specified exists
        if (d.exists) {
          let obj = {}
          const studentId = doc.ref.path.split('/')[1]
          const data = d.data()
          const sections = Object.keys(data)
          for (let i = 0; i < sections.length; i++) {
            const sec = sections[i]
            const lessons = Object.keys(data[sections[i]])
            for (let j = 0; j < lessons.length; j++) {
              const les = lessons[j]
              const time = data[sec][les]['date']
              let status = data[sec][les]['status']
              if (status == 'needs review') {
                status = 'review'
              }
              // SET NEW DOCUMENT
              const setRef = firebase.firestore().collection('ACT-Student-Lessons').doc()
              obj['date'] = time;
              obj['lesson'] = les;
              obj['section'] = sec;
              obj['status'] = status;
              obj['student'] = studentId;
              setRef.set(obj)
              .then(() => console.log('set'))
              .catch((error) => console.log(error))
            }
          }
        }
      })
      .catch((error) => {
        console.log(error)
      })
      count += 1;
      //if (count == 10) {
        //throw exception
      //}
    })
  })
}
//transferLessons()

function transferTests() {
  console.log('transfering tests')
  const ref = firebase.firestore().collection('Students')
  let id = undefined;
  let count = 0;
  ref.get()
  .then((querySnapshot) => {
    // For each student
    querySnapshot.forEach((doc) => {
      id = doc.id
      // Make stuff below a function FIX ME
      const newRef = ref.doc(id).collection('ACT').doc('hw')
      newRef.get()
      .then((d) => {
        // Make sure the doc specified exists
        if (d.exists) {
          let obj = {}
          const studentId = doc.ref.path.split('/')[1]
          const data = d.data()
          const tests = Object.keys(data)
          for (let i = 0; i < tests.length; i++) {
            const test = tests[i]
            const sections = Object.keys(data[tests[i]])
            for (let j = 0; j < sections.length; j++) {
              const sec = sections[j]
              const passageNumbers = Object.keys(data[test][sec])
              let testType = data[test][sec]['TestType']
              let status = undefined
              let time = 0;
              let score = -1;
              let scaledScore = -1;
              let questions = []

              if (testType == 'homework') {
                time = data[test][sec]['Date'] ?? 0
                scaledScore = data[test][sec]['ScaledScore'] ?? -1
                score = data[test][sec]['Score'] ?? -1
                status = data[test][sec]['Status']
              }
              else if (testType != 'inCenter') {
                console.log(studentId, testType, test, sec)
              }

              for (let k = 0; k < passageNumbers.length; k++) {

                const passageNumber = passageNumbers[k]

                if (['1', '2', '3', '4', '5', '6', '7'].includes(passageNumber)) {
                  if (testType == 'inCenter' || testType == 'practice') {
                    questions = []
                  }
                  const passages = test_answers_data[test][sec.toLowerCase() + 'Answers'].filter(function(val) { return val.passageNumber == parseInt(passageNumber)})
                  const start = test_answers_data[test][sec.toLowerCase() + 'Answers'].indexOf(passages[0]) + 1
                  const end = test_answers_data[test][sec.toLowerCase() + 'Answers'].indexOf(passages[passages.length - 1]) + 1

                  if (testType == 'inCenter' || testType == 'practice') {
                    testType = 'practice'
                    status = data[test][sec][passageNumber]['Status']
                  }

                  for (let a = start; a < end + 1; a++) {
                    if (data[test][sec][passageNumber]['Answers'].includes(a.toString())) {
                      questions.push({
                        'isWrong' : true,
                        'question' : a
                      })
                    }
                    else {
                      questions.push({
                        'isWrong' : false,
                        'question' : a
                      })
                    }
                  }

                  if (testType == 'practice') {
                    const setRef = firebase.firestore().collection('ACT-Student-Tests').doc()
                    obj['date'] = time;
                    obj['passageNumber'] = passageNumber;
                    obj['questions'] = questions;
                    obj['score'] = score;
                    obj['section'] = sec.toLowerCase();
                    obj['status'] = status.toLowerCase();
                    obj['student'] = studentId;
                    obj['test'] = test;
                    obj['type'] = testType.toLowerCase();
                    setRef.set(obj)
                    .then(() => console.log('practice set'))
                    .catch((error) => console.log(error))
                  }

                  //console.log(testType, test, sec, passageNumber, questions)

                  if (status == undefined) {
                    console.log(studentId, 'has a bad status:', test, sec, passageNumber)
                    throw exception;
                  }
                }
              }

              if (testType == 'homework') {
                const setRef = firebase.firestore().collection('ACT-Student-Tests').doc()
                if (status != 'assigned' && status != 'reassigned') {
                  obj['date'] = time;
                  obj['questions'] = questions;
                  obj['score'] = score;
                  obj['scaledScore'] = scaledScore;
                  obj['section'] = sec.toLowerCase();
                  obj['status'] = status.toLowerCase();
                  obj['student'] = studentId;
                  obj['test'] = test;
                  obj['type'] = testType.toLowerCase();
                  setRef.set(obj)
                  .then(() => console.log('homework set'))
                  .catch((error) => console.log(error))
                }
                else {
                  let studentQuestions = initializeEmptyAnswers(test, sec.toLowerCase());
                  obj['date'] = time;
                  obj['questions'] = studentQuestions;
                  obj['score'] = -1;
                  obj['scaledScore'] = -1;
                  obj['section'] = sec.toLowerCase();
                  obj['status'] = 'assigned';
                  obj['student'] = studentId;
                  obj['test'] = test;
                  obj['type'] = testType.toLowerCase();
                  setRef.set(obj)
                  .then(() => console.log('homework set'))
                  .catch((error) => console.log(error))
                }
              }
            }
          }
        }
      })
      .catch((error) => {
        console.log(error)
        console.log(testType, test, sec, studentId, status, score, scaledScore, date, questions)
      })
      count += 1;
      //if (count == 10) {
        //throw exception
      //}
    })
  })
}
//transferTests()