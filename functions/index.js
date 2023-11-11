const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.home = require('./home');
exports.sign_in = require('./sign-in');
// exports.stripe = require('./stripe');
// exports.billing = require('./billing');
// exports.text_reminders = require('./text-reminders');
// exports.lesson_link = require('./lesson-link');
// exports.payment_link = require('./payment-link');
// exports.calendar_openings = require('./calendar-openings');
// exports.frontline = require('./frontline');
// exports.zoom = require('./zoom');
// exports.act_sign_up = require('./act-sign-up');
// exports.scheduled_emails = require('./scheduled-emails');
exports.test_taker = require('./test-taker');

// database collection triggers
// exports.events = require('./events');
exports.act_question_data = require('./act-question-data');

// exports.database_helpers = require('./database-helpers');
admin.initializeApp();

// run the emulator main if we are running the emulator
if (process.env.FUNCTIONS_EMULATOR) {
    const emulator = require('./emulator');
    emulator.main();
}

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

exports.getUserDisplayName = functions.https.onCall((data, context) => {
    const promise = new Promise((resolve, reject) => {
        admin.auth().getUser(data.uid)
            .then((userRecord) => {
                resolve(userRecord.displayName);
            })
            .catch((error) => {
                reject(new functions.https.HttpsError(error.code, error.message, error.details));
            });
    });
    return promise;
});

exports.getUserRole = functions.https.onCall((data, context) => {
    const promise = new Promise((resolve, reject) => {
        admin.auth().getUser(data.uid)
            .then((userRecord) => {
                resolve(userRecord.customClaims.role);
            })
            .catch((error) => {
                reject(new functions.https.HttpsError(error.code, error.message, error.details));
            });
    });
    return promise;
});

exports.addUser = functions.https.onCall(async (data, context) => {
    //only give acces to create users to secretaries, admins, and devs
    if (context.auth.token.role == 'admin' || context.auth.token.role == 'dev') {
        //get the user by their email
        try {
            //if we find them then they already exists
            //return the user record to the client and send back that this user is not new
            const userRecord = await admin.auth().getUserByEmail(data.email);
            return {
                user: userRecord,
                newUser: false
            };
        }
        catch (error) {
            //if we fail to get the user then we check if we failed to find the user or if there was an error
            if (error.code === 'auth/user-not-found') {
                //now we know that the user doesn't exist
                //split based on if a UID was provided
                try {
                    const userRecord = await (
                        data.uid ?                   //if the request included a UID
                        admin.auth().createUser({    //then create the user with the uid
                            uid: data.uid,
                            email: data.email,
                            password: data.password
                        }) :
                        admin.auth().createUser({    //else only use the email
                            email: data.email,
                            password: data.password
                        })
                    )
                    //once the userRecord is created set the custom claims
                    await admin.auth().setCustomUserClaims(userRecord.uid, { role: data.role })
                    //finally we are ready to respond back to the client
                    return {
                        user: userRecord,
                        newUser: true
                    };
                }
                catch (error) {
                    //failure creating the new user or setting their custom claims
                    throw new functions.https.HttpsError(error.code, error.message, error.details)
                }
            }
            else {
                //failure getting the initial user record
                throw new functions.https.HttpsError(error.code, error.message, error.details)
            }
        }
    }
    else {
        //permission denied
        throw new functions.https.HttpsError("permission-denied", "Yeah sorry... you can't do that :(")
    }
});

exports.addUserRole = functions.https.onCall((data, context) => {
    //this function will only allow for adding a student or parent role
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', "User must be authenticated");
    }
    else {
        if (data.role == 'student' || data.role == 'parent') {
            return admin.auth().setCustomUserClaims(context.auth.uid, {
                role: data.role
            })
        }
        else {
            throw new functions.https.HttpsError('permission-denied', "Role must be either student or parent");
        }
    }
});

exports.deleteUser = functions.https.onCall((data, context) => {
    if (context.auth.token.role == 'admin' || context.auth.token.role == 'dev') {
        throw new functions.https.HttpsError('permission-denied', "You aren't allowed to do that!!!");
    }
    else {
        return admin.auth().deleteUser(data.uid)
        .then(() => {
            return admin.firestore().collection('Users').doc(data.uid).delete()
        })
    }
});


exports.updateUserEmail = functions.https.onCall((data, context) => {
    return admin.auth().updateUser(data.uid, {
        email: data.email,
    })
        .then((userRecord) => {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log('Successfully updated user', userRecord.toJSON());
        })
        .catch((error) => {
            console.log('Error updating user:', error);
        });
});

exports.updateUserDisplayName = functions.https.onCall((data, context) => {
    return admin.auth().updateUser(data.uid, {
        displayName: data.displayName
    })
        .then((userRecord) => {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log('Successfully updated user', userRecord.toJSON());
        })
        .catch((error) => {
            console.log('Error updating user:', error);
        });
});

