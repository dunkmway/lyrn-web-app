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
  bannerSetup();
  randomizeTutors();
}

function bannerSetup() {
  document.querySelector('.banner').addEventListener('click', () => {
    document.querySelector('.modal').classList.add('show');
  })

  document.querySelector('.modal-body > .close').addEventListener('click', () => {
    document.querySelector('.modal').classList.remove('show');
  })

  document.querySelector('.modal').addEventListener('click', (e) => {
    if (e.target !== e.currentTarget) return;
    document.querySelector('.modal').classList.remove('show');
  })

  document.querySelector('.modal-body .submit').addEventListener('click', async (e) => {
    // check if the email is valid
    const email = document.querySelector('.modal-body input');
    const error = document.querySelector('.modal-body .error')
    const submit = e.target;

    submit.disabled = true;
    submit.classList.add('loading');
    submit.textContent = 'Sending practice tests'
    error.textContent = '';

    if (!isEmailValid(email.value)) {
      error.textContent = 'There seems to be something wrong with the email you entered.'; 
      submit.disabled = false;
      submit.classList.remove('loading');
      submit.textContent = 'Ready to Lyrn'
      return;
    }

    await sendPracticeTestRequest(email.value, 'ACT-practiceTest', 'pricing');

    submit.disabled = false;
    submit.classList.remove('loading');
    submit.textContent = 'Practice tests sent!'
  })
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendLeadRequest(email, type, page) {
  let response = await firebase.functions().httpsCallable('home-sendLeadRequest')({
    email,
    type,
    page,
    timestamp: new Date()
  });

  return response.data
}

function randomizeTutors() {
  const tutorGrid = document.querySelector('.tutor-grid')
  const tutorCards = tutorGrid.querySelectorAll('.flip-card');

  // remove all tutors cards
  removeAllChildNodes(tutorGrid);

  // append them back in a random order
  arrayRandomOrder(Array.from(tutorCards)).forEach(card => tutorGrid.appendChild(card));

  tutorGrid.classList.add('ready')
}

function arrayRandomOrder(array) {
  let tmpArray = [...array];
  let randomArray = [];

  // go through the array and choose a random index then push it to the random array
  for (let i = 0; i < array.length; i++) {
    let randomIndex = Math.floor(Math.random() * (tmpArray.length));
    randomIndex == tmpArray.length ? randomIndex-- : randomIndex;

    randomArray.push(tmpArray[randomIndex]);
    tmpArray.splice(randomIndex, 1);
  }

  return randomArray;
}

async function sendPracticeTestRequest(email, type, page) {
  let response = await firebase.functions().httpsCallable('home-sendPracticeTestRequest')({
    email,
    type,
    page,
    timestamp: new Date()
  });

  return response.data
}