//handle the lesson object
let oldLessonData = {};
let lessonData = {};
let act_lesson_list = {
  english: [],
  math: [],
  reading: [],
  science: []
};
let act_topic_lists = {
  english: {},
  math: {},
  reading: {},
  science: {},
}
let is_act_topic_completion_set = {
  english: false,
  math: false,
  reading: false,
  science: false,
}

// For lesson popup
let timeout = undefined;
let selectedElement = undefined

initialSetupData();

//initial setup
function initialSetupData() {
  initializeLessonList().then(() => {getLessonData();})
}

// function initializeLessonList() {
//   return new Promise((resolve, reject) => {
//     let lessonNamesRef = firebase.firestore().collection("Dynamic-Content").doc('act-lessons')
//     lessonNamesRef.get()
//     .then((data) => {
//       act_lesson_list = data.data()
//     })
//     .then(() => {
//       const sections = Object.keys(act_lesson_list)
//       for (let i = 0; i < sections.length; i++) {
//         let location = document.getElementById(sections[i] + 'Lessons')
//         for (let j = 0; j < act_lesson_list[sections[i]]['lessons'].length; j++) {
//           let ele1 = createElement('div', ['gridBox3'], [], [], act_lesson_list[sections[i]]['lessons'][j])
//           let ele2 = createElement('div', ['gridBox3'], [], [], act_lesson_list[sections[i]]['ranks'][j])
//           let ele3 = createElement('div', ['gridBox3', 'cursor'], ['onmouseover', 'onmouseout', 'id'], ["openLessonPopup('" + sections[i] + "', this)", "closeLessonPopup()", sections[i] + '-' + act_lesson_list[sections[i]]['lessons'][j].replaceAll('/', '').replaceAll('-', '_').replaceAll('  ', ' ').replaceAll(' ', '_').toLowerCase()], '');
//           location.append(ele1)
//           location.append(ele2)
//           location.append(ele3)
//         }
//       }
//       resolve();
//     })
//     .catch((error) => {
//       handleFirebaseErrors(error, window.location.href);
//       reject(error);
//     })
//     .catch((error) => {
//       handleFirebaseErrors(error, window.location.href);
//       reject(error);
//     })
//   })
// }

async function initializeLessonList() {
  // get all of the topic documents
  const curriculumTopicsQuery = await firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics').where('type', '==', 'topic').get();

  //go through the query and break them up into their sections
  curriculumTopicsQuery.forEach(topicDoc => {
    act_lesson_list[topicDoc.data().section].push(topicDoc.data().topic)
  })
  const sections = ['english', 'math', 'reading', 'science'];

  //sort the topics by their frequency
  await initializeTopicQuestionCompletion();
  await initializeTopicQuestionList();
  for (let i = 0; i < sections.length; i++) {
    act_lesson_list[sections[i]].sort((a,b) => {
      if (!act_topic_lists[sections[i]][a] && !act_topic_lists[sections[i]][b]) { return 0 }
      if (!act_topic_lists[sections[i]][a]) { return 1 };
      if (!act_topic_lists[sections[i]][b]) { return -1 };

      return act_topic_lists[sections[i]][b].length - act_topic_lists[sections[i]][a].length
    });
  }

  console.log(act_topic_lists);
  console.log(act_lesson_list);

  for (let i = 0; i < sections.length; i++) {
    let location = document.getElementById(sections[i] + 'Lessons')
    for (let j = 0; j < act_lesson_list[sections[i]].length; j++) {
      let ele1 = createElement('div', ['gridBox3', 'cursor'], ['onclick'], [`setupTopicQuestionList('${sections[i]}', '${act_lesson_list[sections[i]][j]}')`], act_lesson_list[sections[i]][j])
      // let ele2 = createElement('div', ['gridBox3'], [], [], act_lesson_list[sections[i]][j])
      let ele3 = createElement('div', ['gridBox3', 'cursor'], ['onmouseover', 'onmouseout', 'id'], ["openLessonPopup('" + sections[i] + "', this)", "closeLessonPopup()", sections[i] + '-' + act_lesson_list[sections[i]][j].replaceAll('/', '').replaceAll('-', '_').replaceAll('  ', ' ').replaceAll(' ', '_').toLowerCase()], '');
      location.append(ele1)
      // location.append(ele2)
      location.append(ele3)
    }
  }
}

function initializeTopicQuestionList() {
  return Promise.all([
    getSectionTopicQuestionDoc('english')
    .then(doc => {
      act_topic_lists.english = doc.data()
    }),
    getSectionTopicQuestionDoc('math')
    .then(doc => {
      act_topic_lists.math = doc.data()
    }),
    getSectionTopicQuestionDoc('reading')
    .then(doc => {
      act_topic_lists.reading = doc.data()
    }),
    getSectionTopicQuestionDoc('science')
    .then(doc => {
      act_topic_lists.science = doc.data()
    }),
  ])
}

