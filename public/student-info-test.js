let currentStudent = "";
let currentTutor = "";

let studentProfile = {};
let hwData = {};
let sessionData = {};
let actProfile = {};

let sessionDates = [];
let hoursArray = [];

let sessionDateStr = [];

let compositeScores = {};
let englishScores = {};
let mathScores = {};
let readingScores = {};
let scienceScores = {};

let compositeHours = {};
let englishHours = {};
let mathHours = {};
let readingHours = {};
let scienceHours = {};

let compositeTestArray = [];
let englishTestArray = [];
let mathTestArray = [];
let readingTestArray = [];
let scienceTestArray = [];

let compositeHoursArray = [];
let englishHoursArray = [];
let mathHoursArray = [];
let readingHoursArray = [];
let scienceHoursArray = [];

let compositeHoursScores = {};
let englishHoursScores = {};
let mathHoursScores = {};
let readingHoursScores = {};
let scienceHoursScores = {};

let compositeHoursScoresArray = [];
let englishHoursScoresArray = [];
let mathHoursScoresArray = [];
let readingHoursScoresArray = [];
let scienceHoursScoresArray = [];

var hwChart;

var goalsChanged = false;
var initialsChanged = false;


function main() {
  initialSetupData()
  .then(() => {
    // console.log("hwData", hwData);
    // console.log("sessionData", sessionData);
    // console.log("sessionDates", sessionDates);
    // console.log("studentProfile", studentProfile);

    hwChart = setHomeworkChart();
    updateProfileData();
    getGeneralNotes();
  })
}

function initialSetupData() {
  currentStudent = queryStrings()["student"];
  // console.log("currentStudent", currentStudent);

  if (currentStudent) {
    let profileProm = getProfileData(currentStudent)
    .then((doc) => storeProfileData(doc))

    // let hwSetupProm = getHomeworkData(currentStudent)
    // .then((doc) => storeHomeworkData(doc))

    let sessionSetupProm = getSessionData(currentStudent)
    .then((doc) => storeSessionData(doc))

    let actProfileProm = getActProfileData(currentStudent)
    .then((doc) => storeActProfileData(doc))
    //need the actProfile object first
    .then(() => getHomeworkData(currentStudent))
    .then((doc) => storeHomeworkData(doc))

    let promises = [profileProm, /*hwSetupProm,*/ sessionSetupProm, actProfileProm];
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
            englishScores[date] = hwData[test][section]['ScaledScore'];
            break;
          case "Math":
            mathScores[date] = hwData[test][section]['ScaledScore'];
            break;
          case "Reading":
            readingScores[date] = hwData[test][section]['ScaledScore'];
            break;
          case "Science":
            scienceScores[date] = hwData[test][section]['ScaledScore'];
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

  englishScores["-9999999998"] = actProfile["englishInitial"];
  mathScores["-9999999998"] = actProfile["mathInitial"];
  readingScores["-9999999998"] = actProfile["readingInitial"];
  scienceScores["-9999999998"] = actProfile["scienceInitial"];

  // console.log("englishScores", englishScores);
  // console.log("mathScores", mathScores);
  // console.log("readingScores", readingScores);
  // console.log("scienceScores", scienceScores);

  return Promise.resolve("hw data stored!");
}

function getSessionData(studentUID) {
  const sessionDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("sessions");
  return sessionDocRef.get();
}

function storeSessionData(doc) {
  sessionData = doc.data() ?? {};
  //allows for checking repeat dates
  //let tempDateArray = [];
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
      //if (tempDateArray.indexOf(dateStr) == -1) {
        //tempDateArray.push(dateStr);
        sessionDates.push(numTime);

        for (let section in sessionData[time]["sections"]) {
          switch (section) {
            case "English":
              englishHours[numTime] = sessionData[time]["sections"][section]['time'];
              break;
            case "Math":
              mathHours[numTime] = sessionData[time]["sections"][section]['time'];
              break;
            case "Reading":
              readingHours[numTime] = sessionData[time]["sections"][section]['time'];
              break;
            case "Science":
              scienceHours[numTime] = sessionData[time]["sections"][section]['time'];
              break;
            default:
              console.log("We have a session with a section that doesn't match!!!")
          }
        }
      //}
    }
  }
  //sort from lowest to highest
  sessionDates.sort(function(a, b){return a - b});

  // console.log("englishHours",englishHours);
  // console.log("mathHours", mathHours);
  // console.log("readingHours", readingHours);
  // console.log("scienceHours", scienceHours);

  for (let i = 0; i < sessionDates.length; i++) {
    compositeHours[sessionDates[i]] = (englishHours[sessionDates[i]] ?? 0) + (mathHours[sessionDates[i]] ?? 0) + (readingHours[sessionDates[i]] ?? 0) + (scienceHours[sessionDates[i]] ?? 0);
  }
  // console.log("compositeHours", compositeHours)
}

function getActProfileData(studentUID) {
  const actProfileDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("profile");
  return actProfileDocRef.get();
}

function storeActProfileData(doc) {
  actProfile = doc.data() ?? {};
}

