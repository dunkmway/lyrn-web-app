const ANONYMOUS_UID = firebase.firestore().collection('Users').doc().id

function initialSetup() {
  const nameSearchInput = debounce(() => queryUsers(), 500);
  document.getElementById('nameSearch').addEventListener('input', nameSearchInput);

  getTests()
  queryUsers()

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

function debounce(func, timeout = 300){
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
  }
  const nameResultsWrapper =  document.getElementById('nameSearchResults');
  removeAllChildNodes(nameResultsWrapper);

  renderNameSearchResult('ANONYMOUS USER', 'anonymous');
  if (firstNameQuery && !lastNameQuery) {
    const firstNameUserDocs = await firebase.firestore().collection('Users')
    .where('firstName', '>=', firstNameQuery)
    .where('firstName', '<=', firstNameQuery + '\uf8ff')
    .orderBy('firstName')
    .get();

    const lastNameUserDocs = await firebase.firestore().collection('Users')
    .where('lastName', '>=', firstNameQuery)
    .where('lastName', '<=', firstNameQuery + '\uf8ff')
    .orderBy('lastName')
    .get();

    firstNameUserDocs.docs.forEach(doc => {
      renderNameSearchResult(doc.data().firstName + ' ' + doc.data().lastName + ' (' + doc.data().role + ')', doc.id);
    })
    lastNameUserDocs.docs.forEach(doc => {
      renderNameSearchResult(doc.data().firstName + ' ' + doc.data().lastName + ' (' + doc.data().role + ')', doc.id);
    })
  }
  else if (firstNameQuery && lastNameQuery) {
    try {
      const userDocs = await firebase.firestore().collection('Users')
      .where('firstName', '==', firstNameQuery)
      .where('lastName', '>=', lastNameQuery)
      .where('lastName', '<=', lastNameQuery + '\uf8ff')
      .orderBy('lastName')
      .get();

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

  // re-run the query
  queryUsers(false);
}

async function getTests() {
  const testDocs = await firebase.firestore().collection('ACT-Tests')
  .where('type', '==', 'test')
  .get();

  addSelectOptions(document.getElementById('testList'), testDocs.docs.map(doc => doc.id), testDocs.docs.map(doc => doc.data().test));
}

async function setAssignment() {
  document.querySelectorAll('button').forEach(button => button.disabled = false);
  document.getElementById('testTakerLink').textContent = '';

  const student = document.getElementById('nameSearch').dataset.value;
  const test = document.getElementById('testList').value;
  const section = document.getElementById('sections').value;
  const open = document.getElementById('open')._flatpickr.selectedDates[0];
  const close = document.getElementById('close')._flatpickr.selectedDates[0];
  const program = document.getElementById('programs').value;

  if(!student || !test || !section || !open || !close || !program) {
    customConfirm(
      'Check that all values have been inputted.',
      '',
      'OK',
      () => {},
      () => {}
    );

    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return;
  }

  // set the date to the earliest right now
  if (open.getTime() < new Date().getTime()) { open = new Date(); };

  // check for impossible open and close times
  if (open.getTime() >= close.getTime()) {
    customConfirm(
      'You have impossible open and close times.',
      '',
      'OK',
      () => {},
      () => {}
    );

    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return;
  }

  if (student == 'anonymous') {
    await firebase.firestore().collection('Section-Assignments').doc().set({
      student: ANONYMOUS_UID,
      test,
      section,
      open,
      close,
      program,
      status: 'new'
    })

    document.getElementById('testTakerLink').textContent = `https://lyrnwithus.com/test-taker?student=${ANONYMOUS_UID}`;
    document.getElementById('testTakerLink').href = `https://lyrnwithus.com/test-taker?student=${ANONYMOUS_UID}`;
  }
  else {
    await firebase.firestore().collection('Section-Assignments').doc().set({
      student,
      test,
      section,
      open,
      close,
      program,
      status: 'new'
    })

    document.getElementById('testTakerLink').textContent = `https://lyrnwithus.com/test-taker?student=${student}`;
    document.getElementById('testTakerLink').href = `https://lyrnwithus.com/test-taker?student=${student}`;
  }

  Toastify({
    text: 'Assignment Sent!'
  }).showToast();
  document.querySelectorAll('button').forEach(button => button.disabled = false);
}