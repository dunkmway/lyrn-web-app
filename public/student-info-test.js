let currentStudent = "";
let currentTutor = "";

let studentProfile = {};
let hwData = {};
let sessionData = {};

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


function main() {
  initialSetup()
  .then(() => {
    console.log("hwData", hwData);
    console.log("sessionData", sessionData);
    console.log("sessionDates", sessionDates);
    console.log("studentProfile", studentProfile);

    setProfileData();

    hwChart = setHomeworkChart();
  })
}

function initialSetup() {
  currentStudent = queryStrings()["student"];
  console.log("currentStudent", currentStudent);

  if (currentStudent) {
    let profileProm = getProfileData(currentStudent)
    .then((doc) => storeProfileData(doc))

    let hwSetupProm = getHomeworkData(currentStudent)
    .then((doc) => storeHomeworkData(doc))

    let sessionSetupProm = getSessionData(currentStudent)
    .then((doc) => storeSessionData(doc))

    let promises = [profileProm, hwSetupProm, sessionSetupProm];
    return Promise.all(promises);
  }

  return Promise.reject("No student is selected");
}

function getProfileData(studentUID) {
  const profileDocRef = firebase.firestore().collection("Students").doc(studentUID);
  return profileDocRef.get();
}

function storeProfileData(doc) {
  studentProfile = doc.data();
}

function getHomeworkData(studentUID) {
  const hwDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("hw");
  return hwDocRef.get();
}

function storeHomeworkData(doc) {
  hwData = doc.data();
  for (const test in hwData) {
    for (const section in hwData[test]) {
      if (hwData[test][section]['TestType'] == 'homework' && hwData[test][section]['ScaledScore']) {
        
        let date = hwData[test][section]['Date'];
        // let date = new Date(hwData[test][section]['Date']);
        // const day = date.getDate()
        // const month = date.getMonth()+1;
        // const year = date.getFullYear()
        // const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();

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
  // englishScores.sort((a,b) => sortHomeworkScores(a,b));
  // mathScores.sort((a,b) => sortHomeworkScores(a,b));
  // readingScores.sort((a,b) => sortHomeworkScores(a,b));
  // scienceScores.sort((a,b) => sortHomeworkScores(a,b));
  console.log("englishScores", englishScores);
  console.log("mathScores", mathScores);
  console.log("readingScores", readingScores);
  console.log("scienceScores", scienceScores);

  return Promise.resolve("hw data stored!");
}

function getSessionData(studentUID) {
  const sessionDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("sessions");
  return sessionDocRef.get();
}

function storeSessionData(doc) {
  sessionData = doc.data();
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

  // //set the sessionDate array
  // for (let i = 0; i < sessionDates.length; i++) {
  //   const date = new Date(sessionDates[i]);
  //   const day = date.getDate();
  //   const month = date.getMonth()+1;
  //   const year = date.getFullYear();
  //   const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();
  //   sessionDates[i] = dateStr;
  // }

  console.log("englishHours",englishHours);
  console.log("mathHours", mathHours);
  console.log("readingHours", readingHours);
  console.log("scienceHours", scienceHours);

  for (let i = 0; i < sessionDates.length; i++) {
    compositeHours[sessionDates[i]] = (englishHours[sessionDates[i]] ?? 0) + (mathHours[sessionDates[i]] ?? 0) + (readingHours[sessionDates[i]] ?? 0) + (scienceHours[sessionDates[i]] ?? 0);
  }
  console.log("compositeHours", compositeHours)
}

function setProfileData() {
  document.getElementById('student-name').textContent = studentProfile["studentFirstName"] + " " + studentProfile["studentLastName"];
  const currentEnglishScore = latestScore(englishScores);
  const currentMathScore = latestScore(mathScores);
  const currentReadingScore = latestScore(readingScores);
  const currentScienceScore = latestScore(scienceScores);
  const currentCompositeScore = roundedAvg([currentEnglishScore, currentMathScore, currentReadingScore, currentScienceScore]);

  document.getElementById('composite-score').textContent = currentCompositeScore ?? "";
  document.getElementById('english-score').textContent = currentEnglishScore ?? "";
  document.getElementById('math-score').textContent = currentMathScore ?? "";
  document.getElementById('reading-score').textContent = currentReadingScore ?? "";
  document.getElementById('science-score').textContent = currentScienceScore ?? "";
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

  console.log("compositeScores", compositeScores);

  let allHours = [/*compositeHoursArray.runningTotal(), */englishHoursArray.runningTotal(), mathHoursArray.runningTotal(), readingHoursArray.runningTotal(), scienceHoursArray.runningTotal()];
  let minMax = getMinAndMax(allHours);

  for (let i = minMax['min']; i <= minMax['max']; i+=5) {
    hoursArray.push(i);
  }

  for (let i = 0; i < compositeTestArray.length; i++) {
    if (compositeTestArray[i]) {
      compositeHoursScores[`${compositeHoursArray.runningTotal()[(i-1) >= 0 ? (i-1) : 0]}`] = compositeTestArray[i];
    }
  }
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

  console.log("compositeHoursScores", compositeHoursScores);
  console.log("englishHoursScores", englishHoursScores);
  console.log("mathHoursScores", mathHoursScores);
  console.log("readingHoursScores", readingHoursScores);
  console.log("scienceHoursScores", scienceHoursScores);

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
          backgroundColor: "black",
          borderColor: "black",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: compositeTestArray,
        },
        {
          label: "English",
          backgroundColor: "red",
          borderColor: "red",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: englishTestArray,
        },
        {
          label: "Math",
          backgroundColor: "blue",
          borderColor: "blue",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: mathTestArray,
        },
        {
          label: "Reading",
          backgroundColor: "green",
          borderColor: "green",
          fill: false,
          stepped: true,
          pointRadius: 5,
          pointHoverRadius: 10,
          data: readingTestArray,
        },
        {
          label: "Science",
          backgroundColor: "yellow",
          borderColor: "yellow",
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
          }
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
        averagePerHour: {
          test1: "test1",
          test2: "test2"
        },
        legend: {
          onclick: function(arg) {
            console.log(arg)
          }
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

function latestScore(scoreObject) {
  // let dates = [];
  // for (const dateTime in scoreObject) {
  //   dates.push(parseInt(dateTime));
  // }
  // if (dates.length < 1) {
  //   return null;
  // }

  // dates.sort((a,b) => {return a - b});

  // return scoreObject[dates[dates.length - 1].toString()];
  return lastScore(scoreObject, (new Date()).getTime());
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

function setSessionAxis() {
  datasets = [compositeTestArray, englishTestArray, mathTestArray, readingTestArray, scienceTestArray];
  hwChart.data.labels = sessionDateStr;
  hwChart.data.datasets.forEach((dataset, index) => {
    dataset.data = datasets[index];
  });
  hwChart.update('none');
}

function setHourAxis() {
  datasets = [/*compositeHoursScoresArray, */englishHoursScoresArray, mathHoursScoresArray, readingHoursScoresArray, scienceHoursScoresArray];
  hwChart.data.labels = hoursArray;
  hwChart.data.datasets.forEach((dataset, index) => {
    dataset.data = datasets[index];
  });
  hwChart.update('none');
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

Chart.register(plugin);

main();