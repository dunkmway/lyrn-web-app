import app from "./_firebase";
import { collection, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where, onSnapshot } from "firebase/firestore"
import { getAuth } from "firebase/auth"

import Question from "./_ACT-Question";
import Timeline from "./_ACT-Assignment-Timeline";
import { STOPWATCH_SVG, MINUS_BOX_SVG } from "./_test-taker-svg";

import Dialog from "./_Dialog";
import Timer from "./_Timer";
import Time from "./_Time";

import { showAssignments, assigned_questions } from "./test-taker";

const auth = getAuth(app);
const db = getFirestore(app);


export default class Assignment {
  constructor(doc, isStaff) {
    const data = doc.data();

    this.isStaff = isStaff;

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
    this.isWatching = false;
    this.watchListener = null;
    this.currentQuestion = null;
  }

  update(newData) {
    // update the doc data
    for (let key in newData) {
      this[key] = newData[key]
    }

    // reset the timers
    this.resetTimers();

    // we need to re-render some of the view if we are currently in the main section
    if (this.isStarted || this.isInReview || this.isWatching) {
      // first check if we need to force a submit
      if (this.status === 'submitted') {
        this.end();
        return;
      }

      // re-load the questions
      // construct the question objects
      this.questionObjects = this.questions.map((id, index) => {
        // try to see if we already have this question
        const foundQuestion = this.questionObjects.find(question => question.id === id);
        if (foundQuestion) {
          // if so return it
          return foundQuestion;
        } else {
          // create a new question
          return new Question(id, index, this.student, this.timeline);
        }
      });

      // load any question that needs to
      Promise.allSettled(this.questionObjects.map(question => {
        if (!question.isLoaded) {
          return question.load()
        }
        return;
      }))
  
      // re-render the selector
      // clean up the selector
      removeAllChildNodes(document.getElementById('selectorContainer'));
      // setup the selectors
      this.questionObjects.forEach(question => {
        // setup the selector
        if (this.isStarted) {
          question.setupSelector(() => this.startQuestion(question.pos));
        } else if (this.isInReview) {
          question.setupSelector(() => this.reviewQuestion(question.pos));
        } else if (this.isWatching) {
          question.setupSelector(() => this.watchQuestion(question.pos));
        }
        // render the selector
        question.renderSelector();
      })
      // select the current question in the selector
      this.currentQuestion.selectorInput.checked = true;

      // restart the current question
      if (this.isStarted) {
        this.startQuestion(this.currentQuestion.pos, true);
      } else if (this.isInReview) {
        this.reviewQuestion(this.currentQuestion.pos, true);
      } else if (this.isWatching) {
        this.watchQuestion(this.currentQuestion.pos, true);
      }
    }

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
    if (!this.isStaff) {
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
        if (this.isStaff) {
          this.statusIndicator.textContent =
          (this.open ? new Time(this.open.toDate().getTime()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}') : '') +
          (this.open || this.close ? ' — ' : '') +
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
      this.isStaff && this.type,
      this.sectionCode
    )
  }

  omit() {
    // the assignment is closed if it is a new assignment past it's close date
    // set the status to omitted
    return updateDoc(this.ref, { status: 'omitted' })
  }

  submit() {
    if (this.isStarted) {
      this.end();
    }

    return updateDoc(this.ref, {
      status: 'submitted',
      submittedAt: serverTimestamp()
    })
  }

  async assignmentClicked() {
    const assignmentStartMessage = {
      english: `
      <p>You are about to take an english assignment. 
      ${this.time ? 
        `It will take you ${this.time / 60000} minutes to complete. Make sure that you have enough to take the entire test as it will auto submit at the end of the timer. ` :
        `You have an unlimted amount of time to take this assignment. `  
      }
      Make sure that you are in a quiet place where you can concentrate and complete the assignment in one sitting. Tests are best taken on a larger device like a tablet or desktop.
      </p>
      <p><b>Are you sure you are ready to begin this assignment?</b></p>
      `,
      math: `
      <p>You are about to take a math assignment. 
      You are encouraged to use a calculator and have scratch paper available.
      ${this.time ? 
        `It will take you ${this.time / 60000} minutes to complete. Make sure that you have enough to take the entire test as it will auto submit at the end of the timer. ` :
        `You have an unlimted amount of time to take this assignment. `  
      }
      Make sure that you are in a quiet place where you can concentrate and complete the assignment in one sitting. Tests are best taken on a larger device like a tablet or desktop.
      </p>
      <p><b>Are you sure you are ready to begin this assignment?</b></p>
      `,
      reading: `
      <p>You are about to take a reading assignment. 
      ${this.time ? 
        `It will take you ${this.time / 60000} minutes to complete. Make sure that you have enough to take the entire test as it will auto submit at the end of the timer. ` :
        `You have an unlimted amount of time to take this assignment. `  
      }
      Make sure that you are in a quiet place where you can concentrate and complete the assignment in one sitting. Tests are best taken on a larger device like a tablet or desktop.
      </p>
      <p><b>Are you sure you are ready to begin this assignment?</b></p>
      `,
      science: `
      <p>You are about to take a science assignment. 
      You may <b>NOT</b> use a calculator.
      ${this.time ? 
        `It will take you ${this.time / 60000} minutes to complete. Make sure that you have enough to take the entire test as it will auto submit at the end of the timer. ` :
        `You have an unlimited amount of time to take this assignment. `  
      }
      Make sure that you are in a quiet place where you can concentrate and complete the assignment in one sitting. Tests are best taken on a larger device like a tablet or desktop.
      </p>
      <p><b>Are you sure you are ready to begin this assignment?</b></p>
      `
    };

    switch (this.status) {
      case 'new':
        // if a staff member is starting someone else's assignment
        // sneeky start it
        if (this.student != auth.currentUser.uid) {
          Dialog.alert('You may not start this assignment as a tutor.')
        } else {
          const message = document.createElement('div');
          message.innerHTML = assignmentStartMessage[this.sectionCode];
          const confirmation = await Dialog.confirm(message, { width: '600px', choices: ['Cancel', 'Start'] });
          if (confirmation) {
            this.start();
          }
        }
        break;
      case 'started':
        this.start()
        break;
      case 'submitted':
        Dialog.alert('This assignment is still being graded. Try again later.')
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
    this.questionObjects = this.questions.map((id, index) => new Question(id, index, this.student, this.timeline));
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
    
    // scroll selector to top
    document.querySelector('.main .panels .selector-scroll').scrollTo(0,0);

    // set the event to a started state
    if (this.status === 'new' && !sneeky) {
      await updateDoc(this.ref, {
        status: 'started',
        startedAt: serverTimestamp()
      })
    }

    // if someone else is viewing the test taker then it must be a tutor
    // if the assignment has already been started (tutors cannot start assignments)
    // then we want to watch the student, not take the test
    if (this.student != auth.currentUser.uid && this.status === 'started') {
      // begin watch
      this.watch();
    } else {
      // show the first question
      await this.startQuestion(0);
    }


    // now move into the main section
    changeSection('main');
    changeAccentColor(this.sectionCode);
    changePassageColumns(this.sectionCode);
    document.getElementById('previousBtn').classList.add('hide');

    // remove loading
    document.querySelector('.landing .loading').classList.remove('active');
  }

  watch() {
    // change the state
    this.isWatching = true;

    // start the listener
    this.watchListener = onSnapshot(doc(db, 'ACT-Assignment-Timelines', this.timeline.id), doc => {
      // load the timeline directly
      this.timeline.timeline = doc.data().timeline;

      // watch the new question
      const currentQuestionID = this.timeline.timeline[this.timeline.timeline.length - 1].question;
      const currentQuestion = this.questionObjects.find(question => question.id == currentQuestionID)

      this.watchQuestion(currentQuestion.pos, true);
    })
  }

  end() {
    this.isStarted = false;
    this.isInReview = false;
    this.isWatching = false;

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
    if (this.watchListener) {
      this.watchListener();
    }

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

  async startQuestion(index, scrollSelector = false) {
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

    // scroll the selector to the new question
    if (scrollSelector) {
      const selectorScorollContainer = document.getElementById('selectorScrollContainer');
      const containerHeight = selectorScorollContainer.clientHeight;
      const labelVerticalOffset = this.questionObjects[index].selectorLabel.offsetTop;
      selectorScorollContainer.scrollTop = labelVerticalOffset - containerHeight / 4;
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

    resetMathJax();

    // only update to started if started by the actual user
    if (this.student == auth.currentUser.uid) {
      this.timeline.add(this.currentQuestion.id, 'start', true);
      await this.timeline.update();
    }

    // see if the next question needs to be loaded/generated
    // tutors should not generate more questions
    if ((index == this.questionObjects.length - 1) && this.topicProportions && this.student == auth.currentUser.uid) {
      const newQuestions = await getNewDynamicQuestions_helper(this.topicProportions, this.questionObjects);
      if (newQuestions && newQuestions.length != 0) {        
        // save this new question to the assignment
        // this will trigger an update which will update the questions objects and the selector
        updateDoc(this.ref, {
          questions: this.questions.concat(newQuestions)
        })
      }
    }
  }

  async watchQuestion(index, scrollSelector = false) {
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

    // scroll the selector to the new question
    if (scrollSelector) {
      const selectorScorollContainer = document.getElementById('selectorScrollContainer');
      const containerHeight = selectorScorollContainer.clientHeight;
      const labelVerticalOffset = this.questionObjects[index].selectorLabel.offsetTop;
      selectorScorollContainer.scrollTop = labelVerticalOffset - containerHeight / 4;
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
    this.currentQuestion.show();
    if (this.currentQuestion.passage) {
      this.currentQuestion.passage.show(this.currentQuestion.code);
    }

    // re-render the selector
      // clean up the selector
      removeAllChildNodes(document.getElementById('selectorContainer'));
      // setup the selectors
      this.questionObjects.forEach(question => {
        // setup the selector
        question.setupSelector(() => this.watchQuestion(question.pos));
        // render the selector
        question.renderSelector();
      })
      // select the current question in the selector
      this.currentQuestion.selectorInput.checked = true;

    resetMathJax();
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
    this.questionObjects = this.questions.map((id, index) => new Question(id, index, this.student, this.timeline));
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
        return getDoc(doc(db, 'ACT-Curriculum-Data', topic));
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

    // show the first question
    await this.reviewQuestion(0);

    // now move into the main section
    changeSection('main');
    changeAccentColor(this.sectionCode);
    changePassageColumns(this.sectionCode);
    document.getElementById('previousBtn').classList.add('hide');

    // remove loading
    document.querySelector('.landing .loading').classList.remove('active');
  }

  async reviewQuestion(index, scrollSelector = false) {
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
    // this.currentQuestion.review(this.isStaff);
    this.currentQuestion.review(true, this.isStaff);
    if (this.currentQuestion.passage) {
      this.currentQuestion.passage.show(this.currentQuestion.code);
    }

    if (scrollSelector) {
      // scroll the selector
      const selectorScorollContainer = document.getElementById('selectorScrollContainer');
      const containerHeight = selectorScorollContainer.clientHeight;
      const labelVerticalOffset = this.currentQuestion.selectorLabel.offsetTop;
      selectorScorollContainer.scrollTop = labelVerticalOffset - containerHeight / 4;
    }

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
 * This will cause MathJax to look for unprocessed mathematics on the page and typeset it
 */
async function resetMathJax() {
  try {
    await MathJax.typesetPromise();
    document.querySelectorAll('.MathJax').forEach((math) => {
      math.removeAttribute('tabindex');

      // we need to insert and invisble character if there aren't any text node siblings with the MathJax
      // equations don't appear on the same line if they are alone in a parent without text to align them
      // thus we will add an invisible character so that MathJax knows how to align the equation
      if (math.parentElement) {
        if (math.parentElement.textNodes().length === 0) {
          const text = document.createTextNode(' '); // we are using unicode char U+2009 (thin space) which is invisble
          math.parentElement.appendChild(text);
        }
      }
    })

  } catch (error) {
    console.log(error);
  }
}

function changeSection(sectionID) {
  // hide all sections
  document.querySelectorAll('section').forEach(section => section.classList.add('hide'));
  
  // show the section
  document.getElementById(sectionID).classList.remove('hide');
}

/**
 * change the css variable --accent-color to the variable --${sectionName}-color
 * @param {String} sectionName name of section
 */
function changeAccentColor(sectionName) {
  document.querySelector(':root').style.setProperty('--accent-color', `var(--${sectionName}-color)`)
  document.querySelector(':root').style.setProperty('--accent-color-light', `var(--${sectionName}-color-light)`)
}

/**
 * change the css variable --passage-columns to the variable --${sectionName}-passage-columns
 * @param {String} sectionName name of section
 */
function changePassageColumns(sectionName) {
  document.querySelector(':root').style.setProperty('--passage-columns', `var(--${sectionName}-passage-columns)`)
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

/**
 * get an object of questions groups per topic
 * @param {string[]} topics topic ids
 * @returns {Promise<Object.<string, string[][]>>} object containing questions groups per topic
 */
 async function getQuestionsByTopics_helper(topics) {
  const questionArray = await Promise.all(topics.map(async (topic) => {
    const topicQuery = await getDocs(query(
      collection(db, 'ACT-Question-Data'),
      where('topic', '==', topic),
      where('isQuestionBank', '==', true)
    ))

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