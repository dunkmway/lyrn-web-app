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
const hwTests  = ['C02', 'A11', '71E', 'A10', 'MC2', 'B05', 'D03', '74C']
const icTests  = ['C03', 'B02', 'A09', 'B04', 'MC3', '74F', 'Z15', '72C']
const othTests = ['67C', 'ST1', '64E', '61C', '59F', '69A', 'ST2', '66F',
                  '61F', '55C', '58E', '71C', '71G', '68G', '68A', '72F',
                  '71H', 'C01', '67A', '63C', '61D', '73E', '73C', '71A',
                  '66C', '65E', '63F', '63D', '72G', '69F', '70G', '65C', '74H']
        
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

function updateGeneralInfoSummary(element) {
  //check if anything changed
  if (!element.classList.contains('changed')) {return}
  removeAllWorkingClasses(element)
  //place the input into a pending state
  element.classList.add('pending');

  //update firebase
  firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
    summary: element.value
  })
  .then(() => {
    removeAllWorkingClasses(element);
    element.classList.add('success');
  })
  .catch((error) => {
    console.log(error)
    removeAllWorkingClasses(element);
    element.classList.add('fail');
  })
}

function setGeneralInfo() {

  firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).get()
  .then((studentProfileDoc) => {
    document.getElementById('studentName').textContent = studentProfileDoc.data()["studentFirstName"] + " " + studentProfileDoc.data()["studentLastName"];
  })

  //set up the grid
  const generalInfoContainer = document.querySelector('#studentGeneralInfoContainer');
  const generalInfoGrid = document.querySelector('#studentGeneralInfoContainer .gridContainer');
  const preTestDivider = document.querySelector('#preTestDivider');
  const goalsDivider = document.querySelector('#goalDivider');
  const postTestDivider = document.querySelector('#postTestDivider');
  let studentActProfileDoc;

  getStudentActProfileDoc(CURRENT_STUDENT_UID)
  .then(profileDoc => {
    studentActProfileDoc = profileDoc;
    document.getElementById('studentGeneralInfoSummary').value = studentActProfileDoc.data().summary ?? "";

    return getLatestTests(CURRENT_STUDENT_UID)
  })
  .then(latestTestDocs => {
    postTestDivider.before(createElement('div', ['gridHeaderItem', 'highlight'], [], [], 'Current Score'));
    postTestDivider.before(createElement('div', ['gridItem', 'highlight'], ['id'], ['compositeCurrent'], ""));
    postTestDivider.before(createElement('div', ['gridItem', 'highlight'], ['id'], ['englishCurrent'], ""));
    postTestDivider.before(createElement('div', ['gridItem', 'highlight'], ['id'], ['mathCurrent'], ""));
    postTestDivider.before(createElement('div', ['gridItem', 'highlight'], ['id'], ['readingCurrent'], ""));
    postTestDivider.before(createElement('div', ['gridItem', 'highlight'], ['id'], ['scienceCurrent'], ""));

    let currentScores = []
    latestTestDocs.forEach(testDoc => {
      let scaledScore = testDoc?.data()?.scaledScore ?? 0;
      let section = testDoc?.data()?.section

      if (section) {
        document.getElementById(section + 'Current').textContent = scaledScore == 0 ? "" : scaledScore?.toString();
      }

      currentScores.push(scaledScore)
    })
    let compositeCurrent = roundedAvg(currentScores);
    document.getElementById('compositeCurrent').textContent = compositeCurrent == 0 ? "" : compositeCurrent?.toString();

    //set up the pre test scores
    preTestScores = studentActProfileDoc.data().preTestScores ?? [];
    if (preTestScores) {
      preTestScores.forEach((score, index) => {
        let highlightedClass = score.isBaseScore ? 'highlight' : null;
        let compositeScore = roundedAvg([score.englishPreTest, score.mathPreTest, score.readingPreTest, score.sciencePreTest]);
        let testDateElement = createElement('input', ['gridHeaderItem', highlightedClass, score.isPracticeTest ? 'practiceTest' : null], ['id'], ['preTestDate-' + index.toString()], "")

        flatpickr(testDateElement, {
          defaultDate: new Date(score.testDate),
          dateFormat: 'M d, Y',
          onChange: ((selectedDates, dateStr, instance) => {
            removeAllWorkingClasses(instance.element);
            instance.element.classList.add('pending');
            //change the test goals array and update on firebase
            preTestScores[parseInt(instance.element.id.split('-')[1])].testDate = selectedDates[0].getTime();
            firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
              preTestScores: preTestScores
            })
            .then(() => {
              removeAllWorkingClasses(instance.element);
              instance.element.classList.add('success');
            })
            .catch((error) => {
              console.log(error)
              removeAllWorkingClasses(instance.element);
              instance.element.classList.add('fail');
            })
          })
        })

        goalsDivider.before(testDateElement);
        goalsDivider.before(createElement('div', ['gridItem', highlightedClass], ['id', 'onclick'], ['compositePreTest-' + index.toString(), `togglePreTestBaseScore(${index})`], compositeScore?.toString() ?? ""));
        goalsDivider.before(createElement('input', ['gridItem', highlightedClass], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['englishPreTest-' + index.toString(), score.englishPreTest?.toString() ?? "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        goalsDivider.before(createElement('input', ['gridItem', highlightedClass], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['mathPreTest-' + index.toString(), score.mathPreTest?.toString() ?? "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        goalsDivider.before(createElement('input', ['gridItem', highlightedClass], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['readingPreTest-' + index.toString(), score.readingPreTest?.toString() ?? "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        goalsDivider.before(createElement('input', ['gridItem', highlightedClass], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['sciencePreTest-' + index.toString(), score.sciencePreTest?.toString() ?? "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
      })
    }

    //set up the test date goals
    testGoals = studentActProfileDoc.data().testGoals ?? [];
    if (testGoals) {
      testGoals.forEach((goal, index) => {
        let compositeGoal = roundedAvg([goal.englishGoal, goal.mathGoal, goal.readingGoal, goal.scienceGoal]);
        let goalDateElement = createElement('input', ['gridHeaderItem'], ['id'], ['goalTestDate-' + index.toString()], "")

        flatpickr(goalDateElement, {
          defaultDate: new Date(goal.testDate),
          dateFormat: 'M d, Y',
          onChange: ((selectedDates, dateStr, instance) => {
            removeAllWorkingClasses(instance.element);
            instance.element.classList.add('pending');
            //change the test goals array and update on firebase
            testGoals[parseInt(instance.element.id.split('-')[1])].testDate = selectedDates[0].getTime();
            firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
              testGoals: testGoals
            })
            .then(() => {
              removeAllWorkingClasses(instance.element);
              instance.element.classList.add('success');
            })
            .catch((error) => {
              console.log(error)
              removeAllWorkingClasses(instance.element);
              instance.element.classList.add('fail');
            })
          })
        })

        postTestDivider.before(goalDateElement);
        postTestDivider.before(createElement('div', ['gridItem'], ['id'], ['compositeGoal-' + index.toString()], compositeGoal?.toString() ?? ""));
        postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['englishGoal-' + index.toString(), goal.englishGoal?.toString() ?? "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['mathGoal-' + index.toString(), goal.mathGoal?.toString() ?? "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['readingGoal-' + index.toString(), goal.readingGoal?.toString() ?? "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['scienceGoal-' + index.toString(), goal.scienceGoal?.toString() ?? "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
      })
    }

    //set up the pre test scores
    postTestScores = studentActProfileDoc.data().postTestScores ?? [];
    if (postTestScores) {
      postTestScores.forEach((score, index) => {
        let compositeScore = roundedAvg([score.englishPostTest, score.mathPostTest, score.readingPostTest, score.sciencePostTest]);
        let testDateElement = createElement('input', ['gridHeaderItem', score.isPracticeTest ? 'practiceTest' : null], ['id'], ['postTestDate-' + index.toString()], "")

        flatpickr(testDateElement, {
          defaultDate: new Date(score.testDate),
          dateFormat: 'M d, Y',
          onChange: ((selectedDates, dateStr, instance) => {
            removeAllWorkingClasses(instance.element);
            instance.element.classList.add('pending');
            //change the test goals array and update on firebase
            postTestScores[parseInt(instance.element.id.split('-')[1])].testDate = selectedDates[0].getTime();
            firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
              postTestScores: postTestScores
            })
            .then(() => {
              removeAllWorkingClasses(instance.element);
              instance.element.classList.add('success');
            })
            .catch((error) => {
              console.log(error)
              removeAllWorkingClasses(instance.element);
              instance.element.classList.add('fail');
            })
          })
        })

        generalInfoGrid.appendChild(testDateElement);
        generalInfoGrid.appendChild(createElement('div', ['gridItem'], ['id'], ['compositePostTest-' + index.toString()], compositeScore?.toString() ?? ""));
        generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['englishPostTest-' + index.toString(), score.englishPostTest?.toString() ?? "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['mathPostTest-' + index.toString(), score.mathPostTest?.toString() ?? "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['readingPostTest-' + index.toString(), score.readingPostTest?.toString() ?? "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
        generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['sciencePostTest-' + index.toString(), score.sciencePostTest?.toString() ?? "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
      })
    }

    //set up the registration link and disable grid input if not allowed
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        user.getIdTokenResult()
        .then((idTokenResult) => {
          let role = idTokenResult.claims.role;
          if (role == 'dev' || role == 'admin' || role == 'secretary' ) {
            // let queryStr = "?student=" + CURRENT_STUDENT_UID;
            // document.getElementById('registrationLink').href = "../../inquiry.html" + queryStr;
          }
          else {
            //disable all of the inputs
            generalInfoContainer.querySelectorAll('input,textarea').forEach(child => {
              child.setAttribute('disabled', 'true');
            })

            //remove the add/remove buttons
            document.querySelectorAll('#studentGeneralInfoContainer .addRemove').forEach(element => {
              element.remove();
            })

          }
        })
      }
    });

    //run through all of the grid items and add in the numeric formating
    document.querySelectorAll('#studentGeneralInfoContainer .gridItem').forEach(element => {
      element.addEventListener('keydown',enforceNumericFormat);
      element.addEventListener('keyup',formatToInt);
    })
  })
}

function addGeneralInfoPreTestRow() {
  customConfirm('What type of test do you want to add?', 'ACT', 'P/T', () => {placePreTestRow(false)}, () => {placePreTestRow(true)});
}

function placePreTestRow(isPracticeTest) {
  const generalInfoGrid = document.querySelector('#studentGeneralInfoContainer .gridContainer');
  const goalDivider = document.querySelector('#goalDivider');
  const numPreTests = generalInfoGrid.querySelectorAll('div[id*="PreTest"]').length;

  let testDateElement = createElement('input', ['gridHeaderItem', isPracticeTest ? 'practiceTest' : null], ['id'], ['preTestDate-' + numPreTests.toString()], "")

  flatpickr(testDateElement, {
    dateFormat: 'M d, Y',
    onChange: ((selectedDates, dateStr, instance) => {
      removeAllWorkingClasses(instance.element);
      instance.element.classList.add('pending');
      //change the test goals array and update on firebase
      preTestScores[parseInt(instance.element.id.split('-')[1])].testDate = selectedDates[0].getTime();
      firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
        preTestScores: preTestScores
      })
      .then(() => {
        removeAllWorkingClasses(instance.element);
        instance.element.classList.add('success');
      })
      .catch((error) => {
        console.log(error)
        removeAllWorkingClasses(instance.element);
        instance.element.classList.add('fail');
      })
    })
  })

  goalDivider.before(testDateElement);
  goalDivider.before(createElement('div', ['gridItem'], ['id', 'onclick'], ['compositePreTest-' + numPreTests.toString(), `togglePreTestBaseScore(${numPreTests})`], ""));
  goalDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['englishPreTest-' + numPreTests.toString(), "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  goalDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['mathPreTest-' + numPreTests.toString(), "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  goalDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['readingPreTest-' + numPreTests.toString(), "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  goalDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['sciencePreTest-' + numPreTests.toString(), "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));

  //run through all of the grid items and add in the numeric formating
  document.querySelectorAll('#studentGeneralInfoContainer .gridItem').forEach(element => {
    element.addEventListener('keydown',enforceNumericFormat);
    element.addEventListener('keyup',formatToInt);
  })

  //add new index to testGoals
  preTestScores.push({});
}

