import "./_authorization";
import app from "./_firebase";
import { collection, doc, getDoc, getFirestore, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const db = getFirestore(app);
const funcs = getFunctions(app);

const params = new URLSearchParams(document.location.search);
const studentUID = params.get("student");

document.addEventListener('DOMContentLoaded', initialSetup);

let errorMsg;
let studentData = null;

async function initialSetup() {
  errorMsg = document.querySelector('.error')

  //determine if this is a new student or updating
  if (studentUID) {
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
  }
}

async function fillInData() {
  const studentDoc = await getDoc(doc(db, 'Users', studentUID));
  studentData = studentDoc.data()

  //use this for the regular fields (special case for semantic ui weirdness)
  document.querySelectorAll('input:not(.search)').forEach(input => {
    input.value = studentData[input.id];
  })
  return;
}

async function submit() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to submit this student?')) {
    toggleWorking();
    return;
  }

  let userUID = '';

  try {
    //split based on if we have an email
    userUID = await (values.email ? addUserWithEmail(values) : addUserWithoutEmail(values));
    //adding user with email can fail if the email is already in use. Not an error so catch it here
    if (!userUID) {
      toggleWorking();
      Toastify({
        text: 'Student already exists'
      }).showToast();
      return;
    } 

    await updateUserDisplayName(userUID, values)
    await addUserDoc(userUID, values);
  }
  catch (error) {
    console.log(error)
    alert('We encountered an error while adding this student.')

    clearFields();
    toggleWorking();
    //finish with a toast message
    Toastify({
      text: 'Student not submitted!'
    }).showToast();

    return 
  }

  clearFields();
  toggleWorking();
  //finish with a toast message
  Toastify({
    text: 'Student successfully submitted'
  }).showToast();

  window.location.href = `/student-overview/${userUID}`;
  return;
}

async function update() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to update this student?')) {
    toggleWorking();
    return;
  }

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
}

function getValues() {
  //we'll have to handle selects differently becuase of sematic ui
  const values = getInputValues();
  values.role = 'student';
  values.createdAt = serverTimestamp();
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

  // check email validity
  if (values.email && !isEmailValid()) {
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

async function addUserWithoutEmail(userInfo) {
  console.log('no email')
  const userRef = doc(collection(db, 'Users'));
  return userRef.id;
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

async function addUserWithUID(userUID, userData) {
  const addUser = httpsCallable(funcs, 'addUser');
  return await addUser({
    uid: userUID,
    email: userData.email,
    role: userData.role,
    password: 'iujowdij9834uijr2948un095b3098v0'
  })
}

async function updateUserDisplayName(userUID, userData) {
  const updateUserDisplayName = httpsCallable(funcs, 'updateUserDisplayName');
  return await updateUserDisplayName({
    uid: userUID,
    displayName: userData.firstName + ' ' + userData.lastName
  })
}
