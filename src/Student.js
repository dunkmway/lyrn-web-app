firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    window.location.replace(location.origin + `/test-taker/${user.uid}`)
  }
});