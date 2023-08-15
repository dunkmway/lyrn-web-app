import "./_authorization";
import app from "./_firebase";
import { collection, doc, getDoc, getFirestore, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const db = getFirestore(app);
const funcs = getFunctions(app);

const params = new URLSearchParams(document.location.search);
const parentUID = params.get("parent");

let errorMsg;
let parentData = null;

document.addEventListener('DOMContentLoaded', initialSetup);

async function initialSetup() {
  errorMsg = document.querySelector('.error')

  //determine if this is a new parent or updating
  if (parentUID) {
    //updating
    fillInData();

    document.getElementById('action').innerHTML = 'Update';
    document.getElementById('action').addEventListener('click', update)
    document.getElementById('title').textContent = 'Update Parent';
  }
  else {
    //submitting
    document.getElementById('action').innerHTML = 'Submit';
    document.getElementById('action').addEventListener('click', submit)
    document.getElementById('title').textContent = 'Add Parent';
  }
}

async function fillInData() {
  const parentDoc = await getDoc(doc(db, 'Users', parentUID));

  parentData = parentDoc.data()

  //use this for the regular fields
  document.querySelectorAll('input').forEach(input => {
    input.value = parentDoc.data()[input.id];
  })

  return;
}

async function submit() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to submit this parent?')) {
    toggleWorking();
    return;
  }

  try {
    const userUID = await addUserWithEmail(values);
    //adding user with email can fail if the email is already in use. Not an error so catch it here
    if (!userUID) {
      toggleWorking();
      Toastify({
        text: 'Parent already exists'
      }).showToast();
      return;
    } 

    await updateUserDisplayName(userUID, values)
    await addUserDoc(userUID, values);

    clearFields();
    toggleWorking();
    //finish with a toast message
    Toastify({
      text: 'Parent successfully submitted'
    }).showToast();

    // redirect to the new student page with the newly created parent uid
    window.location.href = 'new-student.html?parent=' + userUID;
  }
  catch (error) {
    console.log(error)
    clearFields();
    toggleWorking();
    Toastify({
      text: 'An error has occured'
    }).showToast();
  }

  return;
}

async function update() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to update this parent?')) {
    toggleWorking();
    return;
  }

  //had email now check if the email is the same
  if (parentData.email === values.email) {
    //RESULT: same email as before
    //update just the user doc
    await updateUserDoc(parentUID, values);
  }
  else {
    //RESULT: different email
    //update the user email and doc
    await updateUserEmail(parentUID, values);
    await updateUserDoc(parentUID, values);
  }

  //split if we need to update the display name
  await (parentData.firstName === values.firstName && parentData.lastName === values.lastName ? null : updateUserDisplayName(parentUID, values));

  toggleWorking()
  //finish with a toast message
  Toastify({
    text: 'Parent successfully updated!'
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
  document.querySelector('#location').value = '';
}

function getValues() {
  //we'll have to handle selects differently becuase of sematic ui
  const values = getInputValues();
  values.role = 'parent';
  return values;
}

function validate(values) {
  errorMsg.style.visibility = 'hidden';

  //check for required inputs
  if (!isRequiredValid()) {
    errorMsg.textContent = 'These fields are required';
    errorMsg.style.visibility = 'visible';
    return false;
  }

  //check email validity
  if (!isEmailValid()) {
    errorMsg.textContent = 'The email is not valid';
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
    const addUser = httpsCallable(funcs, 'addUser');
    // const addUser = firebase.functions().httpsCallable('addUser');
    const userResult = await addUser({
      email: userInfo.email,
      role: userInfo.role,
      password: 'iujowdij9834uijr2948un095b3098v0'
    })

    //make sure the user is new (function will check if email is already in use) 
    if (!userResult.data.newUser) {
      errorMsg.textContent = 'This email is already in use';
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
  return setDoc(doc(db, 'Users', userUID), userData);
}

async function updateUserDoc(userUID, userData) {
  return updateDoc(doc(db, 'Users', userUID), userData);
}

async function updateUserEmail(userUID, userData) {
  const updateUserEmail = httpsCallable(funcs, 'updateUserEmail');
  return await updateUserEmail({
    uid: userUID,
    email: userData.email,
  })
}

async function updateUserDisplayName(userUID, userData) {
  const updateUserDisplayName = httpsCallable(funcs, 'updateUserDisplayName');
  return await updateUserDisplayName({
    uid: userUID,
    displayName: userData.firstName + ' ' + userData.lastName
  })
}

