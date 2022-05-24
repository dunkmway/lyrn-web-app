const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

const ACT_PROGRAMS = ['actBasics', 'actGuided', 'actFundamentals', 'actComprehensive'];
const SECTION_TIME = {
  english: 45,
  math: 60,
  reading: 35,
  science: 35
}
const MINIMUM_START_BUFFER = 5; // number of minutes an assignment must be started before the required time to take (35 minute section + buffer before lesson starts)

const GUARANTEE_PRACTICE_TEST_ID = 'XYKebuFU5dO7PWOZ2xKY';

const PROMO_CODES = {
  'first act': { isFirstSessionFree: true, percentageOff: 0 },
  '50off': { percentageOff: 50, isFirstSessionFree: false },
  'practice': { percentageOff: 20, isFirstSessionFree: false }
}

// returns the list of UIDs for tutors that are qualified in the given array of qualifications and the array qualifications thay have that are applicable
exports.getQualifiedTutors = functions.https.onCall(async (data, context) => {

  // query for all tutors with this qualifcation
  const tutorSnapshot = await admin.firestore().collection('Users')
  .where('role', '==', 'tutor')
  .where('location', '==', data.location)
  .where('qualifications', 'array-contains-any', data.qualifications)
  .get()

  return tutorSnapshot.docs.map(doc => {
    return {
      id: doc.id,
      name: doc.data().firstName + ' ' + doc.data().lastName,
      qualifications: doc.data().qualifications ? arrayIntersection(doc.data().qualifications, data.qualifications) : []
    }
  })

});

function arrayIntersection(array1, array2) {
  const newArray = [];

  // for efficiency start with the smallest array
  if (array1.length <= array2) { 
    for (let i = 0; i < array1.length; i++) {
      if (array2.includes(array1[i])) {
        newArray.push(array1[i]);
      }
    }
  }
  else {
    for (let i = 0; i < array2.length; i++) {
      if (array1.includes(array2[i])) {
        newArray.push(array2[i]);
      }
    }
  }

  return newArray;
}

// returns the list of UIDs for tutors that are blacklisted given a student uid
exports.getBlacklistedTutors = functions.https.onCall(async (data, context) => {

  // get the student doc
  if (!data.student) {
    return [];
  }
  const studentDoc = await admin.firestore().collection('Users').doc(data.student).get();
  return ( studentDoc.exists && studentDoc.data().blacklistTutors ) ? studentDoc.data().blacklistTutors : [];

});

function arrayIntersection(array1, array2) {
  const newArray = [];

  // for efficiency start with the smallest array
  if (array1.length <= array2) { 
    for (let i = 0; i < array1.length; i++) {
      if (array2.includes(array1[i])) {
        newArray.push(array1[i]);
      }
    }
  }
  else {
    for (let i = 0; i < array2.length; i++) {
      if (array1.includes(array2[i])) {
        newArray.push(array2[i]);
      }
    }
  }

  return newArray;
}

exports.addParentWithEmail = functions.https.onCall(async (data, context) => {
  return await addUserWithEmail(data.email, 'aheuc73bcie843nchr7cmkeoie8', 'parent', data.uid);
});

exports.addStudentWithEmail = functions.https.onCall(async (data, context) => {
  return await addUserWithEmail(data.email, 'aheuc73bcie843nchr7cmkeoie8', 'student', data.uid);
});

exports.addStudentWithoutEmail = functions.https.onCall(async (data, context) => {
  return await addStudentWithoutEmail(data.firstName, data.lastName, data.parentUID);
});

exports.sendInvoiceEmail = functions.https.onCall(async (data, context) => {
  return await sendInvoiceEmail(data.email, data.firstTutors, data.invoice);
});

exports.sendReserveEmail = functions.https.onCall(async (data, context) => {
  return await sendReserveEmail(data.programDetails, data.invoice);
});

exports.sendConfirmationEmail = functions.https.onCall(async (data, context) => {
  return await sendConfirmationEmail(data.email, data.confirmation);
});

exports.checkPromo = functions.https.onCall(async (data, context) => {
  return await checkPromo(data.promoCode, data.invoice);
});


