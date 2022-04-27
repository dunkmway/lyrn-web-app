// The actual tests with their answers and scaled scores
// https://codepen.io/mayuMPH/pen/ZjxGEY  - range slider
let test_answers_data = {};
let test_answers_grading = {};
let ids = [];

// Student test information
let student_tests = {};
let tempAnswers = {};
let preTestScores = [];
let testGoals = [];
let postTestScores = [];
let initialScores = {};

// Current tests in use
//const hwTests  = ['C02', 'A11', '71E', 'A10', 'MC2', 'B05', 'D03', '74C']
//const icTests  = ['C03', 'B02', 'A09', 'B04', 'MC3', '74F', 'Z15', '72C']
//const othTests = ['67C', 'ST1', '64E', '61C', '59F', '69A', 'ST2', '66F',
                  //'61F', '55C', '58E', '71C', '71G', '68G', '68A', '72F',
                  //'71H', 'C01', '67A', '63C', '61D', '73E', '73C', '71A',
                  //'66C', '65E', '63F', '63D', '72G', '69F', '70G', '65C', '74H']
// REMOVE - revert to test lists above
const hwTests  = ['C02', 'A11', '71E', 'A10', 'MC2', 'B05', '74C','67C', 'ST1', '64E', '61C', '59F', '69A', 'ST2', '66F','61F', '55C', '58E', '71C', '71G', '68G', '68A', '72F']
const icTests  = ['C03', 'B02', 'A09', 'B04', 'MC3', '74F', 'Z15', '72C', '71H', 'C01', '67A', '63C', '61D', '73E', '73C', '71A', '66C', '65E', '63F', '63D', '72G', '69F', '70G', '65C', '74H']
        
