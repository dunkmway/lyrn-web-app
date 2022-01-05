const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

exports.sendLessonLink = functions.pubsub.schedule('*/30 * * * *').timeZone('America/Denver').onRun(async (context) => {
  // assume the current time is at a 30 minute mark in the given timezone
  let now = new Date()
  let thirtyMinuteMark = new Date(now).setMinutes(30,0,0);
  let hourFromMark = new Date(thirtyMinuteMark).setHours(new Date(thirtyMinuteMark).getHours() + 1);

  //get all the events an hour from the last thirty minute mark
  let eventQuery = await admin.firestore().collection('Events')
  .where('start', '==', hourFromMark)
  .get();

  let promises = [];
  eventQuery.forEach(async (eventDoc) => {
    // get all of the info needed to send the link off
    const eventData = eventDoc.data();

    //get the student and parent info
    const studentDoc = await admin.firestore().collection('Users').doc(eventData.student).get();
    const parentDoc = await admin.firestore().collection('Users').doc(eventData.parents[0]).get();

    const lessonData = {
      title: eventData.title,
      zoomLink: eventData.studentZoomURL,
    }

    if (studentDoc.data().email) {
      promises.push(sendLessonLinkEmail(studentDoc.data().email, lessonData));
    }
    promises.push(sendLessonLinkEmail(parentDoc.data().email, lessonData));
  })

  return await Promise.all(promises);
});

exports.sendLessonLink_test = functions.https.onRequest(async (request, response) => {
  // assume the current time is at a 30 minute mark in the given timezone
  let now = new Date()
  let thirtyMinuteMark = new Date(now).setMinutes(30,0,0);
  let hourFromMark = new Date(thirtyMinuteMark).setHours(new Date(thirtyMinuteMark).getHours() + 1);

  //get all the events an hour from the last thirty minute mark
  let eventQuery = await admin.firestore().collection('Events')
  .where('start', '==', hourFromMark)
  .get();

  let promises = [];
  eventQuery.forEach(async (eventDoc) => {
    // get all of the info needed to send the link off
    const eventData = eventDoc.data();

    //get the student and parent info
    const studentDoc = await admin.firestore().collection('Users').doc(eventData.student).get();
    const parentDoc = await admin.firestore().collection('Users').doc(eventData.parents[0]).get();

    const lessonData = {
      title: eventData.title,
      zoomLink: eventData.studentZoomURL,
    }

    if (studentDoc.data().email) {
      promises.push(sendLessonLinkEmail(studentDoc.data().email, lessonData));
    }
    promises.push(sendLessonLinkEmail(parentDoc.data().email, lessonData));
  })

  await Promise.all(promises);
  response.send('everything was updated')
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