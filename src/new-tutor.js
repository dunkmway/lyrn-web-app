import Dialog from "./_Dialog";
import "./_authorization";
import app from "./_firebase";
import { doc, getDoc, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const db = getFirestore(app);
const functions = getFunctions(app);

const errorMsg = document.querySelector('.error')
let tutorData = null;

const params = new URLSearchParams(document.location.search);
const tutorUID = params.get("tutor");

document.addEventListener('DOMContentLoaded', initialSetup);

async function initialSetup() {
  //determine if this is a new tutor or updating
  if (tutorUID) {
    //updating
    fillInData();

    document.getElementById('action').innerHTML = 'Update';
    document.getElementById('action').addEventListener('click', update)
    document.getElementById('title').textContent = 'Update Tutor';
  }
  else {
    //submitting
    document.getElementById('action').innerHTML = 'Submit';
    document.getElementById('action').addEventListener('click', submit)
    document.getElementById('title').textContent = 'Add Tutor';
  }
}

async function fillInData() {
  const tutorDoc = await getDoc(doc(db, 'Users', tutorUID));

  tutorData = tutorDoc.data()

  //use this for the regular fields (special case for semantic ui weirdness)
  document.querySelectorAll('input:not(.search)').forEach(input => {
    input.value = tutorDoc.data()[input.id];
  })

  return;
}

async function submit() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to submit this tutor?')) {
    toggleWorking();
    return;
  }

  try {
    const userUID = await addUserWithEmail(values);
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
    alert('We encountered an error while adding this tutor.')
  }

  clearFields();
  toggleWorking();
  //finish with a toast message
  Dialog.toastMessage('Tutor successfully submitted')
  return;
}

async function update() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to update this tutor?')) {
    toggleWorking();
    return;
  }

  //had email now check if the email is the same
  if (tutorData.email === values.email) {
    //RESULT: same email as before
    //update just the user doc
    await updateUserDoc(tutorUID, values);
  }
  else {
    //RESULT: different email
    //update the user email and doc
    await updateUserEmail(tutorUID, values);
    await updateUserDoc(tutorUID, values);
  }

  //split if we need to update the display name
  await (tutorData.firstName === values.firstName && tutorData.lastName === values.lastName ? null : updateUserDisplayName(tutorUID, values));

  toggleWorking()
  //finish with a toast message
  Dialog.toastMessage('Tutor successfully submitted')
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
}

function getValues() {
  //we'll have to handle selects differently becuase of sematic ui
  const values = getInputValues();
  values.role = 'tutor';
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

  //check email validity
  if (!isEmailValid()) {
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
    const addUser = httpsCallable(functions, 'addUser');
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

async function addUserDoc(userUID, userData) {
  return await setDoc(doc(db, 'Users', userUID), userData);
}

async function updateUserDoc(userUID, userData) {
  return await updateDoc(doc(db, 'Users', userUID), userData);
}

async function updateUserEmail(userUID, userData) {
  const updateUserEmail = httpsCallable(functions, 'updateUserEmail');
  return await updateUserEmail({
    uid: userUID,
    email: userData.email,
  })
}

async function updateUserDisplayName(userUID, userData) {
  const updateUserDisplayName = httpsCallable(functions, 'updateUserDisplayName');
  return await updateUserDisplayName({
    uid: userUID,
    displayName: userData.firstName + ' ' + userData.lastName
  })
}
