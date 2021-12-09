let staffData = {};


function initialSetup() {
  //set up the semantic ui dropdowns
  $('.ui.dropdown').dropdown();

  getAllLocations()
  .then((locations) => {
    let locationNames = []
    let locationUIDs = []

    locations.forEach(location => {
      locationNames.push(location.name);
      locationUIDs.push(location.id);
    })
    addSelectOptions(document.getElementById("location"), locationUIDs, locationNames);

    setExtracurriculars();
    setupDuplicates();
    fillInData();
  })
}


function getAllLocations() {
  return firebase.firestore().collection('Locations').get()
  .then((locationSnapshot) => {
    let locationData = [];

    locationSnapshot.forEach(locationDoc => {
      locationData.push({
        id: locationDoc.id,
        name: locationDoc.data().locationName
      });
    })

    return locationData;
  })
}

/**
 * Description:
 * grabs the query string for this url which should include a uid and location
 * then pulls the corresponding data from the pending collection in the given location
 * fills in all of the data that we have stored
 */
 function fillInData() {

  const staffUID = queryStrings()["staff"];

  if (staffUID) {
    //grab the student data
    const staffDocRef = firebase.firestore().collection("Users").doc(staffUID);
    staffDocRef.get()
    .then((staffDoc) => {
      if(staffDoc.exists) {
        setAllData(staffDoc.data());
        staffData = staffDoc.data();
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
    });
  }
}

function setAllData(data) {
  for(const key in data) {
    let element = document.getElementById(key);
    if (element) {
      element.value = data[key];
      element.dispatchEvent(new Event('change'));
    }
  }

  //special case

  //types
  let staffRoles = data["roles"]
  if (staffRoles) {
    $("#roles").closest(".ui.dropdown").dropdown("set selected", staffRoles);
  }

  //extracurriculars
  let staffExtracurriculars = data["extracurriculars"]
  if (staffExtracurriculars) {
    $("#extracurriculars").closest(".ui.dropdown").dropdown("set selected", staffExtracurriculars);
  }

  //qualified lessons
  let staffQualifiedLessons = data["qualifiedLessons"]
  if (staffQualifiedLessons) {
    $("#qualifiedLessons").closest(".ui.dropdown").dropdown("set selected", staffQualifiedLessons);
  }

}

function submitRegistration() {
  const staffUID = queryStrings()["staff"];
  //if a student UID is a query string then the submit should be an update
  if (staffUID) {
    updateRegistration();
  }
  //else the submit should be a set
  else {
    createRegistration();
  }
}

function objectifyRegistration() {
  let allInputs = getAllInputs();

  let allInputValues = {}

  //convert input arrays into objects
  for (let i = 0; i < allInputs.length; i++) {
    //check for duplicate id's
    let id = allInputs[i].id;
    if (id.includes('_duplicate')) {
      id = id.split('_')[0];
    }
    if (allInputs[i].dataset.save != 'false') {
      allInputValues[id] = allInputs[i].value;
    }
  }

  //handle the dropdowns
  // allInputValues["role"] = getDropdownValues("roles"); //only get the first one for right now
  allInputValues['qualifiedLessons'] = getDropdownValues('qualifiedLessons');
  allInputValues['extracurriculars'] = getDropdownValues('extracurriculars');

  //number values
  allInputValues['wage'] = allInputValues['wage'] ? parseInt(allInputValues['wage']) : 0;


  // if (getDropdownValues("roles").includes('inactive')) {
  //   allInputValues['status'] = "inactive";
  // }
  // else {
  //   allInputValues['status'] = "active";
  // }

  return {
    allValues: allInputValues,
  }
}

/**
 * 
 * @param {boolean} status if the submit button should be disabled and loader spinning
 */
function isWorking(status) {
  if (status) {
    document.getElementById("errMsg").textContent = "";
    document.getElementById("submitBtn").disabled = true;
    document.getElementById("spinnyBoi").style.display = "block";
  }
  else {
    document.getElementById("submitBtn").disabled = false;
    document.getElementById("spinnyBoi").style.display = "none";
  }
}

function createRegistration() {
  // put into working status
  isWorking(true);

  const registrationObject = objectifyRegistration();

  let allInputValues = registrationObject["allValues"];

  //validate and confirm submission
  if (validateFields(getAllInputs()) && confirm("Are you sure you are ready to submit this registration?")) {
    //create the staff account
    const addUser = firebase.functions().httpsCallable('addUser');
    addUser({
      email: allInputValues['email'].replace(/\s+/g, ''),
      password: "abc123",
      role: getHighestRole(getDropdownValues('roles'))
    })
    .then((result) => {
      let staffUID = result.data.user.uid;
      let newStaff = result.data.newUser;
      if (newStaff) {

        let staffProm = setStaffDoc(staffUID, allInputValues);
        const staffFirstName = allInputValues['firstName'];
        const staffLastName = allInputValues['lastName'];

        let staffDisplayNameProm;
        if (staffFirstName) {
          const updateUserDisplayName = firebase.functions().httpsCallable('updateUserDisplayName');
          staffDisplayNameProm = updateUserDisplayName({
            uid: staffUID,
            displayName: staffFirstName + " " + staffLastName 
          })

          let promises = [staffProm, staffDisplayNameProm];
          Promise.all(promises)
          .then(() => {
            //go back
            goToDashboard();
            isWorking(false);
          })
          .catch((error) => {
            //remove the student since the inquiry failed
            const deleteUser = firebase.functions().httpsCallable('deleteUser');
            deleteUser({
              uid: staffUID,
            })
            .then(() => {
              isWorking(false);
            })
            .catch((error) => {
              handleFirebaseErrors(error, window.location.href);
              document.getElementById("errMsg").textContent = error.message;
              isWorking(false);
            });
          });
        }
      }
      //this staff already exists. prompt to try again if not a mistake
      else {
        alert("It looks like this staff already exists. If you think this is a mistake please try submitting the registration again.");
        isWorking(false);
      }
    })
    .catch((error) => {
      //remove the student since the inquiry failed (this one is just in case the stuaff was created but another part of add staff failed)
      const deleteUser = firebase.functions().httpsCallable('deleteUser');
      deleteUser({
        uid: staffUID,
      })
      .then(() => {
        isWorking(false);
      })
      .catch((error) => {
        handleFirebaseErrors(error, window.location.href);
        document.getElementById("errMsg").textContent = error.message;
        isWorking(false);
      });

      handleFirebaseErrors(error, window.location.href);
      document.getElementById("errMsg").textContent = error.message;
      isWorking(false);
    });
  }
  else {
    //validation failed
    isWorking(false);
  }
}

function updateRegistration() {
  // put into working status
  isWorking(true);

  const registrationObject = objectifyRegistration();

  let allInputValues = registrationObject["allValues"];

  //validate and confirm submission
  if (validateFields(getAllInputs()) && 
    confirm("Are you sure you are ready to update this registration form?")
    ) {
    const staffUID = queryStrings()["staff"];

    let staffProm = updateStaffDoc(staffUID, allInputValues);

    let staffFirstName = allInputValues["firstName"];
    let staffLastName = allInputValues["lastName"];

    //update staff email
    let staffEmail = allInputValues['email'];
    let staffEmailProm;
    if (staffEmail) {
      const updateUserEmail = firebase.functions().httpsCallable('updateUserEmail');
      emailProm = updateUserEmail({
        uid: staffUID,
        email : staffEmail,
      })
    }

    //update staff display name
    let staffDisplayNameProm;
    if (staffFirstName) {
      const updateUserDisplayName = firebase.functions().httpsCallable('updateUserDisplayName');
      staffDisplayNameProm = updateUserDisplayName({
        uid: staffUID,
        displayName: staffFirstName + " " + staffLastName 
      })
    }

    let promises = [staffProm, staffEmailProm, staffDisplayNameProm];
    Promise.all(promises)
    .then(() => {
      //go back
      history.back();
      isWorking(false);
    })
    .catch((error) => {
      console.log(error);
      handleFirebaseErrors(error, window.location.href);
      document.getElementById("errMsg").textContent = error.message;
      isWorking(false);
    });
  }
  else {
    isWorking(false);
  }
}

function setStaffDoc(staffUID, staffValues) {
  const staffDocRef = firebase.firestore().collection("Users").doc(staffUID);
  let staffDocData = {
    ...staffValues,
    createdDate: (new Date().getTime()),
    lastModifiedDate: (new Date().getTime())
  }
  return staffDocRef.set(staffDocData);
}

function updateStaffDoc(staffUID, staffValues) {
  const staffDocRef = firebase.firestore().collection("Users").doc(staffUID);
  let staffDocData = {
    ...staffValues,
    lastModifiedDate: (new Date().getTime())
  }
  return staffDocRef.update(staffDocData);
}

function getAllInputs() {
  return document.querySelectorAll("input, select, textarea");
}

function validateFields(inputs) {
  let allClear = true;
  let errorMessages = document.querySelectorAll("p[id$='ErrorMessage']");

  for (let err = errorMessages.length - 1; err >= 0; err--) {
    errorMessages[err].remove()
  }

  //check for required
  for(i = 0; i < inputs.length; i++) {
    if(inputs[i].hasAttribute("required") && !inputs[i].hasAttribute('multiple') && inputs[i].value == "") {
      inputs[i].parentNode.appendChild(ele = createElement("p", "errorMessage", ["id"], [inputs[i].id + "ErrorMessage"], "* Required *"));
      allClear = false;
    }

    //check for required dropdown multiple selects
    if(inputs[i].hasAttribute("required") && inputs[i].hasAttribute('multiple') && getDropdownValues(inputs[i].id).length < 1) {
      inputs[i].parentNode.appendChild(ele = createElement("p", "errorMessage", ["id"], [inputs[i].id + "ErrorMessage"], "* Required *"));
      allClear = false;
    }

    // Validate Emails
    if (inputs[i].id.includes("Email") && inputs[i].value != "") {
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

function changeRegistrationBlock(elem) {
  let registrationID = "";
  registrationID = elem.id;

  if (registrationID) {
    registrationID += "_info"
    let registrationBlocks = document.querySelectorAll("div[id$=_info]");
    let progressArrows = document.querySelectorAll(".step");

    removeCurrentClass(registrationBlocks);
    removeCurrentClass(progressArrows);

    document.getElementById(registrationID).classList.add("current");
    elem.classList.add("current");
    }
}

function removeCurrentClass(blocks) {
  blocks.forEach((elem) => {
    elem.classList.remove("current")
  });
}







/**
 * Description:
 *   checks if the key event is an allowed modifying key
 * @param {event} event javascript event
 */
const isModifierKey = (event) => {
	const key = event.keyCode;
	return (key === 35 || key === 36) || // Allow Shift, Home, End
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
	return (
    ((key >= 48 && key <= 57) || // Allow number line
		(key >= 96 && key <= 105)) // Allow number pad 
    && (!event.shiftKey) // Do not allow shift key
	);
};

const enforceNumericFormat = (event) => {
	// Input must be of a valid number format or a modifier key
	if(!isNumericInput(event) && !isModifierKey(event)) {
		event.preventDefault();
	}
};

const enforceDecimalFormat = (event) => {
	// Input must be of a valid number format or a modifier key or decimal point
	const key = event.keyCode;
	if(!isNumericInput(event) && !isModifierKey(event) && key != 190) {
		event.preventDefault();
	}
};

const formatToPhone = (event) => {
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
  const target = event.target;

  //remove non numbers from input if they have snuck past
  let strArray = target.value.split('');
  strArray.forEach((char, index) => {
    if (isNaN(char) && char != '.') {
      strArray[index] = '';
    }
  });
  target.value = strArray.join('');
  
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

const phone = document.getElementById('phoneNumber');
phone.addEventListener('keydown',enforceNumericFormat);
phone.addEventListener('keyup',formatToPhone);

const inputZipcode = document.getElementById('zipCode');
inputZipcode.addEventListener('keydown',enforceNumericFormat);

const wage = document.getElementById('wage');
wage.addEventListener('keydown', enforceDecimalFormat)
wage.addEventListener('keyup', formatToNumber)

const birthdayElem = document.getElementById('birthday');
birthdayElem.addEventListener('keydown',enforceNumericFormat);
birthdayElem.addEventListener('keyup',formatToDate);

//grade should change graduation year

function updateGraduationYear() {
  console.log("Updating gradution year");
  if (grade.value > -1 && grade.value != "") {
    graduation.disabled = false;
    let gradeVal = parseInt(grade.value);

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let yearsUntilGraduation = currentMonth < 7 ? 12 - gradeVal : 13 - gradeVal;
    let graduationYear = currentYear + yearsUntilGraduation;

    graduation.value = graduationYear;
  }
  //no grade selected
  else if (grade.value == "") {
    graduation.value = ""
    graduation.disabled = false;
  }
  //college
  else {
    graduation.value = "-1"
    graduation.disabled = true;
  }
}

function updateGrade() {
  console.log("Updating grade");
  if (graduation.value) {
    let graduationYear = parseInt(graduation.value);

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let yearsUntilGraduation = graduationYear - currentYear;
    if (yearsUntilGraduation < 0) {
      grade.value = -1;
      graduation.disabled = true;
      return;
    }
    let gradeVal = currentMonth < 7 ? 12 - yearsUntilGraduation : 13 - yearsUntilGraduation;

    grade.value = gradeVal;
  }
  else {
    grade.value = "";
  }
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

function capitalizeFirstLettersInString(string) {
  let words = string.split(' ');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }

  return words.join(" ");
}

const locationElement = document.getElementById('location');
locationElement.addEventListener('change', () => {
  clearSchoolOptions();

  let location = locationElement.value;
  let schools = [];
  const schoolRef = firebase.firestore().collection("Schools");
  schoolRef.where("schoolLocation", "==", location).get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const schoolName = data.schoolName;
      schools.push({
        id : id,
        schoolName: schoolName
      })
    })

    //sort the school alphabetically
    schools.sort((a,b) => {
      let schoolNameA = a.schoolName;
      let schoolNameB = b.schoolName;

      if (schoolNameA < schoolNameB) {return -1}
      else if (schoolNameA > schoolNameB) {return 1}
      else {return 0}
    });

    schools.forEach((school) => {
      setSchoolOption(school.id, school.schoolName);
    })
    setSchoolOption("", "none of these")
    //reset student school
    document.getElementById("school").value = staffData["school"] ?? ""
  })
  .catch((error) => {
    handleFirebaseErrors(error, window.location.href);
  });
})

function setSchoolOption(schoolId, schoolName) {
  let option = document.createElement('option');
  option.value = schoolId;
  option.innerHTML = schoolName;
  document.getElementById("school").appendChild(option);
}

function clearSchoolOptions() {
  document.getElementById("school").innerHTML = null;
  let option = document.createElement('option');
  option.value = "";
  option.innerHTML = "select a school";
  option.selected = true;
  option.disabled = true;

  document.getElementById("school").appendChild(option);
}

function setExtracurriculars() {
  const extracurricularRef = firebase.firestore().collection("Dynamic-Content").doc("extracurriculars");
  extracurricularRef.get()
  .then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      const extracurricularElem = document.getElementById("extracurriculars");

      let extracurricularArray = data.extracurriculars;
      extracurricularArray.sort();

      extracurricularArray.forEach((extra) => {
        let option = document.createElement("option");
        option.value = extra;
        option.innerText = extra;
        extracurricularElem.appendChild(option);
      });
    }
  })
  .catch((error) => {
    handleFirebaseErrors(error, window.location.href);
  });
}

function getDropdownValues(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let values = []
  inputs.forEach((input) => {
    values.push(input.dataset.value)
  })

  return values;
}


function setupDuplicates() {
  let duplicateInputs = document.querySelectorAll("input[id$='_duplicate'");


  duplicateInputs.forEach((duplicateElem) => {
    let originalElem = document.getElementById(duplicateElem.id.split('_')[0]);

    originalElem.addEventListener('change', () => {
      duplicateElem.value = originalElem.value;
    });

    duplicateElem.addEventListener('change', () => {
      originalElem.value = duplicateElem.value;
    });

    // duplicateElem.value = originalElem.value;
  });
}

function goBack() {
  let confirmation = confirm("Are you sure you want to go back? Any changes you made will be lost.")
  if (confirmation) {
    history.back()
  }
}