function updateProfileData() {
  document.getElementById('student-name').textContent = studentProfile["studentFirstName"] + " " + studentProfile["studentLastName"];

  const currentEnglishScore = latestScore(englishScores);
  const currentMathScore = latestScore(mathScores);
  const currentReadingScore = latestScore(readingScores);
  const currentScienceScore = latestScore(scienceScores);
  const currentCompositeScore = roundedAvg([currentEnglishScore, currentMathScore, currentReadingScore, currentScienceScore]);

  document.getElementById('composite-score').innerHTML = currentCompositeScore ?? "";
  document.getElementById('english-score').textContent = currentEnglishScore ?? "";
  document.getElementById('math-score').textContent = currentMathScore ?? "";
  document.getElementById('reading-score').textContent = currentReadingScore ?? "";
  document.getElementById('science-score').textContent = currentScienceScore ?? "";

  const englishGoal = getNextTestGoals()?.["englishGoal"];
  const mathGoal = getNextTestGoals()?.["mathGoal"]
  const readingGoal = getNextTestGoals()?.["readingGoal"]
  const scienceGoal = getNextTestGoals()?.["scienceGoal"]
  const compositeGoal = roundedAvg([englishGoal, mathGoal, readingGoal, scienceGoal]);

  document.getElementById('english-goal').textContent = englishGoal ?? "...";
  document.getElementById('math-goal').textContent = mathGoal ?? "...";
  document.getElementById('reading-goal').textContent = readingGoal ?? "...";
  document.getElementById('science-goal').textContent = scienceGoal ?? "...";
  document.getElementById('composite-goal').textContent = compositeGoal ?? "...";

  //round to nearest .5
  const compositeTotalHours = Math.round(compositeHoursArray.runningTotal()[compositeHoursArray.runningTotal().length - 1] / 30) / 2;
  const englishTotalHours = Math.round(englishHoursArray.runningTotal()[englishHoursArray.runningTotal().length - 1] / 30) / 2;
  const mathTotalHours = Math.round(mathHoursArray.runningTotal()[mathHoursArray.runningTotal().length - 1] / 30) / 2;
  const readingTotalHours = Math.round(readingHoursArray.runningTotal()[readingHoursArray.runningTotal().length - 1] / 30) / 2;
  const scienceTotalHours = Math.round(scienceHoursArray.runningTotal()[scienceHoursArray.runningTotal().length - 1] / 30) / 2;

  document.getElementById('composite-total-hours').textContent = compositeTotalHours ?? "...";
  document.getElementById('english-total-hours').textContent = englishTotalHours ?? "...";
  document.getElementById('math-total-hours').textContent = mathTotalHours ?? "...";
  document.getElementById('reading-total-hours').textContent = readingTotalHours ?? "...";
  document.getElementById('science-total-hours').textContent = scienceTotalHours ?? "...";

  // //composite is not superscored but is highest at any given session
  // const compositeHighestScore = highestScore(compositeScores);
  // const englishHighestScore = highestScore(englishScores);
  // const mathHighestScore = highestScore(mathScores);
  // const readingHighestScore = highestScore(readingScores);
  // const scienceHighestScore = highestScore(scienceScores);

  // document.getElementById('composite-highest-score').textContent = compositeHighestScore ?? "...";
  // document.getElementById('english-highest-score').textContent = englishHighestScore ?? "...";
  // document.getElementById('math-highest-score').textContent = mathHighestScore ?? "...";
  // document.getElementById('reading-highest-score').textContent = readingHighestScore ?? "...";
  // document.getElementById('science-highest-score').textContent = scienceHighestScore ?? "...";

  const englishInitialScore = actProfile['englishInitial'];
  const mathInitialScore = actProfile['mathInitial'];
  const readingInitialScore = actProfile['readingInitial'];
  const scienceInitialScore = actProfile['scienceInitial'];
  const compositeInitialScore = roundedAvg([englishInitialScore, mathInitialScore, readingInitialScore, scienceInitialScore]);

  document.getElementById('composite-initial-score').textContent = compositeInitialScore ?? "...";
  document.getElementById('english-initial-score').textContent = englishInitialScore ?? "...";
  document.getElementById('math-initial-score').textContent = mathInitialScore ?? "...";
  document.getElementById('reading-initial-score').textContent = readingInitialScore ?? "...";
  document.getElementById('science-initial-score').textContent = scienceInitialScore ?? "...";

  const compositePointChange = (currentCompositeScore && compositeInitialScore) ? currentCompositeScore - compositeInitialScore : null;
  const englishPointChange = (currentEnglishScore && englishInitialScore) ? currentEnglishScore - englishInitialScore : null;
  const mathPointChange = (currentMathScore && mathInitialScore) ? currentMathScore - mathInitialScore : null;
  const readingPointChange = (currentReadingScore && readingInitialScore) ? currentReadingScore - readingInitialScore : null;
  const sciencePointChange = (currentReadingScore && scienceInitialScore) ? currentScienceScore - scienceInitialScore : null;

  document.getElementById('composite-point-change').textContent = compositePointChange ?? "...";
  document.getElementById('english-point-change').textContent = englishPointChange ?? "...";
  document.getElementById('math-point-change').textContent = mathPointChange ?? "...";
  document.getElementById('reading-point-change').textContent = readingPointChange ?? "...";
  document.getElementById('science-point-change').textContent = sciencePointChange ?? "...";

  const compositeHoursPerPoint = (compositePointChange) ? Math.round(compositeTotalHours / compositePointChange * 100) / 100 : null;
  const englishHoursPerPoint = (englishPointChange) ? Math.round(englishTotalHours / englishPointChange * 100) / 100 : null;
  const mathHoursPerPoint = (mathPointChange) ? Math.round(mathTotalHours / mathPointChange * 100) / 100 : null;
  const readingHoursPerPoint = (readingPointChange) ? Math.round(readingTotalHours / readingPointChange * 100) / 100 : null;
  const scienceHoursPerPoint = (sciencePointChange) ? Math.round(scienceTotalHours / sciencePointChange * 100) / 100 : null;

  document.getElementById('composite-hours/point').textContent = compositeHoursPerPoint ?? "...";
  document.getElementById('english-hours/point').textContent = englishHoursPerPoint ?? "...";
  document.getElementById('math-hours/point').textContent = mathHoursPerPoint ?? "...";
  document.getElementById('reading-hours/point').textContent = readingHoursPerPoint ?? "...";
  document.getElementById('science-hours/point').textContent = scienceHoursPerPoint ?? "...";

  const nextTestDate = convertFromDateInt(getNextTestGoals()?.["testDate"]) ? convertFromDateInt(getNextTestGoals()["testDate"])['shortDate'] : null;
  const testDaysLeft = dateDayDifference(new Date().getTime(), getNextTestGoals()?.["testDate"]);

  // console.log('nextTestDate', nextTestDate);
  // console.log('testDaysLeft', testDaysLeft);

  document.getElementById('next-test-date').textContent = nextTestDate ?? "...";
  document.getElementById('test-days-left').textContent = testDaysLeft ?? "...";

  //update the chart
  hwChart.update("none");
}

