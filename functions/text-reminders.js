const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

const accountSid = functions.config().twilio.sid;
const authToken = functions.config().twilio.authtoken;;
const client = require('twilio')(accountSid, authToken);

const LYRN_MAIN_NUMBER = '+13857070215';

exports.textReminder = functions.pubsub.schedule('30 17 * * *').timeZone('America/Denver').onRun(async (context) => {
  //get the UTC time to look like the current time in salt lake so that relative times match up when we are setting hours
  const SALTLAKE_TIME_OFFSET = 7;
  const UTC_TO_SALTLAKE = new Date().setHours(new Date().getHours() - SALTLAKE_TIME_OFFSET);
  const tomorrowStart = new Date(UTC_TO_SALTLAKE).setHours(24 + SALTLAKE_TIME_OFFSET,0,0,0);
  const tomorrowEnd = new Date(UTC_TO_SALTLAKE).setHours(48 + SALTLAKE_TIME_OFFSET,0,0,0);

  let eventQuery = await admin.firestore().collection('Events')
  .where('start', '>=', tomorrowStart)
  .where('start', '<', tomorrowEnd)
  .orderBy('start')
  .get()

  //for each event
  eventQuery.forEach(async (eventDoc) => {
    let eventData = eventDoc.data();
    let attendees = eventData.attendees;
    let start = new Date(eventData.start).setHours(new Date(eventData.start).getHours(eventData.start) - SALTLAKE_TIME_OFFSET);
    let title = eventData.title;
    let studentName = eventData.studentName.split(', ')[1] + " " + eventData.studentName.split(', ')[0];

    //for all attendees send them a reminder text
    attendees.forEach(async (attendee) => {
      let userDoc = await admin.firestore().collection('Users').doc(attendee).get();
      //only send reminders to parents and students
      if (userDoc.data().role == 'student' || userDoc.data().role == 'parent') {
        if (userDoc.data().phoneNumber) {
          const unformattedNumber = userDoc.data().phoneNumber;
          const userPhoneNumber = '+1' + unformattedNumber.replace(/\(|\)|-| /g, '');
          await eventReminderText(userPhoneNumber, LYRN_MAIN_NUMBER, studentName);
        }
      }
    })
  })

  return;
});

exports.text_reminder_test = functions.https.onRequest(async (request, response) => {
  //get the UTC time to look like the current time in salt lake so that relative times match up when we are setting hours
  const SALTLAKE_TIME_OFFSET = 7;
  const UTC_TO_SALTLAKE = new Date().setHours(new Date().getHours() - SALTLAKE_TIME_OFFSET);
  const tomorrowStart = new Date(UTC_TO_SALTLAKE).setHours(24 + SALTLAKE_TIME_OFFSET,0,0,0);
  const tomorrowEnd = new Date(UTC_TO_SALTLAKE).setHours(48 + SALTLAKE_TIME_OFFSET,0,0,0);

  let eventQuery = await admin.firestore().collection('Events')
  .where('start', '>=', tomorrowStart)
  .where('start', '<', tomorrowEnd)
  .orderBy('start')
  .get()

  //for each event
  eventQuery.forEach(async (eventDoc) => {
    let eventData = eventDoc.data();
    let attendees = eventData.attendees;
    let start = new Date(eventData.start).setHours(new Date(eventData.start).getHours(eventData.start) - SALTLAKE_TIME_OFFSET);
    let title = eventData.title;
    let studentName = eventData.studentName.split(', ')[1] + " " + eventData.studentName.split(', ')[0];

    //for all attendees send them a reminder text
    attendees.forEach(async (attendee) => {
      let userDoc = await admin.firestore().collection('Users').doc(attendee).get();
      //only send reminders to parents and students
      if (userDoc.data().role == 'student' || userDoc.data().role == 'parent') {
        if (userDoc.data().phoneNumber) {
          const unformattedNumber = userDoc.data().phoneNumber;
          const userPhoneNumber = '+1' + unformattedNumber.replace(/\(|\)|-| /g, '');
          await eventReminderText(userPhoneNumber, LYRN_MAIN_NUMBER, studentName);
        }
      }
    })
  })

  response.send('reminders sent!')
});

function eventReminderText(to, from, studentName) {
  const body = `We're excited to see you tomorrow for your lesson with ${studentName}.`
  return client.messages.create({body: body, from: from, to: to})
}

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
      'time': (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours > 12 ? " pm" : " am"),
      'longDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours > 12 ? " pm" : " am"),
      'longDateMilitary' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + hours.toString() + ":" + current_date.getMinutes().toString().padStart(2,'0'),
      'mm/dd/yyyy' : month.toString().padStart(2, '0') + "/" + dayOfMonth.toString().padStart(2, '0') + "/" + year.toString().padStart(4, '0'),
      'fullCalendar' : year.toString().padStart(4,'0') + "-" + month.toString().padStart(2, '0') + "-" + dayOfMonth.toString().padStart(2, '0') + "T" + hours.toString().padStart(2, '0') + ":" + current_date.getMinutes().toString().padStart(2, "0"),
      'shortestDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString().slice(-2),
      'startOfDayInt' : new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0).getTime(),
      'shortDateAndDay' : days[dayOfWeek - 1] + month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString(),
      'longReadable' : days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + " " + year.toString() + " at " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours > 12 ? ' p' : ' a') + 'm',
      'dayAndDate' : days[dayOfWeek - 1] + ', ' + shortMonths[month - 1] + ' ' + dayOfMonth.toString(),
  };
}