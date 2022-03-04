
// Submit chat message
document.getElementById("generalStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'general'));
document.getElementById("englishStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'english'));
document.getElementById("mathStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'math'));
document.getElementById("readingStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'reading'));
document.getElementById("scienceStudentMessagesInput").addEventListener('keydown', (event) => submitStudentMessage(event, CURRENT_STUDENT_UID, CURRENT_STUDENT_TYPE, 'science'));

let printTest = document.getElementById("printTest")
printTest.addEventListener('keydown', (event) => {
  if (event.repeat) {return};
  if (!event.ctrlKey && event.key == "Enter") {
    event.preventDefault();

    //separate the test from the section
    const value = printTest.value;
    if (!value) { return }
    const test = value.split(' ')[0].toUpperCase();
    const section = value.split(' ')[1];
    if (section) {
      section.toLowerCase();
      openTest(test, section)
    }
    else {
      openTest(test);
    }
    printTest.value = ''
  }
});

// Listen for wrong answers (Homeworks)
let popupAnswers = document.getElementById("passage")
popupAnswers.addEventListener('click', function (event) {

  if (event.target.id != 'passage') {
    // Needed info
    const test = current_homework_test
    const section = current_homework_section
    const passageNumber = current_homework_passage_number

    // identify the question number
    let location = event.target.closest("div[id='passage'] > div")
    let question = location.getAttribute("data-question");

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

let sectionPassages = document.getElementsByClassName("passage");
for (let i = 0; i < sectionPassages.length; i++) {
  if (sectionPassages[i].id != 'passage') {
    sectionPassages[i].addEventListener('click', function (event) {

      if (!event.target.id.includes('Passage')) {
        //temp FIXME:
        if (true) {
          return
        }
        // Needed info
        const test = current_practice_test
        const section = current_practice_section
        const passageNumber = current_practice_passage_number

        // identify the question number
        let location = event.target.closest("div[id$='Passage'] > div")
        let question = location.getAttribute("data-question");

        // Check to see if we're marking a question as wrong / correct
        if (location.className.includes('input-row-center')) {

          // Get the array location
          let questionLocation = test_answers_grading[test][section][passageNumber]['questions'].filter(function(val) {return val.question == question})[0]
          questionLocation = test_answers_grading[test][section][passageNumber]['questions'].indexOf(questionLocation)

          // If marked correct (not found), mark it wrong
          if (test_answers_grading[test][section][passageNumber]['questions'][questionLocation]?.['isWrong'] == false) {
            test_answers_grading[test][section][passageNumber]['questions'][questionLocation]['isWrong'] = true
          }
          else {
            test_answers_grading[test][section][passageNumber]['questions'][questionLocation]['isWrong'] = false
          }

          openPracticeTest(test, section, passageNumber)
        }
      }
    })
  }
}


let profileImage = document.getElementById('fileInput')
profileImage.addEventListener('change', function () {
  console.log("Changing Picture")
  updateProfilePic()
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
