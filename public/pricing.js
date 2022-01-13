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