const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { Logging } = require('@google-cloud/logging');
const logging = new Logging({
  projectId: process.env.GCLOUD_PROJECT,
});

const Stripe = require('stripe');
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: '2020-08-27',
});

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

/**
 * When a user is created, create a Stripe customer object for them.
 *
 * @see https://stripe.com/docs/payments/save-and-reuse#web-create-customer
 */
exports.createStripeCustomer = functions.https.onCall(async (data, context) => {
  const customer = await stripe.customers.create({ email: data.email });
  const intent = await stripe.setupIntents.create({
    customer: customer.id,
  });
  await admin.firestore().collection('stripe_customers').doc(data.uid).set({
    customer_id: customer.id,
    setup_secret: intent.client_secret,
  }, {merge: true});
  return;
});

exports.createStripeCustomerAuto = functions.auth.user().onCreate(async (user) => {
  const customer = await stripe.customers.create({ email: user.email });
  const intent = await stripe.setupIntents.create({
    customer: customer.id,
  });
  await admin.firestore().collection('stripe_customers').doc(user.uid).set({
    customer_id: customer.id,
    setup_secret: intent.client_secret,
  }, {merge: true});
  return;
});

/**
 * When adding the payment method ID on the client,
 * this function is triggered to retrieve the payment method details.
 */
 exports.addPaymentMethodDetails = functions.firestore
 .document('/stripe_customers/{userId}/payment_methods/{pushId}')
 .onCreate(async (snap, context) => {
   try {
     const paymentMethodId = snap.data().id;
     const paymentMethod = await stripe.paymentMethods.retrieve(
       paymentMethodId
     );
     await snap.ref.set(paymentMethod);
     // Create a new SetupIntent so the customer can add a new method next time.
     const intent = await stripe.setupIntents.create({
       customer: `${paymentMethod.customer}`,
     });
     await snap.ref.parent.parent.set(
       {
         setup_secret: intent.client_secret,
       },
       { merge: true }
     );
     return;
   } catch (error) {
     await snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
     await reportError(error, { user: context.params.userId });
   }
 });

/**
* When a payment document is written on the client,
* this function is triggered to create the payment in Stripe.
*
* @see https://stripe.com/docs/payments/save-and-reuse#web-create-payment-intent-off-session
*/

// [START chargecustomer]

exports.createStripePayment = functions.firestore
.document('stripe_customers/{userId}/payments/{pushId}')
.onCreate(async (snap, context) => {
  const { amount, currency, payment_method } = snap.data();
  const parentRecord = await admin.auth().getUser(context.params.userId);
  try {
    // Look up the Stripe customer id.
    const customer = (await snap.ref.parent.parent.get()).data().customer_id;
    // Create a charge using the pushId as the idempotency key
    // to protect against double charges.
    const idempotencyKey = context.params.pushId;
    const payment = await stripe.paymentIntents.create(
      {
        amount,
        currency,
        customer,
        payment_method,
        off_session: false,
        confirm: true,
        confirmation_method: 'manual',
      },
      { idempotencyKey }
    );
    // If the result is successful, write it back to the database.
    await snap.ref.set(payment);
    //FIXME!!!
    //need to check if the parent should be removed from probation after each successful payment.
    //also email them about the status of their payment and place them on probabtion if applicable

    //remove the parent from probation if their balance is now >= 0
    if (await getUserBalance(parentRecord.uid) >= 0) {
      await unsetProbation(parentRecord.uid);
      await paymentSuccessfulBalanceNonNegativeEmail(parentRecord.email, amount, currency);
    }
    //payment was successful but the account of the parent is still negative
    else {
      await setProbation(parentRecord.uid)
      await paymentSuccessfulBalanceNegativeEmail(parentRecord.email, amount, currency)
    }

    return;
  } 
  catch (error) {
    //remove the parent from probation if their balance is now >= 0
    if (await getUserBalance(parentRecord.uid) >= 0) {
      await unsetProbation(parentRecord.uid);
      await paymentFailedBalanceNonNegativeEmail(parentRecord.email, amount, currency);
    }
    //payment was unsuccessful but the account of the parent is still negative
    else {
      await setProbation(parentRecord.uid)
      await paymentFailedBalanceNegativeEmail(parentRecord.email, amount, currency)
    }

    // We want to capture errors and render them in a user-friendly way, while
    // still logging an exception with StackDriver
    functions.logger.log(error);
    await snap.ref.set({ 
        error: userFacingMessage(error),
        status: 'error'
      }, { merge: true });
    await reportError(error, { user: context.params.userId });

    return;
  }
});

