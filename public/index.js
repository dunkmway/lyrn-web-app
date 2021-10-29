//work with the about section animations
function setAboutAnimations() {
  document.getAnimations().forEach(async (animation) => {
    const animationElem = animation.effect.target;
    //make sure we have the about section animations and the details is the current open details
    if (animationElem.matches('.about .content') && animationElem.parentNode.querySelector('.about_toggle').checked) {
      //this is the animation we want for the about section
      try {
        await animation.finished;
        animationElem.parentElement.querySelector('.about .about_toggle').checked = false;
        animationElem.classList.add('remove');
        //get the index of this detail to open the next one
        let index = Array.from(animationElem.closest('.about').children).indexOf(animationElem.closest('.about > .details'));
        animationElem.closest('.about').children[(index + 1) % 3].querySelector('.about .about_toggle').checked = true;

        //make sure we have enough time for the new details to be toggled
        setTimeout(() => {
          animationElem.classList.remove('remove');
          setAboutAnimations();
        }, 5000)
      }
      catch (error) {
        console.log(error)
      }
    }
  })
}

setAboutAnimations();

//listen for the about checkboxes to be changed by the user
document.querySelectorAll('.about .about_toggle').forEach(toggle => {
  toggle.addEventListener('change', (event) => {
    let target = event.target;

    //prevent the user from unselecting the current toggle
    if (!target.checked) {
      target.checked = true;
    }

    //reactivate the target animation
    target.parentNode.querySelector('.content').classList.remove('remove');

    //uncheck all of the toggles and remove their animation
    document.querySelectorAll('.about .about_toggle').forEach(checkbox => {
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