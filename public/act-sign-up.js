const CURRENT_LOCATION = 'WIZWBumUoo7Ywkc3pl2G'; // id for the online location (this is hard coded for the foreseeable future)
const LESSON_ORDER = ['english', 'math', 'reading', 'science'];
const MAX_EXPECTED_SCORE = 6; // highest score possble for student to get (for each 4 sections)
const TIME_SLOT_FREQUENCY = 60; // minute difference for seeing openings
const INVOICE_EXPIRATION_TIME = 48; // hours until invoice expires
const SECTION_SCORE_WEIGHTS = { // FIXME: not implemented yet (goal is to affect how much each section contributes to the score while calculating the custom program)
  english: 1,
  math: 1,
  reading: 1,
  science: 1,
}

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

let openings_master = null // local version of all of the calendar openings docs that we need for the given start and end dates
let qualifiedTutors_master = null // local version of all tutors that qualify for eitehr ACT Basics or Guided ACT
let blacklistTutors_master = null // local version of all tutors who are blacklisted by this student

/**
 * current program details definition
 * @typedef {Object} Program
 * @property {Date} startAfterDate
 * @property {String} name
 * @property {String} value
 * @property {Number} score
 * @property {Number} programLength
 * @property {Date} start
 * @property {Date} end
 * @property {FirebaseDoc} testDoc
 * @property {Number} sessionLength
 * @property {Number} sessionsPerWeek
 * @property {Number} price
 * @property {String[]} sections
 * @property {Number[]} dayIndexes
 * @property {String} sessionStartTime hh:mm
 * @property {Object} contact all of the details about the student and parent
 * @property {Object[]} openings all of the details about the which tutors are open at which times
 * @property {Object} weeklyOpenings all of the details about the which tutors are open at which times
 * @property {boolean} isFirstSessionFree
 * @property {Number} percentageOff
 */

/**
 * @type {Program}
 */
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
  isFirstSessionFree: false,
  percentageOff: 0
}

/**
 * @type {Program}
 */
 let currentCustomProgramDetails = {
  startAfterDate: new Date(),
  name: 'Custom',
  value: null,
  score: null,
  programLength: null,
  start: null,
  end: null,
  testDoc: null, 
  sessionLength: null,
  sessionsPerWeek: null,
  price: null,
  sections: null
}

/**
* Set up Stripe Elements
*/
// const STRIPE_PUBLISHABLE_KEY = 'pk_live_51JYNNQLLet6MRTvnZAwlZh6hdMQqNgVp5hvHuMDEfND7tClZcbTCRZl9fluBQDZBAAGSNOJBQWMjcj0ow1LFernK00l8QY5ouc';
// const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
// const elements = stripe.elements();
// const cardElement = elements.create('card');
// cardElement.mount('#card-element');
// cardElement.on('change', ({ error }) => {
//   const displayError = document.getElementById('error-message');
//   if (error) {
//     displayError.textContent = error.message;
//   } else {
//     displayError.textContent = '';
//   }
// });

async function initialSetup() {
  toggleWorking();

  // have some fun
  // random accent color every load
  changeAccentColor(chooseRandomAccentSection());

  //semantic ui dropdowns
  $('#customProgram-sections').dropdown({
    onChange: ((value, text) => {
      customProgram_sectionsChange(value ? value.split(',') : []);
    }) 
  });

  $('#timeSelection').dropdown({
    onChange: ((value, text) => {
      currentProgramDetails.sessionStartTime = value;
    }) 
  });

  // set up the date picker for startAfterDate
  flatpickr('#startAfterDate', {
    defaultDate: 'today',
    minDate: 'today',
    dateFormat: 'M d, Y',
    onChange: startAfterDateChangeCallback
  });

  // put the program cards into a loading state while they are being updated
  renderLoadingSetPrograms();

  //calculate the program cards
  await updateSetPrograms();

  // initialize the openings with the longest program first calculated
  if (GUIDED_SIX.start || GUIDED_EIGHT.start) {
    const earliestStart = new Date(Math.min(GUIDED_SIX?.start?.getTime(), GUIDED_EIGHT?.start?.getTime()));
    const latestEnd = new Date(Math.max(GUIDED_SIX?.end?.getTime(), GUIDED_EIGHT?.end?.getTime()));
    calculateOpeningsMaster(earliestStart, latestEnd);
    // initialize qualified tutors for all programs. this will not change
    calculateQualifiedTutors(CURRENT_LOCATION);
  }

  toggleWorking();
}

