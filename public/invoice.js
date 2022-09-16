
const STRIPE_PUBLISHABLE_KEY = location.hostname === "localhost" ?
'pk_test_51JYNNQLLet6MRTvnXP7E1r6Xgea5rIdUxNOFlLcVmEPtBkABMn4G8QJfdxHJE2Na4HmqrxnxKSvYKpm7AJsWHSvz00VfCQ4ORr' :
'pk_live_51JYNNQLLet6MRTvnZAwlZh6hdMQqNgVp5hvHuMDEfND7tClZcbTCRZl9fluBQDZBAAGSNOJBQWMjcj0ow1LFernK00l8QY5ouc';

let customerData = {};
let parentData = {};
let invoiceData = {};
let promoData = null;

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

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

async function checkPromo() {
  //place the promo into a loading state
  document.querySelector('.promo').classList.add('loading');

  //check the promo on the server
  const promoCode = document.getElementById('promoCode').value.toLowerCase().trim();
  const invoice = pathParameter(1);
  if (!invoice) {
    return;
  }

  try {
    let response = await firebase.functions().httpsCallable('invoices-checkPromo')({
      promoCode,
      invoice
    });

    document.querySelector('.promo').classList.remove('loading');

    // found the promo code
    // effect should come through and rerender the invoice
    if (response.data) {
      document.querySelector('.promo label').classList.add('valid');
      document.querySelector('.promo label').classList.remove('invalid');
    }
    // did not find promo code
    // show error
    else {
      document.querySelector('.promo label').classList.remove('valid');
      document.querySelector('.promo label').classList.add('invalid');
    }
  }
  catch(error) {
    console.log(error)
    document.querySelector('.promo').classList.remove('loading');
    document.querySelector('.promo label').classList.add('invalid');
  }
  
}

// get the invoice data
async function initialSetup() {

  // set up debounce on promo
  const promoInput = debounce(() => checkPromo(), 500);
  document.getElementById('promoCode').addEventListener('input', promoInput)

  if (!pathParameter(1)) { 
    setupInvalid();
    return;
  };

  // let invoiceDoc = await firebase.firestore().collection('Invoices').doc(pathParameter(1)).get();
  // invoiceData = invoiceDoc.data();
  // console.log(invoiceData)

  // get the invoice data
  firebase.firestore().collection('Invoices').doc(pathParameter(1)).onSnapshot(async (invoice) => {
    // set up the page depending on what the status of the invoice is
    if (!invoice.exists) {
      setupInvalid();
      return;
    };

    invoiceData = invoice.data();
    console.log('snapshot called', invoiceData)

    const [
      parentDoc,
      customerDoc,
      promoDoc
    ] = await Promise.all([
      firebase.firestore().collection('Users').doc(invoiceData.parent).get(),
      firebase.firestore().collection('stripe_customers').doc(invoiceData.parent).get(),
      invoiceData.promo && firebase.firestore().collection('Promos').doc(invoiceData.promo).get()
    ])

    parentData = parentDoc.data();
    customerData = customerDoc.data();
    promoData = promoDoc ? promoDoc.data() : null;

    //set the parent name
    document.getElementById('parent-name').textContent = 'Hi ' + parentData.firstName + ' ' + parentData.lastName + ',';

    switch (invoiceData?.status) {
      case 'pending':
        setupPending();
        break;
      case 'processing':
        setupProcessing();
        break;
      case 'processed':
        setupProcessed();
        break;
      case 'error':
        setupError();
        break;
      case 'succeeded':
        setupSuccess();
        break;
      case 'failed':
        setupFailed();
        break;
      default:
        setupInvalid();
    }
  });
}

