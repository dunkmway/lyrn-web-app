
// Submit chat message
document.getElementById("generalStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general'));
document.getElementById("englishStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'english'));
document.getElementById("mathStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'math'));
document.getElementById("readingStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'reading'));
document.getElementById("scienceStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'science'));

// Listen for wrong answers
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
    if (location.className.includes('input-row-center')) {

      // If marked correct (not found), mark it wrong
      if (test_answers_grading[test][section]['questions'][question - 1]['isWrong'] == false) {
        test_answers_grading[test][section]['questions'][question - 1]['isWrong'] = true
      }
      else {
        test_answers_grading[test][section]['questions'][question - 1]['isWrong'] = false
      }

      swapTestForm(test, section, passageNumber)
    }
  }
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
