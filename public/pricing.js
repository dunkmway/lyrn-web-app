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
  // bannerSetup();

  let queryCourse = queryStrings()['course'];
  let programCourse = queryStrings()['program'];

  if (queryCourse) {
    openCourse(queryCourse)
  }

  if (programCourse) {
    document.getElementById(programCourse).dispatchEvent(new Event('click'));
  }

  // createAnalyticsEvent({
  //   eventID: 'load'
  // })
}

function openCourse(sectionID) {
  document.getElementById(sectionID + '-section').checked = true;
}

function openProgram(event) {
  const program = event.target.id;
  event.target.checked = true;
  
  document.querySelectorAll('.program').forEach(element => {
    element.classList.remove('open')
  });

  const programElement = document.querySelector(`.program.${program}`)
  programElement.classList.add('open');
  const programPosition = programElement.getBoundingClientRect().top;
  const offsetPosition = programPosition + window.pageYOffset - (window.innerWidth < 800 ? 100 : 60);
  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
  });
}

initialSetup();
