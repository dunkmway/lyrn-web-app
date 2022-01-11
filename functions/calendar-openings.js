const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.addEventToOpenings = functions.firestore
.document('/Events/{eventID}')
.onCreate(async (snap, context) => {
  const eventData = snap.data();

  let batch = admin.firestore().batch();
  await batchAddEventOpening(eventData.location ,eventData.start, eventData.end, eventData.staff, batch)
  await batch.commit()
  return;
})

exports.addAvailabilityToOpenings = functions.firestore
.document('/Availabilities/{availabilityID}')
.onCreate(async (snap, context) => {
  const availData = snap.data();

  let batch = admin.firestore().batch();
  await batchAddAvailabilityOpening(availData.location ,availData.start, availData.end, availData.staff, batch)
  await batch.commit()
  return;
})

exports.updateEventToOpenings = functions.firestore
.document('/Events/{eventID}')
.onUpdate(async (change, context) => {
  const oldEventData = change.before.data();
  const newEventData = change.after.data();

  // only make a change if the start, end, or tutor changed
  if (
    oldEventData.start == newEventData.start &&
    oldEventData.end == newEventData.end &&
    compareArrays(oldEventData.staff, newEventData.staff)
  ) {return}

  let removeBatch = admin.firestore().batch();
  await batchRemoveEventOpening(oldEventData.location, oldEventData.start, oldEventData.end, oldEventData.staff, removeBatch);
  await removeBatch.commit();

  let addBatch = admin.firestore().batch();
  await batchAddEventOpening( newEventData.location, newEventData.start, newEventData.end, newEventData.staff, addBatch);
  await addBatch.commit();
  
  return;
})

exports.updateAvailabilityToOpenings = functions.firestore
.document('/Availabilities/{availabilityID}')
.onUpdate(async (change, context) => {
  const oldAvailData = change.before.data();
  const newAvailData = change.after.data();

  // only make a change if the start, end, or tutor changed
  if (
    oldAvailData.start == newAvailData.start &&
    oldAvailData.end == newAvailData.end &&
    compareArrays(oldAvailData.staff, newAvailData.staff)
  ) {return}

  let removeBatch = admin.firestore().batch();
  await batchRemoveAvailabilityOpening(oldAvailData.location, oldAvailData.start, oldAvailData.end, oldAvailData.staff, removeBatch)
  await removeBatch.commit()

  let addBatch = admin.firestore().batch();
  await batchAddAvailabilityOpening(newAvailData.location, newAvailData.start, newAvailData.end, newAvailData.staff, addBatch)
  await addBatch.commit();
  return;
})

exports.deleteEventToOpenings = functions.firestore
.document('/Events/{eventID}')
.onDelete(async (snap, context) => {
  const eventData = snap.data();

  let batch = admin.firestore().batch();
  await batchRemoveEventOpening(eventData.location ,eventData.start, eventData.end, eventData.staff, batch)
  await batch.commit()
  return;
})

exports.deleteAvailabilityToOpenings = functions.firestore
.document('/Availabilities/{availabilityID}')
.onDelete(async (snap, context) => {
  const availData = snap.data();

  let batch = admin.firestore().batch();
  await batchRemoveAvailabilityOpening(availData.location ,availData.start, availData.end, availData.staff, batch)
  await batch.commit()
  return;
})

/**
 * Given an event's details, add opening info to the Calendar Openings collection
 * @param {Number} start milliseconds that the event starts at
 * @param {Number} end milliseconds that the event ends at
 * @param {String[]} staff array of strings of the UIDs of the tutors for the event
 * @param {FirebaseFirestore.WriteBatch} batch the firebase batch that will accept the batch write operation
 * @returns returns a promise after the batch operations have successfully been added
 */
async function batchAddEventOpening(location, start, end, staff, batch) {
  let dates = {};
  let tempStart = new Date(start).getTime();

  // get the intervals and the dates they are a part of
  while (tempStart < end) {
    const date = new Date(tempStart).setUTCHours(0,0,0,0);
    if (!dates[date]) {dates[date] = {}};
    if (staff) {
      dates[date][tempStart] = staff;
    }
    else {
      dates[date][tempStart] = ['pendingTutor'];
    }
    tempStart = new Date(tempStart).setMinutes(new Date(tempStart).getMinutes() + 30);
  }

  for (const date in dates) {
    //see if the totals doc that we want to update exists
    const totalRef = admin.firestore().collection('Locations').doc(location).collection('Calendar-Openings').doc(date.toString());
    const totalDoc = await totalRef.get();
    if (totalDoc.exists && totalDoc.data().events) {
      let totalData = totalDoc.data();
      for (const interval in dates[date]) {
        totalData.events[interval] = totalData.events[interval] ? dates[date][interval].concat(totalData.events[interval]) : dates[date][interval];
      }
     batch.update(totalRef, {
        events: totalData.events
      })
    }
    else if (totalDoc.exists) {
      let totalData = totalDoc.data();
      totalData.events = {};
      for (const interval in dates[date]) {
        totalData.events[interval] = totalData.events[interval] ? dates[date][interval].concat(totalData.events[interval]) : dates[date][interval];
      }
     batch.update(totalRef, {
        events: totalData.events
      })
    }
    else {
      batch.set(totalRef, {
        events: dates[date]
      })
    }
  }
  return;
}