function setHomeworkChart() {
  //set up arrays for each test type

  for (let i = 0; i < sessionDates.length; i++) {
    englishTestArray.push(englishScores[sessionDates[i]]);
    mathTestArray.push(mathScores[sessionDates[i]]);
    readingTestArray.push(readingScores[sessionDates[i]]);
    scienceTestArray.push(scienceScores[sessionDates[i]]);

    let scores = [lastScore(englishScores, sessionDates[i]) ?? null, lastScore(mathScores, sessionDates[i]) ?? null, lastScore(readingScores, sessionDates[i]) ?? null, lastScore(scienceScores, sessionDates[i]) ?? null]
    compositeScores[sessionDates[i]] = roundedAvg(scores);
    compositeTestArray.push(roundedAvg(scores));

    compositeHoursArray.push(compositeHours[sessionDates[i]]);
    englishHoursArray.push(englishHours[sessionDates[i]]);
    mathHoursArray.push(mathHours[sessionDates[i]]);
    readingHoursArray.push(readingHours[sessionDates[i]]);
    scienceHoursArray.push(scienceHours[sessionDates[i]]);
  }

  // console.log("compositeScores", compositeScores);

  let allHours = [compositeHoursArray.runningTotal(), englishHoursArray.runningTotal(), mathHoursArray.runningTotal(), readingHoursArray.runningTotal(), scienceHoursArray.runningTotal()];
  let minMax = getMinAndMax(allHours);

  for (let i = minMax['min']; i <= minMax['max']; i+=5) {
    hoursArray.push(i);
  }

  for (let i = 1; i < compositeTestArray.length; i++) {
    if (compositeTestArray[i]) {
      compositeHoursScores[`${compositeHoursArray.runningTotal()[(i-1)]}`] = compositeTestArray[i];
    }
  }
  for (let i = 1; i < englishTestArray.length; i++) {
    if (englishTestArray[i]) {
      englishHoursScores[`${englishHoursArray.runningTotal()[(i-1)]}`] = englishTestArray[i];
    }
  }
  for (let i = 1; i < mathTestArray.length; i++) {
    if (mathTestArray[i]) {
      mathHoursScores[`${mathHoursArray.runningTotal()[(i-1)]}`] = mathTestArray[i];
    }
  }
  for (let i = 1; i < readingTestArray.length; i++) {
    if (readingTestArray[i]) {
      readingHoursScores[`${readingHoursArray.runningTotal()[(i-1)]}`] = readingTestArray[i];
    }
  }
  for (let i = 1; i < scienceTestArray.length; i++) {
    if (scienceTestArray[i]) {
      scienceHoursScores[`${scienceHoursArray.runningTotal()[(i-1)]}`] = scienceTestArray[i];
    }
  }

  // console.log("compositeHoursScores", compositeHoursScores);
  // console.log("englishHoursScores", englishHoursScores);
  // console.log("mathHoursScores", mathHoursScores);
  // console.log("readingHoursScores", readingHoursScores);
  // console.log("scienceHoursScores", scienceHoursScores);

  for (let i = 0; i < hoursArray.length; i++) {
    compositeHoursScoresArray.push(compositeHoursScores[hoursArray[i]]);
    englishHoursScoresArray.push(englishHoursScores[hoursArray[i]]);
    mathHoursScoresArray.push(mathHoursScores[hoursArray[i]]);
    readingHoursScoresArray.push(readingHoursScores[hoursArray[i]]);
    scienceHoursScoresArray.push(scienceHoursScores[hoursArray[i]]);
  }

  //set the sessionDate array in mm/dd/yyyy format
  for (let i = 0; i < sessionDates.length; i++) {
    const date = new Date(sessionDates[i]);
    const day = date.getDate();
    const month = date.getMonth()+1;
    const year = date.getFullYear();
    const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();
    sessionDateStr.push(dateStr);
  }

  var ctxHW = document.getElementById("hw-canvas");
  return new Chart(ctxHW, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
      labels: sessionDateStr,
      datasets: [
        {
          label: "Composite",
          backgroundColor: "#595959",
          borderColor: "#595959",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: compositeTestArray,
        },
        {
          label: "English",
          backgroundColor: "#4848FF",
          borderColor: "#4848FF",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: englishTestArray,
        },
        {
          label: "Math",
          backgroundColor: "#FF48A3",
          borderColor: "#FF48A3",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: mathTestArray,
        },
        {
          label: "Reading",
          backgroundColor: "#FFFF48",
          borderColor: "#FFFF48",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: readingTestArray,
        },
        {
          label: "Science",
          backgroundColor: "#48FFA3",
          borderColor: "#48FFA3",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: scienceTestArray,
        }
      ]
    },

    // Configuration options go here
    options: {
      responsive: true,
      spanGaps: true,
      scales: {
        y: {
          ticks: {
            stepSize: 1
          },
          suggestedMin: Math.min(
            actProfile['englishInitial'],
            actProfile['mathInitial'],
            actProfile['readingInitial'],
            actProfile['scienceInitial']
          ),
          suggestedMax: Math.max(
            getNextTestGoals()?.["englishGoal"], 
            getNextTestGoals()?.["mathGoal"], 
            getNextTestGoals()?.["readingGoal"], 
            getNextTestGoals()?.["scienceGoal"]
          )
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
        averagePerHour: false,
        // legend: {
        //   onClick: function(event, legendItem, legend) {
        //     console.log(event);
        //     console.log(legendItem);
        //     console.log(legend);
        //   }
        // }
        goalLine: false
        //goalLine: {
        //   goals: [
        //     roundedAvg([
        //       getNextTestGoals()?.["englishGoal"], 
        //       getNextTestGoals()?.["mathGoal"], 
        //       getNextTestGoals()?.["readingGoal"], 
        //       getNextTestGoals()?.["scienceGoal"]]),
        //     getNextTestGoals()?.["englishGoal"], 
        //     getNextTestGoals()?.["mathGoal"], 
        //     getNextTestGoals()?.["readingGoal"], 
        //     getNextTestGoals()?.["scienceGoal"]
        //   ]
        // }
      }
    }
  });
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

