class Assignment {
  constructor(doc) {
    const data = doc.data();

    // from the doc
    this.id = doc.id;
    this.ref = doc.ref;
    this.open = data.open;
    this.close = data.close;
    this.status = data.status;
    this.student = data.student;
    this.questions = data.questions ?? [];
    this.time = data.time;
    this.sectionCode = data.sectionCode;
    this.type = data.type;
    this.topicProportions = data.topicProportions;
    this.startedAt = data.startedAt;
    this.submittedAt = data.submittedAt;

    // objects
    this.questionObjects = null;
    this.passageObjects = null;

    // dom elements
    this.wrapper = document.createElement('div');
    this.statusIndicator = document.createElement('p');

    // event listeners
    this.wrapper.addEventListener('click', () => { this.assignmentClicked() })

    // timeouts
    this.openTimeout = null;
    this.closeTimeout = null;
    this.submitTimeout = null;
    this.resetTimers();

    // state
    this.isStarted = false;
    this.currentQuestion = null;
  }

  update(newData) {
    // update the doc data
    for (let key in newData) {
      this[key] = newData[key]
    }

    // reset the timers
    this.resetTimers();

    // if this assignment has been started
    if (this.isStarted) {
      // update the selector
      console.log('FIXME: implement update selector')

    }
  }

  resetTimers() {
    // open timer - only new assignments
    if (this.openTimeout) {
      this.openTimeout.cleanUp();
      this.openTimeout = null;
    }
    if (this.status === 'new') {
      this.openTimeout = new Timer(this.open.toDate(), () => {
        this.openTimeout.cleanUp();
        this.openTimeout = null;
        showAssignments();
      })
    }

    if (this.closeTimeout) {
      this.closeTimeout.cleanUp();
      this.closeTimeout = null;
    }
    if (this.status === 'new') {
      this.closeTimeout = new Timer(this.close.toDate(), async () => {
        this.closeTimeout.cleanUp();
        this.closeTimeout = null;
        await this.omit();
        // no need to re show the assignment since assignment doc is being updated
        // the listener will catch the update and re show
      })
    }

    if (this.submitTimeout) {
      this.submitTimeout.cleanUp();
      this.submitTimeout = null;
    }
    if (this.status === 'started' && this.time) {
      this.submitTimeout = new Timer(new Date(this.startedAt.toDate().getTime() + this.time), async () => {
        this.submitTimeout.cleanUp();
        this.submitTimeout = null;
        await this.submit();
        // no need to re show the assignment since assignment doc is being updated
        // the listener will catch the update and re show
      })
      this.submitTimeout.attach(this.statusIndicator);
    }
  }

  show() {
    // remove the old child
    removeAllChildNodes(this.wrapper);

    // general style
    this.wrapper.classList.add('assignment', 'box', `${this.sectionCode}-background`);
    
    // hide the assignments that haven't opened yet
    if (this.open.toDate().getTime() > new Date().getTime()) {
      this.wrapper.classList.add('hide')
    } else {
      this.wrapper.classList.remove('hide')
    }

    // append the element to the appropriate container and give it the appropriate inner html
    switch (this.status) {
      case 'new':
        this.statusIndicator.classList.remove('spinner');
        this.statusIndicator.textContent = convertFromDateInt(this.close.toDate().getTime()).shortDateTime;
        document.getElementById('newAssignments').appendChild(this.wrapper);
        break;
      case 'started':
        this.statusIndicator.classList.remove('spinner');
        if (this.time) {
          this.submitTimeout.show();
        } else {
          this.statusIndicator.textContent = '--:--'
        }
        document.getElementById('startedAssignments').appendChild(this.wrapper);
        break;
      case 'submitted':
        this.statusIndicator.textContent = '';
        this.statusIndicator.classList.add('spinner');
        document.getElementById('previousAssignments').appendChild(this.wrapper);
        break;
      case 'graded':
        this.statusIndicator.classList.remove('spinner');
        this.statusIndicator.textContent = this.scaledScore ? this.scaledScore : (`${this.score}/${this.questions.length}`);
        document.getElementById('previousAssignments').appendChild(this.wrapper);
        break;
      case 'omitted':
        this.statusIndicator.classList.remove('spinner');
        this.statusIndicator.textContent = 'omitted';
        document.getElementById('previousAssignments').appendChild(this.wrapper);
        break;
      default:
        throw 'invalid status';
    }
    show_helper(
      this.wrapper,
      (this.time ? Math.ceil((this.time / 60000)) : null),
      (!this.topicProportions ? this.questions.length : null),
      this.statusIndicator
    )
  }

  omit() {
    // the assignment is closed if it is a new assignment past it's close date
    // set the status to omitted
    return this.ref.update({ status: 'omitted' })
  }

