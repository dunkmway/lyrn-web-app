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
    //console.log(actTestDivs);
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

    //create the student account
    const addUser = firebase.functions().httpsCallable('addUser');
    addUser({
      email: studentInfo['studentEmail'],
      password: "abc123",
      role: "student"
    })
    .then((result) => {
      let studentUID = result.data.user.uid;
      let newUser = result.data.newUser;
      //console.log(studentUID);
      //console.log(newUser);

      if (newUser) {
        var GET = {};
        var queryString = window.location.search.replace(/^\?/, '');
        queryString.split(/\&/).forEach(function(keyValuePair) {
        var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
        var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
        GET[paramName] = paramValue;
        });

        const studentTempUID = GET["student"];
        const parentUID = GET["parent"];
        const location = GET["location"];

        //set up the student doc
        let studentDocRef = firebase.firestore().collection("Students").doc(studentUID);
        let studentDocData = {
          ...studentInfo,
          // role: "student",
          parent: parentUID,
          location: location
        }
        let studentProm = studentDocRef.set(studentDocData)
        .then((result) => {
          // console.log("student document successfully written!");
          // console.log(result);
        })
        .catch((error) => {
          handleFirebaseErrors(error);
          document.getElementById("errMsg").textContent = error.message;
        });

        //update the active student object for this location
        const locationDocRef = firebase.firestore().collection("Locations").doc(location);
        let activeStudent = {
          studentFirstName: studentInfo["studentFirstName"],
          studentLastName: studentInfo["studentLastName"],
          parentUID: parentUID,
          parentFirstName: parentInfo["parentFirstName"],
          parentLastName: parentInfo["parentLastName"]
        }
        let locationProm = locationDocRef.update({
          [`activeStudents.${studentUID}`]: activeStudent,
          [`pendingStudents.${studentTempUID}`]: firebase.firestore.FieldValue.delete()
        })
        .then((result) => {
          // console.log("location document successfully written!");
          // console.log(result);
        })
        .catch((error) => {
          handleFirebaseErrors(error);
          document.getElementById("errMsg").textContent = error.message;
        });

        //update the parent doc
        const parentDocRef = firebase.firestore().collection("Parents").doc(parentUID);
        parentDocData = {
          ...parentInfo,
          [`active.${studentUID}`]: {
            studentFirstName: studentInfo["studentFirstName"],
            studentLastName: studentInfo["studentLastName"]
          },
          [`pending.${studentTempUID}`]: firebase.firestore.FieldValue.delete()
        }
        let parentProm = parentDocRef.update(parentDocData)
        .then((result) => {
          // console.log("parent document successfully written!");
          // console.log(result);
        })
        .catch((error) => {
          handleFirebaseErrors(error);
          document.getElementById("errMsg").textContent = error.message;
        });

        //delete the location pending doc
        const pendingDocRef = firebase.firestore().collection("Locations").doc(location).collection("Pending").doc(studentTempUID);
        let pendingProm = pendingDocRef.delete()
        .then((result) => {
          // console.log("pending document successfully deleted!");
          // console.log(result);
        })
        .catch((error) => {
          handleFirebaseErrors(error);
          document.getElementById("errMsg").textContent = error.message;
        });

        //verify that all promises have resolved
        let promises = [studentProm ,parentProm, pendingProm, locationProm];
        Promise.all(promises)
        .then(() => {
          // console.log("data successfully submitted")
          goToDashboard();
        })
        .catch((error) => {
          handleFirebaseErrors(error);
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
      else {
        //the student already exists
        document.getElementById("errMsg").textContent = "This student already exists!";
        let loadingBlocks = document.getElementsByClassName("spinnyBoi");
        for (let i = 0; i < loadingBlocks.length; i ++) {
          loadingBlocks[i].style.display = "none";
        }
        let submitButtons = document.getElementsByClassName("submitButton");
        for (let i = 0; i < submitButtons.length; i ++) {
          submitButtons[i].disabled = false;
        }
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error);
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
  else {
    //validation failed
    let loadingBlocks = document.getElementsByClassName("spinnyBoi");
    for (let i = 0; i < loadingBlocks.length; i ++) {
      loadingBlocks[i].style.display = "none";
    }
    let submitButtons = document.getElementsByClassName("submitButton");
    for (let i = 0; i < submitButtons.length; i ++) {
      submitButtons[i].disabled = false;
    }
  }

  
}

function update() {
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

  //validate the fields to make sure that everything is filled out
  let allClear = true;

  // Dictionaries to hold firebase info
  let studentInfo = {};
  let parentInfo = {};

  //check for completion
  for (let i = 0; i < allInputs.length; i++) {
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
    // console.log(actTestDivs);
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

    const studentTempUID = GET["student"];
    const parentUID = GET["parent"];
    const location = GET["location"];

    //set up the parent doc
    const parentDocRef = firebase.firestore().collection("Parents").doc(parentUID);
    parentDocData = {
      ...parentInfo,
      [`pending.${studentTempUID}`]: {
        studentFirstName: studentInfo["studentFirstName"],
        studentLastName: studentInfo["studentLastName"]
      }
    }
    let parentProm = parentDocRef.update(parentDocData)
    .then((result) => {
      // console.log("parent document successfully written!");
      // console.log(result);
    })
    .catch((error) => {
      handleFirebaseErrors(error);
      document.getElementById("errMsg").textContent = error.message;
    });

    //set up the location pending doc
    const pendingDocRef = firebase.firestore().collection("Locations").doc(location).collection("Pending").doc(studentTempUID);
    pendingData = {
      ...parentInfo,
      ...studentInfo,
      lastModifiedDate: (new Date().getTime())
    }
    let pendingProm = pendingDocRef.update({
      ...pendingData
    })
    .then((result) => {
      // console.log("pending document successfully written!");
      // console.log(result);
    })
    .catch((error) => {
      handleFirebaseErrors(error);
      document.getElementById("errMsg").textContent = error.message;
    });

    //update location pending student array
    const locationDocRef = firebase.firestore().collection("Locations").doc(location);
    let pendingStudent = {
      studentFirstName: studentInfo["studentFirstName"],
      studentLastName: studentInfo["studentLastName"],
      parentUID: parentUID,
      parentFirstName: parentInfo["parentFirstName"],
      parentLastName: parentInfo["parentLastName"]
    }
    let locationProm = locationDocRef.update({
      [`pendingStudents.${studentTempUID}`]: pendingStudent
    })
    .then((result) => {
      // console.log("location document successfully written!");
      // console.log(result);
    })
    .catch((error) => {
      handleFirebaseErrors(error);
      document.getElementById("errMsg").textContent = error.message;
    });

    let promises = [parentProm, pendingProm, locationProm];
    Promise.all(promises)
    .then(() => {
      // console.log("data successfully updated")
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
      handleFirebaseErrors(error);
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
  else {
    //validation failed
    let loadingBlocks = document.getElementsByClassName("spinnyBoi");
      for (let i = 0; i < loadingBlocks.length; i ++) {
        loadingBlocks[i].style.display = "none";
      }
    let submitButtons = document.getElementsByClassName("submitButton");
    for (let i = 0; i < submitButtons.length; i ++) {
      submitButtons[i].disabled = false;
    }
  }
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
        handleFirebaseErrors(error);
      });
    }
    else {
      window.location.replace(location.origin + "/Sign-In/Sign-In");
    }
  });
}