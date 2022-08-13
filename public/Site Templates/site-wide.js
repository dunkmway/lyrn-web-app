//This file must be included on any page that uses firebase
//or that we want restrict access to

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

const AUTH_EXPIRATION = 1000 * 60 * 60 * 6;
const AUTH_EXPIRATION_WARNING = 1000 * 60 * 5;
// const AUTH_EXPIRATION = 1000 * 60 * 1;
// const AUTH_EXPIRATION_WARNING = 1000 * 30;


// auth timers
let auth_expiration_timer;
let auth_warning_timer;

// auth dialog
let auth_warning_dialog;

window.addEventListener('storage', (e) => {
    if (e.key !== 'authExpiration') return;
    setAuthExpirationTimers();
});
window.addEventListener('DOMContentLoaded', checkAuthorization)

let allowedPages = {
    all: [
        '/act-invoice',
        '/test-taker/*',
    ],
    public: [
        "/sign-in",
    ],
    student: [
        "/Dashboard/Student",
    ],
    parent: [
        "/Dashboard/Parent",
    ],
    tutor: [
        "/Dashboard/Tutor",
        "/new-assignment",
        "/view-curriculum",
        "/customer-dashboard/*",
    ],
    admin: [
        "&student",
        "&parent",
        "&tutor",
        "/Dashboard/Admin",
        "/new-parent",
        "/new-student",
        "/new-tutor",
        "/act-sign-up",
        "/calendar",
        "/payment"
    ],
    dev: [
        '&public',
        "&student",
        "&parent",
        "&tutor",
        '&admin',
        "/Dashboard/Dev",
        "/testEditor",
        "/analytics"
    ]
}

/**
 * modify allowed pages to be include all paths
 */
function initializeAllowedPages() {
    for (const role in allowedPages) {
        allowedPages[role] = allowedPages[role].flatMap(path => {
            if (path.charAt(0) === '&') {
                return allowedPages[path.slice(1)];
            }
            return path;
        });
    }
}

initializeAllowedPages();

function checkAuthorization() {
    showLoadingScreen();
    try {
        firebase.auth().onAuthStateChanged(async (user) => {
            let currentPath = location.pathname;
            if (user) {
                // make sure the authExpiration hasn't passed
                if (!localStorage.getItem('authExpiration') || parseInt(localStorage.getItem('authExpiration')) < new Date().getTime()) {
                    // sign out the user
                    signOut(true);
                    return;
                }
                const idTokenResult = await user.getIdTokenResult()
                const role = idTokenResult.claims.role;
    
                if (!isPathAllowed(role, currentPath)) {
                    //access denied
                    window.location.replace(`${location.origin}/Dashboard/${role.charAt(0).toUpperCase() + role.slice(1)}`);
                    return;
                }

                // reset the authExpiration
                localStorage.setItem('authExpiration', (new Date().getTime() + AUTH_EXPIRATION).toString());
                setAuthExpirationTimers();
            }
            else {
                const role = 'public';
                if(!isPathAllowed(role, currentPath)) {
                    // access denied
                    window.location.replace(location.origin + "/sign-in");
                    return;
                }
            }
            hideLoadingScreen();
        })

    }
    catch (error) {
        console.log(error)
        window.location.replace(location.origin + "/sign-in");
    }
}