function setSessionAxis() {
  let datasets = [compositeTestArray, englishTestArray, mathTestArray, readingTestArray, scienceTestArray];
  hwChart.data.labels = sessionDateStr;
  hwChart.data.datasets.forEach((dataset, index) => {
    dataset.data = datasets[index];
  });
  hwChart.update("none");
}

function setHourAxis() {
  let datasets = [/*compositeHoursScoresArray*/[], englishHoursScoresArray, mathHoursScoresArray, readingHoursScoresArray, scienceHoursScoresArray];
  let datasetHours = [/*compositeHoursArray.runningTotal()*/[], englishHoursArray.runningTotal().slice(0, -1), mathHoursArray.runningTotal().slice(0, -1), readingHoursArray.runningTotal().slice(0, -1), scienceHoursArray.runningTotal().slice(0, -1)];
  let minMax = getMinAndMax(datasetHours);
  let hours = [];

  for (let i = minMax['min']; i <= minMax['max']; i+=5) {
    hours.push(i);
  }

  hwChart.data.labels = hours;
  hwChart.data.datasets.forEach((dataset, index) => {
    dataset.data = datasets[index];
  });
  hwChart.update("none");
}

const plugin = {
  id: "averagePerHour",
  afterDatasetDraw: function(chart, args, options) {
    var ctxPlugin = chart.ctx;
    var xAxis = chart.scales['x'];
    var yAxis = chart.scales['y'];
    
    ctxPlugin.strokeStyle = '#a9a9a9';
    ctxPlugin.beginPath();
    ctxPlugin.moveTo(xAxis.left, yAxis.bottom);
    ctxPlugin.lineTo(xAxis.right, yAxis.top);
    ctxPlugin.stroke();

    ctxPlugin.save();
    ctxPlugin.translate(xAxis.right - 150,yAxis.top + 75);
    var rotation = Math.atan((yAxis.top - yAxis.bottom) / (xAxis.right - xAxis.left))
    ctxPlugin.rotate(rotation);

    var diagonalText = 'FIXME: not optimal!';
    ctxPlugin.font = "16px Arial";
    ctxPlugin.fillStyle = "#a9a9a9";
    ctxPlugin.fillText(diagonalText, 0, 0);
    ctxPlugin.restore();
  }
}

const goalLinePlugin = {
  id: "goalLine",
  afterDatasetDraw : function(chart, args, options) {
    var ctxPlugin = chart.ctx;
    var xAxis = chart.scales['x'];
    var yAxis = chart.scales['y'];

    let goals = options['goals'];
    let currentGoal = goals?.[args['index']] ? parseInt(goals[args['index']]) : null;
    let goalPixelHeight = yAxis.getPixelForValue(currentGoal)
    let lineColor = args['meta']['_dataset']['backgroundColor'];

    ctxPlugin.strokeStyle = lineColor;
    ctxPlugin.lineWidth = "2"
    ctxPlugin.setLineDash([15, 10])
    ctxPlugin.beginPath();
    ctxPlugin.moveTo(xAxis.left, goalPixelHeight);
    ctxPlugin.lineTo(xAxis.right, goalPixelHeight);
    ctxPlugin.stroke();
  }
}

Chart.register(plugin);
Chart.register(goalLinePlugin);

main();





function openUpdateGoals() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (role == 'dev' || role == 'admin' || role == 'secretary' ) {
          document.getElementById("update-goals-section").style.display = "flex";
          updateGoalsModal();
        }
      })
    }
  });
}

