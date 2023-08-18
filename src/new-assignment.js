import { getCurrentUser } from "./_authorization";
import app from "./_firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, query, orderBy, serverTimestamp, setDoc, where } from "firebase/firestore";

import Dialog from "./_Dialog";
import Time from "./_Time";

const db = getFirestore(app);

const ANONYMOUS_UID = doc(collection(db, 'Users')).id;
const TOPIC_GRADED_ASSIGNMENT_TYPES = ['assessment', 'daily', 'homework', 'practice'];
const PERCENT_GRADE_INCREASE_PER_LESSON = 0.3   // the estimated percent of grade increase to 100 that we can expect by teaching one lesson (i.e, Grade = 60%, expected increase = 50%, then (1 - Grade) * 0.5 = expected score = 80%)

let topic_section_totals = {
  english: 0,
  math: 0,
  reading: 0,
  science: 0
}

document.addEventListener('DOMContentLoaded', initialSetup);
window.setManualStudent = setManualStudent;
window.getSections = getSections;
window.showCurriculumAssignments = showCurriculumAssignments;
window.selectAllTopicsChange = selectAllTopicsChange;
window.setAssignment = setAssignment;
window.showCurriculumLessons = showCurriculumLessons;
window.lessonDateClick = lessonDateClick;

/**
 * 
 * @param {HTMLElement} selectElement the select element that should be populated with options
 * @param {Array} optionValues the options' values
 * @param {Array} optionTexts the options' text contents
 */
