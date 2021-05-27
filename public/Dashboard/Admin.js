let currentLocations = [];
let currentLocationNames = [];
let currentUser = ""

initialSetupData();

function initialSetupData() {
  firebase.auth().onAuthStateChanged(function(user) {
    currentUser = user;
    if (currentUser) {
      // User is signed in.
      getAdminProfile(currentUser.uid)
      .then((doc) => {
        if (doc.exists) {
          setAdminProfile(doc.data());
          setStudentTable()
          .then(() => setLocations())
        }
        else setAdminProfile();
      })

    } else {
      // No user is signed in.
    }
  });
}

function getAdminProfile(adminUID) {
  const adminProfileRef = firebase.firestore().collection("Admins").doc(adminUID);
  return adminProfileRef.get();
}

function setAdminProfile(profileData = {}) {
  currentLocations = profileData['locations'];
  // console.log(currentLocations);

  if (profileData['adminFirstName'] && profileData['adminLastName']) {
    document.getElementById('admin-name').textContent = "Welcome " + profileData['adminFirstName'] + " " + profileData['adminLastName'] + "!";
  }
  else {
    document.getElementById('admin-name').textContent = "Welcome Admin!";
  }
}

function setStudentTable() {
  let tableData = [];
  let promises = []
  for (let i = 0; i < currentLocations.length; i++) {
    const locationDocRef = firebase.firestore().collection("Locations").doc(currentLocations[i])
    let locationProm = locationDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        let locationName = doc.get("locationName");
        currentLocationNames.push(locationName);
        //document.getElementById("locationName").textContent = locationName;

        let pendingStudents = doc.get("pendingStudents");
        let activeStudents = doc.get("activeStudents");

        // console.log(pendingStudents);
        // console.log(activeStudents);

        //for the table

        if (pendingStudents) {
          for (const studentUID in pendingStudents) {
            const student = {
              ...pendingStudents[studentUID],
              studentUID: studentUID,
              status: "pending",
              location: locationName,
              locationUID: currentLocations[i]
            }
            //adjust type to be readable
            if (student.studentType == 'act') {
              student.studentType = 'ACT'
            }
            else if (student.studentType == 'subject-tutoring') {
              student.studentType = 'ST'
            }
            else if (student.studentType == 'math-program') {
              student.studentType = 'Math Program'
            }
            else if (student.studentType == 'phonics-program') {
              student.studentType = 'Phonics Program'
            }
            else {
              student.studentType == "";
            }

            //adjust name to be last, first
            student.studentName = student.studentLastName + ", " + student.studentFirstName
            student.parentName = student.parentLastName + ", " + student.parentFirstName

            tableData.push(student);
          }
        }

        if (activeStudents) {
          for (const studentUID in activeStudents) {
            const student = {
              ...activeStudents[studentUID],
              studentUID: studentUID,
              status: "active",
              location: locationName,
              locationUID: currentLocations[i]
            }
            //adjust type to be readable
            if (student.studentType == 'act') {
              student.studentType = 'ACT'
            }
            else if (student.studentType == 'subject-tutoring') {
              student.studentType = 'ST'
            }
            else if (student.studentType == 'math-program') {
              student.studentType = 'Math Program'
            }
            else if (student.studentType == 'phonics-program') {
              student.studentType = 'Phonics Program'
            }
            else {
              student.studentType == "";
            }

            //adjust name to be last, first
            student.studentName = student.studentLastName + ", " + student.studentFirstName
            student.parentName = student.parentLastName + ", " + student.parentFirstName

            tableData.push(student);
          }
        }
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
    });

    promises.push(locationProm);
  }
  
  return Promise.all(promises)
  .then(() => {
    // console.log("tableData", tableData);
    let studentTable = $('#student-table').DataTable( {
      data: tableData,
      columns: [
        { data: 'studentName' },
        { data: 'studentType'},
        { data: 'location'},
        { data: 'status' },
        { data: 'parentName'},
      ],
      "scrollY": "400px",
      "scrollCollapse": true,
      "paging": false
    } );

    studentTable.on('click', (args) => {
      //this should fix some "cannot read property of undefined" errors
      if (args?.target?._DT_CellIndex) {
        let studentUID = tableData[args.target._DT_CellIndex.row].studentUID;
        let parentUID = tableData[args.target._DT_CellIndex.row].parentUID;
        let location = tableData[args.target._DT_CellIndex.row].locationUID;
        let status = tableData[args.target._DT_CellIndex.row].status;
        let type = tableData[args.target._DT_CellIndex.row].studentType;

        switch (status) {
          case "pending":
            if (type == 'ACT') {
              pendingStudentSelected(studentUID, parentUID, location);
            }
            else {
              alert("nothing to see here...yet")
            }
            break;
          case "active":
            if (type == 'ACT') {
              actStudentSelected(studentUID);
            }
            else if (type == 'ST') {
              subjectTutoringStudentSelected(studentUID);
            }
            //FIXME: these will need to be redirected to the proper page once we have them
            else if (type == 'Math Program') {
              mathProgramSelected(studentUID);
            }
            else if (type == 'Phonics Program') {
              phonicsProgramSelected(studentUID);
            }
            else {
              alert("nothing to see here...yet")
            }
            break;
          default:
            console.log("ERROR: This student isn't active or pending!!!")
        }
      }
    });
  })
  .catch((error) => {
    handleFirebaseErrors(error, window.location.href);
  });
  
}

