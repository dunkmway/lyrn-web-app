//form submission
document.getElementById('signup').addEventListener('submit', (event) => {
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
    var user = userCredential.user;

    //update user profile
    user.updateProfile({
      displayName: registrationData.firstName.trim() + ' ' + registrationData.lastName.trim()
    })
  
    //set up their role
    const addUserRole = firebase.functions().httpsCallable('addUserRole');
    await addUserRole({ role: registrationData.role });

    //set up their user profile
    await firebase.firestore().collection('Users').doc(user.uid).set({
      firstName : registrationData.firstName.trim(),
      lastName : registrationData.lastName.trim(),
      email : registrationData.email.trim(),
      role : registrationData.role,
      location : 'WIZWBumUoo7Ywkc3pl2G' //hard coded for the online location
    })

    //set up their stripe profile
    //This happens automatically on user creation

    target.reset();
    console.log('new user uid:', user.uid)

    goToDashboard();
    
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode, errorMessage);

  });
})