function setupInvoice() {
  const invoiceWrapper = document.getElementById('invoice');
  removeAllChildNodes(invoiceWrapper);

  // go through the items and add in a invoice row
  invoiceData.items.forEach(item => {
    const itemRow = createInvoiceRow(
      item.description,
      `Qty ${item.quantity}`,
      formatAmount(item.price * item.quantity, 'usd'),
      `${formatAmount(item.price, 'usd')} each`,
      false
    );
    invoiceWrapper.appendChild(itemRow);
  });

  // if promo has absolute discount
  let promoAbsoluteAmount = 0;
  if (promoData && promoData.absoluteAmount) {
    promoAbsoluteAmount = -1 * promoData.absoluteAmount;

    const promoAbsoluteRow = createInvoiceRow(
      'Promo Code',
      promoData.code.toUpperCase(),
      formatAmount(promoData.absoluteAmount, 'usd'),
      '',
      false
    );
    invoiceWrapper.appendChild(promoAbsoluteRow);
  }

  // set up the subtotal
  const subtotal = invoiceData.items.reduce((prev, curr) => prev + (curr.quantity * curr.price), 0) + promoAbsoluteAmount;

  // relative promo
  let promoRelativeAmount = 0;
  if (promoData && promoData.relativeAmount) {
    // only show sub total if there is a promo affecting it
    const subtotalRow = createInvoiceRow(
      'Subtotal',
      '',
      formatAmount(subtotal, 'usd'),
      '',
      true
    );
    invoiceWrapper.appendChild(subtotalRow);

    // display the realtive promo
    promoRelativeAmount = -1 * subtotal * (promoData.relativeAmount / 100);
    const promoRelativeRow = createInvoiceRow(
      'Promo Code',
      promoData.code.toUpperCase(),
      formatAmount(promoRelativeAmount, 'usd'),
      `${promoData.relativeAmount}% off`,
      false
    );
    invoiceWrapper.appendChild(promoRelativeRow);
  }

  // set up the total
  const total = subtotal + promoRelativeAmount
  const totalRow = createInvoiceRow(
    'Total',
    '',
    formatAmount(total, 'usd'),
    '',
    true
  );
  invoiceWrapper.appendChild(totalRow);

  // set up the amount due
  const amountDue = (invoiceData.initialPayment // amount passed in the invoice
  - (promoData?.absoluteAmount ?? 0)) // remove absolute promo discount
  * (100 - (promoData?.relativeAmount ?? 0)) / 100; // remove relative promo amount

  const amountDueRow = createInvoiceRow(
    'Amount Due',
    'Charged today',
    formatAmount(amountDue, 'usd'),
    '',
    false
  );
  invoiceWrapper.appendChild(amountDueRow)

}

function createInvoiceRow(description, quantity, total, price, isSeparator) {
  const row = document.createElement('div');
  row.classList.add('invoice-row');
  isSeparator && row.classList.add('separator');
  row.innerHTML = `
    <div class="start">
      <p>${description}</p>
      <p class="sub">${quantity}</p>
    </div>
    <div class="end">
      <p>${total}</p>
      <p class="sub">${price}</p>
    </div>
  `
  return row;
}
 

function setupPending() {
  // set up each invoice details
  setupInvoice();

  document.querySelector('#welcome-message').textContent = `We're just one step away from starting your ${invoiceData.type} program.`
  document.querySelector('#expiration-message').textContent = `Due ${new Time(invoiceData.expiration.toDate()).toFormat('{EEE}, {MMM} {ddd}, {yyyy}')} by 11:55 p.m.`
  document.querySelector('.payments').style.display = 'block';
}

function setupProcessing() {
  setupInvoice();

  document.querySelector('#welcome-message').textContent = `We're just one step away from starting your ${invoiceData.type} program.`
  document.querySelector('#expiration-message').textContent = `Due ${new Time(invoiceData.expiration.toDate()).toFormat('{EEE}, {MMM} {ddd}, {yyyy}')} by 11:55 p.m.`
  document.querySelector('.payments').style.display = 'block';
}

async function setupProcessed() {
  setupInvoice();

  document.querySelector('#welcome-message').textContent = `We're just one step away from starting your ${invoiceData.type} program.`
  document.querySelector('#expiration-message').textContent = `Due ${new Time(invoiceData.expiration.toDate()).toFormat('{EEE}, {MMM} {ddd}, {yyyy}')} by 11:55 p.m.`
  document.querySelector('.payments').style.display = 'block';

  const paymentMethodID = await saveCard(cardholderName);
  await firebase.firestore()
  .collection('Invoices').doc(pathParameter(1))
  .update({
    savedPaymentMethod: paymentMethodID
  })
}

function setupError() {
  setupInvoice();

  document.querySelector('#welcome-message').textContent = `We're just one step away from starting your ${invoiceData.type} program.`
  document.querySelector('#expiration-message').textContent = `Due ${new Time(invoiceData.expiration.toDate()).toFormat('{EEE}, {MMM} {ddd}, {yyyy}')} by 11:55 p.m.`
  document.querySelector('.payments').style.display = 'block';

  handleError(invoiceData.error, { target: document.querySelector('button.submit') })
}

function setupSuccess() {
  document.querySelector('#welcome-message').textContent = "We're all set! We can't wait to see you for your program."
  document.querySelector('#expiration-message').textContent = '';
  document.querySelector('.payments').style.display = 'none';
}

function setupFailed() {
  document.querySelector('#welcome-message').textContent = "We weren't able to receive your payment for this program before this invoice expired. We have removed the corresponding lessons from the schedule."
  document.querySelector('#expiration-message').textContent = '';
  document.querySelector('.payments').style.display = 'none';
}

