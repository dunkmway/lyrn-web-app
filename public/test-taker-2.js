const db = firebase.firestore();

const CURRENT_STUDENT_UID = pathParameter(1);
let current_user = null;
let current_user_role = null;
const STAFF_ROLES = ['dev', 'admin', 'tutor'];
let assignment_listener;

let assignments = [];
let assigned_questions = [];

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

function openTutorial() {
  document.getElementById('tutorial').classList.add('open');
}

function closeTutorial(e) {
  if (e.target !== e.currentTarget) return;
  document.getElementById('tutorial').classList.remove('open');
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
  let startedAssignments = [];
  let newAssignments = [];
  let previousAssignments = [];

  for (const assignment of assignments) {
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
    assignment.show();
  }
  for (const assignment of newAssignments) {
    assignment.show();
  }
  for (const assignment of previousAssignments) {
    assignment.show();
  }

  // remove the no assignments
  const noCurrent = document.getElementById('noCurrentAssignments');
  if (startedAssignments.length + newAssignments.length === 0) {
    noCurrent.classList.remove('hide');
  }
  else {
    noCurrent.classList.add('hide');
  }

  const noPrevious = document.getElementById('noPreviousAssignments');
  if (previousAssignments.length === 0) {
    noPrevious.classList.remove('hide');
  }
  else {
    noPrevious.classList.add('hide');
  }
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
    document.getElementById('answerToggleInput').checked = false;
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
    document.getElementById('answerToggleInput').checked = false;
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
    nextLessonElement.innerHTML = 'Need to increase you ACT score? Check out our <a href="/pricing?program=one-on-one" target="_blank">ACT programs.</a>'
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