function initializeTopicQuestionCompletion() {
  return Promise.all([
    getTopicQuestionCompletionDoc('english')
    .then(doc => {
      if (doc.exists) {
        is_act_topic_completion_set.english = true;
      }
    }),
    getTopicQuestionCompletionDoc('math')
    .then(doc => {
      if (doc.exists) {
        is_act_topic_completion_set.math = true;
      }
    }),
    getTopicQuestionCompletionDoc('reading')
    .then(doc => {
      if (doc.exists) {
        is_act_topic_completion_set.reading = true;
      }
    }),
    getTopicQuestionCompletionDoc('science')
    .then(doc => {
      if (doc.exists) {
        is_act_topic_completion_set.science = true;
      }
    }),
  ])
}

function getSectionTopicQuestionDoc(section) {
  return firebase.firestore().collection('ACT-Aggregates').doc(section).get();
}

async function setupTopicQuestionList(section, topic) {
  // break apart the questions into test
  let tests = {};

  act_topic_lists[section][topic].forEach(questionStr => {
    const [test, passage, question] = questionStr.split(':');

    if (!tests[test]) {
      tests[test] = [];
    }
    tests[test].push(Number(question));
  })

  // go through and order all if the questions by number then get their answer the display each test
  const questionSection = document.getElementById('topicQuestionSection');
  const questionContainer = document.getElementById('topicQuestionContainer');

  removeAllChildNodes(questionContainer)

  let containerTitle = document.createElement('h1');
  containerTitle.textContent = `${topic}`;
  questionContainer.appendChild(containerTitle);

  for (const test in tests) {
    tests[test].sort((a,b) => a - b);

    await Promise.all(tests[test].map((question, index) => {
      return getQuestionDoc(test, section, question)
      .then(doc => {
        tests[test][index] = `${question}-${doc.data().correctAnswer}`
      })
    }))

    let testContainer = document.createElement('div')
    testContainer.classList.add('test-container');

    let testName = document.createElement('h2')
    testName.textContent = test;
    testName.classList.add('cursor');
    testName.addEventListener('click', () => { openTest(test, section) });
    testContainer.appendChild(testName);

    //get the completion doc for this section
    const completionDoc = await getTopicQuestionCompletionDoc(section);

    tests[test].forEach(questionAnswer => {
      let questionContainer = document.createElement('div')
      questionContainer.classList.add('input-label')

      const [question, answer] = questionAnswer.split('-');
      const checkbox = document.createElement('input')
      checkbox.setAttribute('type', 'checkbox');
      checkbox.id = `${test}-${question}`;
      checkbox.classList.add('cursor');
      checkbox.checked = completionDoc.data()?.[topic]?.includes(checkbox.id);
      checkbox.addEventListener('change', (event) => { questionTopicChangeCallback(event, section, topic, checkbox.id) })
      questionContainer.appendChild(checkbox);
      
      const label = document.createElement('label');
      label.setAttribute('for', `${test}-${question}`);
      label.textContent = `Question ${question}: Answer ${answer}`;
      label.classList.add('cursor');
      questionContainer.appendChild(label)

      testContainer.appendChild(questionContainer);
    })

    questionContainer.appendChild(testContainer)
  }

  questionSection.style.display = 'flex';
}

async function questionTopicChangeCallback(event, section, topic, questionID) {
  //make sure that the section doc is created
  if (!is_act_topic_completion_set[section]) {
    await firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc(section).set({})
    is_act_topic_completion_set[section] = true;
  }
  //determine if the change was check or uncheck
  if (event.target.checked) {
    await updateTopicQuestionCompletion(section, topic, firebase.firestore.FieldValue.arrayUnion(questionID));
  }
  else {
    await updateTopicQuestionCompletion(section, topic, firebase.firestore.FieldValue.arrayRemove(questionID));
  }
}

function getTopicQuestionCompletionDoc(section) {
  return firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc(section).get();
}

function updateTopicQuestionCompletion(section, topic, questionFieldValue) {
  return firebase.firestore().collection('Users').doc(CURRENT_STUDENT_UID).collection('ACT').doc(section).update({
    [topic]: questionFieldValue
  })
}

async function getQuestionDoc(test, section, question) {
  const questionQuery = await firebase.firestore().collection('ACT-Tests')
  .where('type', '==', 'question')
  .where('test', '==', test)
  .where('section', '==', section)
  .where('problem', '==', question)
  .limit(1)
  .get()

  return questionQuery.docs[0];
}