async function addUserWithEmail(email, password, role, uid = null) {
  //get the user by their email
  try {
    //if we find them then they already exists
    //return the user record to the client and send back that this user is not new
    const userRecord = await admin.auth().getUserByEmail(email);
    return {
        user: userRecord,
        newUser: false
    };
  }
  catch (error) {
    //if we fail to get the user then we check if we failed to find the user or if there was an error
    if (error.code === 'auth/user-not-found') {
      //now we know that the user doesn't exist
      //split based on if a UID was provided
      try {
        const userRecord = await (
          uid ?                   //if the request included a UID
          admin.auth().createUser({    //then create the user with the uid
            uid: uid,
            email: email,
            password: password
          }) :
          admin.auth().createUser({    //else only use the email
            email: email,
            password: password
          })
        )
        //once the userRecord is created set the custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, { role })
        //finally we are ready to respond back to the client
        return {
          user: userRecord,
          newUser: true
        };
      }
      catch (error) {
        //failure creating the new user or setting their custom claims
        throw new functions.https.HttpsError(error.code, error.message, error.details)
      }
    }
    else {
      //failure getting the initial user record
      throw new functions.https.HttpsError(error.code, error.message, error.details)
    }
  }
}

async function addStudentWithoutEmail(firstName, lastName, parentUID) {
  // try and query for this student
  const studentQuery = await admin.firestore().collection('Users')
  .where('firstName', '==', firstName)
  .where('lastName', '==', lastName)
  .where('role', '==', 'student')
  .where('parents', 'array-contains', parentUID)
  .get();

  if (studentQuery.size == 1) {
    // we found the student
    return {
      user: {
        uid: studentQuery.docs[0].id,
      },
      newUser: false
    }
  }
  else {
    // we can't confidently say we know who this student is so we'll just create a new user
    return {
      user: {
        uid: admin.firestore().collection('Users').doc().id
      },
      newUser: true
    }
  }
}

// check promo codes
async function checkPromo(promoCode, invoice) {
  if (PROMO_CODES[promoCode]) {
    await admin.firestore().collection('ACT-Invoices').doc(invoice).update(PROMO_CODES[promoCode]);
    return true;
  }
  else {
    return false;
  }
}

