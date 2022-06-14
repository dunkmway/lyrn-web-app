const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.removeAllAttendeesOnEventDelete = functions.firestore
.document('Events/{eventID}')
.onDelete(async (snap, context) => {
  // we want to query for all of the attendees of this event and delete them
  const attendeeSnapshot = await snap.ref.collection('Attendees').get();
  await Promise.all(attendeeSnapshot.docs.map(doc => doc.ref.delete()));
  return;
});