function chooseRandomAccentSection() {
  const colors = [
    'english',
    'math',
    'reading',
    'science',
    'writing',
  ]

  let randomIndex = Math.floor(Math.random() * (colors.length));
  //small chance of the index being equal to the length
  randomIndex == colors.length ? randomIndex-- : randomIndex;

  return colors[randomIndex];
}

/**
 * change the css variable --accent-color to the variable --${sectionName}-color
 * @param {String} sectionName name of section
 */
 function changeAccentColor(sectionName) {
  document.querySelector(':root').style.setProperty('--accent-color', `var(--${sectionName}-color)`)
  document.querySelector(':root').style.setProperty('--disabled-accent-color', `var(--disabled-${sectionName}-color)`)
}

function toggleWorking() {
  document.querySelector('#pageLoading').classList.toggle('loading');
  document.querySelectorAll('button').forEach(button => {
    button.disabled = !button.disabled;
  })
}

async function startAfterDateChangeCallback(selectedDates, dateStr, instance) {
  toggleWorking();

  // unselect all of the day and time inputs
  clearDayAndTime();

  // change the current program startAfterDate
  currentProgramDetails.startAfterDate = selectedDates[0]
  currentCustomProgramDetails.startAfterDate = selectedDates[0]

  // remove all properties that rely on the start after date
  currentProgramDetails.start = null;
  currentProgramDetails.end = null;

  // remove sessions

  // put the program cards into a loading state while they are being updated
  renderLoadingSetPrograms();

  await Promise.all([
    // we need to recalculate the programs to update the start and end
    updateSetPrograms(),

    // we need to recalculate the start and end of the custom program as well
    // this function will do this and we trick the function that is looking for an event by passing in
    // an object with the target key since this is all we use
    customProgram_programLengthChange({target: document.getElementById('customProgram-programLength')})
  ])

  // we need to know which start time is the oldest and which end time is the newest and calculate openings_master based on these times
  const earliestStart = new Date(Math.min(GUIDED_SIX.start.getTime(), GUIDED_EIGHT.start.getTime(), currentCustomProgramDetails?.start?.getTime()));
  const latestEnd = new Date(Math.max(GUIDED_SIX.end.getTime(), GUIDED_EIGHT.end.getTime(), currentCustomProgramDetails?.end?.getTime()));
  // place the openingsMaster into a loading state
  openings_master = false;
  calculateOpeningsMaster(earliestStart, latestEnd);

  toggleWorking();
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

  // now the programs are ready to be rendered
  renderSetPrograms()

}

function renderLoadingSetPrograms() {
  const programWrapper = document.getElementById('programWrapper')
  removeAllChildNodes(programWrapper)

  // go through all of the set programs and create the program block
  SET_PROGRAMS.forEach(program => {
    let programDiv = document.createElement('div');
    programDiv.classList.add('program', 'loading');
    programDiv.id = program.value + '-' + program.programLength.toString();
    programDiv.innerHTML = `
      <div class="loader"></div>
    `
    programWrapper.appendChild(programDiv)
  })
}

