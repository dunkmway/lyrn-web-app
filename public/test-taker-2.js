const db = firebase.firestore();

const CURRENT_STUDENT_UID = pathParameter(1);
let current_user = null;
let current_user_role = null;
const STAFF_ROLES = ['dev', 'admin', 'tutor'];
let assignment_listener;

let assignments = [];
let assigned_questions = [];

const TUTORIAL_STEPS = [
  {
    message: `
      <h3 style="text-align:center;">Welcome to the Lyrn Test Taker!</h3>
      <p style="text-align:center;">Let's take a look at all of the features.</p>
    `,
    step: 0,
    tooltip: {
      element: "#tutorial",
      location: "center"
    },
    assignment: null
  },
  {
    message: `
      <p>This is an assignment.</p>
      <ul>
        <li>english is the section.</li>
        <li>
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve" style="height:1em;position:relative;top:2px;display:inline;">
          <g>
            <g>
              <path d="M392.09,122.767l15.446-24.272c6.858-10.778,3.681-25.076-7.097-31.935c-10.777-6.86-25.076-3.681-31.935,7.099l-15.409,24.215c-22.708-11.316-47.642-18.798-73.962-21.58V46.265h1.448c12.775,0,23.133-10.357,23.133-23.133S293.356,0,280.581,0h-49.163c-12.775,0-23.133,10.357-23.133,23.133s10.357,23.133,23.133,23.133h1.45v30.029C123.239,87.885,37.535,180.886,37.535,293.535C37.535,413.997,135.538,512,256,512s218.465-98.003,218.465-218.465C474.465,224.487,442.259,162.83,392.09,122.767zM256,465.735c-94.951,0-172.2-77.249-172.2-172.2s77.249-172.2,172.2-172.2s172.2,77.249,172.2,172.2S350.951,465.735,256,465.735z"></path>
            </g>
          </g>
          <g>
            <g>
              <path d="M333.172,205.084c-9.623-8.397-24.238-7.407-32.638,2.222l-61.964,71.02c-8.399,9.626-7.404,24.24,2.222,32.638c9.626,8.399,24.24,7.404,32.638-2.222l61.964-71.02C343.794,228.096,342.798,213.484,333.172,205.084z"></path>
            </g>
          </g>
          </svg>
          <p style="margin:0;display:inline;">45 minutes to complete the test.</p>
        </li>
        <li>
          <svg viewBox="4 4 16 16" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="height:1em;position:relative;top:3px;display:inline;">
            <path d="M9 11h6v2H9z"></path>
            <path d="M17 5H7c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2zM7 17V7h10l.002 10H7z"></path>
          </svg>
          <p style="margin:0;display:inline;">75 questions on the test.</p>
        </li>
      </ul>
    `,
    step: 1,
    tooltip: {
      element: "#fullAssignments .assignment.english-background",
      location: "bottom"
    },
    assignment: null
  },
  {
    message: `
      <p>Another assignment.</p>
      <ul>
        <li>math is the section.</li>
        <li>
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve" style="height:1em;position:relative;top:2px;display:inline;">
          <g>
            <g>
              <path d="M392.09,122.767l15.446-24.272c6.858-10.778,3.681-25.076-7.097-31.935c-10.777-6.86-25.076-3.681-31.935,7.099l-15.409,24.215c-22.708-11.316-47.642-18.798-73.962-21.58V46.265h1.448c12.775,0,23.133-10.357,23.133-23.133S293.356,0,280.581,0h-49.163c-12.775,0-23.133,10.357-23.133,23.133s10.357,23.133,23.133,23.133h1.45v30.029C123.239,87.885,37.535,180.886,37.535,293.535C37.535,413.997,135.538,512,256,512s218.465-98.003,218.465-218.465C474.465,224.487,442.259,162.83,392.09,122.767zM256,465.735c-94.951,0-172.2-77.249-172.2-172.2s77.249-172.2,172.2-172.2s172.2,77.249,172.2,172.2S350.951,465.735,256,465.735z"></path>
            </g>
          </g>
          <g>
            <g>
              <path d="M333.172,205.084c-9.623-8.397-24.238-7.407-32.638,2.222l-61.964,71.02c-8.399,9.626-7.404,24.24,2.222,32.638c9.626,8.399,24.24,7.404,32.638-2.222l61.964-71.02C343.794,228.096,342.798,213.484,333.172,205.084z"></path>
            </g>
          </g>
          </svg>
          <p style="margin:0;display:inline;">--:-- unlimited time to complete.</p>
        </li>
        <li>
          <p style="margin:0;display:inline;">On Sun 12/25/2050 at 09:00 pm this test will auto submit.</p>
        </li>
      </ul>
    `,
    step: 2,
    tooltip: {
      element: "#fullAssignments .assignment.math-background",
      location: "bottom"
    },
    assignment: null
  },
  {
    message: `
      <p>Here is a question.</p>
      <p>Select the best answer choice for each question.</p>
    `,
    step: 3,
    tooltip: {
      element: "#questionChoices",
      location: "left"
    },
    assignment: {
      section: "reading",
      question: 7,
      selector: false,
      choice: 1,
      flag: false
    }
  },
  {
    message: `
      <p>To flag a question, click the circle.</p>
    `,
    step: 4,
    tooltip: {
      element: "label[for='questionFlag']",
      location: "bottom-left"
    },
    assignment: {
      section: "reading",
      question: 7,
      selector: false,
      choice: 1,
      flag: true
    }
  },
  {
    message: `
      <p>To open the question selector, click the tab.</p>
    `,
    step: 5,
    tooltip: {
      element: ".pull-tab",
      location: "right"
    },
    assignment: {
      section: "reading",
      question: 7,
      selector: true,
      choice: 1,
      flag: true
    }
  },
  {
    message: `
      <p>Here you will find an overview of your test</p>
      <ul>
        <li>Current question is highlighted.</li>
        <li>If answered, the circle will be filled in.</li>
        <li>If flagged, the circle will have a flag.</li>
      </ul>
    `,
    step: 6,
    tooltip: {
      element: ".main .panels .selector input[type=radio]:checked + .selector-wrapper",
      location: "right"
    },
    assignment: {
      section: "reading",
      question: 7,
      selector: true,
      choice: 1,
      flag: true
    }
  },
  {
    message: `
      <p>You can submit your test if it is not timed. Otherwise, you will see how much time you have remaining and must wait for it to submit itself.</p>
    `,
    step: 7,
    tooltip: {
      element: "#assignmentSubmit",
      location: "bottom-right"
    },
    assignment: {
      section: "reading",
      question: 7,
      selector: true,
      choice: 1,
      flag: true
    }
  },
]