function removeGeneralInfoPreTestRow() {
  //confirm removal
  if (!confirm("Are you sure you want to remove the last Pre-Test?")) {return}

  const generalInfoGrid = document.querySelector('#studentGeneralInfoContainer .gridContainer');
  const goalDivider = document.querySelector('#goalDivider');
  const numPreTests = generalInfoGrid.querySelectorAll('div[id*="PreTest"]').length;

  if(numPreTests > 0) {
    for (let i = 0; i < 6; i++) {
      generalInfoGrid.removeChild(goalDivider.previousElementSibling);
    }

    //pop the last index from testGoals
    preTestScores.pop()

    //update firebase
    firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
      preTestScores: preTestScores
    })
    .catch((error) => {
      console.log(error);
    })
  }
}

function togglePreTestBaseScore(preTestIndex) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (role == 'dev' || role == 'admin' || role == 'secretary' ) {
          //remove the old base score and add the new one in the preTestScores array
          preTestScores.forEach((preTest, index) => {
            if (preTest.isBaseScore) {
              preTestScores[index].isBaseScore = false;
            }
            if (index == preTestIndex) {
              preTestScores[index].isBaseScore = true;
            }
          })

          firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
            preTestScores: preTestScores
          })
          .then(() => {
            //remove all highlighted pre tests
            const generalInfoGrid = document.querySelector('#studentGeneralInfoContainer .gridContainer');
            generalInfoGrid.querySelectorAll(`[id*="PreTest"]`).forEach(element => {
              element.classList.remove('highlight');
            })
            generalInfoGrid.querySelectorAll(`[id*="preTest"]`).forEach(element => {
              element.classList.remove('highlight');
            })

            //add the highlighting to the preTestIndex
            generalInfoGrid.querySelectorAll(`[id$="PreTest-${preTestIndex}"]`).forEach(element => {
              element.classList.add('highlight');
            })

            document.getElementById(`preTestDate-${preTestIndex}`).classList.add('highlight')
          })
          .catch((error) => {
            console.log(error);
          })
        }
      })
    }
  });
  
}

