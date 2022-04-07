const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

const PRACTICE_TEST_ID = 'DwhdhUl8ldRExlG5DxAc';

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

exports.unsubscribe = functions.https.onCall(async (data, context) => {
  // context.app will be undefined if the request doesn't include a valid
  // App Check token.
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from an App Check verified app.'
    )
  }

  if (!data.q) { return };
  const leadDoc = await admin.firestore().collection('Leads')
  .doc(data.q)
  .get();

  const email = leadDoc.data().email;
  const query = await admin.firestore().collection('Leads')
  .where('email', '==', email)
  .get();

  await Promise.all(query.docs.map(doc => doc.ref.delete()));

  return;
});

exports.sendLeadRequest = functions.https.onCall(async (data, context) => {
  // context.app will be undefined if the request doesn't include a valid
  // App Check token.
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from an App Check verified app.'
    )
  }

  //save the contact data to firebase first
  const ref = admin.firestore().collection('Leads').doc();
  await ref.set(data);

  //then send an email to the admin account with the data
  const msg = {
    to: data.email,
    from: 'contact@lyrnwithus.com',
    subject: 'Start Lyrning with a free sessions!',
    text: `Thank you for choosing Lyrn Tutoring! Please let us know if you have any questions and we would love to help you reach your academic goals.
    To help you get started use this promo code to get your first session free when signing up for an ACT program. FIRST_ACT
    Call or text to get started (385) 300-0906 or respond to this email.`,
    html: `
      <h1>Thank you for choosing Lyrn Tutoring!</h1>
      <h2>Please let us know if you have any questions and we would love to help you reach your academic goals.</h2>
      <p>To help you get started use this promo code to get your first session free when signing up for an ACT program.</p>
      <h2>FIRST_ACT</h2>
      <p>Call or text to get started (385) 300-0906 or respond to this email.</p>
      <h3>Lyrn Tutoring</h3>
      <a href="lyrnwithus.com/unsubscribe?q=${ref.id}">Unsubscribe</a>
    `,
  }
  await sgMail.send(msg)

  return;
});

exports.sendPracticeTestRequest = functions.https.onCall(async (data, context) => {
  // context.app will be undefined if the request doesn't include a valid
  // App Check token.
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from an App Check verified app.'
    )
  }

  //save the contact data to firebase first
  const ref = admin.firestore().collection('Leads').doc();
  await ref.set(data);

  // set a new assignment for the lead
  await admin.firestore().collection('Section-Assignments').doc().set({
    open: new Date(),
    close: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    program: 'practiceTest',
    section: 'all',
    status: 'new',
    student: ref.id,
    test: PRACTICE_TEST_ID
  })

  //then send an email to the admin account with the data
  const msg = {
    to: data.email,
    from: 'contact@lyrnwithus.com',
    subject: 'Full Length ACT Test',
    text: `Thank you for choosing Lyrn Tutoring! Please let us know if you have any questions and we would love to help you reach your academic goals.
    To help you get started, go to this link to take a full length ACT test and get your results back immediately. https://lyrnwithus.com/test-taker?student=${ref.id}
    Call or text (385) 300-0906 or respond to this email if you would like to learn more about how you can increase your ACT score.`,
    html: `
      <h1>Thank you for choosing Lyrn Tutoring!</h1>
      <h2>Please let us know if you have any questions and we would love to help you reach your academic goals.</h2>
      <p>To help you get started, go to this link to take a full length ACT test and get your results back immediately.</p>
      <a href="https://lyrnwithus.com/test-taker?student=${ref.id}">Full Length Test</a>
      <p>Call or text (385) 300-0906 or respond to this email if you would like to learn more about how you can increase your ACT score.</p>
      <h3>Lyrn Tutoring</h3>
      <a href="lyrnwithus.com/unsubscribe?q=${ref.id}">Unsubscribe</a>
    `,
  }
  await sgMail.send(msg)

  return;
});