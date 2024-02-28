import Dialog from "./_Dialog";
import {getCurrentUserRole, goHome} from "./_authorization"
import app from "./_firebase";
import { getDoc, doc, getFirestore, getDocs, query, collection, where, orderBy } from "firebase/firestore"

const db = getFirestore(app);
const CURRENT_STUDENT_UID = location.pathname.split('/')[2];

const USE_AVERAGE_FREQUENCEY = false;

let student_doc = null;
let parent_doc = null;

let curriculumData_Cache = {
  english: { total: 0 },
  math: { total: 0 },
  reading: { total: 0 },
  science: { total: 0 },
};

const HW_GRID_COLUMNS = ['composite', 'english', 'math', 'reading', 'science'];

window.goHome = goHome;

document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  student_doc = await getUserDoc(CURRENT_STUDENT_UID);
  if (student_doc.data()?.parent) {
    parent_doc = await getUserDoc(student_doc.data().parent);
    renderHeader(
      student_doc.data().firstName + ' ' + student_doc.data().lastName,
      parent_doc.data().firstName + ' ' + parent_doc.data().lastName
    )
  }
  else {
    renderHeader(student_doc.data().firstName + ' ' + student_doc.data().lastName)
  }
  setUpLinks();

  initializeOverview();
}

function getUserDoc(userUID) {
  return getDoc(doc(db, 'Users', userUID));
}

async function setUpLinks() {
  const links = document.querySelectorAll('nav .links > a');
  links.forEach(async link => {
    if (link.dataset.path) {
      const path = (link.dataset.path === 'student') ? '/' + student_doc.id : (link.dataset.path === 'parent') ? '/' + parent_doc?.id ?? '' : '';
      link.href = link.href.replace('.html', path);
    }

    if (link.dataset.query) {
      const queries = link.dataset.query.split(',');
      if (queries.length > 0) {
        let first = true;
        queries.forEach((query) => {
          const queryUID = query === 'student' ? student_doc.id : (query === 'parent') ? parent_doc?.id ?? '' : '';
          if (queryUID !== '') {
            if (first) {
              first = false;
              link.href += `?${query}=${queryUID}`
            } else {
              link.href += `&${query}=${queryUID}`
            }
          }
        })
      }
    }

    if (link.dataset.role.split(',').includes(await (getCurrentUserRole()))) {
      link.style.display = 'block';
    }
  })
}

function renderHeader(studentName, parentName = 'No Parent') {
  document.getElementById('studentName').textContent = studentName;
  document.getElementById('parentName').textContent = parentName;
}

async function initializeOverview() {
  // get all of the hw assignments
  const assignmentDocs = await getAllHwAssignments(CURRENT_STUDENT_UID);
 
  const tests = await getFullHwRows(assignmentDocs)
  renderHwRows(tests)
  await getAllCurriculumData();
}

function getCompositeScore(scores) {
  // return the average of the element in the array or null if any value is null
  if (scores.some(score => score == null)) return null;
  
  const num = scores.length;
  if (num == 0) return null;

  const sum = scores.reduce((prev, curr) => prev + curr, 0)

  return Math.round(sum / num);
}

async function getAllHwAssignments(studentUID) {
  const q = query(
    collection(db, 'ACT-Assignments'),
    where('student', '==', studentUID),
    where('type', '==', 'homework')
  )

  return (await getDocs(q)).docs;
}

