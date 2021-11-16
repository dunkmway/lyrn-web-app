
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51JYNNQLLet6MRTvnXP7E1r6Xgea5rIdUxNOFlLcVmEPtBkABMn4G8QJfdxHJE2Na4HmqrxnxKSvYKpm7AJsWHSvz00VfCQ4ORr';
let currentUser = {};
let customerData = {};
let parentData = {};
let parentUID = queryStrings().parent;
let payoffAmount = 0;
let remainingTime = 0;

let payments = [];
let charges = [];
let balance = 0;

const HOURS_TO_GET_DISCOUNT = 20;
const DISCOUNT = 0.9;
 
firebase.auth().onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    currentUser = firebaseUser;
    firebase.firestore().collection('stripe_customers').doc(parentUID).onSnapshot((snapshot) => {
      if (snapshot.data()) {
        customerData = snapshot.data();
        startDataListeners();
      } else {
        console.warn(
          `No Stripe customer found in Firestore for user: ${parentUID}`
        );
      }
    });

    firebase.firestore().collection('Users').doc(parentUID).onSnapshot((snapshot) => {
      if (snapshot.data()) {
        parentData = snapshot.data();
        //set up the parent name in the title
        const {firstName, lastName} = parentData;
        document.getElementById('parent-name').textContent = firstName + " " + lastName;
      } else {
        console.warn(
          `No Lyrn User found in Firestore for user: ${parentUID}`
        );
      }
    });
  } 
  else {
    console.error('This user is not signed in');
  }
});
 
 /**
  * Set up Stripe Elements
  */
 const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
 const elements = stripe.elements();
 const cardElement = elements.create('card');
 cardElement.mount('#card-element');
 cardElement.on('change', ({ error }) => {
   const displayError = document.getElementById('error-message');
   if (error) {
     displayError.textContent = error.message;
   } else {
     displayError.textContent = '';
   }
 });
 
 /**
  * Set up Firestore data listeners
  */
 function startDataListeners() {
   /**
    * Get all payment methods for the logged in customer
    */
   firebase
     .firestore()
     .collection('stripe_customers')
     .doc(parentUID)
     .collection('payment_methods')
     .onSnapshot((snapshot) => {
       snapshot.forEach(function (doc) {
         const paymentMethod = doc.data();
         if (!paymentMethod.card) {
           return;
         }
 
         const optionId = `card-${doc.id}`;
         let optionElement = document.getElementById(optionId);
 
         // Add a new option if one doesn't exist yet.
         if (!optionElement) {
            optionElement = document.createElement('option');
            optionElement.id = optionId;
            document
            .querySelector('select[name=payment-method]')
            .appendChild(optionElement);
         }
 
         optionElement.value = paymentMethod.id;
         optionElement.text = `${paymentMethod.card.brand} •••• ${paymentMethod.card.last4} | Expires ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`;
       });
     });
 
   /**
    * Get all payments for the logged in customer
    */
   firebase
     .firestore()
     .collection('stripe_customers')
     .doc(parentUID)
     .collection('payments')
     .onSnapshot((snapshot) => {
      payments = [];
       snapshot.forEach((doc) => {
         const payment = doc.data();
         payment.docId = doc.id;
         payments.push(payment);
         console.log(payment)
       })

       payments.sort((a,b) => b.created - a.created);
       payments.forEach(payment => {
 
         let liElement = document.getElementById(`payment-${payment.docId}`);
         if (!liElement) {
           liElement = document.createElement('li');
           liElement.id = `payment-${payment.docId}`;
         }
 
         let content = '';
         if (
           payment.status === 'new' ||
           payment.status === 'requires_confirmation'
         ) {
           console.log('new payment')
           content = `Creating Payment of ${formatAmount(
             payment.amount,
             payment.currency
           )} on ${convertFromDateInt(payment.created * 1000)['longDate']}.`;
         } else if (payment.status === 'succeeded') {
           const card = payment.charges.data[0].payment_method_details.card;
           content = `✅ Payment of ${formatAmount(
             payment.amount,
             payment.currency
           )} with ${card.brand} card •••• ${card.last4} on ${convertFromDateInt(payment.created * 1000)['longDate']}.`;
         } else if (payment.status === 'requires_action') {
           content = `🚨 Payment of ${formatAmount(
             payment.amount,
             payment.currency
           )} ${payment.status} on ${convertFromDateInt(payment.created * 1000)['longDate']}.`;
           handleCardAction(payment, doc.id);
         } else {
           content = `⚠️ Payment of ${formatAmount(
             payment.amount,
             payment.currency
           )} ${payment.error} on ${convertFromDateInt(payment.created * 1000)['longDate']}.`;
         }
         liElement.innerText = content;
         document.querySelector('#payments-list').appendChild(liElement);
       });
       updateBalance();
       updatePayoffAmount();
     });

  /**
    * Get all charges for the logged in customer
    */
   firebase
     .firestore()
     .collection('stripe_customers')
     .doc(parentUID)
     .collection('charges')
     .orderBy('created', 'desc')
     .onSnapshot((snapshot) => {
       charges = [];
       snapshot.forEach((doc) => {
         const charge = doc.data();
         charges.push(charge);
 
         let liElement = document.getElementById(`charge-${doc.id}`);
         if (!liElement) {
           liElement = document.createElement('li');
           liElement.id = `charge-${doc.id}`;
         }
 
         let content = `⚠️ ${convertFromDateInt(charge.created)['longDate']}: Charge of ${formatAmount(charge.amount, charge.currency)} for ${charge.title}.`;
         if (charge.eventStart && charge.eventEnd) {
           //remove period
           content = content.substring(0, content.length - 1);
           content += ` from ${convertFromDateInt(charge.eventStart)['longDate']} to ${convertFromDateInt(charge.eventEnd)['time']}.`
         }
         liElement.innerText = content;
         document.querySelector('#charges-list').appendChild(liElement);
       });
       updateBalance();
       updatePayoffAmount();
     });

  //get all of the remaining events that this parent is connected to
  firebase.firestore()
  .collection('Events')
  .where('parents', 'array-contains', parentUID)
  .where('start', '>', new Date().setHours(24))
  .onSnapshot((snapshot) => {
    remainingTime = 0;
    payoffAmount = 0;
    snapshot.forEach(doc => {
      const { start, end, price } = doc.data();
      remainingTime += (end - start);
      payoffAmount += (price * 100);
    })

    console.log('payoff before dicount')
    console.log(payoffAmount);

    //apply discount
    payoffAmount = remainingTime >= (3600000 * HOURS_TO_GET_DISCOUNT) ? payoffAmount * DISCOUNT : payoffAmount;

    payoffAmount -= balance;
    togglePayoffAmount();

    console.log('payoff after dicount')
    console.log(payoffAmount);
    console.log('time remaining')
    console.log(remainingTime);
  })
}