  submit() {
    if (this.isStarted) {
      this.end();
    }
    // the assignment is closed if it is a new assignment past it's close date
    // set the status to omitted
    return this.ref.update({
      status: 'submitted',
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
  }

  assignmentClicked() {
    switch (this.status) {
      case 'new':
        customConfirm(
          'Are you sure you are ready to start this assignment?',
          'NO',
          'YES',
          () => {},
          () => { this.start() }
        )
        break;
      case 'started':
        this.start()
        break;
      case 'submitted':
        customConfirm(
          'This assignment is still being graded. Try again later.',
          '',
          'OK',
          () => {},
          () => {}
        )
        break;
      case 'graded':
        this.review();
        break;
      case 'omitted':
        console.log('implement omitted')
        break;
      default:
        throw 'invalid status';
    }
  }

  async start() {
    // change the state
    this.isStarted = true;
    
    // construct the question objects
    this.questionObjects = this.questions.map((id, index) => new Question(id, index));
    // load all docs for the questions and passages
    await Promise.all(this.questionObjects.map(async (question) => {
      await question.load();
    }));

    // get the answer timeline or create it if it doesn't exist


    // now move into the main section
    changeSection('main');
    changeAccentColor(this.sectionCode);
    changePassageColumns(this.sectionCode);
    document.getElementById('previousBtn').classList.add('hide');

    // show the first question
    await this.startQuestion(0);

    console.log('FIXME: uncomment below me. update the doc to status of started')

    // // set the event to a started state
    // await this.ref.update({
    //   status: 'started',
    //   startedAt: firebase.firestore.FieldValue.serverTimestamp()
    // })
  }

  end() {
    this.isStarted = false;

    changeSection('landing');
    changeAccentColor('default');
    changePassageColumns('default');

    this.currentQuestion.hide();
    if (this.currentQuestion.passage) {
      this.currentQuestion.passage.hide();
      this.currentQuestion.passage = null;
    }
    this.currentQuestion = null;
  }

  async startQuestion(index) {
    if (index > this.questionObjects.length - 1) {
      index = this.questionObjects.length - 1
    }
    if (index < 0) {
      index = 0;
    }

    // handle the next and previous buttons
    const nextBtn = document.getElementById('nextBtn');
    const previousBtn = document.getElementById('previousBtn')

    if (index === this.questionObjects.length - 1) {
      nextBtn.classList.add('hide');
    } else {
      nextBtn.classList.remove('hide');
    }

    if (index === 0) {
      previousBtn.classList.add('hide');
    } else {
      previousBtn.classList.remove('hide');
    }

    // hide the old question
    if (this.currentQuestion) {
      this.currentQuestion.hide();
      if (this.currentQuestion.passage) {
        this.currentQuestion.passage.hide();
      }
    }

    // show the new question
    this.currentQuestion = this.questionObjects[index];
    this.currentQuestion.show()
    if (this.currentQuestion.passage) {
      this.currentQuestion.passage.show();
    }
    resetMathJax();

    // see if the next question needs to be loaded/generated
    if ((index == this.questionObjects.length - 1) && this.topicProportions) {
      const newQuestions = await getNewDynamicQuestions_helper(this.topicProportions, this.questionObjects);

      // add the new question to the question objects
      await Promise.all(newQuestions.map(async (id, sumIndex) => {
        const newQuestion = new Question(id, index + sumIndex + 1);
        await newQuestion.load();
        this.questionObjects.push(newQuestion);
      }));

      // start this question again to update the view
      this.startQuestion(index)

      console.log('new questions', newQuestions)
      
      // save this new question to the assignment
      await this.ref.update({
        questions: this.questions.concat(newQuestions)
      })
    }
  }

  

  review() {
    console.log('implement review')
  }
}

/**
 * helps to show the assignment by appending a child to the assignment wrapper
 * @param {Element} parent the parent element to append this child to
 * @param {Number} minutes (optional) number of minutes to show
 * @param {Number} numQuestions (optional) number of questions to show
 * @param {Element} statusIndicatorElement dom element to show for the status indicator
 */
function show_helper(parent, minutes, numQuestions, statusIndicatorElement) {
  const leftDiv = document.createElement('div');
  const rightDiv = document.createElement('div');

  leftDiv.classList.add('flex-row', 'align-center');
  leftDiv.innerHTML = `
  ${minutes ? 
    (
      `${STOPWATCH_SVG}
      <p>
        ${minutes} min${minutes === 1 ? '' : 's'}
      </p>`
    ) : ''
  }
  ${numQuestions ? 
    (
      `${MINUS_BOX_SVG}
      <p>
        ${numQuestions} question${numQuestions === 1 ? '' : 's'}
      </p>`
    ) : ''
  }
  ${!minutes && !numQuestions ?
    (
      `${REFRESH_SVG}
      <p>
        auto generated
      </p>`
    )
    : ''
  }
  `
  rightDiv.classList.add('flex-row', 'align-center');
  rightDiv.appendChild(statusIndicatorElement);

  parent.appendChild(leftDiv);
  parent.appendChild(rightDiv);
}

async function getNewDynamicQuestions_helper(topicProportions, questionObjects) {
  let questionsByTopics = await getQuestionsByTopics_helper(Object.keys(topicProportions));
  // remove all of the already assigned questions
  for (let topic in questionsByTopics) {
    questionsByTopics[topic] = questionsByTopics[topic].map(group => group.filter(question => !assigned_questions.includes(question)));
  }

  // make sure we have enough questions in all topics to actually generate another question
  // if not don't get another question
  const totalQuestions = Object.keys(questionsByTopics).reduce((prev, curr) => prev + questionsByTopics[curr].flat().length, 0);
  if (totalQuestions > 0) {
    // find the topic to assign next based on target proportions
    const actualTopicProportions = getActualQuestionProportions_helper(questionObjects, Object.keys(topicProportions));
    let targetTopicProportions = topicProportions;
    let targetSum = Object.values(topicProportions).reduce((prev, curr) => prev + curr);
    for (const topic in targetTopicProportions) {
      targetTopicProportions[topic] = targetTopicProportions[topic] / targetSum;
    }

    // get the topics and their difference in proportion into and array and sort from smallest to largest
    let diffTopicProportions = [];
    for (let topic in actualTopicProportions) {
      diffTopicProportions.push({
        topic,
        diff: actualTopicProportions[topic] - targetTopicProportions[topic]
      });
    }
    diffTopicProportions.sort((a,b) => a.diff - b.diff);

    console.log('actual', actualTopicProportions)
    console.log('target', targetTopicProportions)
    console.log('diff', diffTopicProportions)

    // the new question should be the first topic that has questions from the diff array
    let newQuestions = null;
    for (const { topic } of diffTopicProportions) {
      if (questionsByTopics[topic].length > 0) {
        const index = randomInt(0, questionsByTopics[topic].length)
        newQuestions = questionsByTopics[topic][index]
        console.log('new question topic', topic)
        break;
      }
    }

    return newQuestions;
  }
}

/**
 * get an object of questions groups per topic
 * @param {string[]} topics topic ids
 * @returns {Promise<Object.<string, string[][]>>} object containing questions groups per topic
 */
 async function getQuestionsByTopics_helper(topics) {
  const questionArray = await Promise.all(topics.map(async (topic) => {
    const topicQuery = await firebase.firestore()
    .collection('ACT-Question-Data')
    .where('topic', '==', topic)
    .where('isQuestionBank', '==', true)
    .get()

    let questionDocs = topicQuery.docs;
    let questionIDs = [];
    // go through the topicDocs and find groups of questions if applicable
    while (questionDocs.length > 0) {
      const currentDoc = questionDocs[0];
      let groupedQuestionIDs;
      // if the question is grouped
      if (currentDoc.data().isGroupedByPassage) {
        // get the other question that are grouped with this question
        const commonPassage = currentDoc.data().passage;
        const groupedQuestionsDocs = questionDocs.filter(doc => doc.data().passage == commonPassage);
        groupedQuestionIDs = groupedQuestionsDocs.map(doc => doc.id);
      }
      else {
        // just pass this question id in
        groupedQuestionIDs = [currentDoc.id];
      }

      // add this grouping into the master copy and remove the group from the docs
      questionIDs.push(groupedQuestionIDs);
      groupedQuestionIDs.forEach(id => {
        questionDocs.splice(questionDocs.findIndex(doc => id == doc.id), 1)
      })
    }

    return questionIDs
  }))

  return topics.reduce((prev, curr, index) => {
    prev[curr] = questionArray[index]
    return prev
  }, {})
}

/**
 * calculate the actual topic proportions of the current assignment
 * @param {Questions[]} questions array of current question objects
 * @param {String[]} topics array of topic ids
 * @returns {Object.<string, number>} object with the topics and their proportions
 */
function getActualQuestionProportions_helper(questions, topics) {
  let initialTopics = {};
  for (const topic of topics) {
    initialTopics[topic] = 0;
  }

  let topicCount = questions.reduce((prev, curr) => {
    prev[curr.topic]++;
    return prev;
  }, initialTopics)

  for (const topic in topicCount) {
    topicCount[topic] =  topicCount[topic] / questions.length;
  }

  return topicCount;
}

/**
 * 
 * @param {Number} min lowerbound of random int (inclusive)
 * @param {Number} max upperbound of random int (exclusive)
 * @returns {Number} random int in range [min, max)
 */
 function randomInt(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number') throw 'min and max must be numbers'
  if (min > max) throw 'min must be less than the max'
  return Math.floor((Math.random() * (max - min)) + min)
}