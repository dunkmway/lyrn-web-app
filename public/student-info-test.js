let currentStudent = "";
let currentTutor = "";

let hwData = {};
let sessionData = {};

let sessionDates = [];
let englishScores = [];
let mathScores = [];
let readingScores = [];
let scienceScores = [];

var hwChart

main();

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
            englishScores.push({
              x: dateStr,
              y: hwData[test][section]['ScaledScore']
            });
            break;
          case "Math":
            mathScores.push({
              x: dateStr,
              y: hwData[test][section]['ScaledScore']
            });
            break;
          case "Reading":
            readingScores.push({
              x: dateStr,
              y: hwData[test][section]['ScaledScore']
            });
            break;
          case "Science":
            scienceScores.push({
              x: dateStr,
              y: hwData[test][section]['ScaledScore']
            });
            break;
          default:
            console.log("We have a test with a section that doesn't match!!!")
        }
      }
    }
  }
  englishScores.sort((a,b) => sortHomeworkScores(a,b));
  mathScores.sort((a,b) => sortHomeworkScores(a,b));
  readingScores.sort((a,b) => sortHomeworkScores(a,b));
  scienceScores.sort((a,b) => sortHomeworkScores(a,b));
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
    if (!isNaN(numTime)) {
      const date = new Date(numTime);
      const day = date.getDate();
      const month = date.getMonth()+1;
      const year = date.getFullYear();
      const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();
      if (tempDateArray.indexOf(dateStr) == -1) {
        tempDateArray.push(dateStr);
        sessionDates.push(date);
      }
    }
  }
  //sort from lowest to highest
  sessionDates.sort(function(a, b){return a - b});

  for (let i = 0; i < sessionDates.length; i++) {
    const date = new Date(sessionDates[i]);
    const day = date.getDate();
    const month = date.getMonth()+1;
    const year = date.getFullYear();
    const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();
    sessionDates[i] = dateStr;
  }

}

function setHomeworkChart() {
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
            data: englishScores,
          },
          {
            label: "Math",
            backgroundColor: "blue",
            borderColor: "blue",
            fill: false,
            steppedLine: true,
            pointRadius: 5,
            pointHoverRadius: 10,
            data: mathScores,
          },
          {
            label: "Reading",
            backgroundColor: "green",
            borderColor: "green",
            fill: false,
            steppedLine: true,
            pointRadius: 5,
            pointHoverRadius: 10,
            data: readingScores,
          },
          {
            label: "Science",
            backgroundColor: "yellow",
            borderColor: "yellow",
            fill: false,
            steppedLine: true,
            pointRadius: 5,
            pointHoverRadius: 10,
            data: scienceScores,
          }
        ]
    },

    // Configuration options go here
    options: {
      scales: {
        yAxes: [{
            ticks: {
                stepSize: 1
            }
        }]
      },
      tooltips: {
        callbacks: {
            title: function(tooltipItem, data) {
              let title = data.datasets[tooltipItem[0].datasetIndex].data[tooltipItem[0].index].x;
              return title;
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

function filterInt(value) {
  if (/^[-+]?(\d+|Infinity)$/.test(value)) {
    return Number(value)
  } else {
    return NaN
  }
}

function sortHomeworkScores(a,b) {
  aArray = a['x'].split("/");
  bArray = b['x'].split("/");

  if (parseInt(aArray[0]) < parseInt(bArray[0])) {
    return -1;
  }
  else if (parseInt(aArray[0]) > parseInt(bArray[0])) {
    return 1;
  }
  else {
    if (parseInt(aArray[1]) < parseInt(bArray[1])) {
      return -1;
    }
    else if (parseInt(aArray[1]) > parseInt(bArray[1])) {
      return 1;
    }
    else {
      if (parseInt(aArray[2]) < parseInt(bArray[2])) {
        return -1;
      }
      else if (parseInt(aArray[2]) > parseInt(bArray[2])) {
        return 1;
      }
      else {
        return 0;
      }
    }
  }
}
