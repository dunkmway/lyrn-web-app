const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.home = require('./home');
exports.sign_in = require('./sign-in');
exports.stripe = require('./stripe');
exports.billing = require('./billing');
exports.text_reminders = require('./text-reminders');
exports.previous_tutors = require('./previous-tutors');
exports.lesson_link = require('./lesson-link');
exports.payment_link = require('./payment-link');
exports.calendar_openings = require('./calendar-openings');
exports.frontline = require('./frontline');
exports.zoom = require('./zoom');
exports.act_tests = require('./act-tests');
exports.daily_log = require('./daily-log');
exports.act_sign_up = require('./act-sign-up');
exports.scheduled_emails = require('./scheduled-emails');
exports.test_taker = require('./test-taker');
admin.initializeApp();

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

exports.getACTStudentNotes = functions.https.onCall((data, context) => {
    const studentNotesDocRef = firebase.firestore().collection("Students").doc(data.studentUID).collection("ACT").doc("notes");
    return studentNotesDocRef.get()
})

exports.setMessage = functions.https.onCall((data, context) => {
    return new Promise((resolve, reject) => {
        const time = new Date().getTime()
        const authorId = context.auth.uid;

        let messageData = {
            user: authorId,
            note: data.message,
            isSessionNote: data.isSessionNote
        }

        // Generate the firebase reference
        let ref = undefined;
        switch (data.type) {
            case ('ACT'):
                ref = generateRef(['Students', data.id, 'ACT', 'notes'])
                break;
            case ('Subject-Tutoring'):
                ref = generateRef(['Students', data.id, 'Subject-Tutoring', 'notes'])
                break;
            case ('Math-Program'):
                ref = generateRef(['Students', data.id, 'Math-Program', 'notes'])
                break;
            case ('Writing-Program'):
                ref = generateRef(['Students', data.id, 'Writing-Program', 'notes'])
                break;
            case ('Location'):
                //ref = generateRef(['Students', data.id, 'Data', 'notes'])
                break;
            default:
                reject('Reference location does not exist');
                break;
        }

        ref.get()
            .then((doc) => {
                if (doc.exists) {
                    ref.update({
                        [data.messageType + '.' + time]: messageData
                    })
                    .then(() => resolve())
                    .catch((error) => reject('Could not create message:' + error))
                }
                else {
                    ref.set({
                        [data.messageType]: {
                            [time]: messageData
                        }
                    })
                    .then(() => resolve())
                    .catch((error) => reject('Could not create message:' + error))
                }
            })
            .catch((error) => reject('Could not create document:' + error))
    })
})

function generateRef(path) {

    // Make sure an array was passed in
    if (Array.isArray(path) != true) {
        return undefined;
    }

    // Generate the reference from the path
    let ref = firebase.firestore();
    for (let i = 0; i < path.length; i++) {
        if (i % 2 == 0) {
            ref = ref.collection(path[i])
        }
        else {
            ref = ref.doc(path[i])
        }
    }

    return ref;
}

exports.saveStudentMessage = functions.https.onCall((data, context) => {
    const mes = {
        conversation: data.conversation,
        timestamp: data.timestamp,
        message: data.message,
        author: context.auth.uid,
        authorName: context.auth.token.name,
        authorRole: context.auth.token.role
    }
    const chatRef =  admin.firestore().collection("Student-Chats").doc();
    return chatRef.set(mes)
    .then(() => {
        return {
            timestamp: data.timestamp,
            message: data.message,
            author: context.auth.token.name,
            id: chatRef.id,
            currentUserIsAuthor: true,
            isImportant: context.auth.token.role == 'admin'
        };
    })
    .catch((error) => {
        console.log(error);
    })
});

exports.getStudentMessages = functions.https.onCall((data, context) => {
    const studentUID = data.studentUID;
    const studentType = data.studentType;
    const conversationType = data.conversationType;
    const conversation = studentUID + "-" + studentType + "-" + conversationType;

    const chatRef = admin.firestore().collection("Student-Chats").where("conversation", "==", conversation).orderBy("timestamp", "asc")
    return chatRef.get()
    .then((querySnapshot) => {
        let messages = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const clientMessage = {
                timestamp: data.timestamp,
                message: data.message,
                author: data.authorName,
                id: doc.id,
                currentUserIsAuthor: context.auth.uid == data.author,
                isImportant: data.authorRole == "admin"
            };
            messages.push(clientMessage);
        })
        return messages;
    })
    .catch((error) => {
        console.log(error)
        new functions.https.HttpsError(error.code, error.message, error.details);
    });
});

function getUserDisplayNamePrivate(uid) {
    return admin.auth().getUser(uid)
    .then((userRecord) => {
        return userRecord.displayName;
    })
    .catch((error) => {
        new functions.https.HttpsError(error.code, error.message, error.details);
    });
}

function getUserRolePrivate(uid) {
    return admin.auth().getUser(uid)
    .then((userRecord) => {
        return userRecord.customClaims.role;
    })
    .catch((error) => {
        new functions.https.HttpsError(error.code, error.message, error.details);
    });
}