function updatePayoffAmount() {
  firebase.firestore()
  .collection('Events')
  .where('parents', 'array-contains', parentUID)
  .where('start', '>', new Date().setHours(24))
  .get()
  .then((snapshot) => {
    remainingTime = 0;
    payoffAmount = 0;
    snapshot.forEach(doc => {
      const { start, end, price } = doc.data();
      remainingTime += (end - start);
      payoffAmount += (price * 100);
    })

    console.log('payoff before dicount')
    console.log(payoffAmount);

    //if the remaining time is less than 20 hours then discount the payoff by 10%
    payoffAmount = remainingTime >= (3600000 * HOURS_TO_GET_DISCOUNT) ? payoffAmount * DISCOUNT : payoffAmount;

    payoffAmount -= balance;
    togglePayoffAmount();

    console.log('payoff after dicount')
    console.log(payoffAmount);
    console.log('time remaining')
    console.log(remainingTime);
  })
}

function updateBalance() {
  let totalPaymentAmount = 0;
  let totalChargeAmount = 0;

  payments.forEach(payment => {
    if (payment.status === 'succeeded') {
      totalPaymentAmount += payment.amount;
    }
  })
  charges.forEach(charge => {
  totalChargeAmount += charge.amount;
  })

  balance = totalPaymentAmount - totalChargeAmount;
  document.querySelector('#payment-amount').value = balance < 0 ? balance / -100 : 0;
  const symbol = balance < 0 ? '🚨' : '✅';
  document.querySelector('#balance').textContent = `${symbol} ${formatAmount(balance, 'USD')}`;
}
 
 /**
  * Event listeners
  */

// payment radios
document
.querySelectorAll('input[name="payment-type"]')
.forEach((radio) => {
  radio.addEventListener('change', (event) => {
    if (event.target.value == 'new') {
      document.querySelector('#new-card-wrapper').style.display = 'block';
      document.querySelector('#saved-card-wrapper').style.display = 'none';
      document.querySelector('#save-card-button').style.display = 'inline-block';
      document.querySelector('#delete-card-button').style.display = 'none';
    }
    else if (event.target.value == 'saved') {
      document.querySelector('#saved-card-wrapper').style.display = 'block';
      document.querySelector('#new-card-wrapper').style.display = 'none';
      document.querySelector('#save-card-button').style.display = 'none';
      document.querySelector('#delete-card-button').style.display = 'inline-block';
    }
  })
})

//payoff checkbox
document
.querySelector('#payoff')
.addEventListener('change', togglePayoffAmount);

function togglePayoffAmount() {
  const payoffElement = document.querySelector('#payoff');
  const amountElement = document.querySelector('#payment-amount');

  if (payoffElement.checked) {
    //place the payoff amount into the amount field
    amountElement.value = payoffAmount / 100;
  }
  else {
    //return the amount field to the default value;
    updateBalance()
  }
}

//remove payoff check if the amount is modified
document.querySelector('#payment-amount').addEventListener('input', () => {
  document.querySelector('#payoff').checked = false;
})
 
 // Create payment form
