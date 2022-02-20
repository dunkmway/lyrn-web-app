async function testing() {
  const tests = await getAllTests();
  console.log(tests.map(doc => doc.data()))
}

testing();

const errorMsg = document.querySelector('.error')
let studentData = null;

async function getAllLocations() {
  return await firebase.firestore().collection('Locations').orderBy('locationName').get()
}

async function getAllTests() {
  const testDocs = await firebase.firestore().collection('ACT-Tests').where('type', '==', 'test').get();
  const monthNumber = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11
  }

  const tests = testDocs.docs.sort((a, b) => {
    aData = a.data();
    bData = b.data();

    if (aData.year == bData.year) {
      return (monthNumber[aData.month] ?? -1) - (monthNumber[bData.month] ?? -1);
    }
    else {
      return aData.year - bData.year;
    }
  })

  return tests;
}

async function getLocationStudents(locationUID) {
  return await firebase.firestore().collection('Users').where('location', '==', locationUID).where('role', '==', 'student').get()
}

function toggleLoading(elementID) {
  document.getElementById(elementID).closest('.loading-wrapper').classList.toggle('loading');
}

async function initialSetup() {
  $('.ui.dropdown').dropdown();

  toggleLoading('location')
  toggleLoading('tests')

  // get the locations
  const locationDocs = await getAllLocations();

  let locationUIDs = [];
  let locationNames = [];

  locationDocs.forEach(doc => {
    locationUIDs.push(doc.id);
    locationNames.push(doc.data().locationName)
  })

  addSelectOptions(document.getElementById("location"), locationUIDs, locationNames);
  toggleLoading('location')

  // get the tests
  const testDocs = await getAllTests();

  let testUIDs = [];
  let testNames = [];

  testDocs.forEach(doc => {
    testUIDs.push(doc.id);
    testNames.push(doc.data().month + " " + doc.data().year + " - " + doc.data().test)
  })

  $('#tests').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
  $('#tests').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
  $('#tests').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
  $('#tests').closest(".ui.dropdown").dropdown('setting', 'onChange', (value, text) => {
    const testList = document.getElementById('testList');

    let newTest = document.createElement('div')
  });

  addSelectOptions(document.getElementById("tests"), testUIDs, testNames);
  toggleLoading('tests')

  //determine if this is a new student or updating
  if (queryStrings().student) {
    //updating
    fillInData();

    document.getElementById('action').innerHTML = 'Update';
    document.getElementById('action').addEventListener('click', update);
    document.getElementById('title').textContent = 'Update ACT Fundamentals Student';
  }
  else {
    //submitting
    document.getElementById('action').innerHTML = 'Submit';
    document.getElementById('action').addEventListener('click', submit);
    document.getElementById('title').textContent = 'Add ACT Fundamentals Student';
  }
}

async function locationCallback(elem) {
  const locationUID = elem.value;

  toggleLoading('student')

  const studentPromise = getLocationStudents(locationUID)
  .then(studentDocs => {
    let studentUIDs = [];
    let studentIdentifiers = [];

    studentDocs.forEach(doc => {
      studentUIDs.push(doc.id);
      studentIdentifiers.push(`${doc.data().firstName} ${doc.data().lastName} (${doc.data().email})`)
    })
    $('#student').dropdown('clear')
    $('#student').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
    $('#student').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
    $('#student').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
    document.getElementById('student').innerHTML = '<option value="" disabled selected>select a student</option>';
    addSelectOptions(document.getElementById('student'), studentUIDs, studentIdentifiers);

    toggleLoading('student')
  })

  return await Promise.all([studentPromise]);
}

async function fillInData() {
  const studentUID = queryStrings().student;
  const studentDoc = await firebase.firestore().collection('Users').doc(studentUID).get();

  studentData = studentDoc.data()

  //use this for the regular fields (special case for semantic ui weirdness)
  document.querySelectorAll('input:not(.search)').forEach(input => {
    input.value = studentDoc.data()[input.id];
  })

  //deal with the select (especially changing location then semantic ui select)
  document.getElementById('location').value = studentData.location;
  await locationCallback(document.getElementById('location'));
  $('#parents').closest(".ui.dropdown").dropdown('set selected', studentData.parents);
  $('#blacklistTutors').closest(".ui.dropdown").dropdown('set selected', studentData.blacklistTutors);
  return;
}

async function submit() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to submit this student?')) {
    toggleWorking();
    return;
  }

  try {
    //split based on if we have an email
    const userUID = await (values.email ? addUserWithEmail(values) : addUserWithoutEmail(values));
    //adding user with email can fail if the email is already in use. Not an error so catch it here
    if (!userUID) {
      toggleWorking();
      return;
    } 

    await updateUserDisplayName(userUID, values)
    await addUserDoc(userUID, values);
  }
  catch (error) {
    console.log(error)
    alert('We encountered an error while adding this student.')
  }

  clearFields();
  toggleWorking();
  //finish with a toast message
  Toastify({
    text: 'Student successfully submitted'
  }).showToast();
  return;
}