// Other needed info
const coloring = {'Completed' : 'green', 'in-time' : 'green', 'not in time' : 'greenShade', 'poor conditions' : 'greenShade', 'previously completed' : 'greenShade', 'assigned' : 'yellow', 'in-center' : 'red', 'partial' : 'greenShade', 'white' : 'white'};
const keys_to_skip = ['Status', 'TestType', 'ScaledScore', 'Score', 'Date', 'Time']
// const date = new Date()
let test_view_type = undefined;
let new_status = undefined;
let storage = firebase.storage();
let tests_to_grade = {};
// let session_message_count = 0;
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
    let currentDayTests = []
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
      obj['id'] = doc.id

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
      else if (data.date > convertFromDateInt(date.getTime())['startOfDayInt']) {
        currentDayTests.push({ 'test' : data.test,
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
    setObjectValue(['currentDayTests'], currentDayTests, finalObj)
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
      addCompletedHomeworks();
      //getElapsedTime();
      setGeneralInfo();
      submitSession();
      setProfilePic();
      setChartData(CURRENT_STUDENT_UID);

    })
    .catch((error) => console.log(error))
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

function changeAccentColor(sectionName) {
  document.querySelector(':root').style.setProperty('--accent-color', `var(--${sectionName}-color)`)
}

function changeSection(section) {

  // Hide the popups
  hidePopups();

  //change the accent color
  changeAccentColor(section)

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

function swapTestForm(test, section = undefined, passageNumber = 1) {
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
    current_homework_passage_number = passageNumber;

    // swap which popup is being viewed
    chatForm.style.display = 'none'
    testForm.style.display = 'flex'

    // Display the test form
    if (!test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']) {
      setObjectValue([test, section, passageNumber, 'questions'], initializeEmptyPassageAnswers(test, section, passageNumber), test_answers_grading)
    }
    updateHomeworkGraphics(test, section, (passageNumber));
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
    setObjectValue([test, section, passageNumber, 'questions'], student_tests[section][test][passageNumber]?.['questions'], test_answers_grading)
  }
}

function addCompletedHomeworks() {
  const testList = student_tests['currentDayTests'];

  // For each test that needs to be graded
  for (let i = 0; i < testList.length; i++) {
    const test = testList[i]['test']
    const section = testList[i]['section']
    const id = testList[i]['id']

    setObjectValue([test, section, 'status'], student_tests[section][test]['status'], test_answers_grading)

    // Create the array for the test that needs graded this session
    addAssignedTest(test, section, 'green');

    // Store the id
    /*ids.push({
      'type' : 'homework',
      'section' : section,
      'test' : test,
      'action' : 'assign',
      'id' : id
    })*/
  }
}

function checkForAssignedHomeworks() {
  const testList = student_tests['assignedTests'];

  // For each test that needs to be graded
  for (let i = 0; i < testList.length; i++) {
    const test = testList[i]['test']
    const section = testList[i]['section']
    const id = testList[i]['id']

    // Create the array for the test that needs graded this session
    addAssignedTest(test, section);

    // Make sure that the test was assigned before the current day
    if (student_tests[section][test]['date'] < convertFromDateInt(date.getTime())['startOfDayInt']) {
      // Lower the homework count for each test that needs graded
      homework_count -= 1;
    }
    else {

      numAssignedTests += 1;

      ids.push({
        'type' : 'homework',
        'section' : section,
        'test' : test,
        'action' : 'assign',
        'id' : id
      })

      document.getElementById('assign').classList.add('hidden')
      document.getElementById('unassign').classList.remove('hidden')
    }
  }

}

function removeAssignedTest(test, section) {
  let locations = document.getElementById('generalHeader').querySelectorAll('div')
  let locations2 = document.getElementById('answersPopupHeader').querySelectorAll('div')
  let statusBars = document.getElementsByClassName('meter')

  for (let i = 0; i < locations.length; i++) {
    t = locations[i].querySelector('h2').innerHTML.split(' - ')[0]
    s = locations[i].querySelector('h2').innerHTML.split(' - ')[1]
    if (t == test && s == section.charAt(0).toUpperCase()) {
      locations[i].remove()
      locations2[i].remove()
      for (let j = 0; j < statusBars.length; j++) {
        statusBars[j].querySelectorAll('div')[i].remove()
      }
    }
  }
}

function showTestPopup(test = undefined, section = undefined) {
  clearTimeout(timeout)

  let div = document.getElementById('testPopup')
  div.style.display = 'block'

  if (test != undefined) {
    let children = div.querySelectorAll('div')
    document.getElementById('testName').innerHTML = test + ' - ' + section.charAt(0).toUpperCase() + section.slice(1)
    for (let i = 0; i < children.length; i++) {
      let subChildren = children[i].querySelectorAll('p')
      if (i == 0) {
        subChildren[1].innerHTML = ((test_answers_grading[test]?.[section]?.['scaledScore'] ?? student_tests[section]?.[test]?.['scaledScore']) ?? (-1).toString())
      }
      else if (i == 1) {
        const numQuestions = test_answers_data[test][section + 'Answers'].length
        subChildren[1].innerHTML = ((test_answers_grading[test]?.[section]?.['score'] ?? student_tests[section]?.[test]?.['score'] ) ?? (-1)).toString() + ' / ' + numQuestions.toString()
      }
      else if (i == 2) {
        subChildren[1].innerHTML = (test_answers_grading[test]?.[section]?.['status'] ?? 'assigned')
      }
    }
  }
}

function hideTestPopup() {
  timeout = setTimeout(function(){
    let div = document.getElementById('testPopup')
    div.style.display = 'none'
  }, 50)
}

function addAssignedTest(test, section, colorClass = 'yellow') {
  let location = document.getElementById('generalHeader')
  let location2 = document.getElementById('answersPopupHeader')
  let statusBars = document.getElementsByClassName('meter')

  const questions = student_tests[section]?.[test]?.['questions'] ?? initializeEmptyAnswers(test, section)

  setObjectValue([test, section, 'questions'], questions, test_answers_grading)

  // Create the tab for grading
  let tab = createElements(['h2'], [[]], [[]], [[]], [test + ' - ' + section[0].toUpperCase()], ['headingBlock', 'noselect', 'cursor', section + 'Color'])
  let tab2 = createElements(['h2'], [[]], [[]], [[]], [test + ' - ' + section[0].toUpperCase()], ['headingBlock', 'noselect', 'cursor', section + 'Color'])
  tab.setAttribute('onclick', "swapTestForm('" + test + "', '" + section + "')")
  tab2.setAttribute('onclick', "swapTestForm('" + test + "', '" + section + "')")
  tab.setAttribute('onmouseover', "showTestPopup('" + test + "', '" + section + "')")
  tab2.setAttribute('onmouseover', "showTestPopup('" + test + "', '" + section + "')")
  tab.setAttribute('onmouseout', "hideTestPopup()")
  tab2.setAttribute('onmouseout', "hideTestPopup()")
  location.append(tab)
  location2.append(tab2)

  // Add blank status bars below each test
  for (let i = 0; i < statusBars.length; i++) {
    let ele = createElement('div', ['statusBar'], [], [], '')

    // Mark it the status yellow if assigned today
    const time = student_tests[section]?.[test]?.['date'] ?? date.getTime()

    if (time >= convertFromDateInt(date.getTime())['startOfDayInt']) {
      ele.classList.add(colorClass)
    }

    statusBars[i].append(ele);
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
  const answerOptionsFourOdd = ['A', 'B', 'C', 'D'];
  const answerOptionsFourEven = ['F', 'G', 'H', 'J'];
  const answerOptionsFiveOdd = ['A', 'B', 'C', 'D', 'E'];
  const answerOptionsFiveEven = ['F', 'G', 'H', 'J', 'K'];

  const fourOptionSections = ['english', 'reading', 'science'];
  const fiveOptionSections = ['math'];

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
    //set up the answer choice depending on the test
    
    //four option sections
    if (fourOptionSections.includes(section)) {
      //get the correct question modulus options
      const currentQuestionsAnswerOptions = passageNumbers[answer] % 2 == 1 ? answerOptionsFourOdd : answerOptionsFourEven;
      const correctAnswerIndex = currentQuestionsAnswerOptions.indexOf(passageAnswers[answer]);
      const selectedAnswerIndex = currentQuestionsAnswerOptions.indexOf(test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['selectedAnswer']);
      const isGuess = test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['isGuess'];
      const onclickAnswerCallback = (answerOptionIndex) => {return `answerClickCallback('${test}', '${section}', '${passageNumber}', '${answer}', '${currentQuestionsAnswerOptions[answerOptionIndex]}', '${passageAnswers[answer]}', this)`};
      const onclickGuessCallback = `guessClickCallback('${test}', '${section}', '${passageNumber}', '${answer}', this)`;

      let ele = createElements(
        ['div', 'div', 'div', 'div', 'div'],
        [['popupValue', isGuess ? 'selected': null], ['popupAnswer', correctAnswerIndex == 0 ? 'correct' : null, selectedAnswerIndex == 0 ? 'selected' : null], ['popupAnswer', correctAnswerIndex == 1 ? 'correct' : null, selectedAnswerIndex == 1 ? 'selected' : null], ['popupAnswer', correctAnswerIndex == 2 ? 'correct' : null, selectedAnswerIndex == 2 ? 'selected' : null], ['popupAnswer', correctAnswerIndex == 3 ? 'correct' : null, selectedAnswerIndex == 3 ? 'selected' : null]],
        [['onclick'], ['onclick'], ['onclick'], ['onclick'], ['onclick']],
        [[onclickGuessCallback], [onclickAnswerCallback(0)], [onclickAnswerCallback(1)], [onclickAnswerCallback(2)], [onclickAnswerCallback(3)]],
        [(passageNumbers[answer]).toString() + ':', currentQuestionsAnswerOptions[0], currentQuestionsAnswerOptions[1], currentQuestionsAnswerOptions[2], currentQuestionsAnswerOptions[3]],
        ["input-row-center", "cursor"]
      )

      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer]);
      ele.setAttribute("data-answer", passageAnswers[answer]);
    }
    //five option sections
    else if (fiveOptionSections.includes(section)) {
      //get the correct question modulus options
      const currentQuestionsAnswerOptions = passageNumbers[answer] % 2 == 1 ? answerOptionsFiveOdd : answerOptionsFiveEven;
      const correctAnswerIndex = currentQuestionsAnswerOptions.indexOf(passageAnswers[answer]);
      const selectedAnswerIndex = currentQuestionsAnswerOptions.indexOf(test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['selectedAnswer']);
      const isGuess = test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['isGuess'];
      const onclickAnswerCallback = (answerOptionIndex) => {return `answerClickCallback('${test}', '${section}', '${passageNumber}', '${answer}', '${currentQuestionsAnswerOptions[answerOptionIndex]}', '${passageAnswers[answer]}', this)`};
      const onclickGuessCallback = `guessClickCallback('${test}', '${section}', '${passageNumber}', '${answer}', this)`;

      let ele = createElements(
        ['div', 'div', 'div', 'div', 'div', 'div'],
        [['popupValue', isGuess ? 'selected': null], ['popupAnswer', correctAnswerIndex == 0 ? 'correct' : null, selectedAnswerIndex == 0 ? 'selected' : null], ['popupAnswer', correctAnswerIndex == 1 ? 'correct' : null, selectedAnswerIndex == 1 ? 'selected' : null], ['popupAnswer', correctAnswerIndex == 2 ? 'correct' : null, selectedAnswerIndex == 2 ? 'selected' : null], ['popupAnswer', correctAnswerIndex == 3 ? 'correct' : null, selectedAnswerIndex == 3 ? 'selected' : null], ['popupAnswer', correctAnswerIndex == 4 ? 'correct' : null, selectedAnswerIndex == 4 ? 'selected' : null]],
        [['onclick'], ['onclick'], ['onclick'], ['onclick'], ['onclick'], ['onclick']],
        [[onclickGuessCallback], [onclickAnswerCallback(0)], [onclickAnswerCallback(1)], [onclickAnswerCallback(2)], [onclickAnswerCallback(3)], [onclickAnswerCallback(4)]],
        [(passageNumbers[answer]).toString() + ':', currentQuestionsAnswerOptions[0], currentQuestionsAnswerOptions[1], currentQuestionsAnswerOptions[2], currentQuestionsAnswerOptions[3], currentQuestionsAnswerOptions[4]],
        ["input-row-center", "cursor"]
      )

      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer]);
      ele.setAttribute("data-answer", passageAnswers[answer]);
    }
    else {
      console.warn('This section is not formmatted properly: ' + section);
    }
  }
}

