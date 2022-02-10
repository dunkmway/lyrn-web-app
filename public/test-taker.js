// I do this here so that I don't have analytics
const firebaseConfig = {
  apiKey: "AIzaSyD8GSMZzjbubQ7AGcQKIV-enpDYpz_07mo",
  authDomain: "lyrn-web-app.firebaseapp.com",
  projectId: "lyrn-web-app",
  storageBucket: "lyrn-web-app.appspot.com",
  messagingSenderId: "80732012862",
  appId: "1:80732012862:web:22ffb978c80a1d2a0f2c6f",
  measurementId: "G-F2QZT3W2CX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const ODD_ANSWERS = ['A', 'B', 'C', 'D', 'E'];
const EVEN_ANSWERS = ['F', 'G', 'H', 'J', 'K'];
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/**
 * This will cause MathJax to look for unprocessed mathematics on the page and typeset it
 */
function resetMathJax() {
  MathJax.typeset();
  document.querySelectorAll('.MathJax').forEach((math) => {
    math.removeAttribute('tabindex');
  })
}


function changeAccentColor(sectionName) {
  document.querySelector(':root').style.setProperty('--accent-color', `var(--${sectionName}-color)`)
}

function changePassageColumns(sectionName) {
  document.querySelector(':root').style.setProperty('--passage-columns', `var(--${sectionName}-passage-columns)`)
}

function openSelectorPanel() {
  document.querySelector('.main .panels .selector').classList.add('open');
}

function closeSelectorPanel() {
  document.querySelector('.main .panels .selector').classList.remove('open');
}

/**
 * 
 * @param {string} test The test ID (ie. B05)
 * @param {string} section The section (Possible Values: english, math, reading, science)
 * @param {number} passage The passage number
 * @returns {Promise} Firebase Document
 */
 async function getPassageDocument(test, section, passage) {
	// get the passage document
	const passageQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'passage')
	.where('test', '==', test.toUpperCase())
	.where('section', '==', section.toLowerCase())
	.where('passageNumber', '==', parseInt(passage))
  .limit(1)
  .get();

  return passageQuery.docs[0];
}

/**
 * This will grab a question document from firebase
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (Possible Values: english, math, reading, science)
 * @param {number} question Question Number
 * @returns {Promise} Firebase Document
 */
 async function getQuestionDocument(test, section, question) {

	// get the question document
	const questionQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test.toUpperCase())
	.where('section', '==', section.toLowerCase())
	.where('problem', '==', parseInt(question))
  .limit(1)
  .get();

  return questionQuery.docs[0];
}

function renderPassage(passageData) {
  document.getElementById('sectionTitle').innerHTML = passageData.section.toUpperCase();
  document.getElementById('passageNumber').innerHTML = ROMAN_NUMERALS[passageData.passageNumber - 1];

  document.getElementById('passageTitle-A').innerHTML = passageData.title || '';
  document.getElementById('passagePreText-A').innerHTML = passageData.preText || '';
  document.getElementById('passageText-A').innerHTML = passageData.passageText || '';
  document.getElementById('passageReference-A').innerHTML = passageData.reference || '';

  document.getElementById('passageTitle-B').innerHTML = passageData.ABData.title || '';
  document.getElementById('passagePreText-B').innerHTML = passageData.ABData.preText || '';
  document.getElementById('passageText-B').innerHTML = passageData.ABData.passageText || '';
  document.getElementById('passageReference-B').innerHTML = passageData.ABData.reference || '';

}

function renderQuestion(questionData) {
  document.getElementById('questionNumber').textContent = questionData.problem;
  document.getElementById('questionText').innerHTML = questionData.questionText;

  const questionInText = document.querySelector(`.passage-container span[data-question="${questionData.problem}"]`);
  if (questionInText) {
    questionInText.classList.add('highlighted');
  }

  const choiceWrapper = document.getElementById('questionChoices');
  removeAllChildNodes(choiceWrapper);

  questionData.answers.forEach((choice, index) => {
    const choiceLetter = questionData.problem % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index];

    const choiceElem = document.createElement('div');
    choiceElem.classList.add('choice');
    choiceElem.innerHTML = `<input type="radio" name="choice" id="choice_${index}" value="${choiceLetter}"><label for="choice_${index}"><p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}</label>`

    choiceWrapper.appendChild(choiceElem);
  })

}

function renderError(errorMsg) {
  customConfirm(errorMsg, '', 'OK', () => {}, () => {});
}

async function setQuestion(test, section, question) {
  changeAccentColor(section)
  changePassageColumns(section)

  const questionDoc = await getQuestionDocument(test, section, question);
  const questionData = questionDoc?.data();

  if (!questionData) {
    renderError('We are having an issue getting this question.');
    return;
  }
  console.log(questionData)

  const passage = questionData.passage;
  // if the question does have a passage
  if (passage != -1) {
    const passageDoc = await getPassageDocument(test, section, passage);
    const passageData = passageDoc?.data();

    if (!passageData) {
      renderError('We are having issues getting this passage for this question.');
      return;
    }
    console.log(passageData)

    renderPassage(passageData);
  }
  renderQuestion(questionData);

  resetMathJax();
  return;
}

async function testing() {
  // await setQuestion('D03', 'english', 20);
  await setQuestion('D05', 'reading', 9);
}

async function keypressTesting() {
  openSelectorPanel();
  await sleep(5000)
  closeSelectorPanel();
}

testing();

document.addEventListener('keypress', (e) => {
  if (e.key == 'Enter') {
    keypressTesting();
  }
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}