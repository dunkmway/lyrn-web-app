import app from "./_firebase";
import { getFirestore, getDoc, setDoc, updateDoc, doc } from "firebase/firestore"

const db = getFirestore(app);

export default class Timeline {
  constructor(id) {
    this.id = id;
    this.isLoaded = false;

    this.timeline = [];
  }

  async load() {
    const timelineDoc = await getDoc(doc(db, 'ACT-Assignment-Timelines', this.id));
    if (timelineDoc.exists()) {
      // bring in the data
      this.timeline = timelineDoc.data().timeline
    } else {
      // generate the document
      await setDoc(doc(db, 'ACT-Assignment-Timelines', this.id), {
        timeline: []
      })
    }
    
    this.isLoaded = true;
  }

  async update() {
    await updateDoc(doc(db, 'ACT-Assignment-Timelines', this.id), {
      timeline: this.timeline
    })
  }

  add(questionID, type, data) {
    this.timeline.push({
      question: questionID,
      type,
      data,
      time: new Date()
    });
  }

  getAnswer(questionID) {
    for (let i = this.timeline.length - 1; i > -1; i--) {
      if (this.timeline[i].question === questionID && this.timeline[i].type === 'answer') {
        return this.timeline[i].data;
      }
    }
    return null;
  }

  getFlag(questionID) {
    for (let i = this.timeline.length - 1; i > -1; i--) {
      if (this.timeline[i].question === questionID && this.timeline[i].type === 'flag') {
        return this.timeline[i].data;
      }
    }
    return false;
  }

  getTotalTime(questionID) {
    let totalTime = 0;

    let previousTime = null;
    for (let i = 0; i < this.timeline.length; i++) {
      // find the edges of the question
      if (this.timeline[i].question === questionID && previousTime === null) {
        previousTime = this.timeline[i].time.toDate().getTime();
      }
      if (this.timeline[i].question !== questionID && previousTime !== null) {
        totalTime += this.timeline[i].time.toDate().getTime() - previousTime;
        previousTime = null;
      }
    }

    return totalTime;
  }

  getAnswerList(questionID) {
    return this.timeline
    .filter(event => {
      return event.question === questionID && event.type === 'answer';
    })
    .map(event => event.data);
  }

  getWasFlagged(questionID) {
    return this.timeline.some(event => event.question === questionID && event.type === 'flag')
  }
}