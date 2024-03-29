const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

const PRACTICE_TEST_ID = 'DwhdhUl8ldRExlG5DxAc';
const ALT_PRACTICE_TEST_ID = 'p6YFv9xLs142aI2rGYup';

const MARKETING_TEST_CODE = '76C';
const SECTION_TIMES = {
  english: 1000 * 60 * 45,
  math: 1000 * 60 * 60,
  reading: 1000 * 60 * 35,
  science: 1000 * 60  * 35
}

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

  if (!data.email) { return };
  await admin.firestore().collection('Unsubscribe').doc().set({
    email: data.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

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
  data.timestamp = new Date(data.timestamp)
  await ref.set(data);

  //then send an email to the admin account with the data
  const msg = {
    to: data.email,
    from: 'contact@lyrnwithus.com',
    subject: 'Start Lyrning with a free sessions!',
    text: `Thank you for choosing Lyrn Tutoring! Please let us know if you have any questions and we would love to help you reach your academic goals.
    To help you get started use this promo code to get your first session free when signing up for an ACT program. FIRST ACT
    Call or text to get started (385) 281-7215 or respond to this email.`,
    html: `
    <head>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Work+Sans:300,600&display=swap');
  </style>
</head>
<body style="font-family: 'proxima-nova', sans-serif;">
  <div id="email" style="width:600px;margin: auto;background:white;">

  <table role="presentation" border="0" width="100%" cellspacing="0">
  <tr>
    <td bgcolor="white" align="right" style="color:#27c03a; border-bottom: 2px solid #27c03a;">
      <a href="https://lyrnwithus.com">
        <img src="https://lyrnwithus.com/Images/Lyrn_Logo_Green.png" alt="Lyrn Logo" style="height: 3em;">
      </a>
    </td>
  </tr>
</table>
  
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td style="padding: 30px 30px 30px 60px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">Promo Code</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
            Please let us know if you have any questions and we would love to help you reach your academic goals.
            To help you get started mention this promo code to get your first session free when signing up for an ACT program.
          </p>
        </td> 
      </tr>
      <tr>
        <td align="center">
          <h3 style="font-size: 2em; color: #27c03a;">FIRST ACT</h3>
        </td>
      </tr>
    </table>
    
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td style="vertical-align: top;padding: 30px 10px 30px 60px;"> 
          <h2 style="font-size: 28px; margin:0 0 20px 0;"> ACT Prep Courses </h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Sometimes practice on your own just doesn't cut it. Our ACT programs are designed to help you get the score you need to get into college or get that scholarship.</p>
          <p style="margin:0;font-size:16px;line-height:24px; "><a href="https://lyrnwithus.com/pricing?course=act" style="color:#27c03a;text-decoration:underline;">Learn more</a></p>
        </td>
        <td style="vertical-align: top;padding: 30px 30px 30px 60px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">Subject Tutoring</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Need some help with your homework or preparing for a test? Subject tutoring is your perfect fit. We teach all topics K-12, and one of our expert tutors will gladly help you get that A+!</p>
          <p style="margin:0;font-size:16px;line-height:24px; "><a href="https://lyrnwithus.com/pricing?course=subjectTutoring" style="color:#27c03a;text-decoration:underline;">Learn more</a></p>
        </td>
      </tr>       
    </table>

    <table role="presentation" border="0" width="100%">
      <tr>
        <td bgcolor="#EAF0F6" align="center" style="padding: 30px 30px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">We're here to help</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Give us a call or text to learn more about our programs. We can't wait to start Lyrning with you!</p>
          <a href="tel:+13852817215" style="text-decoration: underline; font-weight: bold; color: #253342;">(385) 281-7215</a>
        </td>
      </tr>
    </table>
    
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td class="footer" bgcolor="#F5F8FA" style="padding: 30px 30px;">
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/terms">Terms and Conditions</a>
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/privacy">Privacy Policy</a>
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/unsubscribe?q=${ref.id}"> Unsubscribe </a>
          <p style="font-size: 12px; color: #99ACC2;">Copyright © 2022 Advanced Education Solutions LLC. All rights reserved.</p>      
        </td>
      </tr>
    </table> 
  </div>
</body>
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

  // check if this email has requested a practice test already
  const practiceTestQuery = await admin.firestore().collection('Leads')
  .where('email', '==', data.email)
  .where('type', '==', 'ACT-practiceTest')
  .get();

  // if they already have had a practice test sent to this email
  if (practiceTestQuery.size > 0) {
    // we don't need to send off the request or create the assignments
    // just send them an email with the same link as before
    await sendPracticeTestEmail(data.email, practiceTestQuery.docs[0].id);
    return;
  }

  //save the contact data to firebase first
  const ref = admin.firestore().collection('Leads').doc();
  data.timestamp = new Date(data.timestamp)
  await ref.set(data);

  // get the questions for the marketing test
  const marketingTest = (await admin.firestore()
  .collection('ACT-Test-Data')
  .where('code', '==', MARKETING_TEST_CODE)
  .limit(1)
  .get())
  .docs[0];

  const marketingSections = (await admin.firestore()
  .collection('ACT-Section-Data')
  .where('test', '==', marketingTest.id)
  .get()).docs
  .sort((a,b) => a.data().code < b.data().code ? -1 : a.data().code > b.data().code ? 1 : 0);

  const marketingQuestions = await Promise.all(marketingSections.map(async (section) => {
    return (await admin.firestore()
    .collection('ACT-Question-Data')
    .where('test', '==', marketingTest.id)
    .where('section', '==', section.id)
    .get()).docs
    .sort((a,b) => a.data().code - b.data().code)
    .map(doc => doc.id);
  }))

  // set a new assignment for the lead
  // this is so the assignments come in the proper order in the test taker
  const now = new Date();

  await Promise.all(marketingSections.map((sectionDoc, index) => {
    admin.firestore().collection('ACT-Assignments').doc().set({
      open: new Date(new Date(now).setSeconds(now.getSeconds() + index)),
      close: new Date(new Date(now).setFullYear(now.getFullYear() + 1)),
      questions: marketingQuestions[index],
      scaledScoreSection: sectionDoc.id,
      sectionCode: sectionDoc.data().code,
      status: 'new',
      student: ref.id,
      time: SECTION_TIMES[sectionDoc.data().code],
      type: 'marketing'
    })
  }))

  //then send an email to the admin account with the data
  await sendPracticeTestEmail(data.email, ref.id)

  return;
});

function sendPracticeTestEmail(email, leadID) {
  const msg = {
    to: email,
    from: {
      email: 'contact@lyrnwithus.com',
      name: 'Lyrn Contact'
    },
    subject: 'Full Length ACT Tests',
    text: `Thank you for choosing Lyrn Tutoring! Please let us know if you have any questions and we would love to help you reach your academic goals.
    To help you get started, go to this link to take a full length ACT test and get your results back immediately. https://lyrnwithus.com/test-taker/${leadID}
    Call or text (385) 281-7215 or respond to this email if you would like to learn more about how you can increase your ACT score.`,
    html: `
    <head>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Work+Sans:300,600&display=swap');
  </style>
</head>
<body style="font-family: 'proxima-nova', sans-serif;">
  <div id="email" style="width:600px;margin: auto;background:white;">

  <table role="presentation" border="0" width="100%" cellspacing="0">
  <tr>
    <td bgcolor="white" align="right" style="color:#27c03a; border-bottom: 2px solid #27c03a;">
      <a href="https://lyrnwithus.com">
        <img src="https://lyrnwithus.com/Images/Lyrn_Logo_Green.png" alt="Lyrn Logo" style="height: 3em;">
      </a>
    </td>
  </tr>
</table>
  
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td style="padding: 30px 30px 30px 60px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">ACT Practice Test</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
            The best way to start preparing for the ACT is with a practice test. 
            Knowing what your baseline score is will help you set realistic goals. 
            With our test taker, you will be timed just like the actual test, and when you're done, you can review your score and answers all from the same place.
            What are you waiting for? Get testing!
          </p>
        </td> 
      </tr>
    </table>
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" align="center" border="0" cellspacing="0">
            <tr>
              <td align="center" bgcolor="#27c03a" style="border-radius: .5em;">
                <a style="font-size: 1em; text-decoration: none; color: white; padding: .5em 1em; border-radius: .5em; display: inline-block; border: 1px solid #27c03a;" href="https://lyrnwithus.com/test-taker/${leadID}">Open Test Taker</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td style="vertical-align: top;padding: 30px 10px 30px 60px;"> 
          <h2 style="font-size: 28px; margin:0 0 20px 0;"> ACT Prep Courses </h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Sometimes practice on your own just doesn't cut it. Our ACT programs are designed to help you get the score you need to get into college or get that scholarship.</p>
          <p style="margin:0;font-size:16px;line-height:24px; "><a href="https://lyrnwithus.com/pricing?course=act" style="color:#27c03a;text-decoration:underline;">Learn more</a></p>
        </td>
        <td style="vertical-align: top;padding: 30px 30px 30px 60px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">Subject Tutoring</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Need some help with your homework or preparing for a test? Subject tutoring is your perfect fit. We teach all topics K-12, and one of our expert tutors will gladly help you get that A+!</p>
          <p style="margin:0;font-size:16px;line-height:24px; "><a href="https://lyrnwithus.com/pricing?course=subjectTutoring" style="color:#27c03a;text-decoration:underline;">Learn more</a></p>
        </td>
      </tr>       
    </table>

    <table role="presentation" border="0" width="100%">
      <tr>
        <td bgcolor="#EAF0F6" align="center" style="padding: 30px 30px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">We're here to help</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Give us a call or text to learn more about our programs. We can't wait to start Lyrning with you!</p>
          <a href="tel:+13852817215" style="text-decoration: underline; font-weight: bold; color: #253342;">(385) 281-7215</a>
        </td>
      </tr>
    </table>
    
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td class="footer" bgcolor="#F5F8FA" style="padding: 30px 30px;">
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/terms">Terms and Conditions</a>
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/privacy">Privacy Policy</a>
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/unsubscribe?q=${leadID}"> Unsubscribe </a>
          <p style="font-size: 12px; color: #99ACC2;">Copyright © 2022 Advanced Education Solutions LLC. All rights reserved.</p>      
        </td>
      </tr>
    </table> 
  </div>
</body>
    `,
  }
  return sgMail.send(msg)
}

exports.sendLessonSeriesRequest = functions.https.onCall(async (data, context) => {
  // context.app will be undefined if the request doesn't include a valid
  // App Check token.
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from an App Check verified app.'
    )
  }

  // check if this email has requested a practice test already
  const practiceTestQuery = await admin.firestore().collection('Leads')
  .where('email', '==', data.email)
  .where('type', '==', 'ACT-lessonSeries')
  .get();

  // if they already have had a practice test sent to this email
  if (practiceTestQuery.size > 0) {
    // we don't need to send off the request or create the assignments
    // just send them an email with the same link as before
    await sendLessonSeriesEmail(data.email);
    return;
  }

  //save the contact data to firebase first
  const ref = admin.firestore().collection('Leads').doc();
  data.timestamp = new Date(data.timestamp)
  await ref.set(data);

  //then send an email to the admin account with the data
  await sendLessonSeriesEmail(data.email)

  return;
});

function sendLessonSeriesEmail(email) {
  const msg = {
    to: email,
    from: {
      email: 'contact@lyrnwithus.com',
      name: 'Lyrn Contact'
    },
    subject: 'ACT Lesson Series',
    text: `Welcome to our free online ACT prep course. 
    We will be covering the 3 most important topics for all four sections of the ACT (English, Math, Reading, and Science). 
    In this series, you will learn 
    1) how to identify questions related to each topic, 
    2) the relevant knowledge needed to attack each problem, and 
    3) the most efficient way to approach each question. 
    Additionally, you will see example problems from actual ACT tests with complete breakdowns.`,
    html: `
    <head>
    <style>
      @import url('https://fonts.googleapis.com/css?family=Work+Sans:300,600&display=swap');
    </style>
  </head>
  <body style="font-family: 'proxima-nova', sans-serif;">
    <div id="email" style="width:600px;margin: auto;background:white;">
  
      <table role="presentation" border="0" width="100%" cellspacing="0">
        <tr>
          <td bgcolor="white" align="right" style="color:#27c03a; border-bottom: 2px solid #27c03a;">
            <a href="https://lyrnwithus.com">
              <img src="https://lyrnwithus.com/Images/Lyrn_Logo_Green.png" alt="Lyrn Logo" style="height: 3em;">
            </a>
          </td>
        </tr>
      </table>
    
      <table role="presentation" border="0" width="100%" cellspacing="0">
        <tr>
          <td style="padding: 30px 0px 30px 0px;">
            <h2 style="font-size: 28px; margin:0 0 20px 0;">FREE Online ACT Prep Series</h2>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
              Welcome to our free online ACT prep course. 
              We will be covering the 3 most important topics for all four sections of the ACT (English, Math, Reading, and Science). 
              In this series, you will learn 
              1) how to identify questions related to each topic, 
              2) the relevant knowledge needed to attack each problem, and 
              3) the most efficient way to approach each question. 
              Additionally, you will see example problems from actual ACT tests with complete breakdowns.
            </p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
              Want more? Get up to 2 hours of <strong>FREE</strong> personalized 1-on-1 ACT tutoring with one of our professional tutors. 
              To sign up, call us at <a href="tel:+13852817215" style="text-decoration: underline; font-weight: bold; color: #27c03a;">(385)-300-0906</a>. 
              Visit <a href="https://lyrnwithus.com/pricing" style="text-decoration: underline; font-weight: bold; color: #27c03a;">our website</a> for more details.
            </p>
          </td>
        </tr>
      </table>
  
      <table role="presentation" border="0" width="100%" cellspacing="0">
        <tr>
          <td style="padding: 30px 0px 30px 0px;">
            <h2 style="font-size: 28px; margin:0 0 20px 0;">Outline</h2>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 1 — English: Connotation</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 2 — Math: Logic</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 3 — Reading: Focused Reading</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 4 — Science: Conflicting Viewpoints</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 5 — English: Simplicity</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 6 — Math: Units</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 7 — Reading: Context Clues</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 8 — Science: Reasoned Answer</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 9 — English: Sentence Composition</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 10 — Math: Polygons</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 11 — Reading: Main Idea</p>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Lesson 12 — Science: Graph Reading</p>
          </td>
        </tr>
      </table>
  
      <table role="presentation" border="0" width="100%">
        <tr>
          <td bgcolor="#EAF0F6" align="center" style="padding: 30px 30px;">
            <h2 style="font-size: 28px; margin:0 0 20px 0;">We're here to help</h2>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Give us a call or text to learn more about our programs. We can't wait to start Lyrning with you!</p>
            <a href="tel:+13852817215" style="text-decoration: underline; font-weight: bold; color: #253342;">(385) 281-7215</a>
          </td>
        </tr>
      </table>
      
      <table role="presentation" border="0" width="100%" cellspacing="0">
        <tr>
          <td class="footer" bgcolor="#F5F8FA" style="padding: 30px 30px;">
            <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="https://lyrnwithus.com/terms">Terms and Conditions</a>
            <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="https://lyrnwithus.com/privacy">Privacy Policy</a>
            <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="https://lyrnwithus.com/unsubscribe">Unsubscribe</a>
            <p style="font-size: 12px; color: #99ACC2;">Copyright © 2022 Advanced Education Solutions LLC. All rights reserved.</p>      
          </td>
        </tr>
      </table> 
    </div>
  </body>
    `,
  }
  return sgMail.send(msg)
}

exports.sendQuestionnaireRequest = functions.https.onCall(async (data, context) => {
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
  data.timestamp = new Date(data.timestamp)
  await ref.set(data);

  const msg = {
    to: 'admin@lyrnwithus.com',
    from: {
      email: 'system@lyrnwithus.com',
      name: 'Lyrn System'
    },
    subject: 'Questionnaire Submitted!',
    text: `
    name: ${data.name}\n
    phone: ${data.phone}\n
    day: ${data.day}\n
    time: ${data.time}\n
    answers: ${data.answers}\n
    Love,\n
    Lydia
    `,
    html: `
    <p>name: ${data.name}</p>
    <p>phone: ${data.phone}</p>
    <p>day: ${data.day}</p>
    <p>time: ${data.time}</p>
    <p>answers: ${data.answers}</p>
    <p>Love,</p>
    <p>Lydia</p>
    `
  }

  await sgMail.send(msg);

  // if (data.answers.split(', ')[1] == 'act') {
  //   await sendQuestionnaireEmail(data.email, data.name);
  // }

  return;
});

function sendQuestionnaireEmail(email, name) {
  const msg = {
    to: email,
    from: {
      email: 'contact@lyrnwithus.com',
      name: 'Lyrn Contact'
    },
    subject: 'Your custom program is almost ready!',
    text: `
    Hey ${name}\n
    We're excited to help you prepare for the ACT! Our amazing programs have been optimized to maximize your ACT score in the least amount of time.
    We're working on creating your custom program based on the responses you gave us in our questionnaire. While you wait, we wanted to tell you about our FREE program previews.
    We highly recommend that everyone should try out our program before making a decision. That is why we want to offer you 2 hours of ACT prep with one of our 
    professional tutors and work through some of the most important topics in the ACT. You can sign up for one or all of the sections using the link below.\n\n
    https://calendly.com/duncanmorais
    
    `,
    html: `
    <head>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Work+Sans:300,600&display=swap');
  </style>
