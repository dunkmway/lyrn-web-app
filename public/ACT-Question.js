class Question {
  constructor(id, pos, assignmentTimeline) {
    this.id = id;
    this.pos = pos;
    this.assignmentTimeline = assignmentTimeline;
    this.isLoaded = false;

    this.answer = null;
    this.choices = null;
    this.content = null;
    this.isGroupedByPassage = null;
    this.isQuestionBank = null;
    this.passage = null;
    this.section = null;
    this.test = null;
    this.topic = null;

    this.selectorInput = document.createElement('input');
    this.selectorLabel = document.createElement('label');
  }

  async load() {
    const doc = await firebase.firestore().collection('ACT-Question-Data').doc(this.id).get();
    for (const key in doc.data()) {
      this[key] = doc.data()[key]
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
    this.isGroupedByPassage = null;
    this.isQuestionBank = null;
    this.passage = null;
    this.section = null;
    this.test = null;
    this.topic = null;

    this.isLoaded = false;
  }

  show() {
    const checkedChoiceIndex = this.assignmentTimeline.getAnswer(this.id);
    const isFlagged = this.assignmentTimeline.getFlag(this.id);

    // show the question number
    document.getElementById('questionNumber').textContent = (this.pos + 1).toString();
    // show the question content
    document.getElementById('questionContent').innerHTML = this.content;
    //determine if the flag should be shown
    document.getElementById('questionFlag').checked = isFlagged;
    // enable the flag
    document.getElementById('questionFlag').disabled = false;

    // remove the old choices and add in the new ones
    const questionChoices = document.getElementById('questionChoices');
    removeAllChildNodes(questionChoices);

    const ODD_ANSWERS = ['A', 'B', 'C', 'D', 'E'];
    const EVEN_ANSWERS = ['F', 'G', 'H', 'J', 'K'];

    this.choices.forEach((choice, index) => {
      const choiceElem = document.createElement('div');
      choiceElem.classList.add('choice');

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
      const choiceLetter = ((this.pos + 1) % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index]) ?? 'X';
      label.innerHTML = `<p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}`

      choiceElem.appendChild(input);
      choiceElem.appendChild(label);

      questionChoices.appendChild(choiceElem);
    })

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

    document.querySelector('.main .panels .question').classList.add('hide');
  }

  review(showCorrectAnswer = false) {
    const checkedChoiceIndex = this.assignmentTimeline.getAnswer(this.id);
    const isFlagged = this.assignmentTimeline.getFlag(this.id);

    // show the question number
    document.getElementById('questionNumber').textContent = (this.pos + 1).toString();
    // show the question content
    document.getElementById('questionContent').innerHTML = this.content;
    //determine if the flag should be shown
    document.getElementById('questionFlag').checked = isFlagged;
    // disable the flag
    document.getElementById('questionFlag').disabled = false;

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
      input.disabled = true;

      const label = document.createElement('label');
      label.setAttribute('for', `choice_${index}`);
      label.classList.add('flex-row');
      const choiceLetter = ((this.pos + 1) % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index]) ?? 'X';
      label.innerHTML = `<p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}`

      choiceElem.appendChild(input);
      choiceElem.appendChild(label);

      questionChoices.appendChild(choiceElem);
    })

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
      Question ${this.pos + 1}
      <span>${(showWrong && (answer != this.answer)) ? CROSS_SVG : ''}</span>
    `
  }

  setupSelector(clickCallback, ...args) {
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
    this.assignmentTimeline.add(this.id, 'answer', index);
    this.renderSelector();
    await this.assignmentTimeline.update();
  }

  async flagToggled(isFlagged) {
    this.assignmentTimeline.add(this.id, 'flag', isFlagged);
    this.renderSelector();
    await this.assignmentTimeline.update();
  }

}