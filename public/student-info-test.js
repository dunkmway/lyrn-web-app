let currentStudent = "";
let currentTutor = "";

let studentProfile = {};
let hwData = {};
let sessionData = {};
let actProfile = {};
let studentNotes = {};

let sessionDates = [];
let hoursArray = [];
let sessionDateStr = [];

const sectionColors = {
  'composite' : "#595959",
  'english' : "#5600F7",
  'math' : "#F70056",
  'reading' : "#00E6BC",
  'science' : "#C00BE0"
}

let sectionScores = {
  'composite' : {},
  'english' : {},
  'math' : {},
  'reading' : {},
  'science' : {}
}

let sectionHours = {
  'composite' : {},
  'english' : {},
  'math' : {},
  'reading' : {},
  'science' : {}
}

let testArrays = {
  'composite' : [],
  'english' : [],
  'math' : [],
  'reading' : [],
  'science' : []
}

let sectionHoursArrays = {
  'composite' : [],
  'english' : [],
  'math' : [],
  'reading' : [],
  'science' : []
}

let sectionHoursScores = {
  'composite' : {},
  'english' : {},
  'math' : {},
  'reading' : {},
  'science' :{}
}

let sectionHoursScoresArrays = {
  'composite' : [],
  'english' : [],
  'math' : [],
  'reading' : [],
  'science' : []
}

let sectionRelativeGoals = {
  'composite' : undefined,
  'english' : undefined,
  'math' : undefined,
  'reading' : undefined,
  'science' : undefined
}

let borderDashGoals = [null, null, null, null, null];
let borderDashOffsetGoals = [null, null, null, null, null];

let sectionGoals = {
  'composite' : undefined,
  'english' : undefined,
  'math' : undefined,
  'reading' : undefined,
  'science' :undefined
}

let charts = {
  'composite' : undefined,
  'english' : undefined,
  'math' : undefined,
  'reading' : undefined,
  'science' :undefined
}

var goalsChanged = false;
var initialsChanged = false;
let initialComposite = undefined;

main();

function main() {
  initialSetupData()
  .then(() => {

    let compositeChartElement = document.getElementById("compositeCanvas");
    let englishChartElement = document.getElementById("englishCanvas");
    let mathChartElement = document.getElementById("mathCanvas");
    let readingChartElement = document.getElementById("readingCanvas");
    let scienceChartElement = document.getElementById("scienceCanvas");
    setHomeworkChartData();
    charts['composite'] = generateChart(compositeChartElement, ['composite', 'english', 'math', 'reading', 'science'])
    charts['english'] = generateChart(englishChartElement, ['composite', 'english'])
    charts['math'] = generateChart(mathChartElement, ['composite', 'math'])
    charts['reading'] = generateChart(readingChartElement, ['composite', 'reading'])
    charts['science'] = generateChart(scienceChartElement, ['composite', 'science'])

    // Adjust the chart to have the sizing play nicely
    compositeChartElement.style.maxWidth = "100%"
    compositeChartElement.style.maxHeight = "93%"
    englishChartElement.style.maxWidth = "100%"
    englishChartElement.style.maxHeight = "93%"
    mathChartElement.style.maxWidth = "100%"
    mathChartElement.style.maxHeight = "93%"
    readingChartElement.style.maxWidth = "100%"
    readingChartElement.style.maxHeight = "93%"
    scienceChartElement.style.maxWidth = "100%"
    scienceChartElement.style.maxHeight = "93%"
  })
}

