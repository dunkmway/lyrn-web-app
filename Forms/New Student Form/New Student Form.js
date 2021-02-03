/*********************************************************************
 * Description:
 *   This will add a new sibling + age label and input tag
 ********************************************************************/
function addSibling() {
  // Count how many siblings are there already and create their id: siblingName and siblingAge
  let siblings = document.querySelectorAll("label[for^=\"sibling\"]");
  let siblingCount = siblings.length / 2;
  let siblingName = "sibling" + String(siblingCount);
  let siblingAge = "siblingAge" + String(siblingCount);



  // This will hold all of the label and input tags to iterate through
  let siblingArray = [];



  // Create the new labels and inputs
  let siblingLabel = document.createElement("label")
  siblingLabel.setAttribute("for", "sibling" + String(siblingCount + 1))
  siblingLabel.innerHTML = "Sibling:"
  siblingLabel.className = "label label2"
  siblingArray.push(siblingLabel);

  let siblingInput = document.createElement("input")
  siblingInput.setAttribute("id", "sibling" + String(siblingCount + 1))
  siblingInput.setAttribute("type", "text")
  siblingInput.className = "input input2"
  siblingArray.push(siblingInput);

  let siblingAgeLabel = document.createElement("label")
  siblingAgeLabel.setAttribute("for", "siblingAge" + String(siblingCount + 1))
  siblingAgeLabel.innerHTML = "Age:"
  siblingAgeLabel.className = "label label2"
  siblingArray.push(siblingAgeLabel);

  let siblingAgeInput = document.createElement("input")
  siblingAgeInput.setAttribute("id", "siblingAge" + String(siblingCount + 1))
  siblingAgeInput.setAttribute("type", "number")
  siblingAgeInput.setAttribute("min", "0")
  siblingAgeInput.setAttribute("max", "130")
  siblingAgeInput.className = "input input2"
  siblingAgeInput.addEventListener('keydown',enforceNumericFormat);
  siblingAgeInput.addEventListener('keyup',formatToNumber);
  siblingArray.push(siblingAgeInput);



  // Add the sibling labels and tags to their div. Then append it in place
  let siblingInputDiv = document.getElementById("siblingInputs");
  let siblingDiv = document.createElement("div");
  siblingDiv.className = "inline"
  for (let i = 0; i < siblingArray.length; i++) {
    siblingDiv.appendChild(siblingArray[i])
  }
  siblingInputDiv.appendChild(siblingDiv);
}


/*************************************************************************
 * Description:
 *   This will remove the last sibling + age label and input elements
 ************************************************************************/
function removeSibling() {
  let siblings = document.querySelectorAll("label[for^=\"sibling\"], input[id^=\"sibling\"]");
  if (siblings.length > 0) {
    for (let i = 0; i < 4; i++) {
      siblings[siblings.length - 1 - i].remove()
    }
  }
}

/*************************************************************************
 * Description:
 *   This will remove the last sibling + age label and input elements
 ************************************************************************/