// invoice logic
exports.updateInvoiceEvents = functions.firestore
.document('/ACT-Invoices/{invoiceID}')
.onUpdate(async (change, context) => {
  const newValues = change.after.data();
  const oldValues = change.before.data();

  // we only want to check on invoices that were just pending and are now success or failed
  if (oldValues.status != 'pending')  {
    // previously completed
    return;
  }
  if (newValues.status != 'success' && newValues.status != 'failed') {
    // isn't success nor failed
    return;
  }

  // the invoice has been paid
  if (newValues.status == 'success') {
    // check the payment type to determine what we need to do to the lessons
    if (newValues.paymentType == 'one-time') {
      console.log('one-time')
      // charge their account the deposit amount
      const depositAmount = ((newValues.events.length > 1 ? 2 : 1) * newValues.sessionPrice * (100 - newValues.percentageOff - 10) / 100)
      await admin.firestore().collection('stripe_customers').doc(newValues.parent).collection('charges').add({
        currency: 'usd',
        amount: formatAmountForStripe(depositAmount, 'usd'),
        title: `${newValues.programName} initial deposit`,
        created: new Date().getTime()
      });

      // these evetns should be in time order
      const events = newValues.events;
      let batch = admin.firestore().batch();

      // go through all events and apply the discounts to the attendee
      await Promise.all(events.map(async (event, index) => {
        const attendeeQuery = await admin.firestore().collection('Events').doc(event).collection('Attendees').where('student', '==', newValues.student).get();
        const ref = attendeeQuery.docs[0].ref;
        
        // check if first lesson should be free
        if (index == 0 && newValues.isFirstSessionFree) {
          batch.update(ref, {
            price: 0
          })
        }
        // last two lessons were already payed for
        else if (index == (events.length - 1) || index == (events.length - 2)) {
          batch.update(ref, {
            price: 0
          })
        }
        // all other lessons 
        else {
          // discount the rest 90% to align with the 10% off as well as the percentage discount
          batch.update(ref, {
            price: newValues.pricePerHour * (1 - 0.1 - (newValues.percentageOff / 100))
          })
        }
        return
      }));
      // commit the update operations
      await batch.commit();
    }
    else if (newValues.paymentType == 'recurring') {
      console.log('recurring')
      // charge their account the deposit amount
      const depositAmount = ((newValues.events.length > 1 ? 2 : 1) * newValues.sessionPrice * (100 - newValues.percentageOff) / 100)
      await admin.firestore().collection('stripe_customers').doc(newValues.parent).collection('charges').add({
        currency: 'usd',
        amount: formatAmountForStripe(depositAmount, 'usd'),
        title: `${newValues.programName} initial deposit`,
        created: new Date().getTime()
      });

      // these evetns should be in time order
      const events = newValues.events;
      let batch = admin.firestore().batch();

      // go through all events and apply the discounts
      await Promise.all(events.map(async (event, index) => {
        const attendeeQuery = await admin.firestore().collection('Events').doc(event).collection('Attendees').where('student', '==', newValues.student).get();
        const ref = attendeeQuery.docs[0].ref;

        // check if first lesson should be free
        if (index == 0 && newValues.isFirstSessionFree) {
          batch.update(ref, {
            price: 0
          })
        }
        // last two lessons were already payed for
        else if (index == (events.length - 1) || index == (events.length - 2)) {
          batch.update(ref, {
            price: 0
          })
        }
        // all other lessons 
        else {
          // discount the percentage off amount
          batch.update(ref, {
            price: newValues.pricePerHour * (1 - (newValues.percentageOff / 100))
          })
        }
        return
      }))

      // commit the update operations
      await batch.commit();
    }
    else {
      throw new functions.https.HttpsError('invalid-argument', 'the payment type for this invoice in invalid')
    }

    // we want to send the test link to parents and student if they haven't already take the practice test
    // only for one-on-one programs
    if (newValues.program == 'actBasics' || newValues.program == 'actGuided') {
      // query for the practice test
      const practiceTestQuery = await admin.firestore().collection('Section-Assignments')
      .where('student', '==', newValues.student)
      .where('test', '==', GUARANTEE_PRACTICE_TEST_ID)
      .where('section', '==', 'all')
      .limit(1)
      .get();

      // if the assignment does not exist send off the link
      if (practiceTestQuery.size == 0) {
        // set the assignment
        await setPracticeTestAssignments(newValues.student, newValues.program, newValues.programStart)
        // get the student and parent email
        const [parentDoc, studentDoc] = await Promise.all([
          admin.firestore().collection('Users').doc(newValues.parent).get(),
          admin.firestore().collection('Users').doc(newValues.student).get()
        ])

        await sendPracticeTestEmail(parentDoc.data().email, newValues.student);
        if (studentDoc.data().email) {
          await sendPracticeTestEmail(studentDoc.data().email, newValues.student);
        }
      }
    }
    else if (newValues.program == 'actClass') {
      // assign all of the practice test
    }
    else if (newValues.program == 'actStudyGroup') {

    }
  }
  // the invoice has not been paid for
  else if (newValues.status == 'failed') {
    console.log('failed')
    // since the invoice failed we need to remove all lessons associated with this invoice
    const events = newValues.events;
    let batch = admin.firestore().batch();

    await Promise.all(events.map(async event => {
      const ref = admin.firestore().collection('Events').doc(event);
      // group lessons must have the student removed
      if (newValues.program == 'actClass' || newValues.program == 'actStudyGroup') {
        // query for the attendee that matches this student and remove them
        const attendeeQuery = await ref.collection('Attendees').where('student', '==', newValues.student).get();
        attendeeQuery.forEach(attendee => batch.delete(attendee.ref));
      }
      // single lessons can just be deleted
      else {
        batch.delete(ref)
        const attendeeQuery = await ref.collection('Attendees').get();
        attendeeQuery.forEach(attendee => batch.delete(attendee.ref));
      }
      return;
    }));

    // commit the update operations
    await batch.commit();
  }

  return;
});

// Format amount for Stripe
function formatAmountForStripe(amount, currency) {
  return zeroDecimalCurrency(amount, currency)
    ? amount
    : Math.round(amount * 100);
}

// Check if we have a zero decimal currency
// https://stripe.com/docs/currencies#zero-decimal
function zeroDecimalCurrency(amount, currency) {
  let numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency;
}

