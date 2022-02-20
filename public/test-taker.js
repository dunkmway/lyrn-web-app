// I do this here so that I don't have analytics
const firebaseConfig = {
  apiKey: "AIzaSyD8GSMZzjbubQ7AGcQKIV-enpDYpz_07mo",
  authDomain: "lyrn-web-app.firebaseapp.com",
  projectId: "lyrn-web-app",
  storageBucket: "lyrn-web-app.appspot.com",
  messagingSenderId: "80732012862",
  appId: "1:80732012862:web:22ffb978c80a1d2a0f2c6f",
  measurementId: "G-F2QZT3W2CX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const FLAG_SVG = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
<g id="XMLID_1_">
<path id="XMLID_4_" class="flag" d="M378.3,35.7c0,0-84.9,40.9-170.6,11C114.9,14.5,73.2,27,33.1,75.8c-7.1-3.9-15.7-3.9-22.8,0
 C0.1,82.1-3.1,96.2,3.2,106.5l225.7,366.4c3.9,7.1,11.8,10.2,18.9,10.2c3.9,0,7.9-0.8,11.8-3.1c10.2-6.3,13.4-20.4,7.1-30.7
 l-99.1-162c39.3-48,81.8-61.3,173.8-29.1c84.9,29.9,170.6-11,170.6-11L378.3,35.7z"/>
</g>
</svg>`

const ODD_ANSWERS = ['A', 'B', 'C', 'D', 'E'];
const EVEN_ANSWERS = ['F', 'G', 'H', 'J', 'K'];
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const QUESTION_COUNT = {
  english: 75,
  math: 60,
  reading: 40,
  science: 40
}
const MODE_VIEWS = {
  default: 'landing',
  section: 'main',
  worksheet: 'main',
  daily: 'main'
}


let current_data = {
  mode: 'default',
  test: null,
  section: null,
  passage: null,
  question: null
}




async function testing() {
  // changeMode('section')
  // try {
  //   await setSection('D03', 'math')
  // }
  // catch(error) {
  //   console.log(error)
  // }


  changeMode('default');
  try {
    await setLandingPage('uwrnhMAL2ibBjgS0KppI');
  }
  catch (error) {
    console.log(error)
  }
}

testing();



/**
 * change the css variable --accent-color to the variable --${sectionName}-color
 * @param {String} sectionName name of section
 */
function changeAccentColor(sectionName) {
  document.querySelector(':root').style.setProperty('--accent-color', `var(--${sectionName}-color)`)
}

/**
 * change the css variable --passage-columns to the variable --${sectionName}-passage-columns
 * @param {String} sectionName name of section
 */
function changePassageColumns(sectionName) {
  document.querySelector(':root').style.setProperty('--passage-columns', `var(--${sectionName}-passage-columns)`)
}

function changeMode(mode) {
  // hide the previous view
  document.querySelector(`section.${MODE_VIEWS[current_data.mode]}`).classList.add('hide')
  //show the corresponding view
  document.querySelector(`section.${MODE_VIEWS[mode]}`).classList.remove('hide')
}


/*
* Landing Page
*/

function renderStudentDetails(studentData) {
  const studentNameElement = document.getElementById('studentName');
  studentNameElement.textContent = studentData.firstName + ' ' + studentData.lastName;
}

function renderNextLessonDetails(lessonData) {
  const nextLessonWrapper = document.querySelector('.next-lesson-wrapper');
  const nextLessonElement = document.getElementById('nextLessonDetails');

  if (!lessonData) {
    nextLessonElement.textContent = 'No upcoming lesson'
    return;
  }

  nextLessonWrapper.style.backgroundColor = `var(--${lessonData.subtype}-color)`;
  nextLessonElement.textContent = `${lessonData.subtype.toUpperCase()} - ${convertFromDateInt(lessonData.start).longReadable}`;
}

function renderSectionAssignment(assignmentData) {
  const sectionAssignmentList = document.getElementById('sectionAssignmentList');

  const assignmentElement = document.createElement('div');
  assignmentElement.classList.add('assignment', 'box');
  assignmentElement.addEventListener('click', () => sectionAssignmentClickCallback(assignmentData))
  if (assignmentData) {
    assignmentElement.style.backgroundColor = `var(--${assignmentData.section}-color)`
    assignmentElement.innerHTML = `
      <h4>${assignmentData.section.toUpperCase()}</h4>
      <div class="status">${assignmentData.status}</div>
    `
  }
  else {
    assignmentElement.style.backgroundColor = `var(--default-color)`
    assignmentElement.innerHTML = `
      <h4>Hooray, no homework!</h4>
    `
  }

  sectionAssignmentList.appendChild(assignmentElement);
}

function renderDailyAssignment(assignmentData) {
  const dailyAssignmentList = document.getElementById('dailyAssignmentList');

  const assignmentElement = document.createElement('div');
  assignmentElement.classList.add('assignment', 'box');
  assignmentElement.addEventListener('click', () => dailyAssignmentClickCallback(assignmentData))
  if (assignmentData) {
    assignmentElement.style.backgroundColor = `var(--${assignmentData.section}-color)`
    assignmentElement.innerHTML = `
      <h4>${assignmentData.section.toUpperCase()}</h4>
      <div class="status">${assignmentData.status}</div>
    `
  }
  else {
    assignmentElement.style.backgroundColor = `var(--default-color)`
    assignmentElement.innerHTML = `
      <h4>Hooray, no daily!</h4>
    `
  }

  dailyAssignmentList.appendChild(assignmentElement);
}

function sectionAssignmentClickCallback(assignmentData) {
  console.log(assignmentData)
}

function dailyAssignmentClickCallback(assignmentData) {
  console.log(assignmentData)
}

async function getStudentDoc(studentUID) {
  const studentDoc = await firebase.firestore().collection('Users').doc(studentUID).get();

  return studentDoc;
}

async function getNextLesson(studentUID) {
  const eventQuery = await firebase.firestore().collection('Events')
  .where('student', '==', studentUID)
  .where('type', '==', 'actFundamentals')
  .where('start', '>', new Date().getTime())
  .orderBy('start', 'asc')
  .limit(1)
  .get();

  return eventQuery.docs[0];
}

async function getPreviousLesson(studentUID) {
  const eventQuery = await firebase.firestore().collection('Events')
  .where('student', '==', studentUID)
  .where('type', '==', 'actFundamentals')
  .where('start', '<=', new Date().getTime())
  .orderBy('start', 'desc')
  .limit(1)
  .get();

  return eventQuery.docs[0];
}

function isInLesson(previousLessonData) {
  return previousLessonData ? (previousLessonData.start <= new Date().getTime() && previousLessonData.end >= new Date().getTime()) : false
}

async function getLessonsWithinRange(start, end, studentUID) {
  const eventQuery = await firebase.firestore().collection('Events')
  .where('student', '==', studentUID)
  .where('type', '==', 'actFundamentals')
  .where('start', '>=', start)
  .where('start', '<=', end)
  .orderBy('start', 'asc')
  .get();

  return eventQuery.docs;
}

async function getLessonSectionAssignment(lessonID) {
  const sectionAssignmentQuery = await firebase.firestore().collection('Section-Assignments')
  .where('lesson', '==', lessonID)
  .limit(1)
  .get();

  return sectionAssignmentQuery.docs[0];
}

async function getLessonDailyAssignment(lessonID) {
  const dailyAssignmentQuery = await firebase.firestore().collection('Daily-Assignments')
  .where('lesson', '==', lessonID)
  .limit(1)
  .get();

  return dailyAssignmentQuery.docs[0];
}

async function getDailyAssignments(studentUID) {
  // daily assignments are given for yesterday's lesson and last week's lesson
  // each is given 2 days to complete
  let dailyAssignments = [];

  // get the date ranges for the lessons that we want to check daily assignments for
  const now = new Date();
  const beginningToday = new Date(now).setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(beginningToday).setDate(new Date(beginningToday).getDate() - (7 + 2));
  const lastWeekEnd = new Date(lastWeekStart).setDate(new Date(lastWeekStart).getDate() + 2);
  const yesterdayStart = new Date(beginningToday).setDate(new Date(beginningToday).getDate() - 2);
  const yesterdayEnd = new Date(now).getTime();

  // get the event docs that correspond to daily assignments
  const lastWeekDocs = await getLessonsWithinRange(lastWeekStart, lastWeekEnd, studentUID);
  const yesterdayDocs = await getLessonsWithinRange(yesterdayStart, yesterdayEnd, studentUID);

  const allLessonDocs = [...lastWeekDocs, ...yesterdayDocs]

  // check if the student has already done a daily for these lessons
  await Promise.all(allLessonDocs.map(async (lesson) => {
    const lessonDailyAssigment = await getLessonDailyAssignment(lesson.id);
    
    if (lessonDailyAssigment) {
      dailyAssignments.push({
        status: lessonDailyAssigment.data().status,
        lessonID: lesson.id,
        assignmentID: lessonDailyAssigment.id,
        section: lesson.data().subtype
      })
    }
    else {
      dailyAssignments.push({
        status: 'new',
        lessonID: lesson.id,
        assignmentID: null,
        section: lesson.data().subtype
      })
    }
  }))

  return dailyAssignments;
}

async function getSectionAssignment(studentUID) {
  // the section assignment is homework due for the next lesson
  // there can only be one

  // get the next lesson
  const nextLessonDoc = await getNextLesson(studentUID);
  
  // check if there is a section assignment already connected to the next lesson
  const nextLessonSectionAssignment = await getLessonSectionAssignment(nextLessonDoc.id);

  //there is an section assignment already attached to the next lesson
  if (nextLessonSectionAssignment) {
    return {
      status: nextLessonSectionAssignment.data().status,
      lessonID: nextLessonDoc.id,
      assignmentID: nextLessonSectionAssignment.id,
      section: nextLessonDoc.data().subtype
    }
  }
  // no section assignemnt has been assigned to this lesson yet
  else {
    return {
      status: 'new',
      lessonID: nextLessonDoc.id,
      assignmentID: null,
      section: nextLessonDoc.data().subtype
    }
  }
}

async function setLandingPage(studentUID) {
  await Promise.all([
    // // get the student doc
    // getStudentDoc(studentUID)
    // .then(studentDoc => {
    //   renderStudentDetails(studentDoc.data())
    // }),
    // get the next lesson and render it
    getNextLesson(studentUID)
    .then(nextLessonDoc => {
      renderNextLessonDetails(nextLessonDoc.data())
    }),

    //get the daily assignments and render them
    getDailyAssignments(studentUID)
    .then(dailyAssignments => {
      if (dailyAssignments.length == 0) {
        renderDailyAssignment(null);
      }
      else {
        dailyAssignments.forEach(dailyAssignment => {
          renderDailyAssignment(dailyAssignment);
        })
      }
    }),
    //get the section assignment and render it
    getSectionAssignment(studentUID)
    .then(sectionAssignment => {
      renderSectionAssignment(sectionAssignment)
    })
  ])
}

/*
* End Landing Page
*/



/**
 * This will cause MathJax to look for unprocessed mathematics on the page and typeset it
 */
 async function resetMathJax() {
  await MathJax.typeset();
  document.querySelectorAll('.MathJax').forEach((math) => {
    math.removeAttribute('tabindex');
  })
}

/**
 * 
 * @param {string} test The test ID (ie. B05)
 * @param {string} section The section (Possible Values: english, math, reading, science)
 * @param {number} passage The passage number
 * @returns {Promise} Firebase Document
 */
 async function getPassageDocument(test, section, passage) {
	// get the passage document
	const passageQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'passage')
	.where('test', '==', test.toUpperCase())
	.where('section', '==', section.toLowerCase())
	.where('passageNumber', '==', parseInt(passage))
  .limit(1)
  .get();

  return passageQuery.docs[0];
}

/**
 * This will grab a question document from firebase
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (Possible Values: english, math, reading, science)
 * @param {number} question Question Number
 * @returns {Promise} Firebase Document
 */
 async function getQuestionDocument(test, section, question) {

	// get the question document
	const questionQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test.toUpperCase())
	.where('section', '==', section.toLowerCase())
	.where('problem', '==', parseInt(question))
  .limit(1)
  .get();

  return questionQuery.docs[0];
}

function renderSelector(test, section) {
  for (let i = 1; i <= QUESTION_COUNT[section]; i++) {
    const questionRadio = document.createElement('input');
    questionRadio.setAttribute('id', 'selectorRadio-' + i);
    questionRadio.setAttribute('type', 'radio');
    questionRadio.setAttribute('name', 'questionSelector');

    const questionSelector = document.createElement('label');
    questionSelector.setAttribute('for', 'selectorRadio-' + i);
    questionSelector.classList.add('selector-wrapper');
    questionSelector.addEventListener('click', () => { setQuestion(test, section, i) })
    questionSelector.innerHTML = `
      <span>${FLAG_SVG}</span>
      Question ${i}
    `
    document.querySelector('.main .panels .selector .selector-container').appendChild(questionRadio);
    document.querySelector('.main .panels .selector .selector-container').appendChild(questionSelector);
  }
}

function renderPassage(passageData) {
  // document.querySelector('.main .panels .passage').classList.remove('hide');

  document.getElementById('sectionTitle').innerHTML = passageData.section.toUpperCase();
  document.getElementById('passageNumber').innerHTML = ROMAN_NUMERALS[passageData.passageNumber - 1];

  document.getElementById('passageTitle-A').innerHTML = passageData.title || '';
  document.getElementById('passagePreText-A').innerHTML = passageData.preText || '';
  document.getElementById('passageText-A').innerHTML = passageData.passageText || '';
  document.getElementById('passageReference-A').innerHTML = passageData.reference || '';

  document.getElementById('passageTitle-B').innerHTML = passageData.ABData.title || '';
  document.getElementById('passagePreText-B').innerHTML = passageData.ABData.preText || '';
  document.getElementById('passageText-B').innerHTML = passageData.ABData.passageText || '';
  document.getElementById('passageReference-B').innerHTML = passageData.ABData.reference || '';

  resetMathJax();
}

function renderQuestion(questionData) {
  // document.querySelector('.main .panels .question').classList.remove('hide');

  document.getElementById('questionNumber').textContent = questionData.problem;
  document.getElementById('questionText').innerHTML = questionData.questionText;

  document.querySelectorAll(`.passage-container span[data-question]`).forEach(question => { question.classList.remove('highlighted') });
  document.querySelectorAll(`.passage-container span[data-question="${questionData.problem}"]`).forEach(question => { question.classList.add('highlighted'); });

  if (document.getElementById(`selectorRadio-${questionData.problem}`)) {
    document.getElementById(`selectorRadio-${questionData.problem}`).checked = true;
  }

  const choiceWrapper = document.getElementById('questionChoices');
  removeAllChildNodes(choiceWrapper);

  questionData.answers.forEach((choice, index) => {
    const choiceLetter = questionData.problem % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index];

    const choiceElem = document.createElement('div');
    choiceElem.classList.add('choice');
    // choiceElem.innerHTML = `
    //   <input type="checkbox" name="strike" id="strike-${index}" value="${choiceLetter}">
    //   <input type="radio" name="choice" id="choice_${index}" value="${choiceLetter}" onclick="addSelectorAnsweredCallback(${questionData.problem})">
    //   <label for="choice_${index}"><p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}</label>
    // `
    choiceElem.innerHTML = `
      <input type="radio" name="choice" id="choice_${index}" value="${choiceLetter}" onclick="addSelectorAnsweredCallback(${questionData.problem})">
      <label for="choice_${index}"><p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}</label>
    `

    choiceWrapper.appendChild(choiceElem);
  })

  resetMathJax();
}

