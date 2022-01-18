const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

exports.generateInvoice = functions.firestore
.document('/Invoices/{invoiceID}')
.onCreate(async (snap, context) => {
  const { parent } = snap.data();
  const now = new Date();

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

  console.log(eventData)

  // get the expiration date
  // FIXME: get a better understanding of the expiration date
  const defaultExpTime = new Date(now).setDate(new Date(now).getDate() + 2);
  const earliestLessonTime = eventData[0] ? eventData[0].start - 3600000: Infinity;
  const expTime = defaultExpTime < earliestLessonTime ? defaultExpTime : earliestLessonTime;

  // get the current balance of the parent
  let payments = await admin.firestore()
  .collection('stripe_customers')
  .doc(parent)
  .collection('payments')
  .get();

  let charges = await admin.firestore()
  .collection('stripe_customers')
  .doc(parent)
  .collection('charges')
  .get();

  let totalPayments = payments.docs.reduce((prev, curr) => prev + curr.data().amount, 0);
  let totalCharges = charges.docs.reduce((prev, curr) => prev + curr.data().amount, 0);

  console.log(totalCharges)
  console.log(totalPayments)

  let balanceDue = (totalPayments - totalCharges) / -100;

  // get the total amount due
  let eventDue = eventData.reduce((prev, curr) => prev + curr.price, 0);
  console.log(eventDue)
  let totalDue = balanceDue + eventDue;

  // send off the link if applicable and update the invoice
  if (totalDue > 0) {
    await snap.ref.update({
      events: eventData,
      existingBalanceDue: balanceDue,
      newBalanceDue: eventDue,
      expiration: expTime, 
      status: 'pending'
    })
    await sendPaymentLinkEmail(parent, context.params.invoiceID);
  }
  else {
    // this is the case that the amount that the parent doesn't owe us money for all future lessons
    // just delete the invoice for now
    await snap.ref.delete();
  }

  return;
});

async function sendPaymentLinkEmail(userUID, invoiceID) {
  // first get the user UID
  const userDoc = await admin.firestore().collection('Users').doc(userUID).get()
  const { email } = userDoc.data();

  const msg = {
    to: email, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Payment Link',
    text: `We're almost ready to start Lyrning! Go to this link to pay for your upcoming lessons. https://lyrnwithus.com/payment-link?invoice=${invoiceID}
    If you have an question or difficulties please let us know. You can call or text us at 877-400-1641 or send us an email at contact@lyrnwithus.com `,
    html: `
      <h1>We're almost ready to start Lyrning!</h1>
      <p>Go to this link to pay for your upcoming lessons.<p>
      <a href="https://lyrnwithus.com/payment-link?invoice=${invoiceID}">Payment Link</a>
      <p>If you have an question or difficulties please let us know. You can call or text us at 877-400-1641 or send us an email at contact@lyrnwithus.com</p>
    `
  }

  await sgMail.send(msg);
  return;
}