function updateHomeworkGraphics(test, section, passageNumber = 1) {
  const answerOptionsFourOdd = ['A', 'B', 'C', 'D'];
  const answerOptionsFourEven = ['F', 'G', 'H', 'J'];
  const answerOptionsFiveOdd = ['A', 'B', 'C', 'D', 'E'];
  const answerOptionsFiveEven = ['F', 'G', 'H', 'J', 'K'];

  const fourOptionSections = ['english', 'reading', 'science'];
  const fiveOptionSections = ['math'];

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
  for (let answer = 0; answer < passageAnswers.length; answer++) {
    //set up the answer choice depending on the test
    
    //four option sections
    if (fourOptionSections.includes(section)) {
      //get the correct question modulus options
      const currentQuestionsAnswerOptions = passageNumbers[answer] % 2 == 1 ? answerOptionsFourOdd : answerOptionsFourEven;
      const correctAnswerIndex = currentQuestionsAnswerOptions.indexOf(passageAnswers[answer]);
      const selectedAnswerIndex = currentQuestionsAnswerOptions.indexOf(test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['selectedAnswer']);
      const isGuess = test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['isGuess'];
      const onclickAnswerCallback = (answerOptionIndex) => {return `answerClickCallback('${test}', '${section}', '${passageNumber}', '${answer}', '${currentQuestionsAnswerOptions[answerOptionIndex]}', '${passageAnswers[answer]}', this)`};
      const onclickGuessCallback = `guessClickCallback('${test}', '${section}', '${passageNumber}', '${answer}', this)`;

      let ele = createElements(
        ['div', 'div', 'div', 'div', 'div'],
        [['popupValue', section, isGuess ? 'selected': null], ['popupAnswer', section, correctAnswerIndex == 0 ? 'correct' : null, selectedAnswerIndex == 0 ? 'selected' : null], ['popupAnswer', section, correctAnswerIndex == 1 ? 'correct' : null, selectedAnswerIndex == 1 ? 'selected' : null], ['popupAnswer', section, correctAnswerIndex == 2 ? 'correct' : null, selectedAnswerIndex == 2 ? 'selected' : null], ['popupAnswer', section, correctAnswerIndex == 3 ? 'correct' : null, selectedAnswerIndex == 3 ? 'selected' : null]],
        [['onclick'], ['onclick'], ['onclick'], ['onclick'], ['onclick']],
        [[onclickGuessCallback], [onclickAnswerCallback(0)], [onclickAnswerCallback(1)], [onclickAnswerCallback(2)], [onclickAnswerCallback(3)]],
        [(passageNumbers[answer]).toString() + ':', currentQuestionsAnswerOptions[0], currentQuestionsAnswerOptions[1], currentQuestionsAnswerOptions[2], currentQuestionsAnswerOptions[3]],
        ["input-row-center", "cursor"]
      )

      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer]);
      ele.setAttribute("data-answer", passageAnswers[answer]);
    }
    //five option sections
    else if (fiveOptionSections.includes(section)) {
      //get the correct question modulus options
      const currentQuestionsAnswerOptions = passageNumbers[answer] % 2 == 1 ? answerOptionsFiveOdd : answerOptionsFiveEven;
      const correctAnswerIndex = currentQuestionsAnswerOptions.indexOf(passageAnswers[answer]);
      const selectedAnswerIndex = currentQuestionsAnswerOptions.indexOf(test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['selectedAnswer']);
      const isGuess = test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[answer]?.['isGuess'];
      const onclickAnswerCallback = (answerOptionIndex) => {return `answerClickCallback('${test}', '${section}', '${passageNumber}', '${answer}', '${currentQuestionsAnswerOptions[answerOptionIndex]}', '${passageAnswers[answer]}', this)`};
      const onclickGuessCallback = `guessClickCallback('${test}', '${section}', '${passageNumber}', '${answer}', this)`;

      let ele = createElements(
        ['div', 'div', 'div', 'div', 'div', 'div'],
        [['popupValue', section, isGuess ? 'selected': null], ['popupAnswer', section, correctAnswerIndex == 0 ? 'correct' : null, selectedAnswerIndex == 0 ? 'selected' : null], ['popupAnswer', section, correctAnswerIndex == 1 ? 'correct' : null, selectedAnswerIndex == 1 ? 'selected' : null], ['popupAnswer', section, correctAnswerIndex == 2 ? 'correct' : null, selectedAnswerIndex == 2 ? 'selected' : null], ['popupAnswer', section, correctAnswerIndex == 3 ? 'correct' : null, selectedAnswerIndex == 3 ? 'selected' : null], ['popupAnswer', section, correctAnswerIndex == 4 ? 'correct' : null, selectedAnswerIndex == 4 ? 'selected' : null]],
        [['onclick'], ['onclick'], ['onclick'], ['onclick'], ['onclick'], ['onclick']],
        [[onclickGuessCallback], [onclickAnswerCallback(0)], [onclickAnswerCallback(1)], [onclickAnswerCallback(2)], [onclickAnswerCallback(3)], [onclickAnswerCallback(4)]],
        [(passageNumbers[answer]).toString() + ':', currentQuestionsAnswerOptions[0], currentQuestionsAnswerOptions[1], currentQuestionsAnswerOptions[2], currentQuestionsAnswerOptions[3], currentQuestionsAnswerOptions[4]],
        ["input-row-center", "cursor"]
      )

      passage.appendChild(ele);
      ele.setAttribute("data-question", passageNumbers[answer]);
      ele.setAttribute("data-answer", passageAnswers[answer]);
    }
    else {
      console.warn('This section is not formmatted properly: ' + section);
    }
  }
}