function renderNextPrevious(section, question) {
  if (question > 1) {
    document.getElementById('previousBtn').classList.remove('hide');
  }
  else {
    document.getElementById('previousBtn').classList.add('hide');
  }

  if (question < QUESTION_COUNT[section]) {
    document.getElementById('nextBtn').classList.remove('hide');
  }
  else {
    document.getElementById('nextBtn').classList.add('hide');
  }
}

function hidePassage() {
  document.querySelector('.main .panels .passage').classList.add('hide');
}

function showPassage() {
  document.querySelector('.main .panels .passage').classList.remove('hide');
}

function hideQuestion() {
  document.querySelector('.main .panels .question').classList.add('hide');
}

function showQuestion() {
  document.querySelector('.main .panels .question').classList.remove('hide');
}

function renderError(errorMsg) {
  customConfirm(errorMsg, '', 'OK', () => {}, () => {});
}

async function setQuestion(test, section, question) {
  changeAccentColor(section);
  changePassageColumns(section);

  if (question != current_data.question) {
    try {
      const questionDoc = await getQuestionDocument(test, section, question);
      const questionData = questionDoc?.data();
  
      if (!questionData) {
        renderError('We are having an issue getting this question.');
        return;
      }
  
      // if the question does have a passage
      if (questionData.passage != -1 && questionData.passage != current_data.passage) {
        await setPassage(test, section, questionData.passage);
      }
      if (questionData.passage == -1) {
        hidePassage();
      }
      else {
        showPassage();
      }
  
      renderNextPrevious(section, question);
      renderQuestion(questionData);
  
      current_data.test = test;
      current_data.section = section;
      current_data.question = question;
    }
    catch (error) {
      console.log(error)
    }
  }
}

async function setPassage(test, section, passage) {
  changeAccentColor(section);
  changePassageColumns(section);
  try {
    const passageDoc = await getPassageDocument(test, section, passage);
    const passageData = passageDoc?.data();

    if (!passageData) {
      renderError('We are having issues getting this passage for this question.');
      return;
    }
    renderPassage(passageData);

    current_data.test = test;
    current_data.section = section;
    current_data.passage = passage;
  }
  catch (error) {
    console.log(error)
  }
}

async function setSection(test, section) {
  current_data.test = test;
  current_data.section = section;

  renderSelector(test, section)
  await setQuestion(test, section, 1)
}

function nextQuestionCallback() {
  setQuestion(current_data.test, current_data.section, current_data.question + 1)
}

function previousQuestionCallback() {
  setQuestion(current_data.test, current_data.section, current_data.question - 1)
}

function toggleSelectorCallback() {
  document.querySelector('.main .panels .selector').classList.toggle('open')
}

function addSelectorAnsweredCallback(question) {
  document.querySelector(`label[for="selectorRadio-${question}"] > span`).classList.add('answered')
}

function toggleSelectorFlagCallback(question) {
  document.querySelector(`label[for="selectorRadio-${question}"] > span`).classList.toggle('flagged')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}