exports.checkInvoices = functions.pubsub.schedule('55 23 * * *').timeZone('America/Denver').onRun(async (context) => {
  // get all of the invoices that expired before this point and are still pending
  const now = new Date();
  let expiredInvoices = await admin.firestore().collection('ACT-Invoices').where('status', '==', 'pending').where('expiration', '<=', now.getTime()).get();

  await Promise.all(expiredInvoices.docs.map(async (invoiceDoc) => {
    // set the status to failed
    await invoiceDoc.ref.update({
      status: 'failed',
      processedAt: new Date().getTime()
    });

    // send the parent an email telling them that the lessons were removed
    await sendFailedInvoiceEmail(invoiceDoc.data().parent, invoiceDoc.id)
  }));
});

async function sendFailedInvoiceEmail(userUID, invoiceID) {
  // first get the user UID
  const userRecord = await admin.auth().getUser(userUID);

  const msg = {
    to: userRecord.email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Invoice Not Recieved',
    text: `It looks like we didn't recieve a payment method for an ACT program we scheduled for you. Due to this we have removed those lessons from the schedule.
    You can review the expired invoice at this link: https://lyrnwithus.com/act-invoice?invoice=${invoiceID}
    If you have an question or concerns please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com `,
    html: `
      <p>It looks like we didn't recieve a payment method for an ACT program we scheduled for you. Due to this we have removed those lessons from the schedule.<p>
      <p>You can review the expired invoice <a href="https://lyrnwithus.com/act-invoice?invoice=${invoiceID}">here</a></p>
      <p>If you have an question or concerns please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com </p>
    `
  }

  await sgMail.send(msg);
  return;
}

