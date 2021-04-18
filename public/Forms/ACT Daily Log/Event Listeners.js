// In Center Tests - Popup
inCenterTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && event.target.className.includes("gridBox") && test_view_type == "homework") {
    openForm('testAnswersPopup', undefined, event.target);
  }
  else if (event.target.className.includes("border") && test_view_type == 'inCenter') {
    openForm('testAnswersPopup', undefined, event.target);
  }
  else if (event.target.className.includes("button2") && event.target.className.includes("gridBox") && test_view_type == "assign") {
    setHomeworkStatus('assigned', 'False', event.target)
  }
})

// Homework Tests - Popup
let homeworkTests = document.getElementById("homeworkTests");
homeworkTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && event.target.className.includes("gridBox") && test_view_type == "homework") {
    openForm('testAnswersPopup', undefined, event.target);
  }
  else if (event.target.className.includes("border") && test_view_type == 'inCenter') {
    openForm('testAnswersPopup', undefined, event.target);
  }
  else if (event.target.className.includes("button2") && event.target.className.includes("gridBox") && test_view_type == "assign") {
    setHomeworkStatus('assigned', 'False', event.target)
  }
})

// Other Tests - Popup
let otherTests = document.getElementById("otherTests");
otherTests.addEventListener('click', function(event)  {
  if (event.target.className.includes("button2") && event.target.className.includes("gridBox") && test_view_type == "homework") {
    openForm('testAnswersPopup', undefined, event.target);
  }
  else if (event.target.className.includes("border") && test_view_type == 'inCenter') {
    openForm('testAnswersPopup', undefined, event.target);
  }
  else if (event.target.className.includes("button2") && event.target.className.includes("gridBox") && test_view_type == "assign") {
    setHomeworkStatus('assigned', 'False', event.target)
  }
})

// Listen for wrong answers
let popupAnswers = document.getElementById("passage")
popupAnswers.addEventListener('click', function(event) {
  if (event.target.parentNode.className.includes('input-row-center') && mark_type == 'answer') {
    const headerText = document.getElementById("answersPopupHeader").innerHTML;
    const test = headerText.split(" - ")[0];
    const section = headerText.split(" - ")[1];
    const passageNumber = headerText.split(" - ")[2];

    // If marked correct (not found), mark it wrong
    if (!tempAnswers[test]?.[section]?.[passageNumber]?.['Answers'].includes(event.target.parentNode.getAttribute("data-question"))) {
      tempAnswers[test][section][passageNumber]['Answers'].push(event.target.parentNode.querySelectorAll("div")[0].innerHTML)
    }
    // If marked wrong, change it to correct
    else {
      tempAnswers[test][section][passageNumber]['Answers'].splice(getArrayIndex(event.target.parentNode.querySelectorAll("div")[0].innerHTML, tempAnswers[test][section][passageNumber]['Answers']),1)
    }

    openForm('testAnswersPopup');
  }
  else if (event.target.parentNode.className.includes('input-row-center') && mark_type == 'guess') {
    console.log("Start marking guesses")

    openForm('testAnswersPopup');
  }
})




