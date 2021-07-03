//handle the lesson object
let oldLessonData = {};
let lessonData = {};
let act_lesson_list = {};

// For lesson popup
let timeout = undefined;
let selectedElement = undefined

initialSetupData();

//initial setup
function initialSetupData() {
  initializeLessonList().then(() => {getLessonData();})
}

function initializeLessonList() {
  return new Promise((resolve, reject) => {
    let lessonNamesRef = firebase.firestore().collection("Dynamic-Content").doc('act-lessons')
    lessonNamesRef.get()
    .then((data) => {
      act_lesson_list = data.data()
    })
    .then(() => {
      const sections = Object.keys(act_lesson_list)
      for (let i = 0; i < sections.length; i++) {
        let location = document.getElementById(sections[i] + 'Lessons')
        for (let j = 0; j < act_lesson_list[sections[i]]['lessons'].length; j++) {
          let ele1 = createElement('div', ['gridBox3'], [], [], act_lesson_list[sections[i]]['lessons'][j])
          let ele2 = createElement('div', ['gridBox3'], [], [], act_lesson_list[sections[i]]['ranks'][j])
          let ele3 = createElement('div', ['gridBox3', 'cursor'], ['onmouseover', 'onmouseout', 'id'], ["openLessonPopup('" + sections[i] + "', this)", "closeLessonPopup()", sections[i] + '-' + act_lesson_list[sections[i]]['lessons'][j].replaceAll('/', '').replaceAll('-', '_').replaceAll('  ', ' ').replaceAll(' ', '_').toLowerCase()], '');
          location.append(ele1)
          location.append(ele2)
          location.append(ele3)
        }
      }
      resolve();
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      reject(error);
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      reject(error);
    })
  })
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
  let boxes = document.getElementsByClassName("gridBox3 cursor")
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
        console.log("1")
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
              console.log("2")
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