function setLocations () {
  const locationElems = document.querySelectorAll("select[id*=Location]");
  for (let i = 0; i < locationElems.length; i++) {
    let locationElem = locationElems[i];
    for (let j =  0; j < currentLocations.length; j++) {
      let option = document.createElement("option");
      option.value = currentLocations[j];
      option.innerText = currentLocationNames[j]
      locationElem.appendChild(option);
    }
  }
  
}



function goToInquiry() {
  window.location.href = "../inquiry.html";
}

function popUpUser(user) {
  document.getElementById("add-" + user + "-section").style.display = "flex";
}

function closeUser(user, submitted = false) {
  let allInputs = document.getElementById("add-" + user + "-section").querySelectorAll("input, select");
  let allClear = true;
  for(let i = 0; i < allInputs.length; i++) {
    if (allInputs[i].value != "") {
      allClear = false;
      break;
    }
  }

  if (!allClear && !submitted) {
    let confirmation = confirm("This " + user + " has not been saved.\nAre you sure you want to go back?");
    if (confirmation) {
      for(let i = 0; i < allInputs.length; i++) {
        allInputs[i].value = "";
      }
      document.getElementById("add-" + user + "-section").style.display = "none";
      let errorMessages = document.querySelectorAll("p[id$='ErrorMessage']");

      for (let err = errorMessages.length - 1; err >= 0; err--) {
        errorMessages[err].remove()
      }
    }
  }
  else {
    for(let i = 0; i < allInputs.length; i++) {
      allInputs[i].value = "";
    }
    document.getElementById("add-" + user + "-section").style.display = "none";
    let errorMessages = document.querySelectorAll("p[id$='ErrorMessage']");

    for (let err = errorMessages.length - 1; err >= 0; err--) {
      errorMessages[err].remove()
    }
  }
}

function createTutor() {
  document.getElementById("spinnyBoiTutor").style.display = "block";
  let allInputs = document.getElementById("add-tutor-section").querySelectorAll("input");

  if (validateFields([...allInputs, document.getElementById("tutorLocation")])) {
    // console.log("all clear");
    let allInputValues = {};
    for(let i = 0; i < allInputs.length; i++) {
      allInputValues[allInputs[i].id] = allInputs[i].value;
    }

    // console.log(allInputValues);

    //create the tutor account
    const addUser = firebase.functions().httpsCallable('addUser');
    addUser({
      email: allInputValues['tutorEmail'],
      password: "abc123",
      role: "tutor"
    })
    .then((result) => {

      let tutorUID = result.data.user.uid;
      let newUser = result.data.newUser;
      // console.log(tutorUID);
      // console.log(newUser);

      let currentLocation = document.getElementById("tutorLocation").value;

      if (newUser) {
        //set up the tutor doc
        const tutorDocRef = firebase.firestore().collection("Tutors").doc(tutorUID);
        let tutorDocData = {
          ...allInputValues,
          location: currentLocation
        }
        tutorDocRef.set(tutorDocData)
        .then((result) => {
          const updateUserDisplayName = firebase.functions().httpsCallable('updateUserDisplayName');
          updateUserDisplayName({
            uid: tutorUID,
            displayName: allInputValues["tutorFirstName"] + " " + allInputValues["tutorLastName"]
          })
          .then(() => {
            document.getElementById("spinnyBoiTutor").style.display = "none";
            closeUser("tutor", true);
          })
          .catch((error) => {
            handleFirebaseErrors(error, window.location.href);
            document.getElementById("errMsg").textContent = error.message;
            document.getElementById("spinnyBoiTutor").style.display = "none";
          });
        })
        .catch((error) => {
          handleFirebaseErrors(error, window.location.href);
          document.getElementById("errMsg").textContent = error.message;
          document.getElementById("spinnyBoiTutor").style.display = "none";
        });
      }
      else {
        document.getElementById("errMsg").textContent = "This tutor already exists!";
        document.getElementById("spinnyBoiTutor").style.display = "none";
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      document.getElementById("errMsg").textContent = error.message;
      document.getElementById("spinnyBoiTutor").style.display = "none";
    })
  }
  else {
    // console.log("not done yet!!!");
    document.getElementById("spinnyBoiTutor").style.display = "none";
  }
}

function createSecretary() {
  document.getElementById("spinnyBoiSecretary").style.display = "block";
  let allInputs = document.getElementById("add-secretary-section").querySelectorAll("input");
  if (validateFields(allInputs) && validateFields([document.getElementById("secretaryLocation")])) {
    // console.log("all clear");
    let allInputValues = {};
    for(let i = 0; i < allInputs.length; i++) {
      allInputValues[allInputs[i].id] = allInputs[i].value;
    }

    // console.log(allInputValues);

    //create the tutor account
    const addUser = firebase.functions().httpsCallable('addUser');
    addUser({
      email: allInputValues['secretaryEmail'],
      password: "abc123",
      role: "secretary"
    })
    .then((result) => {

      let secretaryUID = result.data.user.uid;
      let newUser = result.data.newUser;
      // console.log(secretaryUID);
      // console.log(newUser);

      let currentLocation = document.getElementById("secretaryLocation").value;

      if (newUser) {
        //set up the tutor doc
        const secretaryDocRef = firebase.firestore().collection("Secretaries").doc(secretaryUID);
        let secretaryDocData = {
          ...allInputValues,
          location: currentLocation
        }
        secretaryDocRef.set(secretaryDocData)
        .then((result) => {
          const updateUserDisplayName = firebase.functions().httpsCallable('updateUserDisplayName');
          updateUserDisplayName({
            uid: secretaryUID,
            displayName: allInputValues["secretaryFirstName"] + " " + allInputValues["secretaryLastName"]
          })
          .then(() => {
            document.getElementById("spinnyBoiTutor").style.display = "none";
            closeUser("tutor", true);
          })
          .catch((error) => {
            handleFirebaseErrors(error, window.location.href);
            document.getElementById("errMsg").textContent = error.message;
            document.getElementById("spinnyBoiTutor").style.display = "none";
          });
        })
        .catch((error) => {
          handleFirebaseErrors(error, window.location.href);
          document.getElementById("errMsg").textContent = error.message;
          document.getElementById("spinnyBoiSecretary").style.display = "none";
        });
      }
      else {
        document.getElementById("errMsg").textContent = "This tutor already exists!";
        document.getElementById("spinnyBoiSecretary").style.display = "none";
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      document.getElementById("errMsg").textContent = error.message;
      document.getElementById("spinnyBoiSecretary").style.display = "none";
    })
  }
  else {
    // console.log("not done yet!!!");
    document.getElementById("spinnyBoiSecretary").style.display = "none";
  }
}

function resetPassword() {
  let confirmation = confirm("Are you sure you want to reset your password?");
  if (confirmation) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        var auth = firebase.auth();
        var emailAddress = user.email;

        auth.sendPasswordResetEmail(emailAddress)
        .then(function() {
          // Email sent.
          alert("An email has been sent to your email to continue with your password reset.");
        })
        .catch(function(error) {
          // An error happened.
          alert("There was an issue with your password reset. \nPlease try again later.");
          handleFirebaseErrors(error, window.location.href);
        });
      } else {
        // No user is signed in.
        alert("Oops! No one is signed in to change the password");
      }
    });
  }
}

