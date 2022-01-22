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

function initialSetup() {
  let queryCourse = queryStrings()['course'];
  if (queryCourse && queryCourse != 'act') {
    openCourse(queryCourse)
  }
}

function openCourse(sectionID) {
  document.querySelectorAll('.course-section').forEach(card => {
    card.style.display = 'none';
  })

  document.getElementById(sectionID).style.display = 'flex';
  document.getElementById(sectionID).scrollIntoView({behavior: "smooth", block: "start"});
}

initialSetup();