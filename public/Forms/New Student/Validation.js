function validateInputCompletion(input) {
  if (input.value.trim() == "") {
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
    let error = document.getElementById(input.id + "ErrorMessage")
    if (error != null) {
      error.innerHTML = "* Please enter a valid email address *"
    }
    else {
      input.parentNode.appendChild(ele = createElement("p", "errorMessage", ["id"], [input.id + "ErrorMessage"], "* Please enter a valid email address *"));
    }
    return false;
  }
  return true;
}

function validateInputPhoneNumbers(input) {
  if (input.value.length != 14) {
    let error = document.getElementById(input.id + "ErrorMessage")
    if (error != null) {
      error.innerHTML = "* Please enter a valid phone number *"
    }
    else {
      input.parentNode.appendChild(ele = createElement("p", "errorMessage", ["id"], [input.id + "ErrorMessage"], "* Please enter a valid phone number *"));
    }
    return false;
  }
  return true;
}

function validateInputZipCode(input) {
  if (input.value.length != 5) {
    let error = document.getElementById(input.id + "ErrorMessage")
    if (error != null) {
      error.innerHTML = "* Please enter a valid zip code *"
    }
    else {
      input.parentNode.appendChild(ele = createElement("p", "errorMessage", ["id"], [input.id + "ErrorMessage"], "* Please enter a valid zip code *"));
    }
    return false;
  }
  return true;
}

function validateInputBirthday(input) {
  if (input.value.length != 10) {
    let error = document.getElementById(input.id + "ErrorMessage")
    if (error != null) {
      error.innerHTML = "* Please write all months, days, and years out *"
    }
    else {
      input.parentNode.appendChild(ele = createElement("p", "errorMessage", ["id"], [input.id + "ErrorMessage"], "* please write all months, days, and years out *"));
    }
    return false;
  }
  return true;
}

function submit() {
  //reset the error message and input errors. disable the submit button
  let allInputs = document.querySelectorAll("input, select");
  let errorMessages = document.querySelectorAll(".errorMessage");

  for (let i = errorMessages.length - 1; i >= 0; i--) {
      errorMessages[i].remove()
  }

  //validate the fields to make sure that everything is filled out
  let allClear = true;

  // Dictionaries to hold firebase info
  let studentInfo = {};
  let parentInfo = {};

  //check for completion
  for (let i = 0; i < allInputs.length; i++) {
    // Make sure nothing is left empty
    if (!validateInputCompletion(allInputs[i])) {
      allInputs[i].parentNode.appendChild(ele = createElement("p", "errorMessage", ["id"], [allInputs[i].id + "ErrorMessage"], "* Required *"));
      allClear = false;
    }

    // Validate Emails
    if (allInputs[i].id.includes("Email")) {
      if (validateInputEmail(allInputs[i]) == false) {
        allClear = false;
      }
    }

    // Validate phoneNumbers
    if (allInputs[i].id.includes("PhoneNumber")) {
      if (validateInputPhoneNumbers(allInputs[i]) == false) {
        allClear = false;
      }
    }

    if (allInputs[i].id.includes("birthday")) {
      if (validateInputBirthday(allInputs[i]) == false) {
        allClear = false;
      }
    }

    if (allInputs[i].id.includes("zipCode")) {
      if (validateInputZipCode(allInputs[i]) == false) {
        allClear = false;
      }
    }

    // Create the student and parent dictionaries
    for (let i = 0; i < allInputs.length; i++) {
      if (!allInputs[i].id.includes("parent")) {
        studentInfo[allInputs[i].id] = allInputs[i].value;
      }

      if (!allInputs[i].id.includes("student")) {
        parentInfo[allInputs[i].id] = allInputs[i].value;
      }

    }

  }

    console.log(studentInfo);
    console.log(parentInfo);
  //allInputs[0].parentNode.appendChild(ele = createElement("p", "errorMessage", [], [], "* Required *"));
/*
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
*/

  if (allClear) {
    //all the fields are filled out
    let formData = {};
    let siblings = [];

    for (let i = 0; i < allInputs.length; i++) {
      if (allInputs[i].type != "checkbox") {
        formData[allInputs[i].id] = allInputs[i].value
      }
      else if(allInputs[i].type == "checkbox") {
        formData[allInputs[i].id] = allInputs[i].checked.toString();
      }
    }
    console.log(formData);
  }
}