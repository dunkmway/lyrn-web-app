const STUDENT_UID = queryStrings().student;
const PARENT_UID = queryStrings().parent;

async function initialSetup() {
  // initialize the search-inputs
  const parentSearch = document.getElementById('searchParent');
  const studentSearch = document.getElementById('searchStudent');

  parentSearch.getResults = async (prompt) => {
    return await queryUsersByRole(prompt, 'parent')
  };
  studentSearch.getResults = async (prompt) => {
    return await queryUsersByRole(prompt, 'student')
  };


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
  }).reduce((prev, curr) => prev + curr);

  document.getElementById('total').textContent = '$' + total.toFixed(2);
}

function formatInteger(e) {
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
  if (test(input.value)) {
    input.setAttribute('isvalid', true);
  }
  else {
    input.setAttribute('isvalid', false);
  }
}

function validatePositiveInteger(str) {
  return /^[1-9]\d*$/.test(str);
}

function validateCurrency(str) {
  return /^\$-?\d+\.\d{2}$/.test(str);
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