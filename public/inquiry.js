function setLocations () {
  const wasatchRef = firebase.firestore().collection("Wasatch").doc("general");
  wasatchRef.get()
  .then((doc) => {
    if (doc) {
      const locationElem = document.getElementById("location");
      let locations = doc.get("locations");
      for (let locationUID in locations) {
        let option = document.createElement("option");
        option.value = locationUID;
        option.innerText = locations[locationUID]["name"];
        locationElem.appendChild(option);
      }
    }
  })
  .catch((error) => {
    console.log(error);
    console.log(error.code);
    console.log(error.message);
    console.log(error.details);
  });
}

function createInquiry() {
  document.getElementById("errMsg").textContent = "";
  document.getElementById("submitBtn").disabled = true;
  document.getElementById("spinnyBoi").style.display = "block";
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
      role: "parent"
    })
    .then((result) => {

      let parentUID = result.data.user.uid;
      newUser = result.data.newUser;
      console.log(parentUID);
      console.log(newUser);

      if (newUser) {
        //set up the location pending doc
        const pendingDocRef = firebase.firestore().collection("Locations").doc(allInputValues["location"]).collection("Pending");
        let pendingProm = pendingDocRef.add({
          // pendingStudents: {[studentInputValues["studentFirstName"]]: allInputValues}
          ...allInputValues,
          parentUID: parentUID
        })
        .then((docRef) => {
          console.log("pending document successfully written!");
          console.log(docRef.id);

          let pendingStudentDoc = docRef.id;

          //set up the parent doc
          const parentDocRef = firebase.firestore().collection("Parents").doc(parentUID);
          let parentDocData = {
            ...locationInputValues,
            ...parentInputValues,
            // role: "parent",
            pending: {[pendingStudentDoc]: studentInputValues}
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
          });

          //update location pending student array
          const locationDocRef = firebase.firestore().collection("Locations").doc(allInputValues["location"]);
          let pendingStudent = {
            ...studentInputValues,
            parentUID: parentUID,
            parentFirstName: parentInputValues["parentFirstName"],
            parentLastName: parentInputValues["parentLastName"]
          }
          let locationProm = locationDocRef.update({
            [`pendingStudents.${pendingStudentDoc}`]: pendingStudent
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
          });

          let promises = [parentProm, locationProm];
          Promise.all(promises)
          .then(() => {
            window.history.back();
            document.getElementById("submitBtn").disabled = false;
            document.getElementById("spinnyBoi").style.display = "none";
          })
          .catch((error) => {
            console.log(error);
            console.log(error.code);
            console.log(error.message);
            document.getElementById("errMsg").textContent = error.message;
            console.log(error.details);
            document.getElementById("submitBtn").disabled = false;
            document.getElementById("spinnyBoi").style.display = "none";
          });
        })
        .catch((error) => {
          console.log(error);
          console.log(error.code);
          console.log(error.message);
          document.getElementById("errMsg").textContent = error.message;
          console.log(error.details);
          document.getElementById("submitBtn").disabled = false;
          document.getElementById("spinnyBoi").style.display = "none";
        });
      }
      else {
        //the user already exists. Prompt the user to navigate to the parent's profile page
        document.getElementById("submitBtn").disabled = false;
        document.getElementById("errMsg").textContent = "This parent already exists!";
        document.getElementById("spinnyBoi").style.display = "none";
      }
    })
    .catch((error) => {
      console.log(error);
      console.log(error.code);
      console.log(error.message);
      document.getElementById("errMsg").textContent = error.message;
      console.log(error.details);
      document.getElementById("submitBtn").disabled = false;
      document.getElementById("spinnyBoi").style.display = "none";
    });
  }
  else {
    //validation failed
    document.getElementById("submitBtn").disabled = false;
    document.getElementById("spinnyBoi").style.display = "none";
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

const enforceNumericFormat = (event) => {
	// Input must be of a valid number format or a modifier key, and not longer than ten digits
	if(!isNumericInput(event) && !isModifierKey(event)){
		event.preventDefault();
	}
};

const enforceDecimalFormat = (event) => {
	// Input must be of a valid number format or a modifier key, and not longer than ten digits
	const key = event.keyCode;
	if(!isNumericInput(event) && !isModifierKey(event) && key != 190){
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

	if(input.length > 6){target.value = `(${zip}) ${middle}-${last}`;}
	else if(input.length > 3){target.value = `(${zip}) ${middle}`;}
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
  let input = ""
  if (!target.value.includes('.')) {
  	input = Number(target.value).toString();
  }
  else if (target.value[target.value.length - 1] == '.') {
  	input = Number(target.value[0])
  }
  else {
  	input = Number(target.value)
  }

  	//remove leading zeros
  	if (input < min) {
    	target.value = min; 
  	}
  	else if (input > max) {
    	target.value = max;
  	}

}

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


const parentPhone = document.getElementById('parentPhoneNumber');
parentPhone.addEventListener('keydown',enforceNumericFormat);
parentPhone.addEventListener('keyup',formatToPhone);

const inputZipcode = document.getElementById('zipCode');
inputZipcode.addEventListener('keydown',enforceNumericFormat);
