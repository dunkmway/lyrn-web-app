function initialSetup() {
  let queryCourse = queryStrings()['course'];
  if (queryCourse) {
    openCourse(queryCourse)
  }
}

function openCourse(sectionID) {
  document.querySelectorAll('.course-section').forEach(card => {
    card.style.display = 'none';
  })

  document.getElementById(sectionID).style.display = 'flex';
}

initialSetup();