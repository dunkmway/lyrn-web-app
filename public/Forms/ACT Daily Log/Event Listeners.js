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

// Listen for wrong answers or guesses
let guess_start = 0;
let guess_end = 0;
let popupAnswers = document.getElementById("passage")
popupAnswers.addEventListener('click', function(event) {

  // Needed info
  const headerText = document.getElementById("answersPopupHeader").innerHTML;
  const test = headerText.split(" - ")[0];
  const section = headerText.split(" - ")[1];
  const passageNumber = headerText.split(" - ")[2];
  const question = event.target.parentNode.getAttribute("data-question");

  // Check to see if we're marking a question as wrong / correct
  if (event.target.parentNode.className.includes('input-row-center') && mark_type == 'answer') {

    // If marked correct (not found), mark it wrong
    if (!tempAnswers[test]?.[section]?.[passageNumber]?.['Answers'].includes(question)) {
      tempAnswers[test][section][passageNumber]['Answers'].push(event.target.parentNode.querySelectorAll("div")[0].innerHTML)
    }
    // If marked wrong, change it to correct
    else {
      tempAnswers[test][section][passageNumber]['Answers'].splice(getArrayIndex(event.target.parentNode.querySelectorAll("div")[0].innerHTML, tempAnswers[test][section][passageNumber]['Answers']),1)
    }

    openForm('testAnswersPopup');
  }
  // Check to see if we're marking a question as a guess
  else if (event.target.parentNode.className.includes('input-row-center') && mark_type == 'guess') {

    const guessEndPoints = tempAnswers[test]?.[section]?.['GuessEndPoints'] ?? [];

    // Check to see if the question is an endpoint
    if (guessEndPoints.includes(question)) {
      console.log(question, "is a guess end point... I need to remove something")
    }
    // Not an end point
    else {
      // Check to see if we are setting a start point
      if (guess_start == 0) {


        // check to see if the point is in the middle of two points
        let is_in_the_middle = false;
        for (let i = 0; i < (guessEndPoints.length / 2); i += 2) {
          if (parseInt(question) > parseInt(guessEndPoints[i]) && parseInt(question) < parseInt(guessEndPoints[i + 1])) {
            is_in_the_middle = true;
            break;
          }
        }

        if (is_in_the_middle == false) {
          // mark the start and reset the end
          guess_start = question;
          guess_end = 0;

          // Check to see if there is a guess after this one
          let are_more_guesses = false;
          for (let i = 0; i < guessEndPoints.length; i++) {
            if (parseInt(guessEndPoints[i]) > parseInt(question)) {
              are_more_guesses = true;
              break;
            }
          }

          // If there is a guess after this one, add this point twice
          if (are_more_guesses == true) {
            tempAnswers[test][section]['GuessEndPoints'].push(guess_start)
            tempAnswers[test][section]['GuessEndPoints'].push(guess_start)
          }
          // If there isn't a guess after this one, add this point once
          else {
            if (tempAnswers[test]?.[section]?.['GuessEndPoints'] == undefined) {
              setObjectValue([test, section, 'GuessEndPoints'], [], tempAnswers);
            }
            tempAnswers[test][section]['GuessEndPoints'].push(guess_start)
          }

          // Sort the guessed questions array
          try {
            tempAnswers[test][section]['GuessEndPoints'].sort(function(a, b){return a-b})
          }
          catch {
            2 + 2;
          }

        }

      }
      // Setting an end point (possibly)
      else {

        // check to see if the point is in the middle of two points
        let is_in_the_middle = false;
        for (let i = 0; i < (guessEndPoints.length / 2); i += 2) {
          if (parseInt(question) > parseInt(guessEndPoints[i]) && parseInt(question) < parseInt(guessEndPoints[i + 1])) {
            is_in_the_middle = true;
            break;
          }
        }


        // if it isn't in the middle of two points, check to see if there are points in between this start and end
        if (is_in_the_middle == false) {

          // mark the end
          guess_end = question;

          // Check to see how many times the question can be found
          let count = 0;
          for (let i = 0; i < guessEndPoints.length; i++) {
            if (guessEndPoints[i] == guess_start) {
              count++;
            }
          }

          // end point equals start point
          if (guess_end == guess_start) {

            // If it is only there once, add it again
            if (count == 1) {
              tempAnswers[test][section]['GuessEndPoints'].push(guess_end)
            }
          
          }
          // New end point
          else {

            // Check to see if there are points in between
            const num_guesses = guessEndPoints.length;
            for (let i = 0; i < num_guesses; i++) {

              // if there are points in between, remove them
              if (parseInt(guess_start) < parseInt(guessEndPoints[num_guesses - i - 1]) && parseInt(guess_end) > parseInt(guessEndPoints[num_guesses - i - 1])) {
                tempAnswers[test][section]['GuessEndPoints'].splice(getArrayIndex(guessEndPoints[num_guesses - i - 1], tempAnswers[test][section]['GuessEndPoints']),1)
              }

            }

            // Remove the duplicate guess_start value if needed
            if (count == 2) {
              tempAnswers[test][section]['GuessEndPoints'].splice(getArrayIndex(guess_start, tempAnswers[test][section]['GuessEndPoints']),1)
            }

            // Add the end point
            tempAnswers[test][section]['GuessEndPoints'].push(guess_end)
          }

          // Sort the guessed questions array
          try {
            tempAnswers[test][section]['GuessEndPoints'].sort(function(a, b){return a-b})
          }
          catch {
            2 + 2;
          }

          // reset the start
          guess_start = 0;

        }

      }
    }

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
