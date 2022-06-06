const errorMsg = document.querySelector('.error')
let studentData = null;
let parentData = null;

async function getAllLocations() {
  return await firebase.firestore().collection('Locations').orderBy('locationName').get()
}

async function getLocationParents(locationUID) {
  return await firebase.firestore().collection('Users').where('location', '==', locationUID).where('role', '==', 'parent').get()
}

async function getLocationTutors(locationUID) {
  return await firebase.firestore().collection('Users').where('location', '==', locationUID).where('role', '==', 'tutor').get()
}

function toggleLoading(elementID) {
  document.getElementById(elementID).closest('.loading-wrapper').classList.toggle('loading');
}

async function initialSetup() {
  $('.ui.dropdown').dropdown();

  toggleLoading('location')
  const locationDocs = await getAllLocations();

  let locationUIDs = [];
  let locationNames = [];

  locationDocs.forEach(doc => {
    locationUIDs.push(doc.id);
    locationNames.push(doc.data().locationName)
  })

  addSelectOptions(document.getElementById("location"), locationUIDs, locationNames);
  toggleLoading('location')

  //determine if this is a new student or updating
  if (queryStrings().student) {
    //updating
    fillInData();

    document.getElementById('action').innerHTML = 'Update';
    document.getElementById('action').addEventListener('click', update);
    document.getElementById('title').textContent = 'Update Student';
  }
  else {
    //submitting
    document.getElementById('action').innerHTML = 'Submit';
    document.getElementById('action').addEventListener('click', submit);
    document.getElementById('title').textContent = 'Add Student';

    // if there is a parent then fill in the parent's relevant data
    if (queryStrings().parent) {

    }
  }
}

async function locationCallback(elem) {
  const locationUID = elem.value;

  toggleLoading('parents')
  toggleLoading('blacklistTutors')

  const parentPromise = getLocationParents(locationUID)
  .then(parentDocs => {
    let parentUIDs = [];
    let parentIdentifiers = [];

    parentDocs.forEach(doc => {
      parentUIDs.push(doc.id);
      parentIdentifiers.push(`${doc.data().firstName} ${doc.data().lastName} (${doc.data().email})`)
    })
    $('#parents').dropdown('clear')
    $('#parents').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
    $('#parents').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
    $('#parents').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
    document.getElementById('parents').innerHTML = '<option value="" disabled selected>select a parent</option>';
    addSelectOptions(document.getElementById('parents'), parentUIDs, parentIdentifiers);

    toggleLoading('parents')
  })

  const tutorPromise = getLocationTutors(locationUID)
  .then(tutorDocs => {
    let tutorUIDs = [];
    let tutorIdentifiers = [];

    tutorDocs.forEach(doc => {
      tutorUIDs.push(doc.id);
      tutorIdentifiers.push(`${doc.data().firstName} ${doc.data().lastName} (${doc.data().email})`)
    })
    $('#blacklistTutors').dropdown('clear')
    $('#blacklistTutors').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
    $('#blacklistTutors').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
    $('#blacklistTutors').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
    document.getElementById('blacklistTutors').innerHTML = '<option value="" disabled selected>select a tutor</option>';
    addSelectOptions(document.getElementById('blacklistTutors'), tutorUIDs, tutorIdentifiers);

    toggleLoading('blacklistTutors')
  })

  return await Promise.all([parentPromise, tutorPromise]);
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

async function fillInParentData() {
  const parentUID = queryStrings().parent;
  const parentDoc = await firebase.firestore().collection('Users').doc(parentUID).get();

  parentData = parentDoc.data()

  // the only relavant fields is the location and the parents
  document.getElementById('location').value = parentData.location;
  await locationCallback(document.getElementById('location'));
  $('#parents').closest(".ui.dropdown").dropdown('set selected', parentUID);

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
