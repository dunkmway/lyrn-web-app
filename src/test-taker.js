import "./_authorization";
import app from "./_firebase";
import { collection, doc, getDoc, getFirestore, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import Assignment from "./_ACT-Assignment";
import { TUTORIAL_ASSIGNMENTS, TUTORIAL_STEPS, TUTORIAL_STEPS_PHONE } from "./_test-taker-tutorial";

import Dialog from "./_Dialog";
import { requestSignOut } from "./_authorization";

export { showAssignments, assigned_questions };

const auth = getAuth(app);
const db = getFirestore(app);

const STUDENT_UID = location.pathname.split('/')[2];
let student_user_doc = null;

let current_user = null;
let current_user_role = null;

const STAFF_ROLES = ['dev', 'admin', 'tutor'];
let assignment_listener;

let assignments = [];
let assigned_questions = [];

document.addEventListener('DOMContentLoaded', setup);

// on events in the html
window.endTutorial = endTutorial;
window.tutorialBack = tutorialBack;
window.tutorialNext = tutorialNext;
window.signOut = requestSignOut;
window.openFeedback = openFeedback;
window.startTutorial = startTutorial;
window.goToLanding = goToLanding;
window.submitCurrentAssignment = submitCurrentAssignment;
window.toggleSelectorCallback = toggleSelectorCallback;
window.showQuestionMobile = showQuestionMobile;
window.showPassageMobile = showPassageMobile;
window.questionFlagChangeCallback = questionFlagChangeCallback;
window.previousQuestionCallback = previousQuestionCallback;
window.nextQuestionCallback = nextQuestionCallback;
window.selectorNumberToggle = selectorNumberToggle;

HTMLElement.prototype.textNodes = function() {
  return [...this.childNodes].filter((node) => {
    return (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "");
  });
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

async function openFeedback() {
  const dialog = await Dialog.prompt('How can we improve?');
  if (!dialog) return

  // send the feedback
  await setDoc(doc(collection(db, 'Feedback')), {
    message: dialog,
    type: 'Test Taker',
    time: new Date(),
    user: current_user.uid
  })

  Dialog.toastMessage('Thank you for your feedback!');
}

async function startTutorial() {
  // remember that they took the tutorial
  localStorage.setItem("TestTakerTutorial", "started");

  // show the tutorial section
  document.getElementById('tutorial').classList.add('open');

  // remove the transition for the tutorial
  document.querySelector('.main .panels .selector').classList.add('no-transition');

  // show the landing page
  changeSection('landing');

  // stop listening to the assignment listener
  if (assignment_listener) {
    assignment_listener();
    assignment_listener = null;
  }

  // clear the assignment array
  assignments = [];

  // hide all of the assignment
  hideAssignments();

  // add in the tutorial assignments
  // we'll need legit looking assignments in the database to get this working right
  assignments = TUTORIAL_ASSIGNMENTS.map(doc => new Assignment(doc, STAFF_ROLES.includes(current_user_role)));

  // show the tutorial assignments
  showAssignments();

  // start the first step
  tutorialStep(0, window.innerWidth <= 1000);
}

function tutorialNext() {
  const tooltip = document.getElementById('tutorialTooltip');
  const currentStep = parseInt(tooltip.dataset.step);
  tutorialStep(currentStep + 1, window.innerWidth <= 1000);
}

function tutorialBack() {
  const tooltip = document.getElementById('tutorialTooltip');
  const currentStep = parseInt(tooltip.dataset.step);
  tutorialStep(currentStep - 1, window.innerWidth <= 1000);
}

async function tutorialStep(step, phone = false) {
  // should the tutorial end
  if (phone ? step >= TUTORIAL_STEPS_PHONE.length : step >= TUTORIAL_STEPS.length) {
    endTutorial();
    return;
  }

  // show/hide the navigation buttons
  if (step == 0) {
    document.getElementById("tutorialBack").style.visibility = 'hidden';
  } else {
    document.getElementById("tutorialBack").style.visibility = 'visible';
  }

  if (phone ? step == TUTORIAL_STEPS_PHONE.length - 1 : step == TUTORIAL_STEPS.length - 1) {
    document.getElementById("tutorialNext").textContent = 'Finish';
  } else {
    document.getElementById("tutorialNext").textContent = 'Next';
  }

  // get the current step
  const currentStep = phone ? TUTORIAL_STEPS_PHONE[step] : TUTORIAL_STEPS[step];
  const tooltip = document.getElementById('tutorialTooltip');
  const message = document.getElementById('tooltipMessage');

  // if we have a start
  // else if we have a review
  // else nothing
  if (currentStep.assignment && currentStep.assignment.start) {
    const desiredAssignment = assignments.find(assignment => currentStep.assignment.section === assignment.sectionCode);

    // show the assignment and question
    if (!desiredAssignment.isStarted) {
      if (getCurrentAssignment()) {
        getCurrentAssignment().end();
      }
      await desiredAssignment.start(true);
    }
    if (!desiredAssignment.currentQuestion.pos != currentStep.assignment.start - 1) {
      await desiredAssignment.startQuestion(currentStep.assignment.start - 1);
    }
  } else if (currentStep.assignment && currentStep.assignment.review) {
    const desiredAssignment = assignments.find(assignment => currentStep.assignment.section === assignment.sectionCode);

    // show the assignment and question
    if (!desiredAssignment.isInReview) {
      if (getCurrentAssignment()) {
        getCurrentAssignment().end();
      }
      await desiredAssignment.review();
    }
    if (!desiredAssignment.currentQuestion.pos != currentStep.assignment.review - 1) {
      await desiredAssignment.reviewQuestion(currentStep.assignment.review - 1);
    }
  } else {
    goToLanding()
  }

  // if we have an assignment
  if (currentStep.assignment) {
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

    // set the correct choice
    const answerInput = document.getElementById('answerToggleInput');
    if (answerInput) {
      if (currentStep.assignment.correct) {
        answerInput.checked = true;
      } else {
        answerInput.checked = false;
      }
    }

    // set the explanation
    const explanationInput = document.getElementById('questionExplanationInput');
    if (explanationInput) {
      if (currentStep.assignment.explanation) {
        explanationInput.checked = true;
      } else {
        explanationInput.checked = false;
      }
    }
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
      tooltip.style.top = (bounding.top + (bounding.height / 2) - (tooltipBounding.height / 2)).toString() + 'px';
      tooltip.style.left = (bounding.left + (bounding.width / 2) - (tooltipBounding.width / 2)).toString() + 'px';
      break;
    case "top-left":
      tooltip.style.top = (bounding.top - tooltipBounding.height - 10).toString() + 'px';
      tooltip.style.left = (bounding.left - tooltipBounding.width - 10).toString() + 'px';
      break;
    case "top":
      tooltip.style.top = (bounding.top - tooltipBounding.height - 10).toString() + 'px';
      tooltip.style.left = (bounding.left + (bounding.width / 2) - (tooltipBounding.width / 2)).toString() + 'px';
      break;
    case "top-right":
      tooltip.style.top = (bounding.top - tooltipBounding.height - 10).toString() + 'px';
      tooltip.style.left = (bounding.right + 10).toString() + 'px';
      break;
    case "right":
      tooltip.style.top = (bounding.top + (bounding.height / 2) - (tooltipBounding.height / 2)).toString() + 'px';
      tooltip.style.left = (bounding.right + 10).toString() + 'px';
      break;
    case "bottom-right":
      tooltip.style.top = (bounding.bottom + 10).toString() + 'px';
      tooltip.style.left = (bounding.right + 10).toString() + 'px';
      break;
    case "bottom":
      tooltip.style.top = (bounding.bottom + 10).toString() + 'px';
      tooltip.style.left = (bounding.left + (bounding.width / 2) - (tooltipBounding.width / 2)).toString() + 'px';
      break;
    case "bottom-left":
      tooltip.style.top = (bounding.bottom + 10).toString() + 'px';
      tooltip.style.left = (bounding.left - tooltipBounding.width - 10).toString() + 'px';
      break;
    case "left":
      tooltip.style.top = (bounding.top + (bounding.height / 2) - (tooltipBounding.height / 2)).toString() + 'px';
      tooltip.style.left = (bounding.left - tooltipBounding.width - 10).toString() + 'px';
      break;
    default:
      console.warn('tutorial not given location')
    
  }
}

function endTutorial() {
  // show the landing page
  goToLanding();
  
  // hide all of the assignment
  hideAssignments();
  
  // clear the assignment array
  assignments = [];
  
  // start listening to the assignment listener again
  initializeAssignmentsSnapshot(STUDENT_UID);
  
  // hide the tutorial section
  document.getElementById('tutorial').classList.remove('open');

  // add the transition back in
  document.querySelector('.main .panels .selector').classList.remove('no-transition');
}

async function setup() {
  // start listening to the current user
  initializeCurrentUser(() => {
    // check if they have never started the tutorial
    if (localStorage.getItem("TestTakerTutorial") !== 'started') {
      startTutorial();
    } else {
      // start listening for all of the assignments
      initializeAssignmentsSnapshot(STUDENT_UID);
    }
  });



  renderBanner(
    'Need help on some of these tests? Check out our <a href="/pricing?program=one-on-one" target="_blank">ACT Programs.</a>'
  );
}

function initializeCurrentUser(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      current_user = user;
      const idTokenResult = await user.getIdTokenResult();
      current_user_role = idTokenResult.claims.role;

      // welcome
      document.getElementById('welcomeMessage').querySelector('span').textContent = user.displayName.split(' ')[0];
      initializeStudentDoc(STUDENT_UID);

      // if the current user is not a staff member,
      // we will only show them their test taker
      // and send them back to their test taker if unauthorized

      if (!STAFF_ROLES.includes(current_user_role) && current_user.uid != STUDENT_UID) {
        // access denied
        window.location.replace(`${location.origin}/test-taker/${current_user.uid}`);
        return;
      }
    }
    else {
      current_user = null;
      current_user_role = null;
    }

    callback();
  })
}

