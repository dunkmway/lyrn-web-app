//handle the lesson object
let lessonData = {}

initialSetup();

//initial setup
function initialSetup() {
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
  }
  for (let i = 0; i < mathLessons.length; i++) {
    mathLessons[i].addEventListener("click", updateLessonData);
  }
  for (let i = 0; i < readingLessons.length; i++) {
    readingLessons[i].addEventListener("click", updateLessonData);
  }
  for (let i = 0; i < scienceLessons.length; i++) {
    scienceLessons[i].addEventListener("click", updateLessonData);
  }

  getLessonData()
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
        console.log(lessonData);
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
  let date = new Date()
  const lessonStatus = lessonData[section]?.[lesson]?.status
  console.log(lessonStatus);
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
      delete lessonData[section][lesson];
      break;
    default:
      value = {
        status: "needs review",
        date: date.getTime()
      };
  }
  
  setObjectValue([section, lesson], value, lessonData);

  console.log(lessonData);
  updateLessonGraphics();
}

//call this function when the colors of the lessons need to be updated
function updateLessonGraphics() {
  for (const section in lessonData) {
    for (const lesson in lessonData[section]) {
      const id = section + "-" + lesson;
      const status = lessonData[section][lesson].status;
      const date = new Date(lessonData[section][lesson].date);

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

      if (date) {
        const day = date.getDate()
        const month = date.getMonth()+1;
        const year = date.getFullYear()
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