function closeModal(e, modalID, submitted = false) {
  //stops children from calling function
  if (e.target !== e.currentTarget) return;
  let allInputs = document.getElementById(modalID).querySelectorAll("input, select");

  if ((initialsChanged || goalsChanged) && !submitted) {
    let confirmation = confirm("This data has not been saved.\nAre you sure you want to go back?");
    if (confirmation) {
      for(let i = 0; i < allInputs.length; i++) {
        allInputs[i].value = "";
      }
      document.getElementById(modalID).style.display = "none";
      let errorMessages = document.getElementById(modalID).querySelectorAll("p[id$='errMsg']");
      removeAllTestDateGoals();
      goalsChanged = false;

      for (let err = errorMessages.length - 1; err >= 0; err--) {
        errorMessages[err].remove()
      }
    }
  }
  else {
    for(let i = 0; i < allInputs.length; i++) {
      allInputs[i].value = "";
    }
    document.getElementById(modalID).style.display = "none";
    let errorMessages = document.getElementById(modalID).querySelectorAll("p[id$='errMsg']");
    removeAllTestDateGoals();
    goalsChanged = false;

    for (let err = errorMessages.length - 1; err >= 0; err--) {
      errorMessages[err].remove()
    }
  }
}

function updateGoalsModal() {
  // document.getElementById("updated-english-goal").value = actProfile["englishGoal"] ?? "";
  // document.getElementById("updated-math-goal").value = actProfile["mathGoal"] ?? "";
  // document.getElementById("updated-reading-goal").value = actProfile["readingGoal"] ?? "";
  // document.getElementById("updated-science-goal").value = actProfile["scienceGoal"] ?? "";

  document.getElementById("updated-english-initial").value = actProfile["englishInitial"] ?? "";
  document.getElementById("updated-math-initial").value = actProfile["mathInitial"] ?? "";
  document.getElementById("updated-reading-initial").value = actProfile["readingInitial"] ?? "";
  document.getElementById("updated-science-initial").value = actProfile["scienceInitial"] ?? "";

  if (actProfile["testGoals"]) {
    const testGoals = actProfile["testGoals"];
    for (let i = 0; i < testGoals.length; i++) {
      const addTestDateButton = document.getElementById("addTestDateGoalButton");
      let testDate = testGoals[i].testDate;
      let dateStr = convertFromDateInt(parseInt(testDate))['mm/dd/yyyy'] ?? "";
      let englishGoal = testGoals[0].englishGoal ?? "";
      let mathGoal = testGoals[0].mathGoal ?? "";
      let readingGoal = testGoals[0].readingGoal ?? "";
      let scienceGoal = testGoals[0].scienceGoal ?? "";
      addTestDateGoal(addTestDateButton, dateStr, englishGoal, mathGoal, readingGoal, scienceGoal);
    }
  }
  
  updateModalCompositeGoals();
  updateModalCompositeInitials();
}

function updateModalCompositeGoals() {
  //update each composite goal based on it's index from the id
  let allInputsDivs = document.getElementById("update-goals-section").querySelectorAll("div[id^='test-goals']");
  for (let i = 0; i < allInputsDivs.length; i++) {
    let testGoals = allInputsDivs[i].querySelectorAll(`input[id*='score-goal-${i+1}'`);
    let scoreValues = []
    for (let j = 0; j < testGoals.length; j++) {
      scoreValues.push(parseInt(testGoals[j].value));
    }
    document.getElementById(`updated-composite-goal-${i+1}`).textContent = roundedAvg(scoreValues) ?? "...";
  }
}

function goalsUpdated() {
  goalsChanged = true;
}

function updateModalCompositeInitials() {
  // console.log("updating modal")
  let allInputs = document.getElementById("update-goals-section").querySelectorAll("input[id$='initial']");
  let scoreValues = [];
  for (let i = 0; i < allInputs.length; i++) {
    scoreValues.push(parseInt(allInputs[i].value));
  }
  document.getElementById("updated-composite-initial").textContent = roundedAvg(scoreValues) ?? "...";
}

function initialsUpdated() {
  initialsChanged = true;
}

