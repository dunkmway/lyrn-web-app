const errorMsg = document.querySelector('.error')
let studentData = null;
const NUM_SECTION_TESTS = 5;
let allTestDocs;

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
      return (monthNumber[bData.month] ?? -1) - (monthNumber[aData.month] ?? -1);
    }
    else {
      return bData.year - aData.year;
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
  allTestDocs = testDocs;

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
    // make sure there is a value for the function run on
    // this stops infinite loops when we clear it afterwards
    if (!value || !text) { return };

    // check if the test already is in the list
    const testList = document.getElementById('testList');

    const existingTest = testList.querySelector(`div[data-test="${value}"`);
    if (existingTest) {
      console.log('existing', existingTest)
      existingTest.classList.add('highlight');
      setTimeout(() => { existingTest.classList.remove('highlight') }, 3000);
      
      $('#tests').closest(".ui.dropdown").dropdown('clear');
      return;
    }

    // add the new row to the list
    let newTest = document.createElement('div');
    newTest.textContent = text;
    newTest.setAttribute('data-test', value);

    let removeTest = document.createElement('div');
    removeTest.classList.add('remove-btn');
    removeTest.textContent = '❌';
    removeTest.addEventListener('click', () => { removeTestCallback(value, text) });
    newTest.appendChild(removeTest);
    testList.appendChild(newTest);

    const sections = ['composite', 'english', 'math', 'reading', 'science'];
    sections.forEach(section => {
      let newSection = document.createElement('input');
      newSection.setAttribute('type', 'type');
      newSection.setAttribute('data-test', value);
      newSection.setAttribute('min', 0);
      newSection.setAttribute('max', 36);
      newSection.id = `${value}-${section}`;
      newSection.addEventListener('keydown',enforceNumericFormat);
      newSection.addEventListener('keyup', formatToInt);

      testList.appendChild(newSection);

      $('#tests').closest(".ui.dropdown").dropdown('clear');
    })

  });

  function removeTestCallback(testID, testText) {
    if (!confirm('Are you sure you want to delete test ' + testText)) { return };

    const fullTest = document.querySelectorAll(`[data-test="${testID}"`);
    fullTest.forEach(elem => elem.remove());
  }

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
  
  if (!validate(values) || !confirm('Are you sure you are ready to submit this program?')) {
    toggleWorking();
    return;
  }

  try {
    // create the act fundamentals overview data for this student
    let overviewData = {};
    // add in their previous tests
    overviewData.previousTests = values.previousTests;

    // determine their homework tests
    // these will be the most recent test that the student hasn't already take
    overviewData.sectionTests = [];
    for (let i = 0; i < allTestDocs.length; i++) {
      if (overviewData.sectionTests.length >= NUM_SECTION_TESTS) { break };
      if (!Object.keys(values.previousTests).includes(allTestDocs[i].id)) {
        overviewData.sectionTests.push(allTestDocs[i].id)
      }
    }
    if (overviewData.sectionTests.length < NUM_SECTION_TESTS) {
      toggleWorking();
      alert(`We can only assign this student ${overviewData.sectionTests.length} test but we need ${NUM_SECTION_TESTS}. More tests need to be inputted so that this student can begin the program.`);
      return;
    }

    // get the list of test to remove
    // these will be all previous test codes and all section tests codes
    const testToRemove = [
      ...overviewData.sectionTests.map(mapTestIdToCode),
      ...Object.keys(overviewData.previousTests).map(mapTestIdToCode)
    ]

    // save all of the data
    await Promise.all([
      // save the overview doc
      firebase.firestore().collection('Users').doc(values.student).collection('ACT-Fundamentals').doc('overview').set(overviewData),

       // duplicate the topic questions data for the student
      firebase.firestore().collection('ACT-Aggregates').doc('english').get()
      .then(doc => {
        const updatedTopicQuestionList = removeTestsFromTopicQuestionList(testToRemove, doc.data());
        return firebase.firestore().collection('Users').doc(values.student).collection('ACT-Fundamentals').doc('english').set(updatedTopicQuestionList);
      }),
      firebase.firestore().collection('ACT-Aggregates').doc('math').get()
      .then(doc => {
        const updatedTopicQuestionList = removeTestsFromTopicQuestionList(testToRemove, doc.data());
        return firebase.firestore().collection('Users').doc(values.student).collection('ACT-Fundamentals').doc('math').set(updatedTopicQuestionList);
      }),
      firebase.firestore().collection('ACT-Aggregates').doc('reading').get()
      .then(doc => {
        const updatedTopicQuestionList = removeTestsFromTopicQuestionList(testToRemove, doc.data());
        return firebase.firestore().collection('Users').doc(values.student).collection('ACT-Fundamentals').doc('reading').set(updatedTopicQuestionList);
      }),
      firebase.firestore().collection('ACT-Aggregates').doc('science').get()
      .then(doc => {
        const updatedTopicQuestionList = removeTestsFromTopicQuestionList(testToRemove, doc.data());
        return firebase.firestore().collection('Users').doc(values.student).collection('ACT-Fundamentals').doc('science').set(updatedTopicQuestionList);
      }),
    ])
  }
  catch (error) {
    console.log(error)
    alert('We encountered an error while adding this program.')
  }

  clearFields();
  toggleWorking();
  //finish with a toast message
  Toastify({
    text: 'Program successfully submitted'
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

function mapTestIdToCode (testID) {
  const testDoc = allTestDocs.find(testDoc => testDoc.id == testID);
  return testDoc.data().test;
}

function removeTestsFromTopicQuestionList(testsToRemove, topicQuestionList) {
  let tmp_topicQuestionList = JSON.parse(JSON.stringify(topicQuestionList));
  for (const topic in tmp_topicQuestionList) {
    for (let i = tmp_topicQuestionList[topic].length - 1; i >= 0; i--) {
      if (testsToRemove.includes(tmp_topicQuestionList[topic][i].split(':')[0])) {
        tmp_topicQuestionList[topic].splice(i, 1);
      }
    }
  }

  return tmp_topicQuestionList;
}

function toggleWorking() {
  document.querySelector('#pageLoading').classList.toggle('loading');
  document.querySelectorAll('button').forEach(button => {
    button.disabled = !button.disabled;
  })
}

function clearFields() {
  document.querySelectorAll('input').forEach(input => input.value = '');
  $('#student').dropdown('clear');
  document.querySelector('#location').value = '';
  document.querySelectorAll('[data-test]').forEach(element => element.remove())
}

function getValues() {
  let values = {};
  values.location = document.getElementById('location').value;
  values.student = document.getElementById('student').value;

  //prepare the test into their proper format
  values.previousTests = {};
  document.querySelectorAll(`input[data-test]`).forEach(testInput => {
    setObjectValue(`${testInput.dataset.test}.${testInput.id.split('-')[1]}`, testInput.value || null, values.previousTests);
  })

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

  // // check student separately (semantic ui)
  // if (!values.student) {
  //   errorMsg.textContent = 'the student field is required';
  //   errorMsg.style.visibility = 'visible';
  //   return false
  // };

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

function getInputValues() {
  const inputs = document.querySelectorAll('input, select');
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
