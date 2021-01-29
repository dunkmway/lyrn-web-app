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
  siblingInput.setAttribute("type", "text" + String(siblingCount + 1))
  siblingInput.className = "input input2"
  siblingArray.push(siblingInput);

  let siblingAgeLabel = document.createElement("label")
  siblingAgeLabel.setAttribute("for", "siblingAge" + String(siblingCount + 1))
  siblingAgeLabel.innerHTML = "Age:"
  siblingAgeLabel.className = "label label2"
  siblingArray.push(siblingAgeLabel);

  let siblingAgeInput = document.createElement("input")
  siblingAgeInput.setAttribute("id", "siblingAge" + String(siblingCount + 1))
  siblingAgeInput.setAttribute("type", "number" + String(siblingCount + 1))
  siblingAgeInput.setAttribute("min", "1" + String(siblingCount + 1))
  siblingAgeInput.setAttribute("max", "36" + String(siblingCount + 1))
  siblingAgeInput.className = "input input2"
  siblingArray.push(siblingAgeInput);



  // Add the sibling labels and tags to their div
  let siblingDiv = document.createElement("div");
  siblingDiv.className = "inline"
  for (let i = 0; i < siblingArray.length; i++) {
    siblingDiv.appendChild(siblingArray[i])
  }

  // Find the Add button and insert the new sibling labels and inputs before it
  let location = document.getElementById("addSiblingButton");
  location.parentNode.insertBefore(siblingDiv, location);

}


/*************************************************************************
 * Description:
 *   This will remove the last sibling + age label and input elements
 ************************************************************************/
function removeSibling() {
  let siblings = document.querySelectorAll("label[for^=\"sibling\"], input[id^=\"sibling\"]");
  if (siblings.length > 4) {
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

  let child3 = document.createElement("label");
  child3.setAttribute("for", "actDate");
  child3.className = "label label2";
  child3.innerHTML = "Date Taken:";
  parentNode.appendChild(child3);

  let child4 = document.createElement("input");
  child4.setAttribute("type", "date");
  child4.setAttribute("id", "actDate");
  child4.className = "input input2";
  parentNode.appendChild(child4);
  parentNode.append(document.createElement("div"));



  let child5 = document.createElement("label");
  child5.setAttribute("for", "english");
  child5.className = "label label2";
  child5.innerHTML = "English:";
  parentNode.appendChild(child5);

  let child6 = document.createElement("input");
  child6.setAttribute("type", "number");
  child6.setAttribute("min", "1");
  child6.setAttribute("max", "36");
  child6.setAttribute("id", "english");
  child6.className = "input input2 smallBox";
  parentNode.appendChild(child6);

  let child7 = document.createElement("label");
  child7.setAttribute("for", "math");
  child7.className = "label label2";
  child7.innerHTML = "Math:";
  parentNode.appendChild(child7);

  let child8 = document.createElement("input");
  child8.setAttribute("type", "number");
  child8.setAttribute("min", "1");
  child8.setAttribute("max", "36");
  child8.setAttribute("id", "math");
  child8.className = "input input2 smallBox";
  parentNode.appendChild(child8);

  let child9 = document.createElement("label");
  child9.setAttribute("for", "reading");
  child9.className = "label label2";
  child9.innerHTML = "Reading:";
  parentNode.appendChild(child9);

  let child10 = document.createElement("input");
  child10.setAttribute("type", "number");
  child10.setAttribute("min", "1");
  child10.setAttribute("max", "36");
  child10.setAttribute("id", "reading");
  child10.className = "input input2 smallBox";
  parentNode.appendChild(child10);

  let child11 = document.createElement("label");
  child11.setAttribute("for", "science");
  child11.className = "label label2";
  child11.innerHTML = "Science:";
  parentNode.appendChild(child11);

  let child12 = document.createElement("input");
  child12.setAttribute("type", "number");
  child12.setAttribute("min", "1");
  child12.setAttribute("max", "36");
  child12.setAttribute("id", "science");
  child12.className = "input input2 smallBox";
  parentNode.appendChild(child12);
  parentNode.append(document.createElement("div"));



  let child13 = document.createElement("label");
  child13.setAttribute("for", "actGoalDate");
  child13.className = "label label2";
  child13.innerHTML = "Goal ACT Date:";
  parentNode.appendChild(child13);

  let child14 = document.createElement("input");
  child14.setAttribute("type", "date");
  child14.setAttribute("id", "actGoalDate");
  child14.className = "input input2";
  parentNode.appendChild(child14);

  let child15 = document.createElement("label");
  child15.setAttribute("for", "actGoalScore");
  child15.className = "label label2";
  child15.innerHTML = "Goal ACT Score:";
  parentNode.appendChild(child15);

  let child16 = document.createElement("input");
  child16.setAttribute("type", "number");
  child16.setAttribute("min", "1");
  child16.setAttribute("max", "36");
  child16.setAttribute("id", "actGoalScore");
  child16.className = "input input2";
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

const gradeElement = document.querySelector("#grade");
gradeElement.addEventListener("change", (event) =>
{
  if ((gradeElement.value == "9" || gradeElement.value == "10" || gradeElement.value == "11" || gradeElement.value == "12") && document.querySelector("label[for=\"takenACT\"]") == undefined)
  {
    addHighSchoolInfo();
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
// FIXME: create another check that verifies that numbers are the appropriate values
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
  if (document.getElementById("actDiv")) {
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
  }

  //if the highschool div is shown then validate its fields
  if (document.getElementById("highSchoolDiv")) {
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
  }
  

  return allClear;
}
