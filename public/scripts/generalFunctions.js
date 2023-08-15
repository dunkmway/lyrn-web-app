/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************************!*\
  !*** ./src/generalFunctions.js ***!
  \*********************************/
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
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        'time': (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? " pm" : " am"),
        'longDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? " pm" : " am"),
        'longDateMilitary' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + hours.toString() + ":" + current_date.getMinutes().toString().padStart(2,'0'),
        'mm/dd/yyyy' : month.toString().padStart(2, '0') + "/" + dayOfMonth.toString().padStart(2, '0') + "/" + year.toString().padStart(4, '0'),
        'fullCalendar' : year.toString().padStart(4,'0') + "-" + month.toString().padStart(2, '0') + "-" + dayOfMonth.toString().padStart(2, '0') + "T" + hours.toString().padStart(2, '0') + ":" + current_date.getMinutes().toString().padStart(2, "0"),
        'completeCalendar' : year.toString().padStart(4,'0') + "-" + month.toString().padStart(2, '0') + "-" + dayOfMonth.toString().padStart(2, '0') + "T" + hours.toString().padStart(2, '0') + ":" + current_date.getMinutes().toString().padStart(2, "0") + ":" + current_date.getSeconds().toString().padStart(2, "0"),
        'shortestDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString().slice(-2),
        'startOfDayInt' : new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0).getTime(),
        'shortDateAndDay' : days[dayOfWeek - 1] + month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString(),
        'shortReadable': days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + ", " + year.toString(),
        'longReadable' : days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + ", " + year.toString() + " at " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? ' p' : ' a') + 'm',
        'veryLongReadable' : days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + ", " + year.toString() + " at " + (hours > 12 ? (hours - 12).toString() : (hours == 0 ? 12 : hours).toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + ":" + current_date.getSeconds().toString().padStart(2,'0') + (hours >= 12 ? ' p' : ' a') + 'm',
        'dayAndDate' : days[dayOfWeek - 1] + ', ' + shortMonths[month - 1] + ' ' + dayOfMonth.toString(),
        'shortDateTime' : shortDays[dayOfWeek - 1] + ' ' + month + '/' + dayOfMonth + '/' + year.toString().slice(-2) + ', ' + (hours > 12 ? (hours - 12).toString() : (hours == 0 ? '12' : hours.toString())) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? " pm" : " am"),
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
 * 
 * @param {HTMLElement} selectElement the select element that should be populated with options
 * @param {Array} optionValues the options' values
 * @param {Array} optionTexts the options' text contents
 */