function addHighSchoolInfo() {
  let parentNode = document.createElement("div");
  parentNode.setAttribute("id", "actDiv");



  let child = document.createElement("h2");
  child.innerHTML = "College Information";
  parentNode.appendChild(child);

  let child1 = document.createElement("label");
  child1.setAttribute("for", "takenACT");
  child1.className = "label label2";
  child1.innerHTML = "Has taken the ACT:";
  parentNode.appendChild(child1);

  let child2 = document.createElement("input");
  child2.setAttribute("type", "checkbox");
  child2.setAttribute("id", "takenACT");
  child2.className = "input input2 miniBox";
  parentNode.appendChild(child2);
  let specialDiv = document.createElement("div");
  specialDiv.className = "tmpDiv";
  parentNode.append(specialDiv);

  let child13 = document.createElement("label");
  child13.setAttribute("for", "actGoalDate");
  child13.className = "label label2";
  child13.innerHTML = "Goal ACT Date:";
  parentNode.appendChild(child13);

  let child14 = document.createElement("input");
  child14.setAttribute("type", "date");
  child14.setAttribute("id", "actGoalDate");
  child14.setAttribute("maxlength", "10");
  child14.className = "input input2";
  child14.addEventListener('keydown',enforceNumericFormat);
  child14.addEventListener('keyup',formatToDate);
  parentNode.appendChild(child14);

  let child15 = document.createElement("label");
  child15.setAttribute("for", "actGoalScore");
  child15.className = "label label2";
  child15.innerHTML = "Goal ACT Score:";
  parentNode.appendChild(child15);

  let child16 = document.createElement("input");
  child16.setAttribute("type", "number");
  child16.setAttribute("min", "0");
  child16.setAttribute("max", "36");
  child16.setAttribute("id", "actGoalScore");
  child16.className = "input input2";
  child16.addEventListener('keydown',enforceNumericFormat);
  child16.addEventListener('keyup',formatToNumber);
  parentNode.appendChild(child16);

  let child17 = document.createElement("label");
  child17.setAttribute("for", "why");
  child17.className = "label label2";
  child17.innerHTML = "Why:";
  parentNode.appendChild(child17);

  let child18 = document.createElement("input");
  child18.setAttribute("type", "text");
  child18.setAttribute("id", "why");
  child18.className = "input input2";
  parentNode.appendChild(child18);
  parentNode.append(document.createElement("div"));



  let child19 = document.createElement("label");
  child19.setAttribute("for", "scholarship");
  child19.className = "label label2";
  child19.innerHTML = "Scholarship goal(s):";
  parentNode.appendChild(child19);

  let child20 = document.createElement("input");
  child20.setAttribute("type", "text");
  child20.setAttribute("id", "scholarship");
  child20.className = "input input2";
  parentNode.appendChild(child20);
  parentNode.append(document.createElement("div"));
  parentNode.append(document.createElement("div"));

  let submitButton = document.querySelector("#submit")
  submitButton.parentNode.insertBefore(parentNode, submitButton);



  let nextParentNode = document.createElement("div");
  nextParentNode.setAttribute("id", "highSchoolDiv");
  let child21 = document.createElement("label");
  child21.className = "label label2";
  child21.innerHTML = "Top Colleges:";
  nextParentNode.appendChild(child21);

  let child22 = document.createElement("input");
  child22.setAttribute("type", "text");
  child22.setAttribute("id", "topColleges1");
  child22.className = "input input2";
  nextParentNode.appendChild(child22);

  let child23 = document.createElement("input");
  child23.setAttribute("type", "text");
  child23.setAttribute("id", "topColleges2");
  child23.className = "input input2";
  nextParentNode.appendChild(child23);

  let child24 = document.createElement("input");
  child24.setAttribute("type", "text");
  child24.setAttribute("id", "topColleges3");
  child24.className = "input input2";
  nextParentNode.appendChild(child24);

  let child25 = document.createElement("input");
  child25.setAttribute("type", "text");
  child25.setAttribute("id", "topColleges4");
  child25.className = "input input2";
  nextParentNode.appendChild(child25);
  nextParentNode.append(document.createElement("div"));



  let child26 = document.createElement("label");
  child26.setAttribute("for", "desiredMajor");
  child26.className = "label label2";
  child26.innerHTML = "Desired Major:";
  nextParentNode.appendChild(child26);

  let child27 = document.createElement("input");
  child27.setAttribute("type", "text");
  child27.setAttribute("id", "desiredMajor");
  child27.className = "input input2";
  nextParentNode.appendChild(child27);

  let child28 = document.createElement("label");
  child28.setAttribute("for", "extracurriculars");
  child28.className = "label label2";
  child28.innerHTML = "Extracurriculars:";
  nextParentNode.appendChild(child28);

  let child29 = document.createElement("input");
  child29.setAttribute("type", "text");
  child29.setAttribute("id", "extracurriculars");
  child29.className = "input input2";
  nextParentNode.appendChild(child29);
  nextParentNode.append(document.createElement("div"));
  nextParentNode.append(document.createElement("div"));

  submitButton.parentNode.insertBefore(nextParentNode, submitButton);
}

