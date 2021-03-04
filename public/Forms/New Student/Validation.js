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
      input.parentNode.appendChild(createElement("p", "errorMessage", ["id"], [input.id + "ErrorMessage"], "* Please enter a valid email address *"));
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
      input.parentNode.appendChild(createElement("p", "errorMessage", ["id"], [input.id + "ErrorMessage"], "* Please enter a valid phone number *"));
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
      input.parentNode.appendChild(createElement("p", "errorMessage", ["id"], [input.id + "ErrorMessage"], "* Please enter a valid zip code *"));
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
      input.parentNode.appendChild(createElement("p", "errorMessage", ["id"], [input.id + "ErrorMessage"], "* please write all months, days, and years out *"));
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
      allInputs[i].parentNode.appendChild(createElement("p", "errorMessage", ["id"], [allInputs[i].id + "ErrorMessage"], "* Required *"));
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
  }

    // Create the student and parent dictionaries
  if (allClear) {
    for (let i = 0; i < allInputs.length; i++) {
      //student inputs
      if (!allInputs[i].id.includes("parent") && !allInputs[i].id.includes("actTest")) {
        if (allInputs[i].id.includes("Array")) {
          if (allInputs[i].parentNode.querySelector('label').getAttribute('for') in studentInfo) {
            studentInfo[allInputs[i].parentNode.querySelector('label').getAttribute('for')].push(allInputs[i].value)
          }
          else {
            studentInfo[allInputs[i].parentNode.querySelector('label').getAttribute('for')] = []
            studentInfo[allInputs[i].parentNode.querySelector('label').getAttribute('for')].push(allInputs[i].value)
          }
        }
        else {
          studentInfo[allInputs[i].id] = allInputs[i].value;
        }
      }

      //parent inputs
      if (!allInputs[i].id.includes("student") && !allInputs[i].id.includes("actTest")) {
        if (allInputs[i].id.includes("Array")) {
          if (allInputs[i].parentNode.querySelector('label').getAttribute('for') in parentInfo) {
            parentInfo[allInputs[i].parentNode.querySelector('label').getAttribute('for')].push(allInputs[i].value)
          }
          else {
            parentInfo[allInputs[i].parentNode.querySelector('label').getAttribute('for')] = []
            parentInfo[allInputs[i].parentNode.querySelector('label').getAttribute('for')].push(allInputs[i].value)
          }
        }
        else {
          parentInfo[allInputs[i].id] = allInputs[i].value;
        }
      }
    }

    //special case for actTest (will be added to the student data)
    let actTestArray = [];
    let actTestDivs = document.querySelectorAll("div[id^='actTest']");
    console.log(actTestDivs);
    for (let i = 0; i < actTestDivs.length; i++) {
      let actTest = {}
      actTest["date"] = actTestDivs[i].querySelector("input[id*='Date']").value;
      actTest["english"] = actTestDivs[i].querySelector("input[id*='English']").value;
      actTest["math"] = actTestDivs[i].querySelector("input[id*='Math']").value;
      actTest["reading"] = actTestDivs[i].querySelector("input[id*='Reading']").value;
      actTest["science"] = actTestDivs[i].querySelector("input[id*='Science']").value;
      actTestArray.push(actTest);
    }
    studentInfo["studentActTests"] = actTestArray;
  }

    console.log(studentInfo);
    console.log(parentInfo);
}