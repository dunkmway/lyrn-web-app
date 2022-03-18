const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

exports.sendScheduledEmails = functions.pubsub.schedule('0 * * * *').timeZone('America/Denver').onRun(async (context) => {
  // get all of the scheduled emails that are meant to be sent at this time or earlier
  const emailDocs = await admin.firestore().collection('Scheduled-Emails').where('when', '<=', new Date().getTime()).get();

  await Promise.all(emailDocs.docs.map(async (doc) => {
    const msg = {
      to: doc.data().to,
      from: 'support@lyrnwithus.com',
      subject: doc.data().subject,
      text: doc.data().text,
      html: doc.data().html
    }
    await sgMail.send(msg)
  }));

  return;
});