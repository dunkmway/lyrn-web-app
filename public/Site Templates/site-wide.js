//This file must be included on any page that uses firebase
//or that we want restrict access to

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
        "/student-info-test"
    ]
    
    const secrataryPages = [
        "/Dashboard/Secratary",
        "/inquiry",
        "/Forms/New%20Student/New%20Student%20Form"
    ]
    
    const adminPages = [
        ...secrataryPages,
        ...tutorPages,
        ...parentPages,
        ...studentPages,
        "/Dashboard/Admin",
    ]
    
    
    firebase.auth().onAuthStateChanged((user) => {
        let currentPath = location.pathname;
        if (user) {
            user.getIdTokenResult()
            .then((idTokenResult) => {
                let role = idTokenResult.claims.role;
                console.log(currentPath);
                console.log(role);
    
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
                    case "secratary":
                        if (!secrataryPages.includes(currentPath) && !publicPages.includes(currentPath)) {
                            //access denied
                            window.location.replace(location.origin + "/Dashboard/Secratary");
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
                        console.log("default");
                        window.location.replace(location.origin + "/Sign-In/Sign-In");
                }
                clearLoadingScreen();
            })
            .catch((error) => {
                console.log("error while getting user token. can't confirm role")
                console.log(error);
                window.location.replace(location.origin + "/Sign-In/Sign-In");
            });
        }
        else {
            if (!publicPages.includes(currentPath)) {
                //access denied
                console.log("no user is logged in and they are not on a private page")
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
        });
    }
}

function clearLoadingScreen() {
    if (document.getElementById("loading-screen")) {
        document.getElementById("loading-screen").style.display = "none";
    }   
}