function initialSetupData() {
  currentStudent = queryStrings()["student"];
  // console.log("currentStudent", currentStudent);

  if (currentStudent) {
    let profileProm = getProfileData(currentStudent)
    .then((doc) => {
      storeProfileData(doc);
      document.getElementById('studentName').textContent = studentProfile["studentFirstName"] + " " + studentProfile["studentLastName"];
    })

    let sessionSetupProm = getSessionData(currentStudent)
    .then((doc) => storeSessionData(doc))

    let actProfileProm = getActProfileData(currentStudent)
    .then((doc) => storeActProfileData(doc))
    //need the actProfile object first
    .then(() => getHomeworkData(currentStudent))
    .then((doc) => storeHomeworkData(doc))

    let studentNotesProm = getStudentNotesData(currentStudent)
    .then((doc) => storeStudentNotesData(doc))

    let promises = [profileProm, /*hwSetupProm,*/ sessionSetupProm, actProfileProm, studentNotesProm];
    return Promise.all(promises);
  }

  return Promise.reject("No student is selected");
}

function getProfileData(studentUID) {
  const profileDocRef = firebase.firestore().collection("Students").doc(studentUID);
  return profileDocRef.get();
}

function storeProfileData(doc) {
  studentProfile = doc.data() ?? {};
}

function getHomeworkData(studentUID) {
  const hwDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("hw");
  return hwDocRef.get();
}

function storeHomeworkData(doc) {
  hwData = doc.data() ?? {};
  for (const test in hwData) {
    for (const section in hwData[test]) {
      if (hwData[test][section]['TestType'] == 'homework' && hwData[test][section]['ScaledScore']) {
        
        let date = hwData[test][section]['Date'];

        switch (section) {
          case "English":
            sectionScores['english'][date] = hwData[test][section]['ScaledScore'];
            break;
          case "Math":
            sectionScores['math'][date] = hwData[test][section]['ScaledScore'];
            break;
          case "Reading":
            sectionScores['reading'][date] = hwData[test][section]['ScaledScore'];
            break;
          case "Science":
            sectionScores['science'][date] = hwData[test][section]['ScaledScore'];
            break;
          default:
            console.log("We have a test with a section that doesn't match!!!")
        }
      }
    }
  }

  //FIXME:
  //add the initial scores
  //they will be set at a date time of -9999999998 (one millisecond after the beginning of time) unless we want them to have a meaningful date
  //eventully when we score the practice test this score will not have meaning

  sectionScores['english']["-9999999998"] = actProfile["englishInitial"];
  sectionScores['math']["-9999999998"] = actProfile["mathInitial"];
  sectionScores['reading']["-9999999998"] = actProfile["readingInitial"];
  sectionScores['science']["-9999999998"] = actProfile["scienceInitial"];

  return Promise.resolve("hw data stored!");
}

function getSessionData(studentUID) {
  const sessionDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("sessions");
  return sessionDocRef.get();
}

function storeSessionData(doc) {
  sessionData = doc.data() ?? {};
  for (let time in sessionData) {
    let numTime = parseInt(time);
    //FIXME: This will not take any keys that are not numbers. This will change in the firestore doc to be only
    //times so this can be removed. It will cause issue with the data base but we will need to delete it all.
    if (!isNaN(numTime)) {
      const date = new Date(numTime);
      const day = date.getDate();
      const month = date.getMonth()+1;
      const year = date.getFullYear();
      const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();
      sessionDates.push(numTime);

      for (let section in sessionData[time]["sections"]) {
        switch (section) {
          case "English":
            sectionHours['english'][numTime] = sessionData[time]["sections"][section]['time'];
            break;
          case "Math":
            sectionHours['math'][numTime] = sessionData[time]["sections"][section]['time'];
            break;
          case "Reading":
            sectionHours['reading'][numTime] = sessionData[time]["sections"][section]['time'];
            break;
          case "Science":
            sectionHours['science'][numTime] = sessionData[time]["sections"][section]['time'];
            break;
          default:
            console.log("We have a session with a section that doesn't match!!!")
        }
      }
    }
  }
  //sort from lowest to highest
  sessionDates.sort(function(a, b){return a - b});

  for (let i = 0; i < sessionDates.length; i++) {
    sectionHours['composite'][sessionDates[i]] = (sectionHours['english'][sessionDates[i]] ?? 0) + (sectionHours['math'][sessionDates[i]] ?? 0) + (sectionHours['reading'][sessionDates[i]] ?? 0) + (sectionHours['science'][sessionDates[i]] ?? 0);
  }
}

