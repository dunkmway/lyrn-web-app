const functions = require("firebase-functions");
const admin = require("firebase-admin");

// returns the list of UIDs for tutors that are qualified in the given array of qualifications and the array qualifications thay have that are applicable
exports.getQualifiedTutors = functions.https.onCall(async (data, context) => {

  // query for all tutors with this qualifcation
  const tutorSnapshot = await admin.firestore().collection('Users')
  .where('role', '==', 'tutor')
  .where('location', '==', data.location)
  .where('qualifications', 'array-contains-any', data.qualifications)
  .get()

  return tutorSnapshot.docs.map(doc => {
    return {
      id: doc.id,
      qualifications: doc.data().qualifications ? arrayIntersection(doc.data().qualifications, data.qualifications) : []
    }
  })

});

function arrayIntersection(array1, array2) {
  const newArray = [];

  // for efficiency start with the smallest array
  if (array1.length <= array2) { 
    for (let i = 0; i < array1.length; i++) {
      if (array2.includes(array1[i])) {
        newArray.push(array1[i]);
      }
    }
  }
  else {
    for (let i = 0; i < array2.length; i++) {
      if (array1.includes(array2[i])) {
        newArray.push(array2[i]);
      }
    }
  }

  return newArray;
}

// returns the list of UIDs for tutors that are blacklisted given a student uid
exports.getBlacklistedTutors = functions.https.onCall(async (data, context) => {

  // get the student doc
  if (!data.student) {
    return [];
  }
  const studentDoc = await admin.firestore().collection('Users').doc(data.student).get();
  return ( studentDoc.exists && studentDoc.data().blacklistTutors ) ? studentDoc.data().blacklistTutors : [];

});

function arrayIntersection(array1, array2) {
  const newArray = [];

  // for efficiency start with the smallest array
  if (array1.length <= array2) { 
    for (let i = 0; i < array1.length; i++) {
      if (array2.includes(array1[i])) {
        newArray.push(array1[i]);
      }
    }
  }
  else {
    for (let i = 0; i < array2.length; i++) {
      if (array1.includes(array2[i])) {
        newArray.push(array2[i]);
      }
    }
  }

  return newArray;
}