</head>
<body style="font-family: 'proxima-nova', sans-serif;">
  <div id="email" style="width:600px;margin: auto;background:white;">

    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td bgcolor="white" align="right" style="color:#27c03a; border-bottom: 2px solid #27c03a;">
          <a href="https://lyrnwithus.com">
            <img src="https://lyrnwithus.com/Images/Lyrn_Logo_Green.png" alt="Lyrn Logo" style="height: 3em;">
          </a>
        </td>
      </tr>
    </table>
  
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td style="padding: 30px 30px 30px 60px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">Your personalized program!</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Hey ${name}</p>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
            We're excited to help you prepare for the ACT! Our amazing programs have been optimized to maximize your ACT score in the least amount of time.
            We're working on creating your custom program based on the responses you gave us in our questionnaire. While you wait, we wanted to tell you about our <b>FREE</b> program previews.
            We highly recommend that everyone should try out our program before making a decision. That is why we want to offer you 2 hours of ACT prep with one of our 
            professional tutors and work through some of the most important topics in the ACT. You can sign up for one or all of the sections using the link below.
          </p>
        </td> 
      </tr>
    </table>
    <table role="presentation" border="0" width="100%" cellspacing="0" style="margin-bottom: 2em;">
      <tr>
        <td align="center">
          <table role="presentation" align="center" border="0" cellspacing="0">
            <tr>
              <td align="center" bgcolor="#27c03a" style="border-radius: .5em;">
                <a style="font-size: 1em; text-decoration: none; color: white; padding: .5em 1em; border-radius: .5em; display: inline-block; border: 1px solid #27c03a;" href="https://calendly.com/duncanmorais">Schedule a Program Preview</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" border="0" width="100%">
      <tr>
        <td bgcolor="#EAF0F6" align="center" style="padding: 30px 30px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">We're here to help</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Give us a call or text to learn more about our programs. We can't wait to start Lyrning with you!</p>
          <a href="tel:+13852817215" style="text-decoration: underline; font-weight: bold; color: #253342;">(385) 281-7215</a>
        </td>
      </tr>
    </table>
    
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td class="footer" bgcolor="#F5F8FA" style="padding: 30px 30px;">
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/terms">Terms and Conditions</a>
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/privacy">Privacy Policy</a>
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/unsubscribe"> Unsubscribe </a>
          <p style="font-size: 12px; color: #99ACC2;">Copyright © 2022 Advanced Education Solutions LLC. All rights reserved.</p>      
        </td>
      </tr>
    </table> 
  </div>
</body>
    `
  }

  return sgMail.send(msg);
}