/**
 * Callback for a click event on an answer for a test.
 * Update the test answer object and visually select the user selected answer
 * @param {String} test test id
 * @param {String} section section id
 * @param {String} passageNumber passage id
 * @param {Number} questionIndex question index
 * @param {String} selectedAnswer answer selected by user
 * @param {String} correctAnswer correct answer for this problem
 * @param {HTMLElement} selectedElement the element that the callback is being called for
 */
function answerClickCallback(test, section, passageNumber, questionIndex, selectedAnswer, correctAnswer, selectedElement) {
  //we are passing all strings into the parameters since we are using a string literal to add this callback as an onclick event attribute to an html element
  //convert this index back to a number
  questionIndex = Number(questionIndex);

  //toggle functionality
  if (test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[questionIndex]?.selectedAnswer == selectedAnswer) {
    //already selected this answer

    //update the test answers object
    test_answers_grading[test][section][passageNumber]['questions'][questionIndex].selectedAnswer = null;
    test_answers_grading[test][section][passageNumber]['questions'][questionIndex].isWrong = null;

    //visually unselect this elements siblings
    unselectSiblingsByClass(selectedElement, '.popupAnswer');
  }
  else {
    //this answer option is not currently selected

    //update the test answers object
    test_answers_grading[test][section][passageNumber]['questions'][questionIndex].selectedAnswer = selectedAnswer;
    test_answers_grading[test][section][passageNumber]['questions'][questionIndex].isWrong = (selectedAnswer != correctAnswer);

    //visually unselect this elements siblings
    unselectSiblingsByClass(selectedElement, '.popupAnswer');

    //visually select the option
    selectedElement.classList.add('selected');
  }
}

/**
 * Callback for a click event on an guess for a test.
 * Update the test answer object and visually select question number to indicate a guess
 * @param {String} test test id
 * @param {String} section section id
 * @param {String} passageNumber passage id
 * @param {Number} questionIndex question index
 * @param {HTMLElement} selectedElement the element that the callback is being called for
 */
 function guessClickCallback(test, section, passageNumber, questionIndex, selectedElement) {
  //we are passing all strings into the parameters since we are using a string literal to add this callback as an onclick event attribute to an html element
  //convert this index back to a number
  questionIndex = Number(questionIndex);

  //update the test answers object
  if (test_answers_grading?.[test]?.[section]?.[passageNumber]?.['questions']?.[questionIndex]?.isGuess) {
    test_answers_grading[test][section][passageNumber]['questions'][questionIndex].isGuess = false;
    //visually unselect the option
    selectedElement.classList.remove('selected');
  }
  else {
    test_answers_grading[test][section][passageNumber]['questions'][questionIndex].isGuess = true;
    //visually select the option
    selectedElement.classList.add('selected');
  }
}

/**
 * remove the 'selected' class from this child's parent's children that have the same class names
 * @param {HTMLElement} child element whose siblings (inclusiding itself) will be unselected
 * @param {String} classNames class names that should be queryed for within the parent (use css naming convention)
 */
function unselectSiblingsByClass(child, classNames = '*') {
  child.parentNode.querySelectorAll(classNames).forEach(sibling => {
    sibling.classList.remove('selected');
  })
}

function openCurrentHomeworkTest() {
  const test = current_homework_test;
  const section = current_homework_section;

  openTest(test, section);
}