// Listen for wrong answers
/*let popupAnswers = document.getElementById("passage")
popupAnswers.addEventListener('click', function(event) {
  if (event.target.parentNode.className.includes('input-row-center')) {
    const headerText = document.getElementById("answersPopupHeader").innerHTML;
    const test = headerText.split(" - ")[0];
    const section = headerText.split(" - ")[1];
    const passageNumber = headerText.split(" - ")[2];
    const question = event.target.parentNode.getAttribute("data-question");
    const isMarkedWrong = tempAnswers[test]?.[section]?.[passageNumber]?.['Answers'].includes(event.target.parentNode.getAttribute("data-question"));
    const guessEndPoints = tempAnswers[test]?.[section]?.['GuessEndPoints'];
    let isGuessEndPoint = false;
    if (guessEndPoints != undefined) {
      isGuessEndPoint = guessEndPoints.includes(question);
    }

    // If not marked, mark the question wrong
    if (isMarkedWrong == false && isGuessEndPoint == false) {
      tempAnswers[test][section][passageNumber]['Answers'].push(event.target.parentNode.querySelectorAll("div")[0].innerHTML)
    }
    // If marked wrong and is not an endpoint, reset and mark as a guess endpoint
    else if (isMarkedWrong == true && isGuessEndPoint == false) {
      tempAnswers[test][section][passageNumber]['Answers'].splice(getArrayIndex(event.target.parentNode.querySelectorAll("div")[0].innerHTML, tempAnswers[test][section][passageNumber]['Answers']),1)
      if (!shouldMarkAsGuessed(test, section, question) || parseInt(question) > parseInt(guessEndPoints[guessEndPoints.length - 1])) {
        if (guessEndPoints == undefined || parseInt(question) > parseInt(guessEndPoints[guessEndPoints.length - 1])) {
          if (tempAnswers[test]?.[section]?.['GuessEndPoints'] != undefined) {
            tempAnswers[test][section]['GuessEndPoints'].push(question);
          }
          else {
            tempAnswers[test][section]['GuessEndPoints'] = []
            tempAnswers[test][section]['GuessEndPoints'].push(question);
          }
        }
        else {
          // Just mark the individual question
          tempAnswers[test][section]['GuessEndPoints'].push(question);
          tempAnswers[test][section]['GuessEndPoints'].push(question);
        }
      }
    }
    // If marked as an endpoint, mark wrong
    else if (isMarkedWrong == false && isGuessEndPoint == true) {
      tempAnswers[test][section][passageNumber]['Answers'].push(event.target.parentNode.querySelectorAll("div")[0].innerHTML)
    }
    // if marked wrong and is a guess endpoint, reset
    else if (isMarkedWrong == true && isGuessEndPoint == true) {
      // Remove the guess color class
      tempAnswers[test][section][passageNumber]['Answers'].splice(getArrayIndex(event.target.parentNode.querySelectorAll("div")[0].innerHTML, tempAnswers[test][section][passageNumber]['Answers']),1)

      if (guessEndPoints.length % 2 == 0) {
        if (guessEndPoints.length == 1) {
          delete tempAnswers[test][section]['GuessEndPoints']
        }
        else {
          const index = getArrayIndex(question, tempAnswers[test][section]['GuessEndPoints'])
          tempAnswers[test][section]['GuessEndPoints'].splice(index, 1)
          if (index % 2 == 1) {
            tempAnswers[test][section]['GuessEndPoints'].splice(index - 1, 1)
          }
          else if (tempAnswers[test][section]['GuessEndPoints'].length > index) {
            tempAnswers[test][section]['GuessEndPoints'].splice(index, 1)
          }
        }

        if (tempAnswers[test]?.[section]?.['GuessEndPoints'] != undefined && tempAnswers[test][section]['GuessEndPoints'].length == 0) {
          delete tempAnswers[test][section]['GuessEndPoints']
        }
      }
      else {
        tempAnswers[test][section]['GuessEndPoints'].push(question);
      }

    }

    // Sort the guessed questions array
    try {
      tempAnswers[test][section]['GuessEndPoints'].sort(function(a, b){return a-b})
    }
    catch {
      2 + 2;
    }

    openForm('testAnswersPopup');
  }
})*/

// Close the popup if they click outside of it
testAnswersPopup = document.getElementById("testAnswersPopup")
testAnswersPopup.addEventListener('click', function(event) {
  const doubleParent = event.target.parentNode.parentNode ?? undefined;
  let doubleParentId = undefined;
  if (doubleParent != undefined) {
    doubleParentId = event.target.parentNode.parentNode.id;
  }
  const parentId = event.target.parentNode.id;
  const id = event.target.id;
  if (doubleParentId != 'popupButtons' && parentId != 'popupButtons' && id != 'popupButtons'
      && doubleParentId != 'submitHomeworkPopup' && parentId != 'submitHomeworkPopup' && id != 'submitHomeworkPopup'
      && doubleParentId != 'perfectScorePopup' && parentId != 'perfectScorePopup' && id != 'perfectScorePopup') {
    let popup = document.getElementById("submitHomeworkPopup")
    let popup2 = document.getElementById("perfectScorePopup")
    popup.classList.remove("show");
    popup2.classList.remove("show");
  }
})

let timingBlock = document.getElementById("timingBlock")
timingBlock.addEventListener('change', function(event) {
  let minutes = document.getElementById("time-minutes").value
  let seconds = document.getElementById("time-seconds").value

  let testInfo = getTestInfo();

  setObjectValue([testInfo[0], testInfo[1], testInfo[2], 'Time'], parseInt(minutes) * 60 + parseInt(seconds), tempAnswers);
})

const beforeUnloadListener = (event) => {
  event.preventDefault();
  return event.returnValue = "You may lose data!";
};

function addUnloadListener() {
  addEventListener("beforeunload", beforeUnloadListener, {capture: true});
}

function removeUnloadListener() {
  removeEventListener("beforeunload", beforeUnloadListener, {capture: true});
}