function renderSetPrograms() {
  const programWrapper = document.getElementById('programWrapper')
  removeAllChildNodes(programWrapper)

  // go through all of the set programs and create the program block
  SET_PROGRAMS.forEach((program, programIndex) => {
    let programDiv = document.createElement('div');
    programDiv.classList.add('program');
    programDiv.id = `setProgram-${programIndex}`;
    programDiv.innerHTML = `
    <div class="detail-wrapper">
      <p>Score</p>
      <p>${program.score}</p>
    </div>
    <div class="detail-wrapper">
      <p>Program Length</p>
      <p>${program.programLength} weeks</p>
    </div>
    <div class="detail-wrapper">
      <p>Program</p>
      <p>${program.name}</p>
    </div>
    <div class="detail-wrapper">
      <p>Start</p>
      <p>${program.start ? convertFromDateInt(program.start.getTime()).shortReadable : 'no test available'}</p>
    </div>
    <div class="detail-wrapper">
      <p>End</p>
      <p>${program.end ? convertFromDateInt(program.end.getTime()).shortReadable : 'no test available'}</p>
    </div>
    <div class="detail-wrapper">
      <p>Session Length</p>
      <p>${program.sessionLength} hour${program.sessionLength > 1 ? 's' : ''}</p>
    </div>
    <div class="detail-wrapper">
      <p>Session per Week</p>
      <p>${program.sessionsPerWeek}</p>
    </div>
    <div class="detail-wrapper">
      <p>Price per Hour</p>
      <p>$${program.price}</p>
    </div>
    <div class="detail-wrapper">
      <p>Program Price</p>
      <p>$${program.programLength * program.sessionsPerWeek * program.sessionLength * program.price}</p>
    </div>
    <button disabled tabindex="1" onclick="setProgramSelected(${programIndex})">Select</button>
    `
    programWrapper.appendChild(programDiv)
  })
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

async function calculateQualifiedTutors(location) {
  let response = await firebase.functions().httpsCallable('act_sign_up-getQualifiedTutors')({
    location,
    qualifications: ['actBasics-english', 'actBasics-math', 'actBasics-reading', 'actBasics-science', 'actGuided-english', 'actGuided-math', 'actGuided-reading', 'actGuided-science']
  });

  qualifiedTutors_master = response.data;
}

async function calculateBlacklistedTutors(studentUID) {
  let response = await firebase.functions().httpsCallable('act_sign_up-getBlacklistedTutors')({
    studentUID
  });

  blacklistTutors_master = response.data;
}

function setProgramSelected(setProgramIndex) {
  // get the program details that was selected
  const selectedProgram = SET_PROGRAMS[setProgramIndex];

  // transfer the program details to the current program details
  for (const key in selectedProgram) {
    currentProgramDetails[key] = selectedProgram[key];
  }

  // unselect all programs
  document.querySelectorAll('.program').forEach(program => program.classList.remove('selected'))
  //select the current program
  document.getElementById(`setProgram-${setProgramIndex}`).classList.add('selected');

  // unselect all of the day and time inputs
  clearDayAndTime();

  console.log(currentProgramDetails);
}

function customProgramSelected() {
  // first confirm that the current custom programs details is complete
  for (const key in currentCustomProgramDetails) {
    if (currentCustomProgramDetails[key] == null || currentCustomProgramDetails[key].length == 0) {
      customConfirm('Please fill in all fields for the custom program before selecting it.', '', 'OK', () => {}, () => {});
      return;
    }
  }

  // transfer the program details to the current program details
  for (const key in currentCustomProgramDetails) {
    currentProgramDetails[key] = currentCustomProgramDetails[key];
  }

  // unselect all programs
  document.querySelectorAll('.program').forEach(program => program.classList.remove('selected'))
  //select the current program
  document.getElementById(`customProgram`).classList.add('selected');

  // unselect all of the day and time inputs
  clearDayAndTime();

  console.log(currentProgramDetails);
}

async function customProgram_programLengthChange(event) {
  const target = event.target
  const programLength = Number(target.value);
  currentCustomProgramDetails.programLength = programLength;

  // elements that will change
  const customScore = document.getElementById('customProgram-score');
  const customPrice = document.getElementById('customProgram-programPrice');
  const customStart =  document.getElementById('customProgram-start');
  const customEnd =  document.getElementById('customProgram-end');

  //values needed to calculate the above elements
  const programName = document.getElementById('customProgram-name').value;
  const sessionsPerWeek = Number(document.getElementById('customProgram-sessionsPerWeek').value);
  const pricePerHour = Number(document.getElementById('customProgram-pricePerHour').value);
  const sections = $('#customProgram-sections').dropdown('get value') ? $('#customProgram-sections').dropdown('get value').split(',') : [];

  // required values for score
  if (programName && programLength && sessionsPerWeek && sections) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek, sections);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
  // required values for price
  if (programName && programLength && sessionsPerWeek && pricePerHour) {
    const price = getCustomProgramPrice(programLength, programName, sessionsPerWeek, pricePerHour);
    customPrice.textContent = price;
  }
  // required for start and end
  if (programLength && currentCustomProgramDetails.startAfterDate) {
    // while waiting add a loader to the start and end
    customStart.innerHTML = `<div class="loader"></div>`;
    customEnd.innerHTML = `<div class="loader"></div>`;
    const startEnd = await getProgramStartEnd(programLength, currentCustomProgramDetails.startAfterDate);
    // update the custom program object
    currentCustomProgramDetails.start = startEnd.startDate;
    currentCustomProgramDetails.end = startEnd.endDate;
    currentCustomProgramDetails.testDoc = startEnd.testDoc;

    if (!startEnd.startDate) {
      customStart.innerHTML = 'no test available';
      customEnd.innerHTML = 'no test available';
    }
    else {
      customStart.innerHTML = convertFromDateInt(startEnd.startDate.getTime()).shortReadable;
      customEnd.innerHTML = convertFromDateInt(startEnd.endDate.getTime()).shortReadable;
    }
  }
}

