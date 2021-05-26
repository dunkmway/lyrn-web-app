function validateInputCompletion(input) {
  //only required fields

  if (input.hasAttribute('required') && !input.value.trim()) {
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
  if (input.value != "") {
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
  return true;
}

function validateInputPhoneNumbers(input) {
  if (input.value != "") {
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
  return true;
}

function validateInputZipCode(input) {
  if (input.value != "") {
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
  return true;
}

function validateInputBirthday(input) {
  if (input.value != "") {
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
  return true;
}

function submit() {
  document.getElementById("errMsg").textContent = "";
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (role == 'dev' || role == 'admin') {
          submitData();
        }
        else {
          document.getElementById("errMsg").textContent = "Whoa there partner! You need to saddle on over to the update button instead.";
        }
      })
    }
  });
}

function submitData() {
  if (isFormValid()) {
    updateData()
    .then(() => {
      var GET = {};
      var queryString = window.location.search.replace(/^\?/, '');
      queryString.split(/\&/).forEach(function(keyValuePair) {
        var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
        var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
        GET[paramName] = paramValue;
      });

      const studentUID = GET["student"];
      const location = GET["location"];

      moveToLocationActive(location, studentUID)
      .then(() => {
        goToDashboard();
        let loadingBlocks = document.getElementsByClassName("spinnyBoi");
        for (let i = 0; i < loadingBlocks.length; i ++) {
          loadingBlocks[i].style.display = "none";
        }
        let submitButtons = document.getElementsByClassName("submitButton");
        for (let i = 0; i < submitButtons.length; i ++) {
          submitButtons[i].disabled = false;
        }
      })
      .catch((error) => {
        //handleFirebaseErrors(error, document.currentScript.src);
        document.getElementById("errMsg").textContent = error.message;
        let loadingBlocks = document.getElementsByClassName("spinnyBoi");
        for (let i = 0; i < loadingBlocks.length; i ++) {
          loadingBlocks[i].style.display = "none";
        }
        let submitButtons = document.getElementsByClassName("submitButton");
        for (let i = 0; i < submitButtons.length; i ++) {
          submitButtons[i].disabled = false;
        }
      });
    })
    .catch((error) => {
      //handleFirebaseErrors(error, document.currentScript.src);
      document.getElementById("errMsg").textContent = error.message;
      let loadingBlocks = document.getElementsByClassName("spinnyBoi");
      for (let i = 0; i < loadingBlocks.length; i ++) {
        loadingBlocks[i].style.display = "none";
      }
      let submitButtons = document.getElementsByClassName("submitButton");
      for (let i = 0; i < submitButtons.length; i ++) {
        submitButtons[i].disabled = false;
      }
    });
  }
}

