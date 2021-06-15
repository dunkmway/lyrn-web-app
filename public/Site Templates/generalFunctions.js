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
        'mm/dd/yyyy' : month.toString().padStart(2, '0') + "/" + dayOfMonth.toString().padStart(2, '0') + "/" + year.toString().padStart(4, '0')
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
      obj[properties[0]] = Object.create(value)
    }
    else {
      obj[properties[0]] = value
    }
    return true // this is the end
  }
}