function customProgram_nameChange(event) {
  const target = event.target
  const programName = target.value;
  currentCustomProgramDetails.value = programName;

  // elements that will change
  const customScore = document.getElementById('customProgram-score');
  const customSessionLength = document.getElementById('customProgram-sessionLength');
  const customPrice = document.getElementById('customProgram-programPrice');

  //values needed to calculate the above elements
  const programLength = Number(document.getElementById('customProgram-programLength').value);
  const sessionsPerWeek = Number(document.getElementById('customProgram-sessionsPerWeek').value);
  const pricePerHour = Number(document.getElementById('customProgram-pricePerHour').value);
  const sections = $('#customProgram-sections').dropdown('get value') ? $('#customProgram-sections').dropdown('get value').split(',') : [];

  // required values for score
  if (programName && programLength && sessionsPerWeek && sections) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek, sections);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
  // required values for price
  if (programName && programLength && sessionsPerWeek && pricePerHour) {
    const price = getCustomProgramPrice(programLength, programName, sessionsPerWeek, pricePerHour);
    customPrice.textContent = '$' + price;
  }
  //required values for sessionLength
  if (programName) {
    const sessionLength = getCustomSessionLength(programName);
    customSessionLength.textContent = sessionLength + (sessionLength > 1 ? ' hours' : ' hour');
    currentCustomProgramDetails.sessionLength = sessionLength;
  }
}

function customProgram_sessionsPerWeekChange(event) {
  const target = event.target
  const sessionsPerWeek = Number(target.value);
  currentCustomProgramDetails.sessionsPerWeek = sessionsPerWeek;

  // elements that will change
  const customScore = document.getElementById('customProgram-score');
  const customPrice = document.getElementById('customProgram-programPrice');

  //values needed to calculate the above elements
  const programLength = Number(document.getElementById('customProgram-programLength').value);
  const pricePerHour = Number(document.getElementById('customProgram-pricePerHour').value);
  const programName = document.getElementById('customProgram-name').value
  const sections = $('#customProgram-sections').dropdown('get value') ? $('#customProgram-sections').dropdown('get value').split(',') : [];

  // required values for score
  if (programName && programLength && sessionsPerWeek && sections) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek, sections);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
  // required values for price
  if (programName && programLength && sessionsPerWeek && pricePerHour) {
    const price = getCustomProgramPrice(programLength, programName, sessionsPerWeek, pricePerHour);
    customPrice.textContent = '$' + price;
  }
}