function resetAnswers() {

  // grab the test and section
  const test = current_homework_test;
  const section = current_homework_section;
  const tempStatus = test_answers_grading[test]?.[section]?.['status']

  // Disable the button until everything is done
  document.getElementById('submitHomework').disabled = true;

  // Remove the answers
  removeAnswersFromHTMLForm();
  
  // Reset the answers for the working test
  let questions = test_answers_grading[test][section]['questions']
  for (let i = 0; i < questions.length; i++) {
    test_answers_grading[test][section]['questions'][i]['isWrong'] = null;
    test_answers_grading[test][section]['questions'][i]['isGuess'] = null;
    test_answers_grading[test][section]['questions'][i]['selectedAnswer'] = null;
  }

  // Reset the test if need be
  /*let idPath = student_tests['assignedTests'].filter(function(val) { return val.section == section && val.test == test})
  if (idPath.length == 0) {
    idPath = ids.filter(function(val) { return val.section == section && val.test == test})
  }
  const id = idPath[0]['id']*/
  let id = student_tests[section]?.[test]?.['id']
  if (id == undefined) {
    id = ids.filter(function(val) { return val.section == section && val.test == test})[0]['id']
  }
  let ref = firebase.firestore().collection('ACT-Student-Tests').doc(id)
  const studentQuestions = initializeEmptyAnswers(test, section);

  // Reset values
  setObjectValue([test, section, 'score'], -1, test_answers_grading)
  setObjectValue([test, section, 'scaledScore'], -1, test_answers_grading)
  setObjectValue([test, section, 'status'], 'assigned', test_answers_grading)

  obj = {}
  /*if (student_tests[section]?.[test]?.['date'] != undefined) {
    obj['questions'] = studentQuestions,
    obj['status'] = student_tests[section][test]['status'],
    obj['date'] = student_tests[section][test]['date'],
    obj['score'] = student_tests[section][test]['score'],
    obj['scaledScore'] = student_tests[section][test]['scaledScore']

    setObjectValue([test, section, 'score'], student_tests[section][test]['score'], test_answers_grading)
    setObjectValue([test, section, 'scaledScore'], student_tests[section][test]['scaledScore'], test_answers_grading)
    setObjectValue([test, section, 'status'], student_tests[section][test]['status'], test_answers_grading)
  }
  else {*/
    obj['questions'] = studentQuestions,
    obj['status'] = 'assigned',
    obj['date'] = date.getTime(),
    obj['score'] = -1,
    obj['scaledScore'] = -1
  //}

  ref.update(obj)

  // Successfully reset the test
  .then(() => {
    document.getElementById('submitHomework').disabled = false;

    // Remove the green bar status if it's there
    const testDate = student_tests[section]?.[test]?.['date']
    if (student_tests[section]?.[test]?.['status'] == 'assigned') {
      if (testDate != undefined && testDate < convertFromDateInt(date.getTime())['startOfDayInt']) {
        updateStatusBar(test, section, true)
      }
      else if (testDate != undefined && testDate >= convertFromDateInt(date.getTime())['startOfDayInt']) {
        updateStatusBar(test, section, true)
        updateStatusBar(test, section, false, 'yellow')
      }
    }
    else if (student_tests[section]?.[test]?.['status'] != undefined) {
      updateStatusBar(test, section, true)
      //updateStatusBar(test, section, false, 'green')
    }
    else if (student_tests[section]?.[test]?.['status'] == undefined) {
      updateStatusBar(test, section, true)
      updateStatusBar(test, section, false, 'yellow')
    }
    
    // Lower the homework count by 1
    //if (student_tests[section]?.[test]?.['date'] != undefined) {
    //if (test_answers_grading[test]?.[section]?.['status'] != 'assigned' && test_answers_grading[test]?.[section]?.['status'] != undefined) {
    if ((tempStatus != 'assigned' && tempStatus != undefined) && testDate != undefined && testDate < convertFromDateInt(date.getTime())['startOfDayInt']) {
      homework_count -= 1;
    }
    else {
      // Return the buttons to assigned
      let assign = document.getElementById('assign')
      let unassign = document.getElementById('unassign')
      assign.classList.add('hidden')
      unassign.classList.remove('hidden')

      // update the ids for the graded assigned test
      const temp = ids.filter(function(val) { return val.section == section && val.test == test})//[0]
      if (temp.length > 0) {
        ids = ids.filter(function(val) { return val.section != section || val.test != test})
        temp[0]['action'] = 'assign'
        ids.push(temp[0])
      }

      // increment the number of assigned tests
      numAssignedTests += 1;
    }

  })

  // Wasn't able to reset the test
  .catch((error) => {
    console.log(error)
    document.getElementById('submitHomework').disabled = false;
  })

  //reinitialize the passage answers
  const numPassages = test_answers_data[test][section + 'Answers'][test_answers_data[test][section + 'Answers'].length - 1]['passageNumber'];
  for (let i = 1; i <= numPassages; i++) {
    setObjectValue([test, section, i, 'questions'], initializeEmptyPassageAnswers(test, section, i), test_answers_grading)
  }

  // Set up the student_testsPopup again
  //swapTestForm(test, section, passageNumber)
  swapTestForm(test, section, 1)
}

function toggleHomeworkPopup() {
  // hide the error message
  document.getElementById("gradeFirst").style.display = "none";

  // Toggle the submit button popups
  document.getElementById("submitHomeworkPopup").classList.toggle("show");
}

