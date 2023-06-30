class Assignment {
  constructor(doc) {
    const data = doc.data();

    // from the doc
    this.id = doc.id;
    this.ref = doc.ref;
    this.data = data;
    
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
    this.score = data.score;
    this.scaledScore = data.scaledScore;
    this.scaledScoreSection = data.scaledScoreSection;

    // objects
    this.questionObjects = null;
    this.sortedQuestionsByTopic = null;
    this.timeline = null;

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
    this.isInReview = false;
    this.currentQuestion = null;
  }

  update(newData) {
    // update the doc data
    for (let key in newData) {
      this[key] = newData[key]
    }

    // reset the timers
    this.resetTimers();
  }

  resetTimers() {
    // open timer - only new assignments
    if (this.openTimeout) {
      this.openTimeout.cleanUp();
      this.openTimeout = null;
    }
    if (this.closeTimeout) {
      this.closeTimeout.cleanUp();
      this.closeTimeout = null;
    }
    if (this.submitTimeout) {
      this.submitTimeout.cleanUp();
      this.submitTimeout = null;
    }

    if (this.status === 'new') {
      // open timer
      this.openTimeout = this.open ? 
      new Timer(this.open.toDate(), () => {
        this.openTimeout.cleanUp();
        this.openTimeout = null;
        showAssignments();
      }) : null

      //close timer
      this.closeTimeout = this.close ?
      new Timer(this.close.toDate(), async () => {
        this.closeTimeout.cleanUp();
        this.closeTimeout = null;
        await this.omit();
      }) : null
    }

    if (this.status === 'started' && this.startedAt && this.time) {
      this.submitTimeout = new Timer(new Date(this.startedAt.toDate().getTime() + this.time), async () => {
        this.submitTimeout.cleanUp();
        this.submitTimeout = null;
        await this.submit();
        // no need to re show the assignment since assignment doc is being updated
        // the listener will catch the update and re show
      })
      this.submitTimeout.attach(this.statusIndicator);
      
      if (this.isStarted) {
        // show the time
        document.getElementById('assignmentTime').classList.remove('hide');
        this.submitTimeout.attach(document.getElementById('assignmentTime'));

        // and hide the submit button
        document.getElementById('assignmentSubmit').classList.add('hide');
      }
    }
  }

  show(parent) {
    // remove the old child
    removeAllChildNodes(this.wrapper);

    // general style
    this.wrapper.classList.add('assignment', 'box', `${this.sectionCode}-background`);
    
    // hide the assignments that haven't opened yet
    // if not a staff
    if (!STAFF_ROLES.includes(current_user_role)) {
      if (this.open && this.open.toDate().getTime() > new Date().getTime()) {
        this.wrapper.classList.add('hide')
      } else {
        this.wrapper.classList.remove('hide')
      }
    } else {
      // show the assignment according to it's open status
      if (this.open && this.open.toDate().getTime() > new Date().getTime()) {
        this.wrapper.classList.add('not-open')
      } else {
        this.wrapper.classList.remove('not-open')
      }
    }

    // append the element to the appropriate container and give it the appropriate inner html
    switch (this.status) {
      case 'new':
        this.statusIndicator.classList.remove('spinner');
        if (STAFF_ROLES.includes(current_user_role)) {
          this.statusIndicator.textContent =
          (this.open ? new Time(this.open.toDate().getTime()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}') : '')
          + ' — ' +
          (this.close ? new Time(this.close.toDate().getTime()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}') : '');
        } else {
          this.statusIndicator.textContent = this.close ? new Time(this.close.toDate().getTime()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}') : '';
        }
        parent.appendChild(this.wrapper);
        break;
      case 'started':
        this.statusIndicator.classList.remove('spinner');
        if (this.time && this.submitTimeout) {
          this.submitTimeout.show();
        } else {
          this.statusIndicator.textContent = '--:--'
        }
        parent.appendChild(this.wrapper);
        break;
      case 'submitted':
        this.statusIndicator.textContent = '';
        this.statusIndicator.classList.add('spinner');
        parent.appendChild(this.wrapper);
        break;
      case 'graded':
        this.statusIndicator.classList.remove('spinner');
        this.statusIndicator.textContent = `${this.scaledScore ?? ''} (${this.score} out of ${this.questions.length})`;
        parent.appendChild(this.wrapper);
        break;
      case 'omitted':
        this.statusIndicator.classList.remove('spinner');
        this.statusIndicator.textContent = 'omitted';
        parent.appendChild(this.wrapper);
        break;
      default:
        throw 'invalid status';
    }
    show_helper(
      this.wrapper,
      (this.time ? Math.ceil((this.time / 60000)) : null),
      (!this.topicProportions ? this.questions.length : null),
      this.statusIndicator,
      STAFF_ROLES.includes(current_user_role) && this.type,
      this.sectionCode
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

    return this.ref.update({
      status: 'submitted',
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
  }

  assignmentClicked() {
    switch (this.status) {
      case 'new':
        // if a staff member is starting someone else's assignment
        // sneeky start it
        if (STAFF_ROLES.includes(current_user_role) && this.student != current_user.uid) {
          this.start(true);
        } else {
          customConfirm(
            `Are you sure you are ready to start this ${this.sectionCode} assignment?`,
            'NO',
            'YES',
            () => {},
            () => { this.start() }
          )
        }
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

  // start the assignment
  // if we are sneeky then the assignment will display without moving into a "started" state in teh database
  async start(sneeky = false) {
    // show loading
    document.querySelector('.landing .loading').classList.add('active');

    // change the state
    this.isStarted = true;

    // construct the timeline
    this.timeline = new Timeline(this.id);
    // load the timeline (it will be created if it doesn't exists)
    await this.timeline.load();
    
    // construct the question objects
    this.questionObjects = this.questions.map((id, index) => new Question(id, index, this.timeline));
    // load all docs for the questions and passages
    await Promise.all(this.questionObjects.map(async (question) => {
      // load the quesiton from the db
      await question.load();
    }));

    // setup the selectors
    this.questionObjects.forEach(question => {
      // setup the selector
      question.setupSelector(() => this.startQuestion(question.pos));
      // render the selector
      question.renderSelector();
    })

    // setup the time / submit button
    if (this.submitTimeout) {
      // if there is a submit timeout show the time
      document.getElementById('assignmentTime').classList.remove('hide');
      this.submitTimeout.attach(document.getElementById('assignmentTime'));

      // and hide the submit button
      document.getElementById('assignmentSubmit').classList.add('hide');
    }
    else {
      // else hide the time
      document.getElementById('assignmentTime').classList.add('hide');

      // and show the submit button
      document.getElementById('assignmentSubmit').classList.remove('hide');
    }

    // close the selector
    document.querySelector('.main .panels .selector').classList.remove('open')

    // now move into the main section
    changeSection('main');
    changeAccentColor(this.sectionCode);
    changePassageColumns(this.sectionCode);
    document.getElementById('previousBtn').classList.add('hide');

    // show the first question
    await this.startQuestion(0);

    // scroll selector to top
    document.querySelector('.main .panels .selector-scroll').scrollTo(0,0);

    // set the event to a started state
    if (this.status === 'new' && !sneeky) {
      await this.ref.update({
        status: 'started',
        startedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
    }

    // remove loading
    document.querySelector('.landing .loading').classList.remove('active');
  }

  end() {
    this.isStarted = false;
    this.isInReview = false;

    changeSection('landing');
    changeAccentColor('default');
    changePassageColumns('default');

    this.currentQuestion.hide();
    if (this.currentQuestion.passage) {
      this.currentQuestion.passage.hide();
    }
    this.currentQuestion = null;

    // clean up
    this.questionObjects = null;
    this.sortedQuestionsByTopic = null;
    this.timeline = null;

    // clean up the selector
    removeAllChildNodes(document.getElementById('selectorContainer'));

    // clean up the time / submit button
    if (this.submitTimeout) {
      // if there is a submit timeout detach the timer
      this.submitTimeout.detach(document.getElementById('assignmentTime'));
    }
    // hide the time and submit
    document.getElementById('assignmentSubmit').classList.add('hide');
    document.getElementById('assignmentTime').classList.add('hide');
    document.querySelector('.main .panels .selector .top-container').classList.remove('hide');

    // close the selector
    document.querySelector('.main .panels .selector').classList.remove('open')
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

    // if the question that is being started was the same as the current question
    // stop here because the rest should only be run the first time the question is loaded in a row
    // this handles the re starting after we load dynamic questions
    if (this.currentQuestion?.id === this.questionObjects[index].id) return

    // hide the old question
    if (this.currentQuestion) {
      this.currentQuestion.hide();
      if (this.currentQuestion.passage) {
        this.currentQuestion.passage.hide();
      }
    }

    // show the new question
    this.currentQuestion = this.questionObjects[index];
    this.currentQuestion.show();
    if (this.currentQuestion.passage) {
      this.currentQuestion.passage.show(this.currentQuestion.code);
    }

    // select the new question in the selector
    this.currentQuestion.selectorInput.checked = true;

    resetMathJax();

    this.timeline.add(this.currentQuestion.id, 'start', true);
    await this.timeline.update();

    // see if the next question needs to be loaded/generated
    if ((index == this.questionObjects.length - 1) && this.topicProportions) {
      const newQuestions = await getNewDynamicQuestions_helper(this.topicProportions, this.questionObjects);
      if (newQuestions && newQuestions.length != 0) {
        // add the new question to the question objects
        await Promise.all(newQuestions.map(async (id, sumIndex) => {
          const newQuestion = new Question(id, index + sumIndex + 1, this.timeline);

          // setup the selector
          newQuestion.setupSelector(() => this.startQuestion(newQuestion.pos));
          // render the selector
          newQuestion.renderSelector();
          // add it to the question objects
          this.questionObjects.push(newQuestion);

          // load the new question
          await newQuestion.load();
        }));

        // start this question again to update the view
        this.startQuestion(index)
        
        // save this new question to the assignment
        await this.ref.update({
          questions: this.questions.concat(newQuestions)
        })
      }
    }
  }

  async review() {
    // show loading
    document.querySelector('.landing .loading').classList.add('active');

    // change the state
    this.isInReview = true;

    // construct the timeline
    this.timeline = new Timeline(this.id);
    // load the timeline (it will be created if it doesn't exists)
    await this.timeline.load();
    
    // construct the question objects
    this.questionObjects = this.questions.map((id, index) => new Question(id, index, this.timeline));
    // load all docs for the questions and passages
    await Promise.all(this.questionObjects.map(async (question) => {
      // load the quesiton from the db
      await question.load();
    }));

    // for review we want to sort the questions in the assignment in order of topic occurence
    // get all of the topics in this assignment
    const topics = this.questionObjects.reduce((prev, curr) => {
      if (!prev.includes(curr.topic)) {
        prev.push(curr.topic);
      }
      return prev;
    }, [])

    const topicDocs = await Promise.all(topics.map(topic => {
      if (topic !== -1) {
        return firebase.firestore().collection('ACT-Curriculum-Data').doc(topic).get()
      }
      else {
        return {
          id: -1,
          data: () => {
            return {
              code: 'No Topic',
              numQuestions: -1
            }
          }
        }
      }
      
    }));
    topicDocs.sort((a,b) => b.data().numQuestions - a.data().numQuestions);

    this.sortedQuestionsByTopic = topicDocs.map(topicDoc => {
      return {
        topic: topicDoc.data().code,
        questions: this.questionObjects.filter(question => question.topic === topicDoc.id)
      }
    })

    // setup the selectors
    let pos = 0;
    this.sortedQuestionsByTopic.forEach(topicGroup => {
      const topicName = document.createElement('p');
      topicName.classList.add('topic')
      topicName.textContent = topicGroup.topic;
      document.getElementById('selectorContainer').appendChild(topicName);

      topicGroup.questions.forEach(question => {
        // setup the selector
        question.setupSelector((index) => this.reviewQuestion(index), pos);
        // render the selector
        question.renderSelector(true);
        pos++;
      })
    })

    // hide the time and submit
    document.getElementById('assignmentSubmit').classList.add('hide');
    document.getElementById('assignmentTime').classList.add('hide');
    document.querySelector('.main .panels .selector .top-container').classList.add('hide');

    // close the selector
    document.querySelector('.main .panels .selector').classList.remove('open')

    // now move into the main section
    changeSection('main');
    changeAccentColor(this.sectionCode);
    changePassageColumns(this.sectionCode);
    document.getElementById('previousBtn').classList.add('hide');

    // show the first question
    await this.reviewQuestion(0);

    // remove loading
    document.querySelector('.landing .loading').classList.remove('active');
  }

  async reviewQuestion(index) {
    const flatSortedQuestionList = this.sortedQuestionsByTopic.reduce((prev, curr) => {
      prev = prev.concat(curr.questions);
      return prev
    }, []);
    if (index > flatSortedQuestionList.length - 1) {
      index = flatSortedQuestionList.length - 1
    }
    if (index < 0) {
      index = 0;
    }

    // handle the next and previous buttons
    const nextBtn = document.getElementById('nextBtn');
    const previousBtn = document.getElementById('previousBtn')

    if (index === flatSortedQuestionList.length - 1) {
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
    this.currentQuestion = flatSortedQuestionList[index];
    // this.currentQuestion.review(STAFF_ROLES.includes(current_user_role));
    this.currentQuestion.review(true);
    if (this.currentQuestion.passage) {
      this.currentQuestion.passage.show(this.currentQuestion.code);
    }

    // select the new question in the selector
    this.currentQuestion.selectorInput.checked = true;

    resetMathJax();
  }
}

/**
 * helps to show the assignment by appending a child to the assignment wrapper
 * @param {Element} parent the parent element to append this child to
 * @param {Number} minutes (optional) number of minutes to show
 * @param {Number} numQuestions (optional) number of questions to show
 * @param {Element} statusIndicatorElement dom element to show for the status indicator
 */
function show_helper(parent, minutes, numQuestions, statusIndicatorElement, type = null, sectionCode = null) {
  const leftDiv = document.createElement('div');
  const rightDiv = document.createElement('div');

  // leftDiv.classList.add('flex-row', 'align-center');
  leftDiv.innerHTML = 
  `
  ${sectionCode ? 
    `<p>${sectionCode}</p>` :
    ''
  }
  <div class="flex-row align-center">
    ${type ?
      `<p style="margin-right: 0.5em;">
        ${type.charAt(0).toUpperCase()}
      </p>` :
      ''
    }

    ${STOPWATCH_SVG}
    <p>${minutes ? minutes : '--:--'}</p>

    ${MINUS_BOX_SVG}
    <p>${numQuestions ? numQuestions : 'auto'}</p>
  </div>
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
    questionsByTopics[topic] = questionsByTopics[topic].map(group => group.filter(question => !assigned_questions.includes(question)))
    .filter(filteredGroup => filteredGroup.length > 0);
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

    // the new question should be the first topic that has questions from the diff array
    let newQuestions = [];
    for (const { topic } of diffTopicProportions) {
      if (questionsByTopics[topic].length > 0) {
        const index = randomInt(0, questionsByTopics[topic].length)
        newQuestions = questionsByTopics[topic][index] ?? [];
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