const db = firebase.firestore();
const CURRENT_STUDENT_UID = queryStrings().student;

let student_doc = null;
let parent_doc = null;
let location_doc = null;
let current_events = [];
let current_event_filter = {
  student: null,
  tutor: null,
  type: null,
  subtype: null
}

const eventDebounce = debounce(() => orderEvents(), 500);

test();

async function test() {
  student_doc = await getUserDoc(CURRENT_STUDENT_UID);
  if (student_doc.data().parents[0]) {
    parent_doc = await getUserDoc(student_doc.data().parents[0]);
    renderHeader(
      student_doc.data().firstName + ' ' + student_doc.data().lastName,
      parent_doc.data().firstName + ' ' + parent_doc.data().lastName
    )
  }
  else {
    renderHeader(student_doc.data().firstName + ' ' + student_doc.data().lastName)
  }
  setUpLinks();
  location_doc = await firebase.firestore().collection('Locations').doc('WIZWBumUoo7Ywkc3pl2G').get();

  listenToAttendee(CURRENT_STUDENT_UID);
}

function getUserDoc(userUID) {
  return db.collection('Users').doc(userUID).get();
}

function setUpLinks() {
  const links = document.querySelectorAll('nav .links > a');
  links.forEach(link => {
    if (link.dataset.query) {
      const queries = link.dataset.query.split(',');
      if (queries.length > 0) {
        queries.forEach((query, index) => {
          const queryUID = query === 'student' ? student_doc.id : (query === 'parent') ? parent_doc.id : '';
          if (index === 0) {
            link.href += `?${query}=${queryUID}`
          }
          else {
            link.href += `&${query}=${queryUID}`
          }
        })
      }
    }
  })
}

function renderHeader(studentName, parentName = 'No Parent', balance = 0) {
  document.getElementById('studentName').textContent = studentName;
  document.getElementById('parentName').textContent = parentName;
  document.getElementById('balanceAmount').textContent = formatAmount(balance, 'usd');
  document.getElementById('balanceAmount').classList.add(balance == 0 ? 'zero' : (balance < 0 ? 'negative' : 'positive'))
}

function formatAmount(amount, currency) {
  amount = zeroDecimalCurrency(amount, currency)
    ? amount
    : amount.toFixed(2);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

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

// in order to get the events that this student is attending we have to first listen to a
// collection group query where the student is an attendee
// we then can get the event doc from this attendee doc and listen to the event

function listenToAttendee(studentUID) {
  return db
  .collectionGroup('Attendees')
  .where('student', '==', studentUID)
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        // add this attendee and corrseponding event to current_events
        current_events.push({
          attendeeDoc: change.doc,
          eventID: change.doc.ref.parent.parent.id,
          unsubscribeEvent: change.doc.ref.parent.parent.onSnapshot(eventSnapshotCallback)
        })
      }
      if (change.type === "modified") {
        // replace the data for this attendee in current_events
        const eventIndex = current_events.findIndex(event => event.attendeeDoc.id === change.doc.id);
        current_events[eventIndex].attendeeDoc = change.doc;

        // render the event
        renderEvent(current_events[eventIndex].attendeeDoc.id);
      }
      if (change.type === "removed") {
        // unsubscribe from the corresponding event listener and remove the event from current_events
        const eventIndex = current_events.findIndex(event => event.attendeeDoc.id === change.doc.id);
        current_events[eventIndex].unsubscribeEvent();
        removeEvent(current_events[eventIndex].attendeeDoc.id)
        current_events.splice(eventIndex, 1);
      }
  });
  })
}

function eventSnapshotCallback(doc) {
  if (doc.exists) {
    // find the event in current_events and replace the event doc
    const eventIndex = current_events.findIndex(event => event.eventID === doc.id);
    current_events[eventIndex].eventDoc = doc;

    // render the event
    renderEvent(current_events[eventIndex].attendeeDoc.id);
  }
  else {
    // the attendee docs for this event which has been deleted should be automatically deleted
    // we will just wait for the attendee doc to be updated in this case
  }
}

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function orderEvents() {
  console.log('ordering events');

  // sort current events and update the dom to match
  current_events.sort((a,b) => a.eventDoc.data().start - b.eventDoc.data().start);
  current_events.forEach(event => {
    const elem = document.querySelector(`.event[data-id="${event.attendeeDoc.id}"]`);
    document.getElementById('eventWrapper').appendChild(elem);
  })
}

async function renderEvent(attendeeID) {
  // get the event data
  const eventData = current_events.find(event => event.attendeeDoc.id === attendeeID);
  const tutorDocs = await Promise.all(eventData.eventDoc.data().staff.map(tutorUID => getUserDoc(tutorUID)));
  const tutorNames = tutorDocs.map(doc => doc.data().firstName + ' ' + doc.data().lastName);

  // check if the event element already exists
  if (document.querySelector(`.event[data-id="${attendeeID}"]`)) {
    // replace the innerhtml of the event
    const eventElem = document.querySelector(`.event[data-id="${attendeeID}"]`);
    eventElem.innerHTML = `
      <div class="summary"
        <h4 class="title">${convertLessonTypeReadable(eventData.eventDoc.data().type, eventData.eventDoc.data().subtype)}</h4>
        <h4 class="time">${convertFromDateInt(eventData.eventDoc.data().start).shortDateTime}</h4>
      </div>
      <div class="details">
        <div class="hidden">
        <h4 class="title">${convertLessonTypeReadable(eventData.eventDoc.data().type, eventData.eventDoc.data().subtype)}</h4>
          <p class="time">${convertFromDateInt(eventData.eventDoc.data().start).longReadable}</p>
          <p>${tutorNames.toString()}</p>
          <p>${formatAmount(eventData.attendeeDoc.data().price, 'usd')}</p>
        </div>
      </div>
    `
  }
  else {
    // we need to place the event at the end. another function will order it
    const eventElem = document.createElement('div');
    eventElem.classList.add('event');
    eventElem.setAttribute('data-id', eventData.attendeeDoc.id)
    eventElem.addEventListener('click', () => eventElem.classList.toggle('open'));
    eventElem.innerHTML = `
      <div class="summary">
        <h4 class="title">${convertLessonTypeReadable(eventData.eventDoc.data().type, eventData.eventDoc.data().subtype)}</h4>
        <h4 class="time">${convertFromDateInt(eventData.eventDoc.data().start).shortDateTime}</h4>
      </div>
      <div class="details">
        <div class="hidden">
          <h4 class="title">${convertLessonTypeReadable(eventData.eventDoc.data().type, eventData.eventDoc.data().subtype)}</h4>
          <p class="time">${convertFromDateInt(eventData.eventDoc.data().start).longReadable}</p>
          <p>${tutorNames.toString()}</p>
          <p>${formatAmount(eventData.attendeeDoc.data().price, 'usd')}</p>
        </div>
      </div>
    `
    const eventWrapper = document.getElementById('eventWrapper');
    eventWrapper.appendChild(eventElem);
  }

  eventDebounce();
}

function removeEvent(attendeeID) {
  // find the event and remove it
  document.querySelector(`.event[data-id="${attendeeID}"]`).remove();
}

function convertLessonTypeReadable(type, subtype = null) {
  // get the location's lesson types
  const lessonTypes = location_doc.data().lessonTypes;

  // find the type and subtype names
  const lessonType = lessonTypes.find(lesson => lesson.value == type);
  const lessonName = lessonType.name;
  const lessonSubname = subtype ? lessonType.subtypes.find(sublesson => sublesson.value == subtype).name : '';

  return lessonName + ' ' + lessonSubname;
}