HTMLElement.prototype.textNodes = function() {
  return [...this.childNodes].filter((node) => {
    return (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "");
  });
}

async function openFeedback() {
  const dialog = await Dialog.prompt('How can we improve?');
  if (!dialog) return

  // send the feedback
  await firebase.firestore()
  .collection('Feedback')
  .doc()
  .set({
    message: dialog,
    type: 'Test Taker',
    time: new Date(),
    user: current_user.uid
  })

  Dialog.toastMessage('Thank you for your feedback!');
}

async function startTutorial() {
  // show the landing page
  changeSection('landing');

  // stop listening to the assignment listener
  assignment_listener();
  assignment_listener = null;

  // clear the assignment array
  assignments = [];

  // hide all of the assignment
  hideAssignments();

  // add in the tutorial assignments
  // we'll need legit looking assignments in the database to get this working right
  try {  
    assignments = (await db
    .collection('ACT-Assignments')
    .where('type', '==', 'tutorial')
    .get())
    .docs.map(doc => new Assignment(doc));
  } catch (error) {
    console.log(error);
  }

  // show the tutorial assignments
  showAssignments();

  // show the tutorial section
  document.getElementById('tutorial').classList.add('open');

  // remove the transition for the tutorial
  document.querySelector('.main .panels .selector').classList.add('no-transition');

  // start the first step
  tutorialStep(0);
}

function tutorialNext() {
  const tooltip = document.getElementById('tutorialTooltip');
  const currentStep = parseInt(tooltip.dataset.step);
  if (currentStep == TUTORIAL_STEPS.length - 1) {
    endTutorial()
  } else {
    tutorialStep(currentStep + 1);
  }
}

function tutorialBack() {
  const tooltip = document.getElementById('tutorialTooltip');
  const currentStep = parseInt(tooltip.dataset.step);
  tutorialStep(currentStep - 1);
}