function addGeneralInfoGoalRow() {
  const generalInfoGrid = document.querySelector('#studentGeneralInfoContainer .gridContainer');
  const postTestDivider = document.querySelector('#postTestDivider');
  const numGoals = generalInfoGrid.querySelectorAll('div[id*="Goal"]').length;

  let goalDateElement = createElement('input', ['gridHeaderItem'], ['id'], ['goalTestDate-' + numGoals.toString()], "")

  flatpickr(goalDateElement, {
    dateFormat: 'M d, Y',
    onChange: ((selectedDates, dateStr, instance) => {
      removeAllWorkingClasses(instance.element);
      instance.element.classList.add('pending');
      //change the test goals array and update on firebase
      testGoals[parseInt(instance.element.id.split('-')[1])].testDate = selectedDates[0].getTime();
      firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
        testGoals: testGoals
      })
      .then(() => {
        removeAllWorkingClasses(instance.element);
        instance.element.classList.add('success');
      })
      .catch((error) => {
        console.log(error)
        removeAllWorkingClasses(instance.element);
        instance.element.classList.add('fail');
      })
    })
  })

  postTestDivider.before(goalDateElement);
  postTestDivider.before(createElement('div', ['gridItem'], ['id'], ['compositeGoal-' + numGoals.toString()], ""));
  postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['englishGoal-' + numGoals.toString(), "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['mathGoal-' + numGoals.toString(), "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['readingGoal-' + numGoals.toString(), "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['scienceGoal-' + numGoals.toString(), "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));

  //run through all of the grid items and add in the numeric formating
  document.querySelectorAll('#studentGeneralInfoContainer .gridItem').forEach(element => {
    element.addEventListener('keydown',enforceNumericFormat);
    element.addEventListener('keyup',formatToInt);
  })

  //add new index to testGoals
  testGoals.push({});
}

