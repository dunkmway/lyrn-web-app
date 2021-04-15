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


 //don't let this request go public becuase it could really mess things up!!!
 exports.setCustomClaimsRequest = functions.https.onRequest((request, response) => {
    admin
    .auth()
    .getUserByEmail(request.query.email)
    .then((user) => {
      // Confirm user is verified.
        // Add custom claims for additional privileges.
        // This will be picked up by the user on token refresh or next sign in on new device.
        admin.auth().setCustomUserClaims(user.uid, {
            role: request.query.role
        })
        .then(() => {
            console.log(user.customClaims);
            response.send("User " + request.query.email + " has been given role " + request.query.role);
        })
        .catch((error) => {
            console.log(error);
            response.send(error);
        });
    })
    .catch((error) => {
      console.log(error);
      response.send(error);
    });
 });

 exports.addUser = functions.https.onCall((data, context) => {
    const promise = new Promise((resolve, reject) => {
        if (context.auth) {
            admin.auth().getUserByEmail(data.email)
            .then((userRecord) => {
                let result = {
                    user: userRecord,
                    newUser: false
                };
                resolve(result);
                //  reject(new functions.https.HttpsError("unknown", "User already exists"));
            })
            .catch((error) => {
                if (error.code == "auth/user-not-found") {
                    admin.auth().createUser({
                         email: data.email,
                         password: data.password
                    })
                    .then((userRecord) => {  
                        admin.auth().setCustomUserClaims(userRecord.uid, {role: data.role})
                        .then(() => {
                            let result = {
                                user: userRecord,
                                newUser: true
                            };
                            resolve(result);
                        })
                        .catch((error) => {
                            reject(new functions.https.HttpsError(error.code, error.message, error.details));
                        });
                    })
                    .catch((error) => {
                        reject(new functions.https.HttpsError(error.code, error.message, error.details));
                    });
                }
                else {
                reject(new functions.https.HttpsError(error.code, error.message, error.details));
                }
            });
        }
        else {
            reject(new functions.https.HttpsError("unauthenticated", "You messed up big time... go fix it"));
        }
    });
    return promise;
});