/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**************************!*\
  !*** ./src/new-tutor.js ***!
  \**************************/
const errorMsg = document.querySelector('.error')
let tutorData = null;
let locationDocs;

async function getAllLocations() {
  return await firebase.firestore().collection('Locations').orderBy('locationName').get()
}

function toggleLoading(elementID) {
  document.getElementById(elementID).closest('.loading-wrapper').classList.toggle('loading');
}

async function initialSetup() {
  $('.ui.dropdown').dropdown();

  toggleLoading('location')
  locationDocs = await getAllLocations();

  let locationUIDs = [];
  let locationNames = [];

  locationDocs.forEach(doc => {
    locationUIDs.push(doc.id);
    locationNames.push(doc.data().locationName)
  })

  addSelectOptions(document.getElementById("location"), locationUIDs, locationNames);
  toggleLoading('location')

  //determine if this is a new tutor or updating
  if (queryStrings().tutor) {
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

async function locationCallback(elem) {
  const locationUID = elem.value;
  toggleLoading('qualifications')

  // find the relavant location doc
  const lessonTypes = locationDocs.docs.find(doc => doc.id == locationUID).data().lessonTypes;

  let qualificationNames = [];
  let qualificationValues = [];

  //go through the types and append their subtypes
  lessonTypes.forEach(type => {
    if (type.subtypes) {
      type.subtypes.forEach(subtype => {
        qualificationNames.push(type.name + ' ' + subtype.name);
        qualificationValues.push(type.value + '-' + subtype.value);
      })
    }
    else {
      qualificationNames.push(type.name);
      qualificationValues.push(type.value);
    }
  })

  $('#qualifications').dropdown('clear')
  $('#qualifications').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
  $('#qualifications').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
  $('#qualifications').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
  document.getElementById('qualifications').innerHTML = '<option value="" disabled selected>select qualifications</option>';
  addSelectOptions(document.getElementById('qualifications'), qualificationValues, qualificationNames);

  toggleLoading('qualifications')

  return;
}

async function fillInData() {
  const tutorUID = queryStrings().tutor;
  const tutorDoc = await firebase.firestore().collection('Users').doc(tutorUID).get();

  tutorData = tutorDoc.data()

  //use this for the regular fields (special case for semantic ui weirdness)
  document.querySelectorAll('input:not(.search)').forEach(input => {
    input.value = tutorDoc.data()[input.id];
  })

  //deal with the select (especially changing location then semantic ui select)
  document.getElementById('location').value = tutorData.location;
  await locationCallback(document.getElementById('location'));
  $('#qualifications').closest(".ui.dropdown").dropdown('set selected', tutorData.qualifications);
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
  Toastify({
    text: 'Tutor successfully submitted'
  }).showToast();
  return;
}

async function update() {
  toggleWorking();
  const values = getValues();
  if (!validate(values) || !confirm('Are you sure you are ready to update this tutor?')) {
    toggleWorking();
    return;
  }

  const tutorUID = queryStrings().tutor;

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
  Toastify({
    text: 'Tutor successfully updated!'
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
  values.role = 'tutor';
  values.qualifications = getDropdownValues('qualifications');
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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV3LXR1dG9yLmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbHlybl93ZWJfYXBwX2NsZWFuLy4vc3JjL25ldy10dXRvci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBlcnJvck1zZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5lcnJvcicpXHJcbmxldCB0dXRvckRhdGEgPSBudWxsO1xyXG5sZXQgbG9jYXRpb25Eb2NzO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0QWxsTG9jYXRpb25zKCkge1xyXG4gIHJldHVybiBhd2FpdCBmaXJlYmFzZS5maXJlc3RvcmUoKS5jb2xsZWN0aW9uKCdMb2NhdGlvbnMnKS5vcmRlckJ5KCdsb2NhdGlvbk5hbWUnKS5nZXQoKVxyXG59XHJcblxyXG5mdW5jdGlvbiB0b2dnbGVMb2FkaW5nKGVsZW1lbnRJRCkge1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsZW1lbnRJRCkuY2xvc2VzdCgnLmxvYWRpbmctd3JhcHBlcicpLmNsYXNzTGlzdC50b2dnbGUoJ2xvYWRpbmcnKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbFNldHVwKCkge1xyXG4gICQoJy51aS5kcm9wZG93bicpLmRyb3Bkb3duKCk7XHJcblxyXG4gIHRvZ2dsZUxvYWRpbmcoJ2xvY2F0aW9uJylcclxuICBsb2NhdGlvbkRvY3MgPSBhd2FpdCBnZXRBbGxMb2NhdGlvbnMoKTtcclxuXHJcbiAgbGV0IGxvY2F0aW9uVUlEcyA9IFtdO1xyXG4gIGxldCBsb2NhdGlvbk5hbWVzID0gW107XHJcblxyXG4gIGxvY2F0aW9uRG9jcy5mb3JFYWNoKGRvYyA9PiB7XHJcbiAgICBsb2NhdGlvblVJRHMucHVzaChkb2MuaWQpO1xyXG4gICAgbG9jYXRpb25OYW1lcy5wdXNoKGRvYy5kYXRhKCkubG9jYXRpb25OYW1lKVxyXG4gIH0pXHJcblxyXG4gIGFkZFNlbGVjdE9wdGlvbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2NhdGlvblwiKSwgbG9jYXRpb25VSURzLCBsb2NhdGlvbk5hbWVzKTtcclxuICB0b2dnbGVMb2FkaW5nKCdsb2NhdGlvbicpXHJcblxyXG4gIC8vZGV0ZXJtaW5lIGlmIHRoaXMgaXMgYSBuZXcgdHV0b3Igb3IgdXBkYXRpbmdcclxuICBpZiAocXVlcnlTdHJpbmdzKCkudHV0b3IpIHtcclxuICAgIC8vdXBkYXRpbmdcclxuICAgIGZpbGxJbkRhdGEoKTtcclxuXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWN0aW9uJykuaW5uZXJIVE1MID0gJ1VwZGF0ZSc7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWN0aW9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1cGRhdGUpXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGl0bGUnKS50ZXh0Q29udGVudCA9ICdVcGRhdGUgVHV0b3InO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIC8vc3VibWl0dGluZ1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjdGlvbicpLmlubmVySFRNTCA9ICdTdWJtaXQnO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FjdGlvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc3VibWl0KVxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpdGxlJykudGV4dENvbnRlbnQgPSAnQWRkIFR1dG9yJztcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxvY2F0aW9uQ2FsbGJhY2soZWxlbSkge1xyXG4gIGNvbnN0IGxvY2F0aW9uVUlEID0gZWxlbS52YWx1ZTtcclxuICB0b2dnbGVMb2FkaW5nKCdxdWFsaWZpY2F0aW9ucycpXHJcblxyXG4gIC8vIGZpbmQgdGhlIHJlbGF2YW50IGxvY2F0aW9uIGRvY1xyXG4gIGNvbnN0IGxlc3NvblR5cGVzID0gbG9jYXRpb25Eb2NzLmRvY3MuZmluZChkb2MgPT4gZG9jLmlkID09IGxvY2F0aW9uVUlEKS5kYXRhKCkubGVzc29uVHlwZXM7XHJcblxyXG4gIGxldCBxdWFsaWZpY2F0aW9uTmFtZXMgPSBbXTtcclxuICBsZXQgcXVhbGlmaWNhdGlvblZhbHVlcyA9IFtdO1xyXG5cclxuICAvL2dvIHRocm91Z2ggdGhlIHR5cGVzIGFuZCBhcHBlbmQgdGhlaXIgc3VidHlwZXNcclxuICBsZXNzb25UeXBlcy5mb3JFYWNoKHR5cGUgPT4ge1xyXG4gICAgaWYgKHR5cGUuc3VidHlwZXMpIHtcclxuICAgICAgdHlwZS5zdWJ0eXBlcy5mb3JFYWNoKHN1YnR5cGUgPT4ge1xyXG4gICAgICAgIHF1YWxpZmljYXRpb25OYW1lcy5wdXNoKHR5cGUubmFtZSArICcgJyArIHN1YnR5cGUubmFtZSk7XHJcbiAgICAgICAgcXVhbGlmaWNhdGlvblZhbHVlcy5wdXNoKHR5cGUudmFsdWUgKyAnLScgKyBzdWJ0eXBlLnZhbHVlKTtcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBxdWFsaWZpY2F0aW9uTmFtZXMucHVzaCh0eXBlLm5hbWUpO1xyXG4gICAgICBxdWFsaWZpY2F0aW9uVmFsdWVzLnB1c2godHlwZS52YWx1ZSk7XHJcbiAgICB9XHJcbiAgfSlcclxuXHJcbiAgJCgnI3F1YWxpZmljYXRpb25zJykuZHJvcGRvd24oJ2NsZWFyJylcclxuICAkKCcjcXVhbGlmaWNhdGlvbnMnKS5jbG9zZXN0KFwiLnVpLmRyb3Bkb3duXCIpLmRyb3Bkb3duKCdzZXR0aW5nJywgJ2Z1bGxUZXh0U2VhcmNoJywgJ2V4YWN0Jyk7XHJcbiAgJCgnI3F1YWxpZmljYXRpb25zJykuY2xvc2VzdChcIi51aS5kcm9wZG93blwiKS5kcm9wZG93bignc2V0dGluZycsICdtYXRjaCcsICd0ZXh0Jyk7XHJcbiAgJCgnI3F1YWxpZmljYXRpb25zJykuY2xvc2VzdChcIi51aS5kcm9wZG93blwiKS5kcm9wZG93bignc2V0dGluZycsICdmb3JjZVNlbGVjdGlvbicsIGZhbHNlKTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncXVhbGlmaWNhdGlvbnMnKS5pbm5lckhUTUwgPSAnPG9wdGlvbiB2YWx1ZT1cIlwiIGRpc2FibGVkIHNlbGVjdGVkPnNlbGVjdCBxdWFsaWZpY2F0aW9uczwvb3B0aW9uPic7XHJcbiAgYWRkU2VsZWN0T3B0aW9ucyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncXVhbGlmaWNhdGlvbnMnKSwgcXVhbGlmaWNhdGlvblZhbHVlcywgcXVhbGlmaWNhdGlvbk5hbWVzKTtcclxuXHJcbiAgdG9nZ2xlTG9hZGluZygncXVhbGlmaWNhdGlvbnMnKVxyXG5cclxuICByZXR1cm47XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbGxJbkRhdGEoKSB7XHJcbiAgY29uc3QgdHV0b3JVSUQgPSBxdWVyeVN0cmluZ3MoKS50dXRvcjtcclxuICBjb25zdCB0dXRvckRvYyA9IGF3YWl0IGZpcmViYXNlLmZpcmVzdG9yZSgpLmNvbGxlY3Rpb24oJ1VzZXJzJykuZG9jKHR1dG9yVUlEKS5nZXQoKTtcclxuXHJcbiAgdHV0b3JEYXRhID0gdHV0b3JEb2MuZGF0YSgpXHJcblxyXG4gIC8vdXNlIHRoaXMgZm9yIHRoZSByZWd1bGFyIGZpZWxkcyAoc3BlY2lhbCBjYXNlIGZvciBzZW1hbnRpYyB1aSB3ZWlyZG5lc3MpXHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQ6bm90KC5zZWFyY2gpJykuZm9yRWFjaChpbnB1dCA9PiB7XHJcbiAgICBpbnB1dC52YWx1ZSA9IHR1dG9yRG9jLmRhdGEoKVtpbnB1dC5pZF07XHJcbiAgfSlcclxuXHJcbiAgLy9kZWFsIHdpdGggdGhlIHNlbGVjdCAoZXNwZWNpYWxseSBjaGFuZ2luZyBsb2NhdGlvbiB0aGVuIHNlbWFudGljIHVpIHNlbGVjdClcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9jYXRpb24nKS52YWx1ZSA9IHR1dG9yRGF0YS5sb2NhdGlvbjtcclxuICBhd2FpdCBsb2NhdGlvbkNhbGxiYWNrKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2NhdGlvbicpKTtcclxuICAkKCcjcXVhbGlmaWNhdGlvbnMnKS5jbG9zZXN0KFwiLnVpLmRyb3Bkb3duXCIpLmRyb3Bkb3duKCdzZXQgc2VsZWN0ZWQnLCB0dXRvckRhdGEucXVhbGlmaWNhdGlvbnMpO1xyXG4gIHJldHVybjtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc3VibWl0KCkge1xyXG4gIHRvZ2dsZVdvcmtpbmcoKTtcclxuICBjb25zdCB2YWx1ZXMgPSBnZXRWYWx1ZXMoKTtcclxuICBpZiAoIXZhbGlkYXRlKHZhbHVlcykgfHwgIWNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3UgYXJlIHJlYWR5IHRvIHN1Ym1pdCB0aGlzIHR1dG9yPycpKSB7XHJcbiAgICB0b2dnbGVXb3JraW5nKCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgdXNlclVJRCA9IGF3YWl0IGFkZFVzZXJXaXRoRW1haWwodmFsdWVzKTtcclxuICAgIC8vYWRkaW5nIHVzZXIgd2l0aCBlbWFpbCBjYW4gZmFpbCBpZiB0aGUgZW1haWwgaXMgYWxyZWFkeSBpbiB1c2UuIE5vdCBhbiBlcnJvciBzbyBjYXRjaCBpdCBoZXJlXHJcbiAgICBpZiAoIXVzZXJVSUQpIHtcclxuICAgICAgdG9nZ2xlV29ya2luZygpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IFxyXG5cclxuICAgIGF3YWl0IHVwZGF0ZVVzZXJEaXNwbGF5TmFtZSh1c2VyVUlELCB2YWx1ZXMpXHJcbiAgICBhd2FpdCBhZGRVc2VyRG9jKHVzZXJVSUQsIHZhbHVlcyk7XHJcbiAgfVxyXG4gIGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5sb2coZXJyb3IpXHJcbiAgICBhbGVydCgnV2UgZW5jb3VudGVyZWQgYW4gZXJyb3Igd2hpbGUgYWRkaW5nIHRoaXMgdHV0b3IuJylcclxuICB9XHJcblxyXG4gIGNsZWFyRmllbGRzKCk7XHJcbiAgdG9nZ2xlV29ya2luZygpO1xyXG4gIC8vZmluaXNoIHdpdGggYSB0b2FzdCBtZXNzYWdlXHJcbiAgVG9hc3RpZnkoe1xyXG4gICAgdGV4dDogJ1R1dG9yIHN1Y2Nlc3NmdWxseSBzdWJtaXR0ZWQnXHJcbiAgfSkuc2hvd1RvYXN0KCk7XHJcbiAgcmV0dXJuO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB1cGRhdGUoKSB7XHJcbiAgdG9nZ2xlV29ya2luZygpO1xyXG4gIGNvbnN0IHZhbHVlcyA9IGdldFZhbHVlcygpO1xyXG4gIGlmICghdmFsaWRhdGUodmFsdWVzKSB8fCAhY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSBhcmUgcmVhZHkgdG8gdXBkYXRlIHRoaXMgdHV0b3I/JykpIHtcclxuICAgIHRvZ2dsZVdvcmtpbmcoKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHR1dG9yVUlEID0gcXVlcnlTdHJpbmdzKCkudHV0b3I7XHJcblxyXG4gIC8vaGFkIGVtYWlsIG5vdyBjaGVjayBpZiB0aGUgZW1haWwgaXMgdGhlIHNhbWVcclxuICBpZiAodHV0b3JEYXRhLmVtYWlsID09PSB2YWx1ZXMuZW1haWwpIHtcclxuICAgIC8vUkVTVUxUOiBzYW1lIGVtYWlsIGFzIGJlZm9yZVxyXG4gICAgLy91cGRhdGUganVzdCB0aGUgdXNlciBkb2NcclxuICAgIGF3YWl0IHVwZGF0ZVVzZXJEb2ModHV0b3JVSUQsIHZhbHVlcyk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgLy9SRVNVTFQ6IGRpZmZlcmVudCBlbWFpbFxyXG4gICAgLy91cGRhdGUgdGhlIHVzZXIgZW1haWwgYW5kIGRvY1xyXG4gICAgYXdhaXQgdXBkYXRlVXNlckVtYWlsKHR1dG9yVUlELCB2YWx1ZXMpO1xyXG4gICAgYXdhaXQgdXBkYXRlVXNlckRvYyh0dXRvclVJRCwgdmFsdWVzKTtcclxuICB9XHJcblxyXG4gIC8vc3BsaXQgaWYgd2UgbmVlZCB0byB1cGRhdGUgdGhlIGRpc3BsYXkgbmFtZVxyXG4gIGF3YWl0ICh0dXRvckRhdGEuZmlyc3ROYW1lID09PSB2YWx1ZXMuZmlyc3ROYW1lICYmIHR1dG9yRGF0YS5sYXN0TmFtZSA9PT0gdmFsdWVzLmxhc3ROYW1lID8gbnVsbCA6IHVwZGF0ZVVzZXJEaXNwbGF5TmFtZSh0dXRvclVJRCwgdmFsdWVzKSk7XHJcblxyXG4gIHRvZ2dsZVdvcmtpbmcoKVxyXG4gIC8vZmluaXNoIHdpdGggYSB0b2FzdCBtZXNzYWdlXHJcbiAgVG9hc3RpZnkoe1xyXG4gICAgdGV4dDogJ1R1dG9yIHN1Y2Nlc3NmdWxseSB1cGRhdGVkISdcclxuICB9KS5zaG93VG9hc3QoKTtcclxuICByZXR1cm47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvZ2dsZVdvcmtpbmcoKSB7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BhZ2VMb2FkaW5nJykuY2xhc3NMaXN0LnRvZ2dsZSgnbG9hZGluZycpO1xyXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbicpLmZvckVhY2goYnV0dG9uID0+IHtcclxuICAgIGJ1dHRvbi5kaXNhYmxlZCA9ICFidXR0b24uZGlzYWJsZWQ7XHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXJGaWVsZHMoKSB7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQnKS5mb3JFYWNoKGlucHV0ID0+IGlucHV0LnZhbHVlID0gJycpO1xyXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2NhdGlvbicpLnZhbHVlID0gJyc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFZhbHVlcygpIHtcclxuICAvL3dlJ2xsIGhhdmUgdG8gaGFuZGxlIHNlbGVjdHMgZGlmZmVyZW50bHkgYmVjdWFzZSBvZiBzZW1hdGljIHVpXHJcbiAgY29uc3QgdmFsdWVzID0gZ2V0SW5wdXRWYWx1ZXMoKTtcclxuICB2YWx1ZXMucm9sZSA9ICd0dXRvcic7XHJcbiAgdmFsdWVzLnF1YWxpZmljYXRpb25zID0gZ2V0RHJvcGRvd25WYWx1ZXMoJ3F1YWxpZmljYXRpb25zJyk7XHJcbiAgdmFsdWVzLmxvY2F0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2F0aW9uJykudmFsdWU7XHJcbiAgcmV0dXJuIHZhbHVlcztcclxufVxyXG5cclxuZnVuY3Rpb24gdmFsaWRhdGUodmFsdWVzKSB7XHJcbiAgZXJyb3JNc2cuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xyXG5cclxuICAvL2NoZWNrIGZvciByZXF1aXJlZCBpbnB1dHNcclxuICBpZiAoIWlzUmVxdWlyZWRWYWxpZCgpKSB7XHJcbiAgICBlcnJvck1zZy50ZXh0Q29udGVudCA9ICd0aGVzZSBmaWVsZHMgYXJlIHJlcXVpcmVkJztcclxuICAgIGVycm9yTXNnLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvL2NoZWNrIGVtYWlsIHZhbGlkaXR5XHJcbiAgaWYgKCFpc0VtYWlsVmFsaWQoKSkge1xyXG4gICAgZXJyb3JNc2cudGV4dENvbnRlbnQgPSAndGhlIGVtYWlsIGlzIG5vdCB2YWxpZCc7XHJcbiAgICBlcnJvck1zZy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzUmVxdWlyZWRWYWxpZCgpIHtcclxuICBsZXQgaXNWYWxpZCA9IHRydWU7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQsIHNlbGVjdCcpLmZvckVhY2goaW5wdXQgPT4ge1xyXG4gICAgaW5wdXQuY2xhc3NMaXN0LnJlbW92ZSgnaGFzRXJyb3InKVxyXG4gICAgaWYgKGlucHV0LnJlcXVpcmVkICYmICFpbnB1dC52YWx1ZSkge1xyXG4gICAgICBpc1ZhbGlkID0gZmFsc2U7XHJcbiAgICAgIGlucHV0LmNsYXNzTGlzdC5hZGQoJ2hhc0Vycm9yJylcclxuICAgIH1cclxuICB9KVxyXG5cclxuICByZXR1cm4gaXNWYWxpZDtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNFbWFpbFZhbGlkKCkge1xyXG4gIGxldCBpc1ZhbGlkID0gdHJ1ZTtcclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dFt0eXBlPVwiZW1haWxcIl0nKS5mb3JFYWNoKGVtYWlsID0+IHtcclxuICAgIGVtYWlsLmNsYXNzTGlzdC5yZW1vdmUoJ2hhc0Vycm9yJylcclxuICAgIGlmICghKC9eW15cXHNAXStAW15cXHNAXStcXC5bXlxcc0BdKyQvLnRlc3QoZW1haWwudmFsdWUpKSkge1xyXG4gICAgICBpc1ZhbGlkID0gZmFsc2U7XHJcbiAgICAgIGVtYWlsLmNsYXNzTGlzdC5hZGQoJ2hhc0Vycm9yJylcclxuICAgIH1cclxuICB9KVxyXG5cclxuICByZXR1cm4gaXNWYWxpZDtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SW5wdXRWYWx1ZXMoKSB7XHJcbiAgY29uc3QgaW5wdXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQnKTtcclxuICBsZXQgaW5wdXRWYWx1ZXMgPSB7fTtcclxuXHJcbiAgaW5wdXRzLmZvckVhY2goaW5wdXQgPT4ge1xyXG4gICAgaWYgKGlucHV0LmlkKSB7XHJcbiAgICAgIGlucHV0VmFsdWVzW2lucHV0LmlkXSA9IGlucHV0LnZhbHVlXHJcbiAgICB9XHJcbiAgfSlcclxuXHJcbiAgcmV0dXJuIGlucHV0VmFsdWVzO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBhZGRVc2VyV2l0aEVtYWlsKHVzZXJJbmZvKSB7XHJcbiAgY29uc29sZS5sb2coJ2VtYWlsJyk7XHJcbiAgdHJ5IHtcclxuICAgIC8vY3JlYXRlIHRoZSB1c2VyXHJcbiAgICBjb25zdCBhZGRVc2VyID0gZmlyZWJhc2UuZnVuY3Rpb25zKCkuaHR0cHNDYWxsYWJsZSgnYWRkVXNlcicpO1xyXG4gICAgY29uc3QgdXNlclJlc3VsdCA9IGF3YWl0IGFkZFVzZXIoe1xyXG4gICAgICBlbWFpbDogdXNlckluZm8uZW1haWwsXHJcbiAgICAgIHJvbGU6IHVzZXJJbmZvLnJvbGUsXHJcbiAgICAgIHBhc3N3b3JkOiAnaXVqb3dkaWo5ODM0dWlqcjI5NDh1bjA5NWIzMDk4djAnXHJcbiAgICB9KVxyXG5cclxuICAgIC8vbWFrZSBzdXJlIHRoZSB1c2VyIGlzIG5ldyAoZnVuY3Rpb24gd2lsbCBjaGVjayBpZiBlbWFpbCBpcyBhbHJlYWR5IGluIHVzZSkgXHJcbiAgICBpZiAoIXVzZXJSZXN1bHQuZGF0YS5uZXdVc2VyKSB7XHJcbiAgICAgIGVycm9yTXNnLnRleHRDb250ZW50ID0gJ3RoaXMgZW1haWwgaXMgYWxyZWFkeSBpbiB1c2UnO1xyXG4gICAgICBlcnJvck1zZy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdXNlclJlc3VsdC5kYXRhLnVzZXIudWlkO1xyXG4gICAgfVxyXG4gIH1cclxuICBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHRocm93IGVycm9yO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gYWRkVXNlckRvYyh1c2VyVUlELCB1c2VyRGF0YSkge1xyXG4gIHJldHVybiBhd2FpdCBmaXJlYmFzZS5maXJlc3RvcmUoKS5jb2xsZWN0aW9uKCdVc2VycycpLmRvYyh1c2VyVUlEKS5zZXQodXNlckRhdGEpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVVc2VyRG9jKHVzZXJVSUQsIHVzZXJEYXRhKSB7XHJcbiAgcmV0dXJuIGF3YWl0IGZpcmViYXNlLmZpcmVzdG9yZSgpLmNvbGxlY3Rpb24oJ1VzZXJzJykuZG9jKHVzZXJVSUQpLnVwZGF0ZSh1c2VyRGF0YSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVVzZXJFbWFpbCh1c2VyVUlELCB1c2VyRGF0YSkge1xyXG4gIGNvbnN0IHVwZGF0ZVVzZXJFbWFpbCA9IGZpcmViYXNlLmZ1bmN0aW9ucygpLmh0dHBzQ2FsbGFibGUoJ3VwZGF0ZVVzZXJFbWFpbCcpO1xyXG4gIHJldHVybiBhd2FpdCB1cGRhdGVVc2VyRW1haWwoe1xyXG4gICAgdWlkOiB1c2VyVUlELFxyXG4gICAgZW1haWw6IHVzZXJEYXRhLmVtYWlsLFxyXG4gIH0pXHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVVzZXJEaXNwbGF5TmFtZSh1c2VyVUlELCB1c2VyRGF0YSkge1xyXG4gIGNvbnN0IHVwZGF0ZVVzZXJEaXNwbGF5TmFtZSA9IGZpcmViYXNlLmZ1bmN0aW9ucygpLmh0dHBzQ2FsbGFibGUoJ3VwZGF0ZVVzZXJEaXNwbGF5TmFtZScpO1xyXG4gIHJldHVybiBhd2FpdCB1cGRhdGVVc2VyRGlzcGxheU5hbWUoe1xyXG4gICAgdWlkOiB1c2VyVUlELFxyXG4gICAgZGlzcGxheU5hbWU6IHVzZXJEYXRhLmZpcnN0TmFtZSArICcgJyArIHVzZXJEYXRhLmxhc3ROYW1lXHJcbiAgfSlcclxufVxyXG5cclxuLyoqXHJcbiAqIFVzZWQgZm9yIHNlbWFudGljIHVpIG11bHRpcGxlIHNlbGVjdCBkcm9wZG93bnNcclxuICogQHBhcmFtIHtTdHJpbmd9IGRyb3Bkb3duSWQgaWQgbmFtZSBmb3Igc2VtYW50aWMgdWkgZHJvcGRvd25cclxuICogQHJldHVybnMgYXJyYXkgb2Ygc2VsZWN0IHZhbHVlc1xyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RHJvcGRvd25WYWx1ZXMoZHJvcGRvd25JZCkge1xyXG4gIGNvbnN0IGlucHV0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRyb3Bkb3duSWQpLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChcIi51aS5sYWJlbFwiKTtcclxuICBcclxuICBsZXQgdmFsdWVzID0gW11cclxuICBpbnB1dHMuZm9yRWFjaCgoaW5wdXQpID0+IHtcclxuICAgIHZhbHVlcy5wdXNoKGlucHV0LmRhdGFzZXQudmFsdWUpXHJcbiAgfSlcclxuXHJcbiAgcmV0dXJuIHZhbHVlcztcclxufVxyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=