// [END chargecustomer]

/**
* When 3D Secure is performed, we need to reconfirm the payment
* after authentication has been performed.
*
* @see https://stripe.com/docs/payments/accept-a-payment-synchronously#web-confirm-payment
*/
exports.confirmStripePayment = functions.firestore
 .document('stripe_customers/{userId}/payments/{pushId}')
 .onUpdate(async (change, context) => {
   if (change.after.data().status === 'requires_confirmation') {
     const payment = await stripe.paymentIntents.confirm(
       change.after.data().id
     );
     change.after.ref.set(payment);
   }
 });

/**
* When a user deletes their account, clean up after them
*/
exports.cleanupUser = functions.auth.user().onDelete(async (user) => {
 const dbRef = admin.firestore().collection('stripe_customers');
 const customer = (await dbRef.doc(user.uid).get()).data();
 await stripe.customers.del(customer.customer_id);
 // Delete the customers payments & payment methods in firestore.
 const batch = admin.firestore().batch();
 const paymetsMethodsSnapshot = await dbRef
   .doc(user.uid)
   .collection('payment_methods')
   .get();
 paymetsMethodsSnapshot.forEach((snap) => batch.delete(snap.ref));
 const paymentsSnapshot = await dbRef
   .doc(user.uid)
   .collection('payments')
   .get();
 paymentsSnapshot.forEach((snap) => batch.delete(snap.ref));
 const chargesSnapshot = await dbRef
   .doc(user.uid)
   .collection('charges')
   .get();
 chargesSnapshot.forEach((snap) => batch.delete(snap.ref));

 await batch.commit();

 await dbRef.doc(user.uid).delete();
 return;
});

/**
* To keep on top of errors, we should raise a verbose error report with Stackdriver rather
* than simply relying on functions.logger.error. This will calculate users affected + send you email
* alerts, if you've opted into receiving them.
*/

// [START reporterror]

function reportError(err, context = {}) {
 // This is the name of the StackDriver log stream that will receive the log
 // entry. This name can be any valid log stream name, but must contain "err"
 // in order for the error to be picked up by StackDriver Error Reporting.
 const logName = 'errors';
 const log = logging.log(logName);

 // https://cloud.google.com/logging/docs/api/ref_v2beta1/rest/v2beta1/MonitoredResource
 const metadata = {
   resource: {
     type: 'cloud_function',
     labels: { function_name: process.env.FUNCTION_NAME },
   },
 };

 // https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorEvent
 const errorEvent = {
   message: err.stack,
   serviceContext: {
     service: process.env.FUNCTION_NAME,
     resourceType: 'cloud_function',
   },
   context: context,
 };

 // Write the error log entry
 return new Promise((resolve, reject) => {
   log.write(log.entry(metadata, errorEvent), (error) => {
     if (error) {
       return reject(error);
     }
     return resolve();
   });
 });
}

// [END reporterror]

/**
* Sanitize the error message for the user.
*/
function userFacingMessage(error) {
 return error.type
   ? error.message
   : 'An error occurred, developers have been alerted';
}

