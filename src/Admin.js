import { getCurrentUser, getCurrentUserRole, requestSignOut } from "./_authorization";
import app from "./_firebase";
import { collection, getDocs, getFirestore, limit, orderBy, query, startAfter, startAt, where } from "firebase/firestore";
import Time from "./_Time";
import Dialog from "./_Dialog";

const PAGE_SIZE = 10;
const db = getFirestore(app);

let firstUserDoc_latest, lastUserDoc_latest;
let firstUserDoc_program, lastUserDoc_program;

document.addEventListener('DOMContentLoaded', initialSetup);
window.signOut = requestSignOut;

async function initialSetup() {
  const userSearch = document.getElementById('userSearch');
  userSearch.minChars = 3;
  userSearch.onInput = queryUsers;
  userSearch.onChange = searchResultClicked;

  document.getElementById('latestPrevious').addEventListener('click', latestPrevious);
  document.getElementById('latestNext').addEventListener('click', latestNext);

  initializeLatestUsersGrid();

  document.getElementById('programPrevious').addEventListener('click', programPrevious);
  document.getElementById('programNext').addEventListener('click', programNext);

  initializeProgramUsersGrid();

  renderSalutation();

  if (await getCurrentUserRole() === 'dev') {
    const devHome = document.createElement('button');
    devHome.className = 'button';
    devHome.textContent = 'Dev Home';
    devHome.addEventListener('click', () => window.location.href = '/Dashboard/Dev');
    document.querySelector('.buttons').appendChild(devHome);
  }
}

async function renderSalutation() {
  const hour = new Date().getHours();
  const currentUser = await getCurrentUser();
  const name = currentUser.displayName;

  let message;
  if (hour >= 0 && hour < 6) {
    message = `Go to bed, ${name}`;
  } else if (hour >= 6 && hour < 12) {
    message = `Good morning, ${name}`;
  } else if (hour >= 12 && hour < 18) {
    message = `Good afternoon, ${name}`;
  } else {
    message = `Good evening, ${name}`;
  }

  document.getElementById('salutation').textContent = message;
}

