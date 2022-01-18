const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(functions.config().sendgrid.secret);

//check for events happening the next day and place a charge on the parent account whose student is attending the event.
exports.chargeAccounts = functions.pubsub.schedule('5 22 * * *').timeZone('America/Denver').onRun(async (context) => {
  //get the UTC time to look like the current time in salt lake so that relative times match up when we are setting hours
  const SALTLAKE_TIME_OFFSET = 7;
  const UTC_TO_SALTLAKE = new Date().setHours(new Date().getHours() - SALTLAKE_TIME_OFFSET);
  const tomorrowStart = new Date(UTC_TO_SALTLAKE).setHours(24 + SALTLAKE_TIME_OFFSET,0,0,0);
  const tomorrowEnd = new Date(UTC_TO_SALTLAKE).setHours(48 + SALTLAKE_TIME_OFFSET,0,0,0);

  let eventQuery = await admin.firestore().collection('Events')
  .where('start', '>=', tomorrowStart)
  .where('start', '<', tomorrowEnd)
  .orderBy('start')
  .get()

  const batch = admin.firestore().batch();

  let parentsCharged = [];

  eventQuery.forEach(event => {
    const eventData = event.data();
    if (eventData.price > 0) {
      const start = eventData.start;
      const end = eventData.end;
      const length = end - start;
      const hourLength = length / 3600000;

      const amount = eventData.price * hourLength;
      const currency = 'usd';
      const title = eventData.title;
      const chargeData = {
        currency,
        amount: formatAmountForStripe(amount, currency),
        title,
        created: new Date().getTime(),
        event: event.id,
        eventStart: start,
        eventEnd: end
      }

      batch.set(admin.firestore().collection('stripe_customers').doc(eventData.parents[0]).collection('charges').doc(), chargeData);

      //append the parents here so we know who to request payments for in the next step.
      if (!parentsCharged.includes(eventData.parents[0])) {
        parentsCharged.push(eventData.parents[0]);
      }
    }
  })

  //FIXME: batch can only commit 500 operation!!!
  await batch.commit();
  

  //run through the parents that have been charged and request payments from them
  let parentPromises = [];
  parentsCharged.forEach(parentUID => {
    //check first of the parent has a payment method saved
    parentPromises.push(admin.firestore().collection('stripe_customers').doc(parentUID).collection('payment_methods').limit(1).get()
    .then(async (paymentMethodQuery) => {
      if (paymentMethodQuery.size > 0) {
        //the parent does have a card on file
        //charge the parent if their balance is negative
        const balance = await getUserBalance(parentUID);
        if (balance < 0) {
          //now charge their card by requesting a payment
          const currency = 'usd';
          const amount = balance * -1;
          const data = {
            payment_method: paymentMethodQuery.docs[0].data().id,
            currency,
            amount,
            status: 'new',
          };
        
          return admin.firestore().collection('stripe_customers').doc(parentUID).collection('payments').add(data); 
        }
        else {
          //they have a non-negative balance so don't charge them
          return;
        }
      }
      //the parent does not have a card saved
      else {
        //and their balance is negative
        if (await getUserBalance(parentUID) < 0) {
          await setProbation(parentUID);
          const parentRecord = await admin.auth().getUser(parentUID);
          const msg = {
            to: parentRecord.email, // Change to your recipient
            from: 'support@lyrnwithus.com', // Change to your verified sender
            subject: 'Lyrn Lesson Payment Issue',
            text: `We tried billing your account for your upcoming lesson and it appears that we don't have a card on file to charge this lesson. Unfortuanately we have to place your account
            on probabtion until your balance is resolved. Feel free to contact our office with any concerns and view the payment portal for more detail.
            www.lyrnwithus.com`,
            html: `<strong>We tried billing your account for your upcoming lesson and it appears that we don't have a card on file to charge this lesson. Unfortuanately we have to place your account
            on probabtion until your balance is resolved. Feel free to contact our office with any concerns and view the payment portal for more detail.
            www.lyrnwithus.com</strong>`,
          }
          await sgMail.send(msg)
          return;
        }
        else {
          //the parent has a non-negative balance so do nothing
          return;
        }
      }
    }));
  })

  return Promise.all(parentPromises)
  .catch((error) => {
    console.log(error)
  })
})

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
  const userStripeDoc = await admin.firestore().collection('stripe_customers').doc(userUID).get();
  if (userStripeDoc.exists) {
    const probation = userStripeDoc.data().probation;

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
  else {
    throw new functions.https.HttpsError('not-found', `User ${userUID} does not have a stripe customer doc.`);
  }
}

async function unsetProbation(userUID) {
  await admin.firestore().collection('stripe_customers').doc(userUID).update({
    probationDate: null
  })
  return;
}