async function tutorialStep(step) {
  // Welcome
  // show assignment
  // show question
  // show answer
  // show selector
  // show review

  // show/hide the navigation buttons
  if (step == 0) {
    document.getElementById("tutorialBack").style.visibility = 'hidden';
  } else {
    document.getElementById("tutorialBack").style.visibility = 'visible';
  }

  if (step == TUTORIAL_STEPS.length - 1) {
    document.getElementById("tutorialNext").textContent = 'Finish';
  } else {
    document.getElementById("tutorialNext").textContent = 'Next';
  }

  // get the current step
  const currentStep = TUTORIAL_STEPS[step];
  const tooltip = document.getElementById('tutorialTooltip');
  const message = document.getElementById('tooltipMessage');

  if (currentStep.assignment) {
    const desiredAssignment = assignments.find(assignment => currentStep.assignment.section === assignment.sectionCode);

    // show the assignment and question
    if (!desiredAssignment.isStarted) {
      await desiredAssignment.start(true);
    }
    if (!desiredAssignment.currentQuestionIndex != currentStep.assignment.question - 1) {
      await desiredAssignment.startQuestion(currentStep.assignment.question - 1);
    }

    // set the flag
    const flag = document.getElementById('questionFlag');
    flag.checked = currentStep.assignment.flag;

    // set the choice
    if (currentStep.assignment.choice) {
      document.querySelector(`#choice_${currentStep.assignment.choice}`).checked = true;
    } else {
      document.querySelector(`#choice_${currentStep.assignment.choice}`).checked = false;
    }

    // set the selector
    const selectorCircle = document.querySelector('.main .panels .selector input[type=radio]:checked + .selector-wrapper > span');
    currentStep.assignment.flag ? selectorCircle.classList.add('flagged') : selectorCircle.classList.remove('flagged');
    currentStep.assignment.choice ? selectorCircle.classList.add('answered') : selectorCircle.classList.remove('answered');
    
    const selector = document.querySelector('.main .panels .selector');
    currentStep.assignment.selector ? selector.classList.add('open') : selector.classList.remove('open');
  }

  // set the message
  message.innerHTML = currentStep.message;

  // place the tooltip
  placeTutorialTooltip(tooltip, currentStep.tooltip);

  // give the tooltip the step
  tooltip.setAttribute('data-step', step.toString());
}

function placeTutorialTooltip(tooltip, placement) {
  const element = document.querySelector(placement.element);
  const bounding = element.getBoundingClientRect();
  const tooltipBounding = tooltip.getBoundingClientRect();
  
  switch (placement.location) {
    case "center":
      tooltip.style.top = bounding.top + (bounding.height / 2) - (tooltipBounding.height / 2);
      tooltip.style.left = bounding.left + (bounding.width / 2) - (tooltipBounding.width / 2);
      break;
    case "top-left":
      tooltip.style.top = bounding.top - tooltipBounding.height - 10;
      tooltip.style.left = bounding.left - tooltipBounding.width - 10;
      break;
    case "top":
      tooltip.style.top = bounding.top - tooltipBounding.height - 10;
      tooltip.style.left = bounding.left + (bounding.width / 2) - (tooltipBounding.width / 2);
      break;
    case "top-right":
      tooltip.style.top = bounding.top - tooltipBounding.height - 10;
      tooltip.style.left = bounding.right + 10;
      break;
    case "right":
      tooltip.style.top = bounding.top + (bounding.height / 2) - (tooltipBounding.height / 2);
      tooltip.style.left = bounding.right + 10;
      break;
    case "bottom-right":
      tooltip.style.top = bounding.bottom + 10;
      tooltip.style.left = bounding.right + 10;
      break;
    case "bottom":
      tooltip.style.top = bounding.bottom + 10;
      tooltip.style.left = bounding.left + (bounding.width / 2) - (tooltipBounding.width / 2);
      break;
    case "bottom-left":
      tooltip.style.top = bounding.bottom + 10;
      tooltip.style.left = bounding.left - tooltipBounding.width - 10;
      break;
    case "left":
      tooltip.style.top = bounding.top + (bounding.height / 2) - (tooltipBounding.height / 2);
      tooltip.style.left = bounding.left - tooltipBounding.width - 10;
      break;
    
  }
}

function endTutorial() {
  // hide the tutorial section
  document.getElementById('tutorial').classList.remove('open');

  // add the transition back in
  document.querySelector('.main .panels .selector').classList.remove('no-transition');

  // show the landing page
  goToLanding();

  // hide all of the assignment
  hideAssignments();

  // clear the assignment array
  assignments = [];

  // start listening to the assignment listener again
  initializeAssignmentsSnapshot(CURRENT_STUDENT_UID);
}

/**
 * This will cause MathJax to look for unprocessed mathematics on the page and typeset it
 */
