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
  
  const appCheck = firebase.appCheck();
  appCheck.activate(
    '6LejnxEdAAAAAE01TS3gbg8dFJHw6dPgWv3YJBnK',
    true
  )
  
  function initialSetup() {
    createAnalyticsEvent({
      eventID: 'load'
    })
  }