function removeGeneralInfoGoalRow() {
  //confirm removal
  if (!confirm("Are you sure you want to remove the last Goal?")) {return}

  const generalInfoGrid = document.querySelector('#studentGeneralInfoContainer .gridContainer');
  const postTestDivider = document.querySelector('#postTestDivider');
  const numGoals = generalInfoGrid.querySelectorAll('div[id*="Goal"]').length;

  if(numGoals > 0) {
    for (let i = 0; i < 6; i++) {
      generalInfoGrid.removeChild(postTestDivider.previousElementSibling);
    }

    //pop the last index from testGoals
    testGoals.pop()

    //update firebase
    firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
      testGoals: testGoals
    })
    .catch((error) => {
      console.log(error);
    })
  }
}

function addGeneralInfoPostTestRow() {
  customConfirm('What type of test do you want to add?', 'ACT', 'P/T', () => {placePostTestRow(false)}, () => {placePostTestRow(true)});
}

function placePostTestRow(isPracticeTest) {
  const generalInfoGrid = document.querySelector('#studentGeneralInfoContainer .gridContainer');
  const numPostTests = generalInfoGrid.querySelectorAll('div[id*="PostTest"]').length;

  let testDateElement = createElement('input', ['gridHeaderItem', isPracticeTest ? 'practiceTest' : null], ['id'], ['postTestDate-' + numPostTests.toString()], "")

  flatpickr(testDateElement, {
    dateFormat: 'M d, Y',
    onChange: ((selectedDates, dateStr, instance) => {
      removeAllWorkingClasses(instance.element);
      instance.element.classList.add('pending');
      //change the test goals array and update on firebase
      postTestScores[parseInt(instance.element.id.split('-')[1])].testDate = selectedDates[0].getTime();
      firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
        postTestScores: postTestScores
      })
      .then(() => {
        removeAllWorkingClasses(instance.element);
        instance.element.classList.add('success');
      })
      .catch((error) => {
        console.log(error)
        removeAllWorkingClasses(instance.element);
        instance.element.classList.add('fail');
      })
    })
  })

  generalInfoGrid.appendChild(testDateElement);
  generalInfoGrid.appendChild(createElement('div', ['gridItem'], ['id'], ['compositePostTest-' + numPostTests.toString()], ""));
  generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['englishPostTest-' + numPostTests.toString(), "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['mathPostTest-' + numPostTests.toString(), "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['readingPostTest-' + numPostTests.toString(), "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));
  generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max'], ['sciencePostTest-' + numPostTests.toString(), "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36'], ""));

  //run through all of the grid items and add in the numeric formating
  document.querySelectorAll('#studentGeneralInfoContainer .gridItem').forEach(element => {
    element.addEventListener('keydown',enforceNumericFormat);
    element.addEventListener('keyup',formatToInt);
  })

  //add new index to testGoals
  postTestScores.push({});
}

