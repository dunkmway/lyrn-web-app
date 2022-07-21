class Question {
  constructor(id, pos) {
    this.id = id;
    this.pos = pos;
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

  show(checkedChoiceIndex, isFlagged) {
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
      // input.value = index;
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
      label.classList.add('flex-row', 'align-center');
      const choiceLetter = (this.pos + 1) % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index];
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

  answerSelected(index) {
    console.log('FIXME', 'answer index', index)
  }

  toggleFlag() {
    console.log('FIXME', 'flag')
  }

}