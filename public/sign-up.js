//hide password functionality
document.getElementById('hidePassword').addEventListener('change', (event) => {
  const target = event.target;
  const passwordField = document.getElementById('password');

  if (target.checked) {
    passwordField.type = 'password';
  }
  else {
    passwordField.type = 'text';
  }
})

//form submission
document.getElementById('signup').addEventListener('submit', (event) => {
  event.preventDefault();
  const target = event.target;
  const registrationData = Object.fromEntries(new FormData(target).entries())

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
      role : registrationData.role
    })

    //set up their stripe profile
    //This happens automatically on user creation

    target.reset();
    
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode, errorMessage);

  });
})
