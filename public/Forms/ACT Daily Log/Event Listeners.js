
// Submit chat message
document.getElementById("generalStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general'));
document.getElementById("englishStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'english'));
document.getElementById("mathStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'math'));
document.getElementById("readingStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'reading'));
document.getElementById("scienceStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'science'));

// Listen for wrong answers or guesses
let guess_start = 0;
let guess_end = 0;
let popupAnswers = document.getElementById("passage")
popupAnswers.addEventListener('click', function (event) {

  if (event.target.id != 'passage') {
    // Needed info
    const test = current_test
    const section = current_section
    const passageNumber = current_passage_number

    // identify the question number
    let question = undefined;
    let location = event.target.closest("div[id='passage'] > div")
    question = location.getAttribute("data-question");

    // Check to see if we're marking a question as wrong / correct
    if (location.className.includes('input-row-center') && mark_type == 'answer') {

      // If marked correct (not found), mark it wrong
      if (!tempAnswers[test]?.[section]?.[passageNumber]?.['Answers'].includes(question)) {
        tempAnswers[test][section][passageNumber]['Answers'].push(question)
      }
      // If marked wrong, change it to correct
      else {
        tempAnswers[test][section][passageNumber]['Answers'].splice(tempAnswers[test][section][passageNumber]['Answers'].indexOf(question), 1)
      }

      swapTestForm(test, section, passageNumber)
    }

    // Check to see if we're marking a question as a guess
    else if (location.className.includes('input-row-center') && mark_type == 'guess') {

      const guessEndPoints = tempAnswers[test]?.[section]?.['GuessEndPoints'] ?? [];

      // Check to see if the question is an endpoint
      if (guessEndPoints.includes(question)) {
        // marking only one question, (set it as the end point)
        if (guess_end == 0) {
          guess_end = question;

          // Check to see how many times the question can be found
          let count = 0;
          for (let i = 0; i < guessEndPoints.length; i++) {
            if (guessEndPoints[i] == guess_start) {
              count++;
            }
          }

          // Add the question a second time (if needed) to mark only this question
          if (count == 1) {
            tempAnswers[test][section]['GuessEndPoints'].push(guess_end)
          }

          guess_start = 0;
        }
        // Trying to remove the block / question
        else {
          const index = getArrayIndex(question, tempAnswers[test][section]['GuessEndPoints'])

          // Removing the last point
          if (index == tempAnswers[test][section]['GuessEndPoints'].length - 1) {
            if (tempAnswers[test][section]['GuessEndPoints'].length % 2 == 0) {
              tempAnswers[test][section]['GuessEndPoints'].splice(index - 1, 2)
            }
            else {
              tempAnswers[test][section]['GuessEndPoints'].splice(index, 1)
            }
          }
          else {
            if (index % 2 == 0) {
              tempAnswers[test][section]['GuessEndPoints'].splice(index, 2)
            }
            else {
              tempAnswers[test][section]['GuessEndPoints'].splice(index - 1, 2)
            }
          }
        }
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
              tempAnswers[test][section]['GuessEndPoints'].sort(function (a, b) { return a - b })
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
                  tempAnswers[test][section]['GuessEndPoints'].splice(getArrayIndex(guessEndPoints[num_guesses - i - 1], tempAnswers[test][section]['GuessEndPoints']), 1)
                }

              }

              // Remove the duplicate guess_start value if needed
              if (count == 2) {
                tempAnswers[test][section]['GuessEndPoints'].splice(getArrayIndex(guess_start, tempAnswers[test][section]['GuessEndPoints']), 1)
              }

              // Add the end point
              tempAnswers[test][section]['GuessEndPoints'].push(guess_end)
            }

            // Sort the guessed questions array
            try {
              tempAnswers[test][section]['GuessEndPoints'].sort(function (a, b) { return a - b })
            }
            catch {
              2 + 2;
            }

            // reset the start
            guess_start = 0;

          }

        }
      }

      swapTestForm(test, section, passageNumber)
    }
  }
})

// Close the popup if they click outside of it
testAnswersPopup = document.getElementById("testAnswersPopup")
testAnswersPopup.addEventListener('click', function(event) {
  // Get the id of the target
  const id = event.target.id;

  // Check to see if there is a parent
  let parentId = undefined;
  try {
    parentId = event.target.parentNode.id;
  }
  catch {
    parentId = undefined;
  }

  // Check to see if there is a double parent
  let doubleParentId = undefined;
  try {
    doubleParentId = event.target.parentNode.parentNode.id;
  }
  catch {
    doubleParentId = undefined;
  }

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
