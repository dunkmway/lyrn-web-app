const firebaseConfig = {
  apiKey: "AIzaSyD8GSMZzjbubQ7AGcQKIV-enpDYpz_07mo",
  authDomain: "lyrn-web-app.firebaseapp.com",
  projectId: "lyrn-web-app",
  storageBucket: "lyrn-web-app.appspot.com",
  messagingSenderId: "80732012862",
  appId: "1:80732012862:web:22ffb978c80a1d2a0f2c6f",
  measurementId: "G-F2QZT3W2CX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const appCheck = firebase.appCheck();
appCheck.activate(
  '6LejnxEdAAAAAE01TS3gbg8dFJHw6dPgWv3YJBnK',
  true
)

function initialSetup() {
  bannerSetup();
  // checkModalSetup();
  // reserveModalSetup();
  modalSetup('checkProgram', clearCheckModal);
  modalSetup('reserveProgram', clearCheckModal);
  modalSetup('availableClassesModal', () => {});
  modalSetup('availableStudyGroupsModal', () => {});
  contactFormSetup();
  let queryCourse = queryStrings()['course'];

  if (queryCourse) {
    openCourse(queryCourse)
  }

  //initialze the check program
  checkProgramInitialSetup();
}

function openCourse(sectionID) {
  document.getElementById(sectionID + '-section').checked = true;
}

function openProgram(event) {
  const program = event.target.id;
  document.querySelectorAll('.program').forEach(element => {
    element.classList.remove('open')
  });

  const programElement = document.querySelector(`.program.${program}`)
  programElement.classList.add('open');
  const programPosition = programElement.getBoundingClientRect().top;
  const offsetPosition = programPosition + window.pageYOffset - (window.innerWidth < 800 ? 100 : 60);
  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
}); 
}

function checkModalSetup() {
  document.querySelector('#checkProgram > .modal-body > .close').addEventListener('click', () => {
    document.querySelector('#checkProgram').classList.remove('show');
    clearCheckModal();
  })

  document.querySelector('#checkProgram').addEventListener('click', (e) => {
    if (e.target !== e.currentTarget) return;
    document.querySelector('#checkProgram').classList.remove('show');
    clearCheckModal();
  })
}

function reserveModalSetup() {
  document.querySelector('#reserveProgram > .modal-body > .close').addEventListener('click', () => {
    document.querySelector('#reserveProgram').classList.remove('show');
    clearCheckModal();
  })

  document.querySelector('#reserveProgram').addEventListener('click', (e) => {
    if (e.target !== e.currentTarget) return;
    document.querySelector('#reserveProgram').classList.remove('show');
    clearCheckModal();
  })
}

function modalSetup(modalID, closeCallback) {
  document.querySelector(`#${modalID} > .modal-body > .close`).addEventListener('click', () => {
    document.querySelector(`#${modalID}`).classList.remove('show');
    closeCallback();
  })

  document.querySelector(`#${modalID}`).addEventListener('click', (e) => {
    if (e.target !== e.currentTarget) return;
    document.querySelector(`#${modalID}`).classList.remove('show');
    closeCallback();
  })
}

function bannerSetup() {
  document.querySelector('.banner').addEventListener('click', () => {
    document.querySelector('#firstSessionFreeModal').classList.add('show');
  })

  document.querySelector('#firstSessionFreeModal > .modal-body > .close').addEventListener('click', () => {
    document.querySelector('#firstSessionFreeModal').classList.remove('show');
  })

  document.querySelector('#firstSessionFreeModal').addEventListener('click', (e) => {
    if (e.target !== e.currentTarget) return;
    document.querySelector('#firstSessionFreeModal').classList.remove('show');
  })

  document.querySelector('#firstSessionFreeModal > .modal-body .submit').addEventListener('click', async (e) => {
    // check if the email is valid
    const email = document.querySelector('#firstSessionFreeModal .modal-body input');
    const error = document.querySelector('#firstSessionFreeModal .modal-body .error')
    const submit = e.target;

    submit.disabled = true;
    submit.classList.add('loading');
    submit.textContent = 'Sending promo'
    error.textContent = '';

    if (!isEmailValid(email.value)) {
      error.textContent = 'There seems to be something wrong with the email you entered.'; 
      submit.disabled = false;
      submit.classList.remove('loading');
      submit.textContent = 'Ready to Lyrn'
      return;
    }

    await sendLeadRequest(email.value, 'ACT-firstSessionFree', 'pricing');

    submit.disabled = false;
    submit.classList.remove('loading');
    submit.textContent = 'Promo sent!'
  })
}

function contactFormSetup() {
  const inputs = document.querySelectorAll('#reserveProgram .contact-form input');

  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (!input.value) {
        document.querySelector(`label[for="${input.id}"]`).classList.add('placeholder')
      }
      else {
        document.querySelector(`label[for="${input.id}"]`).classList.remove('placeholder')
      }
    })
  })
}

// set up the practice test request
document.querySelector('.practice-test-wrapper button').addEventListener('click', async (e) => {
  // check if the email is valid
  const email = document.querySelector('.practice-test-wrapper input');
  const error = document.querySelector('.practice-test-wrapper .error')
  const submit = e.target;

  submit.disabled = true;
  submit.classList.add('loading');
  submit.textContent = 'Sending practice tests'
  error.textContent = '';

  if (!isEmailValid(email.value)) {
    error.textContent = 'There seems to be something wrong with the email you entered.'; 
    submit.disabled = false;
    submit.classList.remove('loading');
    submit.textContent = 'Submit'
    return;
  }

  await sendPracticeTestRequest(email.value, 'ACT-practiceTest', 'pricing');

  submit.disabled = false;
  submit.classList.remove('loading');
  submit.textContent = 'Practice tests sent!'
})

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendLeadRequest(email, type, page) {
  let response = await firebase.functions().httpsCallable('home-sendLeadRequest')({
    email,
    type,
    page,
    timestamp: new Date()
  });

  return response.data
}

async function sendPracticeTestRequest(email, type, page) {
  let response = await firebase.functions().httpsCallable('home-sendPracticeTestRequest')({
    email,
    type,
    page,
    timestamp: new Date()
  });

  return response.data
}




/********************* program selection *********************/
const CURRENT_LOCATION = 'WIZWBumUoo7Ywkc3pl2G'; // id for the online location (this is hard coded for the foreseeable future)
const LESSON_ORDER = ['english', 'math', 'reading', 'science'];
const TIME_SLOT_FREQUENCY = 60; // minute difference for seeing openings
const INVOICE_EXPIRATION_TIME = 48; // hours until invoice expires

let blacklistTutors_master = [];

let BASICS_SIX = {
  score: 1, // number of points we guarantee with this program
  name: 'ACT Basics', // name of the program
  value: 'actBasics', // value of the program
  start: null, // start date (will be calculated later)
  end: null, // end date (will be calculated later)
  testDoc: null, // test doc that will be taken at the end of the program
  programLength: 6, // length of the entire porgram in weeks
  sessionLength: 1, // length of one session in hours
  sessionsPerWeek: 2, // number of sessions per week
  price: 75, // price per hour
  sections: LESSON_ORDER, // which section will be taught
}