function submitUpdatedInfo() {
  document.getElementById("spinnyBoiGoals").style.display = "block";
  document.getElementById("errMsgGoals").textContent = null;
  document.getElementById("update-goals-submitBtn").disbaled = true;

  let allClear = true;

  let goalsSection = document.getElementById('update-goals-section');

  let goalDates = []
  let goalDateInputs = goalsSection.querySelectorAll("input[id*='test-date']");
  for (let i = 0; i < goalDateInputs.length; i++) {
    if (goalDateInputs[i].value.length == 10) {
      const month = parseInt(goalDateInputs[i].value.split('/')[0] - 1);
      const day = parseInt(goalDateInputs[i].value.split('/')[1]);
      const year = parseInt(goalDateInputs[i].value.split('/')[2]);

      goalDates.push((new Date(year, month, day, 8)).getTime());
    }
    else {
      document.getElementById("errMsgGoals").textContent = "Date " + (i+1) + " doesn't seem right...";
      allClear = false;
    }
  }

  let allInputs = goalsSection.querySelectorAll("input");
  for (let i = 0; i < allInputs.length; i++) {
    if (!allInputs[i].value) {
      document.getElementById("errMsgGoals").textContent = "Please complete all empty fields."
      allClear = false;
    }
  }

  if (allClear) {
    let testData = [];
    let allInputsDivs = document.getElementById("update-goals-section").querySelectorAll("div[id^='test-goals']");
    for (let i = 0; i < allInputsDivs.length; i++) {
      let testDate = goalDates[i];
      let englishGoal = document.getElementById(`updated-english-score-goal-${i+1}`).value ? parseInt(document.getElementById(`updated-english-score-goal-${i+1}`).value) : null;
      let mathGoal = document.getElementById(`updated-math-score-goal-${i+1}`).value ? parseInt(document.getElementById(`updated-math-score-goal-${i+1}`).value) : null;
      let readingGoal = document.getElementById(`updated-reading-score-goal-${i+1}`).value ? parseInt(document.getElementById(`updated-reading-score-goal-${i+1}`).value) : null;
      let scienceGoal = document.getElementById(`updated-science-score-goal-${i+1}`).value ? parseInt(document.getElementById(`updated-science-score-goal-${i+1}`).value) : null;

      testData.push({
          testDate : testDate,
          englishGoal : englishGoal,
          mathGoal : mathGoal,
          readingGoal : readingGoal,
          scienceGoal : scienceGoal 
      });
    }
    let infoData = {
      englishInitial : document.getElementById("updated-english-initial").value ? parseInt(document.getElementById("updated-english-initial").value) : null,
      mathInitial : document.getElementById("updated-math-initial").value ? parseInt(document.getElementById("updated-math-initial").value) : null,
      readingInitial : document.getElementById("updated-reading-initial").value ? parseInt(document.getElementById("updated-reading-initial").value) : null,
      scienceInitial : document.getElementById("updated-science-initial").value ? parseInt(document.getElementById("updated-science-initial").value) : null,

      testGoals : testData
    }

    const actProfileDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("ACT").doc("profile");
    actProfileDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        actProfileDocRef.update(infoData)
        .then(() => {
          //update the local object as well
          actProfile["englishInitial"] = infoData["englishInitial"];
          actProfile["mathInitial"] = infoData["mathInitial"];
          actProfile["readingInitial"] = infoData["readingInitial"];
          actProfile["scienceInitial"] = infoData["scienceInitial"];

          actProfile["testGoals"] = infoData["testGoals"];

          document.getElementById("spinnyBoiGoals").style.display = "none";
          document.getElementById("update-goals-submitBtn").disbaled = false;
          updateProfileData()
          closeModal(Event,'update-goals-section', true);
        })
        .catch((error) => {
          handleFirebaseErrors(error);
          document.getElementById("spinnyBoiGoals").style.display = "none";
          document.getElementById("update-goals-submitBtn").disbaled = false;
          document.getElementById("errMsgGoals").textContent = "There was an issue with saving these goals. Please try again."
        });
      }
      else {
        actProfileDocRef.set(infoData)
        .then(() => {
          //update the local object as well
          actProfile["englishInitial"] = infoData["englishInitial"];
          actProfile["mathInitial"] = infoData["mathInitial"];
          actProfile["readingInitial"] = infoData["readingInitial"];
          actProfile["scienceInitial"] = infoData["scienceInitial"];

          actProfile["testGoals"] = infoData["testGoals"];

          document.getElementById("spinnyBoiGoals").style.display = "none";
          document.getElementById("update-goals-submitBtn").disbaled = false;
          updateProfileData()
          closeModal(Event, 'update-goals-section', true);
        })
        .catch((error) => {
          handleFirebaseErrors(error);
          document.getElementById("spinnyBoiGoals").style.display = "none";
          document.getElementById("update-goals-submitBtn").disbaled = false;
          document.getElementById("errMsgGoals").textContent = "There was an issue with saving these goals. Please try again."
        });
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error);
      document.getElementById("spinnyBoiGoals").style.display = "none";
      document.getElementById("update-goals-submitBtn").disbaled = false;
      document.getElementById("errMsgGoals").textContent = "There was an issue with saving these goals. Please try again."
    });
  }
  else {
    document.getElementById("spinnyBoiGoals").style.display = "none";
    document.getElementById("update-goals-submitBtn").disbaled = false;
  }
}

