import app from "./_firebase";
import { getFirestore, getDoc, doc } from "firebase/firestore"
import { getAuth } from "firebase/auth";

import Timeline from "./_ACT-Assignment-Timeline";
import Passage from "./_ACT-Passage";
import { FLAG_SVG, CROSS_SVG } from "./_test-taker-svg";

const auth = getAuth(app);
const db = getFirestore(app);

export default class Question {
  constructor(id, index, pos, student, assignmentTimeline) {
    this.id = id;
    this.index = index;
    this.pos = pos;
    this.student = student;
    this.assignmentTimeline = assignmentTimeline;
    this.isLoaded = false;

    this.answer = null;
    this.choices = null;
    this.content = null;
    this.explanation = null;
    this.isGroupedByPassage = null;
    this.isQuestionBank = null;
    this.passage = null;
    this.section = null;
    this.test = null;
    this.topic = null;

    this.selectorInput = null;
    this.selectorLabel = null;
  }

  async load() {
    const questionDoc = await getDoc(doc(db, 'ACT-Question-Data', this.id));
    for (const key in questionDoc.data()) {
      this[key] = questionDoc.data()[key]
    }

    if (!this.topic) {
      this.topic = -1;
    }

    if (this.passage) {
      this.passage = new Passage(this.passage);
      await this.passage.load();
    }

    this.isLoaded = true;
  }

  unload() {
    this.answer = null;
    this.choices = null;
    this.content = null;
    this.explanation = null;
    this.isGroupedByPassage = null;
    this.isQuestionBank = null;
    this.passage = null;
    this.section = null;
    this.test = null;
    this.topic = null;

    this.isLoaded = false;
  }

  show(showCorrectAnswer = false) {
    const checkedChoiceIndex = this.assignmentTimeline.getAnswer(this.id);
    const isFlagged = this.assignmentTimeline.getFlag(this.id);

    // show the question number
    document.getElementById('questionNumber').textContent = (this.index + 1).toString();
    // show the question content
    document.getElementById('questionContent').innerHTML = this.content;
    //determine if the flag should be shown
    document.getElementById('questionFlag').checked = isFlagged;
    // enable the flag
    document.getElementById('questionFlag').disabled = false;
    // show the show answer toggle
    if (showCorrectAnswer) {
      const toggleHTML = `
      <label for="answerToggleInput" class="show-answer">Show answer</label>
      <label for="answerToggleInput" class="hide-answer">Hide answer</label>
      `
      document.getElementById('answerToggle').innerHTML = toggleHTML;
    }

    // remove the old choices and add in the new ones
    const questionChoices = document.getElementById('questionChoices');
    removeAllChildNodes(questionChoices);

    const ODD_ANSWERS = ['A', 'B', 'C', 'D', 'E'];
    const EVEN_ANSWERS = ['F', 'G', 'H', 'J', 'K'];

    this.choices.forEach((choice, index) => {
      const choiceElem = document.createElement('div');
      choiceElem.classList.add('choice');
      if (showCorrectAnswer && index === this.answer) {
        choiceElem.classList.add('correct');
      }

      const input = document.createElement('input');
      input.setAttribute('type', 'radio');
      input.setAttribute('name', 'choice');
      input.id = `choice_${index}`;
      if (checkedChoiceIndex === index) {
        input.checked = true;
      } else {
        input.checked = false;
      }
      input.addEventListener('change', () => {
        this.answerSelected(index);
      })

      const label = document.createElement('label');
      label.setAttribute('for', `choice_${index}`);
      label.classList.add('flex-row');
      const choiceLetter = ((this.index + 1) % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index]) ?? 'X';
      label.innerHTML = `<p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}`

      choiceElem.appendChild(input);
      choiceElem.appendChild(label);

      questionChoices.appendChild(choiceElem);
    })

    // select the question in the selector
    this.selectorInput.checked = true;