//get the lesson object from firebase
function getLessonData() {
  if (CURRENT_STUDENT_UID) {
    let ref = firebase.firestore().collection('ACT-Student-Lessons').where('student', '==', CURRENT_STUDENT_UID)
    return ref.get()
    .then((snapshot) => {
      if (snapshot.size > 0) {
        snapshot.forEach((doc) => {
          const data = doc.data()
          setObjectValue([data['section'], data['lesson'].replaceAll(' ', '_')], {'status' : data['status'], 'date' : data['date']}, lessonData)
        })
        updateLessonGraphics();
      }
    })
    .catch((error) => {
      console.log("There is no data for the student\n", error)
    })
  }
  else {
    console.log("There is no student selected!!!")
    return new Promise.resolve()
  }
}

//call this function when the colors of the lessons need to be updated
function updateLessonGraphics() {
  //get all of the lesson divs and set their color to null
  // let boxes = document.getElementsByClassName("gridBox3 cursor")
  let boxes = document.querySelectorAll('div[id].gridBox3');
  
  for (let i = 0; i < boxes.length; i++) {
    removeColors(boxes[i])
    boxes[i].innerHTML = null;
  }

  //change the color based on what the current status is
  for (const section in lessonData) {
    for (const lesson in lessonData[section]) {
      const id = section + "-" + lesson;
      const status = lessonData[section][lesson].status;
      const dateInt = lessonData[section][lesson].date;

      const lessonElem = document.getElementById(id);
      if (lessonElem) {
        switch (status) {
          case "review":
            //lessonElem.style.backgroundColor = "red";
            lessonElem.classList.add('red')
            break;
          case "proficient":
            //lessonElem.style.backgroundColor = "yellow";
            lessonElem.classList.add('yellow')
            break;
          case "mastered":
            //lessonElem.style.backgroundColor = "green";
            lessonElem.classList.add('green')
            break;
          default:
            break;
        }
  
        if (dateInt != 0) {
          const dateStr = convertFromDateInt(dateInt)['shortestDate']
          lessonElem.innerHTML = dateStr;
        }
        else {
          lessonElem.innerHTML = null;
        }
      }
    }
  }
}

function removeColors(element) {
  const colors = Object.values(coloring)
  for (let i = 0; i < colors.length; i++) {
    element.classList.remove(colors[i])
  }
}

function openLessonPopup(section = undefined, element = undefined) {
  clearTimeout(timeout)

  if (element != undefined) {
    let popup = document.getElementById('lessonPopup')
    popup.classList.remove("hidden");
    const boxHeight = document.getElementById(section + 'Lessons').getElementsByClassName('gridBox3')[0].getBoundingClientRect()['height'];
    popup.style.top = (element.getBoundingClientRect()['y'] - (popup.getBoundingClientRect()['height'] / 2) + (boxHeight / 2)).toString() + 'px';

    // Remove the highlighting (if needed)
    if (selectedElement != undefined) {
      selectedElement.classList.remove('selectedElement')
    }

    selectedElement = element
    element.classList.add('selectedElement')
  }
}

function closeLessonPopup() {
  timeout = setTimeout(function(){
    let popup = document.getElementById('lessonPopup')
    popup.classList.add("hidden");

    // Remove the highlighting (if needed)
    selectedElement.classList.remove('selectedElement')

  }, 50)
}

function toggleLessonButtons(disable = true) {
  let buttons = document.getElementById('lessonPopup').querySelectorAll('button')
  
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = disable
  }
}