function isFormValid() {
  let allInputs = document.querySelectorAll("input, select");

  //validate the fields to make sure that everything is filled out
  let allClear = true;

  //check for completion
  for (let i = 0; i < allInputs.length; i++) {
    if(allInputs[i].hasAttribute("required") && allInputs[i].value == "") {
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
  }

  return allClear;
}

function update() {
  updateData()
  .then(() => {
    goToDashboard();
    let loadingBlocks = document.getElementsByClassName("spinnyBoi");
    for (let i = 0; i < loadingBlocks.length; i ++) {
      loadingBlocks[i].style.display = "none";
    }
    let submitButtons = document.getElementsByClassName("submitButton");
    for (let i = 0; i < submitButtons.length; i ++) {
      submitButtons[i].disabled = false;
    }
  })
  .catch((error) => {
    //handleFirebaseErrors(error, document.currentScript.src);
    document.getElementById("errMsg").textContent = error.message;
    let loadingBlocks = document.getElementsByClassName("spinnyBoi");
    for (let i = 0; i < loadingBlocks.length; i ++) {
      loadingBlocks[i].style.display = "none";
    }
    let submitButtons = document.getElementsByClassName("submitButton");
    for (let i = 0; i < submitButtons.length; i ++) {
      submitButtons[i].disabled = false;
    }
  });
}

function updateData() {
  //reset the error message and input errors. disable the submit button
  document.getElementById("errMsg").textContent = "";
  let allInputs = document.querySelectorAll("input, select");
  let errorMessages = document.querySelectorAll(".errorMessage");
  let loadingBlocks = document.getElementsByClassName("spinnyBoi");
  for (let i = 0; i < loadingBlocks.length; i ++) {
    loadingBlocks[i].style.display = "block";
  }
  let submitButtons = document.getElementsByClassName("submitButton");
  for (let i = 0; i < submitButtons.length; i ++) {
    submitButtons[i].disabled = true;
  }

  for (let i = errorMessages.length - 1; i >= 0; i--) {
      errorMessages[i].remove()
  }

  // Dictionaries to hold firebase info
  let studentInfo = {};
  let parentInfo = {};

  // Create the student and parent dictionaries

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



  //update the pending data for this location
  var GET = {};
  var queryString = window.location.search.replace(/^\?/, '');
  queryString.split(/\&/).forEach(function(keyValuePair) {
    var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
    var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
    GET[paramName] = paramValue;
  });

  const studentUID = GET["student"];
  const parentUID = GET["parent"];
  const location = GET["location"];

  //update the parent doc
  let parentProm = updateParentDoc(parentUID, parentInfo);

  //update student doc
  let studentProm = updateStudentDoc(studentUID, studentInfo);
  //update student email
  let studentEmail = studentInfo['studentEmail'];
  let emailProm;
  if (studentEmail) {
    const updateUserEmail = firebase.functions().httpsCallable('updateUserEmail');
    emailProm = updateUserEmail({
      uid: studentUID,
      email : studentEmail,
    })
  }

  //update location doc
  let studentFirstName = studentInfo["studentFirstName"];
  let studentLastName =studentInfo["studentLastName"];
  let parentFirstName = parentInfo["parentFirstName"];
  let parentLastName = parentInfo["parentLastName"];

  let locationProm = updateLocationPending(location, studentUID, 'act', studentFirstName, studentLastName, parentUID, parentFirstName, parentLastName);

  let studentDisplayNameProm;
  if (studentFirstName) {
    const updateUserDisplayName = firebase.functions().httpsCallable('updateUserDisplayName');
    studentDisplayNameProm = updateUserDisplayName({
      uid: studentUID,
      displayName: studentFirstName + " " + studentLastName 
    })
  }
  let parentDisplayNameProm;
  if (parentFirstName) {
    const updateUserDisplayName = firebase.functions().httpsCallable('updateUserDisplayName');
    parentDisplayNameProm = updateUserDisplayName({
      uid: parentUID,
      displayName: parentFirstName + " " + parentLastName 
    })
  }

  //wait for all promises to resolve
  let promises = [parentProm, studentProm, emailProm, locationProm, studentDisplayNameProm, parentDisplayNameProm];
  return Promise.all(promises)
}

function updateStudentDoc(studentUID, studentData) {
  const studentDocRef = firebase.firestore().collection("Students").doc(studentUID);
  return studentDocRef.update(studentData);
}

function updateParentDoc(parentUID, parentData) {
  const parentDocRef = firebase.firestore().collection("Parents").doc(parentUID);
  return parentDocRef.update(parentData)
}

function updateLocationPending(locationUID, studentUID, studentType, studentFirstName, studentLastName, parentUID, parentFirstName, parentLastName) {
  const locationDocRef = firebase.firestore().collection("Locations").doc(locationUID);
  let pendingStudent = {
    studentType : studentType,
    studentFirstName : studentFirstName,
    studentLastName : studentLastName,
    parentUID: parentUID,
    parentFirstName: parentFirstName,
    parentLastName: parentLastName
  }
  return locationDocRef.update({
    [`pendingStudents.${studentUID}`]: pendingStudent
  })
}

function moveToLocationActive(locationUID, studentUID) {
  const locationDocRef = firebase.firestore().collection("Locations").doc(locationUID);
  return locationDocRef.get()
  .then((doc) => {
    data = doc.data();
    let student = data['pendingStudents'][studentUID];

    return locationDocRef.update({
      [`pendingStudents.${studentUID}`]: firebase.firestore.FieldValue.delete(),
      [`activeStudents.${studentUID}`]: student
    })
  })
}

function goToDashboard() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;

        switch (role) {
          case "student":
            window.location.replace(location.origin + "/Dashboard/Student");
            break;
          case "parent":
            window.location.replace(location.origin + "/Dashboard/Parent");
            break;
          case "tutor":
            window.location.replace(location.origin + "/Dashboard/Tutor");
            break;
          case "secretary":
            window.location.replace(location.origin + "/Dashboard/Secretary");
            break;
          case "admin":
            window.location.replace(location.origin + "/Dashboard/Admin");
            break;
          case "dev":
            window.location.replace(location.origin + "/Dashboard/Admin");
            break;
          default:
            
        }
      })
      .catch((error) => {
        handleFirebaseErrors(error, document.currentScript.src);
      });
    }
    else {
      window.location.replace(location.origin + "/Sign-In/Sign-In");
    }
  });
}