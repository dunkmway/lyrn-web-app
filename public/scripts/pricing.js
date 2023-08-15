/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./src/pricing.js ***!
  \************************/
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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpY2luZy5qcyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBLDREQUE0RCxRQUFRO0FBQ3BFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCIsInNvdXJjZXMiOlsid2VicGFjazovL2x5cm5fd2ViX2FwcF9jbGVhbi8uL3NyYy9wcmljaW5nLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0aWFsU2V0dXApO1xyXG5cclxuLy8gdG8gYmUgdXNlZCBpbiB0aGUgaHRtbFxyXG53aW5kb3cub3BlblByb2dyYW0gPSBvcGVuUHJvZ3JhbTtcclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxTZXR1cCgpIHtcclxuICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGRvY3VtZW50LmxvY2F0aW9uLnNlYXJjaCk7XHJcblxyXG4gIGxldCBxdWVyeUNvdXJzZSA9IHBhcmFtcy5nZXQoJ2NvdXJzZScpO1xyXG4gIGxldCBwcm9ncmFtQ291cnNlID0gcGFyYW1zLmdldCgncHJvZ3JhbScpO1xyXG5cclxuICBpZiAocXVlcnlDb3Vyc2UpIHtcclxuICAgIG9wZW5Db3Vyc2UocXVlcnlDb3Vyc2UpXHJcbiAgfVxyXG5cclxuICBpZiAocHJvZ3JhbUNvdXJzZSkge1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocHJvZ3JhbUNvdXJzZSkuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NsaWNrJykpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gb3BlbkNvdXJzZShzZWN0aW9uSUQpIHtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWN0aW9uSUQgKyAnLXNlY3Rpb24nKS5jaGVja2VkID0gdHJ1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gb3BlblByb2dyYW0oZXZlbnQpIHtcclxuICBjb25zdCBwcm9ncmFtID0gZXZlbnQudGFyZ2V0LmlkO1xyXG4gIGV2ZW50LnRhcmdldC5jaGVja2VkID0gdHJ1ZTtcclxuICBcclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZ3JhbScpLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKVxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBwcm9ncmFtRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5wcm9ncmFtLiR7cHJvZ3JhbX1gKVxyXG4gIHByb2dyYW1FbGVtZW50LmNsYXNzTGlzdC5hZGQoJ29wZW4nKTtcclxuICBjb25zdCBwcm9ncmFtUG9zaXRpb24gPSBwcm9ncmFtRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XHJcbiAgY29uc3Qgb2Zmc2V0UG9zaXRpb24gPSBwcm9ncmFtUG9zaXRpb24gKyB3aW5kb3cucGFnZVlPZmZzZXQgLSAod2luZG93LmlubmVyV2lkdGggPCA4MDAgPyAxMDAgOiA2MCk7XHJcbiAgd2luZG93LnNjcm9sbFRvKHtcclxuICAgIHRvcDogb2Zmc2V0UG9zaXRpb24sXHJcbiAgICBiZWhhdmlvcjogXCJzbW9vdGhcIlxyXG4gIH0pO1xyXG59XHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==