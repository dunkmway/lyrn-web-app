import app from "./_firebase";
import { getAuth, onAuthStateChanged, getIdTokenResult, signOut, confirmPasswordReset } from "firebase/auth";

import Dialog from "./_Dialog";
import Timer from "./_Timer";

export {
    requestSignOut,
    getCurrentUser,
    getCurrentUserRole,
    goHome
}

const auth = getAuth(app);

const AUTH_EXPIRATION = 1000 * 60 * 60 * 24 * 5;
const AUTH_EXPIRATION_WARNING = 1000 * 60 * 5;

// auth timers
let auth_expiration_timer;
let auth_warning_timer;

// auth dialog
let auth_warning_dialog;

window.addEventListener('DOMContentLoaded', checkAuthorization)

let allowedPages = {
    all: [
        '/',
        '/free-test-taker',
        '/pricing',
        '/why',
        '/careers',
        "/sign-up",
    ],
    public: [
        "/sign-in",
    ],
    student: [
        "/Dashboard/Student",
        '/test-taker/*',
    ],
    parent: [
        "/Dashboard/Parent",
        '/test-taker/*',
    ],
    tutor: [
        "/Dashboard/Tutor",
        "/new-assignment",
        "/view-curriculum",
        "/student-overview/*",
        '/test-taker/*',
    ],
    admin: [
        "&student",
        "&parent",
        "&tutor",
        "/Dashboard/Admin",
        "/new-parent",
        "/new-student",
        "/new-tutor",
    ],
    dev: [
        // '&public',
        "&student",
        "&parent",
        "&tutor",
        '&admin',
        "/Dashboard/Dev",
        "/testEditor",
        "/analytics"
    ]
}

initializeAllowedPages();

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

function getCurrentUser() {
    return new Promise(res => {
        onAuthStateChanged(auth, user => {
            res(user);
        });
    })
}

function getCurrentUserRole() {
    return new Promise(res => {
        onAuthStateChanged(auth, user => {
            getIdTokenResult(user)
            .then(idTokenResult => {
                const role = idTokenResult.claims.role;
                res(role);
            })
        });
    })
}

async function goHome() {
    onAuthStateChanged(auth, user => {
        getIdTokenResult(user)
        .then(idTokenResult => {
            goToRoleHomePage(idTokenResult.claims.role, user.uid)
        })
    });
}

function checkAuthorization() {
    showLoadingScreen();
    try {
        onAuthStateChanged(auth, async (user) => {
            let currentPath = location.pathname;
            if (user) {
                // make sure the authExpiration hasn't passed
                if (localStorage.getItem('authExpiration') && parseInt(localStorage.getItem('authExpiration')) < new Date().getTime()) {
                    // remove the expiration
                    localStorage.removeItem('authExpiration');
                    setAuthExpirationTimers();
                    // sign out the user
                    requestSignOut(true);
                    return;
                }

                // reset the authExpiration
                localStorage.setItem('authExpiration', (new Date().getTime() + AUTH_EXPIRATION).toString());
                setAuthExpirationTimers();

                // get the role
                const idTokenResult = await getIdTokenResult(user);
                const role = idTokenResult.claims.role;

                // check for a redirect
                const params = new URLSearchParams(document.location.search);
                const redirect = params.get("redirect");
                if (redirect) {
                    window.location.replace(location.origin + decodeURI(redirect));
                    return;
                }
                
    
                if (!isPathAllowed(role, currentPath)) {
                    //access denied
                    goToRoleHomePage(role, user.uid);
                    return;
                }
            }
            else {
                const role = 'public';
                if(!isPathAllowed(role, currentPath)) {
                    // access denied
                    // since they aren't signed in, we want to give them the chance to redirect to where they were going to go if they sign in
                    // attach the currentPath to the sign-in page to allow for redirect
                    const redirect = encodeURI(currentPath);
                    window.location.replace(location.origin + "/sign-in?redirect=" + redirect);
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

function goToRoleHomePage(role, uid) {
    switch (role) {
        case 'public':
            window.location.replace(`${location.origin}/sign-in`);
            break
        case 'student':
            window.location.replace(`${location.origin}/test-taker/${uid}`);
            break
        case 'parent':
            window.location.replace(`${location.origin}/Dashboard/Parent`);
            break
        case 'tutor':
            window.location.replace(`${location.origin}/Dashboard/Tutor`);
            break
        case 'admin':
            window.location.replace(`${location.origin}/Dashboard/Admin`);
            break
        case 'dev':
            window.location.replace(`${location.origin}/Dashboard/Dev`);
            break
        default:
            window.location.replace(`${location.origin}/sign-in`);
    }
}

async function setAuthExpirationTimers() {
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
    if (!currentExpiration) return;

    auth_expiration_timer = new Timer(
        new Date(currentExpiration),
        () => {
            requestSignOut(true);
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
                localStorage.removeItem('authExpiration');
                setAuthExpirationTimers();
                requestSignOut();
            }
        }
    )
}

function isPathAllowed(role, path) {
    const allowedPaths = [...(allowedPages[role] ?? []), ...allowedPages.all];

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

function showLoadingScreen() {
    // public pages don't need the loading page
    if (isPathAllowed('public', location.pathname)) return;
    
    const screen = document.createElement('div');
    screen.id = 'siteWideLoadingScreen';

    const style = document.createElement('style');
    style.innerHTML = `
    #siteWideLoadingScreen {
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        height: 100vh;
        width: 100vw;
        position: absolute;
        background-color: white;
        z-index: 9999;
        display: flex;
    }
      
    body.authorized > #siteWideLoadingScreen {
        display: none;
    }
      
    #siteWideLoadingScreen:before {
        content: '';
        display: block;
        border: 20px solid white;
        border-top: 20px solid #110D65;
        border-radius: 50%;
        width: 100px;
        height: 100px;
        animation: spin 2s linear infinite;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        position: absolute;
    }
      
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    `
      document.body.appendChild(style);
    document.body.appendChild(screen);
    
    document.body.classList.remove('authorized');
}

function hideLoadingScreen() {
    document.body.classList.add('authorized');
}

async function requestSignOut(force = false) {
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
            await signOut(auth)
        }
    }
    else {
        await signOut(auth)
    }
}