    document.querySelector('.main .panels .question').classList.remove('hide');
  }

  hide() {
    // remove the question number
    document.getElementById('questionNumber').textContent = '';
    // remove the question content
    removeAllChildNodes(document.getElementById('questionContent'));
    // remove the flag
    document.getElementById('questionFlag').checked = false;
    // disable the flag
    document.getElementById('questionFlag').disabled = true;
    // remove the choices
    removeAllChildNodes(document.getElementById('questionChoices'));
    // remove the show hide answer
    removeAllChildNodes(document.getElementById('answerToggle'));
    // untoggle the show hide answer
    document.getElementById('answerToggleInput').checked = false;
    // remove the explanation
    removeAllChildNodes(document.getElementById('questionExplanation'));
    // remove the details
    removeAllChildNodes(document.getElementById('questionDetails'));

    document.querySelector('.main .panels .question').classList.add('hide');
  }

  review(showCorrectAnswer = false, showDetails = false) {
    const ODD_ANSWERS = ['A', 'B', 'C', 'D', 'E'];
    const EVEN_ANSWERS = ['F', 'G', 'H', 'J', 'K'];

    const checkedChoiceIndex = this.assignmentTimeline.getAnswer(this.id);
    const isFlagged = this.assignmentTimeline.getFlag(this.id);

    // show the question number
    document.getElementById('questionNumber').textContent = (this.index + 1).toString();
    // show the question content
    document.getElementById('questionContent').innerHTML = this.content ?? '';
    // show the question explanation
    const explanationHTML = `
    <input type="checkbox" id="questionExplanationInput">
    <label for="questionExplanationInput" class="color-accent">Explanation</label>
    <div id="explanationWrapper">
      <div>
        ${this.explanation}
        <a href="/pricing?program=one-on-one" target="_blank">Need more help?</a>
      </div>
    </div>
    `
    document.getElementById('questionExplanation').innerHTML = this.explanation ? explanationHTML : '';
    // show the question details
    const time = this.assignmentTimeline.getTotalTime(this.id);
    const minutes = Math.floor(time / (1000 * 60));
    const seconds = Math.floor((time / 1000) % 60);

    const answerList = this.assignmentTimeline.getAnswerList(this.id)
    .map(index => (this.index + 1) % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index])
    .join(', ');

    const wasFlagged = this.assignmentTimeline.getWasFlagged(this.id) ? 'Yes' : 'No';

    const detailsHTML = `
    <p>Total time: ${minutes}:${seconds.toString().padStart(2, '0')}</p>
    <p>Answer history: ${answerList}</p>
    <p>Was Flagged: ${wasFlagged}</p>
    `
    document.getElementById('questionDetails').innerHTML = showDetails ? detailsHTML : ''
    //determine if the flag should be shown
    document.getElementById('questionFlag').checked = isFlagged;
    // disable the flag
    document.getElementById('questionFlag').disabled = true;
    // show the show answer toggle
    const toggleHTML = `
    <label for="answerToggleInput" class="show-answer">Show answer</label>
    <label for="answerToggleInput" class="hide-answer">Hide answer</label>
    `
    document.getElementById('answerToggle').innerHTML = toggleHTML;

    // remove the old choices and add in the new ones
    const questionChoices = document.getElementById('questionChoices');
    removeAllChildNodes(questionChoices);

    this.choices.forEach((choice, index) => {
      const choiceElem = document.createElement('div');
      choiceElem.classList.add('choice');
      if (showCorrectAnswer && index === this.answer) {
        choiceElem.classList.add('correct');
      }

      const input = document.createElement('input');
      input.setAttribute('type', 'radio');
      input.setAttribute('name', 'choice');
      input.id = `choice_${index}`;
      if (checkedChoiceIndex === index) {
        input.checked = true;
      } else {
        input.checked = false;
      }
      input.disabled = true;

      const label = document.createElement('label');
      label.setAttribute('for', `choice_${index}`);
      label.classList.add('flex-row');
      const choiceLetter = ((this.index + 1) % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index]) ?? 'X';
      label.innerHTML = `<p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}`

      choiceElem.appendChild(input);
      choiceElem.appendChild(label);

      questionChoices.appendChild(choiceElem);
    })

    // select the question in the selector
    this.selectorInput.checked = true;

    document.querySelector('.main .panels .question').classList.remove('hide');
  }

  renderSelector(showWrong = false) {
    // clear the wrapper
    removeAllChildNodes(this.selectorLabel)

    // render the selector
    const answer = this.assignmentTimeline.getAnswer(this.id);
    const isAnswered = answer != null;
    const isFlagged = this.assignmentTimeline.getFlag(this.id);
    this.selectorLabel.innerHTML = `
      <span class="${isAnswered ? 'answered' : ''} ${isFlagged ? 'flagged' : ''}">${FLAG_SVG}</span>
      Question ${this.index + 1}
      <span>${(showWrong && (answer != this.answer)) ? CROSS_SVG : ''}</span>
    `
  }

  setupSelector(clickCallback, ...args) {
    this.selectorInput = document.createElement('input');
    this.selectorLabel = document.createElement('label');
    
    this.selectorInput.setAttribute('id', 'selectorRadio-' + this.id);
    this.selectorInput.setAttribute('type', 'radio');
    this.selectorInput.setAttribute('name', 'questionSelector');

    this.selectorLabel.setAttribute('for', 'selectorRadio-' + this.id);
    this.selectorLabel.classList.add('selector-wrapper');
    this.selectorLabel.addEventListener('click', () => clickCallback(...args));

    document.getElementById('selectorContainer').appendChild(this.selectorInput);
    document.getElementById('selectorContainer').appendChild(this.selectorLabel);
  }

  async answerSelected(index) {
    if (this.student == auth.currentUser.uid) {
      this.assignmentTimeline.add(this.id, 'answer', index);
      this.renderSelector();
      await this.assignmentTimeline.update();
    }
  }

  async flagToggled(isFlagged) {
    if (this.student == auth.currentUser.uid) {
      this.assignmentTimeline.add(this.id, 'flag', isFlagged);
      this.renderSelector();
      await this.assignmentTimeline.update();
    }
  }

}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}