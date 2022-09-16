const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

exports.checkPromo = functions.https.onCall(async (data, context) => {
  return await checkPromo(data.promoCode, data.invoice);
});

async function checkPromo(promoCode, invoice) {
  if (typeof promoCode !== 'string') return false;
  if (typeof invoice !== 'string') return false;

  // try to find the a promo with the given promo code
  const promoQuery = await admin.firestore()
  .collection('Promos')
  .where('code', '==', promoCode.toLowerCase())
  .get();

  if (!promoQuery.size === 0) return false;

  const promoDocs = promoQuery.docs;

  // filter out any promos that aren't currently running
  promoDocs
  .filter(doc => doc.data().start === null || doc.data().start.toDate().getTime() <= new Date().getTime())
  .filter(doc => doc.data().end === null || doc.data().end.toDate().getTime() <= new Date().getTime())
  .filter(doc => doc.data().uses < doc.data().maxUses)

  // get the invoice for comparison
  const invoiceDoc = await admin.firestore()
  .collection('Invoices').doc(invoice)
  .get();

  if (!invoiceDoc.exists) return false;

  const invoiceData = invoiceDoc.data();

  // find the promo that first matches the invoice type and schedule
  const selectedPromo = promoDocs.find(doc => {
    const promoData = doc.data()

    const sameType = promoData.type === null || promoData.type === invoiceData.type;
    const sameSchedule = promoData.hasSchedule === null || promoData.hasSchedule === (invoiceData.schedule.length !== 0);

    return sameType && sameSchedule;
  })

  // no match
  if (!selectedPromo) return false;

  // set the promo to the invoice
  await invoiceDoc.ref.update({ promo: selectedPromo.id });

  return true;

}

exports.invoiceUpdated = functions.firestore
.document('/Invoices/{invoiceID}')
.onUpdate(async (change, context) => {
  const before = change.before;
  const after = change.after;

  // handle payment processing
  if (after.data().status === 'processing') {
    // the payment_method should be passed in now
    if (!after.data().payment_method) {
      await after.ref.update({
        status: 'error',
        error: 'Error processing payment. Please try again.'
      })
      return;
    } else {
      // create the payment doc and let the stripe backend do it's thing
      // this invoice will be updated by stripe so we will handle it on another function invocation
      let promoData = {};
      if (after.data().promo) {
        const promoDoc = await admin.firestore().collection('Promos').doc(after.data().promo).get()
        promoData = promoDoc.data();
      }
      
      const amountDue = (after.data().initialPayment // amount passed in the invoice
      - (promoData?.absoluteAmount ?? 0)) // remove absolute promo discount
      * (100 - (promoData?.relativeAmount ?? 0)) / 100; // remove relative promo amount


      await admin
      .firestore()
      .collection('stripe_customers')
      .doc(after.data().parent)
      .collection('payments')
      .doc()
      .set({
        payment_method: after.data().payment_method,
        currency: 'usd',
        amount: amountDue,
        status: 'new',
        createdAt: new Date(),
        invoice: change.after.id
      });
      return
    }
  }

  // handle payment processed
  if (after.data().status === 'processed') {
    if (!after.data().payment) {
      return;
    }

    // if the invoice has a schedule and has a saved payment method
    if (after.data().schedule.length > 0 && after.data().savedPaymentMethod) {
      let promoData = {};
      if (after.data().promo) {
        const promoDoc = await admin.firestore().collection('Promos').doc(after.data().promo).get()
        promoData = promoDoc.data();
      }

      const paymentDoc = await admin
      .firestore()
      .collection('stripe_customers')
      .doc(after.data().parent)
      .collection('payments')
      .doc(after.data().payment)
      .get();

      // create the schedule subcollection
      const scheduleCollectionRef = after.ref.collection('Invoice_Schedule');

      // detemine the amount remaining to pay
      const schedule = after.data().schedule

      let promoAbsoluteAmount = 0;
      if (promoData && promoData.absoluteAmount) {
        promoAbsoluteAmount = -1 * promoData.absoluteAmount;
      }

      const subtotal = after.data().items.reduce((prev, curr) => prev + (curr.quantity * curr.price), 0) + promoAbsoluteAmount;

      let promoRelativeAmount = 0;
      if (promoData && promoData.relativeAmount) {
        promoRelativeAmount = -1 * subtotal * (promoData.relativeAmount / 100);
      }

      const total = subtotal + promoRelativeAmount;
      const amountDue = total - paymentDoc.data().amount_received;

      const scheduledPayments = splitIntEvenly(amountDue, schedule.length);

      await Promise.all(schedule.map((date, index) => {
        return scheduleCollectionRef.doc().set({
          due: date.toDate(),
          amount: scheduledPayments[index]
        })
      }))

      await after.ref.update({ status: 'succeeded' });
    }
  }

  return;
})

function splitIntEvenly(int, num) {
  const quotient = Math.floor(int/num);
  const remainder = int % num;

  return new Array(num).fill(quotient).map((value, index) => {
    if (index < remainder) {
      return value + 1
    } else {
      return value
    }
  })
}