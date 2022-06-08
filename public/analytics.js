async function updatePageReference() {
  try {
    const analyticsQuery = await firebase.firestore().collection('Analytics').get();
    
    await Promise.all(analyticsQuery.docs.map(doc => {
      const oldPage = doc.data().page;
  
      switch (oldPage) {
        case 'home':
          return doc.ref.update({ page: '/' });
        case 'why':
          return doc.ref.update({ page: '/why' });
        case 'team':
          return doc.ref.update({ page: '/team' });
        case 'pricing':
          return doc.ref.update({ page: '/pricing' });
        default:
          return;
      }
    }))
    return 'Pages have been updated!'
  }
  catch (error) {
    throw error;
  }
}

async function test() {
  try {
    return await updatePageReference();
  }
  catch (error) {
    return error
  }
}

function initialSetup() {

  getUserList()
  .then(userIDs  => {
    addSelectOptions(document.getElementById('user'), ['', ...userIDs], ['No User', ...userIDs]);
  })

  flatpickr('#start', {
    defaultDate: 'today',
    minDate: 'today',
    dateFormat: 'M j, Y h:i K',
    enableTime: true
  });

  flatpickr('#end', {
    defaultDate: 'today',
    minDate: 'today',
    dateFormat: 'M j, Y h:i K',
    enableTime: true
  });
}

async function getUserList() {
  const aggregateDoc = await firebase.firestore().collection('Analytics').doc('Aggregate').get();
  return aggregateDoc.data().userIDs;
}

async function runQuery() {
  // get all of the fields
  const user = document.getElementById('user').value || null;
  const event = document.getElementById('event').value || null;
  const page = document.getElementById('page').value || null;
  const start = document.getElementById('hasStart').checked ? document.getElementById('start')._flatpickr.selectedDates[0] : null;
  const end = document.getElementById('hasEnd').checked ? document.getElementById('end')._flatpickr.selectedDates[0] : null;
  const order = getRadioValue('order') || null;

  // console.log({
  //   user,
  //   event,
  //   page,
  //   start,
  //   end,
  //   order
  // })

  if ((!user && !start) || (!user && !end)) {
    if (!confirm('You are about to query for a LOT of documents. Are you sure you know what you are doing?')) return;
  }

  clearResults();

  let queryRef = firebase.firestore().collection('Analytics');
  if (user) { queryRef = queryRef.where('userID', '==', user) }
  if (event) { queryRef = queryRef.where('eventID', '==', event) }
  if (page) { queryRef = queryRef.where('page', '==', page) }
  if (start) { queryRef = queryRef.where('createdAt', '>=', start) }
  if (end) { queryRef = queryRef.where('createdAt', '<', end) }
  if (order) { queryRef = queryRef.orderBy('createdAt', order) }

  try {
    const queryResult = await queryRef.get();
    // console.log(queryResult.docs.map(doc => doc.data()))
    document.getElementById('numResults').textContent = queryResult.size.toString();
    queryResult.forEach(doc => {
      const data = doc.data();
      renderQueryResult(data.userID, data.eventID, data.page, data.createdAt.toDate(), JSON.stringify(data.additionalData));
    })
  }
  catch (error) {
    console.log(error)
    alert('check the console for an error. you may need to create a new query index.')
  }
}

function getRadioValue(radioName) {
  return document.querySelector(`input[name="${radioName}"]:checked`).value;
}

function renderQueryResult(user, event, page, time, additionalData) {
  const result = document.createElement('div');
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

function clearResults() {
  removeAllChildNodes(document.getElementById('results'));
  document.getElementById('numResults').textContent = '0';
}