function customProgram_pricePerHourChange(event) {
  const target = event.target
  const pricePerHour = Number(target.value);
  currentCustomProgramDetails.price = pricePerHour;

  // elements that will change
  const customScore = document.getElementById('customProgram-score');
  const customPrice = document.getElementById('customProgram-programPrice');

  //values needed to calculate the above elements
  const programLength = Number(document.getElementById('customProgram-programLength').value);
  const sessionsPerWeek = Number(document.getElementById('customProgram-sessionsPerWeek').value);
  const programName = document.getElementById('customProgram-name').value
  const sections = $('#customProgram-sections').dropdown('get value') ? $('#customProgram-sections').dropdown('get value').split(',') : [];

  // required values for score
  if (programName && programLength && sessionsPerWeek && sections) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek, sections);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
  // required values for price
  if (programName && programLength && sessionsPerWeek && pricePerHour) {
    const price = getCustomProgramPrice(programLength, programName, sessionsPerWeek, pricePerHour);
    customPrice.textContent = '$' + price;
  }
}

function customProgram_sectionsChange(sections) {
  currentCustomProgramDetails.sections = sections;

  // elements that will change
  const customScore = document.getElementById('customProgram-score');

  //values needed to calculate the above elements
  const programLength = Number(document.getElementById('customProgram-programLength').value);
  const sessionsPerWeek = Number(document.getElementById('customProgram-sessionsPerWeek').value);
  const programName = document.getElementById('customProgram-name').value

  // required values for score
  if (programName && programLength && sessionsPerWeek && sections) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek, sections);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
}

function getCustomScore(programName, programLength, sessionsPerWeek, sections) {
  if (programName == 'actBasics') {
    const numSessions = programLength * sessionsPerWeek;
    const basicsScoreCurve = findLinearEquation(
      {
        x: (BASICS_SIX.programLength * BASICS_SIX.sessionsPerWeek),
        y: BASICS_SIX.score,
      },
      {
        x: (BASICS_EIGHT.programLength * BASICS_EIGHT.sessionsPerWeek),
        y: BASICS_EIGHT.score,
      },
    )
    return Math.floor(Math.min(Math.max(Math.floor(basicsScoreCurve(numSessions)), 0), MAX_EXPECTED_SCORE) * (sections.length / LESSON_ORDER.length));
  }
  if (programName == 'actGuided') {
    const numSessions = programLength * sessionsPerWeek;
    const guidedScoreCurve = findLinearEquation(
      {
        x: (GUIDED_SIX.programLength * GUIDED_SIX.sessionsPerWeek),
        y: GUIDED_SIX.score,
      },
      {
        x: (GUIDED_EIGHT.programLength * GUIDED_EIGHT.sessionsPerWeek),
        y: GUIDED_EIGHT.score,
      },
    )
    return Math.floor(Math.min(Math.max(Math.floor(guidedScoreCurve(numSessions)), 0), MAX_EXPECTED_SCORE) * (sections.length / LESSON_ORDER.length));
  }
}

function findLinearEquation(point1, point2) {
  const slope = (point1.y - point2.y) / (point1.x - point2.x);
  const y_intercept = point1.y - (slope * point1.x);

  return (input) => (input * slope) + y_intercept;
}

function getCustomSessionLength (programName) {
  if (programName == 'actBasics') {
    return BASICS_SIX.sessionLength;
  }
  if (programName == 'actGuided') {
    return GUIDED_SIX.sessionLength;
  }
}

function getCustomProgramPrice (programLength, programName, sessionsPerWeek, pricePerHour) {
  return programLength * getCustomSessionLength(programName) * sessionsPerWeek * pricePerHour;
}

function contactInfoFocusOutCallback(event) {
  const target = event.target;
  const id = target.id;
  const type = id.split('-')[0];
  const key = id.split('-')[1];
  const value = target.value;

  currentProgramDetails.contact[type][key] = value;

  console.log(currentProgramDetails)
}