async function setAuthExpirationTimers() {
    // clear the custom confirm prompt if it is open
    await loadScript(location.origin + "/Timer.js");
    await loadScript(location.origin + "/Dialog.js");
    // clean up any existing timers
    if (auth_warning_dialog) {
        auth_warning_dialog.hide();
    }
    if (auth_expiration_timer) {
        auth_expiration_timer.cleanUp();
    }
    if (auth_warning_timer) {
        auth_warning_timer.cleanUp();
    }

    // set up the new timers
    const currentExpiration = localStorage.getItem('authExpiration') && parseInt(localStorage.getItem('authExpiration'));
    auth_expiration_timer = new Timer(
        new Date(currentExpiration),
        () => {
            signOut(true);
        }
    )

    auth_warning_timer = new Timer(
        new Date(currentExpiration - AUTH_EXPIRATION_WARNING),
        async () => {
            const message = document.createElement('p');
            message.style.margin = '0';
            message.textContent = 'Are you still there? You will be signed out in ';
            const timerSpan = document.createElement('span');
            auth_expiration_timer.attach(timerSpan);
            message.appendChild(timerSpan);

            auth_warning_dialog = new Dialog({
                message,
                choices: ['YES', 'NO'],
                values: [true, false],
                timeout: auth_expiration_timer.time,
                slideInDir: 'down',
                fadeIn: true
            })

            const answer = await auth_warning_dialog.show();
            if (answer === true) {
                localStorage.setItem('authExpiration', (new Date().getTime() + AUTH_EXPIRATION).toString());
                setAuthExpirationTimers();
            }
            else if (answer === false) {
                auth_warning_dialog.hide();
                localStorage.setItem('authExpiration', (new Date().getTime() + AUTH_EXPIRATION).toString());
                setAuthExpirationTimers();
                signOut();
            }
        }
    )
}

function isPathAllowed(role, path) {
    const allowedPaths = [...allowedPages[role], ...allowedPages.all];
    // console.log(allowedPaths)

    for (const allowedPath of allowedPaths) {
        const splitAllowedPath = allowedPath.split('/');
        const splitPath = path.split('/');

        // if the allowed path is longer than the path then it can't be right so continue
        if (splitAllowedPath.length > splitPath.length) {
            continue;
        }

        let valid = true;
        // run through the path parameters and make sure they are the same or at least dynamic
        for (let i = 0; i < splitPath.length; i++) {
            // path should be the same if the index is valid for allowed paths
            if (i < splitAllowedPath.length && splitPath[i] !== splitAllowedPath[i] && splitAllowedPath[i] !== '*' && splitAllowedPath[i] !== '**') {
                valid = false;
                break;
            }
            if (i >= splitAllowedPath.length && splitAllowedPath[splitAllowedPath.length - 1] !== '**') {
                // the allowed path might be dynamic
                valid = false;
                break;
            }
        }

        if (valid === true) {
            return true;
        }
    }

    return false;
}

function addTimerScript() {
    // bring in the Timer class file to be used
    const timer = document.createElement('script');
    timer.setAttribute('src', '/public/Timer.js')
    document.body.appendChild(timer)
}

async function signOut(force = false) {
    await loadScript(location.origin + "/Dialog.js");
    if (!force) {
        const signoutWarning = new Dialog({
            message: 'Are you sure you want to sign out?',
            choices: ['YES', 'NO'],
            values: [true, false],
            slideInDir: 'down',
            fadeIn: true
        })

        const confirmation = await signoutWarning.show();
        if (confirmation) {
            await firebase.auth().signOut()
        }
    }
    else {
        await firebase.auth().signOut()
    }
}

function showLoadingScreen() {
    const screen = document.createElement('div');
    screen.id = 'siteWideLoadingScreen';
    document.body.appendChild(screen);

    document.body.classList.remove('authorized');
}

function hideLoadingScreen() {
    document.body.classList.add('authorized');
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
                    window.location.replace(location.origin + "/Dashboard/Dev");
                    break;
                    default:
                    
                }
            })
            .catch((error) => {
            handleFirebaseErrors(error, window.location.href);
            });
        }
        else {
            window.location.replace(location.origin + "/sign-in");
        }
    });
}

const loadScript = (FILE_URL, async = true, type = "text/javascript") => {
    return new Promise((resolve, reject) => {
        try {

            // make sure the file isn't already included
            const finalPath = FILE_URL.split('/')[FILE_URL.split('/').length - 1]
            if (document.querySelector(`script[src$="${finalPath}"`)) {
                resolve();
                return;
            }

            const scriptEle = document.createElement("script");
            scriptEle.type = type;
            scriptEle.async = async;
            scriptEle.src = FILE_URL;

            scriptEle.addEventListener("load", (ev) => {
                resolve({ status: true });
            });

            scriptEle.addEventListener("error", (ev) => {
                reject({
                    status: false,
                    message: `Failed to load the script ${FILE_URL}`
                });
            });

            document.body.appendChild(scriptEle);
        } catch (error) {
            reject(error);
        }
    });
};