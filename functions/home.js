const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

exports.sendContactRequest = functions.https.onCall(async (data, context) => {
  // context.app will be undefined if the request doesn't include a valid
  // App Check token.
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from an App Check verified app.'
    )
  }

  //save the contact data to firebase first
  await admin.firestore().collection('Contact-Requests').add(data);

  //then send an email to the admin account with the data
  const msg = {
    to: 'contact@lyrnwithus.com', // Change to your recipient
    from: 'system@lyrnwithus.com', // Change to your verified sender
    subject: 'New Contact Request',
    text: `Name: ${data.name}\n
    Email: ${data.email}\n
    Phone: ${data.number}\n
    Subject: ${data.course}\n
    Message: ${data.message}\n
    Timestamp: ${data.timestamp}\n\n
    Love,\n
    Lydia\n
    `,
    html: `<p>Name: ${data.name}</p>
    <p>Email: ${data.email}</p>
    <p>Phone: ${data.number}</p>
    <p>Subject: ${data.course}</p>
    <p>Message: ${data.message}</p>
    <p>Timestamp: ${data.timestamp}</p><br>
    <p>Love,</p>
    <p>Lydia</p>`,
  }
  await sgMail.send(msg)

  return;
});