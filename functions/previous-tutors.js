const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.updatePreviousTutors = functions.pubsub.schedule('5 0 * * *').timeZone('America/Denver').onRun(async (context) => {
  // assume the current hour is 00:05 in the given timezone
  let now = new Date()
  let midnightToday = new Date(now).setMinutes(0,0,0);
  let midnightYesterday = new Date(midnightToday).setDate(new Date(midnightToday).getDate() - 1);

  //get all the events between yesterday and today
  let eventQuery = await admin.firestore().collection('Events')
  .where('start', '>=', midnightYesterday)
  .where('start', '<', midnightToday)
  .orderBy('start')
  .get();

  let promises = [];
  eventQuery.forEach((eventDoc) => {
    //get the student doc and update the previous tutor object with the new count
    const eventData = eventDoc.data();

    if (eventData.student && eventData.staff.length > 0) {
      eventData.staff.forEach(staff => {
        let update = admin.firestore().collection('Users').doc(eventData.student).update({
          [`previousTutors.${staff}`]: admin.firestore.FieldValue.increment(1)
        })

        promises.push(update);
      })
    }
  })

  return await Promise.all(promises);
});

exports.updatePreviousTutors_test = functions.https.onRequest(async (request, response) => {
  let now = new Date()
  let midnightToday = new Date(now).setMinutes(0,0,0);
  let midnightYesterday = new Date(midnightToday).setDate(new Date(midnightToday).getDate() - 1);

  //get all the events between yesterday and today
  let eventQuery = await admin.firestore().collection('Events')
  .where('start', '>=', midnightYesterday)
  .where('start', '<', midnightToday)
  .orderBy('start')
  .get();

  let promises = [];
  eventQuery.forEach((eventDoc) => {
    //get the student doc and update the previous tutor object with the new count
    const eventData = eventDoc.data();

    if (eventData.student && eventData.staff.length > 0) {
      eventData.staff.forEach(staff => {
        let update = admin.firestore().collection('Users').doc(eventData.student).update({
          [`previousTutors.${staff}`]: admin.firestore.FieldValue.increment(1)
        })

        promises.push(update);
      })
    }
  })

  await Promise.all(promises);
  response.send('everything was updated')
});