let currentLocation = "";
let currentLocations = [];

let current_user;

const ACT_CLASS_STUDENT_UID = '8qt0UdPAmWF4uz57VN8l';
const ACT_STUDY_GROUP_STUDENT_UID = 'JvKQhodsWZCe72iGNkmd';
const EXAMPLE_STUDENT_UID = 'uwrnhMAL2ibBjgS0KppI';

let main_calendar;
let calendar_mode = "default";
let calendar_view = 'defualt';

function initialSetupData() {
  setupExampleDailyLogButton();
  setupTestTakerButton();

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      current_user = user;
      //get the events for this tutor and display them on the calendar
      initializeDefaultCalendar([]);
      if (current_user) {
        // User is signed in.
        getTutorProfile(user.uid)
        .then((doc) => {
          if (doc.exists) {
            setTutorProfile(doc.data());
          }
          else setTutorProfile();
        })
      }
    } 
    else {
      // No user is signed in.
    }
  });
}

function setupExampleDailyLogButton() {
  document.getElementById('exampleDailyLog').addEventListener('click', () => {
    window.location.href = "../Forms/ACT Daily Log/Daily Log.html?student=" + current_user.uid;
  })
}

function setupTestTakerButton() {
  document.getElementById('testTaker').addEventListener('click', () => {
    window.location.href = "../test-taker.html?student=" + current_user.uid;
  })
}

function getEventsStaff(staffUID, start, end) {
  return firebase.firestore().collection('Events')
  .where("staff", 'array-contains', staffUID)
  .where('start', '>=', start)
  .where('start', '<', end)
  .get()
  .then((eventSnapshot) => {
    console.log('number of events grabbed:', eventSnapshot.size)
    let events = [];
    eventSnapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data();
      events.push({
        id: eventDoc.id,
        title: eventData.title,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
        allDay: eventData.allDay,
        color: eventData.color,
        textColor: eventData.textColor,
      });
    });
    return events;
  });
}

function getAvailabilityStaff(staffUID, start, end) {
  return firebase.firestore().collection('Availabilities')
  .where("staff", '==', staffUID)
  .where('start', '>=', start)
  .where('start', '<', end)
  .get()
  .then((availSnapshot) => {
    console.log('number of availabilities grabbed:', availSnapshot.size)
    let avails = [];
    availSnapshot.forEach((availDoc) => {
      const availData = availDoc.data();
      avails.push({
        id: availDoc.id,
        start: convertFromDateInt(availData.start).fullCalendar,
        end: convertFromDateInt(availData.end).fullCalendar,
        allDay: availData.allDay,
        color: availData.color,
        textColor: availData.textColor,
        display: 'background' //place availability in the background for fullCalendar
      });
    });
    return avails;
  });
}

function initializeDefaultCalendar(events, initialDate = new Date()) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  calendar_view = 'event';

  var calendarEl = document.getElementById('calendar');
  console.log(calendarEl)

  main_calendar = new FullCalendar.Calendar(calendarEl, {
    height: "100%",
    initialView: 'timeGridWeek',
    initialDate:  initialDate,
    hiddenDays: [0],
    slotMinTime: '07:00:00',
    slotMaxTime: '23:00:00',
    scrollTime: '09:00:00',
    nowIndicator: true,
    headerToolbar: {
      start:   'today prev,next',
      center: 'title',
      end:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    themeSystem: 'standard',
    // customButtons: {
    //   availability: {
    //     text: 'My Availability',
    //     click: availabilityCallback
    //   }
    // },

    datesSet: function(dateInfo) {
      if (current_user) {
        getEventsStaff(current_user.uid, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime())
        .then(events => {
          getAvailabilityStaff(current_user.uid, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime())
          .then(avails => {
            //remove the old events
            main_calendar.getEvents().forEach(event => {
              event.remove()
            });
            //add the new ones
            events.forEach(event => {
              main_calendar.addEvent(event);
            })
            //add the new ones
            avails.forEach(avail => {
              main_calendar.addEvent(avail);
            })
          })
          .catch((error) =>{
            console.log(error);
            alert("We had an issue loading the calendar events. Try refreshing the page.")
          })
        })
        .catch((error) =>{
          console.log(error);
          alert("We had an issue loading the calendar events. Try refreshing the page.")
        })
      }
    },

    eventClick: eventClickHandler,

    events: events
  });
  main_calendar.render();
}

