// The actual tests with their answers and scaled scores
let testData = {};

// Student test information
let oldTestAnswers = {};
let testAnswers = {};
let tempAnswers = {};
initialSetup();

// Current tests in use
const hwTests  = ['C02', 'A11', '71E', 'A10', 'MC2', 'B05', 'D03', '74C']
const icTests  = ['C03', 'B02', 'A09', 'B04', 'MC3', '74F', 'Z15', '72C']
const othTests = ['67C', 'ST1', '64E', '61C', '59F', '69A', 'ST2', '66F',
                  '61F', '55C', '58E', '71C', '71G', '68G', '68A', '72F',
                  '71H', 'C01', '67A', '63C', '61D', '73E', '73C', '71A',
                  '66C', '65E', '63F', '63D', '72G', '69F', '70G', '65C', '74H']
        
// Other needed info
let coloring = {'Completed' : 'green', 'in-time' : 'green', 'not in time' : 'greenShade', 'poor conditions' : 'greenShade', 'previously completed' : 'greenShade', 'forgot' : 'orange', 'assigned' : 'yellow', 'reassigned' : 'yellow', 'in-center' : 'red', 'partial' : 'greenShade', 'did not do' : 'gray', 'white' : 'white', 'guess' : 'pink'};
let keys_to_skip = ['Status', 'TestType', 'ScaledScore', 'Score', 'Date', 'Time', 'GuessEndPoints']
let test_view_type = undefined;
let mark_type = 'answer';
let newStatus = undefined;
let date = new Date()
let storage = firebase.storage();

/**
 * create html element
 * @param {String} elementType tag name for the element that will be created
 * @param {[String]} classes classes for the element
 * @param {[String]} attributes attributes for the element
 * @param {[String]} values values for each attribute for the element
 * @param {String} text innerhtml for the element
 * @returns {HTMLElement} html element of the given tag
 */
function createElement(elementType, classes = [], attributes = [], values = [], text = "") {
  // Initialize the element
  let element = document.createElement(elementType);

  // Set each of the specified attributes for the element
  if (attributes.length == values.length && attributes.length > 0) {
    for (let i = 0; i < attributes.length; i++) {
      element.setAttribute(attributes[i], values[i]);
    }
  }

  // Add the classes to the element
  for (let i = 0; i < classes.length; i++) {
    element.classList.add(classes[i]);
  }

  // Set the inner html text
  if (text != "") {
    element.innerHTML = text;
  }

  // Return the element
  return element;
}

function initialSetup() {
  // Grab the test data from Fb
  grabTestData();

  //FIXME: This needs to set to the date of the session according to schedule and not just the time that the page was loaded
  const studentUID = queryStrings()["student"];

  if (studentUID) {
    //get the student's hw scores
    let hwDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("hw");

    //need to somehow get this promise to return when complete....
    return hwDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        oldTestAnswers = doc.data();
        testAnswers = JSON.parse(JSON.stringify(oldTestAnswers));
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
    });
  }
}

function grabTestData() {
  // Fb reference
  let ref = firebase.firestore().collection('Dynamic-Content').doc('act-tests').collection('Test-Data')

  // Grab all tests from the Dynamic-Content collection and piece them together
  ref.get()
  .then((snapshot) => {
    snapshot.forEach((doc) => {
      testData[doc.id] = doc.data()
    })
  })
}

/**
 * Hide all forms except for the one passed in
 * @param {String} id the id of the form to display
 * @param {String} test_view_type the type of tests to display, if applicable
 */
function changeSection(section) {

  // Setup the forms
  let goodForms = [section + 'Section']
  const allForms = ["compositeSection", "englishSection", "mathSection", "readingSection", "scienceSection"];

  // Hide all forms except for the desired form(s)
  let form = undefined;
  for (let i = 0; i < allForms.length; i++) {
    form = document.getElementById(allForms[i]);
    if (goodForms.includes(allForms[i])) {
      form.style.display = "flex";
    }
    else {
      form.style.display = "none";
    }
  }
}

function swap(section, swapTo) {
  let chat = document.getElementById(section + 'Chat')
  let lessons = document.getElementById(section + 'LessonsForm')

  if (swapTo == 'chat') {
    chat.classList.remove('hidden')
    lessons.classList.add('hidden')
  }
  else if (swapTo == 'lessons') {
    chat.classList.add('hidden')
    lessons.classList.remove('hidden')
  }
}