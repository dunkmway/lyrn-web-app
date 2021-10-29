//work with the about section animations
function setAboutAnimations() {
  document.getAnimations().forEach(async (animation) => {
    const animationElem = animation.effect.target;
    if (animationElem.matches('.about .content')) {
      //this is the animation we want for the about section
      try {
        await animation.finished;
        animationElem.parentElement.querySelector('summary').dispatchEvent(new Event('click'));
        // wait for the details to toggle then open the next one

        setTimeout(() => {
          //get the index of this detail to open the next one
          let index = Array.from(animationElem.closest('.about').children).indexOf(animationElem.closest('.about > div'));
          animationElem.closest('.about').children[(index + 1) % 3].querySelector('summary').dispatchEvent(new Event('click'));
          //make sure we have enough time for the new details to be toggled
          setTimeout(setAboutAnimations, 5000)
        }, 400);
      }
      catch (error) {
        console.log(error)
      }
    }
  })
}

setAboutAnimations();