function setupInvalid() {
  document.querySelector('#welcome-message').textContent = "We're having troubles retrieving this invoice. Double check the url to make sure it is correct. If you continue to recieve this message please contact us."
  document.querySelector('#expiration-message').textContent = '';
  document.querySelector('.payments').style.display = 'none';
}

 
/*
* Event listeners
*/

async function submit(event) {
  startWorking(event);

  const cardholderName = document.querySelector('#cardholderName').value;
  const amountDue = (invoiceData.initialPayment // amount passed in the invoice
  - (promoData?.absoluteAmount ?? 0)) // remove absolute promo discount
  * (100 - (promoData?.relativeAmount ?? 0)) / 100; // remove relative promo amount
  const currency = 'usd';
  const agreements = document.querySelectorAll('.agreements > input');

  //check cardholder
  if (!cardholderName) {
    handleError('Please add a cardholder name.', event)
    return;
  }

  //check agreements
  for (let i = 0; i < agreements.length; i++) {
    if (!agreements[i].checked) {
      handleError('Please agree to all of the terms before continuing', event)
      return;
    }
  }

  //confirm
  const confirmation = await Dialog.confirm(`${formatAmount(amountDue, currency)} will be charged to the inputted credit card. Do you wish to continue?`)
  if (!confirmation) {
    handleError('', event);
    return;
  }

  try {
    // await chargeCard(amount, currency, cardholderName, event, invoiceData.schedule.length > 0);
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: cardholderName,
      },
    })
  
    if (error) {
      throw error;
    }

    await firebase
    .firestore()
    .collection('Invoices')
    .doc(pathParameter(1))
    .update({
      payment_method: paymentMethod.id,
      status: 'processing'
    })

  }
  catch (error) {
    handleError(error.message, event);
    return;
  }

}

function handleError(message, event) {
  document.querySelector('#error-message').textContent = message;
  document.querySelectorAll('.button').forEach((button) => (button.disabled = false));
  event.target.textContent = 'Pay';
  event.target.classList.remove('spinner');
}

function startWorking(event) {
  document.querySelectorAll('.button').forEach((button) => (button.disabled = true));
  document.querySelector('#error-message').textContent = '';

  event.target.textContent = 'processing';
  event.target.classList.add('spinner');
}

function endWorking(event) {
  document.querySelectorAll('.button').forEach((button) => (button.disabled = false));
  event.target.textContent = 'Payment Received!';
  event.target.classList.remove('spinner');

  cardElement.clear();
  document.querySelector('#cardholderName').value = "";
}

async function chargeCard(amount, currency, cardholderName, event, shouldSaveCard = false) {
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
    billing_details: {
      name: cardholderName,
    },
  })

  if (error) {
    throw error;
  }

  const paymentMethodID = paymentMethod.id;

  const data = {
    payment_method: paymentMethodID,
    currency,
    amount: formatAmountForStripe(amount, currency),
    status: 'new',
    created: new Date().getTime() / 1000,
    invoice: pathParameter(1)
  };

  const paymentRef = firebase
  .firestore()
  .collection('stripe_customers')
  .doc(invoiceData.parent)
  .collection('payments')
  .doc();

  const paymentSubscription = paymentRef.onSnapshot(async (payment) => {
    console.log(payment.data())
    switch (payment.data().status) {
      case 'error':
        handleError(payment.data().error, event);
        paymentSubscription();
        break;
      case 'requires_action':
        handleCardAction(payment.data(), payment.id);
        break;
      case 'requires_payment_method':
        // the payment did not go through so we show an error
        handleError('We could not process your payment.', event);
        break;
      case 'succeeded':
        try {
          if (shouldSaveCard) {
            const paymentMethodID = await saveCard(cardholderName);
            await firebase.firestore()
            .collection('Invoices').doc(pathParameter(1))
            .update({
              paymentMethod: paymentMethodID
            })
          }
        }
        catch (error) {
          handleError(error.message, event);
          return;
        }

        endWorking(event);
        paymentSubscription();
        break;
      default:
        break;
    }
  }, (error) => {
    handleError(error, event);
  })

  await paymentRef.set(data);

  return;
}

async function saveCard(cardholderName) {
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
    throw error;
  }

  const paymentMethodRef = firebase.firestore()
  .collection('stripe_customers').doc(invoiceData.parent)
  .collection('payment_methods').doc()

  await paymentMethodRef.set({
    id: setupIntent.payment_method,
  });

  return paymentMethodRef.id;
}

 
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
 
//  Handle card actions like 3D Secure
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