function removeGeneralInfoPostTestRow() {
  //confirm removal
  if (!confirm("Are you sure you want to remove the last Post-Test?")) {return}

  const generalInfoGrid = document.querySelector('#studentGeneralInfoContainer .gridContainer');
  const numPostTests = generalInfoGrid.querySelectorAll('div[id*="PostTest"]').length;

  if(numPostTests > 0) {
    for (let i = 0; i < 6; i++) {
      generalInfoGrid.removeChild(generalInfoGrid.lastChild);
    }

    //pop the last index from testGoals
    postTestScores.pop()

    //update firebase
    firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
      postTestScores: postTestScores
    })
    .catch((error) => {
      console.log(error);
    })
  }
}

function studentGoalScoreFocusOutCallback(element) {
  //check if anything changed
  if (!element.classList.contains('changed')) {return}
  removeAllWorkingClasses(element)
  //place the input into a pending state
  element.classList.add('pending');

  //update the testGoals object
  testGoals[parseInt(element.id.split('-')[1])][element.id.split('-')[0]] = element.value != "" ? parseInt(element.value) : element.value
  //update firebase
  firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
    testGoals: testGoals
  })
  .then(() => {
    removeAllWorkingClasses(element);
    element.classList.add('success');
  })
  .catch((error) => {
    console.log(error)
    removeAllWorkingClasses(element);
    element.classList.add('fail');
  })

  updateCompositeGoal();
}

function updateCompositeGoal() {
  document.getElementById('studentGeneralInfoSection').querySelectorAll('div[id^="compositeGoal"]').forEach(compositeGoalElement => {
    let index = parseInt(compositeGoalElement.id.split('-')[1]);
    let goals = []
    document.getElementById('studentGeneralInfoSection').querySelectorAll(`input[id$="Goal-${index}"]`).forEach(sectionGoalElement => {
      goals.push(sectionGoalElement.value ? parseInt(sectionGoalElement.value) : null);
    })

    compositeGoalElement.textContent = roundedAvg(goals)?.toString();
  })
}

function studentPreTestScoreFocusOutCallback(element) {
  //check if anything changed
  if (!element.classList.contains('changed')) {return}
  removeAllWorkingClasses(element)
  //place the input into a pending state
  element.classList.add('pending');

  //update the preTest object
  preTestScores[parseInt(element.id.split('-')[1])].isPracticeTest = document.getElementById(`preTestDate-${element.id.split('-')[1]}`).classList.contains('practiceTest');
  preTestScores[parseInt(element.id.split('-')[1])][element.id.split('-')[0]] = element.value != "" ? parseInt(element.value) : element.value
  //update firebase
  firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
    preTestScores: preTestScores
  })
  .then(() => {
    removeAllWorkingClasses(element);
    element.classList.add('success');
  })
  .catch((error) => {
    console.log(error)
    removeAllWorkingClasses(element);
    element.classList.add('fail');
  })

  updateCompositePreTestScores();
}

function updateCompositePreTestScores() {
  document.getElementById('studentGeneralInfoSection').querySelectorAll('div[id^="compositePreTest"]').forEach(compositePreTestElement => {
    let index = parseInt(compositePreTestElement.id.split('-')[1]);
    let scores = []
    document.getElementById('studentGeneralInfoSection').querySelectorAll(`input[id$="PreTest-${index}"]`).forEach(sectionPreTestElement => {
      scores.push(sectionPreTestElement.value ? parseInt(sectionPreTestElement.value) : null);
    })

    compositePreTestElement.textContent = roundedAvg(scores)?.toString();
  })
}

function studentPostTestScoreFocusOutCallback(element) {
  //check if anything changed
  if (!element.classList.contains('changed')) {return}
  removeAllWorkingClasses(element)
  //place the input into a pending state
  element.classList.add('pending');

  //update the preTest object
  postTestScores[parseInt(element.id.split('-')[1])].isPracticeTest = document.getElementById(`postTestDate-${element.id.split('-')[1]}`).classList.contains('practiceTest');
  postTestScores[parseInt(element.id.split('-')[1])][element.id.split('-')[0]] = element.value != "" ? parseInt(element.value) : element.value
  //update firebase
  firebase.firestore().collection('Students').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').update({
    postTestScores: postTestScores
  })
  .then(() => {
    removeAllWorkingClasses(element);
    element.classList.add('success');
  })
  .catch((error) => {
    console.log(error)
    removeAllWorkingClasses(element);
    element.classList.add('fail');
  })

  updateCompositePostTestScores();
}