let BASICS_EIGHT = {
  score: 2, // number of points we guarantee with this program
  name: 'ACT Basics', // name of the program
  value: 'actBasics', // value of the program
  start: null, // start date (will be calculated later)
  end: null, // end date (will be calculated later)
  testDoc: null, // test doc that will be taken at the end of the program
  programLength: 8, // length of the entire porgram in weeks
  sessionLength: 1, // length of one session in hours
  sessionsPerWeek: 2, // number of sessions per week
  price: 75, // price per hour
  sections: LESSON_ORDER, // which section will be taught
}

let GUIDED_SIX = {
  score: 3, // number of points we guarantee with this program
  name: 'Guided ACT', // name of the program
  value: 'actGuided', // value of the program
  start: null, // start date (will be calculated later)
  end: null, // end date (will be calculated later)
  testDoc: null, // test doc that will be taken at the end of the program
  programLength: 6, // length of the entire porgram in weeks
  sessionLength: 2, // length of one session in hours
  sessionsPerWeek: 2, // number of sessions per week
  price: 75, // price per hour
  sections: LESSON_ORDER, // which section will be taught
}

let GUIDED_EIGHT = {
  score: 4, // number of points we guarantee with this program
  name: 'Guided ACT', // name of the program
  value: 'actGuided', // value of the program
  start: null, // start date (will be calculated later)
  end: null, // end date (will be calculated later)
  testDoc: null, // test doc that will be taken at the end of the program
  programLength: 8, // length of the entire porgram in weeks
  sessionLength: 2, // length of one session in hours
  sessionsPerWeek: 2, // number of sessions per week
  price: 75, // price per hour
  sections: LESSON_ORDER, // which section will be taught
}

const SET_PROGRAMS = [
  BASICS_SIX,
  BASICS_EIGHT,
  GUIDED_SIX,
  GUIDED_EIGHT
]

let currentProgramDetails = {
  startAfterDate: new Date(),
  name: null,
  value: null,
  score: null,
  programLength: null,
  start: null,
  end: null,
  testDoc: null, 
  sessionLength: null,
  sessionsPerWeek: null,
  price: null,
  sections: null,
  dayIndexes: [],
  sessionStartTime: null,
  contact: {
    parent: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      uid: null
    },
    student: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      uid: null
    }
  },
  openings: [],
  weeklyOpenings: {},
  firstTutors: {},
}

async function checkProgramInitialSetup() {
  // set the check availability buttons into a loading state
  document.querySelectorAll('button.select').forEach(button => {
    button.disabled = true;
  })

  //calculate the program cards
  await updateSetPrograms();

  // initialize the openings with the longest program first calculated
  if (GUIDED_SIX.start || GUIDED_EIGHT.start) {
    const earliestStart = new Date(Math.min(GUIDED_SIX?.start?.getTime(), GUIDED_EIGHT?.start?.getTime()));
    const latestEnd = new Date(Math.max(GUIDED_SIX?.end?.getTime(), GUIDED_EIGHT?.end?.getTime()));
    await Promise.all([
      calculateOpeningsMaster(earliestStart, latestEnd),
      calculateQualifiedTutors(CURRENT_LOCATION),
    ]);
  }

  // unset the check availability buttons into a loading state
  document.querySelectorAll('button.select').forEach(button => {
    button.disabled = false;
  })
}

async function calculateQualifiedTutors(location) {
  let response = await firebase.functions().httpsCallable('act_sign_up-getQualifiedTutors')({
    location,
    qualifications: ['actBasics-english', 'actBasics-math', 'actBasics-reading', 'actBasics-science', 'actGuided-english', 'actGuided-math', 'actGuided-reading', 'actGuided-science']
  });

  qualifiedTutors_master = response.data;
}

async function calculateOpeningsMaster(startDate, endDate) {
  const start = beginningOfDate(startDate);
  const end = endOfDate(endDate);

  const openDocIDs = [];
  let current = new Date(start);
  // get all of the times for the beginnning UTC dates for all days inclusive of start and end
  while (current.getTime() < end.getTime()) {
    openDocIDs.push(beginningOfUTCDate(current).getTime());
    current = new Date(new Date(current).setDate(current.getDate() + 1));
  }
  // tack on one extra for the end of date (will be different)
  openDocIDs.push(beginningOfUTCDate(end).getTime())

  // get all of these documents from firebase
  const openDocs = await Promise.all(openDocIDs.map(openDocID => firebase.firestore().collection('Locations').doc(CURRENT_LOCATION).collection('Calendar-Openings').doc(openDocID.toString()).get()));
  // go through the docs and save them to openings_master
  openings_master = {};
  openDocs.forEach(doc => {
    if (doc.exists) {
      for (const time in doc.data()) {
        openings_master[time] = doc.data()[time];
      }
    }
  })
}

async function updateSetPrograms() {
  // the start after date should be updated for the current program
  // use this date to calculate the start and end for the different programs
  const [
    sixWeekProgram,
    eightWeekProgram
  ] = await Promise.all([
    await getProgramStartEnd(6, currentProgramDetails.startAfterDate),
    await getProgramStartEnd(8, currentProgramDetails.startAfterDate)
  ])

  SET_PROGRAMS.forEach(program => {
    if (program.programLength == 6) {
      program.start = sixWeekProgram.startDate;
      program.end = sixWeekProgram.endDate;
      program.testDoc = sixWeekProgram.testDoc
    }
    else if (program.programLength == 8) {
      program.start = eightWeekProgram.startDate;
      program.end = eightWeekProgram.endDate;
      program.testDoc = eightWeekProgram.testDoc
    }
  })
}

