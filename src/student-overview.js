import {getCurrentUserRole, goHome} from "./_authorization"
import app from "./_firebase";
import { getDoc, doc, getFirestore, getDocs, query, collection, where, orderBy } from "firebase/firestore"

const db = getFirestore(app);
const CURRENT_STUDENT_UID = location.pathname.split('/')[2];

let student_doc = null;
let parent_doc = null;

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
}

function getCompositeScore(scores) {
  // return the average of the element in the array or null if any value is null
  if (scores.some(score => score === null)) return null;

  const sum = scores.reduce((prev, curr) => prev + curr)
  const num = scores.length;

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
  .sort((a,b) => a.open ? a.open.toMillis() : 0 - b.open ? b.open.toMillis() : 0)

  const testIDs = await Promise.all(assignments.map(async assignment => {
    // get the section document of this assignent
    const sectionDoc = await getDoc(doc(db, 'ACT-Section-Data', assignment.scaledScoreSection));
    return sectionDoc.data().test;
  }))

  let testsObject = {}
  for (let index = 0; index < assignments.length; index++) {
    // there isn't an array for this test yet create one
    if (!testsObject[testIDs[index]]) testsObject[testIDs[index]] = Array(HW_GRID_COLUMNS.length).fill(null);
    // set the assignment to the apropriate column
    const columnIndex = HW_GRID_COLUMNS.indexOf(assignments[index].sectionCode);
    testsObject[testIDs[index]][columnIndex] = assignments[index].scaledScore;
  }

  // convert the object to an array of just its values
  const tests = Object.values(testsObject)
  .map(test => {
    // fill in the composite score
    test[0] = getCompositeScore(test.slice(1));
    return test;
  })

  return tests;
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
      cell.className = `cell ${HW_GRID_COLUMNS[colIndex]}`;
      cell.textContent = column;
      wrapper.appendChild(cell);
    })
  })

}