function getActProfileData(studentUID) {
  const actProfileDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("profile");
  return actProfileDocRef.get();
}

function storeActProfileData(doc) {
  actProfile = doc.data() ?? {};
}

function getStudentNotesData(studentUID) {
  const studentNotesDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("notes");
  return studentNotesDocRef.get();
}

function storeStudentNotesData(doc) {
  studentNotes = doc.data() ?? {};
}

function setHomeworkChartData() {
  //set up arrays for each test type

  //add the initial scores to the array
  testArrays['english'].push(actProfile['englishInitial'] ?? null);
  testArrays['math'].push(actProfile['mathInitial'] ?? null);
  testArrays['reading'].push(actProfile['readingInitial'] ?? null);
  testArrays['science'].push(actProfile['scienceInitial'] ?? null);

  initialComposite = roundedAvg([actProfile['englishInitial'], actProfile['mathInitial'], actProfile['readingInitial'], actProfile['scienceInitial']]);
  testArrays['composite'].push(initialComposite);

  sectionHoursArrays['composite'].push(0);
  sectionHoursArrays['english'].push(0);
  sectionHoursArrays['math'].push(0);
  sectionHoursArrays['reading'].push(0);
  sectionHoursArrays['science'].push(0);

  //set up the rest of the tests
  for (let i = 0; i < sessionDates.length; i++) {
    testArrays['english'].push(sectionScores['english'][sessionDates[i]]);
    testArrays['math'].push(sectionScores['math'][sessionDates[i]]);
    testArrays['reading'].push(sectionScores['reading'][sessionDates[i]]);
    testArrays['science'].push(sectionScores['science'][sessionDates[i]]);

    let scores = [lastScore(sectionScores['english'], sessionDates[i]) ?? null, lastScore(sectionScores['math'], sessionDates[i]) ?? null, lastScore(sectionScores['reading'], sessionDates[i]) ?? null, lastScore(sectionScores['science'], sessionDates[i]) ?? null]
    sectionScores['composite'][sessionDates[i]] = roundedAvg(scores);
    testArrays['composite'].push(roundedAvg(scores));

    sectionHoursArrays['composite'].push(sectionHours['composite'][sessionDates[i]]);
    sectionHoursArrays['english'].push(sectionHours['english'][sessionDates[i]]);
    sectionHoursArrays['math'].push(sectionHours['math'][sessionDates[i]]);
    sectionHoursArrays['reading'].push(sectionHours['reading'][sessionDates[i]]);
    sectionHoursArrays['science'].push(sectionHours['science'][sessionDates[i]]);
  }

  //set relative scores
  for (let i = 0; i < testArrays['composite'].length; i++) {
    testArrays['composite'][i] = testArrays['composite'][i] - initialComposite;
  }
  for (let i = 0; i < testArrays['english'].length; i++) {
    testArrays['english'][i] = testArrays['english'][i] - actProfile['englishInitial'];
  }
  for (let i = 0; i < testArrays['math'].length; i++) {
    testArrays['math'][i] = testArrays['math'][i] - actProfile['mathInitial'];
  }
  for (let i = 0; i < testArrays['reading'].length; i++) {
    testArrays['reading'][i] = testArrays['reading'][i] - actProfile['readingInitial'];
  }
  for (let i = 0; i < testArrays['science'].length; i++) {
    testArrays['science'][i] = testArrays['science'][i] - actProfile['scienceInitial'];
  }

  let allHours = [sectionHoursArrays['composite'].runningTotal(), sectionHoursArrays['english'].runningTotal(), sectionHoursArrays['math'].runningTotal(), sectionHoursArrays['reading'].runningTotal(), sectionHoursArrays['science'].runningTotal()];
  let minMax = getMinAndMax(allHours);

  for (let i = minMax['min']; i <= minMax['max']; i+=15) {
    hoursArray.push(i);
  }

  for (let i = 1; i < testArrays['composite'].length; i++) {
    if (testArrays['composite'][i]) {
      sectionHoursScores['composite'][`${sectionHoursArrays['composite'].runningTotal()[(i-1)]}`] = testArrays['composite'][i];
    }
  }
  for (let i = 1; i < testArrays['english'].length; i++) {
    if (testArrays['english'][i]) {
      sectionHoursScores['english'][`${sectionHoursArrays['english'].runningTotal()[(i-1)]}`] = testArrays['english'][i];
    }
  }
  for (let i = 1; i < testArrays['math'].length; i++) {
    if (testArrays['math'][i]) {
      sectionHoursScores['math'][`${sectionHoursArrays['math'].runningTotal()[(i-1)]}`] = testArrays['math'][i];
    }
  }
  for (let i = 1; i < testArrays['reading'].length; i++) {
    if (testArrays['reading'][i]) {
      sectionHoursScores['reading'][`${sectionHoursArrays['reading'].runningTotal()[(i-1)]}`] = testArrays['reading'][i];
    }
  }
  for (let i = 1; i < testArrays['science'].length; i++) {
    if (testArrays['science'][i]) {
      sectionHoursScores['science'][`${sectionHoursArrays['science'].runningTotal()[(i-1)]}`] = testArrays['science'][i];
    }
  }

  for (let i = 0; i < hoursArray.length; i++) {
    sectionHoursScoresArrays['composite'].push(sectionHoursScores['composite'][hoursArray[i]]);
    sectionHoursScoresArrays['english'].push(sectionHoursScores['english'][hoursArray[i]]);
    sectionHoursScoresArrays['math'].push(sectionHoursScores['math'][hoursArray[i]]);
    sectionHoursScoresArrays['reading'].push(sectionHoursScores['reading'][hoursArray[i]]);
    sectionHoursScoresArrays['science'].push(sectionHoursScores['science'][hoursArray[i]]);
  }

  //set initials at hour 0
  sectionHoursScoresArrays['composite'][0] = 0;
  sectionHoursScoresArrays['english'][0] = 0;
  sectionHoursScoresArrays['math'][0] = 0;
  sectionHoursScoresArrays['reading'][0] = 0;
  sectionHoursScoresArrays['science'][0] = 0;

  //initial in session dates
  sessionDateStr.push("Initial");
  //set the sessionDate array in mm/dd/yyyy format
  for (let i = 0; i < sessionDates.length; i++) {
    const date = new Date(sessionDates[i]);
    const day = date.getDate();
    const month = date.getMonth()+1;
    const year = date.getFullYear();
    const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();
    sessionDateStr.push(dateStr);
  }

  //prep work for the goal lines
  sectionGoals['composite'] = roundedAvg([
    getNextTestGoals()?.["englishGoal"], 
    getNextTestGoals()?.["mathGoal"], 
    getNextTestGoals()?.["readingGoal"], 
    getNextTestGoals()?.["scienceGoal"]
  ]);
  sectionGoals['english'] = getNextTestGoals()?.["englishGoal"];
  sectionGoals['math'] = getNextTestGoals()?.["mathGoal"];
  sectionGoals['reading'] = getNextTestGoals()?.["readingGoal"];
  sectionGoals['science'] = getNextTestGoals()?.["scienceGoal"];

  sectionRelativeGoals['composite'] = sectionGoals['composite'] - initialComposite ?? null;
  sectionRelativeGoals['english'] = sectionGoals['english'] - actProfile["englishInitial"] ?? null;
  sectionRelativeGoals['math'] = sectionGoals['math'] - actProfile["mathInitial"] ?? null;
  sectionRelativeGoals['reading'] = sectionGoals['reading'] - actProfile["readingInitial"] ?? null;
  sectionRelativeGoals['science'] = sectionGoals['science'] - actProfile["scienceInitial"] ?? null;

  //see if any relative scores are the same
  let relativeGoals = [sectionRelativeGoals['composite'], sectionRelativeGoals['english'], sectionRelativeGoals['math'], sectionRelativeGoals['reading'], sectionRelativeGoals['science']];
  const defaultBorderDash = [25, 10]
  const defaultDashOffsetChange = defaultBorderDash[0] + defaultBorderDash[1];

  for (let i = 0; i < relativeGoals.length; i++) {
    //if the border dash has not been set yet
    if (borderDashGoals[i] == null) {
      let matchIndexes = [];
      for (let j = 0; j < relativeGoals.length; j++) {
        //if a goal matches another goal
        if (i!=j && relativeGoals[i] == relativeGoals[j]) {
          matchIndexes.push(j);
        }
      }

      //adjust the border according to the matches
      for (let j = 0; j < matchIndexes.length; j++) {
        borderDashGoals[matchIndexes[j]] = [defaultBorderDash[0], defaultBorderDash[1] + defaultDashOffsetChange * (matchIndexes.length)];
        borderDashOffsetGoals[matchIndexes[j]] = defaultDashOffsetChange * (j + 1);
      }
      borderDashGoals[i] = [defaultBorderDash[0], defaultBorderDash[1] + defaultDashOffsetChange * (matchIndexes.length)];
      borderDashOffsetGoals[i] = 0;
    }
  }

}

