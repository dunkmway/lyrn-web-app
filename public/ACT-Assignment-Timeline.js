class Timeline {
  constructor(id) {
    this.id = id;
    this.isLoaded = false;

    this.timeline = [];
  }

  async load() {
    const doc = await firebase.firestore().collection('ACT-Assignment-Timelines').doc(this.id).get();
    if (doc.exists) {
      // bring in the data
      this.timeline = doc.data().timeline
    } else {
      // generate the document
      await firebase.firestore().collection('ACT-Assignment-Timelines').doc(this.id).set({
        timeline: []
      })
    }
    
    this.isLoaded = true;
  }

  async update() {
    await firebase.firestore().collection('ACT-Assignment-Timelines').doc(this.id).update({
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
}