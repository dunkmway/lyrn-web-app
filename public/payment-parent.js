
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51JYNNQLLet6MRTvnZAwlZh6hdMQqNgVp5hvHuMDEfND7tClZcbTCRZl9fluBQDZBAAGSNOJBQWMjcj0ow1LFernK00l8QY5ouc';
let currentUser = {};
let customerData = {};

let payments = [];
let charges = [];
 
firebase.auth().onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    currentUser = firebaseUser;
    firebase.firestore().collection('stripe_customers').doc(currentUser.uid).onSnapshot((snapshot) => {
      if (snapshot.data()) {
        customerData = snapshot.data();
        startDataListeners();
      } else {
        console.warn(
          `No Stripe customer found in Firestore for user: ${currentUser.uid}`
        );
      }
    });

    firebase.firestore().collection('Users').doc(currentUser.uid).onSnapshot((snapshot) => {
      if (snapshot.data()) {
        parentData = snapshot.data();
        //set up the parent name in the title
        const {firstName, lastName} = parentData;
        document.getElementById('parent-name').textContent = "Welcome back, " +  firstName;
      } else {
        console.warn(
          `No Lyrn User found in Firestore for user: ${currentUser.uid}`
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
     .doc(currentUser.uid)
     .collection('payment_methods')
     .onSnapshot((snapshot) => {
       snapshot.forEach(function (doc) {
         const paymentMethod = doc.data();
         if (!paymentMethod.card) {
           return;
         }
 
         const paymentMethodId = `card-${doc.id}`;
         let radioElement = document.getElementById(paymentMethodId);
         let labelElement = document.querySelector(`label[for="${paymentMethodId}"]"`);
 
         // Add a new option if one doesn't exist yet.
         if (!radioElement) {
            radioElement = document.createElement('radio');
            radioElement.id = paymentMethodId;
            document.querySelector('.make-payment').insertBefore(radioElement, document.querySelector('#newCard'));

            labelElement = document.createElement('label');
            labelElement.setAttribute('for', paymentMethodId)
            document.querySelector('.make-payment').insertBefore(radioElement, document.querySelector('#newCard'));
         }
 
         radioElement.value = paymentMethod.id;
         labelElement.text = `${paymentMethod.card.brand} •••• ${paymentMethod.card.last4} | Expires ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`;
       });
     });
 
   /**
    * Get all payments for the logged in customer
    */
   firebase
     .firestore()
     .collection('stripe_customers')
     .doc(currentUser.uid)
     .collection('payments')
     .orderBy('created', 'desc')
     .onSnapshot((snapshot) => {
      payments = [];
       snapshot.forEach((doc) => {
         const payment = doc.data();
         payments.push(payment);
 
         let liElement = document.getElementById(`payment-${doc.id}`);
         if (!liElement) {
           liElement = document.createElement('li');
           liElement.id = `payment-${doc.id}`;
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
     });

  /**
    * Get all charges for the logged in customer
    */
   firebase
     .firestore()
     .collection('stripe_customers')
     .doc(currentUser.uid)
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
     });
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

  const balance = totalPaymentAmount - totalChargeAmount;
  document.querySelector('#amount').value = balance < 0 ? balance / -100 : 0;
  const symbol = balance < 0 ? '🚨' : '✅';
  document.querySelector('#balance').textContent = `${symbol} ${formatAmount(balance, 'USD')}`;
}
 
 /**
  * Event listeners
  */

// document
// .querySelectorAll('input[name="payment-type"]')
// .forEach((radio) => {
//   radio.addEventListener('change', (event) => {
//     if (event.target.value == 'new') {
//       document.querySelector('#new-card-wrapper').style.display = 'block';
//       document.querySelector('#saved-card-wrapper').style.display = 'none';
//       document.querySelector('#save-card-button').style.display = 'inline-block';
//       document.querySelector('#delete-card-button').style.display = 'none';
//     }
//     else if (event.target.value == 'saved') {
//       document.querySelector('#saved-card-wrapper').style.display = 'block';
//       document.querySelector('#new-card-wrapper').style.display = 'none';
//       document.querySelector('#save-card-button').style.display = 'none';
//       document.querySelector('#delete-card-button').style.display = 'inline-block';
//     }
//   })
// })
 
 // Create payment form
document
.querySelector('.pay')
.addEventListener('click', async (event) => {
  document
  .querySelectorAll('.button')
  .forEach((button) => (button.disabled = true));

  const cardholderName = document.querySelector('#cardholderName');

  const amount = Number(document.querySelector('.amount'));
  const currency = 'usd';

  if (!confirm(`Are you sure you want to charge this card an amount of ${formatAmount(formatAmountForStripe(amount, currency), currency)}`)) {
    document
    .querySelectorAll('.button')
    .forEach((button) => (button.disabled = false));
    return;
  }

  //get the current selected card
  let paymentType;
  document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
    if (radio.checked) {
      paymentType = radio;
      return;
    }
  })
  let savedCardLabel = paymentType.nextElementSibling;

  let paymentMethodID = null;
  if (paymentType.id == 'newCard') {
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
  else {
    paymentMethodID = paymentType.value;
  }

  const data = {
    payment_method: paymentMethodID,
    currency,
    amount: formatAmountForStripe(amount, currency),
    status: 'new',
  };

  await firebase
    .firestore()
    .collection('stripe_customers')
    .doc(currentUser.uid)
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
.querySelector('.save-card')
.addEventListener('click', async (event) => {
  event.preventDefault();
  document
  .querySelectorAll('.button')
  .forEach((button) => (button.disabled = true));

  const cardholderName = document.getElementById('cardholderName').value;
  if (!cardholderName) {
    document.querySelector('#error-message').textContent = 'Please add a cardholder name.';
    document
      .querySelectorAll('.button')
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
      .querySelectorAll('.button')
      .forEach((button) => (button.disabled = false));
    return;
  }

  await firebase
  .firestore()
  .collection('stripe_customers')
  .doc(currentUser.uid)
  .collection('payment_methods')
  .add({ id: setupIntent.payment_method });

  document
  .querySelectorAll('.button')
  .forEach((button) => (button.disabled = false));

});

//delete the saved card
document
.querySelector('.delete-card')
.addEventListener('click', async (event) => {
  event.preventDefault();
  document
  .querySelectorAll('.button')
  .forEach((button) => (button.disabled = true));

  //get the current selected card
  let savedCardElem;
  document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
    if (radio.checked) {
      savedCardElem = radio;
      return;
    }
  })
  let savedCardLabel = savedCardElem.nextElementSibling;
  const cardDocId = savedCardElem.id.substring(5, savedCardElem.id.length);

  if (!confirm('Are you sure you want to delete ' + savedCardLabel.textContent)) {
    document
    .querySelectorAll('.button')
    .forEach((button) => (button.disabled = false));
    return;
  }

  //delete the firebase doc that holds this payment method
  await firebase.firestore().collection('stripe_customers').doc(currentUser.uid).collection('payment_methods').doc(cardDocId).delete();
  
  //remove the card option from the select
  savedCardElem.remove();

  document
  .querySelectorAll('.button')
  .forEach((button) => (button.disabled = false));
})

 
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
     .doc(currentUser.uid)
     .collection('payments')
     .doc(docId)
     .set(payment, { merge: true });
 }

 function resetPassword() {
  let confirmation = confirm("Are you sure you want to reset your password?");
  if (confirmation) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        var auth = firebase.auth();
        var emailAddress = user.email;

        auth.sendPasswordResetEmail(emailAddress)
        .then(function() {
          // Email sent.
          alert("An email has been sent to your email to continue with your password reset.");
        })
        .catch(function(error) {
          // An error happened.
          alert("There was an issue with your password reset. \nPlease try again later.");
          handleFirebaseErrors(error, window.location.href);
        });
      } else {
        // No user is signed in.
        alert("Oops! No one is signed in to change the password");
      }
    });
  }
}
