
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51JYNNQLLet6MRTvnZAwlZh6hdMQqNgVp5hvHuMDEfND7tClZcbTCRZl9fluBQDZBAAGSNOJBQWMjcj0ow1LFernK00l8QY5ouc';
let customerData = {};
let invoiceData = {};

// get the invoice data
async function intialSetup() {
  //set the date
  document.querySelector('.date').textContent = convertFromDateInt(new Date().getTime())['dayAndDate'];

  // get the invoice data
  let invoice = await firebase.firestore().collection('Invoices').doc(queryStrings().invoice).get();
  invoiceData = invoice.data();

  //set the parent name
  document.getElementById('parent-name').textContent = 'Welcome back ' + invoiceData.parentName;

  // get the customer data
  let customer = await firebase.firestore().collection('stripe_customers').doc(invoiceData.parent).get();
  customerData = customer.data();

  // set up the lesson list
  const lessonTableBody = document.querySelector('#lesson-table tbody')
  invoiceData.events.forEach(event => {
    const startStr = convertFromDateInt(event.start).longReadable;
    const hourDuration = (event.end - event.start) / 3600000;
    const price = event.price * hourDuration;

    let lessonRow = document.createElement('tr');
    lessonRow.id = `lesson-${event.id}`;
    lessonRow.innerHTML = `
      <td class='title'>${event.title}</td>
      <td class='start'>${startStr}</td>
      <td class='duration'>${hourDuration} ${hourDuration == 1 ? 'hour' : 'hours'}</td>
      <td class='price'>$${price}</td>
    `
    lessonTableBody.append(lessonRow);
  })
  // add in the existing balance due
  if (invoiceData.existingBalanceDue > 0) {
    let existingBalanceRow = document.createElement('tr');
    existingBalanceRow.id = 'existing-balance';
    existingBalanceRow.innerHTML = `
      <td class='title'>Existing Balance Due</td>
      <td class='start'></td>
      <td class='duration'></td>
      <td class='price'>$${invoiceData.existingBalanceDue}</td>
    `
    lessonTableBody.append(existingBalanceRow);
  }

  //set up the balance due
  document.getElementById('balance-due').textContent = `$${invoiceData.existingBalanceDue + invoiceData.newBalanceDue}`
  document.getElementById('amount').textContent = `$${invoiceData.existingBalanceDue + invoiceData.newBalanceDue}`

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

  const amount = invoiceData.existingBalanceDue + invoiceData.newBalanceDue;
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

  const paymentMethodID = paymentMethod.id;

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
    .doc(invoiceData.parent)
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

  if (!confirm('Before you save this card we want to let you know that by pressing the "OK" button you agree to allow Lyrn to charge this card on an ongoing basis before every lesson your student will attend.')) {
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
  .doc(invoiceData.parent)
  .collection('payment_methods')
  .add({ id: setupIntent.payment_method });

  document
  .querySelectorAll('.button')
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
     .doc(invoiceData.parent)
     .collection('payments')
     .doc(docId)
     .set(payment, { merge: true });
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


