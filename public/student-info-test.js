main();

function main() {
  initialSetupData()
  .then(() => {
    chartsSetup();
  })
}

function chartsSetup() {
    let chartElements = {
      'composite': undefined,
      'english': undefined,
      'math': undefined,
      'reading': undefined,
      'science': undefined
    }

    for (let i = 0; i < sections.length; i++) {
      chartElements[sections[i]] = document.getElementById(sections[i] + "Canvas");
    }
    chartElements['composite'] = document.getElementById("compositeCanvas");

    setHomeworkChartData();

    for (let i = 0; i < sections.length; i++) {
      charts[sections[i]] = generateChart(chartElements[sections[i]], ['composite', sections[i]])

      // Adjust the chart to have the sizing play nicely
      chartElements[sections[i]].style.maxWidth = "100%"
      chartElements[sections[i]].style.maxHeight = "93%"
    }
    charts['composite'] = generateChart(chartElements['composite'], ['composite', 'english', 'math', 'reading', 'science'])

    // Adjust the chart to have the sizing play nicely
    chartElements['composite'].style.maxWidth = "100%"
    chartElements['composite'].style.maxHeight = "93%"
}

function initialSetupData() {
  currentStudent = queryStrings()["student"];

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
  // set up arrays for each test type

  // Set the testArrays
  for (let i = 0; i < sections.length; i++) {
    testArrays[sections[i]].push(actProfile[sections[i] + 'Initial'] ?? null);
  }
  initialComposite = roundedAvg([actProfile['englishInitial'], actProfile['mathInitial'], actProfile['readingInitial'], actProfile['scienceInitial']]);
  testArrays['composite'].push(initialComposite);


  // Set the section Hours
  for (let i = 0; i < sections.length; i++) {
    sectionHoursArrays[sections[i]].push(0);
  }
  sectionHoursArrays['composite'].push(0);

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
  const sections = []
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
  const sections = []
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