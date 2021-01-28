/*********************************************************************
 * Description:
 *   This will add a new sibling + age label and input tag
 ********************************************************************/
function addSibling()
{
    // Count how many siblings are there already and create their id: siblingName and siblingAge
    let siblings = document.querySelectorAll("label[for^=\"sibling\"]");
    let siblingCount = siblings.length / 2;
    let siblingName = "sibling" + String(siblingCount);
    let siblingAge  = "siblingAge" + String(siblingCount);



    // This will hold all of the label and input tags to iterate through
    let siblingArray = [];
    


    // Create the new labels and inputs
    let siblingLabel = document.createElement("label")
    siblingLabel.setAttribute("for", "sibling" + String(siblingCount + 1))
    siblingLabel.innerHTML = "Sibling:"
    siblingLabel.className = "label"
    siblingArray.push(siblingLabel);

    let siblingInput = document.createElement("input")
    siblingInput.setAttribute("id", "sibling" + String(siblingCount + 1))
    siblingInput.className = "input"
    siblingArray.push(siblingInput);

    let siblingAgeLabel = document.createElement("label")
    siblingLabel.setAttribute("for", "siblingAge" + String(siblingCount + 1))
    siblingAgeLabel.innerHTML = "Age:"
    siblingAgeLabel.className = "label"
    siblingArray.push(siblingAgeLabel);

    let siblingAgeInput = document.createElement("input")
    siblingAgeInput.setAttribute("id", "siblingAge" + String(siblingCount + 1))
    siblingAgeInput.className = "input"
    siblingArray.push(siblingAgeInput);



    // Add the sibling labels and tags to their div
    let siblingDiv = document.createElement("div");
    siblingDiv.className = "inline"
    for (let i = 0; i < siblingArray.length; i++)
    {
        siblingDiv.appendChild(siblingArray[i])
    }

    console.log(siblingDiv);

    // Find the Add button and insert the new sibling labels and inputs before it
    let location = document.getElementById("addSiblingButton");
    location.parentNode.insertBefore(siblingDiv, location);

}

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
  if (validateFields()) {
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
    document.getElementById("submitErrorMsg").textContent = "Please fill in all of the fields";
    document.getElementById("submit").disabled = false;
  }
  
}

/**
 * Description:
 *    Check whether all of the fields have been filled out
 * @param return returns boolean based on if the fields are filled out
 */
function validateFields() {
  let allClear = true;
  let allGeneralInputs = document.getElementById("generalInfoDiv").querySelectorAll("input");

  //run through each input element in the genralInfoDiv and check if it is filled out
  for (let i = 0; i < allGeneralInputs.length; i++) {
    if (allGeneralInputs[i].value.trim() == "") {
      allGeneralInputs[i].style.borderColor = "red";
      allClear = false;
    }
  }

  //if the takenACT checkbox is checked then validate its fields
  if (document.getElementById("takenACT").checked) {
    let allActInputs = document.getElementById("actDiv").querySelectorAll("input");

    //run through each input element in the actDiv (except the first one) and check if it is filled out
    for (let i = 1; i < allActInputs.length; i++) {
      if (allActInputs[i].value.trim() == "") {
        allActInputs[i].style.borderColor = "red";
        allClear = false;
      }
    }
  }

  //if the highschool div is shown then validate its fields
  if (document.getElementById("highSchoolDiv").style.display != "none") {
    let allHighSchoolInputs = document.getElementById("highSchoolDiv").querySelectorAll("input");

    //run through each input element in the highSchoolDiv and check if it is filled out
    for (let i = 0; i < allHighSchoolInputs.length; i++) {
      if (allHighSchoolInputs[i].value.trim() == "") {
        allHighSchoolInputs[i].style.borderColor = "red";
        allClear = false;
      }
    }
  }

  return allClear;
}
