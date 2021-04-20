//handle the lesson object
let oldLessonData = {};
let lessonData = {};

initialSetupData();

//initial setup
function initialSetupData() {
  getLessonData();
  setLessonEventListeners();
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
      console.error(error);
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
  const lessonStatus = lessonData[section]?.[lesson]?.status
  switch (lessonStatus) {
    case "needs review":
      value = {
        status: "proficient",
        date: date.getTime()
      };
      break;
    case "proficient":
      value = {
        status: "mastered",
        date: date.getTime()
      };
      break;
    case "mastered":
      value = {
        status: "needs review",
        date: date.getTime()
      };
      break;
    default:
      value = {
        status: "needs review",
        date: date.getTime()
      };
  }
  setObjectValue([section, lesson], value, lessonData);
  updateLessonGraphics();

  // console.log(lessonData);
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

  // console.log(lessonData);
}


//call this function when the colors of the lessons need to be updated
function updateLessonGraphics() {
  //get all of the lesson divs and set their color to null
  let englishParent = document.getElementById("englishLessons");
  let mathParent = document.getElementById("mathLessons");
  let readingParent = document.getElementById("readingLessons");
  let scienceParent = document.getElementById("scienceLessons");

  let englishLessons = englishParent.querySelectorAll(".button2");
  let mathLessons = mathParent.querySelectorAll(".button2");
  let readingLessons = readingParent.querySelectorAll(".button2");
  let scienceLessons = scienceParent.querySelectorAll(".button2");

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
      const dateTime = lessonData[section][lesson].date ? date : null

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

      if (dateTime) {
        const day = dateTime.getDate()
        const month = dateTime.getMonth()+1;
        const year = dateTime.getFullYear()
        const dateStr = month.toString() + "/" + day.toString() + "/" + year.toString();
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
        console.error(error);
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

  let englishLessons = englishParent.querySelectorAll(".button2");
  let mathLessons = mathParent.querySelectorAll(".button2");
  let readingLessons = readingParent.querySelectorAll(".button2");
  let scienceLessons = scienceParent.querySelectorAll(".button2");

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

function setObjectValue(propertyPath, value, obj) {
  // this is a super simple parsing, you will want to make this more complex to handle correctly any path
  // it will split by the dots at first and then simply pass along the array (on next iterations)
  let properties = Array.isArray(propertyPath) ? propertyPath : propertyPath.split(".")

  // Not yet at the last property so keep digging
  if (properties.length > 1) {
    // The property doesn't exists OR is not an object (and so we overwritte it) so we create it
    if (!obj.hasOwnProperty(properties[0]) || typeof obj[properties[0]] !== "object") {
      obj[properties[0]] = {}
    } 
      // We iterate.
    return setObjectValue(properties.slice(1), value, obj[properties[0]])
      // This is the last property - the one where to set the value
  } 
  else {
    // We set the value to the last property
    obj[properties[0]] = value
    return true // this is the end
  }
}