function createAnalyticsEvent(data) {
  return firebase.firestore().collection('Analytics').doc().set({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
}

function availableClassesCallback(programIndex) {
  document.querySelector('#availableClassesModal').classList.add('show');
  createAnalyticsEvent({
    eventID: 'pricing-availableClassesClicked',
    additionalData: {
      programIndex
    }
  });
  // setClassesSelected(programIndex);
}

function availableStudyGroupsCallback(programIndex) {
  document.querySelector('#availableStudyGroupsModal').classList.add('show');
  createAnalyticsEvent({
    eventID: 'pricing-availableStudyGroupsClicked',
    additionalData: {
      programIndex
    }
  });
  // setStudyGroupsSelected(programIndex);
}

function checkProgramCallback(programIndex) {
  document.querySelector('#checkProgram').classList.add('show');
  createAnalyticsEvent({
    eventID: 'pricing-checkAvailabilityClicked',
    additionalData: {
      programIndex
    }
  });
  setProgramSelected(programIndex);
}

function moveToReserveProgram() {
  document.querySelector('#checkProgram').classList.remove('show');
  document.querySelector('#reserveProgram').classList.add('show');

  createAnalyticsEvent({
    eventID: 'pricing-reserveClicked',
    additionalData: {
      programDetails: {
        programLength: currentProgramDetails.programLength,
        name: currentProgramDetails.name,
        score: currentProgramDetails.score,
        dayIndexes: currentProgramDetails.dayIndexes,
        sessionStartTime: currentProgramDetails.sessionStartTime,
        sessionLength: currentProgramDetails.sessionLength,
        start: currentProgramDetails.start,
        end: currentProgramDetails.end
      }
    }
  });

  // udpate the program summary
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daySort = (a,b) => {
    if (a == 6) {
      return -1;
    }
    if (b == 6) {
      return 1;
    }

    return a - b;
  }
  const firstDay = nextDay(currentProgramDetails.start, currentProgramDetails.dayIndexes.sort(daySort)[0]);
  const lastDay = nextDay(currentProgramDetails.end, currentProgramDetails.dayIndexes.sort(daySort)[1], -1)
  document.querySelector('.program-summary').innerHTML = `

    <p>You are reserving our ${currentProgramDetails.programLength} week ${currentProgramDetails.name} program which 
    <a href="guarantee.html" target="_blank">guarantees</a> a 
    ${currentProgramDetails.score} point increase on the ACT. This program will start ${convertFromDateInt(firstDay.getTime()).shortReadable}
    and continue every ${days[currentProgramDetails.dayIndexes.sort()[0]]} and ${days[currentProgramDetails.dayIndexes.sort()[1]]}
    until ${convertFromDateInt(lastDay.getTime()).shortReadable}. Lessons will start at 
    ${translateMilitaryHourStr(currentProgramDetails.sessionStartTime)} and be ${currentProgramDetails.sessionLength} 
    hour${currentProgramDetails.sessionLength == 1 ? '' : 's'} long.</p>
  `
}

function backToCheckProgram() {
  document.querySelector('#checkProgram').classList.add('show');
  document.querySelector('#reserveProgram').classList.remove('show');
}

function setProgramSelected(setProgramIndex) {
  // get the program details that was selected
  const selectedProgram = SET_PROGRAMS[setProgramIndex];

  // transfer the program details to the current program details
  for (const key in selectedProgram) {
    currentProgramDetails[key] = selectedProgram[key];
  }

  // unselect all of the day and time inputs
  clearCheckModal();
}

function clearCheckModal() {
  clearDayAndTime();
  hideAllSteps();
}

function hideAllSteps() {
  document.querySelector('.reserve-prompt').classList.add('hide');
}

function clearDayAndTime() {
  //unset the current program
  currentProgramDetails.dayIndexes = [];
  currentProgramDetails.sessionStartTime = null;
  currentProgramDetails.openings = null;
  currentProgramDetails.weeklyOpenings = null;

  // deactivate the days
  document.querySelectorAll('.date-time .selection-wrapper input').forEach(input => {
    input.classList.remove('invalid');
    input.checked = false;
  });

  // remove the times
  document.getElementById('lessonLength').textContent = '';
  removeAllChildNodes(document.getElementById('openTimes'));
}

function daySelectedCallback(event) {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const target = event.target;
  const isChecked = target.checked;
  const targetDay = target.id;
  const targetIndex = daysOfWeek.indexOf(targetDay) + 1;

  // re-disbale the reserve button
  document.getElementById('firstReserve').disabled = true;

  // if we don't have the number of sessions per week, start, nor end then return
  if (!currentProgramDetails.sessionsPerWeek || !currentProgramDetails.start || !currentProgramDetails.end) {
    customConfirm('Please select a program before setting the days.', '', 'OK', () => {}, () => {});
    target.checked = false;
    return;
  }

  // if we don't have the master lists return
  if (!qualifiedTutors_master || !openings_master || !blacklistTutors_master) {
    customConfirm('We are still calculating the openings for tutors. Please make sure all data above has been inputted then try again.', '', 'OK', () => {}, () => {});
    target.checked = false;
    return;
  }

  // remove invalid from all inputs and uncheck them all
  // these will be added back after we finalize the currentProgram
  document.querySelectorAll('.date-time .selection-wrapper input').forEach(input => {
    input.classList.remove('invalid');
    input.checked = false;
  });

  // these are the indexes for the dayOfWeek array
  // compensate for the + 1 on the target index
  const dayBeforeIndex = modulos(targetIndex - 2, daysOfWeek.length);
  const dayAfterIndex = modulos(targetIndex, daysOfWeek.length);

  // split based on if the checkbox is checked or not
  if (isChecked) {
    // add in this day to the current program
    currentProgramDetails.dayIndexes.push(targetIndex);

    // remove the days next to the target day in the current program
    // remove from the current program details
    const dayIndexBefore = currentProgramDetails.dayIndexes.indexOf(dayBeforeIndex + 1);
    const dayIndexAfter = currentProgramDetails.dayIndexes.indexOf(dayAfterIndex + 1);
    // we have to remove the latest of the two first so that removing doesn't make mistakes
    if (dayIndexBefore > dayIndexAfter) {
      if (dayIndexBefore != -1) {
        currentProgramDetails.dayIndexes.splice(dayIndexBefore, 1);
      }
      if (dayIndexAfter != -1) {
        currentProgramDetails.dayIndexes.splice(dayIndexAfter, 1);
      }
    }
    else {
      if (dayIndexAfter != -1) {
        currentProgramDetails.dayIndexes.splice(dayIndexAfter, 1);
      }
      if (dayIndexBefore != -1) {
        currentProgramDetails.dayIndexes.splice(dayIndexBefore, 1);
      }
    }

    // we should have at most sessionsPerWeek dayIndexes at this point
    if (currentProgramDetails.sessionsPerWeek < currentProgramDetails.dayIndexes.length) {
      // we need to remove the first element
      const firstDayIndex = currentProgramDetails.dayIndexes[0] - 1;
      document.getElementById(daysOfWeek[firstDayIndex]).checked = false;
      currentProgramDetails.dayIndexes.splice(0, 1);
    }
    else {
      //clear the existing times
      removeAllChildNodes(document.getElementById('openTimes'));
      document.getElementById('lessonLength').textContent = '';
      // hide all steps
      hideAllSteps();
    }
  }
  else {
    // remove the day from the current program day indexes
    currentProgramDetails.dayIndexes.splice(currentProgramDetails.dayIndexes.indexOf(targetIndex), 1);
    //clear the existing times
    removeAllChildNodes(document.getElementById('openTimes'));
    document.getElementById('lessonLength').textContent = '';
    // hide all steps
    hideAllSteps();
  }

  // go through the dayIndexes and check them again and add invalid to the elements next to them
  currentProgramDetails.dayIndexes.forEach(day => {
    document.getElementById(daysOfWeek[day - 1]).checked = true;
    document.getElementById(daysOfWeek[modulos(day - 2, daysOfWeek.length)]).classList.add('invalid');
    document.getElementById(daysOfWeek[modulos(day, daysOfWeek.length)]).classList.add('invalid');
  })

  // if we have all of the days we need generate the open times
  if (currentProgramDetails.sessionsPerWeek == currentProgramDetails.dayIndexes.length) {
    generateOpenTimes();
  }
}

async function generateOpenTimes() {
  //disable all of the inputs
  document.querySelectorAll('.date-time .selection-wrapper input').forEach(input => input.disabled = true)

  // we want to give the parent the most possible options for when to have their porgram
  // not the most efficient way of doing this but for completion we have to check all possible lesson orders
  // in total that is 24 iteration of getting the open program times
  // go through each and save the open times along with the permutation that produces them
  let programAllOpenTimes = [];
  const permutations = arrayRandomOrder(arrayPermutations(currentProgramDetails.sections));

  permutations.forEach(permutation => {
    const programOpenTimes = getOpenProgramTimes(
      currentProgramDetails.value,
      permutation,
      currentProgramDetails.start,
      currentProgramDetails.end,
      currentProgramDetails.sessionLength,
      currentProgramDetails.dayIndexes,
      TIME_SLOT_FREQUENCY
    );
    programAllOpenTimes.push({
      lessonOrder: permutation,
      programOpenTimes
    });
  })

  currentProgramDetails.openings = programAllOpenTimes;

  let weeklyOpenTimes = {};
  // go through all program open times and find the first permutation that sets the time key to true and store it. do this until all time slots are filled
  for (let i = 0; i < programAllOpenTimes.length; i++) {
    setWeeklyOpenTimes(weeklyOpenTimes, programAllOpenTimes[i].programOpenTimes, programAllOpenTimes[i].lessonOrder);
    // check if all of the keys are set to true, if so break out
    let allTrue = true;
    for (const time in weeklyOpenTimes) {
      if (!time.isOpen) {
        allTrue = false;
        break;
      }
    }
    if (allTrue == true) {
      break;
    }
  }

  currentProgramDetails.weeklyOpenings = weeklyOpenTimes;
  renderWeeklyOpenTimes(weeklyOpenTimes);

  document.querySelectorAll('.date-time .selection-wrapper input').forEach(input => input.disabled = false)
}

function renderWeeklyOpenTimes(times) {
  // add in the lesson length
  document.getElementById('lessonLength').textContent = `
  Lessons start at the following times and are 
  ${currentProgramDetails.sessionLength} 
  hour${currentProgramDetails.sessionLength == 1 ? '' : 's'} long.
  `;
  
  const timeWrapper = document.getElementById('openTimes');

  //clear the existing times
  removeAllChildNodes(timeWrapper);

  // add in the times
  for (const time in times) {
    const item = document.createElement('div');

    const radio = document.createElement('input');
    radio.setAttribute('type', 'radio');
    radio.setAttribute('name', 'times')
    radio.setAttribute('id', `time-${time}`);
    radio.addEventListener('change', (event) => {
      if (event.target.checked) {
        currentProgramDetails.sessionStartTime = time;
        document.getElementById('firstReserve').disabled = false;
      }
    });
    //check if the time is unavailable
    if (!times[time].isOpen) {
      item.classList.add('disabled');
      radio.disabled = true;
    }

    const label = document.createElement('label');
    label.setAttribute('for', `time-${time}`);
    label.textContent = translateMilitaryHourStr(time)

    item.appendChild(radio);
    item.appendChild(label);
    timeWrapper.appendChild(item);
  };

  // show the reserve prompt
  document.querySelector('.reserve-prompt').classList.remove('hide')
}

function getOpenProgramTimes(programType, lessonOrder, startDate, endDate, sessionLength, dayIndexes, timeFrequency) {
  // get all of the days that match the dayIndexes from the startDate to the endDate

  // order the dayIndexes
  // we start the week on saturday to allow for an additional saturday to compensate for the day of the test
  for (let i = 0; i< dayIndexes.length; i++) {
    if (dayIndexes[i] < 0 || dayIndexes[i] > 6) {
      throw 'the selected days indexes are not within the range [0, 6]'
    }
  }
  //sort the dayIndexes so that 6 comes first then everything else in number order
  dayIndexes.sort((a, b) => {
    if (a == 6) {
      return -1;
    }
    if (b == 6) {
      return 1
    }
    return a - b;
  });

  // keep track of the program dates
  let programDates = [];

  // cursor of the index for the dayIndexes array
  let currentDayCursor = 0;
  // date that will be pushed to the programDates
  let currentDate = nextDay(new Date(startDate), dayIndexes[currentDayCursor])

  while (currentDate.getTime() < endDate.getTime()) {
    // push the current date that is valid
    programDates.push(currentDate);

    //update the currentDayCursor
    currentDayCursor = (currentDayCursor + 1) % dayIndexes.length;

    // if dayIndexes == 1 then we get an infinite loop since the next day will give the same day over and over
    if (dayIndexes.length > 1) {
      // get the next day given the day index
      currentDate = nextDay(currentDate, dayIndexes[currentDayCursor]);
    }
    else {
      // we want to force the nextDay to get the day with a week difference of 1
      currentDate = nextDay(currentDate, dayIndexes[currentDayCursor], 1);
    }
  }

  // get all of the times possible for the programDates
  const programTimes = programDates.flatMap((programDate, index) => {
    //start at the beginning of the day
    programDate = beginningOfDate(programDate);

    // go through all the timeFrequency time intervals
    let dateTimes = [];
    let currentTime = new Date(programDate);

    // while the times are still within the date
    while (currentTime.getDate() == programDate.getDate()) {
      dateTimes.push(currentTime);

      // increase the time by timeFrequency minutes
      currentTime = new Date(new Date(currentTime).setMinutes(currentTime.getMinutes() + timeFrequency));
    }

    return dateTimes;
  })

  // go through the open tutor times and remove the ones that aren't qualified on those days
  // first determine which program days will be assigned which lesson types
  const programLessonTypes = getProgramLessonTypes(programDates, lessonOrder)
  const programOpenTutors = getOpenTutors(programTimes, sessionLength);
  const programQualifiedTutors = getQualifiedTutors(lessonOrder.map(lessonType => programType + '-' + lessonType));
  const blacklistTutors = getBlacklistedTutors();

  // get the intersection of the the open tutors and the qualified tutors for each time of the open tutors
  const programQualifiedOpenTutors = programOpenTutors.map(openTutors => {
    const date = openTutors.date;
    const tutors = openTutors.tutors;

    // get the lesson type for that date
    const lessonType = programLessonTypes.find(lesson => beginningOfDate(lesson.date).getTime() == beginningOfDate(date).getTime()).lessonType;

    // only add the tutors that are qualified and not blacklisted
    const qualifiedTutors = programQualifiedTutors.filter(tutor => tutor.qualifications.includes(programType + '-' + lessonType) && !blacklistTutors.includes(tutor));

    return {
      date,
      tutors: arrayIntersection(tutors, qualifiedTutors.map(tutor => tutor.id)),
      lessonType
    }
  })

  return programQualifiedOpenTutors;
}

function getOpenTutors(openTimes, eventLength) {
  // figure out all of the docs to get from firebase given the openTimes
  // this involves getting the beginning timestamp for the openTimes in UTC time

  // let openDocIDs = [];

  // openTimes.forEach(time => {
  //   const midnightUTC = beginningOfUTCDate(time);
  //   if (!openDocIDs.includes(midnightUTC.getTime().toString())) {
  //     openDocIDs.push(midnightUTC.getTime().toString());
  //   }
  // })

  // get the open docs from firebase
  // const openDocs = await Promise.all(openDocIDs.map(openDocID => firebase.firestore().collection('Locations').doc(CURRENT_LOCATION).collection('Calendar-Openings').doc(openDocID).get()));
  const openTutorMaster = {}; // object whose keys are timestamps and the value an array that is an array of the tutor UID's who are open

  // copy over the openings master and use for calculating openings
  if (!openings_master) {
    alert('We are still calculating the openings for tutors please wait and try again.')
    return;
  }
  const openingsMaster_copy = JSON.parse(JSON.stringify(openings_master));

  for (const time in openingsMaster_copy) {
    const events = openingsMaster_copy[time].filter(opening => opening.type == 'event').map(opening => opening.tutor);
    const availabilities = openingsMaster_copy[time].filter(opening => opening.type == 'availability').map(opening => opening.tutor);

    if (events.length > availabilities.length) {
      // we found a major error in the openings
      console.log('major openings error!!!')
      // alert('There is a major issue with the calendar. Contact the Lyrn developers immediately.')
    }

    openTutorMaster[time] = arraySubtraction(availabilities, events);
  }
  
  // openDocs.forEach(doc => {
  //   if (doc.exists) {
  //     // go through each time and filter out the tutors that have events
  //     // we should check here if the tutor has an event but isn't available
  //     // it shouldn't be possible but tell teh user to contact the devs in the case
  //     const data = doc.data()
  //     for (const time in data) {
  //       const events = data[time].filter(opening => opening.type == 'event').map(opening => opening.tutor);
  //       const availabilities = data[time].filter(opening => opening.type == 'availability').map(opening => opening.tutor);

  //       if (events.length > availabilities ) {
  //         alert('There is a BIG issue with the calendar. Contact the Lyrn developers immediately.')
  //       }

  //       openTutorMaster[time] = arraySubtraction(availabilities, events);
  //     }
  //   }
  // })

  // go through all of the times given the eventLength and determine which tutors are available
  const openTutors = openTimes.map(time => {
    const eventStart = time;
    const eventEnd = new Date(new Date(time).setMinutes(time.getMinutes() + (eventLength * 60)));

    // determine all of the 30 minute opening times we need to check
    let tempTime = new Date(eventStart);
    let timesToCheck = [];
    while (tempTime.getTime() < eventEnd.getTime()) {
      timesToCheck.push(tempTime);
      // the opening times are set by 30 minute increments
      tempTime = new Date(new Date(tempTime).setMinutes(tempTime.getMinutes() + 30));
    }

    // get all of the tutors that are open at the time to check
    const openingsToCheck = timesToCheck.map(time => openTutorMaster[time.getTime()] ?? []);

    return {
      date: time,
      tutors: openingsToCheck.length > 0 ? openingsToCheck.reduce((prev, curr) => arrayIntersection(prev, curr)) : []
    }
  })

  return openTutors;
}

function getQualifiedTutors(qualifications) {
  if (!qualifiedTutors_master) {
    alert('We are still calculating the openings for tutors please wait and try again.')
    return;
  }
  return qualifiedTutors_master.filter(tutor => tutor.qualifications.some(qualification => qualifications.includes(qualification)));
}

function getBlacklistedTutors() {
  return blacklistTutors_master
}

function getProgramLessonTypes(programDates, lessonTypeOrder) {
  // we will assume that all lessons will be taught in the given order
  const lessonTypeLength = lessonTypeOrder.length;

  // go through the dates and assign in order the lesson types
  return programDates.map((date, index) => { 
    return {
      date, 
      lessonType: lessonTypeOrder[index % lessonTypeLength]
    }
  });
}

/**
 * Modify the weeklyOpenTimes object with the times that are open and which lesson order allows for it.
 * @param {Object} weeklyOpenTimes this object will be modified and will store time keys that corsspond to if the time is open and which permutation first made that time available
 * @param {Object} programTimes the full list of times that the lesson could be at
 * @param {String[]} lessonOrder the specific permutation that this program time has come from
 */
function setWeeklyOpenTimes(weeklyOpenTimes, programTimes, lessonOrder) {
  let timeIsOpen = {};

  programTimes.forEach(openDate => {
    const isTutorOpen = openDate.tutors.length > 0;
    const timeKey = openDate.date.getHours().toString().padStart(2, '0') + ':' + openDate.date.getMinutes().toString().padStart(2, '0');
    // initialize the time
    if (!weeklyOpenTimes[timeKey]) { 
      weeklyOpenTimes[timeKey] = {};
    }

    // only check the time keys that are set to false (or undefined) in weeklyOpenTimes
    if (!weeklyOpenTimes[timeKey].isOpen) {
      timeIsOpen[timeKey] = ( timeIsOpen[timeKey] == true || timeIsOpen[timeKey] == undefined ) ? isTutorOpen : false;
    }
  })
  
  // run through the timeIsOpen and transfer its data to weeklyOpenTimes
  for (const time in timeIsOpen) {
    weeklyOpenTimes[time] = {
      isOpen: timeIsOpen[time],
      lessonOrder: timeIsOpen[time] ? lessonOrder : []
    }
  }
}

/**
 * 
 * @param {Number} programWeekLength number of weeks the program is long
 * @param {Date} startAfterDate date to check for program after
 * @param {FirebaseDoc} testDocStartAfter a cursor to be used when querying for the next test
 * @returns {Promise<Object>} object that includes startDate, endDate, and testDoc
 */
 async function getProgramStartEnd(programWeekLength, startAfterDate, testDocStartAfter = null) {
  // get the next test after the test cursor
  const nextTest = await getNextTestDoc(startAfterDate, testDocStartAfter);
  //if no test is next then return null
  if (!nextTest) {
    return {
      startDate: null,
      testDoc: null,
      endDate: null,
    }
  }

  // calculate the possble start date
  const possibleStart = beginningOfDate(weeksBefore(new Date(nextTest.data().start), programWeekLength));
  const endOfToday = endOfDate(startAfterDate);

  //if we can't start the program after tonight try again with the next test
  if (possibleStart.getTime() < endOfToday) {
    return await getProgramStartEnd(programWeekLength, startAfterDate, nextTest);
  }
  
  // we can start after this saturday
  return {
    startDate: possibleStart,
    testDoc: nextTest,
    endDate: beginningOfDate(nextTest.data().start)
  }
}

function contactInfoFocusOutCallback(event) {
  const target = event.target;
  const id = target.id;
  const type = id.split('-')[0];
  const key = id.split('-')[1];
  const value = key.includes('Name') ? captalizeFirstLetter(target.value.trim()) : target.value.trim();

  currentProgramDetails.contact[type][key] = value;
}

/**
 * 
 * @param {Date} startAfterDate date to check for test after
 * @param {FirebaseDoc?} cursorTestDoc cursor to start looking for test after
 * @returns {Promise<FirebaseDoc[]>} array of test event docs at most numTests
 */
async function getNextTestDoc(startAfterDate, cursorTestDoc) {
  let testQuery = firebase.firestore().collection('Events')
  .where('type', '==', 'test')
  .where('start', '>', startAfterDate.getTime())
  .orderBy('start')
  .limit(1)

  if (cursorTestDoc) {
    testQuery = testQuery.startAfter(cursorTestDoc);
  }

  const testSnapshot = await testQuery.get();
  return testSnapshot.docs[0];
}

/**
 * 
 * @param {Date} date starting date
 * @param {Number} numWeeks weeks before starting date
 * @returns {Date} date numWeeks before starting date
 */
function weeksBefore(date, numWeeks) {
  if (!date) { return null }
  return new Date(new Date(date).setDate(new Date(date).getDate() - (numWeeks * 7)));
}

/**
 * 
 * @param {Date} date starting date
 * @param {Number} day day index of desired day
 * @returns {Date} date of the day index within this week (Sun - Sat)
 */
function dayThisWeek(date, day) {
  if (!date) { return null }
  return new Date(new Date(date).setDate(new Date(date).getDate() + (day - new Date(date).getDay())));
}

/**
 * 
 * @param {Date} date starting date
 * @param {Number} day day index of desired day (will return same date if date day is that same as day)
 * @param {Number} weekDiff increase the date by this many weeks first (i.e. use 1 to get a week from date if date's day is monday and the desired day is monday)
 * @returns {Date} date of the next day index after or at date
 */
 function nextDay(date, day, weekDiff = 0) {
  if (!date) { return null }
  const daysUntilNextDay = (day - new Date(date).getDay()) < 0 ? (day - new Date(date).getDay()) + (7 * (weekDiff + 1)) : (day - new Date(date).getDay() + (7 * weekDiff))
  return new Date(new Date(date).setDate(new Date(date).getDate() + daysUntilNextDay));
}

/**
 * 
 * @param {Date} date date to get the beginning of
 * @returns {Date} midnight of the date passed in
 */
function beginningOfDate(date) {
  return new Date(new Date(date).setHours(0,0,0,0))
}

/**
 * 
 * @param {Date} date date to get the UTC beginning of
 * @returns {Date} UTC midnight of the date passed in
 */
 function beginningOfUTCDate(date) {
  return new Date(new Date(date).setUTCHours(0,0,0,0))
}

/**
 * 
 * @param {Date} date date to get the end of
 * @returns {Date} right before midnight of the day afer the date passed in
 */
function endOfDate(date) {
  return new Date(new Date(date).setHours(23,59,59,999))
}

function modulos(number, modulo) {
  const remainder = number % modulo;
  if (remainder < 0) {
    return remainder + modulo;
  }

  return remainder;
}

function arrayEquality(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }

  return true;
}

function arrayUnion(array1, array2) {
  return [...new Set([...array1, ...array2])];
}

function arrayIntersection(array1, array2) {
  const newArray = [];

  // for efficiency start with the smallest array
  if (array1.length <= array2) { 
    for (let i = 0; i < array1.length; i++) {
      if (array2.includes(array1[i])) {
        newArray.push(array1[i]);
      }
    }
  }
  else {
    for (let i = 0; i < array2.length; i++) {
      if (array1.includes(array2[i])) {
        newArray.push(array2[i]);
      }
    }
  }

  return newArray;
}

function arraySubtraction(arrayMinuend, arraySubtrahend) {
  return arrayMinuend.filter(element => !arraySubtrahend.includes(element))
}

function arrayRandomOrder(array) {
  let tmpArray = [...array];
  let randomArray = [];

  // go through the array and choose a random index then push it to the random array
  for (let i = 0; i < array.length; i++) {
    let randomIndex = Math.floor(Math.random() * (tmpArray.length));
    randomIndex == tmpArray.length ? randomIndex-- : randomIndex;

    randomArray.push(tmpArray[randomIndex]);
    tmpArray.splice(randomIndex, 1);
  }

  return randomArray;
}

function arrayRandomElement(array) {
  const length = array.length;
  let randomIndex = Math.floor(Math.random() * (length))
  // small chance of random index == array.length
  if (randomIndex == length) {
    // I could just round down to length - 1 but that's not fun. This distribution is more uniform
    return arrayRandomElement(array)
  }

  return array[randomIndex];
}

function arrayPermutations(array) {
  var results = [];

  function permute(arr, memo) {
    var cur, memo = memo || [];

    for (var i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }

    return results;
  }

  return permute(array);
}

/**
 * 
 * @param {String} militaryHours time in the format 21:00
 * @returns {String} time in the format 9:00 pm
 */
 function translateMilitaryHourStr(militaryHours) {
  let hours = Number(militaryHours.split(':')[0]);
  const minutes = militaryHours.split(':')[1];
  const suffix = hours < 12 ? 'am' : 'pm';

  // mod 12
  hours = hours % 12;
  // fix 0 to be 12
  hours = hours == 0 ? hours + 12 : hours

  return `${hours}:${minutes} ${suffix}`;
}

async function verifyContact() {
  const contact = currentProgramDetails.contact;
  let isValid = true;
  let missing = [];

  const contactForm = document.querySelector('.contact-form');
  const errorMsg = document.querySelector('.message.error');

  errorMsg.textContent = '';
  contactForm.querySelectorAll('label').forEach(label => label.classList.remove('error'));

  //parent data
  const parentData = contact.parent;
  if (!parentData.firstName) {
    isValid = false;
    missing.push('parent-firstName');
    contactForm.querySelector('label[for="parent-firstName"]').classList.add('error');
  }
  if (!parentData.lastName) {
    isValid = false;
    missing.push('parent-lastName');
    contactForm.querySelector('label[for="parent-lastName"]').classList.add('error');
  }
  if (!parentData.email) {
    isValid = false;
    missing.push('parent-email');
    contactForm.querySelector('label[for="parent-email"]').classList.add('error');
  }
  else if (!isEmailValid(parentData.email)) {
    isValid = false;
    missing.push('parent-email');
    contactForm.querySelector('label[for="parent-email"]').classList.add('error');
  }
  if (parentData.phoneNumber && !isPhoneNumberValid(parentData.phoneNumber)) {
    isValid = false;
    missing.push('parent-phoneNumber');
    contactForm.querySelector('label[for="parent-phoneNumber"]').classList.add('error');
  }

  //student data
  const studentData = contact.student;
  if (!studentData.firstName) {
    isValid = false;
    missing.push('student-firstName');
    contactForm.querySelector('label[for="student-firstName"]').classList.add('error');
  }
  if (!studentData.lastName) {
    isValid = false;
    missing.push('student-lastName');
    contactForm.querySelector('label[for="student-lastName"]').classList.add('error');
  }
  if (studentData.email && (studentData.email == parentData.email || (studentData.email && !isEmailValid(studentData.email)))) {
    isValid = false;
    missing.push('student-email');
    contactForm.querySelector('label[for="student-email"]').classList.add('error');
  }
  if (studentData.phoneNumber && !isPhoneNumberValid(studentData.phoneNumber)) {
    isValid = false;
    missing.push('student-phoneNumber');
    contactForm.querySelector('label[for="student-phoneNumber"]').classList.add('error');
  }

  if (!isValid) {
    errorMsg.textContent = 'Please check the selected fields';
    return false;
  }
  else {
    await submitContact();
    return true;
  }

}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPhoneNumberValid(phoneNumber) {
  return /^\([0-9]{3}\)\s[0-9]{3}\-[0-9]{4}$/.test(phoneNumber);
}

function captalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function submitContact() {
  // create the parent or get their uid
  const { user: parent, newUser: isParentNew } = await addParentWithEmail(currentProgramDetails.contact.parent.email);
  if (isParentNew) {
    await setUserDoc(parent.uid, {
      email: currentProgramDetails.contact.parent.email,
      firstName: currentProgramDetails.contact.parent.firstName,
      lastName: currentProgramDetails.contact.parent.lastName,
      location: CURRENT_LOCATION,
      phoneNumber: currentProgramDetails.contact.parent.phoneNumber,
      role: 'parent'
    });
  }

  // create the student or get their uid
  let student = null;
  let isStudentNew = null;
  // we have the email so we will either find the user or create them
  if (currentProgramDetails.contact.student.email) {
    const studentResponse = await addStudentWithEmail(currentProgramDetails.contact.student.email);
    student = studentResponse.user;
    isStudentNew = studentResponse.newUser;
    // if the student is new then set their user doc
    if (isStudentNew) {
      await setUserDoc(student.uid, {
        email: currentProgramDetails.contact.student.email,
        firstName: currentProgramDetails.contact.student.firstName,
        lastName: currentProgramDetails.contact.student.lastName,
        location: CURRENT_LOCATION,
        phoneNumber: currentProgramDetails.contact.student.phoneNumber,
        role: 'student',
        parents: [parent.uid]
      });
    }
  }
  // the student has no email so we try and find them by their parent, first name, and last name 
  else {
    const studentResponse = await addStudentWithoutEmail(currentProgramDetails.contact.student.firstName, currentProgramDetails.contact.student.lastName, parent.uid)
    student = studentResponse.user;
    isStudentNew = studentResponse.newUser;
    // if the student is new then set their user doc
    if (isStudentNew) {
      await setUserDoc(student.uid, {
        email: currentProgramDetails.contact.student.email,
        firstName: currentProgramDetails.contact.student.firstName,
        lastName: currentProgramDetails.contact.student.lastName,
        location: CURRENT_LOCATION,
        phoneNumber: currentProgramDetails.contact.student.phoneNumber,
        role: 'student',
        parents: [parent.uid]
      });
    }
  }

  // save the uid to each user respectively
  currentProgramDetails.contact.parent.uid = parent.uid;
  currentProgramDetails.contact.student.uid = student.uid;
}

async function verify() {
  const submitButton = document.querySelector('#submitProgram');
  toggleWorking();
  submitButton.classList.add('loading');

  const contactVerified = await verifyContact();
  if (!contactVerified) {
    submitButton.classList.remove('loading');
    toggleWorking()
    return;
  }

  // verify that we have all of the data that we need
  let isValid = true;
  let missing = [];
  for (const key in currentProgramDetails) {
    if (currentProgramDetails[key] == null) {
      isValid = false;
      missing.push(key);

    }
    else {
      // verify all arrays have some elements
      if (currentProgramDetails[key].length) {
        if (currentProgramDetails[key].length == 0) {
          isValid = false;
          missing.push(key)
        }
      }
    }

    //special case for contact
    if (key == 'contact') {
      //parent data
      if (!currentProgramDetails[key].parent.uid) {
        isValid = false;
        missing.push('parent')
      }

      //student data
      if (!currentProgramDetails[key].student.uid) {
        isValid = false;
        missing.push('student')
      }
    }
  }

  if (!isValid) {
    customConfirm(
      `<p>You seem to be missing some info to reserve this spot. Verify all fields have been entered.<p>`,
      '',
      'OK',
      () => {},
      () => {}
    )
    toggleWorking()
    submitButton.classList.remove('loading');
  }
  else {
    await submit();
  }
  
}

async function submit() {
  const submitButton = document.querySelector('#submitProgram');

  // set the calendar events
  const eventIDs = await setCalendarEvents(currentProgramDetails.contact.student.uid, currentProgramDetails.contact.parent.uid);
  // send out the invoice
  const invoice = await generateInvoice(eventIDs, currentProgramDetails.start);
  const adjustedProgram = {
    firstTutors: currentProgramDetails.firstTutors,
    parentEmail: currentProgramDetails.contact.parent.email,
    programLength: currentProgramDetails.programLength,
    name: currentProgramDetails.name,
    score: currentProgramDetails.score,
    dayIndexes: currentProgramDetails.dayIndexes,
    sessionStartTime: currentProgramDetails.sessionStartTime,
    sessionLength: currentProgramDetails.sessionLength,
    start: currentProgramDetails.start.getTime(),
    end: currentProgramDetails.end.getTime()
  }
  await sendReserveEmail(adjustedProgram, invoice);

  // save the program to the student's act profile
  await saveStudentProgram();

  // everything should be all done
  customConfirm('We have successfully reserved your program! You should be receiving an email in a few moments.', '', 'OK', () => {}, () => {});

  toggleWorking()
  submitButton.classList.remove('loading');
  document.querySelector('#reserveProgram').classList.remove('show');
}

async function setCalendarEvents(studentUID, parentUID) {
  // determine which lesson order to use that allows for the time slot selected
  const finalLessonOrder = currentProgramDetails.weeklyOpenings[currentProgramDetails.sessionStartTime].lessonOrder;

  // filter the currentProgramDetails.openings to only includes the sessionStartTime that were selected and the permutation that was selected
  const lessonTimes = currentProgramDetails.openings
  .find(opening => arrayEquality(opening.lessonOrder, finalLessonOrder)) // find the opening that is the final opening
  .programOpenTimes // focus in on just the open times
  .filter(opening => opening.date.getHours().toString().padStart(2, '0') == currentProgramDetails.sessionStartTime.split(':')[0] && opening.date.getMinutes().toString().padStart(2, '0') == currentProgramDetails.sessionStartTime.split(':')[1]) // filter down to only the time that has been selected

  // determine the tutors to teach each lesson
  const assignedLessons = determineTutorToAssign([], lessonTimes)

  // pull out the first tutors so we can show the student who they are
  currentProgramDetails.firstTutors = assignedLessons.reduce((prev, curr) => {
    if(!prev[curr.lessonType]) {
      prev[curr.lessonType] = curr.tutor;
    }
    return prev;
  }, {})

  // create the final form of the event
  const calendarEvents = assignedLessons.map(lesson => {
    return {
      description: "",
      end: new Date(lesson.date).setMinutes(lesson.date.getMinutes() + (currentProgramDetails.sessionLength * 60)),
      location: CURRENT_LOCATION,
      staff: [lesson.tutor],
      staffNames: [qualifiedTutors_master.find(tutor => tutor.id == lesson.tutor).name],
      start: lesson.date.getTime(),
      subtype: lesson.lessonType,
      title: `${currentProgramDetails.contact.student.firstName + ' ' + currentProgramDetails.contact.student.lastName} - ${currentProgramDetails.name} ${lesson.lessonType.charAt(0).toUpperCase() + lesson.lessonType.slice(1)}`,
      type: currentProgramDetails.value
    }
  })

  // save the events to firebase
  const eventRefs = [];
  const eventBatch = firebase.firestore().batch();
  calendarEvents.forEach(event => {
    const ref = firebase.firestore().collection('Events').doc();
    eventRefs.push(ref);
    eventBatch.set(ref, event);
    eventBatch.set(ref.collection('Attendees').doc(), {
      student: studentUID,
      parents: [parentUID],
      studentName: currentProgramDetails.contact.student.firstName + ' ' + currentProgramDetails.contact.student.lastName,
      price: currentProgramDetails.price
    })
  });

  await eventBatch.commit();

  // // schedule the homework email to be sent
  // // get the test to print
  // const testURL = await getTestURL('C02', calendarEvents[0].subType);
  // const homeworkText = `Your tutor has sent you this homework to be completed. Remember to take this like it is the actual ACT by timing yourself. Good luck and we can't wait to see how you do. ${testURL} If you have any questions or difficulties, please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com`;
  // const homeworkHtml = `
  //   <h1>Ready for some homework!</h1>
  //   <p>Your tutor has sent you this homework to be completed. Remember to take this like it is the actual ACT by timing yourself. Good luck and we can't wait to see how you do.<p>
  //   <a href="${testURL}">Test Link</a>
  //   <p>If you have any questions or difficulties, please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com</p>
  // `
  // await setScheduledEmail(currentProgramDetails.contact.parent.email, 'First ACT Homework!', homeworkText, homeworkHtml, new Date(calendarEvents[0].start).setDate(new Date(calendarEvents[0].start).getDate() + 7));
  // if (currentProgramDetails.contact.student.email) {
  //   await setScheduledEmail(currentProgramDetails.contact.student.email, 'First ACT Homework!', homeworkText, homeworkHtml, new Date(calendarEvents[0].start).setDate(new Date(calendarEvents[0].start).getDate() + 7));
  // }
  
  return eventRefs.map(ref => ref.id);
}

async function setScheduledEmail(to, subject, text, html, when) {
  return await firebase.firestore().collection('Scheduled-Emails').doc().set({
    to,
    subject,
    text,
    html,
    when,
    createdAt: new Date().getTime()
  })
}

async function getTestURL(test, section = undefined) {
  let path = test + (section != undefined ? (" - " + section.charAt(0).toUpperCase() + section.slice(1)) : "");
  let ref = firebase.storage().refFromURL('gs://lyrn-web-app.appspot.com/Tests/' + path + '.pdf');
  return await  ref.getDownloadURL();
}

function determineTutorToAssign(assignedLessons, lessonTimes) {
  if (lessonTimes.length == 0) {
    // in the process of determining tutors to assign we flipepd the order of lesson so out them back into time order
    return assignedLessons.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // give each available tutor a score based on how many lessons they could teach in each section
  let scores = {
    english: {},
    math: {},
    reading: {},
    science: {},
  };
  lessonTimes.forEach(lesson => {
    lesson.tutors.forEach(tutor => {
      if (scores[lesson.lessonType][tutor]) {
        scores[lesson.lessonType][tutor]++
      }
      else {
        scores[lesson.lessonType][tutor] = 1;
      }
    })
  })

  let winners = {
    english: [],
    math: [],
    reading: [],
    science: [],
  }

  let winningScores = {
    english: 0,
    math: 0,
    reading: 0,
    science: 0,
  } 

  for (const section in scores) {
    for (const tutor in scores[section]) {
      if (winningScores[section] < scores[section][tutor]) {
        winners[section] = [];
        winners[section].push(tutor);
        winningScores[section] = scores[section][tutor];
      }
      else if (winningScores[section] == scores[section][tutor]) {
        winners[section].push(tutor);
      }
    }
  }

  // randomly get a tutor from the winners array
  for (const section in winners) {
    winners[section] = arrayRandomElement(winners[section]);
  }

  // go through the lessons again and choose the highest tutors is applicable and then remove them from lessonTimes
  for (let i = lessonTimes.length - 1; i >= 0; i--) {
    // the winner can teach
    if (lessonTimes[i].tutors.includes(winners[lessonTimes[i].lessonType])) {
      // transfer the data
      assignedLessons.push({
        date: lessonTimes[i].date,
        tutor: winners[lessonTimes[i].lessonType],
        lessonType: lessonTimes[i].lessonType
      })

      // remove this event from lessonTimes
      lessonTimes.splice(i, 1);
    }
  }

  return determineTutorToAssign(assignedLessons, lessonTimes);
}

async function generateInvoice(eventIDs, programStart) {
  const invoiceData = {
    parent: currentProgramDetails.contact.parent.uid,
    parentName: currentProgramDetails.contact.parent.firstName + ' ' + currentProgramDetails.contact.parent.lastName,
    student: currentProgramDetails.contact.student.uid,
    studentName: currentProgramDetails.contact.student.firstName + ' ' + currentProgramDetails.contact.student.lastName,
    program: currentProgramDetails.value,
    programName: currentProgramDetails.name,
    programLength: currentProgramDetails.programLength,
    programStart,
    programPrice: currentProgramDetails.price * currentProgramDetails.sessionLength * currentProgramDetails.sessionsPerWeek * currentProgramDetails.programLength,
    sessionLength: currentProgramDetails.sessionLength,
    sessionPrice: currentProgramDetails.price * currentProgramDetails.sessionLength,
    pricePerHour: currentProgramDetails.price,
    events: eventIDs,
    createdAt: new Date().getTime(),
    expiration: new Date().setHours(new Date().getHours() + INVOICE_EXPIRATION_TIME),
    status: 'pending'
  }

  const ref = firebase.firestore().collection('ACT-Invoices').doc();
  await ref.set(invoiceData)

  return ref.id;
}

async function saveStudentProgram() {
  // save relevant info to the student's ACT/profile doc
  await firebase.firestore().collection('Users').doc(currentProgramDetails.contact.student.uid).collection('ACT').doc('profile').set({
    programDetails: {
      program: currentProgramDetails.value,
      programName: currentProgramDetails.name,
      score: currentProgramDetails.score,
      programLength: currentProgramDetails.programLength,
      start: currentProgramDetails.start.getTime(),
      end: currentProgramDetails.end.getTime(),
      sections: currentProgramDetails.sections,
      createdAt: new Date().getTime()
    }
  }, {merge: true})
}

async function addParentWithEmail(email) {
  let response = await firebase.functions().httpsCallable('act_sign_up-addParentWithEmail')({
    email
  });

  return response.data
}

async function addStudentWithEmail(email) {
  let response = await firebase.functions().httpsCallable('act_sign_up-addStudentWithEmail')({
    email
  });

  return response.data
}

async function addStudentWithoutEmail(firstName, lastName, parentUID) {
  let response = await firebase.functions().httpsCallable('act_sign_up-addStudentWithoutEmail')({
    firstName,
    lastName,
    parentUID
  });

  return response.data
}

async function sendReserveEmail(programDetails, invoice) {
  let response = await firebase.functions().httpsCallable('act_sign_up-sendReserveEmail')({
    programDetails,
    invoice
  });

  return response.data
}

async function setUserDoc(id, data) {
  await firebase.firestore().collection('Users').doc(id).set(data)
  return;
}

function toggleWorking() {
  document.querySelectorAll('button').forEach(button => {
    button.disabled = !button.disabled;
  })
}

initialSetup();

