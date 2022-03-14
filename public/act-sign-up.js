const CURRENT_LOCATION = 'WIZWBumUoo7Ywkc3pl2G'; // id for the online location (this is hard coded for the foreseeable future)
const LESSON_ORDER = ['english', 'math', 'reading', 'science'];
const MAX_EXPECTED_SCORE = 6;
const TIME_SLOT_FREQUENCY = 60;

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

/**
 * current program details definition
 * @typedef {Object} Program
 * @property {Date} startAfterDate
 * @property {String} name
 * @property {String} value
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
 */

/**
 * @type {Program}
 */
let currentProgramDetails = {
  startAfterDate: new Date(),
  name: null,
  value: null,
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
    parent: {},
    student: {}
  }
}

/**
 * @type {Program}
 */
 let currentCustomProgramDetails = {
  startAfterDate: new Date(),
  name: 'Custom',
  value: null,
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
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51JYNNQLLet6MRTvnZAwlZh6hdMQqNgVp5hvHuMDEfND7tClZcbTCRZl9fluBQDZBAAGSNOJBQWMjcj0ow1LFernK00l8QY5ouc';
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');
cardElement.on('change', ({ error }) => {
  const displayError = document.getElementById('error-message');
  if (error) {
    displayError.textContent = error.message;
  } else {
    displayError.textContent = '';
  }
});

async function initialSetup() {
  toggleWorking();

  // have some fun
  // random accent color every load
  changeAccentColor(chooseRandomAccentSection());

  //semantic ui dropdowns
  $('#customProgram-sections').dropdown({
    onChange: ((value, text) => {
      currentCustomProgramDetails.sections = value.split(',');
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
  await updateSetPrograms()

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

  const randomIndex = Math.floor(Math.random() * (colors.length));
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

    // we need to recalculate the stat and end of the custom program as well
    // this function will do this and we trick the function that is looking for an event by passing in
    // an object with the target key since this is all we use
    customProgram_programLengthChange({target: document.getElementById('customProgram-programLength')})
  ])

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
    if (currentCustomProgramDetails[key] == null) {
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

  // required values for score
  if (programName && programLength && sessionsPerWeek) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
  // required values for price
  if (programName && programLength && sessionsPerWeek && pricePerHour) {
    const price = getCustomProgramPrice(programLength, programName, sessionsPerWeek, pricePerHour);
    customPrice.textContent = price;
    currentCustomProgramDetails.price = price;
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

  // required values for score
  if (programName && programLength && sessionsPerWeek) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
  // required values for price
  if (programName && programLength && sessionsPerWeek && pricePerHour) {
    const price = getCustomProgramPrice(programLength, programName, sessionsPerWeek, pricePerHour);
    customPrice.textContent = '$' + price;
    currentCustomProgramDetails.price = price;
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

  // required values for score
  if (programName && programLength && sessionsPerWeek) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
  // required values for price
  if (programName && programLength && sessionsPerWeek && pricePerHour) {
    const price = getCustomProgramPrice(programLength, programName, sessionsPerWeek, pricePerHour);
    customPrice.textContent = '$' + price;
    currentCustomProgramDetails.price = price;
  }
}

function customProgram_pricePerHourChange(event) {
  const target = event.target
  const pricePerHour = Number(target.value);
  currentCustomProgramDetails.pricePerHour = pricePerHour;

  // elements that will change
  const customScore = document.getElementById('customProgram-score');
  const customPrice = document.getElementById('customProgram-programPrice');

  //values needed to calculate the above elements
  const programLength = Number(document.getElementById('customProgram-programLength').value);
  const sessionsPerWeek = Number(document.getElementById('customProgram-sessionsPerWeek').value);
  const programName = document.getElementById('customProgram-name').value

  // required values for score
  if (programName && programLength && sessionsPerWeek) {
    const score = getCustomScore(programName, programLength, sessionsPerWeek);
    customScore.textContent = score;
    currentCustomProgramDetails.score = score;
  }
  // required values for price
  if (programName && programLength && sessionsPerWeek && pricePerHour) {
    const price = getCustomProgramPrice(programLength, programName, sessionsPerWeek, pricePerHour);
    customPrice.textContent = '$' + price;
    currentCustomProgramDetails.price = price;
  }
}

function getCustomScore(programName, programLength, sessionsPerWeek) {
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
    return Math.min(Math.max(Math.floor(basicsScoreCurve(numSessions)), 0), MAX_EXPECTED_SCORE);
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
    return Math.min(Math.max(Math.floor(guidedScoreCurve(numSessions)), 0), MAX_EXPECTED_SCORE);
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

async function generateOpenTimes() {
  document.getElementById('timeSelection').classList.add('loading', 'disabled');
  //disable all of the inputs
  document.querySelectorAll('.date-time .selection-wrapper input').forEach(input => input.disabled = true)

  // we want to give the parent the most possible options for when to have their porgram
  // not the most efficient way of doing this but for completion we have to check all possible lesson orders
  // in total that is 24 iteration of getting the open program times

  const programOpenTimes = await getOpenProgramTimes(
    currentProgramDetails.value,
    currentProgramDetails.sections,
    currentProgramDetails.start,
    currentProgramDetails.end,
    currentProgramDetails.sessionLength,
    currentProgramDetails.dayIndexes,
    TIME_SLOT_FREQUENCY
  );

  console.log(programOpenTimes)

  const weeklyOpenTimes = getWeeklyOpenTimes(programOpenTimes);
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
    if (!times[time]) {
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

function confirm() {
  // verify that we have all of the data that we need
  let isValid = true;
  let missing = [];
  for (const key in currentProgramDetails) {
    if (currentProgramDetails[key] == null) {
      isValid = false;
      missing.push(key);
    }
    // verify all arrays have some elements
    if (currentProgramDetails[key].length) {
      if (currentProgramDetails[key].length == 0) {
        isValid = false;
        missing.push(key)
      }
    }

    //special case for contact
    if (key == 'contact') {
      //parent data
      const parentData = currentProgramDetails[key].parent;
      if (!parentData.firstName || !parentData.last || !parentData.email) {
        isValid = false;
        missing.push('parent-firstName');
      }
    }
  }
}

// testing()

// document.body.addEventListener('keypress', (ev) => {
//   if (ev.key == 'Enter') {
//     console.log(currentCustomProgramDetails)
//   }
// })

async function testing() {
  try {
    console.time('main');
    const [
      sixWeekProgram,
      eightWeekProgram
    ] = await Promise.all([
      await getProgramStartEnd(6, new Date()),
      await getProgramStartEnd(8, new Date())
    ])

    console.timeLog('main', 'done calculating program start and end')
    console.log({
      sixWeekProgram,
      eightWeekProgram
    })

    const [ 
      basicSixWeekProgramOpenTimes,
      basicEightWeekProgramOpenTimes,
      guidedSixWeekProgramOpenTimes,
      guidedEightWeekProgramOpenTimes
    ] = await Promise.all([
      getOpenProgramTimes('actBasics', LESSON_ORDER, sixWeekProgram.startDate, sixWeekProgram.endDate, 60, [3, 2], 60),
      getOpenProgramTimes('actBasics', LESSON_ORDER, eightWeekProgram.startDate, eightWeekProgram.endDate, 60, [3, 2], 60),
      getOpenProgramTimes('actGuided', LESSON_ORDER, sixWeekProgram.startDate, sixWeekProgram.endDate, 120, [3, 2], 60),
      getOpenProgramTimes('actGuided', LESSON_ORDER, eightWeekProgram.startDate, eightWeekProgram.endDate, 120, [3, 2], 60)
    ])

    console.timeLog('main', 'done calculating program openings');
    console.log({
      basicSixWeekProgramOpenTimes,
      basicEightWeekProgramOpenTimes,
      guidedSixWeekProgramOpenTimes,
      guidedEightWeekProgramOpenTimes,
    })

    const basicSixWeeklyOpenTimes = getWeeklyOpenTimes(basicSixWeekProgramOpenTimes);
    const basicEightWeeklyOpenTimes = getWeeklyOpenTimes(basicEightWeekProgramOpenTimes);
    const guidedSixWeeklyOpenTimes = getWeeklyOpenTimes(guidedSixWeekProgramOpenTimes);
    const guidedEightWeeklyOpenTimes = getWeeklyOpenTimes(guidedEightWeekProgramOpenTimes);

    console.timeLog('main', 'done calculating weekly times')
    console.log({
      basicSixWeeklyOpenTimes,
      basicEightWeeklyOpenTimes,
      guidedSixWeeklyOpenTimes,
      guidedEightWeeklyOpenTimes
    })
    
    
    console.timeEnd('main')
  }
  catch (error) {
    console.error(error)
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

async function getOpenProgramTimes(programType, lessonOrder, startDate, endDate, sessionLength, dayIndexes, timeFrequency, student = null) {
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

  const [
    programOpenTutors, // go through the program dates and find the times that we are open (at least one tutor is available and doesn't have an event)
    programQualifiedTutors, // get all of the tutors that are quailifed in all section for this program
    blacklistTutors // get all of the tutors that are blacklisted by this student
  ] = await Promise.all([
    getOpenTutors(programTimes, sessionLength),
    getQualifiedTutors(CURRENT_LOCATION, lessonOrder.map(lessonType => programType + '-' + lessonType)),
    getBlacklistedTutors(student)
  ])

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

async function getOpenTutors(openTimes, eventLength) {
  // figure out all of the docs to get from firebase given the openTimes
  // this involves getting the beginning timestamp for the openTimes in UTC time

  let openDocIDs = [];

  openTimes.forEach(time => {
    const midnightUTC = beginningOfUTCDate(time);
    if (!openDocIDs.includes(midnightUTC.getTime().toString())) {
      openDocIDs.push(midnightUTC.getTime().toString());
    }
  })

  // get the open docs from firebase
  const openDocs = await Promise.all(openDocIDs.map(openDocID => firebase.firestore().collection('Locations').doc(CURRENT_LOCATION).collection('Calendar-Openings').doc(openDocID).get()));
  const openTutorMaster = {}; // object whose keys are timestamps and the value an array that is an array of the tutor UID's who are open

  
  openDocs.forEach(doc => {
    if (doc.exists) {
      // go through each time and filter out the tutors that have events
      // we should check here if the tutor has an event but isn't available
      // it shouldn't be possible but tell teh user to contact the devs in the case
      const data = doc.data()
      for (const time in data) {
        const events = data[time].filter(opening => opening.type == 'event').map(opening => opening.tutor);
        const availabilities = data[time].filter(opening => opening.type == 'availability').map(opening => opening.tutor);

        if (events.length > availabilities ) {
          alert('There is a BIG issue with the calendar. Contact the Lyrn developers immediately.')
        }

        openTutorMaster[time] = arraySubtraction(availabilities, events);
      }
    }
  })

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

function getWeeklyOpenTimes(programTimes) {
  let timeIsOpen = {};

  programTimes.forEach(openDate => {
    const isTutorOpen = openDate.tutors.length > 0;
    const timeKey = openDate.date.getHours().toString().padStart(2, '0') + ':' + openDate.date.getMinutes().toString().padStart(2, '0');
    timeIsOpen[timeKey] = ( timeIsOpen[timeKey] == true || timeIsOpen[timeKey] == undefined ) ? isTutorOpen : false;
  })

  return timeIsOpen;
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

async function getQualifiedTutors(location, qualifications) {
  let response = await firebase.functions().httpsCallable('act_sign_up-getQualifiedTutors')({
    location,
    qualifications
  });

  return response.data
}

async function getBlacklistedTutors(studentUID) {
  let response = await firebase.functions().httpsCallable('act_sign_up-getBlacklistedTutors')({
    studentUID
  });

  return response.data
}
