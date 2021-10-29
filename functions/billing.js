const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(functions.config().sendgrid.secret);

//check for events happening the next day and place a charge on the parent account whose student is attending the event.
exports.chargeAccounts = functions.pubsub.schedule('5 21 * * *').timeZone('America/Denver').onRun(async (context) => {
  //get the UTC time to look like the current time in salt lake so that relative times match up when we are setting hours
  const SALTLAKE_TIME_OFFSET = 6;
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
    if (eventData?.price > 0) {
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
    .then(paymentMethodQuery => {
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

/**
 * Parse the datetime as an integer into a datetime object
 * @param {Integer} date Datetime represented as an integer
 * @returns {Object} a javascript object containing the datetime elements
 */
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
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      'longDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0'),
      'longDateMilitary' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + hours.toString() + ":" + current_date.getMinutes().toString().padStart(2,'0'),
      'mm/dd/yyyy' : month.toString().padStart(2, '0') + "/" + dayOfMonth.toString().padStart(2, '0') + "/" + year.toString().padStart(4, '0'),
      'fullCalendar' : year.toString().padStart(4,'0') + "-" + month.toString().padStart(2, '0') + "-" + dayOfMonth.toString().padStart(2, '0') + "T" + hours.toString().padStart(2, '0') + ":" + current_date.getMinutes().toString().padStart(2, "0"),
      'shortestDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString().slice(-2),
      'startOfDayInt' : new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0).getTime(),
      'shortDateAndDay' : days[dayOfWeek - 1] + month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString(),
      'longReadable' : days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + " " + year.toString() + " at " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0'),
  };
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
  const userStripeDoc = await firebase.firestore().collection('stripe_customers').doc(userUID);
  const probation = userStripeDoc.data().probation;

  if (probation) {
    //if they are already on probation do nothing (keep the oldest probation date)
    return;
  }
  else {
    //place the user on probation from the current timestamp
    await firebase.firestore().collection('stripe_customers').doc(userUID).update({
      probation: new Date().getTime()
    })
    return;
  }
}

async function unsetProbation(userUID) {
  await firebase.firestore().collection('stripe_customers').doc(userUID).update({
    probation: null
  })
  return;
}