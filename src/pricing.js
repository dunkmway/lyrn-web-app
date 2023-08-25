import "./_runAnalytics";

document.addEventListener('DOMContentLoaded', initialSetup);

// to be used in the html
window.openProgram = openProgram;

function initialSetup() {
  const params = new URLSearchParams(document.location.search);

  let queryCourse = params.get('course');
  let programCourse = params.get('program');

  if (queryCourse) {
    openCourse(queryCourse)
  }

  if (programCourse) {
    document.getElementById(programCourse).dispatchEvent(new Event('click'));
  }
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
