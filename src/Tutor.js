import { getCurrentUser, requestSignOut } from "./_authorization";
import app from "./_firebase";
import { collection, getDocs, getFirestore, orderBy, query, where } from "firebase/firestore";

const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', initialSetup);
window.signOut = requestSignOut;

window.goToTestTaker = async () => {
  window.location.href = `/test-taker/${(await getCurrentUser()).uid}`
}
window.goToFullTest = async () => {
  window.location.href = `/test-taker/${(await getCurrentUser()).uid}?mode=marketing`
}
window.goToNewAssignment = async () => {
  window.location.href = `/new-assignment?student=${(await getCurrentUser()).uid}`
}

async function initialSetup() {
  const userSearch = document.getElementById('userSearch');
  userSearch.minChars = 3;
  userSearch.onInput = queryUsers;
  userSearch.onChange = searchResultClicked;

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
        // skip the emails
        { docs: [] },
        //first names
        getDocs(query(
          collection(db, 'Users'),
          where('role', '==', 'student'),
          where('firstName', '>=', firstNameQuery),
          where('firstName', '<=', firstNameQuery + '\uf8ff'),
          orderBy('firstName')
        )),
        // last names
        getDocs(query(
          collection(db, 'Users'),
          where('role', '==', 'student'),
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
        where('role', '==', 'student'),
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
  window.location.href = `/student-overview/${userUID}`;
}