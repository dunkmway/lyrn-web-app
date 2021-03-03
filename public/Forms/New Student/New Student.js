/*****************************************************************************
 * Description:
 *   This will bring you back from the student form to the parent form
*****************************************************************************/
function back() {
  // Change the forms
  document.getElementById("studentForm").style.display = "none";
  document.getElementById("parentForm").style.display = "flex";

  // Change the buttons
  let backButtons = document.getElementsByClassName("backButton")
  for (let i = 0; i < backButtons.length; i++) {
    backButtons[i].style.opacity = "0";
  }

  let nextButtons = document.getElementsByClassName("nextButton")
  for (let i = 0; i < nextButtons.length; i++) {
    nextButtons[i].style.opacity = "1";
  }

}

/*****************************************************************************
 * Description:
 *   This will bring you to the student form from the parent form
*****************************************************************************/
function next() {
  // Change the forms
  let parentForm = document.getElementById("parentForm").style.display = "none";
  let studentForm = document.getElementById("studentForm").style.display = "flex";

  // Change the buttons
  let backButtons = document.getElementsByClassName("backButton")
  for (let i = 0; i < backButtons.length; i++) {
    backButtons[i].style.opacity = "1";
  }

  let nextButtons = document.getElementsByClassName("nextButton")
  for (let i = 0; i < nextButtons.length; i++) {
    nextButtons[i].style.opacity = "0";
  }
}

/*****************************************************************************
 * Description:
 *   This will add a generic input to the end of the input-block
*****************************************************************************/
function addElement(id) {

  let placeholders = {}
  placeholders['studentScholarshipArray'] = ['Presidential', 'Exemplary', 'Outstanding', 'Distinguished']
  placeholders['studentCollegeArray'] = ['Massachusetts Institute of Technology (MIT)', 'Brigham Young University (BYU)', 'University of Utah (UoU)', 'Utah State University (USU)', 'Utah Valley University (UVU)'];
  placeholders['studentExtracurricularArray'] = ['Leadership', 'Internship', 'Atheletic', 'Work', 'Academic Teams and Clubs', 'Creative Pursuits', 'Technological Skills', 'Political Activism', 'Travel']

  let phrase = "label[for=\"" + id + "\"]";
  let parentElement = document.querySelector(phrase).parentNode.parentNode;

  let newElement = document.createElement("input");
  newElement.setAttribute("type", "text");
  newElement.setAttribute("id", id + (parentElement.childElementCount - 1).toString());
  if (parentElement.childElementCount - 1 < placeholders[id].length) {
    newElement.setAttribute("placeholder", placeholders[id][parentElement.childElementCount - 1]);
  }
  else {
    newElement.setAttribute("placeholder", "Other");
  }

  newElement.className = "input";
  parentElement.appendChild(newElement);
}

/*****************************************************************************
 * Description:
 *   This will remove the given element plus its grandparents and down
*****************************************************************************/
function removeElement(id) {
  let phrase = "label[for=\"" + id + "\"]";
  let parentElement = document.querySelector(phrase).parentNode.parentNode;

  if (parentElement.childElementCount > 1) {
    parentElement.lastChild.remove();
  }
}

