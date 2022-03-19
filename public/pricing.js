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
  let queryCourse = queryStrings()['course'];
  // if (queryCourse && queryCourse != 'act') {
  //   openCourse(queryCourse)
  // }
  if (queryCourse) {
    openCourse(queryCourse)
  }
  else {
    openCourse('act', false)
  }
}

function openCourse(sectionID, scroll = true) {
  document.querySelectorAll('.course-section').forEach(card => {
    card.style.display = 'none';
  })
  document.getElementById(sectionID).style.display = 'flex';
  
  if (scroll) {
    document.getElementById(sectionID).scrollIntoView({behavior: "smooth", block: "start"});
  }
}

initialSetup();

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
    submit.textContent = 'Sending promo...'
    error.textContent = '';

    if (!isEmailValid(email.value)) {
      error.textContent = 'There seems to be something wrong with the email you entered.'; 
      submit.disabled = false;
      submit.classList.remove('loading');
      submit.textContent = 'Ready to Lyrn'
      return;
    }

    await sendLeadRequest(email.value, 'ACT-firstSessionFree', 'pricing');

    submit.disabled = false;
    submit.classList.remove('loading');
    submit.textContent = 'Promo sent!'
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
    timestamp: new Date().getTime()
  });

  return response.data
}