async function sendInvoiceEmail(email, firstTutors, invoiceID) {
  // we need to determine any overlap for the firstTutors
  // make the tutor the key and the value an array of sections they are teaching
  let tutorSections = {};
  for (const section in firstTutors) {
    if (!tutorSections[firstTutors[section]]) {
      tutorSections[firstTutors[section]] = [];
    }
    tutorSections[firstTutors[section]].push(section.charAt(0).toUpperCase() + section.slice(1));
  }

  // convert the tutor section arrays to their string equavalent grammatically correct
  let tutorSectionStr = {};
  for (const tutor in tutorSections) {
    tutorSectionStr[tutor] = convertArrayToListString(tutorSections[tutor], 'and');
  }

  let tutorHTML = '';
  for (const tutor in tutorSectionStr) {
    // we need to get their user doc for their full name and bio
    // their image can be found at /Images/tutor/{tutor full name hyphenated}.jpg
    const tutorDoc = await admin.firestore().collection('Users').doc(tutor).get();
    const bio = tutorDoc.data().bio;
    const tutorName = tutorDoc.data().firstName + ' ' + tutorDoc.data().lastName;
    const tutorURL = tutorDoc.data().firstName + '-' + tutorDoc.data().lastName;
    const tutorRow = `
      <tr>
        <td style="vertical-align: top;padding: 30px 0px 30px 0px;">
          <img src="https://lyrnwithus.com/Images/tutors/${tutorURL}.jpg" alt="tutor" style="width: 200px; float: left; margin-right: 1em;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;"> ${tutorName} </h2>
          <h3>Teaching ${tutorSectionStr[tutor]}</h3>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">${bio || ''}</p>
        </td>
      </tr>
    `
    tutorHTML += tutorRow;
  }

  const msg = {
    to: email, // Change to your recipient
    from: {
      email: 'support@lyrnwithus.com',
      name: 'Lyrn Support'
    },
    subject: 'Lyrn Program Invoice',
    text: `We're almost ready to start Lyrning! Go to this link to pay for your upcoming ACT program. https://lyrnwithus.com/act-invoice?invoice=${invoiceID}
    If you have an question or difficulties please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com `,
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
            <h2 style="font-size: 28px; margin:0 0 20px 0;">Your program is almost here!</h2>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
              Follow the invoice link below to finalize your program. 
              Be aware that this invoice will expire in 48 hours.
              (see the invoice for the expiration time).
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
                  <a style="font-size: 1em; text-decoration: none; color: white; padding: .5em 1em; border-radius: .5em; display: inline-block; border: 1px solid #27c03a;" href="https://lyrnwithus.com/act-invoice?invoice=${invoiceID}">Program Invoice</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <table role="presentation" border="0" width="100%" cellspacing="0">
        <tr>
          <td>
            <h2 style="font-size: 28px; margin:20px 0 20px 0;">Meet your tutors!</h2>
          </td>
        </tr>
        ${tutorHTML}
      </table>
  
      <table role="presentation" border="0" width="100%">
        <tr>
          <td bgcolor="#EAF0F6" align="center" style="padding: 30px 30px;">
            <h2 style="font-size: 28px; margin:0 0 20px 0;">We're here to help</h2>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Give us a call or text to learn more about our programs. We can't wait to start Lyrning with you!</p>
            <a href="tel:+13853000906" style="text-decoration: underline; font-weight: bold; color: #253342;">(385) 300-0906</a>
          </td>
        </tr>
      </table>
      
      <table role="presentation" border="0" width="100%" cellspacing="0">
        <tr>
          <td class="footer" bgcolor="#F5F8FA" style="padding: 30px 30px;">
            <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/terms">Terms and Conditions</a>
            <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/privacy">Privacy Policy</a>
            <p style="font-size: 12px; color: #99ACC2;">Copyright © 2022 Advanced Education Solutions LLC. All rights reserved.</p>      
          </td>
        </tr>
      </table> 
    </div>
  </body>
    `
  }

  await sgMail.send(msg);
  return;
}

async function sendReserveEmail(programDetails, invoiceID) {
  // we need to determine any overlap for the firstTutors
  const firstTutors = programDetails.firstTutors;
  
  // make the tutor the key and the value an array of sections they are teaching
  let tutorSections = {};
  for (const section in firstTutors) {
    if (!tutorSections[firstTutors[section]]) {
      tutorSections[firstTutors[section]] = [];
    }
    tutorSections[firstTutors[section]].push(section.charAt(0).toUpperCase() + section.slice(1));
  }

  // convert the tutor section arrays to their string equavalent grammatically correct
  let tutorSectionStr = {};
  for (const tutor in tutorSections) {
    tutorSectionStr[tutor] = convertArrayToListString(tutorSections[tutor], 'and');
  }

  let tutorHTML = '';
  for (const tutor in tutorSectionStr) {
    // we need to get their user doc for their full name and bio
    // their image can be found at /Images/tutor/{tutor full name hyphenated}.jpg
    const tutorDoc = await admin.firestore().collection('Users').doc(tutor).get();
    const bio = tutorDoc.data().bio;
    const tutorName = tutorDoc.data().firstName + ' ' + tutorDoc.data().lastName;
    const tutorURL = tutorDoc.data().firstName + '-' + tutorDoc.data().lastName;
    const tutorRow = `
      <tr>
        <td style="vertical-align: top;padding: 30px 0px 30px 0px;">
          <img src="https://lyrnwithus.com/Images/tutors/${tutorURL}.jpg" alt="tutor" style="width: 200px; float: left; margin-right: 1em;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;"> ${tutorName} </h2>
          <h3>Teaching ${tutorSectionStr[tutor]}</h3>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">${bio || ''}</p>
        </td>
      </tr>
    `
    tutorHTML += tutorRow;
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daySort = (a,b) => {
    if (a == 6) {
      return -1;
    }
    if (b == 6) {
      return 1;
    }
    return a - b;
  }
  const firstDay = nextDay(new Date(programDetails.start), programDetails.dayIndexes.sort(daySort)[0]);
  const lastDay = nextDay(new Date(programDetails.end), programDetails.dayIndexes.sort(daySort)[1], -1)

  const msg = {
    to: programDetails.parentEmail, // Change to your recipient
    from: {
      email: 'support@lyrnwithus.com',
      name: 'Lyrn Support'
    },
    subject: 'Reserved Lyrn ACT Program',
    text: `We're almost ready to start Lyrning! Go to this link to pay for your reserved ACT program. https://lyrnwithus.com/act-invoice?invoice=${invoiceID}
    If you have an question or difficulties please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com `,
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
            <h2 style="font-size: 28px; margin:0 0 20px 0;">Your program has been reserved</h2>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
              You are reserving our ${programDetails.programLength} week ${programDetails.name} program which 
              <a href="https://lyrnwithus.com/guarantee.html">guarantees</a> a 
              ${programDetails.score} point increase on the ACT. This program will start ${convertFromDateInt(firstDay.getTime()).shortReadable}
              and continue every ${days[programDetails.dayIndexes.sort()[0]]} and ${days[programDetails.dayIndexes.sort()[1]]}
              until ${convertFromDateInt(lastDay.getTime()).shortReadable}. Lessons will start at 
              ${translateMilitaryHourStr(programDetails.sessionStartTime)} and be ${programDetails.sessionLength} 
              hour${programDetails.sessionLength == 1 ? '' : 's'} long.
            </p>
  
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
              When you're ready to start reaching your ACT goals, follow the invoice link below to finalize your program. 
              Be aware that this reservation will expire in 48 hours and you might not get the times that work best for you 
              (see the invoice for the expiration time).
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
                  <a style="font-size: 1em; text-decoration: none; color: white; padding: .5em 1em; border-radius: .5em; display: inline-block; border: 1px solid #27c03a;" href="https://lyrnwithus.com/act-invoice?invoice=${invoiceID}">ACT Program Invoice</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <table role="presentation" border="0" width="100%" cellspacing="0">
        <tr>
          <td>
            <h2 style="font-size: 28px; margin:20px 0 20px 0;">Meet your tutors!</h2>
          </td>
        </tr>
        ${tutorHTML}
      </table>
  
      <table role="presentation" border="0" width="100%">
        <tr>
          <td bgcolor="#EAF0F6" align="center" style="padding: 30px 30px;">
            <h2 style="font-size: 28px; margin:0 0 20px 0;">We're here to help</h2>
            <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Give us a call or text to learn more about our programs. We can't wait to start Lyrning with you!</p>
            <a href="tel:+13853000906" style="text-decoration: underline; font-weight: bold; color: #253342;">(385) 300-0906</a>
          </td>
        </tr>
      </table>
      
      <table role="presentation" border="0" width="100%" cellspacing="0">
        <tr>
          <td class="footer" bgcolor="#F5F8FA" style="padding: 30px 30px;">
            <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/terms">Terms and Conditions</a>
            <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/privacy">Privacy Policy</a>
            <p style="font-size: 12px; color: #99ACC2;">Copyright © 2022 Advanced Education Solutions LLC. All rights reserved.</p>      
          </td>
        </tr>
      </table> 
    </div>
  </body>
    `
  }

  await sgMail.send(msg);
  return;
}