function addSelectOptions(selectElement, optionValues, optionTexts) {
  //check that the values and texts match in length
  if (optionValues.length != optionTexts.length) {throw "option values and options texts must have the same number of elements"}
  
  optionValues.forEach((optionValue, index) => {
    let option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionTexts[index];
    selectElement.appendChild(option);
  });
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

function setManualStudent() {
  const student = document.getElementById('manualUID').value;
  if (student) {
    window.location.href = window.location.href.split('?')[0] + `?student=${student}`
  }
  else {
    window.location.href = window.location.href.split('?')[0]
  }
}

async function initialSetup() {
  await getTopics()

  const params = new URLSearchParams(document.location.search);
  const student = params.get("student");

  if (student) {
    document.getElementById('nameSearch').disabled = true;
    document.getElementById('nameSearch').setAttribute('data-value', student);

    document.getElementById('testTakerLink').textContent = `${window.location.origin}/test-taker/${student}`;
    document.getElementById('testTakerLink').href = `${window.location.origin}/test-taker/${student}`;
    getTestsForSections()
    getDoc(doc(db, 'Users', student))
    .then((studentDoc) => {
      if (studentDoc.exists()) {
        document.getElementById('nameSearch').value = studentDoc.data().firstName + ' ' + studentDoc.data().lastName + ' (' + studentDoc.data().role + ')';
      }
      else {
        document.getElementById('nameSearch').value = student;
      }
    })
    getAssignments(student);
  }
  else {
    const nameSearchInput = debounce(() => queryUsers(), 500);
    document.getElementById('nameSearch').addEventListener('input', nameSearchInput);
    queryUsers();
  }


  flatpickr('#open', {
    defaultDate: 'today',
    minDate: 'today',
    dateFormat: 'M j, Y h:i K',
    enableTime: true
  });

  flatpickr('#close', {
    defaultDate: 'today',
    minDate: 'today',
    dateFormat: 'M j, Y h:i K',
    enableTime: true
  });
}

async function getAssignments(studentUID) {
  const assignmentQuery = await getDocs(
    query(
      collection(db, 'ACT-Assignments'),
      where('student', '==', studentUID),
      where('status', '==', 'graded'),
      where('type', 'in', TOPIC_GRADED_ASSIGNMENT_TYPES)
    )
  );

  const topicGrades = assignmentQuery.docs
  .map(doc => doc.data().topicGrades ?? null) // map the docs to just the topic grades
  .filter(grades => grades != null) // filter out the assignments that don't have topic grades
  .reduce((prev, curr) => { // reduce the topic grades into a single object with combined topics
    for (const topic in curr) {
      if (topic == 'null') {
        continue;
      }

      if ((!prev[topic])) {
        prev[topic] = {
          correct: 0,
          total: 0
        }
      }

      prev[topic].correct += curr[topic].correct ?? 0;
      prev[topic].total += (curr[topic].correct ?? 0) + (curr[topic].wrong ?? 0);   // we don't want the total becuase this includes unanswered questions which mean nothing for the score
    }

    return prev
  }, {})

  // go through and reomve all of the grades and scores that are already in the topics
  document.querySelectorAll('div[id$="-grade"]').forEach(div => div.textContent = '');
  document.querySelectorAll('div[id$="-score"]').forEach(div => div.textContent = '');

  // go through the topic grades and add them to the by topic weights
  for (const topic in topicGrades) {
    // we need to know the frequency
    const frequency = Number.parseFloat(document.getElementById(`${topic}-frequency`).dataset.frequency);

    // write the grade
    const grade = (topicGrades[topic].correct / topicGrades[topic].total)
    document.getElementById(`${topic}-grade`).textContent = (grade * 100).toFixed(2) + '%';

    // write the score
    document.getElementById(`${topic}-score`).textContent = (((1 - grade) * PERCENT_GRADE_INCREASE_PER_LESSON) * frequency * 36).toFixed(2);
  }

}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

async function queryUsers(shouldRemoveValue = true) {
  let firstNameQuery = document.getElementById('nameSearch').value.split(' ')[0];
  let lastNameQuery = document.getElementById('nameSearch').value.split(' ')[1];

  if (firstNameQuery) {
    firstNameQuery = formatToName(firstNameQuery);
  }
  if (lastNameQuery) {
    lastNameQuery = formatToName(lastNameQuery);
  }

  if (shouldRemoveValue) {
    const nameSearch = document.getElementById('nameSearch');
    nameSearch.removeAttribute('data-value');
    removeAllChildNodes(document.getElementById('tests'));
    removeAllChildNodes(document.getElementById('sections'));
  }
  const nameResultsWrapper =  document.getElementById('nameSearchResults');
  removeAllChildNodes(nameResultsWrapper);

  renderNameSearchResult('ANONYMOUS USER', ANONYMOUS_UID);
  if (firstNameQuery && !lastNameQuery) {
    const [ firstNameUserDocs, lastNameUserDocs ] = await Promise.all([
      getDocs(query(
        collection(db, 'Users'),
        where('firstName', '>=', firstNameQuery),
        where('firstName', '<=', firstNameQuery + '\uf8ff'),
        orderBy('firstName')
      )),
      // last names
      getDocs(query(
        collection(db, 'Users'),
        where('lastName', '>=', firstNameQuery),
        where('lastName', '<=', firstNameQuery + '\uf8ff'),
        orderBy('lastName')
      ))
    ])

    firstNameUserDocs.docs.forEach(doc => {
      renderNameSearchResult(doc.data().firstName + ' ' + doc.data().lastName + ' (' + doc.data().role + ')', doc.id);
    })
    lastNameUserDocs.docs.forEach(doc => {
      renderNameSearchResult(doc.data().firstName + ' ' + doc.data().lastName + ' (' + doc.data().role + ')', doc.id);
    })
  }
  else if (firstNameQuery && lastNameQuery) {
    try {
      const bothQuery = query(
        collection(db, 'Users'),
        where('firstName', '==', firstNameQuery),
        where('lastName', '>=', lastNameQuery),
        where('lastName', '<=', lastNameQuery + '\uf8ff'),
        orderBy('lastName')
      )
      const userDocs = await getDocs(bothQuery);

      userDocs.docs.forEach(doc => {
        renderNameSearchResult(doc.data().firstName + ' ' + doc.data().lastName + ' (' + doc.data().role + ')', doc.id);
      })
    }
    catch (error) {
      console.log(error)
    }
  }
}

function formatToName(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function renderNameSearchResult(text, value) {
  const nameResultsWrapper =  document.getElementById('nameSearchResults');

  let result = document.createElement('div');
  result.classList.add('search-result');
  result.textContent = text;
  result.addEventListener('mousedown', () => searchResultClicked(value, text));

  nameResultsWrapper.appendChild(result);
}

function searchResultClicked(studentUID, studentName) {
  const nameSearch = document.getElementById('nameSearch');
  nameSearch.value = studentName;
  nameSearch.setAttribute('data-value', studentUID);

  document.getElementById('testTakerLink').textContent = `${window.location.origin}/test-taker/${studentUID}`;
  document.getElementById('testTakerLink').href = `${window.location.origin}/test-taker/${studentUID}`;

  getTestsForSections();
  document.getElementById('curriculumSection').value = '';

  getAssignments(studentUID)

  // re-run the query
  queryUsers(false);
}

async function getTestsForSections() {
  removeAllChildNodes(document.getElementById('tests'));

  const testDocs = await getDocs(query(
    collection(db, 'ACT-Test-Data'),
    where('isQuestionBank', '==', false)
  ));

  const sortedTestDocs = testDocs.docs.sort((a,b) => sortAlphabetically(a.data().code, b.data().code))

  addSelectOptions(document.getElementById('tests'), sortedTestDocs.map(doc => doc.id), sortedTestDocs.map(doc => doc.data().code));
  document.getElementById('tests').dispatchEvent(new Event('change'));
}

async function getSections(event) {
  removeAllChildNodes(document.getElementById('sections'));

  const assignedQuestions = await getAllAssignedQuestions(document.getElementById('nameSearch').dataset.value);
  
  let sectionDocs = (await getDocs(query(
    collection(db, 'ACT-Section-Data'),
    where('test', '==', event.target.value)
  ))).docs;

  const questionFromEachSection = await Promise.all(sectionDocs.map(async (doc) => {
    return (await getDocs(query(
      collection(db, 'ACT-Question-Data'),
      where('section', '==', doc.id),
      limit(1)
    ))).docs[0]?.id
  }))

  sectionDocs = sectionDocs
  .filter((doc, index) => !assignedQuestions.includes(questionFromEachSection[index]))
  .sort((a,b) => sortSectionCanonically(a.data().code, b.data().code))

  addSelectOptions(document.getElementById('sections'), sectionDocs.map(doc => doc.id), sectionDocs.map(doc => doc.data().code));
}

async function getTopics() {
  const topicDocs = (await getDocs(collection(db, 'ACT-Curriculum-Data'))).docs;

  const filteredTopics = {
    english: [],
    math: [],
    reading: [],
    science: []
  }

  for (const section in filteredTopics) {
    filteredTopics[section] = topicDocs.filter(doc => doc.data().sectionCode === section).sort((a,b) => (b.data().numQuestions ?? 0) - (a.data().numQuestions ?? 0));
    
    filteredTopics[section].forEach(topicDoc => topic_section_totals[topicDoc.data().sectionCode] += topicDoc.data().numQuestions ?? 0);
    filteredTopics[section].forEach(renderTopicDoc)
  }
};

function renderTopicDoc(topicDoc) {
  const frequency = topicDoc.data().numQuestions ? topicDoc.data().numQuestions / topic_section_totals[topicDoc.data().sectionCode] : 0;
  const niceFrequency = (frequency * 100).toFixed(2);
  // for assignments
  document.getElementById(`${topicDoc.data().sectionCode}Topics`).innerHTML +=
  `
    <input type='checkbox' id='${topicDoc.id}-checkbox' value='${topicDoc.id}'>
    <label for='${topicDoc.id}-checkbox'>${topicDoc.data().code}</label>
    <input type='number' id='${topicDoc.id}-weight' value="1">
    <div id="${topicDoc.id}-frequency" data-frequency="${frequency}">${niceFrequency}%</div>
    <div id="${topicDoc.id}-grade"></div>
    <div id="${topicDoc.id}-score"></div>
  `

  // for lessons
  document.getElementById(`${topicDoc.data().sectionCode}Lessons`).innerHTML += 
  `
    <label for='${topicDoc.id}-date'>${topicDoc.data().code}</label>
    <button id='${topicDoc.id}-date' onclick="lessonDateClick(event)"></button>
  `

}

function selectAllTopicsChange(e) {
  e.target.parentElement.querySelectorAll('input[type="checkbox"]').forEach(checkBox => checkBox.checked = e.target.checked);
}

function showCurriculumAssignments(event) {
  document.querySelectorAll('#topicWrapper > div').forEach(topicWrapper => topicWrapper.style.display = 'none');
  document.querySelectorAll('#topicWrapper > div > input[type="checkbox"]').forEach(checkBox => checkBox.checked = false);
  document.getElementById(`${event.target.value}Topics`).style.display = 'grid';
}

function showCurriculumLessons(event) {
  document.querySelectorAll('#lessonWrapper > div').forEach(topicWrapper => topicWrapper.style.display = 'none');

  const student = document.getElementById('nameSearch').dataset.value;
  if (!student) {
    new Dialog({
      message: 'Select a student first',
      backgroundColor: '#E36868',
      messageColor: '#FFFFFF',
      messageFontSize: '14px',
      messageFontWeight: 700,
      blocking: false,
      justify: 'end',
      align: 'start',
      shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
      slideInDir: 'down',
      slideInDist: 150,
      slideOutDir: 'right',
      slideOutDist: 300,
      timeout: 5000
    }).show();
    return;
  }

  document.getElementById(`${event.target.value}Lessons`).style.display = 'grid';

  // get the lesson data for the current section
  const curriculumIDs = Array.from(document.getElementById(`${event.target.value}Lessons`).querySelectorAll('button')).map(button => button.id.split('-')[0]);

  Promise.all(curriculumIDs.map(id => {
    return getDoc(doc(db, 'Users', student, 'ACT-Topics-Taught', id))
  }))
  .then(docs => {
    for (const doc of docs) {
      document.querySelector(`button[id^="${doc.id}"]`).textContent = 
      doc.exists() ?
      new Time(doc.data().taughtOn.toDate()).toFormat('{MM}/{dd}/{yyyy}') :
      '';
    }
  })

}

async function lessonDateClick(event) {
  const student = document.getElementById('nameSearch').dataset.value;

  if (!student) {
    new Dialog({
      message: 'Select a student first',
      backgroundColor: '#E36868',
      messageColor: '#FFFFFF',
      messageFontSize: '14px',
      messageFontWeight: 700,
      blocking: false,
      justify: 'end',
      align: 'start',
      shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
      slideInDir: 'down',
      slideInDist: 150,
      slideOutDir: 'right',
      slideOutDist: 300,
      timeout: 5000
    }).show();
    return;
  }

  // if there is already text then the doc exists (hopefully)
  if (event.target.textContent) {
    const deleteConfirm = await new Dialog({
      message: 'Are you sure you want to delete this lesson?',
      choices: ['NO', 'YES'],
      values: [false, true]
    }).show();

    if (!deleteConfirm) return;
    
    event.target.textContent = '';

    // save the lesson to the user
    deleteDoc(doc(db, 'Users', student, 'ACT-Topics-Taught', event.target.id.split('-')[0]))
  }
  else {
    event.target.textContent = new Time().toFormat('{MM}/{dd}/{yyyy}')

    // save the lesson to the user
    setDoc(doc(db, 'Users', student, 'ACT-Topics-Taught', event.target.id.split('-')[0]), {
      taughtOn: serverTimestamp(),
      taughtBy: (await getCurrentUser()).uid ?? null
    }, { merge: true })
  }
}

function sortSectionCanonically(a,b) {
	const canon = {
		english: 0,
		math: 1,
		reading: 2,
		science: 3
	}

	return canon[a] - canon[b];
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

async function setAssignment() {
  document.querySelectorAll('button').forEach(button => button.disabled = false);
  document.getElementById('testTakerLink').textContent = '';
  document.getElementById('testTakerLink').href = ``;

  const student = document.getElementById('nameSearch').dataset.value;
  const assignmentType = document.querySelector('input[name="assignmentType"]:checked').value;
  const test = document.getElementById('tests').value;
  const section = document.getElementById('sections').value;
  const sectionCodeBySection = document.getElementById('sections')?.querySelector('option:checked')?.textContent;
  const sectionCodeByTopic = document.getElementById('sectionCodes').value;
  const topics = Array.from(document.querySelectorAll('#topicWrapper > div > input[type="checkbox"]:checked'), checkbox => checkbox.value);
  const topicProportions = topics.map(id => Number.parseInt(document.getElementById(`${id}-weight`).value))
  const count = parseInt(document.getElementById('count').value ?? 0) || null;
  const hasOpen = document.getElementById('hasOpen').checked;
  let open = document.getElementById('open')._flatpickr.selectedDates[0];
  const hasClose = document.getElementById('hasClose').checked;
  const close = document.getElementById('close')._flatpickr.selectedDates[0];
  const time = parseInt(document.getElementById('time').value ?? 0) || null;
  const type = document.getElementById('types').value;

  // set the date to the earliest right now
  if (hasOpen && open.getTime() < new Date().getTime()) { open = new Date(); };

  // check for impossible open and close times
  if (hasOpen && hasClose && open.getTime() >= close.getTime()) {
    new Dialog({
      message: 'You have impossible open and close times.',
      backgroundColor: '#E36868',
      messageColor: '#FFFFFF',
      messageFontSize: '14px',
      messageFontWeight: 700,
      blocking: false,
      justify: 'end',
      align: 'start',
      shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
      slideInDir: 'down',
      slideInDist: 150,
      slideOutDir: 'right',
      slideOutDist: 300,
      timeout: 5000
    }).show();

    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return;
  }

  switch (assignmentType) {
    case 'section':
      await submitSectionAssignment(student, test, section, sectionCodeBySection, hasOpen ? open : null, hasClose ? close : null, time, type);
      break;
    case 'topic':
      if (count) {
        await submitTopicAssignment(student, sectionCodeByTopic, topics, topicProportions, count, hasOpen ? open : null, hasClose ? close : null, time, type);
      }
      else {
        await submitDynamicAssignment(student, sectionCodeByTopic, topics, topicProportions, hasOpen ? open : null, hasClose ? close : null, time, type);
      }
      break;
    default:
      new Dialog({
        message: 'You are missing the assignment type.',
        backgroundColor: '#E36868',
        messageColor: '#FFFFFF',
        messageFontSize: '14px',
        messageFontWeight: 700,
        blocking: false,
        justify: 'end',
        align: 'start',
        shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
        slideInDir: 'down',
        slideInDist: 150,
        slideOutDir: 'right',
        slideOutDist: 300,
        timeout: 5000
      }).show();

      document.querySelectorAll('button').forEach(button => button.disabled = false);
  }
}

async function submitSectionAssignment(student, test, section, sectionCode, open, close, time, type) {
  if(!student || !test || !section || !sectionCode || !type) {
    new Dialog({
      message: 'Check that all values have been inputted.',
      backgroundColor: '#E36868',
      messageColor: '#FFFFFF',
      messageFontSize: '14px',
      messageFontWeight: 700,
      blocking: false,
      justify: 'end',
      align: 'start',
      shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
      slideInDir: 'down',
      slideInDist: 150,
      slideOutDir: 'right',
      slideOutDist: 300,
      timeout: 5000
    }).show();

    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return;
  }

  // get all of the questions of this test and section
  const questions = (await getDocs(query(
    collection(db, 'ACT-Question-Data'),
    where('test', '==', test),
    where('section', '==', section)
  ))).docs
  .sort((a,b) => a.data().code - b.data().code)
  .map(doc => doc.id);

  await setDoc(doc(collection(db, 'ACT-Assignments')), {
    student,
    questions,
    open,
    close,
    time: time ? time * 60000 : null,
    type,
    sectionCode,
    scaledScoreSection: section,
    status: 'new'
  });

  document.getElementById('testTakerLink').textContent = `${window.location.origin}/test-taker/${student}`;
  document.getElementById('testTakerLink').href = `${window.location.origin}/test-taker/${student}`;

  getTestsForSections();

  Dialog.toastMessage('Assignment Sent!')
  document.querySelectorAll('button').forEach(button => button.disabled = false);
}

async function submitTopicAssignment(student, sectionCode, topics, topicProportions, count, open, close, time, type) {
  if (!student || !sectionCode || !topics || topics.length == 0 || !topicProportions || topicProportions.length == 0 || !type) {
    new Dialog({
      message: 'Check that all values have been inputted.',
      backgroundColor: '#E36868',
      messageColor: '#FFFFFF',
      messageFontSize: '14px',
      messageFontWeight: 700,
      blocking: false,
      justify: 'end',
      align: 'start',
      shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
      slideInDir: 'down',
      slideInDist: 150,
      slideOutDir: 'right',
      slideOutDist: 300,
      timeout: 5000
    }).show();

    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return;
  }

  const assignedQuestions = await getAllAssignedQuestions(student);
  let questionsByTopics = await getQuestionsByTopics(topics);
  // remove all of the already assigned questions
  for (let topic in questionsByTopics) {
    questionsByTopics[topic] = questionsByTopics[topic].map(group => group.filter(question => !assignedQuestions.includes(question)))
    .filter(filteredGroup => filteredGroup.length > 0);
  }

  // make sure we have enough questions in all topics to actually generate this assignment
  const totalQuestions = Object.keys(questionsByTopics).reduce((prev, curr) => prev + questionsByTopics[curr].flat().length, 0);
  if (totalQuestions < count) {
    const message = document.createElement('div');
    message.innerHTML = `
    <p>There are not enough questions to generate this assignment.</p>
    <p>Below are the number of question available for each topic.</p>
    ${(await Promise.all(Object.keys(questionsByTopics).map(async (topic) => {
      return `<p>${(await getDoc(doc(db, 'ACT-Curriculum-Data', topic))).data().code}: ${questionsByTopics[topic].flat().length}</p>`
    }))).join('')}
    <p>Total: ${totalQuestions}</p>
    `
    Dialog.alert(message);

    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return;
  }

  const questions = getRandomQuestions(count, topics, topicProportions, questionsByTopics)

  await setDoc(doc(collection(db, 'ACT-Assignments')), {
    student,
    questions,
    open,
    close,
    time: time ? time * 60000 : null,
    type,
    sectionCode,
    status: 'new'
  })

  document.getElementById('testTakerLink').textContent = `${window.location.origin}/test-taker/${student}`;
  document.getElementById('testTakerLink').href = `${window.location.origin}/test-taker/${student}`;

  Dialog.toastMessage('Assignment Sent!')
  document.querySelectorAll('button').forEach(button => button.disabled = false);
}

/**
 * get a list of questions for given topics and proportions
 * @param {number} count least number of question to randomly return
 * @param {string[]} topics topic ids of desired questions
 * @param {number[]} topicProportions proportions of how many questions to get for each topic
 * @param {Object.<string, string[][]>} questionsByTopics object that stores the question groups for each topic in arrays of arrays
 * @param {Object.<string, string[]>|undefined} pendingAssignedQuestions object that keeps track of which questions have been assigned (do not pass this parameter, used for recurrsion)
 * @returns {string[]} array of question ids for generated questions 
 */
function getRandomQuestions(count, topics, topicProportions, questionsByTopics, pendingAssignedQuestions = topics.reduce((prev, curr) => { prev[curr] = []; return prev }, {})) {
  if (topics.length == 0 || topicProportions.length == 0 || Object.keys(questionsByTopics).length == 0) {
    throw 'No topics remain.'
  }

  // make a copy of the arrays and objects since we will be modifying them
  topics = [...topics];
  topicProportions = [...topicProportions];
  questionsByTopics = JSON.parse(JSON.stringify(questionsByTopics))

  // get the proportions from 0 to 1 from the ideal proportions
  const proportionTotal = topicProportions.reduce((prev, curr) => prev + curr);
  const idealProportions = topicProportions.map(proportion => proportion / proportionTotal);

  // loop until we the flat length of pendingAssignedQuestions < count
  while (Object.values(pendingAssignedQuestions).flat().length < count) {
    // get the current proportions
    const actualCount = Object.values(pendingAssignedQuestions).flat().length;
    const actualProportions = topics.map(topic => pendingAssignedQuestions[topic].length / (actualCount ) );
    // find the differnece between actual and ideal
    const diffProportions = actualProportions.map((actual, index) => actual - idealProportions[index]);
    // the min diff will be the topic we choose
    const minDiff = Math.min(...diffProportions);
    let chosenIndex = diffProportions.indexOf(minDiff);
    // on the first run the actual proportions will be 0/0
    // this gives NaN and subsequently we can't find that proportion
    // thus we just get a random index if this happens
    if (chosenIndex == -1) {
      chosenIndex = randomInt(0, topics.length);
    }
    const chosenTopic = topics[chosenIndex]

    // get a random question by topic from questionsByTopics and remove it from the possible question
    const randomQuestionIndex = randomInt(0, questionsByTopics[chosenTopic].length);
    if (questionsByTopics[chosenTopic][randomQuestionIndex]) {
      // a question is available to assign
      pendingAssignedQuestions[chosenTopic].push(questionsByTopics[chosenTopic][randomQuestionIndex]);
      questionsByTopics[chosenTopic].splice(randomQuestionIndex, 1);
    }
    else {
      // no question for this topic is available
      // re run the function without this topic
      topics.splice(chosenIndex, 1)
      topicProportions.splice(chosenIndex, 1)
      delete questionsByTopics[chosenTopic]

      return getRandomQuestions(
        count,
        topics,
        topicProportions,
        questionsByTopics,
        pendingAssignedQuestions
      )
    }
  }

  // console.log(pendingAssignedQuestions)
  return arrayRandomOrder(Object.values(pendingAssignedQuestions).flat()).flat(); // random
  // return Object.values(pendingAssignedQuestions).flat(); // not random
}

async function submitDynamicAssignment(student, sectionCode, topics, topicProportions, open, close, time, type) {
  if (!student || !sectionCode || !topics || topics.length == 0 || !topicProportions || topicProportions.length == 0 || !type) {
    new Dialog({
      message: 'Check that all values have been inputted.',
      backgroundColor: '#E36868',
      messageColor: '#FFFFFF',
      messageFontSize: '14px',
      messageFontWeight: 700,
      blocking: false,
      justify: 'end',
      align: 'start',
      shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
      slideInDir: 'down',
      slideInDist: 150,
      slideOutDir: 'right',
      slideOutDist: 300,
      timeout: 5000
    }).show();

    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return;
  }

  const assignedQuestions = await getAllAssignedQuestions(student);
  let questionsByTopics = await getQuestionsByTopics(topics);
  // remove all of the already assigned questions
  for (let topic in questionsByTopics) {
    questionsByTopics[topic] = questionsByTopics[topic].map(group => group.filter(question => !assignedQuestions.includes(question)))
    .filter(filteredGroup => filteredGroup.length > 0);
  }

  // make sure we have enough questions in all topics to actually generate this assignment
  const totalQuestions = Object.keys(questionsByTopics).reduce((prev, curr) => prev + questionsByTopics[curr].flat().length, 0);
  if (totalQuestions < 1) {
    const message = document.createElement('div');
    message.innerHTML = `
    <p>There are not enough questions to generate this assignment.</p>
    <p>Below are the number of question available for each topic.</p>
    ${(await Promise.all(Object.keys(questionsByTopics).map(async (topic) => {
      return `<p>${(await getDoc(doc(db, 'ACT-Curriculum-Data', topic))).data().code}: ${questionsByTopics[topic].flat().length}</p>`
    }))).join('')}
    <p>Total: ${totalQuestions}</p>
    `
    Dialog.alert(message);

    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return;
  }

  const questions = getRandomQuestions(1, topics, topicProportions, questionsByTopics)

  const topicsWithProportions = topics.reduce((prev, curr, index) => {
    prev[curr] = topicProportions[index];
    return prev;
  }, {})

  await setDoc(doc(collection(db, 'ACT-Assignments')), {
    student,
    questions,
    open,
    close,
    time: time ? time * 60000 : null,
    type,
    sectionCode,
    topicProportions: topicsWithProportions,
    status: 'new'
  })

  document.getElementById('testTakerLink').textContent = `${window.location.origin}/test-taker/${student}`;
  document.getElementById('testTakerLink').href = `${window.location.origin}/test-taker/${student}`;

  Dialog.toastMessage('Assignment Sent!')
  document.querySelectorAll('button').forEach(button => button.disabled = false);
}

/**
 * get all of the questions already assigned to this student
 * @param {string} student student uid
 * @returns {Promise<string[]>} array of question ids
 */
async function getAllAssignedQuestions(student) {
  return (await getDocs(query(
    collection(db, 'ACT-Assignments'),
    where('student', '==', student)
  ))).docs.flatMap(doc => doc.data().questions);
}

/**
 * get an object of questions groups per topic
 * @param {string[]} topics topic ids
 * @returns {Promise<Object.<string, string[][]>>} object containing questions groups per topic
 */
async function getQuestionsByTopics(topics) {
  const questionArray = await Promise.all(topics.map(async (topic) => {
    const topicQuery = await getDocs(query(
      collection(db, 'ACT-Question-Data'),
      where('topic', '==', topic),
      where('isQuestionBank', '==', true)
    ));

    let questionDocs = topicQuery.docs;
    let questionIDs = [];
    // go through the topicDocs and find groups of questions if applicable
    while (questionDocs.length > 0) {
      const currentDoc = questionDocs[0];
      let groupedQuestionIDs;
      // if the question is grouped
      if (currentDoc.data().isGroupedByPassage) {
        // get the other question that are grouped with this question
        const commonPassage = currentDoc.data().passage;
        const groupedQuestionsDocs = questionDocs.filter(doc => doc.data().passage == commonPassage);
        groupedQuestionIDs = groupedQuestionsDocs.map(doc => doc.id);
      }
      else {
        // just pass this question id in
        groupedQuestionIDs = [currentDoc.id];
      }

      // add this grouping into the master copy and remove the group from the docs
      questionIDs.push(groupedQuestionIDs);
      groupedQuestionIDs.forEach(id => {
        questionDocs.splice(questionDocs.findIndex(doc => id == doc.id), 1)
      })
    }

    return questionIDs
  }))

  return topics.reduce((prev, curr, index) => {
    prev[curr] = questionArray[index]
    return prev
  }, {})
}

/**
 * randomize the order of elements in an array
 * @param {any[]} array
 * @returns {any[]}
 */
function arrayRandomOrder(array) {
  let tmpArray = [...array];
  let randomArray = [];

  // go through the array and choose a random index then push it to the random array
  for (let i = 0; i < array.length; i++) {
    let randomIndex = Math.floor(Math.random() * (tmpArray.length));
    randomIndex == tmpArray.length ? randomIndex-- : randomIndex;

    randomArray.push(tmpArray[randomIndex]);
    tmpArray.splice(randomIndex, 1);
  }

  return randomArray;
}

/**
 * 
 * @param {Number} min lowerbound of random int (inclusive)
 * @param {Number} max upperbound of random int (exclusive)
 * @returns {Number} random int in range [min, max)
 */
function randomInt(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number') throw 'min and max must be numbers'
  if (min > max) throw 'min must be less than the max'
  return Math.floor((Math.random() * (max - min)) + min)
}