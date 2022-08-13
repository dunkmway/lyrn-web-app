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
  createAnalyticsEvent({
    eventID: 'load'
  })
}

function bannerSetup() {
  // get the banners
  const banners = document.querySelectorAll('.banner');

  // go through the banners and set up their corresponding modals
  banners.forEach(banner => {
    const modal = document.getElementById(`${banner.id.split('_')[0]}_modal`);

    // add click event to banner
    banner.addEventListener('click', () => {
      modal.classList.add('show');
      createAnalyticsEvent({
        eventID: `${banner.id.split('_')[0]}BannerClicked`
      })
    })

    // add click event to close
    modal.querySelector('.close').addEventListener('click', () => {
      modal.classList.remove('show');
    })

    // add click event to off modal
    modal.addEventListener('click', (e) => {
      if (e.target !== e.currentTarget) return;
      modal.classList.remove('show');
    })
  })

  // randomly choose one banner to display and hide the rest
  const randIndex = Math.floor(Math.random() * banners.length)
  banners[randIndex].classList.add('active');
}

async function submitPracticeTestRequest(e) {
  //check if the email is valid
  const submit = e.target;
  const email = submit.parentNode.querySelector('input');
  const error = submit.parentNode.querySelector('.error');

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

  createAnalyticsEvent({
    eventID: 'emailProvided',
    additionalData: {
      email: email.value,
      from: 'ACT-practiceTest'
    }
  })
  await sendPracticeTestRequest(email.value, 'ACT-practiceTest', 'why');

  submit.disabled = false;
  submit.classList.remove('loading');
  submit.textContent = 'Practice tests sent!'
}

async function submitLessonSeriesRequest(e) {
  //check if the email is valid
  const submit = e.target;
  const email = submit.parentNode.querySelector('input');
  const error = submit.parentNode.querySelector('.error');

  submit.disabled = true;
  submit.classList.add('loading');
  submit.textContent = 'Sending lesson series'
  error.textContent = '';

  if (!isEmailValid(email.value)) {
    error.textContent = 'There seems to be something wrong with the email you entered.'; 
    submit.disabled = false;
    submit.classList.remove('loading');
    submit.textContent = 'Ready to Lyrn'
    return;
  }

  createAnalyticsEvent({
    eventID: 'emailProvided',
    additionalData: {
      email: email.value,
      from: 'ACT-lessonSeries'
    }
  })
  await sendLessonSeriesRequest(email.value, 'ACT-lessonSeries', 'why');

  submit.disabled = false;
  submit.classList.remove('loading');
  submit.textContent = 'Lesson series sent!'
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

async function sendPracticeTestRequest(email, type, page) {
  let response = await firebase.functions().httpsCallable('home-sendPracticeTestRequest')({
    email,
    type,
    page,
    timestamp: new Date()
  });

  return response.data
}

async function sendLessonSeriesRequest(email, type, page) {
  let response = await firebase.functions().httpsCallable('home-sendLessonSeriesRequest')({
    email,
    type,
    page,
    timestamp: new Date()
  });

  return response.data
}