function queryStrings() {
  var GET = {};
  var queryString = window.location.search.replace(/^\?/, '');
  queryString.split(/\&/).forEach(function(keyValuePair) {
      var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
      var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
      GET[paramName] = paramValue;
  });

  return GET;
}

/**
 * create html elements and return them in a parent div
 * @param {[String]} elementType tag names for the elements that will be created
 * @param {[[String]]} classes classes for each element
 * @param {[[String]]} attributes attributes for each element
 * @param {[[String]]} values values for each attribute for each element
 * @param {[String]} text innerhtml for each element
 * @param {[String]} divClasses calsses for the parent div for the elements
 * @returns {HTMLElement} html div whose children are the requested elements
 */
 function createElements(elementType = [], classes = [[]], attributes = [[]], values = [[]], text = [], divClasses = []) {
  // Make sure there is something passed into the function
  if (elementType.length >= 0) {
    let elements = createElement("div", divClasses);

    // Iterate through each of the elements that need created
    if (attributes.length == values.length && attributes.length >= 0) {
      for (let i = 0; i < elementType.length; i++) {
        elements.appendChild(createElement(elementType[i], classes[i], attributes[i], values[i], text[i]));
      }
    }

    // Return the element
    return elements;

  }
}

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

Array.prototype.runningTotal = function() {
  let arrayCopy = [...this];
  if (!arrayCopy[0]) {
    arrayCopy[0] = 0;
  }
  for (let i = 1; i < arrayCopy.length; i++) {
    if (arrayCopy[i]) {
      arrayCopy[i] = arrayCopy[i-1] + arrayCopy[i];
    }
    else {
      arrayCopy[i] = arrayCopy[i-1];
    }
  }
  return arrayCopy;
}

