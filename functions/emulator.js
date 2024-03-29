const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require('fs');

const DEV_LOG_PATH = './dev.log'
const FIRESTORE_EMULATOR_JSON_PATH = './firestore-emulator.json';
const AUTH_EMULATOR_JSON_PATH = './auth-emulator.json';

const DEFAULT_PASSWORD = 'abc123';

async function main() {
  log(`\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\nEmulator resynced`);
  await setupAuth();
  await setupFirestore();
}

/**
 * log to firestore while in development
 * @param {string} msg mesage to be logged
 */
function log(msg) {
  if (typeof msg === "object") msg = JSON.stringify(msg, null, 2)
  let stream = fs.createWriteStream(DEV_LOG_PATH, {flags:'a'});
  stream.write(`${msg}: ${new Date()}\n`);
  stream.end();
}

async function setupFirestore() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    log('Firestore emulator running. Initializing firestore data');
    await firestoreDataParser();
  }
}

async function setupAuth() {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    log('Auth emulator running. Initializing auth data');
    await authDataParser();
  }
}

async function firestoreDataParser() {
  const data = require(FIRESTORE_EMULATOR_JSON_PATH);
  if (!data) {
    log('No Firestore data found')
    return;
  }

  const isLoadedDoc = await admin.firestore().collection('~isLoaded').doc('true').get();
  if (isLoadedDoc.exists) {
    log('Firestore already initialized')
    return;
  }

  await collectionParser(data);
  await admin.firestore().collection('~isLoaded').doc('true').set({});
}

/**
 * Recurrsive fucntion that will take the firestore JSON object and will setup the emulator
 * @param {Object} data JSON object
 * @param {FirestoreReference} path reference to be prepended before saving new collection
 * @returns {Promise} Promise that resolves when all of the data has been saved
 */
function collectionParser(data, path = admin.firestore()) {
  const collections = data.collections;

  return Promise.all(collections.map(collection => {
    const collectionID = collection.id;
    const docs = collection.docs;
    
    return Promise.all(docs.map(async (doc, docIndex) => {
      const docID = doc.id;
      const docData = doc.data;

      let ref;
      if (docID) {
        ref = path.collection(collectionID).doc(docID)
      }
      else {
        ref = path.collection(collectionID).doc()
        updateFileDocID(ref, docIndex)
      }

      const existingDoc = await ref.get()
      if (existingDoc.exists) {
        let changedData = {};
        for (const key in docData) {
          if (existingDoc.data()[key] !== docData[key]) {
            changedData[key] = docData[key]
          }
        }
        if (Object.keys(changedData).length > 0) {
          await ref.update(changedData)
        }
      }
      else {
        await ref.set(docData)
      }

      if (doc.collections) {
        return collectionParser(doc, ref);
      }
    }))
  }))
}

function updateFileDocID(ref, finalDocIndex) {
  const data = require(FIRESTORE_EMULATOR_JSON_PATH);
  const path = ref._path.segments;

  let currentDataPath = data;

  path.forEach((segment, index) => {
    if (index % 2 === 0) {
      // collection segment
      const collectionIndex = currentDataPath.collections.findIndex(collection => collection.id === segment)
      currentDataPath = currentDataPath.collections[collectionIndex]
    }
    else {
      // doc segment
      if (index === path.length - 1) {
        // last index, should be the doc we are interested in
        currentDataPath.docs[finalDocIndex].id = segment;
      }
      else {
        const docIndex = currentDataPath.docs.findIndex(doc => doc.id === segment)
        currentDataPath = currentDataPath.docs[docIndex] 
      }
    }
  })

  // update the file with replaced id
  return fs.writeFileSync(FIRESTORE_EMULATOR_JSON_PATH, JSON.stringify(data, null, 2));
}

async function authDataParser() {
  const data = require(AUTH_EMULATOR_JSON_PATH);
  if (!data) {
    log('No Auth data found')
    return;
  }

  const users = data.users;

  return Promise.all(users.map(async userData => {
    try {
      const userRecord = await (
        userData.uid ?
        admin.auth().createUser({
            uid: userData.uid,
            email: userData.email,
            password: userData.password ?? DEFAULT_PASSWORD,
            displayName: userData.firstName + ' ' + userData.lastName
        }) :
        admin.auth().createUser({
            email: userData.email,
            password: userData.password ?? DEFAULT_PASSWORD,
            displayName: userData.firstName + ' ' + userData.lastName
        })
      )
  
      await admin.auth().setCustomUserClaims(userRecord.uid, { role: userData.role })
  
      await admin.firestore().collection('Users').doc(userRecord.uid).set({
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        location: userData.location,
        email: userData.email,
        phoneNumber: userData.phoneNumber ?? '',
        wage: userData.wage ?? 0,
        qualifications: userData.qualifications ?? [],
        bio: userData.bio ?? '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    catch (error) {
      log(`Auth error for user ${userData.email} - ${error.message}`);
    }
  }))
}

exports.main = main;