function addTestDateGoal(e, dateStr = "", englishGoal = "", mathGoal = "", readingGoal = "", scienceGoal = "") {
  let testDateGoalBlock = e.parentNode.parentNode;
  let numChildren = (testDateGoalBlock.childElementCount - 1);

  let newTestDiv = createElement(
    'div',
    [],
    ['id'],
    ['test-goals-' + (numChildren + 1)],
    ""
    );
  let firstRow = createElement(
    'div',
    ['input-row'],
    [],
    [],
    ""
  );
  let secondRow = createElement(
    'div',
    ['input-row'],
    [],
    [],
    ""
  );
  let newTestDate = createElements(
    ['label', 'input'],
    [['label'], ['input']],
    [['for'], ['id', 'onclick', 'onkeydown', 'onkeyup', 'placeholder', 'value']],
    [['updated-test-date-goal-' + (numChildren + 1)], ['updated-test-date-goal-' + (numChildren + 1), "goalsUpdated()", "enforceNumericFormat(event)", "formatToDate(event)", "mm/dd/yyyy", dateStr]],
    ['Date ' + (numChildren + 1),""],
    ['input-block']
  );
  let newCompositeGoal = createElements(
    ['h4', 'h2'],
    [[], []],
    [[], ['id']],
    [[], ['updated-composite-goal-' + (numChildren + 1)]],
    ['Composite Goal:', "..."],
    ['input-block']
  );
  let newEnglishGoal = createElements(
    ['label', 'input'],
    [['label'], ['input', 'score']],
    [['for'], ['id', 'onchange', 'onkeydown', 'onkeyup', 'placeholder', 'min', 'max', 'value']],
    [['updated-english-score-goal-' + (numChildren + 1)], ['updated-english-score-goal-' + (numChildren + 1), "updateModalCompositeGoals(); goalsUpdated()", "enforceNumericFormat(event)", "formatToNumber(event)", "24", "0", "36", englishGoal]],
    ['English Goal:', ""],
    ['input-block']
  );
  let newMathGoal = createElements(
    ['label', 'input'],
    [['label'], ['input', 'score']],
    [['for'], ['id', 'onchange', 'onkeydown', 'onkeyup', 'placeholder', 'min', 'max', 'value']],
    [['updated-math-score-goal-' + (numChildren + 1)], ['updated-math-score-goal-' + (numChildren + 1), "updateModalCompositeGoals(); goalsUpdated()", "enforceNumericFormat(event)", "formatToNumber(event)", "24", "0", "36", mathGoal]],
    ['Math Goal:', ""],
    ['input-block']
  );
  let newReadingGoal = createElements(
    ['label', 'input'],
    [['label'], ['input', 'score']],
    [['for'], ['id', 'onchange', 'onkeydown', 'onkeyup', 'placeholder', 'min', 'max', 'value']],
    [['updated-reading-score-goal-' + (numChildren + 1)], ['updated-reading-score-goal-' + (numChildren + 1), "updateModalCompositeGoals(); goalsUpdated()", "enforceNumericFormat(event)", "formatToNumber(event)", "24", "0", "36", readingGoal]],
    ['Reading Goal:', ""],
    ['input-block']
  );
  let newScienceGoal = createElements(
    ['label', 'input'],
    [['label'], ['input', 'score']],
    [['for'], ['id', 'onchange', 'onkeydown', 'onkeyup', 'placeholder', 'min', 'max', 'value']],
    [['updated-science-score-goal-' + (numChildren + 1)], ['updated-science-score-goal-' + (numChildren + 1), "updateModalCompositeGoals(); goalsUpdated()", "enforceNumericFormat(event)", "formatToNumber(event)", "24", "0", "36", scienceGoal]],
    ['Science Goal:', ""],
    ['input-block']
  );

  firstRow.appendChild(newEnglishGoal);
  firstRow.appendChild(newMathGoal);
  secondRow.appendChild(newReadingGoal);
  secondRow.appendChild(newScienceGoal);

  newTestDiv.appendChild(newTestDate);
  newTestDiv.appendChild(newCompositeGoal);
  newTestDiv.appendChild(firstRow);
  newTestDiv.appendChild(secondRow);

  testDateGoalBlock.appendChild(newTestDiv);
}

function removeTestDateGoal(e) {
  let testDateGoalBlock = e.parentNode.parentNode;
  let numChildren = (testDateGoalBlock.childElementCount - 1);
  let children = testDateGoalBlock.children;

  if (numChildren >= 1) {
    children[children.length - 1].remove();
  }
  return numChildren;
}

function removeAllTestDateGoals() {
  let element = document.getElementById("removeTestDateGoalButton");
  while (removeTestDateGoal(element) > 0);
}

function getGeneralNotes() {
  const generalNotes = actProfile["generalNotes"];
  let noteTimes = [];
  for (const time in generalNotes) {
    noteTimes.push(parseInt(time));
  }

  noteTimes.sort((a,b) => {return a-b});
  for (let i = 0; i < noteTimes.length; i++) {
    setGeneralNotes(generalNotes[noteTimes[i]]["note"], noteTimes[i], generalNotes[noteTimes[i]]["user"]);
  }
}

function setGeneralNotes(note, time, author) {
  firebase.auth().onAuthStateChanged((user) => {
    const currentUser = user?.uid ?? null;
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (note) {
          //all the messages
          let messageBlock = document.getElementById('student-general-notes');
          //the div that contains the time and message
          let messageDiv = document.createElement('div');
          //the message itself
          let message = document.createElement('div');
          //time for the message
          let timeElem = document.createElement('p');

          //display the time above the mesasge
          timeElem.innerHTML = convertFromDateInt(time)['shortDate'];
          timeElem.classList.add('time');
          messageDiv.appendChild(timeElem);

          //set up the message
          message.innerHTML = note;
          //author's name element
          let authorElem = document.createElement('p');
          authorElem.classList.add("author");
          message.appendChild(authorElem);

          const getUserDisplayName = firebase.functions().httpsCallable('getUserDisplayName');
          getUserDisplayName({
            uid : author
          })
          .then((result) => {
            const authorName = result.data ?? "anonymous";
            authorElem.innerHTML = authorName;
            scrollBottomGeneralNotes();
          })
          .catch((error) => handleFirebaseErrors(error));

          message.setAttribute('data-time', time);
          message.classList.add("student-general-note");
          if (currentUser == author) {
            messageDiv.classList.add("right");
          }
          else {
            messageDiv.classList.add("left");
          }

          const getUserRole = firebase.functions().httpsCallable('getUserRole');
          getUserRole({
            uid : author
          })
          .then((result) => {
            const authorRole = result.data ?? null;
            if (authorRole == "admin") {
              message.classList.add("important");
            }
            scrollBottomGeneralNotes();
          })
          .catch((error) => handleFirebaseErrors(error));
          

          //only give the option to delete if the currentUser is the author or an admin
          if (author == currentUser || role == "admin" || role == "dev") {
            let deleteMessage = document.createElement('div');
            deleteMessage.classList.add("delete");
            let theX = document.createElement('p');
            theX.innerHTML = "X";
            deleteMessage.appendChild(theX);
            deleteMessage.addEventListener('click', (event) => deleteGeneralNote(event));
            message.appendChild(deleteMessage);
          }
          
          messageDiv.appendChild(message);
          messageBlock.appendChild(messageDiv);
          document.getElementById('student-general-notes-input').value = null;
          scrollBottomGeneralNotes();
        }
      })
      .catch((error) => handleFirebaseErrors(error));
    }
  });
}

