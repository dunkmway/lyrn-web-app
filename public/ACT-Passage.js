class Passage {
  constructor(id) {
    this.id = id;
    this.isLoaded = false;

    this.content = null;
    this.code = null;
    this.section = null;
    this.test = null;
  }

  async load() {
    const doc = await firebase.firestore().collection('ACT-Passage-Data').doc(this.id).get();
    for (const key in doc.data()) {
      this[key] = doc.data()[key]
    }

    this.isLoaded = true;
  }

  unload() {
    this.content = null;
    this.code = null;
    this.section = null;
    this.test = null;

    this.isLoaded = false;
  }

  show(question = null) {
    const content = document.getElementById('passageContent');
    removeAllChildNodes(content);
    content.innerHTML = this.content;

    content.querySelectorAll(`span[data-question]`).forEach(question => { question.classList.remove('highlighted') });
    content.querySelectorAll(`span[data-question="${question}"]`).forEach(question => { question.classList.add('highlighted'); });
    document.querySelector('.main .panels .passage').classList.remove('hide');
  }

  hide() {
    const content = document.getElementById('passageContent')
    removeAllChildNodes(content);
    document.querySelector('.main .panels .passage').classList.add('hide');
  }
}