let currentStudent = "";
let currentTutor = "";

let hwData = {};
let sessionData = {};

let sessionDates = [];

let englishScores = {};
let mathScores = {};
let readingScores = {};
let scienceScores = {};

let englishHours = {};
let mathHours = {};
let readingHours = {};
let scienceHours = {};

var hwChart;


function main() {
  console.log("In main()");
  initialSetup()
  .then(() => {
    console.log(hwData);
    console.log(sessionData);
    console.log(sessionDates);

    hwChart = setHomeworkChart();
  })
}

function initialSetup() {
  console.log("In initialSetup()");
  currentStudent = queryStrings()["student"];
  console.log(currentStudent);

  if (currentStudent) {
    let hwSetupProm = getHomeworkData(currentStudent)
    .then((doc) => storeHomeworkData(doc))

    let sessionSetupProm = getSessionData(currentStudent)
    .then((doc) => storeSessionData(doc))

    let promises = [hwSetupProm, sessionSetupProm];
    return Promise.all(promises);
  }

  return Promise.reject("No student is selected");
}

function getHomeworkData(studentUID) {
  console.log("Getting hw data");
  const hwDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("hw");
  return hwDocRef.get();
}

function storeHomeworkData(doc) {
  console.log("Storing hw data");
  hwData = doc.data();
  for (const test in hwData) {
    for (const section in hwData[test]) {
      if (hwData[test][section]['TestType'] == 'homework' && hwData[test][section]['ScaledScore']) {
        
        let date = new Date(hwData[test][section]['Date']);
        const day = date.getDate()
        const month = date.getMonth()+1;
        const year = date.getFullYear()
        const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();

        switch (section) {
          case "English":
            englishScores[dateStr] = hwData[test][section]['ScaledScore'];
            break;
          case "Math":
            mathScores[dateStr] = hwData[test][section]['ScaledScore'];
            break;
          case "Reading":
            readingScores[dateStr] = hwData[test][section]['ScaledScore'];
            break;
          case "Science":
            scienceScores[dateStr] = hwData[test][section]['ScaledScore'];
            break;
          default:
            console.log("We have a test with a section that doesn't match!!!")
        }
      }
    }
  }
  // englishScores.sort((a,b) => sortHomeworkScores(a,b));
  // mathScores.sort((a,b) => sortHomeworkScores(a,b));
  // readingScores.sort((a,b) => sortHomeworkScores(a,b));
  // scienceScores.sort((a,b) => sortHomeworkScores(a,b));
  console.log(englishScores);
  console.log(mathScores);
  console.log(readingScores);
  console.log(scienceScores);
  return Promise.resolve("hw data stored!");
}

function getSessionData(studentUID) {
  console.log("Getting session data");
  const sessionDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("sessions");
  return sessionDocRef.get();
}

function storeSessionData(doc) {
  console.log("Storing session data");
  sessionData = doc.data();
  //allows for checking repeat dates
  let tempDateArray = [];
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
      if (tempDateArray.indexOf(dateStr) == -1) {
        tempDateArray.push(dateStr);
        sessionDates.push(date);

        for (let section in sessionData[time]["sections"]) {
          switch (section) {
            case "English":
              englishHours[dateStr] = sessionData[time]["sections"][section]['time'];
              break;
            case "Math":
              mathHours[dateStr] = sessionData[time]["sections"][section]['time'];
              break;
            case "Reading":
              readingHours[dateStr] = sessionData[time]["sections"][section]['time'];
              break;
            case "Science":
              scienceHours[dateStr] = sessionData[time]["sections"][section]['time'];
              break;
            default:
              console.log("We have a session with a section that doesn't match!!!")
          }
        }
      }
    }
  }
  //sort from lowest to highest
  sessionDates.sort(function(a, b){return a - b});

  //set the sessionDate array
  for (let i = 0; i < sessionDates.length; i++) {
    const date = new Date(sessionDates[i]);
    const day = date.getDate();
    const month = date.getMonth()+1;
    const year = date.getFullYear();
    const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();
    sessionDates[i] = dateStr;
  }

  console.log(englishHours);
  console.log(mathHours);
  console.log(readingHours);
  console.log(scienceHours);
}

function setHomeworkChart() {
  //set up arrays for each test type
  let englishTestArray = [];
  let mathTestArray = [];
  let readingTestArray = [];
  let scienceTestArray = [];

  let englishHoursArray = [];
  let mathHoursArray = [];
  let readingHoursArray = [];
  let scienceHoursArray = [];

  for (let i = 0; i < sessionDates.length; i++) {
    englishTestArray.push(englishScores[sessionDates[i]]);
    mathTestArray.push(mathScores[sessionDates[i]]);
    readingTestArray.push(readingScores[sessionDates[i]]);
    scienceTestArray.push(scienceScores[sessionDates[i]]);

    englishHoursArray.push(englishHours[sessionDates[i]]);
    mathHoursArray.push(mathHours[sessionDates[i]]);
    readingHoursArray.push(readingHours[sessionDates[i]]);
    scienceHoursArray.push(scienceHours[sessionDates[i]]);
  }

  console.log(englishHoursArray.runningTotal());
  console.log(englishHoursArray);
  console.log(mathHoursArray.runningTotal());
  console.log(mathHoursArray);
  console.log(readingHoursArray.runningTotal());
  console.log(readingHoursArray);
  console.log(scienceHoursArray.runningTotal());
  console.log(scienceHoursArray);

  var ctxHW = document.getElementById("hw-canvas");
  return new Chart(ctxHW, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
      labels: sessionDates,
        datasets: [
          {
            label: "English",
            backgroundColor: "red",
            borderColor: "red",
            fill: false,
            steppedLine: true,
            pointRadius: 5,
            pointHoverRadius: 10,
            data: englishTestArray,
          },
          {
            label: "Math",
            backgroundColor: "blue",
            borderColor: "blue",
            fill: false,
            steppedLine: true,
            pointRadius: 5,
            pointHoverRadius: 10,
            data: mathTestArray,
          },
          {
            label: "Reading",
            backgroundColor: "green",
            borderColor: "green",
            fill: false,
            steppedLine: true,
            pointRadius: 5,
            pointHoverRadius: 10,
            data: readingTestArray,
          },
          {
            label: "Science",
            backgroundColor: "yellow",
            borderColor: "yellow",
            fill: false,
            steppedLine: true,
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
        yAxes: [{
            ticks: {
                stepSize: 1
            }
        }]
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

function filterInt(value) {
  if (/^[-+]?(\d+|Infinity)$/.test(value)) {
    return Number(value)
  } else {
    return NaN
  }
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

main();