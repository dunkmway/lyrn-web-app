let currentStudent = "";
let currentTutor = "";

let hwData = {};
let sessionData = {};

let sessionDates = [];
let hoursArray = [];

let englishScores = {};
let mathScores = {};
let readingScores = {};
let scienceScores = {};

let englishHours = {};
let mathHours = {};
let readingHours = {};
let scienceHours = {};

let englishTestArray = [];
let mathTestArray = [];
let readingTestArray = [];
let scienceTestArray = [];

let englishHoursArray = [];
let mathHoursArray = [];
let readingHoursArray = [];
let scienceHoursArray = [];

let englishHoursScores = {};
let mathHoursScores = {};
let readingHoursScores = {};
let scienceHoursScores = {};

let englishHoursScoresArray = [];
let mathHoursScoresArray = [];
let readingHoursScoresArray = [];
let scienceHoursScoresArray = [];

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

  console.log("englishHours",englishHours);
  console.log(mathHours);
  console.log(readingHours);
  console.log(scienceHours);
}

function setHomeworkChart() {
  //set up arrays for each test type

  console.log(englishScores);


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

  let allHours = [englishHoursArray.runningTotal(), mathHoursArray.runningTotal(), readingHoursArray.runningTotal(), scienceHoursArray.runningTotal()];
  let minMax = getMinAndMax(allHours);

  for (let i = minMax['min']; i <= minMax['max']; i+=5) {
    hoursArray.push(i);
  }

  // for (let i = 0; i < hoursArray.length; i++) {
  //   let englishIndex = (englishHoursArray.runningTotal()).findIndex(element => element == hoursArray[i]);
  //   console.log("Found ", hoursArray[i], " at index ", englishIndex, " which is ", englishHoursArray.runningTotal()[englishIndex], " with score ", englishTestArray[englishIndex]);
  //   if (englishIndex != -1) {
  //     englishHoursScores.push(englishTestArray[englishIndex]);
  //   }
  //   else {
  //     englishHoursScores.push(null);
  //   }

  //   let mathIndex = mathHoursArray.runningTotal().findIndex(element => element == hoursArray[i]);
  //   if (mathIndex != -1) {
  //     mathHoursScores.push(mathTestArray[mathIndex]);
  //   }
  //   else {
  //     mathHoursScores.push(null);
  //   }

  //   let readingIndex = readingHoursArray.runningTotal().findIndex(element => element == hoursArray[i]);
  //   if (readingIndex != -1) {
  //     readingHoursScores.push(readingTestArray[englishIndex]);
  //   }
  //   else {
  //     readingHoursScores.push(null);
  //   }

  //   let scienceIndex = scienceHoursArray.runningTotal().findIndex(element => element == hoursArray[i]);
  //   if (scienceIndex != -1) {
  //     scienceHoursScores.push(scienceTestArray[englishIndex]);
  //   }
  //   else {
  //     scienceHoursScores.push(null);
  //   }
    
  // }

  for (let i = 0; i < englishTestArray.length; i++) {
    if (englishTestArray[i]) {
      englishHoursScores[`${englishHoursArray.runningTotal()[(i-1) >= 0 ? (i-1) : 0]}`] = englishTestArray[i];
    }
  }
  for (let i = 0; i < mathTestArray.length; i++) {
    if (mathTestArray[i]) {
      mathHoursScores[`${mathHoursArray.runningTotal()[(i-1) >= 0 ? (i-1) : 0]}`] = mathTestArray[i];
    }
  }
  for (let i = 0; i < readingTestArray.length; i++) {
    if (readingTestArray[i]) {
      readingHoursScores[`${readingHoursArray.runningTotal()[(i-1) >= 0 ? (i-1) : 0]}`] = readingTestArray[i];
    }
  }
  for (let i = 0; i < scienceTestArray.length; i++) {
    if (scienceTestArray[i]) {
      scienceHoursScores[`${scienceHoursArray.runningTotal()[(i-1) >= 0 ? (i-1) : 0]}`] = scienceTestArray[i];
    }
  }

  console.log(englishHoursScores);
  console.log(mathHoursScores);
  console.log(readingHoursScores);
  console.log(scienceHoursScores);

  for (let i = 0; i < hoursArray.length; i++) {
    englishHoursScoresArray.push(englishHoursScores[hoursArray[i]]);
    mathHoursScoresArray.push(mathHoursScores[hoursArray[i]]);
    readingHoursScoresArray.push(readingHoursScores[hoursArray[i]]);
    scienceHoursScoresArray.push(scienceHoursScores[hoursArray[i]]);
  }

  var ctxHW = document.getElementById("hw-canvas");
  return new Chart(ctxHW, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
      // labels: sessionDates,
      labels: hoursArray,
      datasets: [
        {
          label: "English",
          backgroundColor: "red",
          borderColor: "red",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          //data: englishTestArray,
          data: englishHoursScoresArray
        },
        {
          label: "Math",
          backgroundColor: "blue",
          borderColor: "blue",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          //data: mathTestArray,
          data: mathHoursScoresArray
        },
        {
          label: "Reading",
          backgroundColor: "green",
          borderColor: "green",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          //data: readingTestArray,
          data: readingHoursScoresArray
        },
        {
          label: "Science",
          backgroundColor: "yellow",
          borderColor: "yellow",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          //data: scienceTestArray,
          data: scienceHoursScoresArray
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
        }],
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

function setSessionAxis() {
  datasets = [englishTestArray, mathTestArray, readingTestArray, scienceTestArray];
  hwChart.data.labels = sessionDates;
  hwChart.data.datasets.forEach((dataset, index) => {
    dataset.data = datasets[index];
  });
  hwChart.update('none');
}

function setHourAxis() {
  datasets = [englishHoursScoresArray, mathHoursScoresArray, readingHoursScoresArray, scienceHoursScoresArray];
  hwChart.data.labels = hoursArray;
  hwChart.data.datasets.forEach((dataset, index) => {
    dataset.data = datasets[index];
  });
  hwChart.update('none');
}

main();