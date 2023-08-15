/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./src/Student.js ***!
  \************************/
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    window.location.replace(location.origin + `/test-taker/${user.uid}`)
  }
});
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3R1ZGVudC5qcyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQSw2REFBNkQsU0FBUztBQUN0RTtBQUNBLENBQUMsRSIsInNvdXJjZXMiOlsid2VicGFjazovL2x5cm5fd2ViX2FwcF9jbGVhbi8uL3NyYy9TdHVkZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImZpcmViYXNlLmF1dGgoKS5vbkF1dGhTdGF0ZUNoYW5nZWQoYXN5bmMgKHVzZXIpID0+IHtcclxuICBpZiAodXNlcikge1xyXG4gICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UobG9jYXRpb24ub3JpZ2luICsgYC90ZXN0LXRha2VyLyR7dXNlci51aWR9YClcclxuICB9XHJcbn0pOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==