/*************************************************************************
 * Description:
 *   This will remove the 'College Info' section
 ************************************************************************/
function removeHighSchoolInfo()
{
  let divsToRemove = document.querySelectorAll("#actDiv, #highSchoolDiv");
  for (let i = 0; i < divsToRemove.length; i++)
  {
    divsToRemove[i].remove();
  }

}


/*************************************************************************
 * Description:
 *   This will add the act specific information if they have taken one
 ************************************************************************/
function addACTInfo()
{
  let location = document.querySelector("label[for=\"actGoalDate\"]");
  let toRemove = document.getElementsByClassName("tmpDiv");

  for (let i = 0; i < toRemove.length; i++)
  {
    toRemove[i].remove();
  }

  let child3 = document.createElement("label");
  child3.setAttribute("for", "actDate");
  child3.className = "label label2";
  child3.innerHTML = "Date Taken:";
  location.parentNode.insertBefore(child3, location);

  let child4 = document.createElement("input");
  child4.setAttribute("type", "date");
  child4.setAttribute("id", "actDate");
  child4.className = "input input2";
  location.parentNode.insertBefore(child4, location);
  let specialDiv = document.createElement("div");
  specialDiv.className = "tmpDiv";
  location.parentNode.insertBefore(specialDiv, location);


  let child5 = document.createElement("label");
  child5.setAttribute("for", "english");
  child5.className = "label label2";
  child5.innerHTML = "English:";
  location.parentNode.insertBefore(child5, location);

  let child6 = document.createElement("input");
  child6.setAttribute("type", "number");
  child6.setAttribute("min", "1");
  child6.setAttribute("max", "36");
  child6.setAttribute("id", "english");
  child6.className = "input input2 smallBox";
  location.parentNode.insertBefore(child6, location);

  let child7 = document.createElement("label");
  child7.setAttribute("for", "math");
  child7.className = "label label2";
  child7.innerHTML = "Math:";
  location.parentNode.insertBefore(child7, location);

  let child8 = document.createElement("input");
  child8.setAttribute("type", "number");
  child8.setAttribute("min", "1");
  child8.setAttribute("max", "36");
  child8.setAttribute("id", "math");
  child8.className = "input input2 smallBox";
  location.parentNode.insertBefore(child8, location);

  let child9 = document.createElement("label");
  child9.setAttribute("for", "reading");
  child9.className = "label label2";
  child9.innerHTML = "Reading:";
  location.parentNode.insertBefore(child9, location);

  let child10 = document.createElement("input");
  child10.setAttribute("type", "number");
  child10.setAttribute("min", "1");
  child10.setAttribute("max", "36");
  child10.setAttribute("id", "reading");
  child10.className = "input input2 smallBox";
  location.parentNode.insertBefore(child10, location);

  let child11 = document.createElement("label");
  child11.setAttribute("for", "science");
  child11.className = "label label2";
  child11.innerHTML = "Science:";
  location.parentNode.insertBefore(child11, location);

  let child12 = document.createElement("input");
  child12.setAttribute("type", "number");
  child12.setAttribute("min", "1");
  child12.setAttribute("max", "36");
  child12.setAttribute("id", "science");
  child12.className = "input input2 smallBox";
  location.parentNode.insertBefore(child12, location);
  let specialDiv2 = document.createElement("div");
  specialDiv2.className = "tmpDiv";
  location.parentNode.insertBefore(specialDiv2, location);
}

/*************************************************************************
 * Description:
 *   This will remove the information that should be present if they
 *   have taken the ACT before
 ************************************************************************/
function removeACTInfo()
{
  // Remove the labels and inputs that should be present IF they HAVE taken the ACT before
  let labelsToDelete = document.querySelectorAll("label[for=\"actDate\"], label[for=\"english\"], label[for=\"math\"], label[for=\"reading\"], label[for=\"science\"]")
  let inputsToDelete = document.querySelectorAll("input[id=\"actDate\"], input[id=\"english\"], input[id=\"math\"], input[id=\"reading\"], input[id=\"science\"]")

  for (let i = 0; i < labelsToDelete.length; i++)
  {
    labelsToDelete[i].remove();
    inputsToDelete[i].remove();
  }

  // Remove the extra divs
  let toRemove = document.getElementsByClassName("tmpDiv");

  for (let i = 0; i < toRemove.length; i++)
  {
    toRemove[i].remove();
  }

}

