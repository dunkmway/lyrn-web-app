//FIXME: need to grab which location we are looking at
//currently stuck on Sandy
let currentLocation = "tykwKFrvmQ8xg2kFfEeA";






const locationDocRef = firebase.firestore().collection("Locations").doc(currentLocation)
locationDocRef.get()
.then((doc) => {
  if (doc.exists) {
    let locationName = doc.get("locationName");
    document.getElementById("locationName").textContent = locationName;

    let pendingStudents = doc.get("pendingStudents");
    let activeStudents = doc.get("activeStudents");
    // if (pendingStudents) {
    //   const pendingStudentElem = document.getElementById("pendingStudents");
    //   for (const object in pendingStudents) {
    //     let studentOption = document.createElement("option");
    //     studentOption.value = object + "," + pendingStudents[object]["parentUID"];
    //     studentOption.innerText = pendingStudents[object]["studentFirstName"] + " " + pendingStudents[object]["studentLastName"];
    //     pendingStudentElem.appendChild(studentOption);
    //   }
    // }

    // if (activeStudents) {
    //   const activeStudentElem = document.getElementById("activeStudents");
    //   for (const object in activeStudents) {
    //     let option = document.createElement("option");
    //     option.value = object;
    //     option.innerText = activeStudents[object]["studentFirstName"] + " " + activeStudents[object]["studentLastName"];
    //     activeStudentElem.appendChild(option);
    //   }
    // }

    let tableData = [];

    if (pendingStudents) {
      for (const studentUID in pendingStudents) {
        const student = {
          ...pendingStudents[studentUID],
          status: "pending"
        }
        tableData.push(student);
      }
    }

    if (activeStudents) {
      for (const studentUID in activeStudents) {
        const student = {
          ...activeStudents[studentUID],
          studentUID: studentUID,
          status: "active"
        }
        tableData.push(student);
      }
    }

    let studentTable = $('#student-table').DataTable( {
      data: tableData,
      columns: [
        { data: 'studentFirstName' },
        { data: 'studentLastName' },
        { data: 'status' },
        { data: 'parentFirstName' },
        { data: 'parentLastName'},
      ],
      "scrollY": "400px",
      "scrollCollapse": true,
      "paging": false
    } );

    studentTable.on('click', (args1) => {
      let studentUID = tableData[args1.target._DT_CellIndex.row].studentUID;
      let parentUID = tableData[args1.target._DT_CellIndex.row].parentUID;
      let status = tableData[args1.target._DT_CellIndex.row].status;

      switch (status) {
        case "pending":
          pendingStudentSelected(studentUID, parentUID);
          break;
        case "active":
          activeStudentSelected(studentUID);
          break;
        default:
          console.log("ERROR: This student isn't active or pending!!!")
      }
      
    });
  }
})
.catch((error) => {
  console.log(error);
  console.log(error.code);
  console.log(error.message);
  console.log(error.details);
});


function goToInquiry() {
  window.location.href = "../inquiry.html";
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

function pendingStudentSelected(studentUID, parentUID) {
  let queryStr = "?student=" + studentUID + "&parent=" + parentUID + "&location=" + currentLocation;
  window.location.href = "../Forms/New Student/New Student Form.html" + queryStr;
}

function activeStudentSelected(studentUID) {
  let queryStr = "?student=" + studentUID;
  window.location.href = "../Forms/ACT Daily Log/Daily Log.html" + queryStr;
}