function submitLesson(status) {

  let currentElement = selectedElement

  // Disable the buttons until Fb has done its thing
  toggleLessonButtons(true)

  // Let the user know that their job is processing
  currentElement.classList.add('loadingRing')

  // Get the section and lesson from the selected element's id
  const section = currentElement.id.split('-')[0]
  const lesson = currentElement.id.split('-')[1].replaceAll('_', ' ')

  // Close the popup
  let popup = document.getElementById('lessonPopup')
  popup.classList.add("hidden");

  // Check to see if the id exists
  let id = ids.filter(function(val) { return val.student == CURRENT_STUDENT_UID && val.section == section && val.lesson == lesson} )
  if (id.length > 0) {
    id = id[0]['id']
  }
  else {
    id = undefined
  }

  // Set the Fb base ref
  ref = firebase.firestore().collection('ACT-Student-Lessons')

  if (status != 'remove') {

    // Update the Fb ref
    if (id != undefined) {
      ref = ref.doc(id)
      ref.set({
        'student' : CURRENT_STUDENT_UID,
        'section' : section,
        'lesson'  : lesson,
        'date'    : date.getTime(),
        'status'  : status
      })
      .then(() => {
        ids.push({'student' : CURRENT_STUDENT_UID, 'section' : section, 'lesson' : lesson, 'id' : ref.id})
        currentElement.classList.remove('loadingRing')
        setObjectValue([section, lesson.replaceAll(' ', '_')], {'status' : status, 'date' : date.getTime()}, lessonData);
        updateLessonGraphics();
        toggleLessonButtons(false)
      })
      .catch((error) => {
        // Swap the pending symbol for the error
        currentElement.classList.add('uhOh')
        currentElement.classList.remove('loadingRing')
        toggleLessonButtons(false)
        console.log(error)
      })
    }
    else {

      // Check to see if the doc exists or not
      ref.where('student', '==', CURRENT_STUDENT_UID).where('section', '==', section).where('lesson', '==', lesson).get()
      .then((querySnapshot) => {
        if (querySnapshot.size > 0) {
          querySnapshot.forEach((doc) => {
            // If the doc exists already, reset it
            id = doc.id
            ref = ref.doc(doc.id);
            ref.set({
              'student' : CURRENT_STUDENT_UID,
              'section' : section,
              'lesson'  : lesson,
              'date'    : date.getTime(),
              'status'  : status
            })
            .then(() => {
              ids.push({'student' : CURRENT_STUDENT_UID, 'section' : section, 'lesson' : lesson, 'id' : ref.id})
              currentElement.classList.remove('loadingRing')
              setObjectValue([section, lesson.replaceAll(' ', '_')], {'status' : status, 'date' : date.getTime()}, lessonData);
              updateLessonGraphics();
              toggleLessonButtons(false)
            })
            .catch((error) => {
              // Swap the pending symbol for the error
              currentElement.classList.add('uhOh')
              currentElement.classList.remove('loadingRing')
              toggleLessonButtons(false)
              console.log(error)
            })
          })
        }

        // No doc was found
        if (id == undefined) {
          ref = ref.doc()
          ref.set({
            'student' : CURRENT_STUDENT_UID,
            'section' : section,
            'lesson'  : lesson,
            'date'    : date.getTime(),
            'status'  : status
          })
          .then(() => {
            console.log("3")
            ids.push({'student' : CURRENT_STUDENT_UID, 'section' : section, 'lesson' : lesson, 'id' : ref.id})
            currentElement.classList.remove('loadingRing')
            setObjectValue([section, lesson.replaceAll(' ', '_')], {'status' : status, 'date' : date.getTime()}, lessonData);
            updateLessonGraphics();
            toggleLessonButtons(false)
          })
          .catch((error) => {
            // Swap the pending symbol for the error
            currentElement.classList.add('uhOh')
            currentElement.classList.remove('loadingRing')
            toggleLessonButtons(false)
            console.log(error)
          })
        }
      })
    }
  }
  // Remove / Delete the lesson
  else {
    if (id == undefined) {
      ref.where('student', '==', CURRENT_STUDENT_UID).where('section', '==', section).where('lesson', '==', lesson).get()
      .then((querySnapshot) => {
        if (querySnapshot.size > 0) {
          querySnapshot.forEach((doc) => {
            ref.doc(doc.id).delete()
            .then(() => {
              currentElement.classList.remove('loadingRing')
              delete lessonData[section][lesson.replaceAll(' ', '_')]
              updateLessonGraphics();
              toggleLessonButtons(false)
            })
            .catch((error) => {
              // Swap the pending symbol for the error
              currentElement.classList.remove('loadingRing')
              currentElement.classList.add('uhOh')
              toggleLessonButtons(false)
              console.log(error)
            })
          })
        }
        else {
          currentElement.classList.remove('loadingRing')
          updateLessonGraphics();
          toggleLessonButtons(false)
        }
      })
      .catch((error) => {
        // Swap the pending symbol for the error
        currentElement.classList.remove('loadingRing')
        currentElement.classList.add('uhOh')
        toggleLessonButtons(false)
        console.log(error)
      })
    }
    else {
      // Remove the doc
      ref.doc(id).delete()
      .then(() => {
        // Update the ids array
        currentElement.classList.remove('loadingRing')
        delete lessonData[section][lesson.replaceAll(' ', '_')];
        updateLessonGraphics();
        toggleLessonButtons(false)
        ids = ids.filter(function(val) { return val.student != CURRENT_STUDENT_UID || val.section != section || val.lesson != lesson})
      })
      .catch((error) => {
        // Swap the pending symbol for the error
        currentElement.classList.remove('loadingRing')
        currentElement.classList.add('uhOh')
        toggleLessonButtons(false)
        console.log(error)
      })
    }

  }

  // Remove the highlighting (if needed)
  currentElement.classList.remove('selectedElement')
}