const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
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

exports.setAllUsersDisplayName = functions.https.onRequest((request, response) => {
    const listAllUsers = (nextPageToken) => {
        // List batch of users, 1000 at a time.
        admin.auth().listUsers(1000, nextPageToken)
            .then((listUsersResult) => {
                let promises = [];
                listUsersResult.users.forEach((userRecord) => {
                    //get the user's role
                    let role = userRecord.customClaims.role;
                    //use this to get their collection and get their first and last name
                    let Role = role.charAt(0).toUpperCase() + role.slice(1) + 's';
                    const collection = Role;
                    const firstNameKey = role + "FirstName";
                    const lastNameKey = role + "LastName";

                    const userProfileRef = admin.firestore().collection(collection).doc(userRecord.uid);
                    let promise = userProfileRef.get()
                        .then((doc) => {
                            if (doc.exists) {
                                //use this string to set their display name;
                                const firstName = doc.data()[firstNameKey];
                                const lastName = doc.data()[lastNameKey];

                                const displayName = firstName + " " + lastName;

                                return admin.auth().updateUser(userRecord.uid, {
                                    displayName: displayName
                                })
                                    .then((userRecord) => {
                                        // response.send("Success giving user " + userRecord.uid + " display name " + userRecord.displayName);
                                        console.log("Success giving user " + userRecord.uid + " display name " + userRecord.displayName);
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        // response.send(error);
                                    });
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            // response.send(error);
                        });
                    promises.push(promise);
                });
                if (listUsersResult.pageToken) {
                    // List next batch of users.
                    listAllUsers(listUsersResult.pageToken);
                }
                return Promise.all(promises)
                    .then(() => {
                        response.send("Success!")
                    })
            })
            .catch((error) => {
                console.log('Error listing users:', error);
                response.send(error);
            });
    };

    // Start listing users from the beginning, 1000 at a time.
    listAllUsers()
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
                                admin.auth().setCustomUserClaims(userRecord.uid, { role: data.role })
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

exports.deleteUser = functions.https.onCall((data, context) => {
    return admin.auth().deleteUser(data.uid)
    .then(() => {
        console.log('Successfully deleted user');
    })
    .catch((error) => {
        console.log('Error deleting user:', error);
    });
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


exports.updateAllStudentTypesToArray = functions.https.onRequest((request, response) => {
    admin.firestore().collection('Students').get()
    .then((studentQuerySnapshot) => {
        let promises = [];
        studentQuerySnapshot.forEach((studentProfileDoc) => {
            let studentData = studentProfileDoc.data();
            let studentType = studentData.studentType;

            //make the types look beter
            switch(studentType) {
                case 'act':
                    //it's good
                    break
                case 'subject-tutoring':
                    studentType = 'subjectTutoring';
                    break
                case 'math-program':
                    studentType = 'mathProgram';
                    break
                case 'phonics-program':
                    studentType = 'phonicsProgram';
                    break
                default:
                    studentType = null;
                    break
            }

            //put it into an array
            let newStudentTypes;
            if (studentType) {
                newStudentTypes = [studentType];
            }
            else {
                newStudentTypes = [];
            }

            //update the doc
            promises.push(admin.firestore().collection('Students').doc(studentProfileDoc.id).update({
                studentTypes: newStudentTypes
            }));
        })

        Promise.all(promises)
        .then(() => {
            response.send("all good");
        })
        .catch((errors) => {
            console.log(errors);
            response.send("not doing so well.")
        })
    })
});