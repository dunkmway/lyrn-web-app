//This file must be included on any page that uses firebase
//or that we want restrict access to

// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD8GSMZzjbubQ7AGcQKIV-enpDYpz_07mo",
    authDomain: "lyrn-web-app.firebaseapp.com",
    projectId: "lyrn-web-app",
    storageBucket: "lyrn-web-app.appspot.com",
    messagingSenderId: "80732012862",
    appId: "1:80732012862:web:22ffb978c80a1d2a0f2c6f",
    measurementId: "G-F2QZT3W2CX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();



window.onerror = sendErrorReport;

checkPermissions();

function checkPermissions() {
    const publicPages = [
        "/Sign-In/Sign-In",
        "/index",
        "/404"
    ]
    
    const studentPages = [
        "/Dashboard/Student",
    ]
    
    const parentPages = [
        "/Dashboard/Parent",
    ]
    
    const tutorPages = [
        "/Dashboard/Tutor",
        "/Forms/ACT%20Daily%20Log/Daily%20Log",
        "/student-info-test",
        "/subject-tutoring-dash",
        "/math-program",
        "/phonics-program"
    ]
    
    const secretaryPages = [
        "/Dashboard/Secretary",
        "/inquiry",
        "/Forms/New%20Student/New%20Student%20Form",
        "/Forms/ACT%20Daily%20Log/Daily%20Log",
        "/subject-tutoring-dash"
    ]
    
    const adminPages = [
        ...secretaryPages,
        ...tutorPages,
        ...parentPages,
        ...studentPages,
        "/Dashboard/Admin",
        "/staff-registration"
    ]
    
    
    firebase.auth().onAuthStateChanged((user) => {
        let currentPath = location.pathname;
        if (user) {
            user.getIdTokenResult()
            .then((idTokenResult) => {
                let role = idTokenResult.claims.role;
                // console.log(currentPath);
                // console.log(role);
    
                switch (role) {
                    case "student":
                        if (!studentPages.includes(currentPath) && !publicPages.includes(currentPath)) {
                            //access denied
                            window.location.replace(location.origin + "/Dashboard/Student");
                        } 
                        break;
                    case "parent":
                        if (!parentPages.includes(currentPath) && !publicPages.includes(currentPath)) {
                            //access denied
                            window.location.replace(location.origin + "/Dashboard/Parent");
                        } 
                        break;
                    case "tutor":
                        if (!tutorPages.includes(currentPath) && !publicPages.includes(currentPath)) {
                            //access denied
                            window.location.replace(location.origin + "/Dashboard/Tutor");
                        } 
                        break;
                    case "secretary":
                        if (!secretaryPages.includes(currentPath) && !publicPages.includes(currentPath)) {
                            //access denied
                            window.location.replace(location.origin + "/Dashboard/Secretary");
                        } 
                        break;
                    case "admin":
                        if (!adminPages.includes(currentPath) && !publicPages.includes(currentPath)) {
                            //access denied
                            window.location.replace(location.origin + "/Dashboard/Admin");
                        } 
                        break;
                    case "dev":
                        //UNLIMITED POWER!!!
                        break;
                    default:
                        alert("no role for this user. contact the devs to fix this issue. will sign out user now. goodbye!");
                        signOut();
                }
                clearLoadingScreen();
            })
            .catch((error) => {
                handleFirebaseErrors(error, window.location.href);
                window.location.replace(location.origin + "/Sign-In/Sign-In");
            });
        }
        else {
            if (!publicPages.includes(currentPath)) {
                //access denied
                // console.log("no user is logged in and they are not on a private page")
                window.location.replace(location.origin + "/Sign-In/Sign-In");
            }
            clearLoadingScreen();
        }
    });
}

function signOut() {
    let confirmation = confirm("Are you sure you want to sign out?");
    if (confirmation) {
        firebase.auth().signOut()
        .then(() => {
            // Sign-out successful.
        })
        .catch((error) => {
            // An error happened.
            handleFirebaseErrors(error, window.location.href);
        });
    }
}

function clearLoadingScreen() {
    if (document.getElementById("loading-screen")) {
        document.getElementById("loading-screen").style.display = "none";
    }   
}

function sendErrorReport(msg, url, lineNo, columnNo, error) {
    //console.log(error)
    // BELOW CODE IS FOR ERRORS
    //let userMsg = prompt("OH NO!!! An error has occured.\nLet us know what happened and we'll get right on it!") ?? null;
    // var report = {
    //     UserMessage: null,
    //     Message: msg,
    //     URL: url,
    //     Line: lineNo,
    //     Column: columnNo,
    //     Error: JSON.stringify(error),
    //     Timestamp: (new Date().getTime())
    // }

    // firebase.auth().onAuthStateChanged((user) => {
    //     if (user) {
    //         report.User = user.uid;
    //     }
    //     const errorRef = firebase.firestore().collection("Error-Reports").doc();
    //     errorRef.set(report)
    //     .then().catch();
    //     return false;
    // });
}

function handleFirebaseErrors(err, file) {
    //new Error().stack is non standard and may not work as intented on all browsers
    const msg = "firebase error";
    const url = file;
    const stack = new Error().stack;
    let lineNo;
    let columnNo;
    if (stack) {
        const traceSplit = new Error().stack.split('\n')[1].split(':');
        columnNo = parseInt(traceSplit.pop());
        lineNo = parseInt(traceSplit.pop());
    }
    else {
        columnNo = 0;
        lineNo = 0;
    }
    const error = err;

    // alert(msg + "\n" + url + "\n" + lineNo + "\n" + columnNo + "\n")
    sendErrorReport(msg, url, lineNo, columnNo, error);
}

function goToDashboard() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            user.getIdTokenResult()
            .then((idTokenResult) => {
                let role = idTokenResult.claims.role;
    
                switch (role) {
                    case "student":
                    window.location.replace(location.origin + "/Dashboard/Student");
                    break;
                    case "parent":
                    window.location.replace(location.origin + "/Dashboard/Parent");
                    break;
                    case "tutor":
                    window.location.replace(location.origin + "/Dashboard/Tutor");
                    break;
                    case "secretary":
                    window.location.replace(location.origin + "/Dashboard/Secretary");
                    break;
                    case "admin":
                    window.location.replace(location.origin + "/Dashboard/Admin");
                    break;
                    case "dev":
                    window.location.replace(location.origin + "/Dashboard/Admin");
                    break;
                    default:
                    
                }
            })
            .catch((error) => {
            handleFirebaseErrors(error, window.location.href);
            });
        }
        else {
            window.location.replace(location.origin + "/Sign-In/Sign-In");
        }
    });
}

function queryStrings() {
    var GET = {};
    var queryString = window.location.search.replace(/^\?/, '');
    queryString.split(/\&/).forEach(function(keyValuePair) {
        var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
        var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
        GET[paramName] = paramValue;
    });
  
    return GET;
  }