async function resetMathJax() {
  try {
    await MathJax.typesetPromise();
    document.querySelectorAll('.MathJax').forEach((math) => {
      math.removeAttribute('tabindex');

      // we need to insert and invisble character if there aren't any text node siblings with the MathJax
      // equations don't appear on the same line if they are alone in a parent without text to align them
      // thus we will add an invisible character so that MathJax knows how to align the equation
      if (math.parentElement) {
        if (math.parentElement.textNodes().length === 0) {
          const text = document.createTextNode(' '); // we are using unicode char U+2009 (thin space) which is invisble
          math.parentElement.appendChild(text);
        }
      }
    })

  } catch (error) {
    console.log(error);
  }
}


function setup() {
  // start listening for all of the assignments
  initializeAssignmentsSnapshot(CURRENT_STUDENT_UID);

  // start listening to the current user
  initializeCurrentUser();

  // get the next lesson
  getNextLesson(CURRENT_STUDENT_UID);
}

function initializeCurrentUser() {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      current_user = user;
      const idTokenResult = await user.getIdTokenResult();
      current_user_role = idTokenResult.claims.role;

      // if the current user is not a staff member,
      // we will only show them their test taker
      // and send them back to their test taker if unauthorized

      if (!STAFF_ROLES.includes(current_user_role) && current_user.uid != CURRENT_STUDENT_UID) {
        // access denied
        window.location.replace(`${tooltip.origin}/test-taker/${current_user.uid}`);
        return;
      }
    }
    else {
      current_user = null;
      current_user_role = null;
    }
  })
}

function initializeAssignmentsSnapshot(student) {
  assignment_listener = db.collection('ACT-Assignments')
  .where('student', '==', student)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        // add the new assignment
        const assignment = new Assignment(change.doc);
        assignments.push(assignment);
      }
      if (change.type === "modified") {
        // find the correct assignment object and update it
        const updatedAssignment = assignments.find(assignment => assignment.id == change.doc.id);
        updatedAssignment.update(change.doc.data());
      }
      if (change.type === "removed") {
        // if the assignment is started end it
        const index = assignments.findIndex(assignment => assignment.id === change.doc.id);
        if (assignments[index].isStarted) {
          assignments[index].end();
        }
        // stop the timers
        assignments[index].resetTimers();
        // remove the assignment
        assignments[index].wrapper.remove()
        assignments.splice(index, 1);
      }
    });
    showAssignments();
    assigned_questions = getAssignedQuestions();
  })
}

function getAssignedQuestions() {
  let newList = [];
  for (const assignment of assignments) {
    newList = newList.concat(assignment.questions);
  }

  return newList;
}

function showAssignments() {
  // filter out the assignment array into started, new, and previous lists
  let fullAssignments = [];
  let startedAssignments = [];
  let newAssignments = [];
  let previousAssignments = [];

  for (const assignment of assignments) {
    if (assignment.scaledScoreSection) {
      fullAssignments.push(assignment)
      continue
    }
    if (assignment.status === 'started') {
      startedAssignments.push(assignment);
      continue
    }
    if (assignment.status === 'new') {
      newAssignments.push(assignment);
      continue
    }
    if (assignment.status === 'submitted' || assignment.status === 'graded' || assignment.status === 'omitted') {
      previousAssignments.push(assignment);
      continue
    }
  }

  // sort each appropriately 
  startedAssignments.sort((a,b) => (a.startedAt.toDate().getTime() + (a.time ?? Infinity)) - (b.startedAt.toDate().getTime() + (b.time ?? Infinity)));
  newAssignments.sort((a,b) => (a.close?.toDate().getTime() ?? 0) - (b.close?.toDate().getTime() ?? 0) || (a.open?.toDate().getTime() ?? 0) - (b.open?.toDate().getTime() ?? 0));
  previousAssignments.sort((a,b) => (b.submittedAt?.toDate().getTime() ?? b.close.toDate().getTime()) - (a.submittedAt?.toDate().getTime() ?? a.close.toDate().getTime()));

  // show the assignments
  for (const assignment of startedAssignments) {
    assignment.show(document.querySelector(`#newAssignments .${assignment.sectionCode}-container`));
  }
  for (const assignment of newAssignments) {
    assignment.show(document.querySelector(`#newAssignments .${assignment.sectionCode}-container`));
  }
  for (const assignment of previousAssignments) {
    assignment.show(document.querySelector(`#previousAssignments .${assignment.sectionCode}-container`));
  }

  // // remove the no assignments
  // const noCurrent = document.getElementById('noCurrentAssignments');
  // if (startedAssignments.length + newAssignments.length === 0) {
  //   noCurrent.classList.remove('hide');
  // }
  // else {
  //   noCurrent.classList.add('hide');
  // }

  // const noPrevious = document.getElementById('noPreviousAssignments');
  // if (previousAssignments.length === 0) {
  //   noPrevious.classList.remove('hide');
  // }
  // else {
  //   noPrevious.classList.add('hide');
  // }

  // full tests need to combine into tests which needs to happen asynchronously
  // get the sections into this form
  /*
    {
      testID: [assignment, assignment, ..., assignment],
      ...
    }
  */
  getFullTestObject(fullAssignments)
  .then(tests => {
    // create a wrapper for each test and show the composite score in this wrapper
    removeAllChildNodes(document.getElementById('fullAssignments'));
    for (const test in tests) {
      const testWrapper = document.createElement('div');
      testWrapper.className = 'full-test-wrapper';

      const heading = document.createElement('h3');
      testWrapper.appendChild(heading);

      const content = document.createElement('div');
      content.className = 'full-test-content';
      testWrapper.appendChild(content);

      let scaledScores = [];
      for (const assignment of tests[test]) {
        assignment.show(content)
        scaledScores.push(assignment.scaledScore ?? null)
      }

      let compositeScore = getCompositeScore(scaledScores) ?? 'N/A';
      heading.textContent = `Composite Score: ${compositeScore}`
      document.getElementById('fullAssignments').appendChild(testWrapper)
    }
  })
}

