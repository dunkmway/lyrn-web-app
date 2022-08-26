const STUDENT_UID = queryStrings().student;
const PARENT_UID = queryStrings().parent;

const ONLINE_LOCATION_UID = 'WIZWBumUoo7Ywkc3pl2G';
const EXPIRATION_HOURS = 48;

let currentEventDocs = [];


async function initialSetup() {
  recalculateTotal();

  // initialize the search-inputs
  const parentSearch = document.getElementById('searchParent');
  const studentSearch = document.getElementById('searchStudent');

  parentSearch.getResults = async (prompt) => {
    return await queryUsersByRole(prompt, 'parent')
  };
  studentSearch.getResults = async (prompt) => {
    return await queryUsersByRole(prompt, 'student')
  };

  // listen to changes on the student search to setup events
  studentSearch.addEventListener('change', (e) => setupEvents(e.target.value))

  if (PARENT_UID) {
    const parentDoc = await getUserDoc(PARENT_UID);
    if (parentDoc.exists) {
      await parentSearch.select(`${parentDoc.data().firstName} ${parentDoc.data().lastName}`, parentDoc.id);
      parentSearch.disable(true);
    }
  }
  if (STUDENT_UID) {
    const studentDoc = await getUserDoc(STUDENT_UID);
    if (studentDoc.exists) {
      await studentSearch.select(`${studentDoc.data().firstName} ${studentDoc.data().lastName}`, studentDoc.id);
      studentSearch.disable(true);
    }
    await setupEvents(STUDENT_UID);
  }

  // type is also searchable
  const typeSearch = document.getElementById('type');
  const locationDoc = await firebase.firestore()
  .collection('Locations').doc(ONLINE_LOCATION_UID)
  .get()

  let lessonTypes = locationDoc.data()
  .lessonTypes.map(type => {
    return {
      text: type.name,
      value: type.value
    }
  })

  // add in miscellaneaous
  lessonTypes.push({
    text: 'Miscellaneous',
    value: 'miscellaneous'
  })

  typeSearch.getResults = (prompt) => {
    // if there is no prompt then return everything
    if (prompt === '') {
      return lessonTypes;
    } 

    // else look for text that includes the prompt
    const regex = new RegExp(`${prompt}`, 'ig');
    return lessonTypes.filter(type => regex.test(type.text));
  }
}

function getUserDoc(userUID) {
  return firebase.firestore()
  .collection('Users').doc(userUID)
  .get()
}

async function queryUsersByRole(prompt, role) {
  let firstNameQuery = prompt.split(' ')[0];
  let lastNameQuery = prompt.split(' ')[1];

  if (firstNameQuery) {
    firstNameQuery = formatToName(firstNameQuery);
  }
  if (lastNameQuery) {
    lastNameQuery = formatToName(lastNameQuery);
  }

  if (firstNameQuery && !lastNameQuery) {
    let results = [];
    try {
      const firstNameUserDocs = await firebase.firestore().collection('Users')
      .where('role', '==', role)
      .where('firstName', '>=', firstNameQuery)
      .where('firstName', '<=', firstNameQuery + '\uf8ff')
      .orderBy('firstName')
      .get();

      const lastNameUserDocs = await firebase.firestore().collection('Users')
      .where('role', '==', role)
      .where('lastName', '>=', firstNameQuery)
      .where('lastName', '<=', firstNameQuery + '\uf8ff')
      .orderBy('lastName')
      .get();

      firstNameUserDocs.docs.forEach(doc => {
        results.push({
          text: `${doc.data().firstName} ${doc.data().lastName}`,
          value: doc.id
        })
      })
      lastNameUserDocs.docs.forEach(doc => {
        results.push({
          text: `${doc.data().firstName} ${doc.data().lastName}`,
          value: doc.id
        })
      })

      return results;
    }
    catch (error) {
      console.log(error)
    }
  }
  else if (firstNameQuery && lastNameQuery) {
    let results = [];
    try {
      const userDocs = await firebase.firestore().collection('Users')
      .where('role', '==', role)
      .where('firstName', '==', firstNameQuery)
      .where('lastName', '>=', lastNameQuery)
      .where('lastName', '<=', lastNameQuery + '\uf8ff')
      .orderBy('lastName')
      .get();

      userDocs.docs.forEach(doc => {
        results.push({
          text: `${doc.data().firstName} ${doc.data().lastName}`,
          value: doc.id
        })
      })

      return results;
    }
    catch (error) {
      console.log(error)
    }
  }
  else {
    return [];
  }
}

