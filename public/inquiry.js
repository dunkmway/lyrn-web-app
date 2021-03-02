function createInquiry() {
  document.getElementById("errMsg").textContent = "";
  let allInputs = getAllInputs();
  let allInputValues = {};

  let locationInputs = getLocationInputs();
  let parentInputs = getParentInputs();
  let studentInputs = getStudentInputs();

  let locationInputValues = {};
  let parentInputValues = {};
  let studentInputValues = {};

  if (validateFields(allInputs)) {
    for(let i = 0; i < allInputs.length; i++) {
      allInputValues[allInputs[i].id] = allInputs[i].value;
    }

    for(let i = 0; i < locationInputs.length; i++) {
      locationInputValues[locationInputs[i].id] = locationInputs[i].value;
    }

    for(let i = 0; i < parentInputs.length; i++) {
      parentInputValues[parentInputs[i].id] = parentInputs[i].value;
    }

    for(let i = 0; i < studentInputs.length; i++) {
      studentInputValues[studentInputs[i].id] = studentInputs[i].value;
    }

    console.log(allInputValues);
    console.log(locationInputValues);
    console.log(parentInputValues);
    console.log(studentInputValues);
    
    //create the parent account
    const addUser = firebase.functions().httpsCallable('addUser');
    addUser({
      email: allInputValues['parentEmail'],
      password: "abc123",
    })
    .then((result) => {
      parentUID = result.data.user.uid;
      newUser = result.data.newUser;
      console.log(parentUID);
      console.log(newUser);

      if (newUser) {
        //set up the parent doc
        const parentDocRef = firebase.firestore().collection("Parents").doc(parentUID);
        parentDocData = {
          ...locationInputValues,
          ...parentInputValues,
          pending: [studentInputValues]
        }
        let parentProm = parentDocRef.set(parentDocData)
        .then((result) => {
          console.log("parent document successfully written!");
          console.log(result);
        })
        .catch((error) => {
          console.log(error);
          console.log(error.code);
          console.log(error.message);
          document.getElementById("errMsg").textContent = error.message;
          console.log(error.details);
        })

        //set up the location pending doc
        const pendingDocRef = firebase.firestore().collection("Locations").doc(allInputValues["locationName"]).collection("Pending").doc(parentUID);
        let pendingProm = pendingDocRef.set({
          pendingStudents: [allInputValues]
        })
        .then((result) => {
          console.log("pending document successfully written!");
          console.log(result);
        })
        .catch((error) => {
          console.log(error);
          console.log(error.code);
          console.log(error.message);
          document.getElementById("errMsg").textContent = error.message;
          console.log(error.details);
        })

        //update location pending student array
        const locationDocRef = firebase.firestore().collection("Locations").doc(allInputValues["locationName"]);
        let pendingStudent = {
          ...studentInputValues,
          parentUID: parentUID,
          parentFirstName: parentInputValues["parentFirstName"],
          parentLastName: parentInputValues["parentLastName"]
        }
        let locationProm = locationDocRef.update({
          pendingStudents: firebase.firestore.FieldValue.arrayUnion(pendingStudent)
        })
        .then((result) => {
          console.log("location document successfully written!");
          console.log(result);
        })
        .catch((error) => {
          console.log(error);
          console.log(error.code);
          console.log(error.message);
          document.getElementById("errMsg").textContent = error.message;
          console.log(error.details);
        })

        let promises = [parentProm, pendingProm, locationProm];
        Promise.all(promises)
        .then(() => {
          window.location.href = "post-sign-in.html";
        })
        .catch((error) => {
          console.log(error);
          console.log(error.code);
          console.log(error.message);
          document.getElementById("errMsg").textContent = error.message;
          console.log(error.details);
        });
      }
      else {
        //the user already exists. Prompt the user to navigate to the parent's profile page
      }
    })
    .catch((error) => {
      console.log(error);
      console.log(error.code);
      console.log(error.message);
      document.getElementById("errMsg").textContent = error.message;
      console.log(error.details);
    });
  }
}

function getAllInputs() {
  return document.getElementById("inquiryForm").querySelectorAll("input, select");
}

function getLocationInputs() {
  return document.getElementById("inquiryForm").querySelectorAll(".location-data");
}

function getParentInputs() {
  return document.getElementById("inquiryForm").querySelectorAll(".parent-data");
}

function getStudentInputs() {
  return document.getElementById("inquiryForm").querySelectorAll(".student-data");
}

function validateFields(inputs) {
  let allClear = true;
  for(i = 0; i < inputs.length; i++) {
    if (inputs[i].nextSibling != null) {
      inputs[i].parentNode.removeChild(inputs[i].nextSibling);
    }
    if(inputs[i].hasAttribute("required") && inputs[i].value == "") {
      let errorMsg = document.createElement("p");
      errorMsg.textContent = "required";
      errorMsg.style.color = "red";
      inputs[i].parentNode.appendChild(errorMsg);
      allClear = false;
    }
  }
  return allClear;
}