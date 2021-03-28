let currentStudent = "";
let currentTutor = "";
let hwData = {};
let hwTestsTaken = [];
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

    let promises = [hwSetupProm];
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
      if (hwData[test][section]['testType'] == 'homework' && hwData[test][section]['Score']) {
        switch (section) {
          case "English":
            englishScores.push({
              x: test,
              y: hwData[test][section]['Score']
            });
            break;
          case "Math":
            mathScores.push({
              x: test,
              y: hwData[test][section]['Score']
            });
            break;
          case "Reading":
            readingScores.push({
              x: test,
              y: hwData[test][section]['Score']
            });
            break;
          case "Science":
            scienceScores.push({
              x: test,
              y: hwData[test][section]['Score']
            });
            break;
          default:
            console.log("We have a test with a section that doesn't match!!!")
        }
      }
    }
  }
  console.log(englishScores);
  console.log(mathScores);
  console.log(readingScores);
  console.log(scienceScores);
  return Promise.resolve("hw data stored!");
}

function setHomeworkChart() {
  var ctxHW = document.getElementById("hw-canvas");
  return new Chart(ctxHW, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
      labels: ["B02", "MC3"],
        datasets: [
          {
            label: "English",
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: englishScores,
          },
          {
            label: "Math",
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: mathScores,
          },
          {
            label: "Reading",
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: readingScores,
          },
          {
            label: "Science",
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: scienceScores,
          }
        ]
    },

    // Configuration options go here
    options: {}
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
