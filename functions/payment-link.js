const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

exports.generateInvoice = functions.firestore
.document('/Invoices/{invoiceID}')
.onCreate(async (snap, context) => {
  const { parent } = snap.data();
  const now = new Date();

  // if there is already an invoice that is pending then don't send another and remove this one
  let pendingInvoice = await admin.firestore().collection('Invoices').where('parent', '==', parent).where('status', '==', 'pending').limit(1).get();
  if (pendingInvoice.size > 0) {
    await snap.ref.delete();
    return;
  }

  // get all of the future events that this parent is connected to
  let events = await admin.firestore().collection('Events')
  .where('parents', "array-contains", parent)
  .where('start', '>=', now.getTime())
  .get();

  // extract the necessary data from the events
  let eventData = [];
  events.forEach(eventDoc => {
    eventData.push({
      id: eventDoc.id,
      title: eventDoc.data().title,
      start: eventDoc.data().start,
      end: eventDoc.data().end,
      price: eventDoc.data().price
    })
  })
  eventData.sort((a,b) => a.start - b.start);

  // get the expiration date
  // FIXME: get a better understanding of the expiration date
  const defaultExpTime = new Date(now).setDate(new Date(now).getDate() + 2);
  const earliestLessonTime = eventData[0] ? new Date(eventData[0].start).setDate(new Date(eventData[0].start).getDate() - 1) : Infinity;
  const expTime = defaultExpTime < earliestLessonTime ? defaultExpTime : earliestLessonTime;

  // get the current balance of the parent and if they have a payment method
  let paymentsProm = admin.firestore()
  .collection('stripe_customers')
  .doc(parent)
  .collection('payments')
  .get();

  let chargesProm = admin.firestore()
  .collection('stripe_customers')
  .doc(parent)
  .collection('charges')
  .get();

  let paymentMethodProm = admin.firestore()
  .collection('stripe_customers')
  .doc(parent)
  .collection('payment_methods')
  .limit(1)
  .get();

  let [ payments, charges, paymentMethod ] = await Promise.all([paymentsProm, chargesProm, paymentMethodProm])

  const hasPaymentMethod = paymentMethod.size > 0;

  let totalPayments = payments.docs.reduce((prev, curr) => prev + curr.data().amount, 0);
  let totalCharges = charges.docs.reduce((prev, curr) => prev + curr.data().amount, 0);

  let balanceDue = (totalPayments - totalCharges) / -100;

  // get the total amount due
  let eventDue = eventData.reduce((prev, curr) => prev + (curr.price * (curr.end - curr.start) / 3600000), 0);

  // send off the link and update the invoice
  await snap.ref.update({
    events: eventData,
    existingBalanceDue: balanceDue,
    newBalanceDue: eventDue,
    expiration: expTime, 
    status: hasPaymentMethod ? 'success' : 'pending',
    createdAt: new Date().getTime(),
    processedAt: hasPaymentMethod ? new Date().getTime() : null
  })

  hasPaymentMethod ? await sendLessonsLinkEmail(parent, context.params.invoiceID) : await sendPaymentLinkEmail(parent, context.params.invoiceID);

  return;
});

async function sendPaymentLinkEmail(userUID, invoiceID) {
  // first get the user UID
  const userRecord = await admin.auth().getUser(userUID);

  const msg = {
    to: userRecord.email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Payment Link',
    text: `We're almost ready to start Lyrning! Go to this link to pay for your upcoming lessons. https://lyrnwithus.com/payment-link?invoice=${invoiceID}
    If you have an question or difficulties please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com `,
    html: `
      <h1>We're almost ready to start Lyrning!</h1>
      <p>Go to this link to pay for your upcoming lessons.<p>
      <a href="https://lyrnwithus.com/payment-link?invoice=${invoiceID}">Payment Link</a>
      <p>If you have an question or difficulties please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com</p>
    `
  }

  await sgMail.send(msg);
  return;
}

async function sendLessonsLinkEmail(userUID, invoiceID) {
  // first get the user UID
  const userRecord = await admin.auth().getUser(userUID);

  const msg = {
    to: userRecord.email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Future Lessons Link',
    text: `We're all ready to start Lyrning! Go to this link to view all of your upcoming lessons. https://lyrnwithus.com/payment-link?invoice=${invoiceID}
    If you have an question or difficulties please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com `,
    html: `
      <h1>We're all ready to start Lyrning!</h1>
      <p>Go to this link to view all of your upcoming lessons.<p>
      <a href="https://lyrnwithus.com/payment-link?invoice=${invoiceID}">Future Lessons Link</a>
      <p>If you have an question or difficulties please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com</p>
    `
  }

  await sgMail.send(msg);
  return;
}

exports.checkInvoices = functions.pubsub.schedule('0 0 * * *').timeZone('America/Denver').onRun(async (context) => {
  // get all of the invoices that expired before this point and are still pending
  const now = new Date();
  let expiredInvoices = await admin.firestore().collection('Invoices').where('status', '==', 'pending').where('expiration', '<=', now.getTime()).get();

  expiredInvoices.forEach(async (invoiceDoc) => {
    // need to double check that the parent does not have any payment methods. if they do then just set this invoice to success
    let paymentMethod = await admin.firestore()
    .collection('stripe_customers')
    .doc(invoiceDoc.data().parent)
    .collection('payment_methods')
    .limit(1)
    .get();

    const hasPaymentMethod = paymentMethod.size > 0;

    if (hasPaymentMethod) {
      await invoiceDoc.ref.update({
        status: 'success',
        processedAt: new Date().getTime()
      });
      return;
    }

    // set the status to failed
    await invoiceDoc.ref.update({
      status: 'failed',
      processedAt: new Date().getTime()
    });

    // remove the invoiced lessons from the events
    let { events } = invoiceDoc.data()
    let eventDeletePromises = [];
    events.forEach(event => {
      // only remove future events just in case 
      if (event.start >= new Date().getTime()) {
        eventDeletePromises.push(admin.firestore().collection('Events').doc(event.id).delete());
      }
    })
    await Promise.all(eventDeletePromises);

    // send the parent an email telling them that the lessons were removed
    await sendFailedInvoiceEmail(invoiceDoc.data().parent, invoiceDoc.id)
  })
});

async function sendFailedInvoiceEmail(userUID, invoiceID) {
  // first get the user UID
  const userRecord = await admin.auth().getUser(userUID);

  const msg = {
    to: userRecord.email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Invoice Not Recieved',
    text: `It looks like we didn't recieve a payment method for a previous set of lessons we scheduled for you. Due to this we have removed those lessons from the schedule.
    You can review which lessons were removed at this link: https://lyrnwithus.com/payment-link?invoice=${invoiceID}
    If you have an question or concerns please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com `,
    html: `
      <p>It looks like we didn't recieve a payment method for a previous set of lessons we scheduled for you. Due to this we have removed those lessons from the schedule.<p>
      <p>You can review which lesson were removed <a href="https://lyrnwithus.com/payment-link?invoice=${invoiceID}">Here</a></p>
      <p>If you have an question or concerns please let us know. You can call or text us at (385) 300-0906 or send us an email at contact@lyrnwithus.com </p>
    `
  }

  await sgMail.send(msg);   
  return;
}