function addSelectOptions(selectElement, optionValues, optionTexts) {
  //check that the values and texts match in length
  if (optionValues.length != optionTexts.length) {throw "option values and options texts must have the same number of elements"}
  
  optionValues.forEach((optionValue, index) => {
    let option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionTexts[index];
    selectElement.appendChild(option);
  });
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
    if (classes[i]) {
      element.classList.add(classes[i]);
    }
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

/**
 * Given a list of roles this function will return the role that has the highest permissions or if empty will return the absolute highest role (dev).
 * @param {Array<String>} roleList list of roles to check
 * @returns {String} highest role from the given for the highest role
 */
function getHighestRole(roleList) {
  if (!roleList || roleList.length == undefined) {throw 'not the correct input'}
  const listOfRoles = ['dev', 'admin', 'secretary', 'tutor', 'parent', 'student']

  for (let i = 0; i < roleList.length; i++) {
    if (listOfRoles.indexOf(roleList[i]) == -1) {throw 'the element at index ' + i + ' is not a valid role!'}
  }

  let lowestindex = Infinity;
  for (let i = 0; i < roleList.length; i++) {
    lowestindex = listOfRoles.indexOf(roleList[i]) < lowestindex ? listOfRoles.indexOf(roleList[i]) : lowestindex;
    console.log(lowestindex)
  }

  return listOfRoles[lowestindex]
}

function queryStrings() {
  var GET = {};
  var queryString = window.location.search.replace(/^\?/, '');
  queryString.split(/\&/).forEach(function(keyValuePair) {
      var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
      var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
      GET[paramName] = paramValue;
  });

  return GET;
}

/**
 * get the path paramater at a certain index in the path
 * @param {number} index index in path to get paramater
 * @returns {string} returns the path paramater
 */
function pathParameter(index) {
  return location.pathname.split('/')[index + 1]
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBLEMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9seXJuX3dlYl9hcHBfY2xlYW4vLi9zcmMvZ2VuZXJhbEZ1bmN0aW9ucy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogUGFyc2UgdGhlIGRhdGV0aW1lIGFzIGFuIGludGVnZXIgaW50byBhIGRhdGV0aW1lIG9iamVjdFxyXG4gKiBAcGFyYW0ge0ludGVnZXJ9IGRhdGUgRGF0ZXRpbWUgcmVwcmVzZW50ZWQgYXMgYW4gaW50ZWdlclxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBhIGphdmFzY3JpcHQgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGRhdGV0aW1lIGVsZW1lbnRzXHJcbiAqL1xyXG5mdW5jdGlvbiBjb252ZXJ0RnJvbURhdGVJbnQoZGF0ZSkge1xyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSBhbiBpbnRlZ2VyIHdhcyBwYXNzZWQgaW5cclxuICAgIGlmICh0eXBlb2YgZGF0ZSAhPT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBkYXRlIG9iamVjdCBmcm9tIHRoZSBkYXRlIGFzIGFuIGludGVnZXJcclxuICAgIGNvbnN0IGN1cnJlbnRfZGF0ZSA9IG5ldyBEYXRlKGRhdGUpXHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSB2YXJpYWJsZXMgdGhhdCB3aWxsIGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZVxyXG4gICAgY29uc3QgeWVhciA9IGN1cnJlbnRfZGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgY29uc3QgbW9udGggPSBjdXJyZW50X2RhdGUuZ2V0TW9udGgoKSArIDE7XHJcbiAgICBjb25zdCBkYXlPZk1vbnRoID0gY3VycmVudF9kYXRlLmdldERhdGUoKTtcclxuICAgIGNvbnN0IGRheU9mV2VlayA9IGN1cnJlbnRfZGF0ZS5nZXREYXkoKSArIDE7XHJcbiAgICBjb25zdCBob3VycyA9IGN1cnJlbnRfZGF0ZS5nZXRIb3VycygpO1xyXG5cclxuICAgIC8vIE5lZWRlZCB0byBnZXQgdGhlIG1vbnRoIGFuZCBkYXkgc3RyaW5nIHZhbHVlc1xyXG4gICAgY29uc3QgbW9udGhzID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ11cclxuICAgIGNvbnN0IHNob3J0TW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcHQnLCAnT2N0JywgJ05vdicsICdEZWMnXVxyXG4gICAgY29uc3QgZGF5cyA9IFsnU3VuZGF5JywgJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsICdGcmlkYXknLCAnU2F0dXJkYXknXTtcclxuICAgIGNvbnN0IHNob3J0RGF5cyA9IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J107XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuZCByZXR1cm4gdGhlIGRhdGV0aW1lIG9iamVjdFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAneWVhcicgOiB5ZWFyLFxyXG4gICAgICAgICdtb250aE51bWJlcicgOiBtb250aCxcclxuICAgICAgICAnbW9udGhTdHJpbmcnIDogbW9udGhzW21vbnRoIC0gMV0sXHJcbiAgICAgICAgJ2RheU9mTW9udGgnIDogZGF5T2ZNb250aCxcclxuICAgICAgICAnZGF5T2ZXZWVrTnVtYmVyJyA6IGRheU9mV2VlayxcclxuICAgICAgICAnZGF5T2ZXZWVrU3RyaW5nJyA6IGRheXNbZGF5T2ZXZWVrIC0gMV0sXHJcbiAgICAgICAgJ2hvdXJzJyA6IGhvdXJzID4gMTIgPyBob3VycyAtIDEyIDogaG91cnMsXHJcbiAgICAgICAgJ21pbGl0YXJ5SG91cnMnIDogaG91cnMsXHJcbiAgICAgICAgJ21pbnV0ZXMnIDogY3VycmVudF9kYXRlLmdldE1pbnV0ZXMoKSxcclxuICAgICAgICAnc2Vjb25kcycgOiBjdXJyZW50X2RhdGUuZ2V0U2Vjb25kcygpLFxyXG4gICAgICAgICdtaWxsaXNlY29uZHMnIDogY3VycmVudF9kYXRlLmdldE1pbGxpc2Vjb25kcygpLFxyXG4gICAgICAgICdpbnRlZ2VyVmFsdWUnIDogZGF0ZSxcclxuICAgICAgICAnc2hvcnREYXRlJyA6IG1vbnRoLnRvU3RyaW5nKCkgKyBcIi9cIiArIGRheU9mTW9udGgudG9TdHJpbmcoKSArIFwiL1wiICsgeWVhci50b1N0cmluZygpLFxyXG4gICAgICAgICd0aW1lJzogKGhvdXJzID4gMTIgPyAoaG91cnMgLSAxMikudG9TdHJpbmcoKSA6IGhvdXJzLnRvU3RyaW5nKCkpICsgXCI6XCIgKyBjdXJyZW50X2RhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwnMCcpICsgKGhvdXJzID49IDEyID8gXCIgcG1cIiA6IFwiIGFtXCIpLFxyXG4gICAgICAgICdsb25nRGF0ZScgOiBtb250aC50b1N0cmluZygpICsgXCIvXCIgKyBkYXlPZk1vbnRoLnRvU3RyaW5nKCkgKyBcIi9cIiArIHllYXIudG9TdHJpbmcoKSArIFwiIFwiICsgKGhvdXJzID4gMTIgPyAoaG91cnMgLSAxMikudG9TdHJpbmcoKSA6IGhvdXJzLnRvU3RyaW5nKCkpICsgXCI6XCIgKyBjdXJyZW50X2RhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwnMCcpICsgKGhvdXJzID49IDEyID8gXCIgcG1cIiA6IFwiIGFtXCIpLFxyXG4gICAgICAgICdsb25nRGF0ZU1pbGl0YXJ5JyA6IG1vbnRoLnRvU3RyaW5nKCkgKyBcIi9cIiArIGRheU9mTW9udGgudG9TdHJpbmcoKSArIFwiL1wiICsgeWVhci50b1N0cmluZygpICsgXCIgXCIgKyBob3Vycy50b1N0cmluZygpICsgXCI6XCIgKyBjdXJyZW50X2RhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwnMCcpLFxyXG4gICAgICAgICdtbS9kZC95eXl5JyA6IG1vbnRoLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKSArIFwiL1wiICsgZGF5T2ZNb250aC50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJykgKyBcIi9cIiArIHllYXIudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpLFxyXG4gICAgICAgICdmdWxsQ2FsZW5kYXInIDogeWVhci50b1N0cmluZygpLnBhZFN0YXJ0KDQsJzAnKSArIFwiLVwiICsgbW9udGgudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpICsgXCItXCIgKyBkYXlPZk1vbnRoLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKSArIFwiVFwiICsgaG91cnMudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpICsgXCI6XCIgKyBjdXJyZW50X2RhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpLFxyXG4gICAgICAgICdjb21wbGV0ZUNhbGVuZGFyJyA6IHllYXIudG9TdHJpbmcoKS5wYWRTdGFydCg0LCcwJykgKyBcIi1cIiArIG1vbnRoLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKSArIFwiLVwiICsgZGF5T2ZNb250aC50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJykgKyBcIlRcIiArIGhvdXJzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKSArIFwiOlwiICsgY3VycmVudF9kYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKSArIFwiOlwiICsgY3VycmVudF9kYXRlLmdldFNlY29uZHMoKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKSxcclxuICAgICAgICAnc2hvcnRlc3REYXRlJyA6IG1vbnRoLnRvU3RyaW5nKCkgKyBcIi9cIiArIGRheU9mTW9udGgudG9TdHJpbmcoKSArIFwiL1wiICsgeWVhci50b1N0cmluZygpLnNsaWNlKC0yKSxcclxuICAgICAgICAnc3RhcnRPZkRheUludCcgOiBuZXcgRGF0ZSh5ZWFyLCBtb250aCAtIDEsIGRheU9mTW9udGgsIDAsIDAsIDAsIDApLmdldFRpbWUoKSxcclxuICAgICAgICAnc2hvcnREYXRlQW5kRGF5JyA6IGRheXNbZGF5T2ZXZWVrIC0gMV0gKyBtb250aC50b1N0cmluZygpICsgXCIvXCIgKyBkYXlPZk1vbnRoLnRvU3RyaW5nKCkgKyBcIi9cIiArIHllYXIudG9TdHJpbmcoKSxcclxuICAgICAgICAnc2hvcnRSZWFkYWJsZSc6IGRheXNbZGF5T2ZXZWVrIC0gMV0gKyAnICcgKyBtb250aHNbbW9udGggLSAxXSArIFwiIFwiICsgZGF5T2ZNb250aC50b1N0cmluZygpICsgXCIsIFwiICsgeWVhci50b1N0cmluZygpLFxyXG4gICAgICAgICdsb25nUmVhZGFibGUnIDogZGF5c1tkYXlPZldlZWsgLSAxXSArICcgJyArIG1vbnRoc1ttb250aCAtIDFdICsgXCIgXCIgKyBkYXlPZk1vbnRoLnRvU3RyaW5nKCkgKyBcIiwgXCIgKyB5ZWFyLnRvU3RyaW5nKCkgKyBcIiBhdCBcIiArIChob3VycyA+IDEyID8gKGhvdXJzIC0gMTIpLnRvU3RyaW5nKCkgOiBob3Vycy50b1N0cmluZygpKSArIFwiOlwiICsgY3VycmVudF9kYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsJzAnKSArIChob3VycyA+PSAxMiA/ICcgcCcgOiAnIGEnKSArICdtJyxcclxuICAgICAgICAndmVyeUxvbmdSZWFkYWJsZScgOiBkYXlzW2RheU9mV2VlayAtIDFdICsgJyAnICsgbW9udGhzW21vbnRoIC0gMV0gKyBcIiBcIiArIGRheU9mTW9udGgudG9TdHJpbmcoKSArIFwiLCBcIiArIHllYXIudG9TdHJpbmcoKSArIFwiIGF0IFwiICsgKGhvdXJzID4gMTIgPyAoaG91cnMgLSAxMikudG9TdHJpbmcoKSA6IChob3VycyA9PSAwID8gMTIgOiBob3VycykudG9TdHJpbmcoKSkgKyBcIjpcIiArIGN1cnJlbnRfZGF0ZS5nZXRNaW51dGVzKCkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCcwJykgKyBcIjpcIiArIGN1cnJlbnRfZGF0ZS5nZXRTZWNvbmRzKCkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCcwJykgKyAoaG91cnMgPj0gMTIgPyAnIHAnIDogJyBhJykgKyAnbScsXHJcbiAgICAgICAgJ2RheUFuZERhdGUnIDogZGF5c1tkYXlPZldlZWsgLSAxXSArICcsICcgKyBzaG9ydE1vbnRoc1ttb250aCAtIDFdICsgJyAnICsgZGF5T2ZNb250aC50b1N0cmluZygpLFxyXG4gICAgICAgICdzaG9ydERhdGVUaW1lJyA6IHNob3J0RGF5c1tkYXlPZldlZWsgLSAxXSArICcgJyArIG1vbnRoICsgJy8nICsgZGF5T2ZNb250aCArICcvJyArIHllYXIudG9TdHJpbmcoKS5zbGljZSgtMikgKyAnLCAnICsgKGhvdXJzID4gMTIgPyAoaG91cnMgLSAxMikudG9TdHJpbmcoKSA6IChob3VycyA9PSAwID8gJzEyJyA6IGhvdXJzLnRvU3RyaW5nKCkpKSArIFwiOlwiICsgY3VycmVudF9kYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsJzAnKSArIChob3VycyA+PSAxMiA/IFwiIHBtXCIgOiBcIiBhbVwiKSxcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldE9iamVjdFZhbHVlKHByb3BlcnR5UGF0aCwgdmFsdWUsIG9iaikge1xyXG4gIC8vIHRoaXMgaXMgYSBzdXBlciBzaW1wbGUgcGFyc2luZywgeW91IHdpbGwgd2FudCB0byBtYWtlIHRoaXMgbW9yZSBjb21wbGV4IHRvIGhhbmRsZSBjb3JyZWN0bHkgYW55IHBhdGhcclxuICAvLyBpdCB3aWxsIHNwbGl0IGJ5IHRoZSBkb3RzIGF0IGZpcnN0IGFuZCB0aGVuIHNpbXBseSBwYXNzIGFsb25nIHRoZSBhcnJheSAob24gbmV4dCBpdGVyYXRpb25zKVxyXG4gIGxldCBwcm9wZXJ0aWVzID0gQXJyYXkuaXNBcnJheShwcm9wZXJ0eVBhdGgpID8gcHJvcGVydHlQYXRoIDogcHJvcGVydHlQYXRoLnNwbGl0KFwiLlwiKVxyXG5cclxuICAvLyBOb3QgeWV0IGF0IHRoZSBsYXN0IHByb3BlcnR5IHNvIGtlZXAgZGlnZ2luZ1xyXG4gIGlmIChwcm9wZXJ0aWVzLmxlbmd0aCA+IDEpIHtcclxuICAgIC8vIFRoZSBwcm9wZXJ0eSBkb2Vzbid0IGV4aXN0cyBPUiBpcyBub3QgYW4gb2JqZWN0IChhbmQgc28gd2Ugb3ZlcndyaXR0ZSBpdCkgc28gd2UgY3JlYXRlIGl0XHJcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0aWVzWzBdKSB8fCB0eXBlb2Ygb2JqW3Byb3BlcnRpZXNbMF1dICE9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgIG9ialtwcm9wZXJ0aWVzWzBdXSA9IHt9XHJcbiAgICB9IFxyXG4gICAgICAvLyBXZSBpdGVyYXRlLlxyXG4gICAgcmV0dXJuIHNldE9iamVjdFZhbHVlKHByb3BlcnRpZXMuc2xpY2UoMSksIHZhbHVlLCBvYmpbcHJvcGVydGllc1swXV0pXHJcbiAgICAgIC8vIFRoaXMgaXMgdGhlIGxhc3QgcHJvcGVydHkgLSB0aGUgb25lIHdoZXJlIHRvIHNldCB0aGUgdmFsdWVcclxuICB9IFxyXG4gIGVsc2Uge1xyXG4gICAgLy8gV2Ugc2V0IHRoZSB2YWx1ZSB0byB0aGUgbGFzdCBwcm9wZXJ0eVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jykge1xyXG4gICAgICBvYmpbcHJvcGVydGllc1swXV0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHZhbHVlKSlcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBvYmpbcHJvcGVydGllc1swXV0gPSB2YWx1ZVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWUgLy8gdGhpcyBpcyB0aGUgZW5kXHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHNlbGVjdEVsZW1lbnQgdGhlIHNlbGVjdCBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHBvcHVsYXRlZCB3aXRoIG9wdGlvbnNcclxuICogQHBhcmFtIHtBcnJheX0gb3B0aW9uVmFsdWVzIHRoZSBvcHRpb25zJyB2YWx1ZXNcclxuICogQHBhcmFtIHtBcnJheX0gb3B0aW9uVGV4dHMgdGhlIG9wdGlvbnMnIHRleHQgY29udGVudHNcclxuICovXHJcbmZ1bmN0aW9uIGFkZFNlbGVjdE9wdGlvbnMoc2VsZWN0RWxlbWVudCwgb3B0aW9uVmFsdWVzLCBvcHRpb25UZXh0cykge1xyXG4gIC8vY2hlY2sgdGhhdCB0aGUgdmFsdWVzIGFuZCB0ZXh0cyBtYXRjaCBpbiBsZW5ndGhcclxuICBpZiAob3B0aW9uVmFsdWVzLmxlbmd0aCAhPSBvcHRpb25UZXh0cy5sZW5ndGgpIHt0aHJvdyBcIm9wdGlvbiB2YWx1ZXMgYW5kIG9wdGlvbnMgdGV4dHMgbXVzdCBoYXZlIHRoZSBzYW1lIG51bWJlciBvZiBlbGVtZW50c1wifVxyXG4gIFxyXG4gIG9wdGlvblZhbHVlcy5mb3JFYWNoKChvcHRpb25WYWx1ZSwgaW5kZXgpID0+IHtcclxuICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbi52YWx1ZSA9IG9wdGlvblZhbHVlO1xyXG4gICAgb3B0aW9uLnRleHRDb250ZW50ID0gb3B0aW9uVGV4dHNbaW5kZXhdO1xyXG4gICAgc2VsZWN0RWxlbWVudC5hcHBlbmRDaGlsZChvcHRpb24pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogY3JlYXRlIGh0bWwgZWxlbWVudFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZWxlbWVudFR5cGUgdGFnIG5hbWUgZm9yIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSBjcmVhdGVkXHJcbiAqIEBwYXJhbSB7W1N0cmluZ119IGNsYXNzZXMgY2xhc3NlcyBmb3IgdGhlIGVsZW1lbnRcclxuICogQHBhcmFtIHtbU3RyaW5nXX0gYXR0cmlidXRlcyBhdHRyaWJ1dGVzIGZvciB0aGUgZWxlbWVudFxyXG4gKiBAcGFyYW0ge1tTdHJpbmddfSB2YWx1ZXMgdmFsdWVzIGZvciBlYWNoIGF0dHJpYnV0ZSBmb3IgdGhlIGVsZW1lbnRcclxuICogQHBhcmFtIHtTdHJpbmd9IHRleHQgaW5uZXJodG1sIGZvciB0aGUgZWxlbWVudFxyXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IGh0bWwgZWxlbWVudCBvZiB0aGUgZ2l2ZW4gdGFnXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50KGVsZW1lbnRUeXBlLCBjbGFzc2VzID0gW10sIGF0dHJpYnV0ZXMgPSBbXSwgdmFsdWVzID0gW10sIHRleHQgPSBcIlwiKSB7XHJcbiAgLy8gSW5pdGlhbGl6ZSB0aGUgZWxlbWVudFxyXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50VHlwZSk7XHJcblxyXG4gIC8vIFNldCBlYWNoIG9mIHRoZSBzcGVjaWZpZWQgYXR0cmlidXRlcyBmb3IgdGhlIGVsZW1lbnRcclxuICBpZiAoYXR0cmlidXRlcy5sZW5ndGggPT0gdmFsdWVzLmxlbmd0aCAmJiBhdHRyaWJ1dGVzLmxlbmd0aCA+IDApIHtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVzW2ldLCB2YWx1ZXNbaV0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHRoZSBjbGFzc2VzIHRvIHRoZSBlbGVtZW50XHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAoY2xhc3Nlc1tpXSkge1xyXG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3Nlc1tpXSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBTZXQgdGhlIGlubmVyIGh0bWwgdGV4dFxyXG4gIGlmICh0ZXh0ICE9IFwiXCIpIHtcclxuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gdGV4dDtcclxuICB9XHJcblxyXG4gIC8vIFJldHVybiB0aGUgZWxlbWVudFxyXG4gIHJldHVybiBlbGVtZW50O1xyXG59XHJcblxyXG4vKipcclxuICogY3JlYXRlIGh0bWwgZWxlbWVudHMgYW5kIHJldHVybiB0aGVtIGluIGEgcGFyZW50IGRpdlxyXG4gKiBAcGFyYW0ge1tTdHJpbmddfSBlbGVtZW50VHlwZSB0YWcgbmFtZXMgZm9yIHRoZSBlbGVtZW50cyB0aGF0IHdpbGwgYmUgY3JlYXRlZFxyXG4gKiBAcGFyYW0ge1tbU3RyaW5nXV19IGNsYXNzZXMgY2xhc3NlcyBmb3IgZWFjaCBlbGVtZW50XHJcbiAqIEBwYXJhbSB7W1tTdHJpbmddXX0gYXR0cmlidXRlcyBhdHRyaWJ1dGVzIGZvciBlYWNoIGVsZW1lbnRcclxuICogQHBhcmFtIHtbW1N0cmluZ11dfSB2YWx1ZXMgdmFsdWVzIGZvciBlYWNoIGF0dHJpYnV0ZSBmb3IgZWFjaCBlbGVtZW50XHJcbiAqIEBwYXJhbSB7W1N0cmluZ119IHRleHQgaW5uZXJodG1sIGZvciBlYWNoIGVsZW1lbnRcclxuICogQHBhcmFtIHtbU3RyaW5nXX0gZGl2Q2xhc3NlcyBjYWxzc2VzIGZvciB0aGUgcGFyZW50IGRpdiBmb3IgdGhlIGVsZW1lbnRzXHJcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gaHRtbCBkaXYgd2hvc2UgY2hpbGRyZW4gYXJlIHRoZSByZXF1ZXN0ZWQgZWxlbWVudHNcclxuICovXHJcbiBmdW5jdGlvbiBjcmVhdGVFbGVtZW50cyhlbGVtZW50VHlwZSA9IFtdLCBjbGFzc2VzID0gW1tdXSwgYXR0cmlidXRlcyA9IFtbXV0sIHZhbHVlcyA9IFtbXV0sIHRleHQgPSBbXSwgZGl2Q2xhc3NlcyA9IFtdKSB7XHJcbiAgLy8gTWFrZSBzdXJlIHRoZXJlIGlzIHNvbWV0aGluZyBwYXNzZWQgaW50byB0aGUgZnVuY3Rpb25cclxuICBpZiAoZWxlbWVudFR5cGUubGVuZ3RoID49IDApIHtcclxuICAgIGxldCBlbGVtZW50cyA9IGNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgZGl2Q2xhc3Nlcyk7XHJcblxyXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggb2YgdGhlIGVsZW1lbnRzIHRoYXQgbmVlZCBjcmVhdGVkXHJcbiAgICBpZiAoYXR0cmlidXRlcy5sZW5ndGggPT0gdmFsdWVzLmxlbmd0aCAmJiBhdHRyaWJ1dGVzLmxlbmd0aCA+PSAwKSB7XHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudFR5cGUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBlbGVtZW50cy5hcHBlbmRDaGlsZChjcmVhdGVFbGVtZW50KGVsZW1lbnRUeXBlW2ldLCBjbGFzc2VzW2ldLCBhdHRyaWJ1dGVzW2ldLCB2YWx1ZXNbaV0sIHRleHRbaV0pKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJldHVybiB0aGUgZWxlbWVudFxyXG4gICAgcmV0dXJuIGVsZW1lbnRzO1xyXG5cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGN1c3RvbUNvbmZpcm0obWVzc2FnZSA9IFwiXCIsIG9wdGlvbjEgPSBcIlwiLCBvcHRpb24yID0gXCJcIiwgb3B0aW9uMUNhbGxiYWNrLCBvcHRpb24yQ2FsbGJhY2spIHtcclxuXHJcbiAgLy9zZXR1cCB0aGUgSFRNTCBmb3IgdGhlIGNvbmZpbWF0aW9uXHJcbiAgbGV0IGNvbmZpcm1hdGlvblNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWN0aW9uJyk7XHJcbiAgY29uZmlybWF0aW9uU2VjdGlvbi5pZCA9IFwiY3VzdG9tQ29uZmlybWF0aW9uU2VjdGlvblwiO1xyXG5cclxuICBjb25maXJtYXRpb25TZWN0aW9uLmlubmVySFRNTCA9IChgXHJcbiAgICA8ZGl2IGNsYXNzPVwiY29uZmlybWF0aW9uQ29udGFpbmVyXCI+XHJcbiAgICAgIDxkaXYgaWQ9XCJjdXN0b21Db25maXJtYXRpb25NZXNzYWdlXCI+JHttZXNzYWdlfTwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzPVwib3B0aW9uc0NvbnRhaW5lclwiPlxyXG4gICAgICAgIDxkaXYgaWQ9XCJjdXN0b21Db25maXJtYXRpb25PcHRpb25PbmVcIj4ke29wdGlvbjF9PC9kaXY+XHJcbiAgICAgICAgPGRpdiBpZD1cImN1c3RvbUNvbmZpcm1hdGlvbk9wdGlvblR3b1wiPiR7b3B0aW9uMn08L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICBgKTtcclxuXHJcbiAgLy9hcHBlbmQgdGhlIGNvbmZpcm1hdGlvbiB0byB0aGUgRE9NXHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb25maXJtYXRpb25TZWN0aW9uKTtcclxuXHJcbiAgLy90aGlzIHdpbGwgcmVtb3ZlIHRoZSBtb2RhbCBpZiB0aGUgdXNlciBjbGlja3Mgb2ZmIG9mIHRoZSBjb250YWluZXJcclxuICBjb25maXJtYXRpb25TZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgIGlmIChlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0KSByZXR1cm47XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VzdG9tQ29uZmlybWF0aW9uT3B0aW9uT25lJykucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvcHRpb24xQ2FsbGJhY2spO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1c3RvbUNvbmZpcm1hdGlvbk9wdGlvblR3bycpLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb3B0aW9uMkNhbGxiYWNrKTtcclxuXHJcbiAgICBjb25maXJtYXRpb25TZWN0aW9uLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICBjb25maXJtYXRpb25TZWN0aW9uLnJlbW92ZSgpO1xyXG4gIH0pO1xyXG5cclxuICAvL3NldHVwIHRoZSBldmVudCBsaXN0ZW5lcnNcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VzdG9tQ29uZmlybWF0aW9uT3B0aW9uT25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvcHRpb24xQ2FsbGJhY2spO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXN0b21Db25maXJtYXRpb25PcHRpb25Ud28nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9wdGlvbjJDYWxsYmFjayk7XHJcblxyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXN0b21Db25maXJtYXRpb25PcHRpb25PbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXN0b21Db25maXJtYXRpb25PcHRpb25PbmUnKS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIG9wdGlvbjFDYWxsYmFjayk7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VzdG9tQ29uZmlybWF0aW9uT3B0aW9uVHdvJykucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvcHRpb24yQ2FsbGJhY2spO1xyXG5cclxuICAgIGNvbmZpcm1hdGlvblNlY3Rpb24uaW5uZXJIVE1MID0gXCJcIjtcclxuICAgIGNvbmZpcm1hdGlvblNlY3Rpb24ucmVtb3ZlKClcclxuICB9KTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VzdG9tQ29uZmlybWF0aW9uT3B0aW9uVHdvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VzdG9tQ29uZmlybWF0aW9uT3B0aW9uT25lJykucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvcHRpb24xQ2FsbGJhY2spO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1c3RvbUNvbmZpcm1hdGlvbk9wdGlvblR3bycpLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb3B0aW9uMkNhbGxiYWNrKTtcclxuXHJcbiAgICBjb25maXJtYXRpb25TZWN0aW9uLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICBjb25maXJtYXRpb25TZWN0aW9uLnJlbW92ZSgpXHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHaXZlbiBhIGxpc3Qgb2Ygcm9sZXMgdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgcm9sZSB0aGF0IGhhcyB0aGUgaGlnaGVzdCBwZXJtaXNzaW9ucyBvciBpZiBlbXB0eSB3aWxsIHJldHVybiB0aGUgYWJzb2x1dGUgaGlnaGVzdCByb2xlIChkZXYpLlxyXG4gKiBAcGFyYW0ge0FycmF5PFN0cmluZz59IHJvbGVMaXN0IGxpc3Qgb2Ygcm9sZXMgdG8gY2hlY2tcclxuICogQHJldHVybnMge1N0cmluZ30gaGlnaGVzdCByb2xlIGZyb20gdGhlIGdpdmVuIGZvciB0aGUgaGlnaGVzdCByb2xlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRIaWdoZXN0Um9sZShyb2xlTGlzdCkge1xyXG4gIGlmICghcm9sZUxpc3QgfHwgcm9sZUxpc3QubGVuZ3RoID09IHVuZGVmaW5lZCkge3Rocm93ICdub3QgdGhlIGNvcnJlY3QgaW5wdXQnfVxyXG4gIGNvbnN0IGxpc3RPZlJvbGVzID0gWydkZXYnLCAnYWRtaW4nLCAnc2VjcmV0YXJ5JywgJ3R1dG9yJywgJ3BhcmVudCcsICdzdHVkZW50J11cclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb2xlTGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgaWYgKGxpc3RPZlJvbGVzLmluZGV4T2Yocm9sZUxpc3RbaV0pID09IC0xKSB7dGhyb3cgJ3RoZSBlbGVtZW50IGF0IGluZGV4ICcgKyBpICsgJyBpcyBub3QgYSB2YWxpZCByb2xlISd9XHJcbiAgfVxyXG5cclxuICBsZXQgbG93ZXN0aW5kZXggPSBJbmZpbml0eTtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvbGVMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICBsb3dlc3RpbmRleCA9IGxpc3RPZlJvbGVzLmluZGV4T2Yocm9sZUxpc3RbaV0pIDwgbG93ZXN0aW5kZXggPyBsaXN0T2ZSb2xlcy5pbmRleE9mKHJvbGVMaXN0W2ldKSA6IGxvd2VzdGluZGV4O1xyXG4gICAgY29uc29sZS5sb2cobG93ZXN0aW5kZXgpXHJcbiAgfVxyXG5cclxuICByZXR1cm4gbGlzdE9mUm9sZXNbbG93ZXN0aW5kZXhdXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHF1ZXJ5U3RyaW5ncygpIHtcclxuICB2YXIgR0VUID0ge307XHJcbiAgdmFyIHF1ZXJ5U3RyaW5nID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5yZXBsYWNlKC9eXFw/LywgJycpO1xyXG4gIHF1ZXJ5U3RyaW5nLnNwbGl0KC9cXCYvKS5mb3JFYWNoKGZ1bmN0aW9uKGtleVZhbHVlUGFpcikge1xyXG4gICAgICB2YXIgcGFyYW1OYW1lID0ga2V5VmFsdWVQYWlyLnJlcGxhY2UoLz0uKiQvLCBcIlwiKTsgLy8gc29tZSBkZWNvZGluZyBpcyBwcm9iYWJseSBuZWNlc3NhcnlcclxuICAgICAgdmFyIHBhcmFtVmFsdWUgPSBrZXlWYWx1ZVBhaXIucmVwbGFjZSgvXltePV0qXFw9LywgXCJcIik7IC8vIHNvbWUgZGVjb2RpbmcgaXMgcHJvYmFibHkgbmVjZXNzYXJ5XHJcbiAgICAgIEdFVFtwYXJhbU5hbWVdID0gcGFyYW1WYWx1ZTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIEdFVDtcclxufVxyXG5cclxuLyoqXHJcbiAqIGdldCB0aGUgcGF0aCBwYXJhbWF0ZXIgYXQgYSBjZXJ0YWluIGluZGV4IGluIHRoZSBwYXRoXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBpbmRleCBpbiBwYXRoIHRvIGdldCBwYXJhbWF0ZXJcclxuICogQHJldHVybnMge3N0cmluZ30gcmV0dXJucyB0aGUgcGF0aCBwYXJhbWF0ZXJcclxuICovXHJcbmZ1bmN0aW9uIHBhdGhQYXJhbWV0ZXIoaW5kZXgpIHtcclxuICByZXR1cm4gbG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKVtpbmRleCArIDFdXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZUFsbENoaWxkTm9kZXMocGFyZW50KSB7XHJcbiAgd2hpbGUgKHBhcmVudC5maXJzdENoaWxkKSB7XHJcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChwYXJlbnQuZmlyc3RDaGlsZCk7XHJcbiAgfVxyXG59Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9