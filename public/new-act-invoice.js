const CURRENT_STUDENT = queryStrings().student;
const CURRENT_PARENT = queryStrings().parent;
let master_events = [];
let current_program = '';
let current_program_name = '';

async function initialSetup() {
  try {
    $('.ui.dropdown').dropdown();
  }
  catch (error) {
    console.error(error)
  }
}

async function programSelectedCallback(event) {
  const target = event.target;
  const value = target.value;
  const text = target.querySelector(`option[value="${value}"]`).textContent;
  current_program = value;
  current_program_name = text;

  document.getElementById('eventList').classList.add('loading', 'disabled')

  const eventDocs = await getAllFutureEventDocs(CURRENT_STUDENT);
  const eventData = eventDocs
  .map(doc => {
    return {
      ...doc.data(),
      id: doc.id
    }
  })
  .filter(data => data.type == value && data.start > new Date().getTime())
  .sort((a,b) => a.start - b.start);
  master_events = eventData;

  const texts = eventData.map(mapDataToText);
  const values = eventData.map(mapDataToValue)
  console.log(texts, values)
  addItemsToDropdown('eventList', texts, values)
  document.getElementById('eventList').classList.remove('loading', 'disabled')
}

function mapDataToText(data) {
  return data.title + 
  ' ' +
  convertFromDateInt(data.start).longReadable;
}

function mapDataToValue(data) {
  return data.id
}

async function getAllFutureEventDocs(studentUID) {
  try {
    const attendeeQuery = await firebase.firestore()
    .collectionGroup('Attendees')
    .where('student', '==', studentUID)
    .get();
    
    return await Promise.all(attendeeQuery.docs.map(doc => doc.ref.parent.parent.get()));
  }
  catch (error) {
    console.error(error)
    throw 'failed to retrieve future events'
  }
}

function addItemsToDropdown(dropdownID, itemTexts, itemValues) {
  // verify correct data
  if (itemTexts.length != itemValues.length) {
    console.error('the item array lengths do not match')
    return;
  }

  let values = {
    values: itemTexts.map((text, index) => {
      return {
        value: itemValues[index],
        text: text,
        name: text
      }
    })
  }

  $(`#${dropdownID}`).dropdown('setup menu', values);
}

async function submitInvoice() {
  document.querySelectorAll('button').forEach(button => button.disabled = true);
  const events = getDropdownValues('eventList');
  const percentageOff = Number(document.getElementById('percentageOff').value);
  const isFirstSessionFree = document.getElementById('firstFree').checked;

  if (events.length == 0) {
    alert('choose events first')
    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return
  }

  const eventData = master_events
  .filter(event => events.includes(event.id))
  .sort((a,b) => a.start - b.start);
  let pricesPerHour = [];
  let sessionLengths = [];

  await Promise.all(eventData.map(async (event) => {
    const attendeeQuery = await firebase.firestore().collection('Events').doc(event.id).collection('Attendees').where('student', '==', CURRENT_STUDENT).get();
    pricesPerHour.push(attendeeQuery.docs[0].data().price)
    sessionLengths.push((event.end - event.start) / 3600000);
  }))

  if (!verifySameValue(pricesPerHour) || !verifySameValue(sessionLengths)) {
    alert('the selected events do not have the same price nor length. we cannot generate an invoice for these events')
    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return
  }

  const [
    studentDoc,
    parentDoc
  ] = await Promise.all([
    firebase.firestore().collection('Users').doc(CURRENT_STUDENT).get(),
    firebase.firestore().collection('Users').doc(CURRENT_PARENT).get()
  ])

  const invoice = {
    createdAt: new Date().getTime(),
    events,
    expiration: new Date().setDate(new Date().getDate() + 2),
    isFirstSessionFree,
    parent: CURRENT_PARENT,
    parentName: parentDoc.data().firstName + ' ' + parentDoc.data().lastName,
    percentageOff,
    pricePerHour: pricesPerHour[0],
    program: current_program,
    programLength: Math.ceil((eventData[eventData.length - 1].end - eventData[0].start) / 604800000),
    programName: current_program_name,
    programPrice: pricesPerHour[0] * sessionLengths[0] * events.length,
    programStart: new Date(eventData[0].start),
    sessionLength: sessionLengths[0],
    sessionPrice: pricesPerHour[0] * sessionLengths[0],
    status: 'pending',
    student: CURRENT_STUDENT,
    studentName: studentDoc.data().firstName + ' ' + studentDoc.data().lastName,
  }

  console.log(invoice)
  const invoiceRef = firebase.firestore().collection('ACT-Invoices').doc(); 
  await invoiceRef.set(invoice);
  await sendInvoiceEmail(parentDoc.data().email, invoiceRef.id);

  Toastify({
    text: 'Invoice has been sent!'
  }).showToast();
  document.querySelectorAll('button').forEach(button => button.disabled = false);
}

async function submitConfirmation() {
  document.querySelectorAll('button').forEach(button => button.disabled = true);
  const events = getDropdownValues('eventList');

  if (events.length == 0) {
    alert('choose events first')
    document.querySelectorAll('button').forEach(button => button.disabled = false);
    return
  }

  const eventData = master_events
  .filter(event => events.includes(event.id))
  .sort((a,b) => a.start - b.start);

  const [
    studentDoc,
    parentDoc
  ] = await Promise.all([
    firebase.firestore().collection('Users').doc(CURRENT_STUDENT).get(),
    firebase.firestore().collection('Users').doc(CURRENT_PARENT).get()
  ])

  const confirmation = {
    studentName: studentDoc.data().firstName + ' ' + studentDoc.data().lastName,
    parentName: parentDoc.data().firstName + ' ' + parentDoc.data().lastName,
    events: eventData
  }

  await sendConfirmationEmail(parentDoc.data().email, confirmation);

  Toastify({
    text: 'Confirmation has been sent!'
  }).showToast();
  document.querySelectorAll('button').forEach(button => button.disabled = false);
}

function getDropdownValues(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let values = []
  inputs.forEach((input) => {
    values.push(input.dataset.value)
  })

  return values;
}

function getDropdownText(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let texts = []
  inputs.forEach((input) => {
    texts.push(input.textContent)
  })

  return texts;
}

function verifySameValue(array) {
  return new Set(array).size == 1;
}

async function sendInvoiceEmail(email, invoice) {
  let response = await firebase.functions().httpsCallable('act_sign_up-sendInvoiceEmail')({
    email,
    invoice
  });

  return response.data
}

async function sendConfirmationEmail(email, confirmation) {
  let response = await firebase.functions().httpsCallable('act_sign_up-sendConfirmationEmail')({
    email,
    confirmation
  });

  return response.data
}