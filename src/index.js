import app from "./_firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { createAnalyticsEvent } from "./_runAnalytics";

const functions = getFunctions(app);

window.goForwardToQuestion = goForwardToQuestion;
window.goBackAQuestion = goBackAQuestion;
window.submitQuestionnaire = submitQuestionnaire;
window.resetQuestionnaire = resetQuestionnaire;
window.addEventListener('DOMContentLoaded', afterLoad);

let aboutAnimations = [];

function afterLoad() {
  aboutSetup();
  resizeQuestionnaire();
  sectionObserverSetup();
}

const aboutSection = document.querySelector('.about');

function sectionObserverSetup() {
  //navbar section

  const header = document.querySelector('header');
  const heroSection = document.querySelector('.hero');

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
}

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
  
  const sendRequest = httpsCallable(functions, 'home-sendContactRequest');
  sendRequest(data)
  .then(() => {
    event.target.reset();
    submitBtn.value = 'We got it!'
    createAnalyticsEvent({
      eventID: 'emailProvided',
      additionalData: {
        email: data.email,
        from: 'contactForm'
      }
    })
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

async function sendQuestionnaireRequest(name, phone, day, time, answers) {
  let response = await httpsCallable(functions, 'home-sendQuestionnaireRequest')({
    name,
    phone,
    day,
    time,
    answers,
    type: 'questionnaire',
    page: 'home',
    timestamp: new Date()
  });

  return response.data
}

let questionnairePath = [0];
let questionnaireAnswers = [];
const questionnaireLength = 3;

function goForwardToQuestion(nextQuestion, answer) {
  const current = document.getElementById(`question_${questionnairePath[questionnairePath.length - 1]}`).parentNode;
  const next = document.getElementById(`question_${nextQuestion}`).parentNode;

  current.classList.add('closed');
  next.classList.add('open');

  resizeQuestionnaire();

  questionnairePath.push(nextQuestion);
  questionnaireAnswers.push(answer);

  updateQuestionnaireProgress();
}

function goBackAQuestion() {
  const current = document.getElementById(`question_${questionnairePath[questionnairePath.length - 1]}`).parentNode;
  const previous = document.getElementById(`question_${questionnairePath[questionnairePath.length - 2]}`).parentNode;

  current.classList.remove('open');
  previous.classList.remove('closed');

  resizeQuestionnaire();

  questionnairePath.pop();
  questionnaireAnswers.pop();

  updateQuestionnaireProgress();
}

function resizeQuestionnaire() {
  // get the current panel
  const currentPanel = document.querySelector('#questionnaireSection .panel.open:not(.closed)');

  // determine its size
  const height = getContentHeight(currentPanel);

  // set min-height of questionnaire accordingly
  document.querySelector('#questionnaireSection').style.minHeight = (height + 48) + 'px';
}

/**
 * Get the total height of all childern in the parent 
 * @param {HTMLElement} parent element to find the content height of
 * @returns {Number} Height of content
 */
function getContentHeight(parent) {
  const childernHeight = Array.from(parent.children).reduce((pre, cur) => {
    const styles = window.getComputedStyle(cur);
    const margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);
    const height = cur.offsetHeight;
    return pre + (height + margin);
  }, 0);
  const parentStyles = window.getComputedStyle(parent);
  const parentPadding = parseFloat(parentStyles['paddingTop']) + parseFloat(parentStyles['paddingBottom']);

  return childernHeight + parentPadding;
}

function updateQuestionnaireProgress() {
  const progressNum = document.getElementById('progress_number');
  const progressFill = document.getElementById('progress_fill');

  progressNum.textContent = questionnairePath.length;
  progressFill.style.width = questionnairePath.length / questionnaireLength * 100 + '%';
}

function getAllCheckboxesFromQuestion() {
  const currentQuestion = document.getElementById(`question_${questionnairePath[questionnairePath.length - 1]}`);
  const checkboxes = currentQuestion.querySelectorAll('input[type="checkbox"]:checked');
  
  let answers = [];

  checkboxes.forEach(checkbox => answers.push(checkbox.value));

  return answers;
}

async function submitQuestionnaire() {
  const name = document.getElementById('questionnaire_name');
  const phone = document.getElementById('questionnaire_phone');
  const day = getCheckedRadio('dayOfWeek');
  const time = document.getElementById('questionnaire_time');
  const submit = document.getElementById('questionnaire_submit')
  const error = document.getElementById('questionnaire_error');

  submit.classList.add('loading');
  submit.disabled = true;

  resetErrors([name, phone, time], error);

  if (!checkRequiredFields([name, phone, time])) {
    error.textContent = 'Please fill in these required fields.';
    submit.classList.remove('loading');
    submit.disabled = false;
    return;
  }

  if (!isPhoneNumberValid(phone.value)) {
    email.classList.add('invalid');
    error.textContent = 'There seems to be something wrong with this phone number.';
    submit.classList.remove('loading');
    submit.disabled = false;
    return;
  }

  try {
    createAnalyticsEvent({
      eventID: 'phoneProvided',
      additionalData: {
        phone: phone.value,
        from: 'questionnaire'
      }
    })
    await sendQuestionnaireRequest(name.value, phone.value, day.value, time.value, questionnaireAnswers.toString().replaceAll(',', ', '));
    submit.classList.remove('loading');
    submit.disabled = false;
    goForwardToQuestion(8, { name: name.value, phone: phone.value })
  }
  catch (error) {
    error.textContent = 'We are having issues submitting this request. Please try again.';
    submit.classList.remove('loading');
    submit.disabled = false;
  }
}

function getCheckedRadio(radioName) {
  return document.querySelector(`input[name="${radioName}"]:checked`);
}

function isPhoneNumberValid(phoneNumber) {
  return /^\([0-9]{3}\)\s[0-9]{3}\-[0-9]{4}$/.test(phoneNumber);
}

function resetQuestionnaire() {
  // clear all of the inputs
  document.querySelectorAll('.questionnaire input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
  document.querySelectorAll('.questionnaire input[type="text"]').forEach(text => text.value = '');
  document.querySelectorAll('.questionnaire input[type="email"]').forEach(email => email.value = '');

  // remove all of the open and closed classes from all of the panels
  document.querySelectorAll('.questionnaire .panel').forEach(panel => {
    panel.classList.remove('open');
    panel.classList.remove('closed');
  })

  // reopen the first question
  document.getElementById('question_0').parentNode.classList.add('open');

  // reset the questionnaire state
  questionnairePath = [0];
  questionnaireAnswers = [];

  //update the progress bar
  updateQuestionnaireProgress();

}

function resetErrors(inputs, error) {
  inputs.forEach(input => {
    input.classList.remove('invalid');
  });

  error.textContent = '';
}

function checkRequiredFields(inputs) {
  let allClear = true;
  inputs.forEach(input => {
    if (!input.value) {
      input.classList.add('invalid');
      allClear = false;
    }
  })

  return allClear;
}