/**
 * Given an event's details, remove opening info to the Calendar Openings collection
 * @param {Number} start milliseconds that the event starts at
 * @param {Number} end milliseconds that the event ends at
 * @param {String[]} staff array of strings of the UIDs of the tutors for the event
 * @param {FirebaseFirestore.WriteBatch} batch the firebase batch that will accept the batch write operation
 * @returns returns a promise after the batch operations have successfully been added
 */
async function batchRemoveEventOpening(location, start, end, staff, batch) {
  let dates = {};
  let tempStart = new Date(start).getTime();

  // get the intervals and the dates they are a part of
  while (tempStart < end) {
    const date = new Date(tempStart).setUTCHours(0,0,0,0);
    if (!dates[date]) {dates[date] = {}};
    if (staff) {
      dates[date][tempStart] = staff;
    }
    else {
      dates[date][tempStart] = ['pendingTutor'];
    }
    tempStart = new Date(tempStart).setMinutes(new Date(tempStart).getMinutes() + 30);
  }

  for (const date in dates) {
    const totalRef = admin.firestore().collection('Locations').doc(location).collection('Calendar-Openings').doc(date.toString());
    const totalDoc = await totalRef.get();
    let totalData = totalDoc.data();
    for (const interval in dates[date]) {
      dates[date][interval].forEach(tutor => {
        const tutorIndex = totalData.events[interval].indexOf(tutor);
        if (tutorIndex != -1) {
          totalData.events[interval].splice(tutorIndex, 1);
        }
      })
    }
    batch.update(totalRef, {
      events: totalData.events
    })
  }

  return;
}

/**
 * Given an availabilty's details, add opening info to the Calendar Openings collection
 * @param {Number} start milliseconds that the availabilty starts at
 * @param {Number} end milliseconds that the availabilty ends at
 * @param {String} staff array of strings of the UIDs of the tutor for the availabilty
 * @param {FirebaseFirestore.WriteBatch} batch the firebase batch that will accept the batch write operation
 * @returns returns a promise after the batch operations have successfully been add
 */
async function batchAddAvailabilityOpening(location, start, end, staff, batch) {
  let dates = {};
  let tempStart = new Date(start).getTime();

  // get the intervals and the dates they are a part of
  while (tempStart < end) {
    const date = new Date(tempStart).setUTCHours(0,0,0,0);
    if (!dates[date]) {dates[date] = {}};
    dates[date][tempStart] = [staff];
    tempStart = new Date(tempStart).setMinutes(new Date(tempStart).getMinutes() + 30);
  }

  for (const date in dates) {
    //see if the totals doc that we want to update exists
    const totalRef = admin.firestore().collection('Locations').doc(location).collection('Calendar-Openings').doc(date.toString());
    const totalDoc = await totalRef.get();
    if (totalDoc.exists && totalDoc.data().availabilities) {
      let totalData = totalDoc.data();
      for (const interval in dates[date]) {
        totalData.availabilities[interval] = totalData.availabilities[interval] ? dates[date][interval].concat(totalData.availabilities[interval]) : dates[date][interval];
      }
     batch.update(totalRef, {
        availabilities: totalData.availabilities
      })
    }
    else if (totalDoc.exists) {
      let totalData = totalDoc.data();
      totalData.availabilities = {};
      for (const interval in dates[date]) {
        totalData.availabilities[interval] = totalData.availabilities[interval] ? dates[date][interval].concat(totalData.availabilities[interval]) : dates[date][interval];
      }
     batch.update(totalRef, {
        availabilities: totalData.availabilities
      })
    }
    else {
      batch.set(totalRef, {
        availabilities: dates[date]
      })
    }
  }

  return;
}

/**
 * Given an availabilty's details, remove opening info to the Calendar Openings collection
 * @param {Number} start milliseconds that the availabilty starts at
 * @param {Number} end milliseconds that the availabilty ends at
 * @param {String} staff array of strings of the UIDs of the tutor for the availabilty
 * @param {FirebaseFirestore.WriteBatch} batch the firebase batch that will accept the batch write operation
 * @returns returns a promise after the batch operations have successfully been add
 */
async function batchRemoveAvailabilityOpening(location, start, end, staff, batch) {
  let dates = {};
  let tempStart = new Date(start).getTime();

  // get the intervals and the dates they are a part of
  while (tempStart < end) {
    const date = new Date(tempStart).setUTCHours(0,0,0,0);
    if (!dates[date]) {dates[date] = {}};
    dates[date][tempStart] = [staff];
    tempStart = new Date(tempStart).setMinutes(new Date(tempStart).getMinutes() + 30);
  }

  for (const date in dates) {
    const totalRef = admin.firestore().collection('Locations').doc(location).collection('Calendar-Openings').doc(date.toString());
    const totalDoc = await totalRef.get();
    let totalData = totalDoc.data();
    for (const interval in dates[date]) {
      dates[date][interval].forEach(tutor => {
        const tutorIndex = totalData.availabilities[interval].indexOf(tutor);
        if (tutorIndex != -1) {
          totalData.availabilities[interval].splice(tutorIndex, 1);
        }
      })
    }
    batch.update(totalRef, {
      availabilities: totalData.availabilities
    })
  }

  return;
}

function compareArrays(array1, array2) {
  if (array1.length != array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] != array2[i]) {
      return false
    }
  }

  return true;
}