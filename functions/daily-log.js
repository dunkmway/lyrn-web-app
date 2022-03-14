const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

exports.sendHomework = functions.https.onCall(async (data, context) => {
  // get the email of the student and parent
  const studentDoc = await admin.firestore().collection('Users').doc(data.student).get();
  const parentDoc = await admin.firestore().collection('Users').doc(studentDoc.data().parents[0]).get();

  if (studentDoc.exists && studentDoc.data().email) {
    sendHomeworkEmail(studentDoc.data().email, data.testURL);
  } 
  if (parentDoc.exists) {
    sendHomeworkEmail(parentDoc.data().email, data.testURL);
  } 
})

function sendHomeworkEmail(email, testURL) {
  const msg = {
    to: email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn ACT Homework',
    text: `Your tutor has sent you this homework to be completed. Remember to take this like it is the actual ACT by timing yourself. Good luck and we can't wait to see how you do.
    ${testURL}
    If you have any questions or difficulties, please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com`,
    html: `
      <h1>Ready for some homework!</h1>
      <p>Your tutor has sent you this homework to be completed. Remember to take this like it is the actual ACT by timing yourself. Good luck and we can't wait to see how you do.<p>
      <a href="${testURL}">Test Link</a>
      <p>If you have any questions or difficulties, please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com</p>
    `
  }
  return sgMail.send(msg)
}