function hideAssignments() {
  removeAllChildNodes(document.getElementById('fullAssignments'));
  document.querySelectorAll('#newAssignments > div').forEach(container => removeAllChildNodes(container));
  document.querySelectorAll('#previousAssignments > div').forEach(container => removeAllChildNodes(container));
}


function getCompositeScore(scores) {
  // return the average of the element in the array or null if any value is null
  if (scores.some(score => score === null)) return null;

  const sum = scores.reduce((prev, curr) => prev + curr)
  const num = scores.length;

  return Math.round(sum / num);
}

async function getFullTestObject(assignments) {
  const tests = await Promise.all(assignments.map(async assignmment => {
    // get the section document of this assignent
    const sectionDoc = await db.collection('ACT-Section-Data').doc(assignmment.scaledScoreSection).get();
    const testID = sectionDoc.data().test;
    return testID
  }))

  let testsObject = {}
  for (let index = 0; index < assignments.length; index++) {
    // there isn't an array for this test yet create one
    if (!testsObject[tests[index]]) testsObject[tests[index]] = [];
    // append the assignment to this array
    testsObject[tests[index]].push(assignments[index])
  }

  // sort the sections by section code before returning
  for (const test in testsObject) {
    testsObject[test].sort((a, b) => sortAlphabetically(a.sectionCode, b.sectionCode))
  }

  return testsObject;
}

function questionFlagChangeCallback(event) {
  const currentAssignment = getCurrentAssignment();
  if (!currentAssignment) return; 
  const currentQuestion = currentAssignment.currentQuestion;
  currentQuestion.flagToggled(event.target.checked);
}

function previousQuestionCallback() {
  const currentAssignment = getCurrentAssignment();
  if (!currentAssignment) return;

  const currentQuestion = currentAssignment.currentQuestion;

  if (currentAssignment.isStarted) {
    const nextQuestionIndex = currentQuestion.pos - 1;
    currentAssignment.startQuestion(nextQuestionIndex);

  } else if (currentAssignment.isInReview) {
    const flatSortedQuestionList = currentAssignment.sortedQuestionsByTopic.reduce((prev, curr) => {
      prev = prev.concat(curr.questions);
      return prev
    }, []);
    const currentQuestionIndex = flatSortedQuestionList.findIndex(question => question.id === currentQuestion.id);
    const nextQuestionIndex = currentQuestionIndex - 1;
    currentAssignment.reviewQuestion(nextQuestionIndex);
  }
}

function nextQuestionCallback() {
  const currentAssignment = getCurrentAssignment();
  if (!currentAssignment) return;

  const currentQuestion = currentAssignment.currentQuestion;

  if (currentAssignment.isStarted) {
    const nextQuestionIndex = currentQuestion.pos + 1;
    currentAssignment.startQuestion(nextQuestionIndex);

  } else if (currentAssignment.isInReview) {
    const flatSortedQuestionList = currentAssignment.sortedQuestionsByTopic.reduce((prev, curr) => {
      prev = prev.concat(curr.questions);
      return prev
    }, []);
    const currentQuestionIndex = flatSortedQuestionList.findIndex(question => question.id === currentQuestion.id);
    const nextQuestionIndex = currentQuestionIndex + 1;
    currentAssignment.reviewQuestion(nextQuestionIndex);
  }
}

