const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

exports.resetPasswordUnauthenticated = functions.https.onCall(async (data, context) => {
  //get the user that is has the given email
  if (data.email) {
    try {
      const link = await admin.auth().generatePasswordResetLink(data.email)
      await sendPasswordResetEmail(data.email, link);
      return 'We have sent an email with instruction on how to reset your password.'
    }
    catch (error) {
      console.log(error)
      throw 'We are having difficulty processing this request. Please try again later.'
    }
  }
  else {
    throw 'Please fill in the email field.'
  }
});

async function sendPasswordResetEmail(email, link) {

  const msg = {
    to: email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Password Reset Requested',
    text: `We received a request to change your password for your Lyrn account connected to this email. If you did not request this change then you can ignore this email. Otherwise, follow this link to rest your password. ${link}`,
    html: `
      <p>We received a request to change your password for your Lyrn account connected to this email.</p>
      <p>If you did not request this change then you can ignore this email.</p>
      <p>Otherwise, follow this link to reset your password.</p>
      <a href="${link}">Reset My Password</a>
    `
  }

  await sgMail.send(msg);   
  return;
}