document
.querySelector('#payment-form')
.addEventListener('submit', async (event) => {
  event.preventDefault();
  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = true));

  const form = new FormData(event.target);
  const cardholderName = form.get('name');

  const amount = Number(form.get('amount'));
  const currency = form.get('currency');

  if (!confirm(`Are you sure you want to charge this card an amount of ${formatAmount(formatAmountForStripe(amount, currency), currency)}`)) {
    document
    .querySelectorAll('button')
    .forEach((button) => (button.disabled = false));
    return;
  }

  const paymentType = form.get('payment-type');
  let paymentMethodID = null;
  if (paymentType == 'new') {
    if (!cardholderName) {
      document.querySelector('#error-message').textContent = 'Please add a cardholder name.';
      document
        .querySelectorAll('button')
        .forEach((button) => (button.disabled = false));
      return;
    }

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: cardholderName,
      },
    })

    if (error) {
      document.querySelector('#error-message').textContent = error.message;
      document
        .querySelectorAll('button')
        .forEach((button) => (button.disabled = false));
      return;
    }

    paymentMethodID = paymentMethod.id;
  }
  else if (paymentType == 'saved') {
    paymentMethodID = form.get('payment-method');
  }
  else {
    document
    .querySelectorAll('button')
    .forEach((button) => (button.disabled = false));
    return;
  }

  const data = {
    payment_method: paymentMethodID,
    currency,
    amount: formatAmountForStripe(amount, currency),
    status: 'new',
    created: new Date().getTime()
  };

  await firebase
    .firestore()
    .collection('stripe_customers')
    .doc(parentUID)
    .collection('payments')
    .add(data);

  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = false));

  event.target.reset();
  cardElement.clear();
});

//save the new card
document
.querySelector('#save-card-button')
.addEventListener('click', async (event) => {
  event.preventDefault();
  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = true));

  const form = new FormData(document.querySelector('#payment-form'));
  const cardholderName = form.get('name');
  if (!cardholderName) {
    document.querySelector('#error-message').textContent = 'Please add a cardholder name.';
    document
      .querySelectorAll('button')
      .forEach((button) => (button.disabled = false));
    return;
  }

  const { setupIntent, error } = await stripe.confirmCardSetup(
    customerData.setup_secret,
    {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      },
    }
  );

  if (error) {
    document.querySelector('#error-message').textContent = error.message;
    document
      .querySelectorAll('button')
      .forEach((button) => (button.disabled = false));
    return;
  }

  await firebase
  .firestore()
  .collection('stripe_customers')
  .doc(parentUID)
  .collection('payment_methods')
  .add({ id: setupIntent.payment_method });

  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = false));

});

//delete the saved card
document
.querySelector('#delete-card-button')
.addEventListener('click', async (event) => {
  event.preventDefault();
  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = true));

  //get the current selected card
  const savedCardElem = document.querySelector('#saved-payment-method').options[document.querySelector('#saved-payment-method').selectedIndex];
  const cardDocId = savedCardElem.id.substring(5, savedCardElem.id.length);

  if (!confirm('Are you sure you want to delete ' + savedCardElem.textContent)) {
    document
    .querySelectorAll('button')
    .forEach((button) => (button.disabled = false));
    return;
  }

  //delete the firebase doc that holds this payment method
  await firebase.firestore().collection('stripe_customers').doc(parentUID).collection('payment_methods').doc(cardDocId).delete();
  
  //remove the card option from the select
  savedCardElem.remove();

  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = false));
})

// Create charge form
document
.querySelector('#charge-form')
.addEventListener('submit', async (event) => {
  event.preventDefault();
  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = true));

  const form = new FormData(event.target);
  const amount = Number(form.get('amount'));
  const currency = form.get('currency');
  const title = form.get('title');
  const data = {
    currency,
    amount: formatAmountForStripe(amount, currency),
    title,
    created: new Date().getTime()
  }

  if (!confirm(`Are you sure you want to add a charge to this parent of ${formatAmount(formatAmountForStripe(amount, currency), currency)}`)) {
    document
    .querySelectorAll('button')
    .forEach((button) => (button.disabled = false));
    return;
  }

  await firebase
    .firestore()
    .collection('stripe_customers')
    .doc(parentUID)
    .collection('charges')
    .add(data);

  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = false));

  //reset form
  event.target.reset();
});
 
 /**
  * Helper functions
  */
 
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
 
 // Handle card actions like 3D Secure
 async function handleCardAction(payment, docId) {
   const { error, paymentIntent } = await stripe.handleCardAction(
     payment.client_secret
   );
   if (error) {
     alert(error.message);
     payment = error.payment_intent;
   } else if (paymentIntent) {
     payment = paymentIntent;
   }
 
   await firebase
     .firestore()
     .collection('stripe_customers')
     .doc(parentUID)
     .collection('payments')
     .doc(docId)
     .set(payment, { merge: true });
 }