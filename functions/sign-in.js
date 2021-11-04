const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.resetPasswordUnauthenticated = functions.https.onCall(async (data, context) => {
  //get the user that is has the given email
  if (data.email) {
    try {
      await admin.auth().sendPasswordResetEmail(data.email);
      return 'We have sent an email with instruction on how to reset your password.'
    }
    catch {
      return 'We are having difficulty processing this request. Please try again later.'
    }
  }
  else {
    return 'Please fill in the email field.'
  }
});