async function getFullHwRows(assignmentDocs) {
  const assignments = assignmentDocs
  .map(doc => doc.data())
  .filter(assignment => assignment.scaledScoreSection != null)

  const testIDs = await Promise.all(assignments.map(async assignment => {
    // get the section document of this assignent
    const sectionDoc = await getDoc(doc(db, 'ACT-Section-Data', assignment.scaledScoreSection));
    return sectionDoc.data().test;
  }))

  let testsObject = {}
  for (let index = 0; index < assignments.length; index++) {
    // there isn't an array for this test yet create one
    if (!testsObject[testIDs[index]]) testsObject[testIDs[index]] = Array(HW_GRID_COLUMNS.length).fill({});
    // set the assignment to the apropriate column
    const columnIndex = HW_GRID_COLUMNS.indexOf(assignments[index].sectionCode);
    testsObject[testIDs[index]][columnIndex] = assignments[index];
  }

  // convert the object to an array of just its values
  const lastScores = {
    english: null,
    math: null,
    reading: null,
    science: null,
  }
  return Object.values(testsObject)
  // sort by date first
  .sort((a,b) => getTestOpenDate(a) - getTestOpenDate(b))
  // calculate the composite score, if one score is ommitted pass the previous one to calculate composite assuming it didn't change
  .map(test => {
    // fill in the composite score
    const allSections = test.slice(1);
    const allScores = allSections.map(section => {
      const scaledScore = section.scaledScore ?? lastScores[section.sectionCode];
      lastScores[section.sectionCode] = scaledScore;

      return scaledScore
    })
    
    test[0] = { scaledScore: getCompositeScore(allScores) };
    return test;
  })
}

function getTestOpenDate(test) {
  return test.reduce((prev, curr) => {
    if (curr.open && curr.open.toMillis() < prev) {
      return curr.open.toMillis();
    }
    return prev;
  }, Infinity)
}

function renderHwRows(rows) {
  const wrapper = document.getElementById('hw-wrapper');

  rows.forEach((row, rowIndex) => {
    const title = document.createElement('h4');
    title.className = 'cell';
    title.textContent = `Test ${rowIndex + 1}`;
    wrapper.appendChild(title);

    row.forEach((column, colIndex) => {
      const cell = document.createElement('h4');
      cell.classList.add('cell');
      if (column.scaledScore) {
        cell.classList.add(HW_GRID_COLUMNS[colIndex]);
        cell.textContent = column.scaledScore;
        cell.addEventListener('click', () => showAssignmentDetails(column));
        cell.classList.add('clickable');
      } else if (column.status == 'omitted') {
        cell.classList.add('omitted');
        cell.textContent = 'omitted';
      }
      wrapper.appendChild(cell);
    })
  })

}

async function getAllCurriculumData() {
  // get all docs in the curriculum data
  const curriculumDocs = await getDocs(query(collection(db, 'ACT-Curriculum-Data')));

  curriculumDocs.forEach(doc => {
    const id = doc.id;
    const data = doc.data();

    curriculumData_Cache[data.sectionCode][id] = data;
  })

  // create the totals for each section
  for (const section in curriculumData_Cache) {
    for (const topic in curriculumData_Cache[section]) {
      curriculumData_Cache[section].total += curriculumData_Cache[section][topic].numQuestions ?? 0;
    }
  }

  return curriculumData_Cache;
}

