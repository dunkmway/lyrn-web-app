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

const enforceNumericFormat = (event) => {
	// Input must be of a valid number format or a modifier key, and not longer than ten digits
	if(!isNumericInput(event) && !isModifierKey(event)){
		event.preventDefault();
	}
};

const enforceDecimalFormat = (event) => {
	// Input must be of a valid number format or a modifier key
	const key = event.keyCode;
	if (!isNumericInput(event) && key != 190 && key != 8) {
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

const parentPhone = document.getElementById('parentPhoneNumber');
parentPhone.addEventListener('keydown',enforceNumericFormat);
parentPhone.addEventListener('keyup',formatToPhone);

const workPhone = document.getElementById('parentWorkPhoneNumber');
workPhone.addEventListener('keydown',enforceNumericFormat);
workPhone.addEventListener('keyup',formatToPhone);

const studentPhone = document.getElementById('studentPhoneNumber');
studentPhone.addEventListener('keydown',enforceNumericFormat);
studentPhone.addEventListener('keyup',formatToPhone);

const inputZipcode = document.getElementById('zipCode');
inputZipcode.addEventListener('keydown',enforceNumericFormat);

const inputGraduation = document.getElementById('studentGraduation');
inputGraduation.addEventListener('keydown',enforceNumericFormat);

const birthdayElem = document.getElementById('studentBirthday');
birthdayElem.addEventListener('keydown',enforceNumericFormat);
birthdayElem.addEventListener('keyup',formatToDate);

const goalACTDate = document.getElementById('studentGoalACTDate');
goalACTDate.addEventListener('keydown',enforceNumericFormat);
goalACTDate.addEventListener('keyup',formatToDate);

const goalACTScore = document.getElementById('studentGoalACTScore');
goalACTScore.addEventListener('keydown',enforceNumericFormat);
goalACTScore.addEventListener('keyup',formatToNumber);

const gpa = document.getElementById('studentGpa');
gpa.addEventListener('keydown',enforceDecimalFormat);
gpa.addEventListener('keyup',formatToNumber);
