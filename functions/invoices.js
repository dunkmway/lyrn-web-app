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
