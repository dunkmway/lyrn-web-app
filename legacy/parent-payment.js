
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51JYNNQLLet6MRTvnZAwlZh6hdMQqNgVp5hvHuMDEfND7tClZcbTCRZl9fluBQDZBAAGSNOJBQWMjcj0ow1LFernK00l8QY5ouc';
let currentUser = {};
let customerData = {};

let payments = [];
let charges = [];

//set the date
document.querySelector('.date').textContent = convertFromDateInt(new Date().getTime())['dayAndDate'];
 
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
         let labelElement = document.querySelector(`label[for="${paymentMethodId}"]`);
 
         // Add a new option if one doesn't exist yet.
         if (!radioElement) {
            radioElement = document.createElement('input');
            radioElement.setAttribute('type', 'radio');
            radioElement.setAttribute('name', 'payment_method')
            radioElement.id = paymentMethodId;
            document.querySelector('.make-payment').insertBefore(radioElement, document.querySelector('#newCard'));

            labelElement = document.createElement('label');
            labelElement.setAttribute('for', paymentMethodId)
            document.querySelector('.make-payment').insertBefore(labelElement, document.querySelector('#newCard'));
         }
 
         radioElement.value = paymentMethod.id;
         labelElement.textContent = `${paymentMethod.card.brand} •••• ${paymentMethod.card.last4} | Expires ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`;
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
     .onSnapshot((snapshot) => {
      payments = [];
      snapshot.forEach((doc) => {
        const payment = doc.data();
        payment.docId = doc.id;
        payments.push(payment);
      })

      payments.sort((a,b) => a.created - b.created);
      payments.forEach(payment => {
        //see if this payment row already exists
        let paymentRow = document.getElementById(`payment-${payment.docId}`);

        let date = convertFromDateInt(payment.created * 1000)['shortDate'];
        let status = payment.status;
        let statusColor = null;
        let statusWord = null;
        switch (status) {
          case 'new':
          case 'requires_confirmation':
            statusColor = 'yellow';
            statusWord = 'PENDING';
            break;
          case 'succeeded':
            statusColor = 'green';
            statusWord = 'PAID';
            break;
          default:
            statusColor = 'red';
            statusWord = 'DECLINED';
        }
        let amount = formatAmount(payment.amount, payment.currency);
        let card = payment?.charges?.data[0]?.payment_method_details?.card;
        let cardDetails = card ? `${card.brand} •••• ${card.last4}` : "••••";

        //if it does then update the table data
        if (paymentRow) {
          paymentRow.querySelector('.date').textContent = date;
          paymentRow.querySelector('.status').innerHTML = `<div class='status ${statusColor}'>${statusWord}</div>`;
          paymentRow.querySelector('.amount').textContent = amount;
          paymentRow.querySelector('.card').textContent = cardDetails;
        }
        //if not create it
        else {
          paymentRow = document.createElement('tr');
          paymentRow.id = `payment-${payment.docId}`;
          paymentRow.innerHTML = `
            <td class='date'>${date}</td>
            <td class='status'>
              <div class='status ${statusColor}'>${statusWord}</div>
            </td>
            <td class='amount'>${amount}</td>
            <td class='card'>${cardDetails}</td>
          `
          document.querySelector('#payments-table tbody').prepend(paymentRow);
          //only scroll after the first load in
          if (document.timeline.currentTime > 5000) {
            paymentRow.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
          }
        }







      //    let liElement = document.getElementById(`payment-${payment.docId}`);
      //    if (!liElement) {
      //      liElement = document.createElement('li');
      //      liElement.id = `payment-${payment.docId}`;
      //    }
 
      //    console.log('got new payment')
      //    console.log(payment.status)
      //    let content = '';
      //    if (
      //      payment.status === 'new' ||
      //      payment.status === 'requires_confirmation'
      //    ) {
      //      console.log('new payment')
      //      content = `Creating Payment of ${formatAmount(
      //        payment.amount,
      //        payment.currency
      //      )} on ${convertFromDateInt(payment.created * 1000)['longDate']}.`;
      //    } else if (payment.status === 'succeeded') {
      //      const card = payment.charges.data[0].payment_method_details.card;
      //      content = `✅ ${formatAmount(
      //        payment.amount,
      //        payment.currency
      //      )} with ${card.brand} card •••• ${card.last4} on ${convertFromDateInt(payment.created * 1000)['longDate']}.`;
      //    } else if (payment.status === 'requires_action') {
      //      content = `🚨 ${formatAmount(
      //        payment.amount,
      //        payment.currency
      //      )} ${payment.status} on ${convertFromDateInt(payment.created * 1000)['longDate']}.`;
      //      handleCardAction(payment, doc.id);
      //    } else {
      //      content = `⚠️ ${formatAmount(
      //        payment.amount,
      //        payment.currency
      //      )} ${payment.error} on ${convertFromDateInt(payment.created * 1000)['longDate']}.`;
      //    }
      //    liElement.innerText = content;
      //    document.querySelector('#payments-list').appendChild(liElement);
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
 
        //  let liElement = document.getElementById(`charge-${doc.id}`);
        //  if (!liElement) {
        //    liElement = document.createElement('li');
        //    liElement.id = `charge-${doc.id}`;
        //  }
 
        //  let content = `⚠️ ${convertFromDateInt(charge.created)['longDate']}: ${formatAmount(charge.amount, charge.currency)} for ${charge.title}.`;
        //  if (charge.eventStart && charge.eventEnd) {
        //    //remove period
        //    content = content.substring(0, content.length - 1);
        //    content += ` from ${convertFromDateInt(charge.eventStart)['longDate']} to ${convertFromDateInt(charge.eventEnd)['time']}.`
        //  }
        //  liElement.innerText = content;
        //  document.querySelector('#charges-list').appendChild(liElement);
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
  document.querySelector('#amount').value = balance < 0 ? '$' + (balance / -100).toString() : '';
  const color = balance < 0 ? '#E87271' : '#67C857';
  document.querySelector('#balance').textContent = `${formatAmount(balance, 'USD')}`;
  document.querySelector('#balance').style.color = color;
}
 
 /**
  * Event listeners
  */
 
 // Create payment form
document
.querySelector('.pay')
.addEventListener('click', async (event) => {
  document
  .querySelectorAll('.button')
  .forEach((button) => (button.disabled = true));

  const cardholderName = document.querySelector('#cardholderName');

  const amount = Number(document.querySelector('#amount').value.replace('$', ''));
  const currency = 'usd';

  if (amount == 0) {
    alert("It's ok you can keep it...\nYou are paying $0.00")
    return;
  }

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
        .querySelectorAll('.button')
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
        .querySelectorAll('.button')
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
    created: new Date().getTime() / 1000
  };

  await firebase
    .firestore()
    .collection('stripe_customers')
    .doc(currentUser.uid)
    .collection('payments')
    .add(data);

  document
  .querySelectorAll('.button')
  .forEach((button) => (button.disabled = false));

  cardElement.clear();
  document.querySelector('#cardholderName').value = "";
});

//save the new card
document
.querySelector('.save-card')
.addEventListener('click', async (event) => {
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

  if (!confirm('Before you save this card we want to let you know that by pressing the "OK" button you agree to allow Lyrn to charge this card on an ongoing basis 24 hours before every lesson your student will attend.')) {
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

  if (!confirm("If you delete this card it may interrupt your subscription with us. This could possibly place your account on probation if your balance is ever negative. " + 'Are you sure you want to delete ' + savedCardLabel.textContent + '.')) {
    document
    .querySelectorAll('.button')
    .forEach((button) => (button.disabled = false));
    return;
  }

  //delete the firebase doc that holds this payment method
  await firebase.firestore().collection('stripe_customers').doc(currentUser.uid).collection('payment_methods').doc(cardDocId).delete();
  
  //remove the card option from the select
  savedCardElem.remove();
  savedCardLabel.remove();

  //reselect the new card input
  document.querySelector('#newCard').checked = true;

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








//  handle currency formatting
// Jquery Dependency

$("input[data-type='currency']").on({
  keyup: function() {
    formatCurrency($(this));
  },
  blur: function() { 
    formatCurrency($(this), "blur");
  }
});


function formatNumber(n) {
// format number 1000000 to 1,234,567
return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}


function formatCurrency(input, blur) {
// appends $ to value, validates decimal side
// and puts cursor back in right position.

// get input value
var input_val = input.val();

// don't validate empty input
if (input_val === "") { return; }

// original length
var original_len = input_val.length;

// initial caret position 
var caret_pos = input.prop("selectionStart");
  
// check for decimal
if (input_val.indexOf(".") >= 0) {

  // get position of first decimal
  // this prevents multiple decimals from
  // being entered
  var decimal_pos = input_val.indexOf(".");

  // split number by decimal point
  var left_side = input_val.substring(0, decimal_pos);
  var right_side = input_val.substring(decimal_pos);

  // add commas to left side of number
  left_side = formatNumber(left_side);

  // validate right side
  right_side = formatNumber(right_side);
  
  // On blur make sure 2 numbers after decimal
  if (blur === "blur") {
    right_side += "00";
  }
  
  // Limit decimal to only 2 digits
  right_side = right_side.substring(0, 2);

  // join number by .
  input_val = "$" + left_side + "." + right_side;

} else {
  // no decimal entered
  // add commas to number
  // remove all non-digits
  input_val = formatNumber(input_val);
  input_val = "$" + input_val;
  
  // final formatting
  if (blur === "blur") {
    input_val += ".00";
  }
}

// send updated string to input
input.val(input_val);

// put caret back in the right position
var updated_len = input_val.length;
caret_pos = updated_len - original_len + caret_pos;
input[0].setSelectionRange(caret_pos, caret_pos);
}


