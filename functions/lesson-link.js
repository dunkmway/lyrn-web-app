const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const axios = require("axios").default;
const zoomBaseURL = 'https://api.zoom.us/v2'

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

/**
 * send off lesson link emails every half hour an hour before every lesson
 * it is intentially slow so that we don't go over zoom's rate limits
 */
exports.sendLessonLink = functions.pubsub.schedule('*/30 * * * *').timeZone('America/Denver').onRun(async (context) => {
  // assume the current time is at a 30 minute mark in the given timezone
  let now = new Date()
  let thirtyMinuteMark = roundToNearestHalfHour(now.getTime());
  let hourFromMark = new Date(thirtyMinuteMark).setHours(new Date(thirtyMinuteMark).getHours() + 1);

  //get all the events an hour from the last thirty minute mark
  let eventQuery = await admin.firestore().collection('Events')
  .where('start', '==', hourFromMark)
  .get();

  eventQuery.forEach(async (eventDoc) => {
    // get all of the info needed to send the link off
    const eventData = eventDoc.data();

    //get the student, parent, and tutor info
    const studentDoc = await admin.firestore().collection('Users').doc(eventData.student).get();
    const parentDoc = await admin.firestore().collection('Users').doc(eventData.parents[0]).get();
    const tutorDoc = await admin.firestore().collection('Users').doc(eventData.staff[0]).get();

    //create the zoom meeting
    const payload = {
      iss: functions.config().zoom.key,
      exp: Math.round(((new Date()).getTime() + 5000) / 1000)
    };
    const token = jwt.sign(payload, functions.config().zoom.secret);
    const config = {
      method: 'post',
      url: `/users/${tutorDoc.data().zoomID}/meetings`,
      baseURL: zoomBaseURL,
      data: {
        topic: eventData.title,
        type: 2,
        start_time: convertMilliToZoomDateFormat(eventData.start),
        duration: (eventData.end - eventData.start) / 60000,
      },
      headers: {
        Authorization: 'Bearer ' + token
      }
    }
    const response = await axios(config);
    await eventDoc.ref.update({
      staffZoomURL: response.data.start_url,
      studentZoomURL: response.data.join_url,
      zoomMeetingID: response.data.id
    })

    // send off the emails
    const lessonData = {
      title: eventData.title,
      zoomLink: response.data.join_url
    }

    if (studentDoc.data().email) {
      await sendLessonLinkEmail(studentDoc.data().email, lessonData);
    }
    await sendLessonLinkEmail(parentDoc.data().email, lessonData);
  })
  return
});

function sendLessonLinkEmail(email, lessonData) {
  const msg = {
    to: email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Lesson Link',
    text: `Your Lyrn lesson ${lessonData.title} will start an hour from now! Here is your link to join the zoom call. ${lessonData.zoomLink} 
    We can't wait to see you there. 
    If you have an question or difficulties joining please let us know. You can call or text us at 877-400-1641 or send us an email at contact@lyrnwithus.com `,
    html: `
      <h1>Your Lyrn Lesson is starting soon!</h1>
      <h2>${lessonData.title}</h2>
      <p>In an hour you can jump on your call and get started. Here is your link to join the meeting:<p>
      <a href="${lessonData.zoomLink}">Zoom Link</a>
      <p>If you have an question or difficulties joining please let us know. You can call or text us at 877-400-1641 or send us an email at contact@lyrnwithus.com</p>
    `
  }
  return sgMail.send(msg)
}

function roundToNearestHalfHour(time) {
  const startHour = new Date(time).setMinutes(0,0,0);
  const halfHour = new Date(time).setMinutes(30,0,0);
  const nextHour = new Date(time).setMinutes(60,0,0);

  let closestScore = Math.abs(startHour - time);
  let winningTime = startHour;
  if (Math.abs(halfHour - time) < closestScore) {
    closestScore = Math.abs(halfHour - time);
    winningTime = halfHour;
  }
  if (Math.abs(nextHour - time) < closestScore) {
    closestScore = Math.abs(nextHour - time);
    winningTime = nextHour;
  }

  return winningTime;
}

function convertMilliToZoomDateFormat(timeMilli) {
  const time = new Date(timeMilli);
  const year = time.getFullYear().toString().padStart(4, '0');
  const month = (time.getMonth()+1).toString().padStart(2, '0');
  const day = time.getDate().toString().padStart(2, '0');
  const hour = time.getHours().toString().padStart(2, '0');
  const minute = time.getMinutes().toString().padStart(2, '0');
  const second = time.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
}