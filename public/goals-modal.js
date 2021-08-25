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
  // //stops children from calling function
  // if (e.target !== e.currentTarget) return;
  // let allInputs = document.getElementById(modalID).querySelectorAll("input, select");

  // if ((initialsChanged || goalsChanged) && !submitted) {
  //   let confirmation = confirm("This data has not been saved.\nAre you sure you want to go back?");
  //   if (confirmation) {
  //     for(let i = 0; i < allInputs.length; i++) {
  //       allInputs[i].value = "";
  //     }
  //     document.getElementById(modalID).style.display = "none";
  //     let errorMessages = document.getElementById(modalID).querySelectorAll("p[id$='errMsg']");
  //     removeAllTestDateGoals();
  //     goalsChanged = false;

  //     for (let err = errorMessages.length - 1; err >= 0; err--) {
  //       errorMessages[err].remove()
  //     }
  //   }
  // }
  // else {
  //   for(let i = 0; i < allInputs.length; i++) {
  //     allInputs[i].value = "";
  //   }
  //   document.getElementById(modalID).style.display = "none";
  //   let errorMessages = document.getElementById(modalID).querySelectorAll("p[id$='errMsg']");
  //   removeAllTestDateGoals();
  //   goalsChanged = false;

  //   for (let err = errorMessages.length - 1; err >= 0; err--) {
  //     errorMessages[err].remove()
  //   }
  // }

  if (e.target !== e.currentTarget) return;
  document.getElementById(modalID).style.display = "none";

  document.getElementById(modalID).querySelectorAll('*').forEach(child => {
    removeAllWorkingClasses(child)
  })
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
      let englishGoal = testGoals[i].englishGoal ?? "";
      let mathGoal = testGoals[i].mathGoal ?? "";
      let readingGoal = testGoals[i].readingGoal ?? "";
      let scienceGoal = testGoals[i].scienceGoal ?? "";
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
          //updateProfileData()
          closeModal(Event,'update-goals-section', true);
        })
        .catch((error) => {
          handleFirebaseErrors(error, window.location.href);
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
          //updateProfileData()
          closeModal(Event, 'update-goals-section', true);
        })
        .catch((error) => {
          handleFirebaseErrors(error, window.location.href);
          document.getElementById("spinnyBoiGoals").style.display = "none";
          document.getElementById("update-goals-submitBtn").disbaled = false;
          document.getElementById("errMsgGoals").textContent = "There was an issue with saving these goals. Please try again."
        });
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
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
  while (removeTestDateGoal(element) > 0) {}
}

function updateProfileData() {
  document.getElementById('studentName').textContent = studentProfile["studentFirstName"] + " " + studentProfile["studentLastName"];

  const currentEnglishScore = latestScore(sectionScores['english']);
  const currentMathScore = latestScore(sectionScores['math']);
  const currentReadingScore = latestScore(sectionScores['reading']);
  const currentScienceScore = latestScore(sectionScores['science']);
  const currentCompositeScore = roundedAvg([currentEnglishScore, currentMathScore, currentReadingScore, currentScienceScore]);

  document.getElementById('composite-score').innerHTML = currentCompositeScore ?? null;
  document.getElementById('english-score').textContent = currentEnglishScore ?? null;
  document.getElementById('math-score').textContent = currentMathScore ?? null;
  document.getElementById('reading-score').textContent = currentReadingScore ?? null;
  document.getElementById('science-score').textContent = currentScienceScore ?? null;

  sectionGoals['english'] = getNextTestGoals()?.["englishGoal"];
  sectionGoals['math'] = getNextTestGoals()?.["mathGoal"]
  sectionGoals['reading'] = getNextTestGoals()?.["readingGoal"]
  sectionGoals['science'] = getNextTestGoals()?.["scienceGoal"]
  sectionGoals['composite'] = roundedAvg([sectionGoals['english'], sectionGoals['math'], sectionGoals['reading'], sectionGoals['science']]);

  document.getElementById('english-goal').textContent = sectionGoals['english'] ?? "...";
  document.getElementById('math-goal').textContent = sectionGoals['math'] ?? "...";
  document.getElementById('reading-goal').textContent = sectionGoals['reading'] ?? "...";
  document.getElementById('science-goal').textContent = sectionGoals['science'] ?? "...";
  document.getElementById('composite-goal').textContent = sectionGoals['composite'] ?? "...";

  //round to nearest .5
  const compositeTotalHours = Math.round(sectionHoursArray['composite'].runningTotal()[sectionHoursArray['composite'].runningTotal().length - 1] / 30) / 2;
  const englishTotalHours = Math.round(sectionHoursArray['english'].runningTotal()[sectionHoursArray['english'].runningTotal().length - 1] / 30) / 2;
  const mathTotalHours = Math.round(sectionHoursArray['math'].runningTotal()[sectionHoursArray['math'].runningTotal().length - 1] / 30) / 2;
  const readingTotalHours = Math.round(sectionHoursArray['reading'].runningTotal()[sectionHoursArray['reading'].runningTotal().length - 1] / 30) / 2;
  const scienceTotalHours = Math.round(sectionHoursArray['science'].runningTotal()[sectionHoursArray['science'].runningTotal().length - 1] / 30) / 2;

  document.getElementById('composite-total-hours').textContent = compositeTotalHours ?? "...";
  document.getElementById('english-total-hours').textContent = englishTotalHours ?? "...";
  document.getElementById('math-total-hours').textContent = mathTotalHours ?? "...";
  document.getElementById('reading-total-hours').textContent = readingTotalHours ?? "...";
  document.getElementById('science-total-hours').textContent = scienceTotalHours ?? "...";

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

  document.getElementById('next-test-date').textContent = nextTestDate ?? "...";
  document.getElementById('test-days-left').textContent = testDaysLeft ?? "...";

  //update the chart
  combinedHwChart.update("none");
}