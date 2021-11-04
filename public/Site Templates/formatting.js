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

const formatToInt = (event) => {
  const target = event.target;

  //remove non numbers from input if they have snuck past
  let strArray = target.value.split('');
  strArray.forEach((char, index) => {
    if (isNaN(char)) {
      strArray[index] = '';
    }
  });
  target.value = strArray.join('');
  
  const min = Number(target.getAttribute("min"));
  const max = Number(target.getAttribute("max"));
  const input = Number(target.value)

  //remove leading zeros
  if (input < min) {
    target.value = min;
  }
  else if (input > max) {
    target.value = max;
  }

}

document.querySelectorAll('input[type="tel"]').forEach(telInput => {
	telInput.addEventListener('keydown',enforceNumericFormat);
	telInput.addEventListener('keyup',formatToPhone);
})