import app from "./_firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore"

const db = getFirestore(app); 

export default class Passage {
  constructor(id) {
    this.id = id;
    this.isLoaded = false;

    this.content = null;
    this.code = null;
    this.section = null;
    this.test = null;
  }

  async load() {
    const passageDoc = await getDoc(doc(db, 'ACT-Passage-Data', this.id));
    for (const key in passageDoc.data()) {
      this[key] = passageDoc.data()[key]
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

  show(questionCode = null) {
    const content = document.getElementById('passageContent');
    removeAllChildNodes(content);
    content.innerHTML = this.content;

    content.querySelectorAll(`span[data-question]`).forEach(q => { q.classList.remove('highlighted') });

    if (questionCode) {
      content.querySelectorAll(`span[data-question="${questionCode}"]`).forEach(q => { q.classList.add('highlighted'); });
    }

    document.querySelector('.main .panels .passage').classList.remove('hide');
  }

  hide() {
    const content = document.getElementById('passageContent')
    removeAllChildNodes(content);
    document.querySelector('.main .panels .passage').classList.add('hide');
  }
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}