const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
 exports.helloWorld = functions.https.onRequest((request, response) => {
   functions.logger.info("Hello logs!", {structuredData: true});
   response.send("Hello from Firebase!");
 });

 exports.addUser = functions.https.onCall((data, context) =>
 {
     const promise = new Promise((resolve, reject) =>
     {
         if (context.auth)
         {
             admin.auth().getUserByEmail(data.email).then(() =>
             {
                 reject(new functions.https.HttpsError("unknown", "User already exists"));
             }).catch((error) =>
             {
                 if (error.code == "auth/user-not-found")
                 {
                     admin.auth().createUser(
                     {
                         email: data.email,
                         password: data.password
                     }).then((userRecord) =>
                     {
                         resolve(userRecord);
                     }).catch((error) =>
                     {
                         reject(new functions.https.HttpsError(error.code,
                            error.message, error.details));
                     });
                 }
                 else
                 {
                    reject(new functions.https.HttpsError(error.code,
                       error.message, error.details));
                 }
             })
         }
         else
         {
            reject(new functions.https.HttpsError("unauthenticated",
               "You messed up big time... go fix it"));
         }
     })
     return promise;
 });