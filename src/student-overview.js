import {getCurrentUserRole, goHome} from "./_authorization"
import app from "./_firebase";
import { getDoc, doc, getFirestore } from "firebase/firestore"

const db = getFirestore(app);
const CURRENT_STUDENT_UID = location.pathname.split('/')[2];

let student_doc = null;
let parent_doc = null;

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
