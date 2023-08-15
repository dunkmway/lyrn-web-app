import "./_authorization"
import app from "./_firebase";
import { getDoc, doc, getFirestore } from "firebase/firestore"

const db = getFirestore(app);
const CURRENT_STUDENT_UID = location.pathname.split('/')[2];

let student_doc = null;
let parent_doc = null;

document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  student_doc = await getUserDoc(CURRENT_STUDENT_UID);
  if (student_doc.data()?.parents?.[0]) {
    parent_doc = await getUserDoc(student_doc.data().parents[0]);
    renderHeader(
      student_doc.data().firstName + ' ' + student_doc.data().lastName,
      parent_doc.data().firstName + ' ' + parent_doc.data().lastName
    )
  }
  else {
    renderHeader(student_doc.data().firstName + ' ' + student_doc.data().lastName)
  }
  setUpLinks();
}

function getUserDoc(userUID) {
  return getDoc(doc(db, 'Users', userUID));
}

function setUpLinks() {
  const links = document.querySelectorAll('nav .links > a');
  links.forEach(link => {
    if (link.dataset.path) {
      const path = (link.dataset.path === 'student') ? '/' + student_doc.id : (link.dataset.path === 'parent') ? '/' + parent_doc?.id ?? '' : '';
      const htmlIndex = link.href.indexOf('.html');
      link.href = link.href.slice(0, htmlIndex) + path;
    }

    if (link.dataset.query) {
      const queries = link.dataset.query.split(',');
      if (queries.length > 0) {
        queries.forEach((query, index) => {
          const queryUID = query === 'student' ? student_doc.id : (query === 'parent') ? parent_doc?.id ?? '' : '';
          if (index === 0) {
            link.href += `?${query}=${queryUID}`
          }
          else {
            link.href += `&${query}=${queryUID}`
          }
        })
      }
    }
  })
}

function renderHeader(studentName, parentName = 'No Parent') {
  document.getElementById('studentName').textContent = studentName;
  document.getElementById('parentName').textContent = parentName;
}