function deleteGeneralNote(event) {
  let message = event.target.closest(".student-general-note");
  let confirmation = confirm("Are you sure you want to delete this message?");
  if (confirmation) {
    const time = message.dataset.time;
    const actProfileDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("ACT").doc("profile");
    actProfileDocRef.update({
      [`generalNotes.${time}`] : firebase.firestore.FieldValue.delete()
    })
    .then(() => {
      message.remove();
    })
    .catch((error) => {
      handleFirebaseErrors(erros);
    })
  }
}

function scrollBottomGeneralNotes() {
  let notes = document.getElementById("student-general-notes");
  notes.scrollTop = notes.scrollHeight;
}

function sendGeneralNotes() {
  firebase.auth().onAuthStateChanged((user) => {
    const currentUser = user?.uid ?? null;
    const note = document.getElementById('student-general-notes-input').value;
    const time = new Date().getTime();

    const data = {
      user : currentUser,
      note : note
    } 

    if (note) {
      //upload the note to firebase
      const actProfileDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("ACT").doc("profile");
      actProfileDocRef.get()
      .then((doc) => {
        if (doc.exists) {
          actProfileDocRef.update({
            [`generalNotes.${time}`] : data
          })
          .then(() => {
            //send the note into the message div
            setGeneralNotes(note, time, currentUser);
          })
          .catch((error) => {
            handleFirebaseErrors(error);
          });
        }
        else {
          actProfileDocRef.set({
            [`generalNotes.${time}`] : data
          })
          .then(() => {
            //send the note into the message div
            setGeneralNotes(note, time, currentUser);
          })
          .catch((error) => {
            handleFirebaseErrors(error);
          });
        }
      })
      .catch((error) => {
        handleFirebaseErrors(error);
      });
    }
  });
}

/**
 * Description:
 *   checks if the key event is a numeric input
 * @param {event} event javascript event
 */
 const isNumericInput = (event) => {
	const key = event.keyCode;
	return ((key >= 48 && key <= 57) || // Allow number line
		(key >= 96 && key <= 105) // Allow number pad
	);
};

/**
 * Description:
 *   checks if the key event is an allowed modifying key
 * @param {event} event javascript event
 */
const isModifierKey = (event) => {
	const key = event.keyCode;
	return (event.shiftKey === true || key === 35 || key === 36) || // Allow Shift, Home, End
		(key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
		(key > 36 && key < 41) || // Allow left, up, right, down
		(
			// Allow Ctrl/Command + A,C,V,X,Z
			(event.ctrlKey === true || event.metaKey === true) &&
			(key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
		)
};

const enforceNumericFormat = (event) => {
	// Input must be of a valid number format or a modifier key, and not longer than ten digits
	if(!isNumericInput(event) && !isModifierKey(event)){
		event.preventDefault();
	}
};

const formatToDate = (event) => {
	if(isModifierKey(event)) {return;}

	// I am lazy and don't like to type things more than once
	const target = event.target;
	const input = event.target.value.replace(/\D/g,'').substring(0,8); // First ten digits of input only
  let month = input.substring(0,2);
	let day = input.substring(2,4);
  let year = input.substring(4,8);
  
  //enforce proper months and day values
  if (Number(month) > 12) {
    month = "12";
  }
  if (Number(day) > 31) {
    day = "31"
  }

	if(input.length > 4) {
    target.value = `${month}/${day}/${year}`;
    target.dispatchEvent(new Event('change'));
  }
	else if(input.length > 2) {
    target.value = `${month}/${day}`;
    target.dispatchEvent(new Event('change'));
  }
	else if(input.length > 0) {
    target.value = `${month}`;
    target.dispatchEvent(new Event('change'));
  }
};

const formatToNumber = (event) => {
  if(isModifierKey(event)) {return;}

  const target = event.target;
  const min = Number(target.getAttribute("min"));
  const max = Number(target.getAttribute("max"));
  let input = ""
  if (!target.value.includes('.')) {
  	input = Number(target.value).toString();
  }
  else if (target.value[target.value.length - 1] == '.') {
  	input = Number(target.value[0])
  }
  else {
  	input = Number(target.value)
  }

  //remove leading zeros
  if (input < min) {
    target.value = min;
    target.dispatchEvent(new Event('change'));
  }
  else if (input > max) {
    target.value = max;
    target.dispatchEvent(new Event('change'));
  }
}

document.getElementById("updated-english-initial").addEventListener('keydown',enforceNumericFormat);
document.getElementById("updated-english-initial").addEventListener('keyup',formatToNumber);
document.getElementById("updated-math-initial").addEventListener('keydown',enforceNumericFormat);
document.getElementById("updated-math-initial").addEventListener('keyup',formatToNumber);
document.getElementById("updated-reading-initial").addEventListener('keydown',enforceNumericFormat);
document.getElementById("updated-reading-initial").addEventListener('keyup',formatToNumber);
document.getElementById("updated-science-initial").addEventListener('keydown',enforceNumericFormat);
document.getElementById("updated-science-initial").addEventListener('keyup',formatToNumber);

// general notes enter key will submit the note
document.getElementById("student-general-notes-input").addEventListener('keydown', (event) =>  {
  if (event.key == "Enter") {
    event.preventDefault();
    sendGeneralNotes();
  }
});

//stop scroll of the section when in the message div
document.getElementById("student-general-notes").addEventListener("mouseover", (event) => {
  document.getElementById("student-data-section").style.overflow = 'hidden';
});

document.getElementById("student-general-notes").addEventListener("mouseout", (event) => {
  document.getElementById("student-data-section").style.overflow = 'auto';
});