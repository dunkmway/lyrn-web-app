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

document.querySelector('#contactForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  let submitBtn = event.target.querySelector('input[type="submit"]')
  submitBtn.disabled = true;
  submitBtn.value = '···'

  let contactData = new FormData(event.target);
  let data = Object.fromEntries(contactData.entries())
  data.timestamp = new Date().getTime();
  
  const sendRequest = firebase.functions().httpsCallable('home-sendContactRequest');
  sendRequest(data)
  .then(() => {
    event.target.reset();
    submitBtn.value = 'We got it!'
  })
  .catch(error => {
  console.log(error)
  alert('We had an issue receiving your contact info. Please try again.')
  submitBtn.disabled = false;
  submitBtn.value = 'Enroll'
  });
})