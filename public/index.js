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

let aboutAnimations = [];

function afterLoad() {
  aboutSetup();
  bannerSetup();
}

//navbar section

const header = document.querySelector('header');
const heroSection = document.querySelector('.hero');
const aboutSection = document.querySelector('.about');

const heroSectionOptions = {
  rootMargin: "-80% 0px 0px 0px"
};

const heroSectionObserver = new IntersectionObserver((entries, heroSectionObserver) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      header.classList.remove('nav-start')
    }
    else {
      header.classList.add('nav-start');
    }
  })
}, heroSectionOptions)

// heroSectionObserver.observe(heroSection)


//turn off animation if not in view
const animationOptions = {
  threshold: 0.0
};

//hero section
const heroAnimationObserver = new IntersectionObserver((entries, animationObserver) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      document.getAnimations().forEach(animation => {
        if (entry.target.contains(animation.effect.target)) {
          animation.pause()
        }
      })
    }
    else {
      document.getAnimations().forEach(animation => {
        if (entry.target.contains(animation.effect.target)) {
          animation.play()
        }
      })
    }
  })
}, animationOptions)
heroAnimationObserver.observe(heroSection)

//about section
const aboutAnimationObserver = new IntersectionObserver((entries, animationObserver) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      document.getAnimations().forEach(animation => {
        if (entry.target.contains(animation.effect.target)) {
          animation.pause()
        }
      })
    }
    else {
      document.getAnimations().forEach(animation => {
        if (entry.target.contains(animation.effect.target) && animation.effect.target.parentNode.querySelector('.about_toggle').checked) {
          animation.play()
        }
      })
    }
  })
}, animationOptions)
// aboutAnimationObserver.observe(aboutSection)

//work with the about section animations

function aboutSetup() {
  aboutAnimations = document.getAnimations().filter(animation => animation.effect.target.matches('.about-details .content'))
  aboutAnimations.forEach((animation, index, animationList) => {
    animation.onfinish = () => {
      //restart the current aniamtion
      animation.currentTime = 0;

      // get the next animation and restart it
      let nextIndex = (index + 1) % animationList.length;
      let nextAnimation = animationList[nextIndex];
      nextAnimation.currentTime = 0;
      nextAnimation.effect.target.parentElement.querySelector('.about-details .about_toggle').checked = true;
    }
  })
}

//listen for the about checkboxes to be changed by the user
document.querySelectorAll('.about-details .about_toggle').forEach(toggle => {
  toggle.addEventListener('change', () => {
    //restart all of the animations
    aboutAnimations.forEach(animation => {
      animation.currentTime = 0;
    })
  })
})

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
    // console.log(error)
    alert('We had an issue receiving your contact info. Please try again.')
    submitBtn.disabled = false;
    submitBtn.value = 'Enroll'
  });
})

//fix the height of the about section
//fix it on load
setTimeout(adjustAboutHeight, 500);
setTimeout(adjustAboutHeight, 1000);

//do it again as the screen size changes
window.addEventListener('resize', adjustAboutHeight)

async function adjustAboutHeight() {
  //set it auto to get the size we want
  aboutSection.style.height = 'auto';

  //make sure the section isn't overflowing
  const isChanging = await heightIsChanging(aboutSection);
  if (isChanging) {
    adjustAboutHeight()
  }
  else {
    aboutSection.style.height = aboutSection.clientHeight + 'px'
  }
}

async function heightIsChanging(element) {
  const firstHeight = element.clientHeight;
  await sleep(100);
  const secondHeight = element.clientHeight;
  return firstHeight != secondHeight;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function sendPracticeTestRequest(email, type, page) {
  let response = await firebase.functions().httpsCallable('home-sendPracticeTestRequest')({
    email,
    type,
    page,
    timestamp: new Date()
  });

  return response.data
}