function goToLanding() {
  const currentAssignment = getCurrentAssignment();
  if (currentAssignment) {
    currentAssignment.end()
  }
}

function toggleSelectorCallback() {
  document.querySelector('.main .panels .selector').classList.toggle('open')
}

function changeSection(sectionID) {
  // hide all sections
  document.querySelectorAll('section').forEach(section => section.classList.add('hide'));
  
  // show the section
  document.getElementById(sectionID).classList.remove('hide');
}

/**
 * change the css variable --accent-color to the variable --${sectionName}-color
 * @param {String} sectionName name of section
 */
 function changeAccentColor(sectionName) {
  document.querySelector(':root').style.setProperty('--accent-color', `var(--${sectionName}-color)`)
  document.querySelector(':root').style.setProperty('--accent-color-light', `var(--${sectionName}-color-light)`)
}

/**
 * change the css variable --passage-columns to the variable --${sectionName}-passage-columns
 * @param {String} sectionName name of section
 */
function changePassageColumns(sectionName) {
  document.querySelector(':root').style.setProperty('--passage-columns', `var(--${sectionName}-passage-columns)`)
}

function submitCurrentAssignment() {
  const currentAssignment = getCurrentAssignment();
  if (!currentAssignment) return; 

  customConfirm(
    'Are you sure you are ready to submit this assignment?',
    'NO',
    'YES',
    () => {},
    () => { currentAssignment.submit() }
  );
}

function getCurrentAssignment() {
  return assignments.find(assignment => assignment.isStarted || assignment.isInReview);
}

function renderNextLessonDetails(lessonData) {
  const nextLessonWrapper = document.querySelector('.next-lesson-wrapper');
  const nextLessonElement = document.getElementById('nextLessonDetails');

  if (!lessonData) {
    nextLessonElement.innerHTML = 'Need help on some of these questions? Check out our <a href="/pricing?program=one-on-one" target="_blank">ACT Programs.</a>';
    return;
  }

  nextLessonWrapper.style.backgroundColor = `var(--${lessonData.subtype}-color)`;
  nextLessonElement.textContent = `Your next lesson is ${lessonData.subtype.toUpperCase()} - ${new Time(lessonData.start).toFormat('{EEEE}, {MMMM} {ddd}, {yyyy} at {hh}:{mm} {a}')}`;
}

async function getNextLesson(studentUID) {
  // get all attendee docs this student is attending
  let attendeeQuery = await firebase.firestore()
  .collectionGroup('Attendees')
  .where('student', '==', studentUID)
  .get();

  // get all of the event docs connected to these attendee docs
  const eventDocs = await Promise.all(attendeeQuery.docs.map(doc => doc.ref.parent.parent.get()));
  
  // filter out oast lessons
  const futureEvents = eventDocs
  .filter(doc => doc.data().start > new Date().getTime())
  .sort((a,b) => a.data().start - b.data().start);

  // get the next lesson
  const nextLesson = futureEvents[0];

  // render the lesson
  renderNextLessonDetails(nextLesson?.data());

  if (nextLesson) {
    // set a timer to re-run this function when the next lesson starts
    const lessonTimer = new Timer(
      new Date(nextLesson.data().start),
      () => {
        getNextLesson(studentUID);
        lessonTimer.cleanUp();
      }
    )
  }
}

// show question button clicked on mobile device
function showQuestionMobile() {
  // give passage panel class of mobile-hide
  document.querySelector('.main .panels .passage').classList.add('mobile-hide');

  // remove question panel class of mobile-hide
  document.querySelector('.main .panels .question').classList.remove('mobile-hide');

}

// show passage button clicked on mobile device
function showPassageMobile() {
  // give question panel class of mobile-hide
  document.querySelector('.main .panels .question').classList.add('mobile-hide');

  // remove passage panel class of mobile-hide
  document.querySelector('.main .panels .passage').classList.remove('mobile-hide');

}

function sortAlphabetically(a,b) {
	a = a.toString();
	b = b.toString();

	if (a < b) {
		return -1;
	}
	if (a == b) {
		return 0;
	}
	if (a > b) {
		return 1
	}
}