function eventClickHandler(info) {
  getEventDoc(info.event.id)
  .then(async (doc) => {
    const data = doc.data();
    // get the attendee list
    const attendeeQuery = await doc.ref.collection('Attendees').get();
    const attendeeList = attendeeQuery.docs.map(doc => doc.data().student);

    console.log(data.type)
    switch(data.type) {
      case 'act':
      case 'actBasics':
      case 'actGuided':
        data.studentZoomURL && !isPrimaryTutor(current_user.uid, data) && window.open(data.studentZoomURL)
        data.staffZoomURL && isPrimaryTutor(current_user.uid, data) && window.open(data.staffZoomURL)
        window.location.href = "../Forms/ACT Daily Log/Daily Log.html?student=" + attendeeList[0];
        break;
      case 'actClass':
        data.studentZoomURL && !isPrimaryTutor(current_user.uid, data) && window.open(data.studentZoomURL)
        data.staffZoomURL && isPrimaryTutor(current_user.uid, data) && window.open(data.staffZoomURL)
        window.location.href = "../Forms/ACT Daily Log/Daily Log.html?student=" + ACT_CLASS_STUDENT_UID;
        break;
      case 'actStudyGroup':
      case 'actFundamentals':
      case 'actComprehensive':
      case 'subjectTutoring':
        data.studentZoomURL && !isPrimaryTutor(current_user.uid, data) && window.open(data.studentZoomURL)
        data.staffZoomURL && isPrimaryTutor(current_user.uid, data) && window.open(data.staffZoomURL)
        break;
      case 'mathProgram':
        window.location.href = "../math-program.html?student=" + attendeeList[0];
        break;
      case 'phonicsProgram':
        window.location.href = "../phonics-program.html?student=" + attendeeList[0];
        break;
      default:
    }
  })
}

function isPrimaryTutor(tutorUID, eventData) {
  return eventData.staff.indexOf(tutorUID) == 0;
}

function availabilityCallback() {
  customConfirm(
    `What would you like to do?`,
    `Update my availability`,
    `Remove my availability`,
    () => {alert('update')},
    () => {alert('remove')}
  )
}

function getEventDoc(eventID) {
  return firebase.firestore().collection('Events').doc(eventID).get()
}

function getAllLocations() {
  return firebase.firestore().collection('Locations').get()
  .then((locationSnapshot) => {
    let locationData = [];

    locationSnapshot.forEach(locationDoc => {
      locationData.push({
        id: locationDoc.id,
        name: locationDoc.data().locationName
      });
    })

    return locationData;
  })
}

// function setStudentTable() {
//   let tableData = [];
//   let promises = [];

//   //get array of location ids
//   currentLocations.forEach((location) => {
//     //query all students whose types are in the current locations array
//     promises.push(firebase.firestore().collection('Users')
//     .where('location', '==', location.id)
//     .where('roles', 'array-contains', 'student')
//     .where('status', '==', 'active')
//     .get()
//     .then((studentQuerySnapshot) => {
//       studentQuerySnapshot.forEach((studentDoc) => {
//         const studentData = studentDoc.data();

//         //convert type string to array
//         let studentTypesTable = "";
//         studentData.types.forEach((type) => {
//           switch(type) {
//             case 'act':
//               studentTypesTable += 'ACT, ';
//               break;
//             case 'subjectTutoring':
//               studentTypesTable += 'Subject-Tutoring, ';
//               break;
//             case 'mathProgram':
//               studentTypesTable += 'Math-Program, ';
//               break;
//             case 'phonicsProgram':
//               studentTypesTable += 'Phonics-Program, ';
//               break;
//             default:
//               //nothing
//           }
//         })
//         studentTypesTable = studentTypesTable.substring(0, studentTypesTable.length - 2);

//         //figure out the location name
//         let locationName = "";
//         currentLocations.forEach((location) => {
//           if (studentData.location == location.id) {
//             locationName = location.name;
//           }
//         })

//         const student = {
//           studentUID: studentDoc.id,
//           studentName: studentData.lastName + ", " + studentData.firstName,
//           studentTypes: studentData.types,
//           studentTypesTable: studentTypesTable,
//           location: locationName
//         }

//         tableData.push(student);
//       });
//     }));
//   })

//   Promise.all(promises)
//   .then(() => {
//     let studentTable = $('#student-table').DataTable( {
//       data: tableData,
//       columns: [
//         { data: 'studentName' },
//         { data: 'studentTypesTable'},
//         { data: 'location'}
//       ],
//       "scrollY": "400px",
//       "scrollCollapse": true,
//       "paging": false
//     } );
  
