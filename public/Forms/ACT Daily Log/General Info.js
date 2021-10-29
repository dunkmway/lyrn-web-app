function updateGeneralInfoSummary(element) {
  //check if anything changed
  if (!element.classList.contains('changed')) {return}
  removeAllWorkingClasses(element)
  //place the input into a pending state
  element.classList.add('pending');

  //update firebase
  firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
    summary: element.value
  }, {merge: true})
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

  firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).get()
  .then((studentProfileDoc) => {
    document.getElementById('studentName').textContent = studentProfileDoc.data()["firstName"] + " " + studentProfileDoc.data()["lastName"];
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
    document.getElementById('studentGeneralInfoSummary').value = studentActProfileDoc?.data()?.summary ?? "";

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
    preTestScores = studentActProfileDoc?.data()?.preTestScores ?? [];
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
            firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
              preTestScores: preTestScores
            }, {merge: true})
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
        goalsDivider.before(createElement('input', ['gridItem', highlightedClass], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['englishPreTest-' + index.toString(), score.englishPreTest?.toString() ?? "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        goalsDivider.before(createElement('input', ['gridItem', highlightedClass], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['mathPreTest-' + index.toString(), score.mathPreTest?.toString() ?? "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        goalsDivider.before(createElement('input', ['gridItem', highlightedClass], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['readingPreTest-' + index.toString(), score.readingPreTest?.toString() ?? "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        goalsDivider.before(createElement('input', ['gridItem', highlightedClass], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['sciencePreTest-' + index.toString(), score.sciencePreTest?.toString() ?? "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
      })
    }

    //set up the test date goals
    testGoals = studentActProfileDoc?.data()?.testGoals ?? [];
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
            firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
              testGoals: testGoals
            }, {merge: true})
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
        postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['englishGoal-' + index.toString(), goal.englishGoal?.toString() ?? "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['mathGoal-' + index.toString(), goal.mathGoal?.toString() ?? "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['readingGoal-' + index.toString(), goal.readingGoal?.toString() ?? "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['scienceGoal-' + index.toString(), goal.scienceGoal?.toString() ?? "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
      })
    }

    //set up the pre test scores
    postTestScores = studentActProfileDoc?.data()?.postTestScores ?? [];
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
            firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
              postTestScores: postTestScores
            }, {merge: true})
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
        generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['englishPostTest-' + index.toString(), score.englishPostTest?.toString() ?? "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['mathPostTest-' + index.toString(), score.mathPostTest?.toString() ?? "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['readingPostTest-' + index.toString(), score.readingPostTest?.toString() ?? "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
        generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['sciencePostTest-' + index.toString(), score.sciencePostTest?.toString() ?? "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
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
      firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
        preTestScores: preTestScores
      }, {merge: true})
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
  goalDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['englishPreTest-' + numPreTests.toString(), "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  goalDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['mathPreTest-' + numPreTests.toString(), "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  goalDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['readingPreTest-' + numPreTests.toString(), "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  goalDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['sciencePreTest-' + numPreTests.toString(), "", "studentPreTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));

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
    firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
      preTestScores: preTestScores
    }, {merge: true})
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

          firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
            preTestScores: preTestScores
          }, {merge: true})
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
      firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
        testGoals: testGoals
      }, {merge: true})
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
  postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['englishGoal-' + numGoals.toString(), "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['mathGoal-' + numGoals.toString(), "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['readingGoal-' + numGoals.toString(), "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  postTestDivider.before(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['scienceGoal-' + numGoals.toString(), "", "studentGoalScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));

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
    firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
      testGoals: testGoals
    }, {merge: true})
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
      firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
        postTestScores: postTestScores
      }, {merge: true})
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
  generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['englishPostTest-' + numPostTests.toString(), "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['mathPostTest-' + numPostTests.toString(), "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['readingPostTest-' + numPostTests.toString(), "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));
  generalInfoGrid.appendChild(createElement('input', ['gridItem'], ['id', 'value', 'onfocusout', 'oninput', 'min', 'max', 'autocomplete'], ['sciencePostTest-' + numPostTests.toString(), "", "studentPostTestScoreFocusOutCallback(this)", 'generalInfoInputCallback(this)', '0', '36', 'off'], ""));

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
    firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
      postTestScores: postTestScores
    }, {merge: true})
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
  firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
    testGoals: testGoals
  }, {merge: true})
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
  firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
    preTestScores: preTestScores
  }, {merge: true})
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
  firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc('profile').set({
    postTestScores: postTestScores
  }, {merge: true})
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
  return firebase.firestore().collection('Users').doc(studentUID).collection('ACT').doc('profile').get()
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