/*************************************************************************
 * Description:
 *   This event listener will watch the grade. If they are in high school
 *   then it will add the 'College Info' section to fill out
 ************************************************************************/
const gradeElement = document.querySelector("#grade");
const options = document.querySelector("datalist[id=\"grades\"]").querySelectorAll("option");
let values = [];
for (let i = 0; i < options.length; i++) {
  values.push(options[i].value);
}

const gradeHandler = (event) =>
{
  if ((gradeElement.value == "9" || gradeElement.value == "10" || gradeElement.value == "11" || gradeElement.value == "12") && document.querySelector("label[for=\"takenACT\"]") == undefined)
  {
    addHighSchoolInfo();
  }
  else if (!(gradeElement.value == "9" || gradeElement.value == "10" || gradeElement.value == "11" || gradeElement.value == "12"))
  {
    removeHighSchoolInfo();
  }

}
gradeElement.addEventListener("keyup", gradeHandler); 
gradeElement.addEventListener("change", gradeHandler); 
});

const pageDiv = document.getElementById("pageDiv");
pageDiv.addEventListener("change", function(ele)
{
  target = ele.target;

  if (target.id == "takenACT" && target.checked == true)
  {
    addACTInfo();
  }
  else if (target.id == "takenACT")
  {
    removeACTInfo();
  }

});

/**
 * Description:
 *    This function will be called on form submission
 *    It will handle all functions needed to set up this new user
 */
function submitForm() {
  //reset the error message and input errors. disable the submit button
  document.getElementById("submitErrorMsg").textContent = "";
  document.getElementById("submit").disabled = true;
  let allInputs = document.getElementById("pageDiv").querySelectorAll("input");
  for (let i = 0; i < allInputs.length; i++) {
    allInputs[i].style.borderColor = null;
  }

  //validate the fields to make sure that everything is filled out
  let allClear = true;

  //check for completion
  allInputs = document.getElementById("pageDiv").querySelectorAll("input");
  for (let i = 0; i < allInputs.length; i++) {
    if (!validateInputCompletion(allInputs[i])) {
      allClear = false;
    }
  }


  //all input lists
  let inputLists = document.getElementById("pageDiv").querySelectorAll("input[list]");
  for (let i = 0; i < inputLists.length; i++) {
    let data = inputLists[i].list;
    let options = data.querySelectorAll("option");
    let values = [];
    for (let j = 0; j < options.length; j++) {
      values.push(options[j].value);
    }
    if (!validateInputList(inputLists[i], values)) {
      allClear = false;
    }
  }

  //all emails
  let inputEmails = document.getElementById("pageDiv").querySelectorAll("input[type='email']");
  for (let i = 0; i < inputEmails.length; i++) {
    if (!validateInputEmail(inputEmails[i])) {
      allClear = false;
    }

  }

  //all enforced inputs
  let inputEnforced = document.getElementById("pageDiv").querySelectorAll("input[maxlength]");
  for (let i = 0; i < inputEnforced.length; i++) {
    if (!validateEnforcedInput(inputEnforced[i])) {
      allClear = false;
    }
  }


  if (allClear) {
    //all the fields are filled out
    let formData = {};

    for (let i = 0; i < allInputs.length; i++) {
      if (allInputs[i].type != "checkbox") {
        formData[allInputs[i].id] = allInputs[i].value
      }
      else {
        formData[allInputs[i].id] = allInputs[i].checked.toString();
      }
    }
    console.log(formData);

    document.getElementById("submitErrorMsg").textContent = "";
    document.getElementById("submit").disabled = false;
  }
  else {
    //some fields are missing values
    document.getElementById("submitErrorMsg").textContent = "Please make sure that all fields are valid and completed";
    document.getElementById("submit").disabled = false;
  }
}