function getMinAndMax(arrays) {
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < arrays.length; i++) {
    for (let j = 0; j < arrays[i].length; j++) {
      if (arrays[i][j] < min) {
        min = arrays[i][j];
      }
      if (arrays[i][j] > max) {
        max = arrays[i][j];
      }
    }
  }
  return {min: min, max: max};
}

function lastScore(scoreObject, dateTime) {
  let lastTime = dateTime;
  let smallestDiff = Infinity;
  for (const date in scoreObject) {
    let diff = parseInt(dateTime) - parseInt(date);
    if (diff >= 0 && diff < smallestDiff) {
      smallestDiff = diff;
      lastTime = date;
    }
  }

  return scoreObject[lastTime];
}

function nextScore(scoreObject, dateTime) {
  let nextTime = dateTime;
  let smallestDiff = Infinity;
  for (const date in scoreObject) {
    let diff = parseInt(date) - parseInt(dateTime);
    if (diff >= 0 && diff < smallestDiff) {
      smallestDiff = diff;
      nextTime = date;
    }
  }

  return scoreObject[nextTime];
}

function latestScore(scoreObject) {
  return lastScore(scoreObject, (new Date()).getTime());
}

function initialScore(scoreObject) {
  return nextScore(scoreObject, -9999999999);
}