function daySelectedCallback(event) {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const target = event.target;
  const isChecked = target.checked;
  const targetDay = target.id;
  const targetIndex = daysOfWeek.indexOf(targetDay) + 1;

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
  }
  else {
    // remove the day from the current program day indexes
    currentProgramDetails.dayIndexes.splice(currentProgramDetails.dayIndexes.indexOf(targetIndex), 1);
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
  else {
    // disable the time selection
    document.getElementById('timeSelection').classList.add('disabled');
  }

  console.log(currentProgramDetails)

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

  // clear the times
  removeAllChildNodes(document.getElementById('timeSelection').querySelector('.menu'));
  document.getElementById('timeSelection').classList.add('disabled')
  $('#timeSelection').dropdown('clear');
  
}

function modulos(number, modulo) {
  const remainder = number % modulo;
  if (remainder < 0) {
    return remainder + modulo;
  }

  return remainder;
}

function firstSessionFreeCallback(event) {
  currentProgramDetails.isFirstSessionFree = event.target.checked;
}

function percentageOffCallback(event) {
  currentProgramDetails.percentageOff = Number(event.target.value);
}

async function generateOpenTimes() {
  document.getElementById('timeSelection').classList.add('loading', 'disabled');
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

  document.getElementById('timeSelection').classList.remove('loading', 'disabled');
  document.querySelectorAll('.date-time .selection-wrapper input').forEach(input => input.disabled = false)
}

function renderWeeklyOpenTimes(times) {
  const dropdown = document.getElementById('timeSelection');
  const menu = dropdown.querySelector('.menu');

  //clear the existing menu options
  removeAllChildNodes(menu);

  // add in the times
  for (const time in times) {
    const item = document.createElement('div');
    item.classList.add('item');
    //check if the time is unavailable
    if (!times[time].isOpen) {
      item.classList.add('disabled');
    }
    item.setAttribute('data-value', time)
    item.textContent = translateMilitaryHourStr(time)
    menu.appendChild(item);
  };

  $('#timeSelection').dropdown('refresh');
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

function verifyContact() {
  const contact = currentProgramDetails.contact;
  let isValid = true;
  let missing = [];

  const contactSection = document.querySelector('.contact-info');
  const contactForm = document.querySelector('.contact-form');
  const contactErrorMsg = contactSection.querySelector('label.message.error');
  const contactButton = contactSection.querySelector('button');

  toggleWorking()
  contactButton.classList.add('loading');
  contactErrorMsg.textContent = '';
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
  if (studentData.email == parentData.email || (studentData.email && !isEmailValid(studentData.email))) {
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
    toggleWorking()
    contactButton.classList.remove('loading');
    contactErrorMsg.textContent = 'Please check the selected fields'
  }
  else {
    submitContact();
  }

}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPhoneNumberValid(phoneNumber) {
  return /^\([0-9]{3}\)\s[0-9]{3}\-[0-9]{4}$/.test(phoneNumber);
}

async function submitContact() {
  const contactSection = document.querySelector('.contact-info');
  const contactButton = contactSection.querySelector('button');

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

  // begin to calculate the blacklistTutors_master
  calculateBlacklistedTutors(student.uid)

  toggleWorking()
  contactButton.classList.remove('loading');

  // tell the user when the process is over and if they users were new
  customConfirm(
    `The parent and student have been submitted successfully.
    Just so that you know this parent is a${isParentNew ? ' new' : 'n old'} customer and
    this student is a${isStudentNew ? ' new' : 'n old'} customer.`,
    '',
    'OK',
    () => {},
    () => {}
  )
}

function verify() {
  const submitSection = document.querySelector('.submit-section');
  const submitButton = submitSection.querySelector('button');

  toggleWorking()
  submitButton.classList.add('loading');

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
    let missingList = '';
    missing.forEach(item => {
      missingList = missingList + `<li>${item}</li>`;
    })
    customConfirm(
      `<p>You seem to be missing some data. Complain to Duncan if this message sucks... anyway here are the things you are missing:<p>
      <ul>${missingList}</ul>`,
      '',
      'OK',
      () => {},
      () => {}
    )
    toggleWorking()
    submitButton.classList.remove('loading');
  }
  else {
    submit();
  }
  
}

