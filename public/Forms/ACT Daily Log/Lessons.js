//handle the lesson object
let oldLessonData = {};
let lessonData = {};
let act_lesson_list = {};

initialSetupData();

//initial setup
function initialSetupData() {
  initializeLessonList().then(() => {getLessonData(); setLessonEventListeners()})
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
          let ele1 = createElement('div', ['gridBox-3'], [], [], act_lesson_list[sections[i]]['lessons'][j])
          let ele2 = createElement('div', ['gridBox-3'], [], [], act_lesson_list[sections[i]]['ranks'][j])
          let ele3 = createElement('div', ['gridBox-3', 'cursor'], ['id'], [sections[i] + '-' + act_lesson_list[sections[i]]['lessons'][j].replaceAll('/', '').replaceAll('-', '_').replaceAll('  ', ' ').replaceAll(' ', '_').toLowerCase()], '');
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
  const studentUID = queryStrings()["student"];

  if (studentUID) {
    let lessonDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("lessons");
    //need to somehow get this promise to return when complete....
    return lessonDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        lessonData = doc.data();
        oldLessonData = JSON.parse(JSON.stringify(lessonData));
        updateLessonGraphics();
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      return Promise.reject(error);
    });
  }
  else {
    console.log("There is no student selected!!!");
    return Promise.reject("There is no student selected!!!");
  }
}

//called when a lesson is selected and will update the lesson object with the appropriate values
function updateLessonData() {
  const section = this.id.split("-")[0];
  const lesson = this.id.split("-")[1];

  let value = {};
  const lessonStatus = lessonData[section]?.[lesson]?.status;
  const lessonTime = date.getTime();
  switch (lessonStatus) {
    case "needs review":
      value = {
        status: "proficient",
        date: lessonTime
      };
      break;
    case "proficient":
      value = {
        status: "mastered",
        date: lessonTime
      };
      break;
    case "mastered":
      value = {
        status: "needs review",
        date: lessonTime
      };
      break;
    default:
      value = {
        status: "needs review",
        date: lessonTime
      };
  }
  setObjectValue([section, lesson], value, lessonData);
  updateLessonGraphics();
}

function resetLessonData() {
  const section = this.id.split("-")[0];
  const lesson = this.id.split("-")[1];

  let value = {
    status: oldLessonData[section]?.[lesson]?.status,
    date: oldLessonData[section]?.[lesson]?.date
  }

  if (value.status) {
    setObjectValue([section, lesson], value, lessonData);
  }
  else {
    delete lessonData[section][lesson];
  }
  updateLessonGraphics();
}


//call this function when the colors of the lessons need to be updated
function updateLessonGraphics() {
  //get all of the lesson divs and set their color to null
  let englishParent = document.getElementById("englishLessons");
  let mathParent = document.getElementById("mathLessons");
  let readingParent = document.getElementById("readingLessons");
  let scienceParent = document.getElementById("scienceLessons");

  let englishLessons = englishParent.querySelectorAll(".cursor");
  let mathLessons = mathParent.querySelectorAll(".cursor");
  let readingLessons = readingParent.querySelectorAll(".cursor");
  let scienceLessons = scienceParent.querySelectorAll(".cursor");

  for (let i = 0; i < englishLessons.length; i++) {
    englishLessons[i].style.backgroundColor = null;
    englishLessons[i].innerHTML = null;
  }
  for (let i = 0; i < mathLessons.length; i++) {
    mathLessons[i].style.backgroundColor = null;
    mathLessons[i].innerHTML = null;
  }
  for (let i = 0; i < readingLessons.length; i++) {
    readingLessons[i].style.backgroundColor = null;
    readingLessons[i].innerHTML = null;
  }
  for (let i = 0; i < scienceLessons.length; i++) {
    scienceLessons[i].style.backgroundColor = null;
    scienceLessons[i].innerHTML = null;
  }

  //change the color based on what the current status is
  for (const section in lessonData) {
    for (const lesson in lessonData[section]) {
      const id = section + "-" + lesson;
      const status = lessonData[section][lesson].status;
      const dateInt = lessonData[section][lesson].date;

      const lessonElem = document.getElementById(id);

      switch (status) {
        case "needs review":
          lessonElem.style.backgroundColor = "red";
          break;
        case "proficient":
          lessonElem.style.backgroundColor = "yellow";
          break;
        case "mastered":
          lessonElem.style.backgroundColor = "green";
          break;
        default:
          lessonElem.style.backgroundColor = null;
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

//set or update the lesson object to firebase
function setLessonData() {
  let currentUser = firebase.auth().currentUser;
  if (currentUser) {
    let tutor = currentUser.uid;

    //set this session doc to firebase
    const studentUID = queryStrings()["student"];

    if (studentUID) {
      let lessonDocRef = firebase.firestore().collection("Students").doc(studentUID).collection("ACT").doc("lessons");
      //need to somehow get this promise to return when complete....
      return lessonDocRef.get()
      .then((doc) => {
        //set the doc to overwrite the lessons
        return lessonDocRef.set(lessonData);
      })
      .catch((error) => {
        handleFirebaseErrors(error, window.location.href);
        return Promise.reject(error);
      });
    }
    else {
      console.log("There is no student selected!!!");
      return Promise.reject("There is no student selected!!!");
    }
  }
  else {
    //there is no tutor logged in
    console.log("There is no tutor logged in!!!")
    return Promise.reject("There is no tutor logged in!!!")
  }
}

function setLessonEventListeners() {
  //get all of the lesson divs and set an onclick event
  let englishParent = document.getElementById("englishLessons");
  let mathParent = document.getElementById("mathLessons");
  let readingParent = document.getElementById("readingLessons");
  let scienceParent = document.getElementById("scienceLessons");

  let englishLessons = englishParent.querySelectorAll(".cursor");
  let mathLessons = mathParent.querySelectorAll(".cursor");
  let readingLessons = readingParent.querySelectorAll(".cursor");
  let scienceLessons = scienceParent.querySelectorAll(".cursor");

  for (let i = 0; i < englishLessons.length; i++) {
    englishLessons[i].addEventListener("click", updateLessonData);
    englishLessons[i].addEventListener("dblclick", resetLessonData);
  }
  for (let i = 0; i < mathLessons.length; i++) {
    mathLessons[i].addEventListener("click", updateLessonData);
    mathLessons[i].addEventListener("dblclick", resetLessonData);
  }
  for (let i = 0; i < readingLessons.length; i++) {
    readingLessons[i].addEventListener("click", updateLessonData);
    readingLessons[i].addEventListener("dblclick", resetLessonData);
  }
  for (let i = 0; i < scienceLessons.length; i++) {
    scienceLessons[i].addEventListener("click", updateLessonData);
    scienceLessons[i].addEventListener("dblclick", resetLessonData);
  }
}