// Format amount for diplay in the UI
function formatAmount(amount, currency) {
  amount = zeroDecimalCurrency(amount, currency)
    ? amount
    : (amount / 100).toFixed(2);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

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

function getUserBalance(userUID) {
  return Promise.all([
    admin.firestore().collection('stripe_customers').doc(userUID).collection('payments').get(),
    admin.firestore().collection('stripe_customers').doc(userUID).collection('charges').get()
  ])
  .then(result => {
    let payments, charges;
    [payments, charges] = result;

    let paymentAmount = 0;
    let chargeAmount = 0;
    payments.forEach(paymentDoc => {
      if (paymentDoc.data().status == 'succeeded') {
        paymentAmount += paymentDoc.data().amount;
      }
    })
    charges.forEach(chargeDoc => {
      chargeAmount += chargeDoc.data().amount;
    })

    const balance = paymentAmount - chargeAmount;
    return balance;
  })
}

async function setProbation(userUID) {
  //first check that the parent isn't already on probation
  const userStripeDoc = await admin.firestore().collection('stripe_customers').doc(userUID);
  const probation = userStripeDoc.data().probationDate;

  if (probation) {
    //if they are already on probation do nothing (keep the oldest probation date)
    return;
  }
  else {
    //place the user on probation from the current timestamp
    await admin.firestore().collection('stripe_customers').doc(userUID).update({
      probationDate: new Date().getTime()
    })
    return;
  }
}

async function unsetProbation(userUID) {
  await admin.firestore().collection('stripe_customers').doc(userUID).update({
    probationDate: null
  })
  return;
}


function paymentSuccessfulBalanceNonNegativeEmail(parentEmail, paymentAmount, paymentCurrency) {
  const msg = {
    to: parentEmail, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Lesson Payment',
    text: `Great news!!! We were able to process your payment of ${formatAmount(paymentAmount, paymentCurrency)}!
    For more details about your account please review your payment portal. www.lyrnwithus.com`,
    html: `<strong>Great news!!! We were able to process your payment of ${formatAmount(paymentAmount, paymentCurrency)}!
    For more details about your account please review your payment portal. www.lyrnwithus.com</strong>`,
  }
  return sgMail.send(msg)
}

function paymentSuccessfulBalanceNegativeEmail(parentEmail, paymentAmount, paymentCurrency) {
  const msg = {
    to: parentEmail, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Lesson Payment',
    text: `Great news!!! We were able to process your payment of ${formatAmount(paymentAmount, paymentCurrency)}!
    Your current balance with us is negative. If we have not already contacted you about this balance we will do some in the coming days.
    For more details about your account please review your payment portal. www.lyrnwithus.com`,
    html: `<strong>Great news!!! We were able to process your payment of ${formatAmount(paymentAmount, paymentCurrency)}!
    Your current balance with us is negative. If we have not already contacted you about this balance we will do some in the coming days.
    For more details about your account please review your payment portal. www.lyrnwithus.com</strong>`,
  }
  return sgMail.send(msg)
}

function paymentFailedBalanceNegativeEmail(parentEmail, paymentAmount, paymentCurrency) {
  const msg = {
    to: parentEmail, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Lesson Payment',
    text: `We were unable to process your payment of ${formatAmount(paymentAmount, paymentCurrency)}. 
    Your current balance is negative and due to this we have placed your account on probation. We will be in contact
    in the coming days to discuss your balance. For more details about your account please review your payment portal. www.lyrnwithus.com`,
    html: `<strong>We were unable to process your payment of ${formatAmount(paymentAmount, paymentCurrency)}. 
    Your current balance is negative and due to this we have placed your account on probation. We will be in contact
    in the coming days to discuss your balance. For more details about your account please review your payment portal. www.lyrnwithus.com</strong>`,
  }
  return sgMail.send(msg)
}

function paymentFailedBalanceNonNegativeEmail(parentEmail, paymentAmount, paymentCurrency) {
  const msg = {
    to: parentEmail, // Change to your recipient
    from: 'support@lyrnwithus.com', // Change to your verified sender
    subject: 'Lyrn Lesson Payment',
    text: `We were unable to process your payment of ${formatAmount(paymentAmount, paymentCurrency)}. 
    Your current balance is still positive so you will not be placed on probation. We recommend seeing what payment failed and contacting
    us if you think there was a mistake. For more details about your account please review your payment portal. www.lyrnwithus.com`,
    html: `<strong>We were unable to process your payment of ${formatAmount(paymentAmount, paymentCurrency)}. 
    Your current balance is still positive so you will not be placed on probation. We recommend seeing what payment failed and contacting
    us if you think there was a mistake. For more details about your account please review your payment portal. www.lyrnwithus.com</strong>`,
  }
  return sgMail.send(msg)
}