//     studentTable.on('click', (args) => {
//       //this should fix some "cannot read property of undefined" errors
//       if (args?.target?._DT_CellIndex) {
//         let studentUID = tableData[args.target._DT_CellIndex.row].studentUID;
//         setupNavigationModal(studentUID);
//         document.getElementById("navigationSection").style.display = "flex";
//       }
//     })

//   })
//   .catch((error) => {
//     handleFirebaseErrors(error, window.location.href);
//     console.log(error);
//   });
// }

// function setupNavigationModal(studentUID) {
//   const modal = document.getElementById("navigationSection");
//   let queryStr = "?student=" + studentUID;

//   document.getElementById("actNav").onclick = () => {
//     modal.style.display = 'none';
//     window.location.href = "../Forms/ACT Daily Log/Daily Log.html" + queryStr
//   };
//   document.getElementById("subjectTutoringNav").onclick = () => {
//     modal.style.display = 'none';
//     window.location.href = "../subject-tutoring-dash.html" + queryStr
//   };
//   document.getElementById("mathProgramNav").onclick = () => {
//     modal.style.display = 'none';
//     window.location.href = "../math-program.html" + queryStr
//   };
//   document.getElementById("phonicsProgramNav").onclick = () => {
//     modal.style.display = 'none';
//     window.location.href = "../phonics-program.html" + queryStr
//   };
// }


// function actStudentSelected(studentUID) {
//   let queryStr = "?student=" + studentUID;
//   window.location.href = "../Forms/ACT Daily Log/Daily Log.html" + queryStr;
// }

// function subjectTutoringStudentSelected(studentUID) {
//   let queryStr = "?student=" + studentUID;
//   window.location.href = "../subject-tutoring-dash.html" + queryStr;
// }

// function mathProgramSelected(studentUID) {
//   let queryStr = "?student=" + studentUID;
//   window.location.href = "../math-program.html" + queryStr;
// }

// function phonicsProgramSelected(studentUID) {
//   let queryStr = "?student=" + studentUID;
//   window.location.href = "../phonics-program.html" + queryStr;
// }

function resetPassword() {
  let confirmation = confirm("Are you sure you want to reset your password?");
  if (confirmation) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        var auth = firebase.auth();
        var emailAddress = user.email;

        auth.sendPasswordResetEmail(emailAddress)
        .then(function() {
          // Email sent.
          alert("An email has been sent to your email to continue with your password reset.");
        })
        .catch(function(error) {
          // An error happened.
          alert("There was an issue with your password reset. \nPlease try again later.");
          handleFirebaseErrors(error, window.location.href);
        });
      } else {
        // No user is signed in.
        alert("Oops! No one is signed in to change the password");
      }
    });
  }
}

function getTutorProfile(tutorUID) {
  const tutorProfileRef = firebase.firestore().collection("Users").doc(tutorUID);
  return tutorProfileRef.get();
}

function setTutorProfile(profileData = {}) {
  if (profileData['firstName'] && profileData['lastName']) {
    document.getElementById('tutor-name').textContent = "Welcome " + profileData['firstName'] + " " + profileData['lastName'] + "!";
  }
  else {
    document.getElementById('tutor-name').textContent = "Welcome Tutor!";
  }

  if (profileData['location']) {
    currentLocation = profileData['location'];
  }
}

function submitFeedback() {
  let submitBtn = document.getElementById("feedback_submit_btn");
  let errorMsg = document.getElementById("feedback_error_msg");

  submitBtn.disabled = true;
  errorMsg.textContent = "";

  let feedbackInput = document.getElementById("feedback_input");

  //check for a valid input
  if (feedbackInput.value.trim() != "") {
    let valid = confirm("Are you sure you're ready to submit this feedback?");
    if (valid) {
      const feedbackRef = firebase.firestore().collection("Feedback").doc();
      feedbackRef.set({
        user: firebase.auth().currentUser.uid,
        feedback: feedbackInput.value,
        timestamp: (new Date().getTime())
      })
      .then(() => {
        feedbackInput.value = "";
        submitBtn.disabled = false;
        errorMsg.textContent = "We got it! Thanks for the feedback";
      })
      .catch((error) => {
        handleFirebaseErrors(error, window.location.href);
        submitBtn.disabled = false;
        errorMsg.textContent = "You're feedback was too honest for the computer to process. Please try again later.";
      })
    }
  }
  else {
    document.getElementById("feedback_error_msg").textContent = "...you didn't even write anything."
    submitBtn.disabled = false;
  }
} 