function showAssignmentDetails(assignment) {
  const sectionQuestionCounts = {
    english: 75,
    math: 60,
    reading: 40,
    science: 40
  }
  const topicInfo = assignment.topicGrades;
  if (!topicInfo) return;

  for (const topic in topicInfo) {
    if (topic == 'null') {
      delete topicInfo[topic];
      continue;
    };
    const current = topicInfo[topic];
    const section = assignment.sectionCode;
    const sectionTotal = curriculumData_Cache[section].total;
    const topicData = curriculumData_Cache[section][topic];

    // will use the average frequency across all tests or will just use frequency from this test.
    const frequency = USE_AVERAGE_FREQUENCEY ? topicData.numQuestions / sectionTotal : current.total / sectionQuestionCounts[section];
    const totalAnswered = current.correct + current.wrong;
    const grade = totalAnswered == 0 ? null : current.correct / totalAnswered;
    const unansweredGrade = current.correct / current.total;

    current.possible = frequency * 36;
    current.actual = frequency * unansweredGrade * 36;
    current.score = grade != null ? frequency * (1 - grade) * 36 : null;
    current.unansweredScore = frequency * (1 - unansweredGrade) * 36;
    current.name = topicData.code;
    current.numQuestions = topicData.numQuestions;
  }

  // convert the object to an array and then put into html
  const message = document.createElement('div');
  message.innerHTML = 
  `
  <div class="topic-score highlight">
    <p>Topic</p>
    <div>
      <p class="tooltip">
        Poss
        <span class="tooltiptext down">The possible points if all questions of this topic are answered correctly.</span>
      </p>
      <p class="tooltip">
        Actual
        <span class="tooltiptext down">The actual number of points all questions of this topic contribute.</span>
      </p>
      <p class="tooltip">
        Ans
        <span class="tooltiptext down">How many points the scaled score will increase if all questions of this topic that were answered were answered correctly.</span>
      </p>
      <p class="tooltip">
        Miss
        <span class="tooltiptext down">How many points the scaled score will increase if all questions of this topic were answered correctly.</span>
      </p>
    </div>
  </div>
  `
  const totals = {
    possible: 0,
    actual: 0,
    score: 0,
    unansweredScore: 0
  }
  Object.values(topicInfo)
  .sort((a,b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff != 0) return scoreDiff;

    const frequencyDiff = b.numQuestions - a.numQuestions;
    return frequencyDiff;
  })
  .forEach(topic => {
    totals.possible += topic.possible;
    totals.actual += topic.actual;
    totals.score += topic.score ?? 0;
    totals.unansweredScore += topic.unansweredScore;
    totals.diff += topic.unansweredScore - topic.score;

    const line = document.createElement('div');
    const name = document.createElement('p');
    const score = document.createElement('div');

    line.className = 'topic-score';

    name.textContent = topic.name;
    score.innerHTML = 
    `
    <p>${topic.possible.toFixed(2)}</p>
    <p>${topic.actual.toFixed(2)}</p>
    <p>${topic.score != null ? topic.score.toFixed(2) : ''}</p>
    <p>${topic.unansweredScore.toFixed(2)}</p>
    `

    line.appendChild(name);
    line.appendChild(score);
    message.appendChild(line);
  })
  message.innerHTML +=
  `
  <div class="topic-score highlight">
    <p></p>
    <div>
      <p></p>
      <p></p>
      <p></p>
      <p></p>
    </div>
  </div>
  <div class="topic-score highlight">
    <p>Total</p>
    <div>
      <p class="tooltip">
        ${totals.possible.toFixed(2)}
        <span class="tooltiptext up">The total scaled score possible (should be 36 unless there is a question with no topic).</span>
      </p>
      <p class="tooltip">
        ${totals.actual.toFixed(2)}
        <span class="tooltiptext up">The calculated scaled score (just a linear approximation so should be close to actual).</span>
      </p>
      <p class="tooltip">
        ${totals.score.toFixed(2)}
        <span class="tooltiptext up">The predicted scaled score increase if all answered questions were corrected.</span>
      </p>
      <p class="tooltip">
        ${totals.unansweredScore.toFixed(2)}
        <span class="tooltiptext up">The predicted scaled score increase if all questions were corrected.</span>
      </p>
    </div>
  </div>
  <div class="topic-score highlight">
    <p>Adjusted</p>
    <div>
      <p></p>
      <p></p>
      <p class="tooltip">
        ${(totals.score + totals.actual).toFixed(2)}
        <span class="tooltiptext up">The predicted scaled score if all answered questions were corrected.</span>
      </p>
      <p class="tooltip">
        ${(totals.unansweredScore + totals.actual).toFixed(2)}
        <span class="tooltiptext up">The predicted scaled score if all questions were corrected.</span>
      </p>
    </div>
  </div>
  <div class="topic-score highlight">
    <p>Actual</p>
    <div>
      <p class="tooltip">
        36.00
        <span class="tooltiptext up">The actual possible scaled score (is 36).</span>
      </p>
      <p class="tooltip">
        ${assignment.scaledScore.toFixed(2)}
        <span class="tooltiptext up">The actual scaled score.</span>
      </p>
      <p class="tooltip">
        ${(totals.score + assignment.scaledScore).toFixed(2)}
        <span class="tooltiptext up">The predicted scaled score using the actual scaled score if all answered questions were corrected</span>
      </p>
      <p class="tooltip">
        ${(totals.unansweredScore + assignment.scaledScore).toFixed(2)}
        <span class="tooltiptext up">The predicted scaled score using the actual scaled score if all questions were corrected (should be 36).</span>
      </p>
    </div>
  </div>
  `

  Dialog.alert(message, { width: '600px' });
}