async function submit() {
  const submitSection = document.querySelector('.submit-section');
  const submitButton = submitSection.querySelector('button');
  console.log('about to submit', currentProgramDetails)

  // set the calendar events
  const eventIDs = await setCalendarEvents(currentProgramDetails.contact.student.uid, currentProgramDetails.contact.parent.uid);

  // send out the invoice
  const invoice = await generateInvoice(eventIDs, currentProgramDetails.start);
  await sendInvoiceEmail(currentProgramDetails.contact.parent.email, currentProgramDetails.firstTutors, invoice);

  // save the program to the student's act profile
  await saveStudentProgram();

  // everything should be all done
  customConfirm('Lessons have been set and the invoice is being emailed right now!', '', 'OK', () => {}, () => {});

  toggleWorking()
  submitButton.classList.remove('loading');
}

async function setCalendarEvents(studentUID, parentUID) {
  // determine which lesson order to use that allows for the time slot selected
  const finalLessonOrder = currentProgramDetails.weeklyOpenings[currentProgramDetails.sessionStartTime].lessonOrder;
  console.log(finalLessonOrder)

  // filter the currentProgramDetails.openings to only includes the sessionStartTime that were selected and the permutation that was selected
  const lessonTimes = currentProgramDetails.openings
  .find(opening => arrayEquality(opening.lessonOrder, finalLessonOrder)) // find the opening that is the final opening
  .programOpenTimes // focus in on just the open times
  .filter(opening => opening.date.getHours().toString().padStart(2, '0') == currentProgramDetails.sessionStartTime.split(':')[0] && opening.date.getMinutes().toString().padStart(2, '0') == currentProgramDetails.sessionStartTime.split(':')[1]) // filter down to only the time that has been selected

  console.log(lessonTimes);

  // determine the tutors to teach each lesson
  const assignedLessons = determineTutorToAssign([], lessonTimes)
  console.log(assignedLessons)

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

  console.log(calendarEvents);

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

  // schedule the homework email to be sent
  // get the test to print
  const testURL = await getTestURL('C02', calendarEvents[0].subType);
  const homeworkText = `Your tutor has sent you this homework to be completed. Remember to take this like it is the actual ACT by timing yourself. Good luck and we can't wait to see how you do. ${testURL} If you have any questions or difficulties, please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com`;
  const homeworkHtml = `
    <h1>Ready for some homework!</h1>
    <p>Your tutor has sent you this homework to be completed. Remember to take this like it is the actual ACT by timing yourself. Good luck and we can't wait to see how you do.<p>
    <a href="${testURL}">Test Link</a>
    <p>If you have any questions or difficulties, please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com</p>
  `
  await setScheduledEmail(currentProgramDetails.contact.parent.email, 'First ACT Homework!', homeworkText, homeworkHtml, new Date(calendarEvents[0].start).setDate(new Date(calendarEvents[0].start).getDate() + 7));
  if (currentProgramDetails.contact.student.email) {
    await setScheduledEmail(currentProgramDetails.contact.student.email, 'First ACT Homework!', homeworkText, homeworkHtml, new Date(calendarEvents[0].start).setDate(new Date(calendarEvents[0].start).getDate() + 7));
  }
  
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
  console.log(scores)

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

  console.log(winners);

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
    isFirstSessionFree: currentProgramDetails.isFirstSessionFree,
    percentageOff: currentProgramDetails.percentageOff,
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
      alert('There is a BIG issue with the calendar. Contact the Lyrn developers immediately.')
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

async function sendInvoiceEmail(email, firstTutors, invoice) {
  let response = await firebase.functions().httpsCallable('act_sign_up-sendInvoiceEmail')({
    email,
    firstTutors,
    invoice
  });

  return response.data
}

async function setUserDoc(id, data) {
  await firebase.firestore().collection('Users').doc(id).set(data)
  return;
}