function validateFields(inputs) {
  let allClear = true;
  let errorMessages = document.querySelectorAll("p[id$='ErrorMessage']");

  for (let err = errorMessages.length - 1; err >= 0; err--) {
    errorMessages[err].remove()
  }

  for(i = 0; i < inputs.length; i++) {
    if(inputs[i].hasAttribute("required") && inputs[i].value == "") {
      inputs[i].parentNode.appendChild(ele = createElement("p", "errorMessage", ["id"], [inputs[i].id + "ErrorMessage"], "* Required *"));
      allClear = false;
    }

    // Validate Emails
    if (inputs[i].id.includes("Email")) {
      if (validateInputEmail(inputs[i]) == false) {
        allClear = false;
      }
    }

    // Validate phoneNumbers
    if (inputs[i].id.includes("PhoneNumber") && inputs[i].value != "") {
      if (validateInputPhoneNumbers(inputs[i]) == false) {
        allClear = false;
      }
    }

    if (inputs[i].id.includes("birthday") && inputs[i].value != "") {
      if (validateInputBirthday(inputs[i]) == false) {
        allClear = false;
      }
    }

    if (inputs[i].id.includes("zipCode") && inputs[i].value != "") {
      if (validateInputZipCode(inputs[i]) == false) {
        allClear = false;
      }
    }
  }
  return allClear;
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


//for the old selects
// function pendingStudentSelected(e) {
//   let uids = e.value;
//   let studentTempUID = uids.split(",")[0];
//   let parentUID = uids.split(",")[1];
//   let queryStr = "?student=" + studentTempUID + "&parent=" + parentUID + "&location=" + currentLocation;
//   window.location.href = "../Forms/New Student/New Student Form.html" + queryStr;
// }

// function activeStudentSelected(e) {
//   let studentUID = e.value;
//   let queryStr = "?student=" + studentUID;
//   window.location.href = "../Forms/ACT Daily Log/Daily Log.html" + queryStr;
// }

function pendingStudentSelected(studentUID, parentUID, location) {
  let queryStr = "?student=" + studentUID + "&parent=" + parentUID + "&location=" + location;
  window.location.href = "../Forms/New Student/New Student Form.html" + queryStr;
}

function actStudentSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../Forms/ACT Daily Log/Daily Log.html" + queryStr;
}

function subjectTutoringStudentSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../subject-tutoring-dash.html" + queryStr;
}

function mathProgramSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../math-program.html" + queryStr;
}

function phonicsProgramSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../phonics-program.html" + queryStr;
}
