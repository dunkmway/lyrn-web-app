
 const STRIPE_PUBLISHABLE_KEY = 'pk_test_51JYNNQLLet6MRTvnXP7E1r6Xgea5rIdUxNOFlLcVmEPtBkABMn4G8QJfdxHJE2Na4HmqrxnxKSvYKpm7AJsWHSvz00VfCQ4ORr';
 let currentUser = {};
 let customerData = {};
 let parentUID = queryStrings().parent;
 console.log(parentUID)

 let payments = [];
 let charges = [];
 
 firebase.auth().onAuthStateChanged((firebaseUser) => {
   if (firebaseUser) {
     currentUser = firebaseUser;
     firebase
       .firestore()
       .collection('stripe_customers')
       .doc(parentUID)
       .onSnapshot((snapshot) => {
         if (snapshot.data()) {
           customerData = snapshot.data();
           startDataListeners();
         } else {
           console.warn(
             `No Stripe customer found in Firestore for user: ${parentUID}`
           );
         }
       });
   } else {
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
       if (snapshot.empty) {
         document.querySelector('#add-new-card').open = true;
       }
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
           content = `Creating Payment of ${formatAmount(
             payment.amount,
             payment.currency
           )}`;
         } else if (payment.status === 'succeeded') {
           const card = payment.charges.data[0].payment_method_details.card;
           content = `✅ Payment of ${formatAmount(
             payment.amount,
             payment.currency
           )} on ${card.brand} card •••• ${card.last4}.`;
         } else if (payment.status === 'requires_action') {
           content = `🚨 Payment of ${formatAmount(
             payment.amount,
             payment.currency
           )} ${payment.status}`;
           handleCardAction(payment, doc.id);
         } else {
           content = `⚠️ Payment of ${formatAmount(
             payment.amount,
             payment.currency
           )} ${payment.error}`;
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
     .doc(parentUID)
     .collection('charges')
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
 
         let content = `⚠️ Charge of ${formatAmount(charge.amount, charge.currency)} for ${charge.title}.`;
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
  const symbol = balance < 0 ? '🚨' : '✅';
  document.querySelector('#balance').textContent = `${symbol} ${formatAmount(balance, 'USD')}`;
}
 
 /**
  * Event listeners
  */
 
 
 // Add new card form
 document
   .querySelector('#payment-method-form')
   .addEventListener('submit', async (event) => {
     event.preventDefault();
     if (!event.target.reportValidity()) {
       return;
     }
     document
       .querySelectorAll('button')
       .forEach((button) => (button.disabled = true));
 
     const form = new FormData(event.target);
     const cardholderName = form.get('name');
 
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
 
     document.querySelector('#add-new-card').open = false;
     document
       .querySelectorAll('button')
       .forEach((button) => (button.disabled = false));
   });
 
 // Create payment form
document
.querySelector('#payment-form')
.addEventListener('submit', async (event) => {
  event.preventDefault();
  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = true));

  const form = new FormData(event.target);
  const amount = Number(form.get('amount'));
  const currency = form.get('currency');
  const data = {
    payment_method: form.get('payment-method'),
    currency,
    amount: formatAmountForStripe(amount, currency),
    status: 'new',
  };

  if (!confirm(`Are you sure you want to charge this card an amount of ${formatAmount(formatAmountForStripe(amount, currency), currency)}`)) {
    document
    .querySelectorAll('button')
    .forEach((button) => (button.disabled = false));
    return;
  }

  await firebase
    .firestore()
    .collection('stripe_customers')
    .doc(parentUID)
    .collection('payments')
    .add(data);

  document
  .querySelectorAll('button')
  .forEach((button) => (button.disabled = false));
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