async function queryUsers(value) {
  let firstNameQuery = value.split(' ')[0];
  let lastNameQuery = value.split(' ')[1];

  if (firstNameQuery) {
    firstNameQuery = formatToName(firstNameQuery);
  }
  if (lastNameQuery) {
    lastNameQuery = formatToName(lastNameQuery);
  }

  if (firstNameQuery && !lastNameQuery) {
    try {
      const [ emailUserDocs, firstNameUserDocs, lastNameUserDocs ] = await Promise.all([
        // // emails
        // getDocs(query(
        //   collection(db, 'Users'),
        //   where('email', '>=', firstNameQuery.toLowerCase()),
        //   where('email', '<=', firstNameQuery.toLowerCase() + '\uf8ff'),
        //   orderBy('email'))
        // ),

        // skip the emails
        { docs: [] },
        //first names
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

      const results = [];
      emailUserDocs.docs.forEach(doc => {
        const data = doc.data();
        results.push({
          text: `${data.email} (${data.role})`,
          value: `${doc.id}:${data.role}`
        })
      })
      firstNameUserDocs.docs.forEach(doc => {
        const data = doc.data();
        results.push({
          text: `${data.firstName} ${data.lastName} (${data.role})`,
          value: `${doc.id}:${data.role}`
        })
      })
      lastNameUserDocs.docs.forEach(doc => {
        const data = doc.data();
        results.push({
          text: `${data.firstName} ${data.lastName} (${data.role})`,
          value: `${doc.id}:${data.role}`
        })
      })

      return results;
    }
    catch (error) {
      console.log(error)
      return [];
    }
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

      const results = [];
      userDocs.docs.forEach(doc => {
        const data = doc.data();
        results.push({
          text: `${data.firstName} ${data.lastName} (${data.role})`,
          value: `${doc.id}:${data.role}`
        })
      })

      return results;
    }
    catch (error) {
      console.log(error)
      return [];
    }
  }
}

function formatToName(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function searchResultClicked(value) {
  const [ userUID, userRole ] = value.split(':');

  switch (userRole) {
    case 'tutor':
      const dialog = new Dialog({
        message: "Where would you like to go?",
        choices: ['Test Taker', 'New Assignment', 'Edit Tutor'],
        values: ['testTaker', 'newAssignment', 'editTutor']
      })

      const place = await dialog.show();

      switch (place) {
        case 'testTaker':
          window.location.href = `/test-taker/${userUID}`
          break;
        case 'newAssignment':
          window.location.href = `/new-assignment?student=${userUID}`
          break;
        case 'editTutor':
          window.location.href = `/new-tutor?tutor=${userUID}`
          break;
        default:
      }

      break;
    case 'student':
      window.location.href = `/student-overview/${userUID}`;
      break;
    case 'parent':
      break;
    default: 
  }
}

async function initializeLatestUsersGrid() {
  // get the first page of user data
  const snapshot = await getLatestUserDocs();

  // remember the first and last of the page
  let allDocs = snapshot.docs;
  const hasNext = allDocs.length == PAGE_SIZE + 1;
  allDocs = allDocs.slice(0, PAGE_SIZE);
  firstUserDoc_latest = allDocs[0];
  lastUserDoc_latest = allDocs[allDocs.length - 1];
  
  //render it
  renderLatestUserPage(allDocs, false, hasNext);
}

function getLatestUserDocs() {
  const q = query(collection(db, 'Users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE + 1))
  return getDocs(q);
}

async function latestPrevious() {
  const q = query(
    collection(db, 'Users'),
    orderBy('createdAt'),
    startAfter(firstUserDoc_latest),
    limit(PAGE_SIZE + 1)
  )
  const snapshot = await getDocs(q);

  // remember the first and last of the page
  let allDocs = snapshot.docs;
  const hasPrev = allDocs.length == PAGE_SIZE + 1;
  allDocs = allDocs.slice(0, PAGE_SIZE);
  allDocs.reverse();
  firstUserDoc_latest = allDocs[0];
  lastUserDoc_latest = allDocs[allDocs.length - 1];

  renderLatestUserPage(allDocs, hasPrev, true)
}

async function latestNext() {
  const q = query(
    collection(db, 'Users'),
    orderBy('createdAt', 'desc'),
    startAfter(lastUserDoc_latest),
    limit(PAGE_SIZE + 1)
  )
  const snapshot = await getDocs(q);

  // remember the first and last of the page
  let allDocs = snapshot.docs;
  const hasNext = allDocs.length == PAGE_SIZE + 1;
  allDocs = allDocs.slice(0, PAGE_SIZE);
  firstUserDoc_latest = allDocs[0];
  lastUserDoc_latest = allDocs[allDocs.length - 1];

  renderLatestUserPage(allDocs, true, hasNext);
}

function renderLatestUserPage(userDocs, hasPrev = true, hasNext = true) {
  const prev = document.getElementById('latestPrevious');
  const next = document.getElementById('latestNext');
  const grid = document.getElementById('latestUsers');
  
  // handle the controls
  hasPrev ? prev.classList.remove('hidden') : prev.classList.add('hidden');
  hasNext ? next.classList.remove('hidden') : next.classList.add('hidden');

  // remove the old page
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }

  // add in the header
  const name = document.createElement('div');
  name.textContent = 'Name';
  name.className = 'grid-header';
  grid.appendChild(name);

  const created = document.createElement('div');
  created.textContent = 'Created At';
  created.className = 'grid-header';
  grid.appendChild(created);

  // add in the rows
  userDocs.forEach(userDoc => {
    const onClickEvent = () => window.location.href = `/test-taker/${userDoc.id}?mode=marketing`;
    const data = userDoc.data();
    const name = document.createElement('div');
    name.textContent = data.firstName + ' ' + data.lastName;
    name.addEventListener('click', onClickEvent);
    name.className = 'clickable';
    grid.appendChild(name);

    const created = document.createElement('div');
    created.textContent = new Time(data.createdAt.toDate()).toFormat('{MMMM} {ddd}, {yyyy} at {hh}:{mm} {A}');
    created.addEventListener('click', onClickEvent);
    created.className = 'clickable';
    grid.appendChild(created);
  })

}

async function initializeProgramUsersGrid() {
  // get the first page of user data
  const snapshot = await getProgramUserDocs();

  // remember the first and last of the page
  let allDocs = snapshot.docs;
  const hasNext = allDocs.length == PAGE_SIZE + 1;
  allDocs = allDocs.slice(0, PAGE_SIZE);
  firstUserDoc_program = allDocs[0];
  lastUserDoc_program = allDocs[allDocs.length - 1];
  
  //render it
  renderProgramUserPage(allDocs, false, hasNext);
}

function getProgramUserDocs() {
  const q = query(
    collection(db, 'Users'),
    where('isProgramStudent', '==', true),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE + 1)
  )
  return getDocs(q);
}

async function programPrevious() {
  const q = query(
    collection(db, 'Users'),
    where('isProgramStudent', '==', true),
    orderBy('createdAt'),
    startAfter(firstUserDoc_program),
    limit(PAGE_SIZE + 1)
  )
  const snapshot = await getDocs(q);

  // remember the first and last of the page
  let allDocs = snapshot.docs;
  const hasPrev = allDocs.length == PAGE_SIZE + 1;
  allDocs = allDocs.slice(0, PAGE_SIZE);
  allDocs.reverse();
  firstUserDoc_program = allDocs[0];
  lastUserDoc_program = allDocs[allDocs.length - 1];

  renderProgramUserPage(allDocs, hasPrev, true)
}

async function programNext() {
  const q = query(
    collection(db, 'Users'),
    where('isProgramStudent', '==', true),
    orderBy('createdAt', 'desc'),
    startAfter(lastUserDoc_program),
    limit(PAGE_SIZE + 1)
  )
  const snapshot = await getDocs(q);

  // remember the first and last of the page
  let allDocs = snapshot.docs;
  const hasNext = allDocs.length == PAGE_SIZE + 1;
  allDocs = allDocs.slice(0, PAGE_SIZE);
  firstUserDoc_program = allDocs[0];
  lastUserDoc_program = allDocs[allDocs.length - 1];

  renderProgramUserPage(allDocs, true, hasNext);
}

function renderProgramUserPage(userDocs, hasPrev = true, hasNext = true) {
  const prev = document.getElementById('programPrevious');
  const next = document.getElementById('programNext');
  const grid = document.getElementById('programUsers');
  
  // handle the controls
  hasPrev ? prev.classList.remove('hidden') : prev.classList.add('hidden');
  hasNext ? next.classList.remove('hidden') : next.classList.add('hidden');

  // remove the old page
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }

  // add in the header
  const name = document.createElement('div');
  name.textContent = 'Name';
  name.className = 'grid-header';
  grid.appendChild(name);

  const created = document.createElement('div');
  created.textContent = 'Created At';
  created.className = 'grid-header';
  grid.appendChild(created);

  // add in the rows
  userDocs.forEach(userDoc => {
    const onClickEvent = () => window.location.href = `/student-overview/${userDoc.id}`;
    const data = userDoc.data();
    const name = document.createElement('div');
    name.textContent = data.firstName + ' ' + data.lastName;
    name.addEventListener('click', onClickEvent);
    name.className = 'clickable';
    grid.appendChild(name);

    const created = document.createElement('div');
    created.textContent = new Time(data.createdAt.toDate()).toFormat('{MMMM} {ddd}, {yyyy} at {hh}:{mm} {A}');
    created.addEventListener('click', onClickEvent);
    created.className = 'clickable';
    grid.appendChild(created);
  })

}