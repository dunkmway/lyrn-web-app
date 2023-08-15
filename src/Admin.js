import { getCurrentUser, requestSignOut } from "./_authorization";
import app from "./_firebase";
import { collection, getDocs, getFirestore, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import Time from "./_Time";

const PAGE_SIZE = 10;
const db = getFirestore(app);

let firstUserDoc, lastUserDoc;

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

  renderSalutation();
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

function searchResultClicked(value) {
  const [ userUID, userRole ] = value.split(':');

  switch (userRole) {
    case 'tutor':
      window.location.href = `/test-taker/${userUID}`;
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
  firstUserDoc = allDocs[0];
  lastUserDoc = allDocs[allDocs.length - 1];
  
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
    startAfter(firstUserDoc),
    limit(PAGE_SIZE + 1)
  )
  const snapshot = await getDocs(q);

  // remember the first and last of the page
  let allDocs = snapshot.docs.toReversed();
  const hasPrev = allDocs.length == PAGE_SIZE + 1;
  allDocs = allDocs.slice(0, PAGE_SIZE);
  firstUserDoc = allDocs[0];
  lastUserDoc = allDocs[allDocs.length - 1];

  renderLatestUserPage(allDocs, hasPrev, true)
}

async function latestNext() {
  const q = query(
    collection(db, 'Users'),
    orderBy('createdAt', 'desc'),
    startAfter(lastUserDoc),
    limit(PAGE_SIZE + 1)
  )
  const snapshot = await getDocs(q);

  // remember the first and last of the page
  let allDocs = snapshot.docs;
  const hasNext = allDocs.length == PAGE_SIZE + 1;
  allDocs = allDocs.slice(0, PAGE_SIZE);
  firstUserDoc = allDocs[0];
  lastUserDoc = allDocs[allDocs.length - 1];

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
    const data = userDoc.data();
    const name = document.createElement('div');
    name.textContent = data.firstName + ' ' + data.lastName;
    grid.appendChild(name);

    const created = document.createElement('div');
    created.textContent = new Time(data.createdAt.toDate()).toFormat('{MMMM} {ddd}, {yyyy} at {hh}:{mm} {A}');
    grid.appendChild(created);
  })

}