function updateCompositePostTestScores() {
  document.getElementById('studentGeneralInfoSection').querySelectorAll('div[id^="compositePostTest"]').forEach(compositePostTestElement => {
    let index = parseInt(compositePostTestElement.id.split('-')[1]);
    let scores = []
    document.getElementById('studentGeneralInfoSection').querySelectorAll(`input[id$="PostTest-${index}"]`).forEach(sectionPostTestElement => {
      scores.push(sectionPostTestElement.value ? parseInt(sectionPostTestElement.value) : null);
    })

    compositePostTestElement.textContent = roundedAvg(scores)?.toString();
  })
}

function generalInfoInputCallback(e) {
  removeAllWorkingClasses(e)
  e.classList.add('changed')
}

function removeAllWorkingClasses(e) {
  e.classList.remove('changed');
  e.classList.remove('pending');
  e.classList.remove('success');
  e.classList.remove('fail');
}

function getStudentActProfileDoc(studentUID) {
  return firebase.firestore().collection('Students').doc(studentUID).collection('ACT').doc('profile').get()
}

function getLatestTests(studentUID) {
  const homeworkSections = ['english', 'math', 'reading', 'science'];
  let testDocs = []

  homeworkSections.forEach(section => {
    const sectionQuery = firebase.firestore().collection('ACT-Student-Tests')
    .where('student', '==', studentUID)
    .where('type', '==', 'homework')
    .where('section', '==', section)
    // .where('scaledScore', '!=', -1)
    // .orderBy('scaledScore')
    .orderBy('date', 'desc')
    // .limit(1)

    testDocs.push(sectionQuery.get()
    .then((sectionSnapshot) => {
      if (!sectionSnapshot.empty) {
        for (let i = 0; i < sectionSnapshot.size; i++) {
          if (sectionSnapshot.docs[i].data().scaledScore != -1) {
            return sectionSnapshot.docs[i]
          }
        }
        return null
      }
      else {
        return null
      }
    }));
  })

  return Promise.all(testDocs)
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
      colorTestBox(section, test, 'yellow'); // REMOVE
    }
    else {

      numAssignedTests += 1;
      colorTestBox(section, test, 'yellow'); // REMOVE

      ids.push({
        'type' : 'homework',
        'section' : section,
        'test' : test,
        'action' : 'assign',
        'id' : id
      })

      document.getElementById('assign' + section.charAt(0).toUpperCase() + section.slice(1)).classList.add('hidden')
      document.getElementById('unassign' + section.charAt(0).toUpperCase() + section.slice(1)).classList.remove('hidden')
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
  const tempStatus = test_answers_grading[test]?.[section]?.['status']

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
    document.getElementById('resetHomework').disabled = false;
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

    colorTestBox(section, test, 'green', false); // REMOVE
    colorTestBox(section, test, 'yellow'); // REMOVE
    
    // Lower the homework count by 1
    //if (student_tests[section]?.[test]?.['date'] != undefined) {
    //if (test_answers_grading[test]?.[section]?.['status'] != 'assigned' && test_answers_grading[test]?.[section]?.['status'] != undefined) {
    if ((tempStatus != 'assigned' && tempStatus != undefined) && testDate != undefined && testDate < convertFromDateInt(date.getTime())['startOfDayInt']) {
      homework_count -= 1;
    }
    else {
      // Return the buttons to assigned
      let assign = document.getElementById('assign' + section.charAt(0).toUpperCase() + section.slice(1))
      let unassign = document.getElementById('unassign' + section.charAt(0).toUpperCase() + section.slice(1))
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
    document.getElementById('resetHomework').disabled = false;
    document.getElementById('submitHomework').disabled = false;
  })

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

  // grab the test and section
  const test = current_homework_test;
  const section = current_homework_section;
  const tempStatus = test_answers_grading[test]?.[section]?.['status']

  // Set the status bar as loading
  updateStatusBar(test, section, false, 'loading')

  // Close the popup
  hidePopups()

  // Disable the buttons until it this function has done its job
  document.getElementById('resetHomework').disabled = true;
  document.getElementById('submitHomework').disabled = true;

  // Record the status
  if (status != 'did not do') {
    setObjectValue([test, section, 'status'], status, test_answers_grading)
  }

  // Calculate how many questions they missed and got correct
  let totalMissed = test_answers_grading[test][section]['questions'].filter(function(val) { return val.isWrong == true} ).length;
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
      document.getElementById('resetHomework').disabled = false;
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
      document.getElementById('resetHomework').disabled = false;
      document.getElementById('submitHomework').disabled = false;

      // Update the status bar to mark the test as completed
      updateStatusBar(test, section)

      colorTestBox(section, test, 'yellow', false); // REMOVE
      colorTestBox(section, test, 'green'); // REMOVE

      // up the homework count
      //if (student_tests[section]?.[test]?.['date'] != undefined) {
      let testDate = student_tests[section]?.[test]?.['date'] ?? date.getTime()
      if (['assigned', undefined].includes(tempStatus) && testDate != undefined && testDate < convertFromDateInt(date.getTime())['startOfDayInt']) {
        homework_count += 1;
      }
      //else if (['assigned', undefined].includes(test_answers_grading[test]?.[section]?.['status']) && testDate != undefined && testDate >= convertFromDateInt(date.getTime())['startOfDayInt']) {
      else if (['assigned', undefined].includes(tempStatus) && testDate != undefined && testDate >= convertFromDateInt(date.getTime())['startOfDayInt']) {
        // Swap which button is being showed
        let assign = document.getElementById('assign' + section.charAt(0).toUpperCase() + section.slice(1))
        let unassign = document.getElementById('unassign' + section.charAt(0).toUpperCase() + section.slice(1))
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

function assignHomework(section, assigningTest = undefined) {

  // Disable the buttons until homework has been assigned
  let assign = document.getElementById('assign' + section.charAt(0).toUpperCase() + section.slice(1))
  let unassign = document.getElementById('unassign' + section.charAt(0).toUpperCase() + section.slice(1))
  assign.disabled = true;
  unassign.disabled = true;

  // Initialize the object to send to Fb
  let obj = {}

  // Find the next test
  let test = undefined;
  if (assigningTest == undefined) { // REMOVE
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
  }
  else { // REMOVE
    test = assigningTest
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

    colorTestBox(section, test, 'yellow'); // REMOVE

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

// REMOVE
function colorTestBox(section, test, color = 'green', add = true) {
  const testList = document.getElementById(section + 'TestList').querySelectorAll('button')
  for (let i = 0; i < testList.length; i++) {
    if (testList[i].innerHTML == test) {
      if (add == true) {
        testList[i].classList.add(color)
      }
      else {
        testList[i].classList.remove(color)
      }
    }
  }
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
function openCramSession(sessionCount) {

  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/ACT/Cram Sessions/' + sessionCount + ' Session Cram.pdf');
  ref.getDownloadURL().then((url) => {
      open(url);
    })

}

function openLastSession() {

  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/ACT/Last Session/Last ACT Session.pdf');
  ref.getDownloadURL().then((url) => {
      open(url);
    })

}

function swap() {
  let nav = document.getElementById("sideNav");
  nav.classList.toggle("nav_disabled")
  nav.classList.toggle("nav_enabled")
}
MASTER */

  const tempIds = ids.filter(function(val) { return val.type == 'homework' && val.section == section && val.action == 'assign'})[0]
  const id = tempIds['id']
  const test = tempIds['test']

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

    // Remove the assigned test from the composite page
    removeAssignedTest(test, section)

    colorTestBox(section, test, 'yellow', false); // REMOVE

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
        let testItem = createElement('div', ['practiceTest'], ['onclick'], [`openTest('${test}', '${sections[i]}')`], test)
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
  let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/ACT/Images/' + CURRENT_STUDENT_UID)
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
            let ref = storage.refFromURL('gs://wasatch-tutors-web-app.appspot.com/Programs/ACT/Images/' + CURRENT_STUDENT_UID)
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

/*function transferLessons() {
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
//transferLessons()*/

/*function transferTests() {
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
//transferTests()*/

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

/*let users = []
function chatObject(location = 'Tutors', role = 'tutor') {
  console.log('starting map')
  const ref = firebase.firestore().collection(location)
  let id = undefined;
  let count = 0;
  ref.get()
  .then((querySnapshot) => {
    // For each student
    querySnapshot.forEach((doc) => {
      users.push(
        {
          'id' : doc.id,
          'role' : role,
          'name' : doc.data()[role + 'FirstName'] + ' ' + doc.data()[role + 'LastName']
        }
      )
    })
  })
  .then(() => {
    console.log(users)
  })
}

chatObject('Tutors', 'tutor')
chatObject('Admins', 'firebase')

function getUserDisplayNamePrivate(id) {
  return users.filter(function(val) { return val.id == id})[0]['name']
}

function getUserRolePrivate(id) {
  return users.filter(function(val) { return val.id == id})[0]['role']
}

function createMessage_TEMP(studentUID, type, time, messages) {
    const message = {
        conversation: studentUID + "-" + type,
        timestamp: parseInt(time),
        message: messages[time].note,
        author: messages[time].user,
        authorName: getUserDisplayNamePrivate(messages[time].user),
        authorRole: getUserRolePrivate(messages[time].user)
    }

    const chatRef =  firebase.firestore().collection("Student-Chats").doc();
    return chatRef.set(message)
}

function transferChatMessages() {
    const queryRef = firebase.firestore().collection("Students");
    let allDone = queryRef.get()
    .then((querySnapshot) => {
        let studentPromises = []
        querySnapshot.forEach((doc) => {
            const studentUID = doc.id;
            //get the notes doc for this student
            console.log('Got profile doc for:', doc.id)


            //ACT
            const actNotesRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("notes");
            let actPromise = actNotesRef.get()
            .then((notesDoc) => {
                if (notesDoc.exists) {
                    const notesData = notesDoc.data();
                    const generalNotes = notesData.general;
                    const englishNotes = notesData.english;
                    const mathNotes = notesData.math;
                    const readingNotes = notesData.reading;
                    const scienceNotes = notesData.science;

                    let chatPromises = [];
                    //general notes
                    for (const time in generalNotes) {
                        chatPromises.push(createMessage_TEMP(studentUID, "act-general", time, generalNotes));
                    }

                    //english notes
                    for (const time in englishNotes) {
                        chatPromises.push(createMessage_TEMP(studentUID, "act-english", time, englishNotes));
                    }

                    //math notes
                    for (const time in mathNotes) {
                        chatPromises.push(createMessage_TEMP(studentUID, "act-math", time, mathNotes));
                    }

                    //reading notes
                    for (const time in readingNotes) {
                        chatPromises.push(createMessage_TEMP(studentUID, "act-reading", time, readingNotes));
                    }

                    //science notes
                    for (const time in scienceNotes) {
                        chatPromises.push(createMessage_TEMP(studentUID, "act-science", time, scienceNotes));
                    }

                    return Promise.all(chatPromises)
                }
                else {
                    return Promise.resolve();
                }
            })
            .catch((error) => {
                console.log(error)
            });
            studentPromises.push(actPromise);


            //Subject-Tutoring
            const stNotesRef = firebase.firestore().collection("Students").doc(studentUID).collection("Subject-Tutoring").doc("notes");
            let stPromise = stNotesRef.get()
            .then((notesDoc) => {
                if (notesDoc.exists) {
                    const notesData = notesDoc.data();
                    const notes = notesData.log;

                    let chatPromises = [];
                    //general notes
                    for (const time in notes) {
                        chatPromises.push(createMessage_TEMP(studentUID, "subjectTutoring-general", time, notes));
                    }
                    return Promise.all(chatPromises)
                }
                else {
                    return Promise.resolve();
                }
            })
            .catch((error) => {
                console.log(error)
            });
            studentPromises.push(stPromise);


            //Math-Program
            const mpNotesRef = firebase.firestore().collection("Students").doc(studentUID).collection("Math-Program").doc("notes");
            let mpPromise = mpNotesRef.get()
            .then((notesDoc) => {
                if (notesDoc.exists) {
                    const notesData = notesDoc.data();
                    const notes = notesData.log;

                    let chatPromises = [];
                    //general notes
                    for (const time in notes) {
                        chatPromises.push(createMessage_TEMP(studentUID, "mathProgram-general", time, notes));
                    }
                    return Promise.all(chatPromises)
                }
                else {
                    return Promise.resolve();
                }
            })
            .catch((error) => {
                console.log(error)
            });
            studentPromises.push(mpPromise);


            //Phonics-Program
            const ppNotesRef = firebase.firestore().collection("Students").doc(studentUID).collection("Phonics-Program").doc("notes");
            let ppPromise = ppNotesRef.get()
            .then((notesDoc) => {
                if (notesDoc.exists) {
                    const notesData = notesDoc.data();
                    const notes = notesData.log;

                    let chatPromises = [];
                    //general notes
                    for (const time in notes) {
                        chatPromises.push(createMessage_TEMP(studentUID, "phonicsProgram-general", time, notes));
                    }
                    return Promise.all(chatPromises)
                }
                else {
                    return Promise.resolve();
                }
            })
            .catch((error) => {
                console.log(error)
            });
            studentPromises.push(ppPromise);
        });
        return Promise.all(studentPromises)
    })
    .catch((error) => {
        console.log(error)
    });

    allDone.then(() => {
        console.log("Successfully transferred chat messages!");
    }).catch((error) => {
        console.log(error)
    })
}*/
/*firebase.firestore().collection('Student-Chats').get().then((querySnapshot) => {
  console.log(querySnapshot.size)
})*/
