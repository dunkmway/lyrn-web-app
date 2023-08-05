let currentUserList = [];
let currentListener = null;

const TEST_SCORE_CUTOFF = 8;    // this is the lowest score a test can get to count it as having taken the marketing test

const KNOWN_USER_IDS = {
  // ['zWjgHSqrlS6jBvvp3hUY']: "Matthew's Desktop - personal",
  // ['DWlhJO3Tvzx7zLqoZxmW']: "Matthew's Desktop - lyrnwithus",
  // ['pSyrI5i05CRM18aYFLTb']: "Matthew's Desktop - admin",
  // ['2plGxurOVBeUEWL83Eno']: "Matthew's Phone",

  // ['VFPhnB3DKhKbUwxkqdKA']: "Duncan's Phone",
  // ['Vho928gkqqzM9GASHoMC']: "Duncan's Safari - localhost",
  // ['yzlsMrVq9orTiT7Cud8B']: "Duncan's Safari",
  // ['lZ9h4vL72vYWcT7W4J24']: "Duncan's Ipad",

  // v1
  ['bw6dv06q3utBy518aLdw']: "Duncan's PC"
}

function initialSetup() {

  setUserListListener();
  getSourceStats();
  getTestTakerStats();

  flatpickr('#start', {
    defaultDate: 'today',
    dateFormat: 'M j, Y h:i K',
    enableTime: true
  });

  flatpickr('#end', {
    defaultDate: new Date(new Date().setHours(24,0,0,0)),
    dateFormat: 'M j, Y h:i K',
    enableTime: true
  });
}

function updateUserList(aggregateDoc) {
  // set the currentUserList to the fresh values
  currentUserList = aggregateDoc.data().analyticsIDs;

  //get the current option's value so we can attempt to set it again afterwards
  const currentValue = document.getElementById('user').value || '';

  // remove all stale options
  removeAllChildNodes(document.getElementById('user'));

  // add in the fresh options
  addSelectOptions(
    document.getElementById('user'),
    ['', ...currentUserList], 
    ['No User', ...currentUserList.map((id, index) => KNOWN_USER_IDS[id] ?? index)]
  );

  //reselect the selected option
  document.getElementById('user').value = currentValue;
}

async function setUserListListener() {
  firebase.firestore().collection('Analytics').doc('_Aggregate')
  .onSnapshot(updateUserList, (error) => {
    console.log(error);
    alert('error while loading user list');
  });
}

function runQuery() {
  // get all of the fields
  const user = document.getElementById('user').value || null;
  const event = document.getElementById('event').value || null;
  const page = document.getElementById('page').value || null;
  const start = document.getElementById('hasStart').checked ? document.getElementById('start')._flatpickr.selectedDates[0] : null;
  const end = document.getElementById('hasEnd').checked ? document.getElementById('end')._flatpickr.selectedDates[0] : null;
  const order = getRadioValue('order') || null;

  if ((!user && !start) || (!user && !end)) {
    if (!confirm('You are about to query for a LOT of documents. Are you sure you know what you are doing?')) return;
  }

  clearResults();
  currentListener && currentListener();

  let queryRef = firebase.firestore().collection('Analytics');
  if (user) { queryRef = queryRef.where('userID', '==', user) }
  if (event) { queryRef = queryRef.where('eventID', '==', event) }
  if (page) { queryRef = queryRef.where('page', '==', page) }
  if (start) { queryRef = queryRef.where('createdAt', '>=', start) }
  if (end) { queryRef = queryRef.where('createdAt', '<', end) }
  if (order) { queryRef = queryRef.orderBy('createdAt', order) }

  currentListener = queryRef.onSnapshot(queryResult => {
    // when the user is at the bottom of the page we want to keep the scroll at the bottom
    const isAtBottom = isAtBottomOfPage();
    const resultsHasChildren = document.getElementById('results').hasChildNodes();

    document.getElementById('numResults').textContent = queryResult.size.toString();
    queryResult.forEach(doc => {
      const data = doc.data();
      renderQueryResult(
        doc.id,
        KNOWN_USER_IDS[data.userID] ?? currentUserList.indexOf(data.userID), 
        data.eventID, 
        data.page, 
        data.createdAt.toDate(), 
        JSON.stringify(data.additionalData)
      );
    })

    // put them back at the bottom if they were there before
    if (isAtBottom && resultsHasChildren) {
      scrollToBottom();
    }
  }, (error) => {
    console.log(error);
    alert('check the console for an error. you may need to create a new query index.');
  })
}

