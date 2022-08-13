const functions = require("firebase-functions");
const admin = require("firebase-admin");

// exports.createdAndUpdatedHelper = functions.firestore
// .document('{colId}/{docId}')
// .onWrite(async (change, context) => {
//   // the collections you want to trigger
//   const setCols = [];

//   // if not one of the set columns
//   if (setCols.indexOf(context.params.colId) === -1) {
//     return null;
//   }

//   // simplify event types
//   const createDoc = change.after.exists && !change.before.exists;
//   const updateDoc = change.before.exists && change.after.exists;
//   const deleteDoc = change.before.exists && !change.after.exists;

//   if (deleteDoc) {
//     return null;
//   }
//   // simplify input data
//   const after = change.after.exists ? change.after.data() : null;
//   const before = change.before.exists ? change.before.data() : null;

//   // prevent update loops from triggers
//   const canUpdate = () => {
//     // if update trigger
//     if (before.updatedAt && after.updatedAt) {
//       if (after.updatedAt.seconds !== before.updatedAt.seconds) {
//         return false;
//       }
//     }
//     // if create trigger
//     if (!before.createdAt && after.createdAt) {
//       return false;
//     }
//     return true;
//   }

//   // add createdAt
//   if (createDoc) {
//     return change.after.ref.set({
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     }, { merge: true })
//     .catch((e) => {
//       console.log(e);
//       return false;
//     });
//   }
//   // add updatedAt
//   if (updateDoc && canUpdate()) {
//     return change.after.ref.set({
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     }, { merge: true })
//     .catch((e) => {
//       console.log(e);
//       return false;
//     });
//   }
//   return null;
// });