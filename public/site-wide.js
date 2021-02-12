// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
apiKey: "AIzaSyDWYoQicpF7ROpQJR-FT56Sb0aaou4v-sk",
authDomain: "wasatch-tutors-web-app.firebaseapp.com",
projectId: "wasatch-tutors-web-app",
storageBucket: "wasatch-tutors-web-app.appspot.com",
messagingSenderId: "726239338475",
appId: "1:726239338475:web:da31cd3223e7c3159543ae",
measurementId: "G-EJTMKB10B7"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

//set auth persistence to session
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
.then(function() {
// Existing and future Auth states are now persisted in the current
// session only. Closing the window would clear any existing state even
// if a user forgets to sign out.
// ...
// New sign-in will be persisted with session persistence.
return firebase.auth().signInWithEmailAndPassword(email, password);
})
.catch(function(error) {
// Handle Errors here.
var errorCode = error.code;
var errorMessage = error.message;
});

var privatePages = [
    "New Parent Form/New Parent Form.html"
]

var publicPages = [
]

firebase.auth().onAuthStateChanged(function (user) {
    var currentPath = window.location.pathname;
    if (user) {
        //User is logged in
        console.log('User is logged in!');
        if (publicPages.includes(currentPath)) {
            window.location.replace('/');
        }
        else {
        }
    }
    else {
        //User is logged out
        console.log('No user is logged in')
        if (privatePages.includes(currentPath)) {
            window.location.replace('/');
        }
        else {
        }
    }
})
