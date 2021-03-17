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

 exports.customClaims = functions.https.onRequest((request, response) => {
    let uids = ["1oqg4zO5YOMoqupNlxTBoGV4BQQ2", "3qKwe1RmUlOuL7gfczocfHyTwDN2", "7z7IkOMVUzO4ueNYhZXxX6gbwK92",
    "9QF3yxJ9vqS8KnTnn96WRnGp5mF2", "BO6nX3pOPERySKCEcCMRnHvsA543", "BR3RYuXcYsNoeKrUJOK1Irn9F6s1", "PAOt8l7wigZVqq73Eco8VItpoAy1",
    "XXIMmxLYnFcQDk8LX7RlpyF7TVm2", "ZdHcRGobc0TcHcEKr9OXsHlmQVY2", "diZKKBSVKrZJCv9B4ZMbQi87NRa2", "fAeABLKeq9PxOMBM25txvWsF52l1",
    "rfYiEWEul8ZbA1N6s7aL9MJ73Nz1", "ttHoUfUgBtVb5dNuKl6GNRI30Cm1"]
  
  for (let i = 0; i < uids.length; i++) {
    admin.auth().setCustomUserClaims(uids[i], {role: "student"})
    .then(()=> {
      console.log("student set!")
    })
    .catch((error) => {
      console.log(error);
    });
  }
 });

 exports.customClaimsTest = functions.https.onRequest((request, response) => {
    admin
    .auth()
    .getUserByEmail('matthew15243@gmail.com')
    .then((user) => {
      // Confirm user is verified.
        // Add custom claims for additional privileges.
        // This will be picked up by the user on token refresh or next sign in on new device.
        admin.auth().setCustomUserClaims(user.uid, {
            role: "dev",
        })
        .then(() => {
            console.log(user.customClaims);
            response.send("User has been given role");
        })
        .catch((error) => {
            console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
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