function validateInputCompletion(input) {
  if (input.value.trim() == "") {
    input.style.borderColor = "red";
    return false;
  }
  return true;
  
}

/**
 * Validate a input fields based on a given values
 * @param {html element} input - array of input elements that should be verified 
 * @param {array} values - array of strings that are acceptable values. Default is all values possible
 */
function validateInputList(input, values = []) {
  if (!values.includes(input.value.trim())) {
    input.style.borderColor = "red";
    return false;
  }
  return true;
}

function validateInputEmail(input) {
  if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()))) {
    input.style.borderColor = "red";
    return false;
  }
  return true;
}

function validateEnforcedInput(input) {
  if (input.value.length < Number(input.getAttribute("maxlength"))) {
    input.style.borderColor = "red";
    return false;
  }
  return true;
}

/*******************************************************************
* Description:
*   force format on telephones
*******************************************************************/

/**
 * Description:
 *   checks if the key event is a numeric input
 * @param {event} event javascript event
 */
const isNumericInput = (event) => {
	const key = event.keyCode;
	return ((key >= 48 && key <= 57) || // Allow number line
		(key >= 96 && key <= 105) // Allow number pad
	);
};

/**
 * Description:
 *   checks if the key event is an allowed modifying key
 * @param {event} event javascript event
 */
const isModifierKey = (event) => {
	const key = event.keyCode;
	return (event.shiftKey === true || key === 35 || key === 36) || // Allow Shift, Home, End
		(key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
		(key > 36 && key < 41) || // Allow left, up, right, down
		(
			// Allow Ctrl/Command + A,C,V,X,Z
			(event.ctrlKey === true || event.metaKey === true) &&
			(key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
		)
};

const enforceNumericFormat = (event) => {
	// Input must be of a valid number format or a modifier key, and not longer than ten digits
	if(!isNumericInput(event) && !isModifierKey(event)){
		event.preventDefault();
	}
};

const formatToPhone = (event) => {
	if(isModifierKey(event)) {return;}

	// I am lazy and don't like to type things more than once
	const target = event.target;
	const input = event.target.value.replace(/\D/g,'').substring(0,10); // First ten digits of input only
	const zip = input.substring(0,3);
	const middle = input.substring(3,6);
	const last = input.substring(6,10);

	if(input.length > 6){target.value = `(${zip})${middle}-${last}`;}
	else if(input.length > 3){target.value = `(${zip})${middle}`;}
	else if(input.length > 0){target.value = `(${zip}`;}
};

const formatToDate = (event) => {
	if(isModifierKey(event)) {return;}

	// I am lazy and don't like to type things more than once
	const target = event.target;
	const input = event.target.value.replace(/\D/g,'').substring(0,8); // First ten digits of input only
  let month = input.substring(0,2);
	let day = input.substring(2,4);
  let year = input.substring(4,8);
  
  //enforce proper months and day values
  if (Number(month) > 12) {
    month = "12";
  }
  if (Number(day) > 31) {
    day = "31"
  }

	if(input.length > 4){target.value = `${month}/${day}/${year}`;}
	else if(input.length > 2){target.value = `${month}/${day}`;}
	else if(input.length > 0){target.value = `${month}`;}
};

const formatToNumber = (event) => {
  if(isModifierKey(event)) {return;}

  const target = event.target;
  const min = Number(target.getAttribute("min"));
  const max = Number(target.getAttribute("max"));
  const input = Number(target.value).toString();

  //remove leading zeros

  if (input < min) {
    target.value = min; 
  }
  else if (input > max) {
    target.value = max;
  }
  else {
    target.value = input;
  }

}

const inputElement = document.getElementById('cellPhone');
inputElement.addEventListener('keydown',enforceNumericFormat);
inputElement.addEventListener('keyup',formatToPhone);

const inputZipcode = document.getElementById("zipCode");
inputZipcode.addEventListener('keydown',enforceNumericFormat);

const birthdayElem = document.getElementById("birthday");
birthdayElem.addEventListener('keydown',enforceNumericFormat);
birthdayElem.addEventListener('keyup',formatToDate);