async function sendConfirmationEmail(email, confirmationData) {
  let lessonList = '';
  confirmationData.events.forEach(event => {
  lessonList += `<li style="margin:0 0 12px 0;font-size:16px;line-height:24px;">${event.title + ' - ' + convertFromDateInt(convertToMountainTime(new Date(event.start)).getTime()).longReadable} MDT</li>`;
  });

  const msg = {
    to: email,
    from: {
      email: 'support@lyrnwithus.com',
      name: 'Lyrn Support'
    },
    subject: 'Upcoming Lessons',
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
          <h2 style="font-size: 28px; margin:0 0 20px 0;">Thanks for Lyrning with us!</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
            Here are the lessons we have scheduled for ${confirmationData.studentName}
          </p>
          <ul>
            ${lessonList}
          </ul>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
            Let us know if you have any questions and we can't wait to see you for your first lesson.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" border="0" width="100%">
      <tr>
        <td bgcolor="#EAF0F6" align="center" style="padding: 30px 30px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">We're here to help</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Give us a call or text to learn more about our programs. We can't wait to start Lyrning with you!</p>
          <a href="tel:+13853000906" style="text-decoration: underline; font-weight: bold; color: #253342;">(385) 300-0906</a>
        </td>
      </tr>
    </table>
    
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td class="footer" bgcolor="#F5F8FA" style="padding: 30px 30px;">
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="https://lyrnwithus.com/terms">Terms and Conditions</a>
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="https://lyrnwithus.com/privacy">Privacy Policy</a>
          <p style="font-size: 12px; color: #99ACC2;">Copyright © 2022 Advanced Education Solutions LLC. All rights reserved.</p>      
        </td>
      </tr>
    </table> 
  </div>
</body>
    `
  }

  await sgMail.send(msg);
  return;
}

function convertToMountainTime(date) {
  return new Date(date.setHours(date.getHours() - 6));
}

function nextDay(date, day, weekDiff = 0) {
  if (!date) { return null }
  const daysUntilNextDay = (day - new Date(date).getDay()) < 0 ? (day - new Date(date).getDay()) + (7 * (weekDiff + 1)) : (day - new Date(date).getDay() + (7 * weekDiff))
  return new Date(new Date(date).setDate(new Date(date).getDate() + daysUntilNextDay));
}

function convertArrayToListString(array, conjunction) {
  if (array.length == 2) {
    return array[0].toString() + ' ' + conjunction + ' ' + array[1].toString();
  }

  let listStr = '';
  array.forEach((element, index) => {
    if (index == 0) {
      listStr = element.toString();
    }
    else if (index == array.length - 1) {
      listStr += ', ' + conjunction + ' ' + element.toString();
    }
    else {
      listStr += ', ' + element.toString();
    }
  })
  return listStr;
}

function convertFromDateInt(date) {

  // Make sure an integer was passed in
  if (typeof date !== "number") {
      return undefined;
  }

  // Create the date object from the date as an integer
  const current_date = new Date(date)

  // create the variables that will be called more than once
  const year = current_date.getFullYear();
  const month = current_date.getMonth() + 1;
  const dayOfMonth = current_date.getDate();
  const dayOfWeek = current_date.getDay() + 1;
  const hours = current_date.getHours();

  // Needed to get the month and day string values
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create and return the datetime object
  return {
      'year' : year,
      'monthNumber' : month,
      'monthString' : months[month - 1],
      'dayOfMonth' : dayOfMonth,
      'dayOfWeekNumber' : dayOfWeek,
      'dayOfWeekString' : days[dayOfWeek - 1],
      'hours' : hours > 12 ? hours - 12 : hours,
      'militaryHours' : hours,
      'minutes' : current_date.getMinutes(),
      'seconds' : current_date.getSeconds(),
      'milliseconds' : current_date.getMilliseconds(),
      'integerValue' : date,
      'shortDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString(),
      'time': (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours > 12 ? " pm" : " am"),
      'longDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours > 12 ? " pm" : " am"),
      'longDateMilitary' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + hours.toString() + ":" + current_date.getMinutes().toString().padStart(2,'0'),
      'mm/dd/yyyy' : month.toString().padStart(2, '0') + "/" + dayOfMonth.toString().padStart(2, '0') + "/" + year.toString().padStart(4, '0'),
      'fullCalendar' : year.toString().padStart(4,'0') + "-" + month.toString().padStart(2, '0') + "-" + dayOfMonth.toString().padStart(2, '0') + "T" + hours.toString().padStart(2, '0') + ":" + current_date.getMinutes().toString().padStart(2, "0"),
      'shortestDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString().slice(-2),
      'startOfDayInt' : new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0).getTime(),
      'shortDateAndDay' : days[dayOfWeek - 1] + month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString(),
      'shortReadable': days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + ", " + year.toString(),
      'longReadable' : days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + ", " + year.toString() + " at " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? ' p' : ' a') + 'm',
      'dayAndDate' : days[dayOfWeek - 1] + ', ' + shortMonths[month - 1] + ' ' + dayOfMonth.toString(),
  };
}

function translateMilitaryHourStr(militaryHours) {
  let hours = Number(militaryHours.split(':')[0]);
  const minutes = militaryHours.split(':')[1];
  const suffix = hours < 12 ? 'am' : 'pm';

  // mod 12
  hours = hours % 12;
  // fix 0 to be 12
  hours = hours == 0 ? hours + 12 : hours

  return `${hours}:${minutes} ${suffix}`;
}

async function sendPracticeTestEmail(email, studentUID) {
  const msg = {
    to: email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn ACT Program Initial Test',
    text: `In preperation for you ACT program, you'll need to take a full length ACT test so that we can know where you are starting at. Here is the link to take this test. This test will take just over 3 hours to complete.
    https://lyrnwithus.com/test-taker?student=${studentUID}`,
    html: `
    <p>In preperation for you ACT program, you'll need to take a full length ACT test so that we can know where you are starting at.</p>
    <p>Here is the link to take this test. This test will take just over 3 hours to complete.</p>
    <a href="https://lyrnwithus.com/test-taker?student=${studentUID}">Test Link</a>
    `
  }

  await sgMail.send(msg);
  return;
}

async function setPracticeTestAssignments(studentUID, program, programStart) {
  // there is the initial test at the beginning of the program
  const initialTestData = {
    section: 'all',
    status: 'new',
    student: studentUID,
    test: GUARANTEE_PRACTICE_TEST_ID,
    program: program,
    open: new Date(),
    close: programStart
  }

  const assignmentRef = admin.firestore().collection('Section-Assignments').doc()
  await assignmentRef.set(initialTestData);

  return;
}