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

//navbar section

const header = document.querySelector('header');
const heroSection = document.querySelector('.hero');
const aboutSection = document.querySelector('.about')

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

heroSectionObserver.observe(heroSection)


//turn off animation if not in view
const animationOptions = {
  threshold: 0.0
};

//hero section
const heroAnimationObserver = new IntersectionObserver((entries, animationObserver) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      console.log('hero out of view')
      document.getAnimations().forEach(animation => {
        if (entry.target.contains(animation.effect.target)) {
          animation.pause()
        }
      })
    }
    else {
      console.log('hero in view')
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
      console.log('about out of view')
      document.getAnimations().forEach(animation => {
        if (entry.target.contains(animation.effect.target)) {
          animation.pause()
        }
      })
    }
    else {
      console.log('about in view')
      document.getAnimations().forEach(animation => {
        if (entry.target.contains(animation.effect.target) && animation.effect.target.parentNode.querySelector('.about_toggle').checked) {
          animation.play()
        }
      })
    }
  })
}, animationOptions)
aboutAnimationObserver.observe(aboutSection)

//work with the about section animations
function setAboutAnimations() {
  document.getAnimations().forEach(async (animation) => {
    const animationElem = animation.effect.target;
    //make sure we have the about section animations and the details is the current open details
    if (animationElem.matches('.about-details .content') && animationElem.parentNode.querySelector('.about_toggle').checked) {
      //this is the animation we want for the about section
      try {
        await animation.finished;
        animationElem.parentElement.querySelector('.about-details .about_toggle').checked = false;
        animationElem.classList.add('remove');
        //get the index of this detail to open the next one
        let index = Array.from(animationElem.closest('.about-details').children).indexOf(animationElem.closest('.about-details > .details'));
        animationElem.closest('.about-details').children[(index + 1) % 3].querySelector('.about-details .about_toggle').checked = true;

        //make sure we have enough time for the new details to be toggled
        setTimeout(() => {
          animationElem.classList.remove('remove');
          setAboutAnimations();
        }, 2000)
      }
      catch (error) {
        // console.log(error)
      }
    }
  })
}

//wait for the animations to load
setTimeout(setAboutAnimations, 500)

//listen for the about checkboxes to be changed by the user
document.querySelectorAll('.about-details .about_toggle').forEach(toggle => {
  toggle.addEventListener('change', (event) => {
    let target = event.target;

    //prevent the user from unselecting the current toggle
    if (!target.checked) {
      target.checked = true;
    }

    //reactivate the target animation
    target.parentNode.querySelector('.content').classList.remove('remove');

    //uncheck all of the toggles and remove their animation
    document.querySelectorAll('.about-details .about_toggle').forEach(checkbox => {
      if (checkbox != target) {
        checkbox.checked = false;
        checkbox.parentNode.querySelector('.content').classList.add('remove');

        //wait a moment to reactivate the animation
        setTimeout(() => {
          checkbox.parentNode.querySelector('.content').classList.remove('remove');
        }, 500)
      }
    })

    //restart the whole animation loop
    setTimeout(setAboutAnimations, 1000)
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
    console.log(error)
    alert('We had an issue receiving your contact info. Please try again.')
    submitBtn.disabled = false;
    submitBtn.value = 'Enroll'
  });
})

//fix the height of the about section
//fix it on load
adjustAboutHeight();

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
  await sleep(50);
  const secondHeight = element.clientHeight;
  return firstHeight != secondHeight;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