function gradeHomework(status) {
  // grab the test, section, and num passages
  const test = current_homework_test;
  const section = current_homework_section;
  const numPassages = test_answers_data[test][section + 'Answers'][test_answers_data[test][section + 'Answers'].length - 1]['passageNumber'];
  const tempStatus = test_answers_grading[test]?.[section]?.['status']

  // Set the status bar as loading
  updateStatusBar(test, section, false, 'loading')

  // Close the popup
  hidePopups()

  // Disable the buttons until it this function has done its job
  document.getElementById('submitHomework').disabled = true;

  // Record the status
  if (status != 'did not do') {
    setObjectValue([test, section, 'status'], status, test_answers_grading)
  }

  //go through all of the passages and combine them
  //FIXME: can't do this since the code later will read this as separate passages and fill in the detail from there. Maybe redo for homework?
  //What would be better is to save homework as separate passages and combine them after?
  //different idea: make the practice test all combine into one test and section and not separated by passage. Just have all of the passages together.

  //make sure we have all of the passages first
  for (let i = 1; i <= numPassages; i++) {
    if (test_answers_grading[test][section][i.toString()] == undefined) {
      alert("Make sure you are on the last passage before you submit this homework.")
      document.getElementById('submitHomework').disabled = false;
      return;
    }
  }

  test_answers_grading[test][section]['questions'] = [];

  for (let i = 1; i <= numPassages; i++) {
    test_answers_grading[test][section]['questions'] = test_answers_grading[test][section]['questions'].concat(test_answers_grading[test][section][i.toString()]['questions']);
  }

  // Calculate how many questions they missed and got correct
  let totalMissed = test_answers_grading[test][section]['questions'].filter(function(val) { return val.isWrong == true || val.isWrong == null} ).length;
  let score = test_answers_grading[test][section]['questions'].length - totalMissed;
  setObjectValue([test, section, 'score'], score, test_answers_grading)

  // Calculate the scaled score
  let scaledScore = -1;
  if (['in-time', 'in-center'].includes(status)) {
    for (const [key, value] of Object.entries(test_answers_data[test][section.toLowerCase() + "Scores"])) {
      if (score >= parseInt(value, 10)) {
        scaledScore = 36 - parseInt(key);
        setObjectValue([test, section, 'scaledScore'], scaledScore, test_answers_grading)
        break;
      }
    }
  }

  // Change the score and questions back if they're not applicable
  if (['forgot', 'previously completed', 'did not do'].includes(status)) {
    score = -1;
    scaledScore = -1;
    setObjectValue([test, section, 'questions'], initializeEmptyAnswers(test, section), test_answers_grading)
    if (status == 'forgot') {
      status = 'assigned'
    }
    setObjectValue([test, section, 'score'], score, test_answers_grading)
    setObjectValue([test, section, 'scaledScore'], scaledScore, test_answers_grading)
  }

  // Set the information
  //let idPath =  student_tests['assignedTests'].filter(function(val) { return val.section == section && val.test == test})
  let id = student_tests[section]?.[test]?.['id']
  if (id == undefined) {
    id = ids.filter(function(val) { return val.section == section && val.test == test})[0]['id']
  }
  //if (idPath.length == 0) {
    //idPath = ids.filter(function(val) { return val.section == section && val.test == test})
  //}
  //const id = idPath[0]['id']
  //const id = ids.filter(function(val) { return val.section == section && val.test == test})[0]['id'] ?? student_tests['assignedTests'].filter(function(val) { return val.section == section && val.test == test})[0]['id']

  // Get the ref
  let ref = firebase.firestore().collection('ACT-Student-Tests').doc(id)

  // Remove the test if they didn't do it, so it can be reassigned
  if (status == 'did not do') {
    ref.delete()
    .then(() => {
      // Re-enable the buttons
      document.getElementById('submitHomework').disabled = false;

      // Update the status bar to mark the test as completed
      updateStatusBar(test, section)

      // up the homework count
      if (test_answers_grading[test]?.[section]?.['status'] == 'assigned') {
        homework_count += 1;
        setObjectValue([test, section, 'status'], status, test_answers_grading)
      }
    })
    .catch((error) => {
      console.log(error)
    })
  }
  else {
    ref.update({
      ['questions'] : test_answers_grading[test][section]['questions'],
      ['date'] : date.getTime(),
      ['score'] : score,
      ['scaledScore'] : scaledScore,
      ['status'] : status
    })
    .then(() => {
      // Re-enable the buttons
      document.getElementById('submitHomework').disabled = false;

      // Update the status bar to mark the test as completed
      updateStatusBar(test, section)

      // up the homework count
      //if (student_tests[section]?.[test]?.['date'] != undefined) {
      let testDate = student_tests[section]?.[test]?.['date'] ?? date.getTime()
      if (['assigned', undefined].includes(tempStatus) && testDate != undefined && testDate < convertFromDateInt(date.getTime())['startOfDayInt']) {
        homework_count += 1;
      }
      //else if (['assigned', undefined].includes(test_answers_grading[test]?.[section]?.['status']) && testDate != undefined && testDate >= convertFromDateInt(date.getTime())['startOfDayInt']) {
      else if (['assigned', undefined].includes(tempStatus) && testDate != undefined && testDate >= convertFromDateInt(date.getTime())['startOfDayInt']) {
        // Swap which button is being showed
        let assign = document.getElementById('assign')
        let unassign = document.getElementById('unassign')
        assign.classList.remove('hidden')
        unassign.classList.add('hidden')

        // update the ids for the graded assigned test
        const temp = ids.filter(function(val) { return val.section == section && val.test == test})[0]
        ids = ids.filter(function(val) { return val.section != section || val.test != test})
        temp['action'] = 'graded'
        ids.push(temp)

        // Decrement the number of assigned tests
        numAssignedTests -= 1;
      }

      // Check to see if the session has been sufficiently finished
      submitSession()
    })
    .catch((error) => {
      // Re-enable the buttons
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

  for (let i = 0; i < submitButtons.length; i++) {
    submitButtons[i].disabled = disable;
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
  let totalMissed = test_answers_grading[test][section][passageNumber]['questions'].filter(function(val) { return val.isWrong == true || val.isWrong == null} ).length;
  let score = test_answers_grading[test][section][passageNumber]['questions'].length - totalMissed;

  // Change the score back if it's not applicable
  if (['together', 'popcorn', 'prior'].includes(status)) {
    score = -1;
  }

  // Check to see if it's a previously completed practice passage
  let id = student_tests['practiceTests'].filter(function(val) { return val.section == section && val.test == test && val.passageNumber == passageNumber})

  // Make sure that it isn't an old test
  if (id.length == 0) {

    // Get the ref
    let refStart = firebase.firestore().collection('ACT-Student-Tests')

    // Check to see if it has been submitted already
    id = ids.filter(function(val) { return val.section == section && val.test == test && val.passageNumber == passageNumber})

    // It hasn't been submitted yet
    if (id.length == 0) {
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

// function assignHomework(section, assigningTest = undefined) {

//   // Disable the buttons until homework has been assigned
//   let assign = document.getElementById('assign' + section.charAt(0).toUpperCase() + section.slice(1))
//   let unassign = document.getElementById('unassign' + section.charAt(0).toUpperCase() + section.slice(1))
//   assign.disabled = true;
//   unassign.disabled = true;

//   // Initialize the object to send to Fb
//   let obj = {}

//   // Find the next test
//   let test = undefined;
//   if (assigningTest == undefined) { // REMOVE
//   if (section in student_tests) {
//     for (let i = 0; i < hwTests.length; i++) {
//       if (hwTests[i] in student_tests[section]) {
//       }
//       else {
//         if (ids.filter(function(val) {return val.test == hwTests[i] && val.section == section}).length == 0) {
//           test = hwTests[i]
//           break;
//         }
//       }
//     }
//   }
//   else {
//     test = hwTests[0]
//   }

//   // They have completed all of the normal hw tests, so start going through the 'other' tests
//   if (test == undefined) {
//     if (section in student_tests) {
//       for (let i = 0; i < othTests.length; i++) {
//         if (othTests[i] in student_tests[section]) {
//         }
//         else {
//           test = othTests[i]
//           break;
//         }
//       }
//     }
//     else {
//       test = othTests[0]
//     }
//   }
//   }
//   else { // REMOVE
//     test = assigningTest
//   }

//   const refCheck = firebase.firestore().collection('ACT-Student-Tests').where('student', '==', CURRENT_STUDENT_UID).where('test', '==', test).where('section', '==', section) // REMOVE
//   refCheck.get() // REMOVE
//   .then((querySnapshot) => { // REMOVE
//     if (querySnapshot.size > 0) { // REMOVE
//       return // REMOVE
//     } // REMOVE
//     else { // REMOVE

//   // Initialize the questions array
//   let studentQuestions = initializeEmptyAnswers(test, section);

//   // Initialize the object to send to FB
//   setObjectValue(['test'], test, obj);
//   setObjectValue(['section'], section, obj);
//   setObjectValue(['student'], CURRENT_STUDENT_UID, obj);
//   setObjectValue(['questions'], studentQuestions, obj);
//   setObjectValue(['date'], date.getTime(), obj);
//   setObjectValue(['type'], 'homework', obj);
//   setObjectValue(['status'], 'assigned', obj);
//   setObjectValue(['score'], -1, obj);
//   setObjectValue(['scaledScore'], -1, obj);

//   // Send the object to Fb
//   let ref = firebase.firestore().collection('ACT-Student-Tests').doc()
//   ref.set(obj)

//   // Indicate that the test has been assigned
//   .then(() => {
//     // Swap buttons
//     assign.classList.add('hidden')
//     unassign.classList.remove('hidden')

//     // Re-enable the buttons again
//     assign.disabled = false;
//     unassign.disabled = false;

//     // Add the test to the composite page
//     addAssignedTest(test, section)

//     ids.push({
//       'type' : 'homework',
//       'section' : section,
//       'test' : test,
//       'action' : 'assign',
//       'id' : ref.id
//     })

//     colorTestBox(section, test, 'yellow'); // REMOVE

//     numAssignedTests += 1;
//     submitSession()
//   })
  
//   // Indicate that the test wasn't assined successfully
//   .catch((error) => {
//     console.log(error)
//     assign.disabled = false;
//     unassign.disabled = false;
//   })
//   } // REMOVE
//   }) // REMOVE

//   // Open the test to print
//   openTest(test, section)
//   .then(testURL => {
//     const sendHomework = firebase.functions().httpsCallable('daily_log-sendHomework');
//     sendHomework({ testURL, student: CURRENT_STUDENT_UID });
//   })
// }

//this function first checks to see what the next lesson will be an sends that homework
async function assignHomework() {

  // get the section based on the next lesson this student has
  const lessonDoc = await getNextLessonDoc();
  if (!lessonDoc || !lessonDoc.exists) {
    alert('This student does not have any more lessons so no homework!')
    return;
  }

  const section = lessonDoc.data().subtype;

  // Disable the buttons until homework has been assigned
  let assign = document.getElementById('assign')
  let unassign = document.getElementById('unassign')
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
        if (ids.filter(function(val) {return val.test == hwTests[i] && val.section == section}).length == 0) {
          test = hwTests[i]
          break;
        }
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

    // Add the test to the composite page
    addAssignedTest(test, section)

    ids.push({
      'type' : 'homework',
      'section' : section,
      'test' : test,
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
  getTestURL(test, section)
  .then(testURL => {
    const sendHomework = firebase.functions().httpsCallable('daily_log-sendHomework');
    sendHomework({ testURL, student: CURRENT_STUDENT_UID });
  })
}

async function getNextLessonDoc() {
  // find the student in attendees
  const attendeeQuery = await firebase.firestore().collectionGroup('Attendees')
  .where('student', '==', CURRENT_STUDENT_UID)
  .get();

  // get the corresponding events
  const eventDocs = await Promise.all(attendeeQuery.docs.map(doc => doc.ref.parent.parent.get()));

  // sort the events and filter by future events
  const futureEventDocs = eventDocs
  .sort((a,b) => a.data().start - b.data().start)
  .filter(doc => doc.data().start > new Date().getTime())

  return futureEventDocs[0];
}

function openTestList(section) {
  clearTimeout(timeout)
  document.getElementById(section + 'TestList').style.display = 'flex'
}

function closeTestList(section) {
  timeout = setTimeout(function(){
    document.getElementById(section + 'TestList').style.display = 'none'
  }, 50)
}

function initializeEmptyAnswers(test, section) {
  const questions = test_answers_data[test][section + "Answers"]
  let studentQuestions = [];
  for (let i = 0; i < questions.length; i++) {
    studentQuestions.push({
      'isWrong' : null,
      'passageNumber' : questions[i]['passageNumber'],
      'selectedAnswer' : null,
      'isGuess' : null
    })
  }

  return studentQuestions;
}

function initializeEmptyPassageAnswers(test, section, passageNumber) {
  //FIXME: Hack incoming!
  //check if there is a questions key in the test test_answers_data and if there is a selected answer there save this in the passage instead of null

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
      'isWrong' : test_answers_grading?.[test]?.[section]?.['questions']?.[Number(questionNumber) - 1]?.['isWrong'] ?? null,
      'question' : questionNumber,
      'selectedAnswer' : test_answers_grading?.[test]?.[section]?.['questions']?.[Number(questionNumber) - 1]?.['selectedAnswer'] ?? null,
      'isGuess' : test_answers_grading?.[test]?.[section]?.['questions']?.[Number(questionNumber) - 1]?.['isGuess'] ?? null
    })
  }

  return studentQuestions;
}

function unassignHomework(section) {
  // Disable the buttons until homework has been assigned
  let assign = document.getElementById('assign')
  let unassign = document.getElementById('unassign')
  assign.disabled = true;
  unassign.disabled = true;

  /*const testList = student_tests['assignedTests'];
  let test = undefined;
  for (let i = 0; i < testList.length; i++) {
    if (testList[i]['section'] == section) {
      test = testList[i]['test']
    }
  }*/

  // Get the document id to remove
  /*let id = student_tests[section]?.[test]?.['id']
  if (id == undefined) {
    id = ids.filter(function(val) { return val.section == section && val.test == test})[0]['id']

    // Remove the id from the list of document ids
    ids = ids.filter(function(val) { return val.type != 'homework' || val.section != section || val.action != 'assign'})
    }*/
/* MASTER
function swap() {
  let nav = document.getElementById("sideNav");
  nav.classList.toggle("nav_disabled")
  nav.classList.toggle("nav_enabled")
}
MASTER */

  //const tempIds = ids.filter(function(val) { return val.type == 'homework' && val.section == section && val.action == 'assign'})[0]
  //const id = tempIds['id']
  //const test = tempIds['test']

  // Remove the id from the list of document ids
  //ids = ids.filter(function(val) { return val.type != 'homework' || val.section != section || val.action != 'assign'})

  const lookupRef = firebase.firestore().collection('ACT-Student-Tests').where('student', '==', CURRENT_STUDENT_UID).where('status', '==', 'assigned')
  lookupRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const id = doc.id
      const test = doc.data()['test']
      const section = doc.data().section
      // Send the request to Fb to remove the assigned test
      let ref = firebase.firestore().collection('ACT-Student-Tests').doc(id)
      ref.delete()

      // Indicate that the test has been unassigned
      .then(() => {
        // Remove the assigned test from the composite page
        removeAssignedTest(test, section)

        numAssignedTests -= 1;
        submitSession()
      })
  
      // Indicate that the test wasn't unassigned successfully
      .catch((error) => {
        console.log(error)
      })
    })
  })
  .then(() => {
    // Swap which button is being showed
    assign.classList.remove('hidden')
    unassign.classList.add('hidden')

    // Re-enable the buttons again
    assign.disabled = false;
    unassign.disabled = false;
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
        //console.log(timers)
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
  let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Tests/' + path + '.pdf');
  return ref.getDownloadURL().then((url) => {
    open(url);
    return url;
  })
  .catch(error => {
    console.log(error)
    alert('It seems this test does not exist. Verify you are trying to access the right test.')
  })
}

function getTestURL(test, section = undefined) {
  let path = test + (section != undefined ? (" - " + section.charAt(0).toUpperCase() + section.slice(1)) : "");
  let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Tests/' + path + '.pdf');
  return ref.getDownloadURL().then((url) => {
    return url;
  })
  .catch(error => {
    console.log(error)
    alert('It seems this test does not exist. Verify you are trying to access the right test.')
  })
}

function openCramSession(sessionCount) {

  let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Programs/ACT/Cram Sessions/' + sessionCount + ' Session Cram.pdf');
  ref.getDownloadURL().then((url) => {
      open(url);
    })

}

function openLastSession() {

  let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Programs/ACT/Last Session/Last ACT Session.pdf');
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
        let testItem = createElement('div', ['practiceTest', 'cursor'], ['onclick'], [`openTest('${test}', '${sections[i]}')`], test)
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

function setProfilePic() {
  let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Programs/ACT/Images/' + CURRENT_STUDENT_UID)
  ref.getDownloadURL()
  .then((url) => {
    document.getElementById('studentProfilePic').src=url;
  })
  .catch((error) => {
    console.log("No image found")
  })

  // Done allow a tutor to change the picture
  firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (role == 'tutor') {
          document.getElementById('fileLabel').style.display = 'none'
        }
      })
    }
  })
}



function updateProfilePic() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
        .then((idTokenResult) => {
          let role = idTokenResult.claims.role;
          if (role == 'admin' || role == 'dev' || role == 'secretary') {
            const data = document.getElementById('fileInput')
            //document.getElementById('studentProfilePic').style.src = data.files[0]
            let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Programs/ACT/Images/' + CURRENT_STUDENT_UID)
            let thisref = ref.put(data.files[0])
            thisref.on('state_changed', function (snapshot) {


            }, function (error) {
              console.log(error)
            }, function () {
              // Uploaded completed successfully, now we can get the download URL
              thisref.snapshot.ref.getDownloadURL().then(function (downloadURL) {

                // Setting image
                document.getElementById('studentProfilePic').src = downloadURL;
              });
            });
          }
        })
    }
  })
}

function roundedAvg(values) {
  let array = values.filter(element => element);
  if (array.length == 0) {
    return null;
  }

  let total = 0;
  for (let i = 0; i < array.length; i++) {
    total += array[i];
  }
  return Math.round(total / array.length);
}