function formatToName(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function setupEvents(student) {
  const events = await getEvents(student);
  currentEventDocs = events;
  renderEvents(events);
}

function getEvents(studentUID) {
  return firebase.firestore()
  .collectionGroup('Attendees')
  .where('student', '==', studentUID)
  .get()
  .then(snapshot => {
    return Promise.all(snapshot.docs
    .map(attendeeDoc => attendeeDoc.ref.parent.parent.get()))
    .then(events => events.sort((a,b) => a.data().start - b.data().start))
  });
}

function renderEvents(eventDocs) {
  const grid = document.getElementById('events-wrapper');
  removeAllChildNodes(grid);

  // 

  eventDocs.forEach((eventDoc, index) => {
    const eventWrapper = document.createElement('div');
    const title = eventDoc.data().title;
    const start = new Time(eventDoc.data().start).toFormat('{EEE}, {MMM} {ddd}, {yyyy} at {hh}:{mm} {a}');

    eventWrapper.innerHTML = `
      <label for='event-${index}'>${title}: ${start}</label>
      <input id='event-${index}' type='checkbox' value='${eventDoc.id}'>
    `;

    grid.appendChild(eventWrapper);
  })
}

/**
 * add item row into items-wrapper table
 */
function addItemRow() {
  const table = document.getElementById('items-wrapper');
  const tableBody = table.querySelector('tbody');

  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td class='description'><input type="text"></td>
    <td class='quantity'><input type="text" value='1'></td>
    <td class='price'><input type="text" value='$0.00'></td>
    <td class='remove'><button></button></td>
  `;

  tableBody.appendChild(newRow);

  newRow.querySelector('.description > input').addEventListener('input', (e) => { checkInputValidity(e.target, validateAnyString) })
  newRow.querySelector('.quantity > input').addEventListener('keydown', (e) => { formatInteger(e), recalculateTotal() })
  newRow.querySelector('.price > input').addEventListener('keydown', (e) => { formatCurrency(e), recalculateTotal() })
  newRow.querySelector('.remove > button').addEventListener('click', (e) => { removeRow(e), recalculateTotal() })
}

function removeRow(e) {
  e.target.parentNode.parentNode.remove()
}

function recalculateTotal() {
  const rows = Array.from(document.querySelectorAll('#items-wrapper tbody tr'));

  const total = rows.map(row => {
    let quantity = row.querySelector('.quantity > input').value;
    let price = row.querySelector('.price > input').value;

    if (validatePositiveInteger(quantity) && validateCurrency(price)) {
      price = price.replace('$', '');
      return +price * +quantity;
    }
    return 0;
  }).reduce((prev, curr) => prev + curr, 0);

  document.getElementById('total').textContent = '$' + total.toFixed(2);
}

function formatInteger(e) {
  // special characters are allowed
  if (e.key === 'Tab') return

  e.preventDefault();
  if (e.key === 'Backspace' || isValidPositiveIntegerChar(e.key)) {
    let isNegative = e.target.value.charAt(0) === '-';

    if (e.key === '-') {
      isNegative = !isNegative;
    }

    // remove the negative for now
    e.target.value = e.target.value.replace('-', '');

    // if the backspace was pressed then pop the last char on the string
    if (e.key === 'Backspace') {
      e.target.value = e.target.value.slice(0, -1);
    }
    // else we push the new char in
    else {
      e.target.value = e.target.value + e.key;
    }

    // if the string is all 0's then force it to be 0
    if (/^0+$/.test(e.target.value)) {
      e.target.value = '0';
    }

    // add back the negative
    if (isNegative && e.target.value !== '0' && e.target.value !== '') {
      e.target.value = '-' + e.target.value
    }
  }
}

function formatCurrency(e) {
  // special characters are allowed
  if (e.key === 'Tab') return

  e.preventDefault();
  if (e.key === 'Backspace' || isValidIntegerChar(e.key)) {
    // remove the decimal point for ease
    e.target.value = e.target.value.replace('.', '').replace('$', '');

    let isNegative = e.target.value.charAt(0) === '-';

    if (e.key === '-') {
      isNegative = !isNegative;
    }

    // remove the negative for now
    e.target.value = e.target.value.replace('-', '');

    // if the backspace was pressed then pop the last char on the string
    if (e.key === 'Backspace') {
      e.target.value = e.target.value.slice(0, -1);
      if (e.target.value.length < 3) {
        e.target.value = '0' + e.target.value;
      }
    }
    // else we push the new char in
    else if (e.key !== '-') {
      e.target.value = e.target.value + e.key;

      // if the length of the string is 4 and the first char is a zero, pop it
      if (e.target.value.length === 4 && e.target.value.charAt(0) === '0') {
        e.target.value = e.target.value.slice(1);
      }
    }

    // add back the negative
    if (isNegative) {
      e.target.value = '-' + e.target.value
    }

    // place the decimal back and the4 dollar sign
    e.target.value = '$' + e.target.value.slice(0, -2) + '.' + e.target.value.slice(-2);
  }
}

function isValidPositiveIntegerChar(char) {
  return char !== '-' && isValidIntegerChar(char);
}

function isValidIntegerChar(char) {
  return /^[-\d]$/.test(char);
}

function checkInputValidity(input, test) {
  const response = test(input.value);
  // if the test responds then that is the error
  if (response) {
    input.setAttribute('data-isvalid', false);

    const error = document.createElement('div');
    error.className = 'error-msg';
    error.setAttribute('data-msg', response);
    input.after(error);

    return false;
  } else {
    // else no response means we're clear
    input.removeAttribute('data-isvalid');

    const error = input.nextElementSibling;
    if (error && error.className === 'error-msg') {
      error.remove();
    }
    return true;
  }
}

function validatePositiveInteger(str) {
  if (/^[1-9]\d*$/.test(str)) {
    return null;
  }
  else {
    return 'Must be a positve integer.';
  }
}

function validateCurrency(str) {
  if (/^\$-?\d+\.\d{2}$/.test(str)) {
    return null;
  }
  else {
    return 'Must be a currency value.';
  }
}

function validateAnyString(str) {
  if (/^.+$/.test(str)) {
    return null;
  }
  else {
    return 'A value is required.';
  }
}

function getKeypressSequence(func, timeout = 1000) {
  let timer;
  let sequence = [];
  return (e) => {
    sequence.push(e.key);
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(sequence);
      sequence = [];
    }, timeout);
  };
}

document.body.addEventListener('keydown', getKeypressSequence((sequence) => {
  // verify the konami code
  if (sequence.length !== 11) return;

  const code = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
    'Enter',
  ]

  for (let i = 0; i < code.length; i++) {
    const key = code[i];
    if (key !== sequence[i]) return;
  }

  document.getElementById('super-secret').classList.remove('hidden');
  
}))

function parseJSON(json) {
  return JSON.parse(json, (key, value) => {
    if (typeof value === 'string') {
      let dateMatch = /\$Date\((-?.*)\)/.exec(value);
      if (dateMatch !== null) {
        if (dateMatch[1] === "") {
          return new Date();
        }
        if (!isNaN(+dateMatch[1])) {
          return new Date(+dateMatch[1])
        }
        dateMatch[1] = dateMatch[1].split(/,\s*/);
        if (dateMatch[1].length > 1) {
          dateMatch[1] = dateMatch[1].map(str => +str);
        }
        return new Date(...dateMatch[1])
      }
    }
    
    return value
  })
}

async function submitInvoice() {
  // disable all buttons
  document.querySelectorAll('button').forEach(button => button.disabled = true);

  // make all inputs valid again
  document.querySelectorAll('input, search-input').forEach(input => {
    input.removeAttribute('data-isvalid');
    const error = input.nextElementSibling;
    if (error && error.className === 'error-msg') {
      error.remove();
    }
  });


  const isUsingSecret = document.getElementById('use-secret').checked;

  if (isUsingSecret) {
    const json = document.getElementById('super-secret').querySelector('textarea').value;
    const data = parseJSON(json);

    data.createdAt = new Date();
    data.expiration = new Date(new Date().setHours(new Date().getHours() + EXPIRATION_HOURS));

    try {
      await firebase.firestore()
      .collection('Invoices').doc()
      .set(data);

      Dialog.toastMessage('Invoice successfully saved.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
    }
    catch (error) {
      console.error(error);
      Dialog.toastError('An error has occured. We could not save this invoice.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
    }
  }
  else {
    // parent and student
    const parentElem = document.getElementById('searchParent');
    const studentElem = document.getElementById('searchStudent');

    // check validity
    const parentValid = checkInputValidity(parentElem, validateAnyString);
    const studentValid = checkInputValidity(studentElem, validateAnyString);

    // get the items
    const items = Array.from(document.querySelectorAll('#items-wrapper tbody > tr'))
    .map(row => {
      // every row must be completey filled out
      const descriptionElem = row.querySelector('.description > input');
      const quantityElem = row.querySelector('.quantity > input');
      const priceElem = row.querySelector('.price > input');

      // validate all of the input
      const validations = [
        checkInputValidity(descriptionElem, validateAnyString),
        checkInputValidity(quantityElem, validatePositiveInteger),
        checkInputValidity(priceElem, validateCurrency)
      ]

      // if a single input is invalid
      if (!validations.reduce((prev, curr) => prev && curr, true)) return null;

      // else return the data
      return {
        description: descriptionElem.value,
        quantity: parseInt(quantityElem.value),
        price: parseInt(priceElem.value.replace('$', '')) * 100
      }
    });

    const oneTime = document.getElementById('oneTime').checked;
    const recurring = document.getElementById('recurring').checked;

    const events = Array.from(document.querySelectorAll('#events-wrapper input:checked'))
    .map(event => event.value);

    const typeElem = document.getElementById('type');
    const typeValid = checkInputValidity(typeElem, validateAnyString);

    // check validation and return if not valid
    if (!parentValid || !studentValid) {
      Dialog.toastError('Please select a parent and student.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
      return
    }

    // if a single item is null
    if (!items.reduce((prev, curr) => prev && curr, true)) {
      Dialog.toastError('Please correct the indicated fields.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
      return;
    }

    if (items.length == 0) {
      Dialog.toastError('At least one item must be selected.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
      return;
    }

    // if not either payment option
    if (!(oneTime || recurring)) {
      Dialog.toastError('At least one payment method must be selected.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
      return;
    }

    // if recurring but no events
    if (recurring && events.length === 0) {
      Dialog.toastError('Recurring payments require events to be selected.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
      return;
    }

    // if no type
    if (!typeValid) {
      Dialog.toastError('Please select a type.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
      return;
    }

    const data = {
      parent: parentElem.value,
      student: studentElem.value,
      items,
      events,
      type: typeElem.value,
      createdAt: new Date(),
      expiration: new Date(new Date().setHours(new Date().getHours() + EXPIRATION_HOURS)),
      status: 'pending'
    }

    if (oneTime) {
      data.initialPayment = items.reduce((prev, curr) => prev + (curr.price * curr.quantity), 0);
      data.percentOff = 10;
      data.schedule = [];
    } else if (recurring) {
      data.initialPayment = items[0].price * (items[0].quantity < 2 ? items[0].quantity : 2);
      data.percentOff = 0;
      data.schedule = currentEventDocs
      .filter(doc => events.includes(doc.id))
      .map(doc => new Date(doc.data().start));
    }

    try {
      // save the invoice
      await firebase.firestore()
      .collection('Invoices').doc()
      .set(data)

      Dialog.toastMessage('Invoice successfully saved.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
    }
    catch(error) {
      console.error(error);
      Dialog.toastError('An error has occured. We could not save this invoice.');
      document.querySelectorAll('button').forEach(button => button.disabled = false);
    }

  }
}