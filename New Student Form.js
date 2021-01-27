// all of the text field elements
let firstNameElem = document.getElementById("firstName");
let lastNameElem = document.getElementById("lastName");

let streetAddressElem = document.getElementById("streetAddress");
let cityElem = document.getElementById("city");
let stateElem = document.getElementById("state");
let zipCodeElem = document.getElementById("zipCode");
let countryElem = document.getElementById("country");

let cellPhoneElem = document.getElementById("cellPhone");
let emailElem = document.getElementById("email");

let birthdayElem = document.getElementById("birthday");
let genderFemaleElem = document.getElementById("genderFemale");
let genderMaleElem = document.getElementById("genderMale");

// FIXME: figure out how the subling adding should work
let siblingElems = [document.getElementById("sibling0")];
let singlingAgeElems = [document.getElementById("siblingAge0")];
let siblingAddElems = [document.getElementById("siblingAdd0")];

let schoolElem = document.getElementById("school");
let gradeElem = document.getElementById("grade");
let graduationYearElem = document.getElementById("graduationYear");

let gpaElem = document.getElementById("gpa");
let mathClassElem = document.getElementById("mathClass");
let takingAPElem = document.getElementById("takingAP");
let takingHonorsElem = document.getElementById("takingHonors");

let favoriteSubjectElem = document.getElementById("favoriteSubject");
let leastFavoriteSubjectElem = document.getElementById("leastFavoriteSubject");

let referralElem = document.getElementById("referral");

let takenACTElem = document.getElementById("takenACT");
let actDateElem = document.getElementById("actDate");

let englishElem = document.getElementById("english");
let mathElem = document.getElementById("math");
let readingElem = document.getElementById("reading");
let scienceElem = document.getElementById("science");

let actGoalDateElem = document.getElementById("actGoalDate");
let actGoalScoreElem = document.getElementById("actGoalScore");
let whyElem = document.getElementById("why");

let scholarshipElem = document.getElementById("scholarship");

let topColleges1Elem = document.getElementById("topColleges1");
let topColleges2Elem = document.getElementById("topColleges2");
let topColleges3Elem = document.getElementById("topColleges3");
let topColleges4Elem = document.getElementById("topColleges4");

let desiredMajorElem = document.getElementById("desiredMajor");
let extracurricularsElem = document.getElementById("extracurriculars");

let submitElem = document.getElementById("submit");


// FIXME: handle the sibling add and remove buttons


// handle the submit button press
submitElem.addEventListener('click', submitForm);

function submitForm() {
  console.log("Form submit button pressed!");

  validateFields();
}

function validateFields() {
  // we want everything to be filled out
  if (firstNameElem.value.trim() == "" ||
      lastNameElem.value.trim() == "" ||
      )
}