async function update() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to update this student?')) {
    toggleWorking();
    return;
  }

  const studentUID = queryStrings().student;

  //split based on if we had an email before updating and if we have an email now
  //check if we had an email before
  if (studentData.email) {
    //had email now check if the email is the same
    if (studentData.email === values.email) {
      //RESULT: same email as before
      //update just the user doc
      await updateUserDoc(studentUID, values);
    }
    else {
      //RESULT: different email
      //update the user email and doc
      await updateUserEmail(studentUID, values);
      await updateUserDoc(studentUID, values);
    }
  }
  else {
    // didn't have email now check if we have one now
    if (values.email) {
      //RESULT: first time getting the email
      //add the user to firebase and use the old UID
      await addUserWithUID(studentUID, values);
      await updateUserDoc(studentUID, values)
    }
    else {
      //RESULT: still don't have an email
      //update just the user doc
      await updateUserDoc(studentUID, values);
    }

  }

  //split if we need to update the display name
  await (studentData.firstName === values.firstName && studentData.lastName === values.lastName ? null : updateUserDisplayName(studentUID, values));

  toggleWorking()
  //finish with a toast message
  Toastify({
    text: 'Student successfully updated!'
  }).showToast();
  return;
}

function toggleWorking() {
  document.querySelector('#pageLoading').classList.toggle('loading');
  document.querySelectorAll('button').forEach(button => {
    button.disabled = !button.disabled;
  })
}

function clearFields() {
  document.querySelectorAll('input').forEach(input => input.value = '');
  $('#parents').dropdown('clear');
  document.querySelector('#location').value = '';
}

function getValues() {
  //we'll have to handle selects differently becuase of sematic ui
  const values = getInputValues();
  values.role = 'student';
  values.parents = getDropdownValues('parents');
  values.blacklistTutors = getDropdownValues('blacklistTutors');
  values.location = document.getElementById('location').value;
  return values;
}

function validate(values) {
  errorMsg.style.visibility = 'hidden';

  //check for required inputs
  if (!isRequiredValid()) {
    errorMsg.textContent = 'these fields are required';
    errorMsg.style.visibility = 'visible';
    return false;
  }

  //email is optional so only check its validity if the field is filled
  if (values.email && !isEmailValid()) {
    errorMsg.textContent = 'the email is not valid';
    errorMsg.style.visibility = 'visible';
    return false;
  }

  return true;
}

function isRequiredValid() {
  let isValid = true;
  document.querySelectorAll('input, select').forEach(input => {
    input.classList.remove('hasError')
    if (input.required && !input.value) {
      isValid = false;
      input.classList.add('hasError')
    }
  })

  return isValid;
}

function isEmailValid() {
  let isValid = true;
  document.querySelectorAll('input[type="email"]').forEach(email => {
    email.classList.remove('hasError')
    if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))) {
      isValid = false;
      email.classList.add('hasError')
    }
  })

  return isValid;
}

function getInputValues() {
  const inputs = document.querySelectorAll('input');
  let inputValues = {};

  inputs.forEach(input => {
    if (input.id) {
      inputValues[input.id] = input.value
    }
  })

  return inputValues;
}

async function addUserWithEmail(userInfo) {
  console.log('email');
  try {
    //create the user
    const addUser = firebase.functions().httpsCallable('addUser');
    const userResult = await addUser({
      email: userInfo.email,
      role: userInfo.role,
      password: 'iujowdij9834uijr2948un095b3098v0'
    })

    //make sure the user is new (function will check if email is already in use) 
    if (!userResult.data.newUser) {
      errorMsg.textContent = 'this email is already in use';
      errorMsg.style.visibility = 'visible';
      return null;
    }
    else {
      return userResult.data.user.uid;
    }
  }
  catch (error) {
    throw error;
  }
}

async function addUserWithoutEmail(userInfo) {
  console.log('no email')
  const userRef = firebase.firestore().collection('Users').doc()
  return userRef.id;
}

async function addUserDoc(userUID, userData) {
  return await firebase.firestore().collection('Users').doc(userUID).set(userData);
}

async function updateUserDoc(userUID, userData) {
  return await firebase.firestore().collection('Users').doc(userUID).update(userData);
}

async function updateUserEmail(userUID, userData) {
  const updateUserEmail = firebase.functions().httpsCallable('updateUserEmail');
  return await updateUserEmail({
    uid: userUID,
    email: userData.email,
  })
}

async function addUserWithUID(userUID, userData) {
  const addUser = firebase.functions().httpsCallable('addUser');
  return await addUser({
    uid: userUID,
    email: userData.email,
    role: userData.role,
    password: 'iujowdij9834uijr2948un095b3098v0'
  })
}

async function updateUserDisplayName(userUID, userData) {
  const updateUserDisplayName = firebase.functions().httpsCallable('updateUserDisplayName');
  return await updateUserDisplayName({
    uid: userUID,
    displayName: userData.firstName + ' ' + userData.lastName
  })
}

/**
 * Used for semantic ui multiple select dropdowns
 * @param {String} dropdownId id name for semantic ui dropdown
 * @returns array of select values
 */
function getDropdownValues(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let values = []
  inputs.forEach((input) => {
    values.push(input.dataset.value)
  })

  return values;
}