function highestScore(scoreObject) {
  let greatest = -Infinity;
  for (const date in scoreObject) {
    if (scoreObject[date] > greatest) {
      greatest = scoreObject[date]
    }
  }

  return greatest != -Infinity ? greatest : null;
}

function roundedAvg(values) {
  let array = values.filter(element => element);
  if (array.length == 0) {
    return null;
  }

  let total = 0;
  for (let i = 0; i < array.length; i++) {
    total += array[i];
  }
  return Math.round(total / array.length);
}

function getNextTestGoals() {
  if (actProfile["testGoals"]) {
    for (let i = 0; i < actProfile["testGoals"].length; i++) {
      if (dateDayDifference(new Date().getTime(), actProfile["testGoals"][i]["testDate"]) > 0) {
        return actProfile["testGoals"][i];
      }
    }
  } 
  else {
    return undefined;
  }
}

function dateDayDifference(start, end) {
  if (start && end) {
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
  }
  else return undefined;
}

function setSessionAxis(mainSection) {
  // Identify which sections are in the graph
  const currentDatasets = charts[mainSection]['config']['data']['datasets']
  sections = []
  for (let i = 0; i < currentDatasets.length; i++) {
    sections.push(currentDatasets[i]['label'].toLowerCase())
  }

  // Adjust the datasets
  let datasets = []
  for (let i = 0; i < sections.length; i++) {
    datasets.push(testArrays[sections[i]])
  }

  charts[mainSection].data.labels = sessionDateStr;
  charts[mainSection].data.datasets.forEach((dataset, index) => {
    dataset.data = datasets[index];
  });
  charts[mainSection].update("none");
}

function setHourAxis(mainSection) {
  // Identify which sections are in the graph
  const currentDatasets = charts[mainSection]['config']['data']['datasets']
  sections = []
  for (let i = 0; i < currentDatasets.length; i++) {
    sections.push(currentDatasets[i]['label'].toLowerCase())
  }

  // Adjust a few values
  let datasets = []
  let datasetHours = []
  for (let i = 0; i < sections.length; i++) {
    if (i == 0) {
      datasets.push([])
      datasetHours.push([])
      if (sections[i] != 'composite') {
        datasets.push(sectionHoursScoresArrays[sections[i]])
        datasetHours.push(sectionHoursArrays[sections[i]].runningTotal().slice(0, -1))
      }
    }
    else if (sections[i] != 'composite') {
      datasets.push(sectionHoursScoresArrays[sections[i]])
      datasetHours.push(sectionHoursArrays[sections[i]].runningTotal().slice(0, -1))
    }
  }
  let minMax = getMinAndMax(datasetHours);
  let hours = [];

  for (let i = minMax['min']; i <= minMax['max']; i+=15) {
    let timeSpent = (i / 60).toString()
    hours.push(timeSpent);
  }

  charts[mainSection].data.labels = hours;
  charts[mainSection].data.datasets.forEach((dataset, index) => {
    dataset.data = datasets[index];
  });
  charts[mainSection].update("none");
}

