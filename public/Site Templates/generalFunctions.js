/**
 * Parse the datetime as an integer into a datetime object
 * @param {Integer} date Datetime represented as an integer
 * @returns {Object} a javascript object containing the datetime elements
 */
function convertFromDateInt(date) {

    // Make sure an integer was passed in
    if (typeof date !== "number") {
        return undefined;
    }

    // Create the date object from the date as an integer
    const current_date = new Date(date)

    // create the variables that will be called more than once
    const year = current_date.getFullYear();
    const month = current_date.getMonth() + 1;
    const dayOfMonth = current_date.getDate();
    const dayOfWeek = current_date.getDay() + 1;
    const hours = current_date.getHours();

    // Needed to get the month and day string values
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Create and return the datetime object
    return {
        'year' : year,
        'monthNumber' : month,
        'monthString' : months[month - 1],
        'dayOfMonth' : dayOfMonth,
        'dayOfWeekNumber' : dayOfWeek,
        'dayOfWeekString' : days[dayOfWeek - 1],
        'hours' : hours > 12 ? hours - 12 : hours,
        'militaryHours' : hours,
        'minutes' : current_date.getMinutes(),
        'seconds' : current_date.getSeconds(),
        'milliseconds' : current_date.getMilliseconds(),
        'integerValue' : date,
        'shortDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString(),
        'shortestDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString().slice(-2),
        'longDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + hours.toString().padStart(2,'0') + ":" + current_date.getMinutes().toString().padStart(2,'0'),
        'mm/dd/yyyy' : month.toString().padStart(2, '0') + "/" + dayOfMonth.toString().padStart(2, '0') + "/" + year.toString().padStart(4, '0'),
        'startOfDayInt' : new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0).getTime()
    };
}

function setObjectValue(propertyPath, value, obj) {
  // this is a super simple parsing, you will want to make this more complex to handle correctly any path
  // it will split by the dots at first and then simply pass along the array (on next iterations)
  let properties = Array.isArray(propertyPath) ? propertyPath : propertyPath.split(".")

  // Not yet at the last property so keep digging
  if (properties.length > 1) {
    // The property doesn't exists OR is not an object (and so we overwritte it) so we create it
    if (!obj.hasOwnProperty(properties[0]) || typeof obj[properties[0]] !== "object") {
      obj[properties[0]] = {}
    } 
      // We iterate.
    return setObjectValue(properties.slice(1), value, obj[properties[0]])
      // This is the last property - the one where to set the value
  } 
  else {
    // We set the value to the last property
    if (typeof value == 'object') {
      obj[properties[0]] = JSON.parse(JSON.stringify(value))
    }
    else {
      obj[properties[0]] = value
    }
    return true // this is the end
  }
}

/**
 * create html element
 * @param {String} elementType tag name for the element that will be created
 * @param {[String]} classes classes for the element
 * @param {[String]} attributes attributes for the element
 * @param {[String]} values values for each attribute for the element
 * @param {String} text innerhtml for the element
 * @returns {HTMLElement} html element of the given tag
 */
function createElement(elementType, classes = [], attributes = [], values = [], text = "") {
  // Initialize the element
  let element = document.createElement(elementType);

  // Set each of the specified attributes for the element
  if (attributes.length == values.length && attributes.length > 0) {
    for (let i = 0; i < attributes.length; i++) {
      element.setAttribute(attributes[i], values[i]);
    }
  }

  // Add the classes to the element
  for (let i = 0; i < classes.length; i++) {
    element.classList.add(classes[i]);
  }

  // Set the inner html text
  if (text != "") {
    element.innerHTML = text;
  }

  // Return the element
  return element;
}

/**
 * create html elements and return them in a parent div
 * @param {[String]} elementType tag names for the elements that will be created
 * @param {[[String]]} classes classes for each element
 * @param {[[String]]} attributes attributes for each element
 * @param {[[String]]} values values for each attribute for each element
 * @param {[String]} text innerhtml for each element
 * @param {[String]} divClasses calsses for the parent div for the elements
 * @returns {HTMLElement} html div whose children are the requested elements
 */
 function createElements(elementType = [], classes = [[]], attributes = [[]], values = [[]], text = [], divClasses = []) {
  // Make sure there is something passed into the function
  if (elementType.length >= 0) {
    let elements = createElement("div", divClasses);

    // Iterate through each of the elements that need created
    if (attributes.length == values.length && attributes.length >= 0) {
      for (let i = 0; i < elementType.length; i++) {
        elements.appendChild(createElement(elementType[i], classes[i], attributes[i], values[i], text[i]));
      }
    }

    // Return the element
    return elements;

  }
}

function customConfirm(message = "", option1 = "", option2 = "", option1Callback, option2Callback) {

  //setup the HTML for the confimation
  let confirmationSection = document.createElement('section');
  confirmationSection.id = "customConfirmationSection";

  confirmationSection.innerHTML = (`
    <div class="confirmationContainer">
      <div id="customConfirmationMessage">${message}</div>
      <div class="optionsContainer">
        <div id="customConfirmationOptionOne">${option1}</div>
        <div id="customConfirmationOptionTwo">${option2}</div>
      </div>
    </div>
  `);

  //append the confirmation to the DOM
  document.body.appendChild(confirmationSection);

  //this will remove the modal if the user clicks off of the container
  confirmationSection.addEventListener('click', (e) => {
    if (e.target !== e.currentTarget) return;
    document.getElementById('customConfirmationOptionOne').removeEventListener('click', option1Callback);
    document.getElementById('customConfirmationOptionTwo').removeEventListener('click', option2Callback);

    confirmationSection.innerHTML = "";
    confirmationSection.remove();
  });

  //setup the event listeners
  document.getElementById('customConfirmationOptionOne').addEventListener('click', option1Callback);
  document.getElementById('customConfirmationOptionTwo').addEventListener('click', option2Callback);

  document.getElementById('customConfirmationOptionOne').addEventListener('click', () => {
    document.getElementById('customConfirmationOptionOne').removeEventListener('click', option1Callback);
    document.getElementById('customConfirmationOptionTwo').removeEventListener('click', option2Callback);

    confirmationSection.innerHTML = "";
    confirmationSection.remove()
  });
  document.getElementById('customConfirmationOptionTwo').addEventListener('click', () => {
    document.getElementById('customConfirmationOptionOne').removeEventListener('click', option1Callback);
    document.getElementById('customConfirmationOptionTwo').removeEventListener('click', option2Callback);

    confirmationSection.innerHTML = "";
    confirmationSection.remove()
  });
}