function isAtBottomOfPage() {
  return (window.innerHeight + window.pageYOffset) >= document.body.scrollHeight;
}

function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight - window.innerHeight);
}

function getRadioValue(radioName) {
  return document.querySelector(`input[name="${radioName}"]:checked`).value;
}

function renderQueryResult(resultID, user, event, page, time, additionalData) {
  if (document.getElementById(resultID)) {
    let result = document.getElementById(resultID);
    result.innerHTML = `
    <p>User: ${user}</p>
    <p>Event: ${event}</p>
    <p>Page: ${page}</p>
    <p>Time: ${convertFromDateInt(time.getTime()).veryLongReadable}</p>
    <p>Additional Data: ${additionalData ?? 'null'}</p>
    `
  }
  else {
    let result = document.createElement('div');
    result.id = resultID;
    result.classList.add('result');
    result.innerHTML = `
    <p>User: ${user}</p>
    <p>Event: ${event}</p>
    <p>Page: ${page}</p>
    <p>Time: ${convertFromDateInt(time.getTime()).veryLongReadable}</p>
    <p>Additional Data: ${additionalData ?? 'null'}</p>
    `

    document.getElementById('results').appendChild(result);
  }
}

function clearResults() {
  removeAllChildNodes(document.getElementById('results'));
  document.getElementById('numResults').textContent = '0';
}

async function getSourceStats() {
  const list = document.querySelector('#source-stats > ul');

  const sourceQuery = await firebase.firestore().collection('Analytics')
  .where('eventID', '==', 'source')
  .get();

  const conversionQuery = await firebase.firestore().collection('Analytics')
  .where('eventID', '==', 'sign-up')
  .get();

  let convertedAnalytics = new Set();

  conversionQuery.docs.forEach(doc => {
    convertedAnalytics.add(doc.data().analyticsID);
  })

  const sources = sourceQuery.docs.reduce((prev, curr) => {
    const data = curr.data();
    const analyticsID = data.analyticsID;
    const source = data.data.source;
    const isConverted = convertedAnalytics.has(analyticsID);

    if (!prev[source]) {
      prev[source] = {
        source: 0,
        signUp: 0
      }
    }

    prev[source].source++;
    prev.totalSource++;

    if (isConverted) {
      prev[source].signUp++;
      prev.totalSignUp++
    }

    return prev;
  }, {
    totalSource: 0,
    totalSignUp: 0
  })

  for (const source in sources) {
    if (source === 'totalSource') continue;
    if (source === 'totalSignUp') continue;

    const item = document.createElement('li');
    item.textContent = `${source}: ${sources[source].source} out of ${sources.totalSource} (${sources[source].signUp} sign up)`;
    list.appendChild(item);
  }
}

async function getTestTakerStats() {
  const list = document.querySelector('#marketing-testTaker-stats > ul');

  const testQuery = await firebase.firestore().collection('ACT-Assignments')
  .where('type', '==', 'marketing')
  .get();

  const testsPerStudent = testQuery.docs.reduce((prev, curr) => {
    const student = curr.data().student;
    const isGraded = curr.data().status === 'graded';
    const score = curr.data().scaledScore;

    if (!prev[student]) {
      prev[student] = 0;
    }

    if (isGraded && score >= TEST_SCORE_CUTOFF) {
      prev[student]++
    }

    return prev;

  }, {})

  let counts = {};
  for (const student in testsPerStudent) {
    const count = testsPerStudent[student];
    if (counts[count]) {
      counts[count]++
    } else {
      counts[count] = 1;
    }
  }

  for (const count in counts) {
    const item = document.createElement('li');
    item.textContent = `${count} test taken: ${counts[count]} students`;
    list.appendChild(item);
  }

}