function generateChart(element, sections = ['composite', 'english', 'math', 'reading', 'science']) {

  // Dynamically generate the datasets
  let datasets = []
  for (let i = 0; i < sections.length; i++) {
    let info = {
      label: sections[i].charAt(0).toUpperCase() + sections[i].slice(1),
      backgroundColor: sectionColors[sections[i]],
      borderColor: sectionColors[sections[i]],
      fill: false,
      stepped: true,
      data: testArrays[sections[i]],
    }

    if (sections[i] == 'composite') {
      info['order'] = 1
      info['borderWidth'] = 7
      info['pointRadius'] = 3
      info['pointHoverRadius'] = 8
    }
    else {
      info['pointRadius'] = 5
      info['pointHoverRadius'] = 10
    }

    datasets.push(info)
  }

  // Dynamically find the suggested min and max values
  let suggestedMax = -Infinity;
  let suggestedMin = Infinity;
  for (let i = 0; i < sections.length; i++) {
    // Find the max
    if (getNextTestGoals()?.[sections[i] + "Goal"] - actProfile[sections[i] + "Initial"] + 2 > suggestedMax) {
      suggestedMax = getNextTestGoals()?.[sections[i] + "Goal"] - actProfile[sections[i] + "Initial"] + 2;
    } 

    // Find the min
    if (actProfile[sections[i] + "Initial"] - 2 < suggestedMin) {
      suggestedMin = actProfile[sections[i] + 'Initial']
    } 
  }

  // Dynamically generate the annotations
  let annotations =  {}
  for (let i = 0; i < sections.length; i++) {
    annotations[sections[i] + 'Goal'] = {
      'type' : 'line',
      'display' : () => {
        if (sectionRelativeGoals[sections[i]] || sectionRelativeGoals[sections[i]] == 0) {
          return true;
        }
        else {
          return false;
        }
      },
      'yMin' : sectionRelativeGoals[sections[i]],
      'yMax' : sectionRelativeGoals[sections[i]],
      'borderColor' : sectionColors[sections[i]],
      'borderWidth' : 2,
      'borderDash' : borderDashGoals[i],
      'borderDashOffset' : borderDashOffsetGoals[i],
      'label' : {
        'xAdjust' : borderDashOffsetGoals[i] - 6,
        'backgroundColor' : sectionColors[sections[i]],
        'color' : "white",
        'enabled' : true,
        'content' : sectionGoals[sections[i]],
        'position' : "start"
      }
    }
  }

  return new Chart(element, {
    // The type of chart we want to create
    type: 'line',
    // The data for our dataset
    data: {
      labels: sessionDateStr, // x-labels
      datasets: datasets
    },

    // Configuration options go here
    options: {
      responsive: true,
      spanGaps: true,
      scales: {
        y: {
          ticks: {
            stepSize: 1,
            callback: function(value, index, values) {
              if (parseInt(value) > 0) {
                return '+' + value;
              }
              else {
                return value;
              }
            }
          },
          suggestedMin: suggestedMin,
          suggestedMax: suggestedMax
        },
      },
      tooltips: {
        //intersect: false,
      },
      hover: {
        mode: 'nearest',
        //intersect: false
      },
      layout: {
        padding: {
            left: 50,
            right: 50,
            top: 50,
            bottom: 50
        }
      },
      plugins: {
        //fixme: I want the tooltip to show the actual score
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label
              let value = context.parsed.y

              //check for the section and add the intial back
              //piggy back off this callback to show the annotation of the sections goal
              switch (label) {
                case ("Composite"):
                  return label + " " + (value + initialComposite).toString();
                case ("English"):
                  return label + " " + (value + actProfile['englishInitial']).toString();
                case ("Math"):
                  return label + " " + (value + actProfile['mathInitial']).toString();
                case ("Reading"):
                  return label + " " + (value + actProfile['readingInitial']).toString();
                case ("Science"):
                  return label + " " + (value + actProfile['scienceInitial']).toString();
                default:
                  return null

              }
            }
          }
        },
        autocolors: false,
        annotation: {
          drawTime: 'beforeDatasetsDraw',
          annotations: annotations
        }
      }
    }
  });
}