function addActTest() {
  placeholders = ['7/17/2021', '9/11/2021', '10/23/2021', '12/11/2021', '2/5/2022', '4/9/2022', '6/11/2022', '7/16/2022']
  let id = "studentACTDateArray"

  let phrase = "label[for^=\"studentACTTest\"]";
  let parentElement = document.querySelector(phrase).parentNode.parentNode;

  let numChildren = (parentElement.childElementCount - 1) / 2;

  scores = []
  let date = createElement("div", "input-row")
  let element;
  if (numChildren + 1 < placeholders.length) {
    element = createElements(["label", "input"], ["label", "input"], [["for"],["id", "placeholder"]], [[id + (numChildren + 1).toString()],[id + (numChildren + 1).toString(), placeholders[(numChildren + 1)]]], ["ACT Date", ""], "input-block")
    element.addEventListener('keydown',enforceNumericFormat);
    element.addEventListener('keyup',formatToDate);

  }
  else {
    element = createElements(["label", "input"], ["label", "input"], [["for"],["id", "placeholder"]], [[id + (numChildren + 1).toString()],[id + (numChildren + 1).toString(), "MM/DD/YYYY"]], ["ACT Date", ""], "input-block")
  }
  date.appendChild(element)

  scores.push(createElements(["label", "input"], ["label", "input"], [["for"],["id", "placeholder", "maxlength", "min", "max"]], [["english" + (numChildren + 1).toString()],["english" + (numChildren + 1).toString(), "25", "2", "0", "36"]], ["English:", ""], "input-block"))
  scores.push(createElements(["label", "input"], ["label", "input"], [["for"],["id", "placeholder", "maxlength", "min", "max"]], [["math" + (numChildren + 1).toString()],["math" + (numChildren + 1).toString(), "25", "2", "0", "36"]], ["Math:", ""], "input-block"))
  scores.push(createElements(["label", "input"], ["label", "input"], [["for"],["id", "placeholder", "maxlength", "min", "max"]], [["reading" + (numChildren + 1).toString()],["reading" + (numChildren + 1).toString(), "25", "2", "0", "36"]], ["Reading:", ""], "input-block"))
  scores.push(createElements(["label", "input"], ["label", "input"], [["for"],["id", "placeholder", "maxlength", "min", "max"]], [["science" + (numChildren + 1).toString()],["science" + (numChildren + 1).toString(), "25", "2", "0", "36"]], ["Science:", ""], "input-block"))

  for (let ele = 0; ele < scores.length; ele++) {
    scores[ele].addEventListener('keydown',enforceNumericFormat);
    scores[ele].addEventListener('keyup',formatToNumber);
  }

  let score = combineElements(scores, "input-row")

  parentElement.appendChild(date);
  parentElement.appendChild(score);
}

function removeActTest() {
  let phrase = "label[for^=\"studentACTTestsArray\"]";
  let parentElement = document.querySelector(phrase).parentNode.parentNode;
  children = parentElement.querySelectorAll("div[class=\"input-row\"]")

  let numChildren = (parentElement.childElementCount - 1) / 2;

  if (numChildren >= 1) {
    children[children.length - 1].remove()
    children[children.length - 2].remove()
  }

}



function createElements(elementType = [], classes = [], attributes = [], values = [], text = [], flexType = "input-row") {
  if (elementType.length >= 0) {
    let elements = createElement("div", flexType);

    if (attributes.length == values.length && attributes.length >= 0) {
      for (let i = 0; i < elementType.length; i++) {
        elements.appendChild(createElement(elementType[i], classes[i], attributes[i], values[i], text[i]));
      }
    }

    return elements;

  }
}

  function createElement(elementType, classes = "", attributes = [], values = [], text = "") {
    let question = document.createElement(elementType);

    if (attributes.length == values.length && attributes.length > 0) {
      for (let i = 0; i < attributes.length; i++) {
        question.setAttribute(attributes[i], values[i]);
      }
    }

    if (classes != "") {
      question.className = classes;
    }

    if (text != "") {
      question.innerHTML = text;
    }
    return question;

  }

  function combineElements(objects = [], flexType = "input-row")
  {
    let item = createElement("div", flexType, [], [], "");

    if (objects.length > 1)
    {
      for (let i = 0; i < objects.length; i++)
      {
        item.appendChild(objects[i]);
      }
    }

    return item;

  }

  function fillInData() {
    var GET = {};
    var queryString = window.location.search.replace(/^\?/, '');
    queryString.split(/\&/).forEach(function(keyValuePair) {
        var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
        var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
        GET[paramName] = paramValue;
    });

    const parentUID = GET["uid"];
    const locationName = GET["location"];


    //grab the pending data for this parent's student
    const pendingDocRef = firebase.firestore().collection("Locations").doc(locationName).collection("Pending").doc(parentUID);
    pendingDocRef.get()
    .then((doc) => {
      if(doc.exists) {
        let pendingStudents = doc.get("pendingStudents");
        //FIXME: need to select which student you want to work on
        let docData = pendingStudents[0];
        for(const key in docData) {
          let element = document.getElementById(key);
          if (element) {
            element.value = docData[key];
          }
        }
      }
    })
    .catch((error) => {
      console.log(error);
      console.log(error.code);
      console.log(error.message);
      console.log(error.details);
    });
  }