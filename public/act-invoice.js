
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51JYNNQLLet6MRTvnZAwlZh6hdMQqNgVp5hvHuMDEfND7tClZcbTCRZl9fluBQDZBAAGSNOJBQWMjcj0ow1LFernK00l8QY5ouc';

let customerData = {};
let invoiceData = {};

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
  console.log('called check promo')

  //place the promo into a loading state
  document.querySelector('.promo').classList.add('loading');

  //check the promo on the server
  const promoCode = document.getElementById('promoCode').value.toLowerCase().trim();
  const invoice = queryStrings().invoice
  if (!invoice) {
    return;
  }

  try {
    let response = await firebase.functions().httpsCallable('act_sign_up-checkPromo')({
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

  if (!queryStrings().invoice) { 
    setupInvalid();
    return;
  };

  let invoiceDoc = await firebase.firestore().collection('ACT-Invoices').doc(queryStrings().invoice).get();
  invoiceData = invoiceDoc.data();
  console.log(invoiceData)

  // get the invoice data
  firebase.firestore().collection('ACT-Invoices').doc(queryStrings().invoice).onSnapshot((invoice) => {
    invoiceData = invoice.data();
    console.log('snapshot called', invoiceData)
    // set up the page depending on what the status of the invoice is

    switch (invoiceData?.status) {
      case 'pending':
        setupPending();
        break;
      case 'success':
        setupSuccess();
        break;
      case 'failed':
        setupFailed();
        break;
      default:
        setupInvalid();
    }
  });

  //set the date
  // document.querySelector('.date').textContent = convertFromDateInt(invoiceData?.createdAt)?.shortDate ?? convertFromDateInt(new Date().getTime()).shortDate;

  if (!invoiceDoc.exists) { return };

  //set the parent name
  document.getElementById('parent-name').textContent = 'Hi ' + invoiceData.parentName;

  // get the customer data
  let customer = await firebase.firestore().collection('stripe_customers').doc(invoiceData.parent).get();
  customerData = customer.data();
}

function setupPayInvoice() {
  const invoice = document.querySelector('#pay-invoice-details');
  removeAllChildNodes(invoice);

  invoice.innerHTML = `
  <h5 class="heading">Description</h5>
  <h5 class="heading">Cost</h5>
  <h5 class="heading">Qty</h5>
  <h5 class="heading">Amount</h5>
  `

  const programDesc = document.createElement('div');
  programDesc.classList.add('description-wrapper')
  programDesc.innerHTML = `
    <p>${invoiceData.programName} Lessons</p>
    <p>The last two lessons will be charged as a nonrefundable deposit</p>
  `
  const programCost = document.createElement('p')
  programCost.textContent = '$' + invoiceData.sessionPrice.toFixed(2);
  const programQty = document.createElement('p')
  programQty.textContent = invoiceData.events.length;
  const programAmount = document.createElement('p')
  programAmount.textContent = '$' + invoiceData.programPrice.toFixed(2);
  invoice.append(programDesc, programCost, programQty, programAmount)

  let firstSessionFreeAmount = 0;
  if (invoiceData.isFirstSessionFree) {
    const discountDesc = document.createElement('div');
    discountDesc.classList.add('description-wrapper')
    discountDesc.innerHTML = `
      <p>First Lesson Free</p>
      <p>Discount</p>
    `
    const discountCost = document.createElement('p')
    discountCost.textContent = '-$' + invoiceData.sessionPrice.toFixed(2);
    const discountQty = document.createElement('p')
    discountQty.textContent = '1';
    const discountAmount = document.createElement('p')
    discountAmount.textContent = '-$' + invoiceData.sessionPrice.toFixed(2);
    firstSessionFreeAmount = invoiceData.sessionPrice;
    invoice.append(discountDesc, discountCost, discountQty, discountAmount)
  }

  const subtotalDescFiller = document.createElement('div');
  subtotalDescFiller.classList.add('begin-totals');
  const subtotalCostFiller = document.createElement('div');
  subtotalCostFiller.classList.add('begin-totals');
  const subTotalTitle = document.createElement('p');
  subTotalTitle.classList.add('begin-totals');
  subTotalTitle.textContent = 'Subtotal'
  const subTotalAmount = document.createElement('p');
  subTotalAmount.classList.add('begin-totals');
  subTotalAmount.textContent = '$' + (invoiceData.programPrice - firstSessionFreeAmount).toFixed(2);
  invoice.append(subtotalDescFiller, subtotalCostFiller, subTotalTitle, subTotalAmount)

  let percentageDiscountAmount = 0;
  if (invoiceData.percentageOff > 0) {
    const discountDescFiller = document.createElement('div');
    const discountCostFiller = document.createElement('div');
    const discountTitle = document.createElement('p')
    discountTitle.textContent = `${invoiceData.percentageOff}% off`;
    const discountAmount = document.createElement('p')
    discountAmount.textContent = '-$' + ((invoiceData.percentageOff / 100) * (invoiceData.programPrice - firstSessionFreeAmount)).toFixed(2);
    percentageDiscountAmount = ((invoiceData.percentageOff / 100) * (invoiceData.programPrice - firstSessionFreeAmount));
    invoice.append(discountDescFiller, discountCostFiller, discountTitle, discountAmount)
  }

  const percentageDescFiller = document.createElement('div');
  const percentageCostFiller = document.createElement('div');
  const percentageTitle = document.createElement('p');
  percentageTitle.textContent = '10% off'
  const percentageAmount = document.createElement('p');
  percentageAmount.textContent = '-$' + (0.1 * (invoiceData.programPrice - firstSessionFreeAmount)).toFixed(2);
  const oneTimeDiscountAmount = (0.1 * (invoiceData.programPrice - firstSessionFreeAmount));
  invoice.append(percentageDescFiller, percentageCostFiller, percentageTitle, percentageAmount)

  const totalDescFiller = document.createElement('div');
  const totalCostFiller = document.createElement('div');
  const totalTitle = document.createElement('p');
  totalTitle.textContent = 'Total'
  const totalAmount = document.createElement('p');
  totalAmount.textContent = '$' + (invoiceData.programPrice - oneTimeDiscountAmount - percentageDiscountAmount - firstSessionFreeAmount).toFixed(2);
  invoice.append(totalDescFiller, totalCostFiller, totalTitle, totalAmount)

  const amountDueDescFiller = document.createElement('div');
  amountDueDescFiller.classList.add('begin-totals');
  const amountDueFiller = document.createElement('div');
  amountDueFiller.classList.add('begin-totals');
  const amountDueTitle = document.createElement('p');
  amountDueTitle.classList.add('begin-totals');
  amountDueTitle.textContent = 'Amount Due'
  const amountDueAmount = document.createElement('p');
  amountDueAmount.classList.add('begin-totals');
  amountDueAmount.textContent = '$' + (invoiceData.programPrice - oneTimeDiscountAmount - percentageDiscountAmount - firstSessionFreeAmount).toFixed(2);
  invoice.append(amountDueDescFiller, amountDueFiller, amountDueTitle, amountDueAmount)
}

function setupSaveInvoice() {
  const invoice = document.querySelector('#save-invoice-details');
  removeAllChildNodes(invoice);

  invoice.innerHTML = `
  <h5 class="heading">Description</h5>
  <h5 class="heading">Cost</h5>
  <h5 class="heading">Qty</h5>
  <h5 class="heading">Amount</h5>
  `

  const programDesc = document.createElement('div');
  programDesc.classList.add('description-wrapper')
  programDesc.innerHTML = `
    <p>${invoiceData.programName} Lessons</p>
    <p>The last two lessons will be charged as a nonrefundable deposit</p>
  `
  const programCost = document.createElement('p')
  programCost.textContent = '$' + invoiceData.sessionPrice.toFixed(2);
  const programQty = document.createElement('p')
  programQty.textContent = invoiceData.events.length;
  const programAmount = document.createElement('p')
  programAmount.textContent = '$' + invoiceData.programPrice.toFixed(2);
  invoice.append(programDesc, programCost, programQty, programAmount)

  let firstSessionFreeAmount = 0;
  if (invoiceData.isFirstSessionFree) {
    const discountDesc = document.createElement('div');
    discountDesc.classList.add('description-wrapper')
    discountDesc.innerHTML = `
      <p>First Lesson Free</p>
      <p>Discount</p>
    `
    const discountCost = document.createElement('p')
    discountCost.textContent = '-$' + invoiceData.sessionPrice.toFixed(2);
    const discountQty = document.createElement('p')
    discountQty.textContent = '1';
    const discountAmount = document.createElement('p')
    discountAmount.textContent = '-$' + invoiceData.sessionPrice.toFixed(2);
    firstSessionFreeAmount = invoiceData.sessionPrice;
    invoice.append(discountDesc, discountCost, discountQty, discountAmount)
  }

  const subtotalDescFiller = document.createElement('div');
  subtotalDescFiller.classList.add('begin-totals');
  const subtotalCostFiller = document.createElement('div');
  subtotalCostFiller.classList.add('begin-totals');
  const subTotalTitle = document.createElement('p');
  subTotalTitle.classList.add('begin-totals');
  subTotalTitle.textContent = 'Subtotal'
  const subTotalAmount = document.createElement('p');
  subTotalAmount.classList.add('begin-totals');
  subTotalAmount.textContent = '$' + (invoiceData.programPrice - firstSessionFreeAmount).toFixed(2);
  invoice.append(subtotalDescFiller, subtotalCostFiller, subTotalTitle, subTotalAmount)

  let percentageDiscountAmount = 0;
  if (invoiceData.percentageOff > 0) {
    const discountDescFiller = document.createElement('div');
    const discountCostFiller = document.createElement('div');
    const discountTitle = document.createElement('p')
    discountTitle.textContent = `${invoiceData.percentageOff}% off`;
    const discountAmount = document.createElement('p')
    discountAmount.textContent = '-$' + ((invoiceData.percentageOff / 100) * (invoiceData.programPrice - firstSessionFreeAmount)).toFixed(2);
    percentageDiscountAmount = ((invoiceData.percentageOff / 100) * (invoiceData.programPrice - firstSessionFreeAmount));
    invoice.append(discountDescFiller, discountCostFiller, discountTitle, discountAmount)
  }

  const totalDescFiller = document.createElement('div');
  const totalCostFiller = document.createElement('div');
  const totalTitle = document.createElement('div');
  totalTitle.classList.add('description-wrapper')
  totalTitle.innerHTML = `
    <p>Total</p>
    <p>Amount due over the course of the program</p>
  `
  const totalAmount = document.createElement('p');
  totalAmount.textContent = '$' + (invoiceData.programPrice - firstSessionFreeAmount - percentageDiscountAmount).toFixed(2);
  invoice.append(totalDescFiller, totalCostFiller, totalTitle, totalAmount)

  const amountDueDescFiller = document.createElement('div');
  amountDueDescFiller.classList.add('begin-totals');
  const amountDueFiller = document.createElement('div');
  amountDueFiller.classList.add('begin-totals');
  const amountDueTitle = document.createElement('div');
  amountDueTitle.classList.add('begin-totals', 'description-wrapper')
  amountDueTitle.innerHTML = `
    <p>Amount Due</p>
    <p>Amount due today (nonrefundable deposit)</p>
  `
  const amountDueAmount = document.createElement('p');
  amountDueAmount.classList.add('begin-totals');
  amountDueAmount.textContent = '$' + ((invoiceData.events.length > 1 ? 2 : 1) * invoiceData.sessionPrice * (100 - (invoiceData.percentageOff ?? 0)) / 100).toFixed(2);
  invoice.append(amountDueDescFiller, amountDueFiller, amountDueTitle, amountDueAmount)
}
 

function setupPending() {
  // set up each invoice details
  setupPayInvoice();
  setupSaveInvoice();

  document.querySelector('#welcome-message').textContent = `We're just one step away from starting your ACT program. Just a reminder, this is for the ${invoiceData.programName} program and will be ${invoiceData.programLength} weeks long.`
  document.querySelector('#expiration-message').textContent = `This invoice will expire at 11:55 pm MDT on ${convertFromDateInt(invoiceData.expiration).dayAndDate}.
  A payment must be received before this time or all lessons for this program will be removed from our schedule.`
  document.querySelector('.payments').style.display = 'block';
}

function setupSuccess() {
  document.querySelector('#welcome-message').textContent = "We're all set! We can't wait to see you for your program."
  document.querySelector('#expiration-message').textContent = '';
  document.querySelector('.payments').style.display = 'none';
}

function setupFailed() {
  document.querySelector('#welcome-message').textContent = "We weren't able to receive your payemnt for this program before this invoice expired. We have removed the corresponding lessons from the schedule."
  document.querySelector('#expiration-message').textContent = '';
  document.querySelector('.payments').style.display = 'none';
}

function setupInvalid() {
  document.querySelector('#welcome-message').textContent = "We're having troubles retrieving this invoice. Double check the url to make sure it is correct. If you continue to recieve this message please contact us."
  document.querySelector('#expiration-message').textContent = '';
  document.querySelector('.payments').style.display = 'none';
}

 
 /**
  * Event listeners
  */
 
 // Create payment form
document
.querySelector('.pay')
.addEventListener('click', async (event) => {
  startWorking(event);

  const cardholderName = document.querySelector('#cardholderName').value;
  const firstSessionFreeAmount = (invoiceData.isFirstSessionFree ? invoiceData.sessionPrice : 0);
  const percentageDiscountAmount = (invoiceData.percentageOff / 100) * (invoiceData.programPrice - firstSessionFreeAmount);
  const oneTimeDiscountAmount = 0.1 * (invoiceData.programPrice - firstSessionFreeAmount);
  const amount = invoiceData.programPrice - firstSessionFreeAmount - percentageDiscountAmount - oneTimeDiscountAmount;
  const depositAmount = (2 * invoiceData.sessionPrice * (90 - invoiceData.percentageOff) / 100);
  const currency = 'usd';
  const agreements = document.querySelectorAll('.agreements > input')

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
  if (!confirm(`By pressing ok you are agreeing to pay the full amount of ${formatAmount(formatAmountForStripe(amount, currency), currency)}. You also understand that ${formatAmount(formatAmountForStripe(depositAmount, currency), currency)} will be counted towards a nonrefundable deposit.`)) {
    handleError('', event);
    return;
  }

  //charge full amount
  try {
    await chargeCard(amount, currency, 'one-time', cardholderName, event, depositAmount);
  }
  catch (error) {
    handleError(error.message, event);
    return;
  }
});

//save the new card
document
.querySelector('.save-card')
.addEventListener('click', async (event) => {
  startWorking(event);

  const cardholderName = document.getElementById('cardholderName').value;
  const amount = (2 * invoiceData.sessionPrice * (100 - invoiceData.percentageOff) / 100);
  const depositAmount = amount;
  const currency = 'usd';
  const agreements = document.querySelectorAll('.agreements > input')

  //check cardholder
  if (!cardholderName) {
    handleError('Please add a cardholder name.', event);
    return;
  }

  // check agreements
  for (let i = 0; i < agreements.length; i++) {
    if (!agreements[i].checked) {
      handleError('Please agree to all of the terms before continuing', event);
      return;
    }
  }

  // confirm
  if (!confirm(`By pressing ok you are agreeing to pay now an amount of ${formatAmount(formatAmountForStripe(amount, currency), currency)} which is the nonrefundable deposit. You also allow Lyrn to save this card and charge it the morning before your lessons for the price of the respective lesson.`)) {
    handleError('', event);
    return;
  }

  // save the card and charge it
  try {
    await chargeCard(amount, currency, 'recurring', cardholderName, event, depositAmount, true);
  }
  catch (error) {
    handleError(error.message, event);
    return;
  }
});

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

async function chargeCard(amount, currency, paymentType, cardholderName, event, depositAmount, isSaveCard = false) {
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
    act_invoice: queryStrings().invoice,
    paymentType
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
          if (isSaveCard) {
            await saveCard(cardholderName);
          }
          await setDepositCharge(depositAmount, currency);
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

  await firebase
  .firestore()
  .collection('stripe_customers')
  .doc(invoiceData.parent)
  .collection('payment_methods')
  .add({
    id: setupIntent.payment_method,
  });
}

async function setDepositCharge(amount, currency) {
  // we have to charge the parent's account the amount of the deposit so that that those lessons can be set to $0 (nonrefundable)
  await firebase
  .firestore()
  .collection('stripe_customers')
  .doc(invoiceData.parent)
  .collection('charges')
  .add({
    amount: formatAmountForStripe(amount, currency),
    created: new Date().getTime(),
    currency: currency,
    title: 'ACT program deposit'
  });
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


