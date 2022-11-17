//form submission
document.getElementById('signup').addEventListener('submit', async (event) => {
  console.log('submitting form')
  event.preventDefault();
  const target = event.target;
  const registrationData = Object.fromEntries(new FormData(target).entries())
  const errorMsg = document.getElementById('error');

  errorMsg.innerText = '';
  errorMsg.hidden = true;

  //verify that the passwords match
  if (registrationData.password != registrationData.confirmPassword) {
    errorMsg.textContent = 'Your password does not match'
    errorMsg.hidden = false;
    return;
  }

  //create the user account
  firebase.auth().createUserWithEmailAndPassword(registrationData.email.trim(), registrationData.password)
  .then(async (userCredential) => {
    // Signed in 
    const user = userCredential.user;

    //update user profile
    user.updateProfile({
      displayName: registrationData.firstName.trim() + ' ' + registrationData.lastName.trim()
    })
  
    //set up their role
    const addUserRole = firebase.functions().httpsCallable('addUserRole');
    await addUserRole({ role: 'student' });

    //set up their user profile
    await firebase.firestore().collection('Users').doc(user.uid).set({
      firstName : registrationData.firstName.trim(),
      lastName : registrationData.lastName.trim(),
      email : registrationData.email.trim(),
      role : 'student',
      location : 'WIZWBumUoo7Ywkc3pl2G' //hard coded for the online location
    })

    // refresh the user token
    await user.getIdTokenResult(true);

    target.reset();

    window.location.href = location.origin + "/Dashboard/Student";
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode, errorMessage);

    Dialog.alert(error.message)
  });
})
