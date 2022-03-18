const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

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
  return await sendInvoiceEmail(data.email, data.invoice);
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
      // these evetns should be in time order
      const events = newValues.events;
      let batch = admin.firestore().batch();

      // go through all events and apply the discounts
      events.forEach((event, index) => {
        const ref = admin.firestore().collection('Events').doc(event);

        // check if first lesson should be free
        if (index == 0 && newValues.isFirstSessionsFree) {
          // update the lesson's price
          batch.update(ref, {
            price: 0
          })
        }
        // last two lessons were already payed for
        else if (index == (events.length - 1) || index == (events.length - 2)) {
          // update the lesson's price
          batch.update(ref, {
            price: 0
          })
        }
        // all other lessons 
        else {
          // discount the rest 90% to align with the 10% off
          batch.update(ref, {
            price: newValues.pricePerHour * 0.9
          })
        }
      })

      // commit the update operations
      await batch.commit();
    }
    else if (newValues.paymentType == 'recurring') {
      // these evetns should be in time order
      const events = newValues.events;
      let batch = admin.firestore().batch();

      // check the first lesson
      if (newValues.isFirstSessionsFree) {
        batch.update(admin.firestore().collection('Events').doc(events[0]), {
          price: 0,
        });
      }

      // update the last two
      if (events[events.length - 1]) {
        batch.update(admin.firestore().collection('Events').doc(events[events.length - 1]), {
          price: 0
        });
      }
      if (events[events.length - 2]) {
        batch.update(admin.firestore().collection('Events').doc(events[events.length - 2]), {
          price: 0
        });
      }

      // commit the update operations
      await batch.commit();
    }
    else {
      throw new functions.https.HttpsError('invalid-argument', 'the payment type for this invoice in invalid')
    }
  }
  // the invoice has not been paid for
  else if (newValues.status == 'failed') {
    // since the invoice failed we need to remove all lessons associated with this invoice
    const events = newValues.events;
    let batch = admin.firestore().batch();

    events.forEach(event => {
      batch.delete(admin.firestore().collection('Events').doc(event))
    })

    // commit the update operations
    await batch.commit();
  }

  return;
});

exports.checkInvoices = functions.pubsub.schedule('55 11 * * *').timeZone('America/Denver').onRun(async (context) => {
  // get all of the invoices that expired before this point and are still pending
  const now = new Date();
  let expiredInvoices = await admin.firestore().collection('ACT-Invoices').where('status', '==', 'pending').where('expiration', '<=', now.getTime()).get();

  await Promise.all(expiredInvoices.map(async (invoiceDoc) => {
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

async function sendInvoiceEmail(email, invoiceID) {
  const msg = {
    to: email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn ACT Program Invoice',
    text: `We're almost ready to start Lyrning! Go to this link to pay for your upcoming ACT program. https://lyrnwithus.com/act-invoice?invoice=${invoiceID}
    If you have an question or difficulties please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com `,
    html: `
      <h1>We're almost ready to start Lyrning!</h1>
      <p>Go to this link to pay for your upcoming ACT program.<p>
      <a href="https://lyrnwithus.com/act-invoice?invoice=${invoiceID}">Invoice</a>
      <p>If you have an question or difficulties please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com</p>
    `
  }

  await sgMail.send(msg);
  return;
}