async function initializeStudentDoc(studentUID) {
  student_user_doc = await getDoc(doc(db, 'Users', studentUID));

  // if we have a tutor viewing the page
  if (STAFF_ROLES.includes(current_user_role)) {
    // if this is not their test taker
    if (studentUID != current_user.uid) {
      document.getElementById('tutorStudentMessage').textContent = `You are viewing ${student_user_doc.data().firstName} ${student_user_doc.data().lastName}'s test taker.`;
    } else {
      document.getElementById('tutorStudentMessage').textContent = `You are viewing your own test taker.`;
    }
  } else {
    document.getElementById('tutorStudentMessage').textContent = 'Welcome to your personal test taker.';
  }
}

function initializeAssignmentsSnapshot(student) {
  const assignmentQuery = query(collection(db, 'ACT-Assignments'), where('student', '==', student))
  assignment_listener = onSnapshot(assignmentQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        // add the new assignment
        const assignment = new Assignment(change.doc, STAFF_ROLES.includes(current_user_role));
        assignments.push(assignment);
      }
      if (change.type === "modified") {
        // find the correct assignment object and update it
        const updatedAssignment = assignments.find(assignment => assignment.id == change.doc.id);
        updatedAssignment.update(change.doc.data());
      }
      if (change.type === "removed") {
        // if the assignment is started, end it
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
    // if (assignment.scaledScoreSection) {
    if (assignment.type === "marketing" || assignment.type === "tutorial") {
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
  startedAssignments.sort((a,b) => (a.startedAt?.toDate().getTime() + (a.time ?? Infinity)) - (b.startedAt?.toDate().getTime() + (b.time ?? Infinity)));
  newAssignments.sort((a,b) => (a.close?.toDate().getTime() ?? 0) - (b.close?.toDate().getTime() ?? 0) || (a.open?.toDate().getTime() ?? 0) - (b.open?.toDate().getTime() ?? 0));
  previousAssignments.sort((a,b) => (b.submittedAt?.toDate().getTime() ?? b.close?.toDate().getTime() ?? 0) - (a.submittedAt?.toDate().getTime() ?? a.close?.toDate().getTime() ?? 0));

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
  document.querySelectorAll('#newAssignments div[class$="-container"]').forEach(container => removeAllChildNodes(container));
  document.querySelectorAll('#previousAssignments div[class$="-container"]').forEach(container => removeAllChildNodes(container));
}


function getCompositeScore(scores) {
  // return the average of the element in the array or null if any value is null
  if (scores.some(score => score === null)) return null;

  const sum = scores.reduce((prev, curr) => prev + curr)
  const num = scores.length;

  return Math.round(sum / num);
}

async function getFullTestObject(assignments) {
  const tests = await Promise.all(assignments.map(async assignment => {
    // get the section document of this assignent
    const sectionDoc = await getDoc(doc(db, 'ACT-Section-Data', assignment.scaledScoreSection));
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
  const nextQuestionIndex = currentQuestion.pos - 1;
  const nextQuestion = currentAssignment.questionObjects.find(question => question.pos === nextQuestionIndex);

  if (currentAssignment.isStarted) {
    currentAssignment.startQuestion(nextQuestion, true);

  } else if (currentAssignment.isInReview) {
    currentAssignment.reviewQuestion(nextQuestion, true);
  }
}

function nextQuestionCallback() {
  const currentAssignment = getCurrentAssignment();
  if (!currentAssignment) return;

  const currentQuestion = currentAssignment.currentQuestion;
  const nextQuestionIndex = currentQuestion.pos + 1;
  const nextQuestion = currentAssignment.questionObjects.find(question => question.pos === nextQuestionIndex);

  if (currentAssignment.isStarted) {
    currentAssignment.startQuestion(nextQuestion, true);

  } else if (currentAssignment.isInReview) {
    currentAssignment.reviewQuestion(nextQuestion, true);
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

async function submitCurrentAssignment() {
  const currentAssignment = getCurrentAssignment();
  if (!currentAssignment) return; 

  const confirmation = await Dialog.confirm('Are you sure you are ready to submit this assignment?');
  if (confirmation) {
    currentAssignment.submit()
  }
}

function getCurrentAssignment() {
  return assignments.find(assignment => assignment.isStarted || assignment.isInReview || assignment.isWatching);
}

function renderBanner(message) {
  const nextLessonWrapper = document.querySelector('.next-lesson-wrapper');
  const nextLessonElement = document.getElementById('nextLessonDetails');

  if (!message) {
    nextLessonWrapper.style.display = 'none';
  } else {
    nextLessonElement.innerHTML = message;
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

function selectorNumberToggle(e) {
  const checked = e.target.checked;
  const currentAssignment = getCurrentAssignment();

  if (checked) {
    currentAssignment.setupNumberedSelector((question) => currentAssignment.reviewQuestion(question));
  } else {
    currentAssignment.setupTopicSelector((question) => currentAssignment.reviewQuestion(question));
  }
}