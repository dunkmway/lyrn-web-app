/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/Tutor.js ***!
  \**********************/
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
  // setupExampleDailyLogButton();

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
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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YTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUM7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9seXJuX3dlYl9hcHBfY2xlYW4vLi9zcmMvVHV0b3IuanMiXSwic291cmNlc0NvbnRlbnQiOlsibGV0IGN1cnJlbnRMb2NhdGlvbiA9IFwiXCI7XHJcbmxldCBjdXJyZW50TG9jYXRpb25zID0gW107XHJcblxyXG5sZXQgY3VycmVudF91c2VyO1xyXG5cclxuY29uc3QgQUNUX0NMQVNTX1NUVURFTlRfVUlEID0gJzhxdDBVZFBBbVdGNHV6NTdWTjhsJztcclxuY29uc3QgQUNUX1NUVURZX0dST1VQX1NUVURFTlRfVUlEID0gJ0p2S1Fob2RzV1pDZTcyaUdOa21kJztcclxuY29uc3QgRVhBTVBMRV9TVFVERU5UX1VJRCA9ICd1d3JuaE1BTDJpYkJqZ1MwS3BwSSc7XHJcblxyXG5sZXQgbWFpbl9jYWxlbmRhcjtcclxubGV0IGNhbGVuZGFyX21vZGUgPSBcImRlZmF1bHRcIjtcclxubGV0IGNhbGVuZGFyX3ZpZXcgPSAnZGVmdWFsdCc7XHJcblxyXG5mdW5jdGlvbiBpbml0aWFsU2V0dXBEYXRhKCkge1xyXG4gIC8vIHNldHVwRXhhbXBsZURhaWx5TG9nQnV0dG9uKCk7XHJcblxyXG4gIGZpcmViYXNlLmF1dGgoKS5vbkF1dGhTdGF0ZUNoYW5nZWQoZnVuY3Rpb24odXNlcikge1xyXG4gICAgaWYgKHVzZXIpIHtcclxuICAgICAgY3VycmVudF91c2VyID0gdXNlcjtcclxuICAgICAgLy9nZXQgdGhlIGV2ZW50cyBmb3IgdGhpcyB0dXRvciBhbmQgZGlzcGxheSB0aGVtIG9uIHRoZSBjYWxlbmRhclxyXG4gICAgICBpbml0aWFsaXplRGVmYXVsdENhbGVuZGFyKFtdKTtcclxuICAgICAgaWYgKGN1cnJlbnRfdXNlcikge1xyXG4gICAgICAgIC8vIFVzZXIgaXMgc2lnbmVkIGluLlxyXG4gICAgICAgIGdldFR1dG9yUHJvZmlsZSh1c2VyLnVpZClcclxuICAgICAgICAudGhlbigoZG9jKSA9PiB7XHJcbiAgICAgICAgICBpZiAoZG9jLmV4aXN0cykge1xyXG4gICAgICAgICAgICBzZXRUdXRvclByb2ZpbGUoZG9jLmRhdGEoKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHNldFR1dG9yUHJvZmlsZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0gXHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gTm8gdXNlciBpcyBzaWduZWQgaW4uXHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldHVwRXhhbXBsZURhaWx5TG9nQnV0dG9uKCkge1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdleGFtcGxlRGFpbHlMb2cnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuLi9Gb3Jtcy9BQ1QgRGFpbHkgTG9nL0RhaWx5IExvZy5odG1sP3N0dWRlbnQ9XCIgKyBjdXJyZW50X3VzZXIudWlkO1xyXG4gIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldHVwVGVzdFRha2VyQnV0dG9uKCkge1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0ZXN0VGFrZXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuLi90ZXN0LXRha2VyLmh0bWw/c3R1ZGVudD1cIiArIGN1cnJlbnRfdXNlci51aWQ7XHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RXZlbnRzU3RhZmYoc3RhZmZVSUQsIHN0YXJ0LCBlbmQpIHtcclxuICByZXR1cm4gZmlyZWJhc2UuZmlyZXN0b3JlKCkuY29sbGVjdGlvbignRXZlbnRzJylcclxuICAud2hlcmUoXCJzdGFmZlwiLCAnYXJyYXktY29udGFpbnMnLCBzdGFmZlVJRClcclxuICAud2hlcmUoJ3N0YXJ0JywgJz49Jywgc3RhcnQpXHJcbiAgLndoZXJlKCdzdGFydCcsICc8JywgZW5kKVxyXG4gIC5nZXQoKVxyXG4gIC50aGVuKChldmVudFNuYXBzaG90KSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnbnVtYmVyIG9mIGV2ZW50cyBncmFiYmVkOicsIGV2ZW50U25hcHNob3Quc2l6ZSlcclxuICAgIGxldCBldmVudHMgPSBbXTtcclxuICAgIGV2ZW50U25hcHNob3QuZm9yRWFjaCgoZXZlbnREb2MpID0+IHtcclxuICAgICAgY29uc3QgZXZlbnREYXRhID0gZXZlbnREb2MuZGF0YSgpO1xyXG4gICAgICBldmVudHMucHVzaCh7XHJcbiAgICAgICAgaWQ6IGV2ZW50RG9jLmlkLFxyXG4gICAgICAgIHRpdGxlOiBldmVudERhdGEudGl0bGUsXHJcbiAgICAgICAgc3RhcnQ6IGNvbnZlcnRGcm9tRGF0ZUludChldmVudERhdGEuc3RhcnQpLmZ1bGxDYWxlbmRhcixcclxuICAgICAgICBlbmQ6IGNvbnZlcnRGcm9tRGF0ZUludChldmVudERhdGEuZW5kKS5mdWxsQ2FsZW5kYXIsXHJcbiAgICAgICAgYWxsRGF5OiBldmVudERhdGEuYWxsRGF5LFxyXG4gICAgICAgIGNvbG9yOiBldmVudERhdGEuY29sb3IsXHJcbiAgICAgICAgdGV4dENvbG9yOiBldmVudERhdGEudGV4dENvbG9yLFxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGV2ZW50cztcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QXZhaWxhYmlsaXR5U3RhZmYoc3RhZmZVSUQsIHN0YXJ0LCBlbmQpIHtcclxuICByZXR1cm4gZmlyZWJhc2UuZmlyZXN0b3JlKCkuY29sbGVjdGlvbignQXZhaWxhYmlsaXRpZXMnKVxyXG4gIC53aGVyZShcInN0YWZmXCIsICc9PScsIHN0YWZmVUlEKVxyXG4gIC53aGVyZSgnc3RhcnQnLCAnPj0nLCBzdGFydClcclxuICAud2hlcmUoJ3N0YXJ0JywgJzwnLCBlbmQpXHJcbiAgLmdldCgpXHJcbiAgLnRoZW4oKGF2YWlsU25hcHNob3QpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdudW1iZXIgb2YgYXZhaWxhYmlsaXRpZXMgZ3JhYmJlZDonLCBhdmFpbFNuYXBzaG90LnNpemUpXHJcbiAgICBsZXQgYXZhaWxzID0gW107XHJcbiAgICBhdmFpbFNuYXBzaG90LmZvckVhY2goKGF2YWlsRG9jKSA9PiB7XHJcbiAgICAgIGNvbnN0IGF2YWlsRGF0YSA9IGF2YWlsRG9jLmRhdGEoKTtcclxuICAgICAgYXZhaWxzLnB1c2goe1xyXG4gICAgICAgIGlkOiBhdmFpbERvYy5pZCxcclxuICAgICAgICBzdGFydDogY29udmVydEZyb21EYXRlSW50KGF2YWlsRGF0YS5zdGFydCkuZnVsbENhbGVuZGFyLFxyXG4gICAgICAgIGVuZDogY29udmVydEZyb21EYXRlSW50KGF2YWlsRGF0YS5lbmQpLmZ1bGxDYWxlbmRhcixcclxuICAgICAgICBhbGxEYXk6IGF2YWlsRGF0YS5hbGxEYXksXHJcbiAgICAgICAgY29sb3I6IGF2YWlsRGF0YS5jb2xvcixcclxuICAgICAgICB0ZXh0Q29sb3I6IGF2YWlsRGF0YS50ZXh0Q29sb3IsXHJcbiAgICAgICAgZGlzcGxheTogJ2JhY2tncm91bmQnIC8vcGxhY2UgYXZhaWxhYmlsaXR5IGluIHRoZSBiYWNrZ3JvdW5kIGZvciBmdWxsQ2FsZW5kYXJcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBhdmFpbHM7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVEZWZhdWx0Q2FsZW5kYXIoZXZlbnRzLCBpbml0aWFsRGF0ZSA9IG5ldyBEYXRlKCkpIHtcclxuICBpZiAobWFpbl9jYWxlbmRhcikge1xyXG4gICAgbWFpbl9jYWxlbmRhci5kZXN0cm95KCk7XHJcbiAgfVxyXG5cclxuICBjYWxlbmRhcl92aWV3ID0gJ2V2ZW50JztcclxuXHJcbiAgdmFyIGNhbGVuZGFyRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FsZW5kYXInKTtcclxuICBjb25zb2xlLmxvZyhjYWxlbmRhckVsKVxyXG5cclxuICBtYWluX2NhbGVuZGFyID0gbmV3IEZ1bGxDYWxlbmRhci5DYWxlbmRhcihjYWxlbmRhckVsLCB7XHJcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxyXG4gICAgaW5pdGlhbFZpZXc6ICd0aW1lR3JpZFdlZWsnLFxyXG4gICAgaW5pdGlhbERhdGU6ICBpbml0aWFsRGF0ZSxcclxuICAgIGhpZGRlbkRheXM6IFswXSxcclxuICAgIHNsb3RNaW5UaW1lOiAnMDc6MDA6MDAnLFxyXG4gICAgc2xvdE1heFRpbWU6ICcyMzowMDowMCcsXHJcbiAgICBzY3JvbGxUaW1lOiAnMDk6MDA6MDAnLFxyXG4gICAgbm93SW5kaWNhdG9yOiB0cnVlLFxyXG4gICAgaGVhZGVyVG9vbGJhcjoge1xyXG4gICAgICBzdGFydDogICAndG9kYXkgcHJldixuZXh0JyxcclxuICAgICAgY2VudGVyOiAndGl0bGUnLFxyXG4gICAgICBlbmQ6ICAnZGF5R3JpZE1vbnRoLHRpbWVHcmlkV2Vlayx0aW1lR3JpZERheSdcclxuICAgIH0sXHJcbiAgICB0aGVtZVN5c3RlbTogJ3N0YW5kYXJkJyxcclxuICAgIC8vIGN1c3RvbUJ1dHRvbnM6IHtcclxuICAgIC8vICAgYXZhaWxhYmlsaXR5OiB7XHJcbiAgICAvLyAgICAgdGV4dDogJ015IEF2YWlsYWJpbGl0eScsXHJcbiAgICAvLyAgICAgY2xpY2s6IGF2YWlsYWJpbGl0eUNhbGxiYWNrXHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH0sXHJcblxyXG4gICAgZGF0ZXNTZXQ6IGZ1bmN0aW9uKGRhdGVJbmZvKSB7XHJcbiAgICAgIGlmIChjdXJyZW50X3VzZXIpIHtcclxuICAgICAgICBnZXRFdmVudHNTdGFmZihjdXJyZW50X3VzZXIudWlkLCBtYWluX2NhbGVuZGFyLnZpZXcuYWN0aXZlU3RhcnQuZ2V0VGltZSgpLCBtYWluX2NhbGVuZGFyLnZpZXcuYWN0aXZlRW5kLmdldFRpbWUoKSlcclxuICAgICAgICAudGhlbihldmVudHMgPT4ge1xyXG4gICAgICAgICAgZ2V0QXZhaWxhYmlsaXR5U3RhZmYoY3VycmVudF91c2VyLnVpZCwgbWFpbl9jYWxlbmRhci52aWV3LmFjdGl2ZVN0YXJ0LmdldFRpbWUoKSwgbWFpbl9jYWxlbmRhci52aWV3LmFjdGl2ZUVuZC5nZXRUaW1lKCkpXHJcbiAgICAgICAgICAudGhlbihhdmFpbHMgPT4ge1xyXG4gICAgICAgICAgICAvL3JlbW92ZSB0aGUgb2xkIGV2ZW50c1xyXG4gICAgICAgICAgICBtYWluX2NhbGVuZGFyLmdldEV2ZW50cygpLmZvckVhY2goZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgIGV2ZW50LnJlbW92ZSgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvL2FkZCB0aGUgbmV3IG9uZXNcclxuICAgICAgICAgICAgZXZlbnRzLmZvckVhY2goZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgIG1haW5fY2FsZW5kYXIuYWRkRXZlbnQoZXZlbnQpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAvL2FkZCB0aGUgbmV3IG9uZXNcclxuICAgICAgICAgICAgYXZhaWxzLmZvckVhY2goYXZhaWwgPT4ge1xyXG4gICAgICAgICAgICAgIG1haW5fY2FsZW5kYXIuYWRkRXZlbnQoYXZhaWwpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+e1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiV2UgaGFkIGFuIGlzc3VlIGxvYWRpbmcgdGhlIGNhbGVuZGFyIGV2ZW50cy4gVHJ5IHJlZnJlc2hpbmcgdGhlIHBhZ2UuXCIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT57XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgICBhbGVydChcIldlIGhhZCBhbiBpc3N1ZSBsb2FkaW5nIHRoZSBjYWxlbmRhciBldmVudHMuIFRyeSByZWZyZXNoaW5nIHRoZSBwYWdlLlwiKVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZXZlbnRDbGljazogZXZlbnRDbGlja0hhbmRsZXIsXHJcblxyXG4gICAgZXZlbnRzOiBldmVudHNcclxuICB9KTtcclxuICBtYWluX2NhbGVuZGFyLnJlbmRlcigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBldmVudENsaWNrSGFuZGxlcihpbmZvKSB7XHJcbiAgZ2V0RXZlbnREb2MoaW5mby5ldmVudC5pZClcclxuICAudGhlbihhc3luYyAoZG9jKSA9PiB7XHJcbiAgICBjb25zdCBkYXRhID0gZG9jLmRhdGEoKTtcclxuICAgIC8vIGdldCB0aGUgYXR0ZW5kZWUgbGlzdFxyXG4gICAgY29uc3QgYXR0ZW5kZWVRdWVyeSA9IGF3YWl0IGRvYy5yZWYuY29sbGVjdGlvbignQXR0ZW5kZWVzJykuZ2V0KCk7XHJcbiAgICBjb25zdCBhdHRlbmRlZUxpc3QgPSBhdHRlbmRlZVF1ZXJ5LmRvY3MubWFwKGRvYyA9PiBkb2MuZGF0YSgpLnN0dWRlbnQpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGRhdGEudHlwZSlcclxuICAgIHN3aXRjaChkYXRhLnR5cGUpIHtcclxuICAgICAgY2FzZSAnYWN0JzpcclxuICAgICAgY2FzZSAnYWN0QmFzaWNzJzpcclxuICAgICAgY2FzZSAnYWN0R3VpZGVkJzpcclxuICAgICAgICBkYXRhLnN0dWRlbnRab29tVVJMICYmICFpc1ByaW1hcnlUdXRvcihjdXJyZW50X3VzZXIudWlkLCBkYXRhKSAmJiB3aW5kb3cub3BlbihkYXRhLnN0dWRlbnRab29tVVJMKVxyXG4gICAgICAgIGRhdGEuc3RhZmZab29tVVJMICYmIGlzUHJpbWFyeVR1dG9yKGN1cnJlbnRfdXNlci51aWQsIGRhdGEpICYmIHdpbmRvdy5vcGVuKGRhdGEuc3RhZmZab29tVVJMKVxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuLi9Gb3Jtcy9BQ1QgRGFpbHkgTG9nL0RhaWx5IExvZy5odG1sP3N0dWRlbnQ9XCIgKyBhdHRlbmRlZUxpc3RbMF07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ2FjdENsYXNzJzpcclxuICAgICAgICBkYXRhLnN0dWRlbnRab29tVVJMICYmICFpc1ByaW1hcnlUdXRvcihjdXJyZW50X3VzZXIudWlkLCBkYXRhKSAmJiB3aW5kb3cub3BlbihkYXRhLnN0dWRlbnRab29tVVJMKVxyXG4gICAgICAgIGRhdGEuc3RhZmZab29tVVJMICYmIGlzUHJpbWFyeVR1dG9yKGN1cnJlbnRfdXNlci51aWQsIGRhdGEpICYmIHdpbmRvdy5vcGVuKGRhdGEuc3RhZmZab29tVVJMKVxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuLi9Gb3Jtcy9BQ1QgRGFpbHkgTG9nL0RhaWx5IExvZy5odG1sP3N0dWRlbnQ9XCIgKyBBQ1RfQ0xBU1NfU1RVREVOVF9VSUQ7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ2FjdFN0dWR5R3JvdXAnOlxyXG4gICAgICBjYXNlICdhY3RGdW5kYW1lbnRhbHMnOlxyXG4gICAgICBjYXNlICdhY3RDb21wcmVoZW5zaXZlJzpcclxuICAgICAgY2FzZSAnc3ViamVjdFR1dG9yaW5nJzpcclxuICAgICAgICBkYXRhLnN0dWRlbnRab29tVVJMICYmICFpc1ByaW1hcnlUdXRvcihjdXJyZW50X3VzZXIudWlkLCBkYXRhKSAmJiB3aW5kb3cub3BlbihkYXRhLnN0dWRlbnRab29tVVJMKVxyXG4gICAgICAgIGRhdGEuc3RhZmZab29tVVJMICYmIGlzUHJpbWFyeVR1dG9yKGN1cnJlbnRfdXNlci51aWQsIGRhdGEpICYmIHdpbmRvdy5vcGVuKGRhdGEuc3RhZmZab29tVVJMKVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdtYXRoUHJvZ3JhbSc6XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi4uL21hdGgtcHJvZ3JhbS5odG1sP3N0dWRlbnQ9XCIgKyBhdHRlbmRlZUxpc3RbMF07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3Bob25pY3NQcm9ncmFtJzpcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiLi4vcGhvbmljcy1wcm9ncmFtLmh0bWw/c3R1ZGVudD1cIiArIGF0dGVuZGVlTGlzdFswXTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgIH1cclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBpc1ByaW1hcnlUdXRvcih0dXRvclVJRCwgZXZlbnREYXRhKSB7XHJcbiAgcmV0dXJuIGV2ZW50RGF0YS5zdGFmZi5pbmRleE9mKHR1dG9yVUlEKSA9PSAwO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhdmFpbGFiaWxpdHlDYWxsYmFjaygpIHtcclxuICBjdXN0b21Db25maXJtKFxyXG4gICAgYFdoYXQgd291bGQgeW91IGxpa2UgdG8gZG8/YCxcclxuICAgIGBVcGRhdGUgbXkgYXZhaWxhYmlsaXR5YCxcclxuICAgIGBSZW1vdmUgbXkgYXZhaWxhYmlsaXR5YCxcclxuICAgICgpID0+IHthbGVydCgndXBkYXRlJyl9LFxyXG4gICAgKCkgPT4ge2FsZXJ0KCdyZW1vdmUnKX1cclxuICApXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEV2ZW50RG9jKGV2ZW50SUQpIHtcclxuICByZXR1cm4gZmlyZWJhc2UuZmlyZXN0b3JlKCkuY29sbGVjdGlvbignRXZlbnRzJykuZG9jKGV2ZW50SUQpLmdldCgpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEFsbExvY2F0aW9ucygpIHtcclxuICByZXR1cm4gZmlyZWJhc2UuZmlyZXN0b3JlKCkuY29sbGVjdGlvbignTG9jYXRpb25zJykuZ2V0KClcclxuICAudGhlbigobG9jYXRpb25TbmFwc2hvdCkgPT4ge1xyXG4gICAgbGV0IGxvY2F0aW9uRGF0YSA9IFtdO1xyXG5cclxuICAgIGxvY2F0aW9uU25hcHNob3QuZm9yRWFjaChsb2NhdGlvbkRvYyA9PiB7XHJcbiAgICAgIGxvY2F0aW9uRGF0YS5wdXNoKHtcclxuICAgICAgICBpZDogbG9jYXRpb25Eb2MuaWQsXHJcbiAgICAgICAgbmFtZTogbG9jYXRpb25Eb2MuZGF0YSgpLmxvY2F0aW9uTmFtZVxyXG4gICAgICB9KTtcclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIGxvY2F0aW9uRGF0YTtcclxuICB9KVxyXG59XHJcblxyXG4vLyBmdW5jdGlvbiBzZXRTdHVkZW50VGFibGUoKSB7XHJcbi8vICAgbGV0IHRhYmxlRGF0YSA9IFtdO1xyXG4vLyAgIGxldCBwcm9taXNlcyA9IFtdO1xyXG5cclxuLy8gICAvL2dldCBhcnJheSBvZiBsb2NhdGlvbiBpZHNcclxuLy8gICBjdXJyZW50TG9jYXRpb25zLmZvckVhY2goKGxvY2F0aW9uKSA9PiB7XHJcbi8vICAgICAvL3F1ZXJ5IGFsbCBzdHVkZW50cyB3aG9zZSB0eXBlcyBhcmUgaW4gdGhlIGN1cnJlbnQgbG9jYXRpb25zIGFycmF5XHJcbi8vICAgICBwcm9taXNlcy5wdXNoKGZpcmViYXNlLmZpcmVzdG9yZSgpLmNvbGxlY3Rpb24oJ1VzZXJzJylcclxuLy8gICAgIC53aGVyZSgnbG9jYXRpb24nLCAnPT0nLCBsb2NhdGlvbi5pZClcclxuLy8gICAgIC53aGVyZSgncm9sZXMnLCAnYXJyYXktY29udGFpbnMnLCAnc3R1ZGVudCcpXHJcbi8vICAgICAud2hlcmUoJ3N0YXR1cycsICc9PScsICdhY3RpdmUnKVxyXG4vLyAgICAgLmdldCgpXHJcbi8vICAgICAudGhlbigoc3R1ZGVudFF1ZXJ5U25hcHNob3QpID0+IHtcclxuLy8gICAgICAgc3R1ZGVudFF1ZXJ5U25hcHNob3QuZm9yRWFjaCgoc3R1ZGVudERvYykgPT4ge1xyXG4vLyAgICAgICAgIGNvbnN0IHN0dWRlbnREYXRhID0gc3R1ZGVudERvYy5kYXRhKCk7XHJcblxyXG4vLyAgICAgICAgIC8vY29udmVydCB0eXBlIHN0cmluZyB0byBhcnJheVxyXG4vLyAgICAgICAgIGxldCBzdHVkZW50VHlwZXNUYWJsZSA9IFwiXCI7XHJcbi8vICAgICAgICAgc3R1ZGVudERhdGEudHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xyXG4vLyAgICAgICAgICAgc3dpdGNoKHR5cGUpIHtcclxuLy8gICAgICAgICAgICAgY2FzZSAnYWN0JzpcclxuLy8gICAgICAgICAgICAgICBzdHVkZW50VHlwZXNUYWJsZSArPSAnQUNULCAnO1xyXG4vLyAgICAgICAgICAgICAgIGJyZWFrO1xyXG4vLyAgICAgICAgICAgICBjYXNlICdzdWJqZWN0VHV0b3JpbmcnOlxyXG4vLyAgICAgICAgICAgICAgIHN0dWRlbnRUeXBlc1RhYmxlICs9ICdTdWJqZWN0LVR1dG9yaW5nLCAnO1xyXG4vLyAgICAgICAgICAgICAgIGJyZWFrO1xyXG4vLyAgICAgICAgICAgICBjYXNlICdtYXRoUHJvZ3JhbSc6XHJcbi8vICAgICAgICAgICAgICAgc3R1ZGVudFR5cGVzVGFibGUgKz0gJ01hdGgtUHJvZ3JhbSwgJztcclxuLy8gICAgICAgICAgICAgICBicmVhaztcclxuLy8gICAgICAgICAgICAgY2FzZSAncGhvbmljc1Byb2dyYW0nOlxyXG4vLyAgICAgICAgICAgICAgIHN0dWRlbnRUeXBlc1RhYmxlICs9ICdQaG9uaWNzLVByb2dyYW0sICc7XHJcbi8vICAgICAgICAgICAgICAgYnJlYWs7XHJcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbi8vICAgICAgICAgICAgICAgLy9ub3RoaW5nXHJcbi8vICAgICAgICAgICB9XHJcbi8vICAgICAgICAgfSlcclxuLy8gICAgICAgICBzdHVkZW50VHlwZXNUYWJsZSA9IHN0dWRlbnRUeXBlc1RhYmxlLnN1YnN0cmluZygwLCBzdHVkZW50VHlwZXNUYWJsZS5sZW5ndGggLSAyKTtcclxuXHJcbi8vICAgICAgICAgLy9maWd1cmUgb3V0IHRoZSBsb2NhdGlvbiBuYW1lXHJcbi8vICAgICAgICAgbGV0IGxvY2F0aW9uTmFtZSA9IFwiXCI7XHJcbi8vICAgICAgICAgY3VycmVudExvY2F0aW9ucy5mb3JFYWNoKChsb2NhdGlvbikgPT4ge1xyXG4vLyAgICAgICAgICAgaWYgKHN0dWRlbnREYXRhLmxvY2F0aW9uID09IGxvY2F0aW9uLmlkKSB7XHJcbi8vICAgICAgICAgICAgIGxvY2F0aW9uTmFtZSA9IGxvY2F0aW9uLm5hbWU7XHJcbi8vICAgICAgICAgICB9XHJcbi8vICAgICAgICAgfSlcclxuXHJcbi8vICAgICAgICAgY29uc3Qgc3R1ZGVudCA9IHtcclxuLy8gICAgICAgICAgIHN0dWRlbnRVSUQ6IHN0dWRlbnREb2MuaWQsXHJcbi8vICAgICAgICAgICBzdHVkZW50TmFtZTogc3R1ZGVudERhdGEubGFzdE5hbWUgKyBcIiwgXCIgKyBzdHVkZW50RGF0YS5maXJzdE5hbWUsXHJcbi8vICAgICAgICAgICBzdHVkZW50VHlwZXM6IHN0dWRlbnREYXRhLnR5cGVzLFxyXG4vLyAgICAgICAgICAgc3R1ZGVudFR5cGVzVGFibGU6IHN0dWRlbnRUeXBlc1RhYmxlLFxyXG4vLyAgICAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uTmFtZVxyXG4vLyAgICAgICAgIH1cclxuXHJcbi8vICAgICAgICAgdGFibGVEYXRhLnB1c2goc3R1ZGVudCk7XHJcbi8vICAgICAgIH0pO1xyXG4vLyAgICAgfSkpO1xyXG4vLyAgIH0pXHJcblxyXG4vLyAgIFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4vLyAgIC50aGVuKCgpID0+IHtcclxuLy8gICAgIGxldCBzdHVkZW50VGFibGUgPSAkKCcjc3R1ZGVudC10YWJsZScpLkRhdGFUYWJsZSgge1xyXG4vLyAgICAgICBkYXRhOiB0YWJsZURhdGEsXHJcbi8vICAgICAgIGNvbHVtbnM6IFtcclxuLy8gICAgICAgICB7IGRhdGE6ICdzdHVkZW50TmFtZScgfSxcclxuLy8gICAgICAgICB7IGRhdGE6ICdzdHVkZW50VHlwZXNUYWJsZSd9LFxyXG4vLyAgICAgICAgIHsgZGF0YTogJ2xvY2F0aW9uJ31cclxuLy8gICAgICAgXSxcclxuLy8gICAgICAgXCJzY3JvbGxZXCI6IFwiNDAwcHhcIixcclxuLy8gICAgICAgXCJzY3JvbGxDb2xsYXBzZVwiOiB0cnVlLFxyXG4vLyAgICAgICBcInBhZ2luZ1wiOiBmYWxzZVxyXG4vLyAgICAgfSApO1xyXG4gIFxyXG4vLyAgICAgc3R1ZGVudFRhYmxlLm9uKCdjbGljaycsIChhcmdzKSA9PiB7XHJcbi8vICAgICAgIC8vdGhpcyBzaG91bGQgZml4IHNvbWUgXCJjYW5ub3QgcmVhZCBwcm9wZXJ0eSBvZiB1bmRlZmluZWRcIiBlcnJvcnNcclxuLy8gICAgICAgaWYgKGFyZ3M/LnRhcmdldD8uX0RUX0NlbGxJbmRleCkge1xyXG4vLyAgICAgICAgIGxldCBzdHVkZW50VUlEID0gdGFibGVEYXRhW2FyZ3MudGFyZ2V0Ll9EVF9DZWxsSW5kZXgucm93XS5zdHVkZW50VUlEO1xyXG4vLyAgICAgICAgIHNldHVwTmF2aWdhdGlvbk1vZGFsKHN0dWRlbnRVSUQpO1xyXG4vLyAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2aWdhdGlvblNlY3Rpb25cIikuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xyXG4vLyAgICAgICB9XHJcbi8vICAgICB9KVxyXG5cclxuLy8gICB9KVxyXG4vLyAgIC5jYXRjaCgoZXJyb3IpID0+IHtcclxuLy8gICAgIGhhbmRsZUZpcmViYXNlRXJyb3JzKGVycm9yLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbi8vICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbi8vICAgfSk7XHJcbi8vIH1cclxuXHJcbi8vIGZ1bmN0aW9uIHNldHVwTmF2aWdhdGlvbk1vZGFsKHN0dWRlbnRVSUQpIHtcclxuLy8gICBjb25zdCBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2aWdhdGlvblNlY3Rpb25cIik7XHJcbi8vICAgbGV0IHF1ZXJ5U3RyID0gXCI/c3R1ZGVudD1cIiArIHN0dWRlbnRVSUQ7XHJcblxyXG4vLyAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWN0TmF2XCIpLm9uY2xpY2sgPSAoKSA9PiB7XHJcbi8vICAgICBtb2RhbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4vLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi4uL0Zvcm1zL0FDVCBEYWlseSBMb2cvRGFpbHkgTG9nLmh0bWxcIiArIHF1ZXJ5U3RyXHJcbi8vICAgfTtcclxuLy8gICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN1YmplY3RUdXRvcmluZ05hdlwiKS5vbmNsaWNrID0gKCkgPT4ge1xyXG4vLyAgICAgbW9kYWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuLy8gICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuLi9zdWJqZWN0LXR1dG9yaW5nLWRhc2guaHRtbFwiICsgcXVlcnlTdHJcclxuLy8gICB9O1xyXG4vLyAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWF0aFByb2dyYW1OYXZcIikub25jbGljayA9ICgpID0+IHtcclxuLy8gICAgIG1vZGFsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbi8vICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiLi4vbWF0aC1wcm9ncmFtLmh0bWxcIiArIHF1ZXJ5U3RyXHJcbi8vICAgfTtcclxuLy8gICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBob25pY3NQcm9ncmFtTmF2XCIpLm9uY2xpY2sgPSAoKSA9PiB7XHJcbi8vICAgICBtb2RhbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4vLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi4uL3Bob25pY3MtcHJvZ3JhbS5odG1sXCIgKyBxdWVyeVN0clxyXG4vLyAgIH07XHJcbi8vIH1cclxuXHJcblxyXG4vLyBmdW5jdGlvbiBhY3RTdHVkZW50U2VsZWN0ZWQoc3R1ZGVudFVJRCkge1xyXG4vLyAgIGxldCBxdWVyeVN0ciA9IFwiP3N0dWRlbnQ9XCIgKyBzdHVkZW50VUlEO1xyXG4vLyAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuLi9Gb3Jtcy9BQ1QgRGFpbHkgTG9nL0RhaWx5IExvZy5odG1sXCIgKyBxdWVyeVN0cjtcclxuLy8gfVxyXG5cclxuLy8gZnVuY3Rpb24gc3ViamVjdFR1dG9yaW5nU3R1ZGVudFNlbGVjdGVkKHN0dWRlbnRVSUQpIHtcclxuLy8gICBsZXQgcXVlcnlTdHIgPSBcIj9zdHVkZW50PVwiICsgc3R1ZGVudFVJRDtcclxuLy8gICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiLi4vc3ViamVjdC10dXRvcmluZy1kYXNoLmh0bWxcIiArIHF1ZXJ5U3RyO1xyXG4vLyB9XHJcblxyXG4vLyBmdW5jdGlvbiBtYXRoUHJvZ3JhbVNlbGVjdGVkKHN0dWRlbnRVSUQpIHtcclxuLy8gICBsZXQgcXVlcnlTdHIgPSBcIj9zdHVkZW50PVwiICsgc3R1ZGVudFVJRDtcclxuLy8gICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiLi4vbWF0aC1wcm9ncmFtLmh0bWxcIiArIHF1ZXJ5U3RyO1xyXG4vLyB9XHJcblxyXG4vLyBmdW5jdGlvbiBwaG9uaWNzUHJvZ3JhbVNlbGVjdGVkKHN0dWRlbnRVSUQpIHtcclxuLy8gICBsZXQgcXVlcnlTdHIgPSBcIj9zdHVkZW50PVwiICsgc3R1ZGVudFVJRDtcclxuLy8gICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiLi4vcGhvbmljcy1wcm9ncmFtLmh0bWxcIiArIHF1ZXJ5U3RyO1xyXG4vLyB9XHJcblxyXG5mdW5jdGlvbiByZXNldFBhc3N3b3JkKCkge1xyXG4gIGxldCBjb25maXJtYXRpb24gPSBjb25maXJtKFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlc2V0IHlvdXIgcGFzc3dvcmQ/XCIpO1xyXG4gIGlmIChjb25maXJtYXRpb24pIHtcclxuICAgIGZpcmViYXNlLmF1dGgoKS5vbkF1dGhTdGF0ZUNoYW5nZWQoZnVuY3Rpb24odXNlcikge1xyXG4gICAgICBpZiAodXNlcikge1xyXG4gICAgICAgIHZhciBhdXRoID0gZmlyZWJhc2UuYXV0aCgpO1xyXG4gICAgICAgIHZhciBlbWFpbEFkZHJlc3MgPSB1c2VyLmVtYWlsO1xyXG5cclxuICAgICAgICBhdXRoLnNlbmRQYXNzd29yZFJlc2V0RW1haWwoZW1haWxBZGRyZXNzKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgLy8gRW1haWwgc2VudC5cclxuICAgICAgICAgIGFsZXJ0KFwiQW4gZW1haWwgaGFzIGJlZW4gc2VudCB0byB5b3VyIGVtYWlsIHRvIGNvbnRpbnVlIHdpdGggeW91ciBwYXNzd29yZCByZXNldC5cIik7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICAgIC8vIEFuIGVycm9yIGhhcHBlbmVkLlxyXG4gICAgICAgICAgYWxlcnQoXCJUaGVyZSB3YXMgYW4gaXNzdWUgd2l0aCB5b3VyIHBhc3N3b3JkIHJlc2V0LiBcXG5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiKTtcclxuICAgICAgICAgIGhhbmRsZUZpcmViYXNlRXJyb3JzKGVycm9yLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm8gdXNlciBpcyBzaWduZWQgaW4uXHJcbiAgICAgICAgYWxlcnQoXCJPb3BzISBObyBvbmUgaXMgc2lnbmVkIGluIHRvIGNoYW5nZSB0aGUgcGFzc3dvcmRcIik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VHV0b3JQcm9maWxlKHR1dG9yVUlEKSB7XHJcbiAgY29uc3QgdHV0b3JQcm9maWxlUmVmID0gZmlyZWJhc2UuZmlyZXN0b3JlKCkuY29sbGVjdGlvbihcIlVzZXJzXCIpLmRvYyh0dXRvclVJRCk7XHJcbiAgcmV0dXJuIHR1dG9yUHJvZmlsZVJlZi5nZXQoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VHV0b3JQcm9maWxlKHByb2ZpbGVEYXRhID0ge30pIHtcclxuICBpZiAocHJvZmlsZURhdGFbJ2ZpcnN0TmFtZSddICYmIHByb2ZpbGVEYXRhWydsYXN0TmFtZSddKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHV0b3ItbmFtZScpLnRleHRDb250ZW50ID0gXCJXZWxjb21lIFwiICsgcHJvZmlsZURhdGFbJ2ZpcnN0TmFtZSddICsgXCIgXCIgKyBwcm9maWxlRGF0YVsnbGFzdE5hbWUnXSArIFwiIVwiO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0dXRvci1uYW1lJykudGV4dENvbnRlbnQgPSBcIldlbGNvbWUgVHV0b3IhXCI7XHJcbiAgfVxyXG5cclxuICBpZiAocHJvZmlsZURhdGFbJ2xvY2F0aW9uJ10pIHtcclxuICAgIGN1cnJlbnRMb2NhdGlvbiA9IHByb2ZpbGVEYXRhWydsb2NhdGlvbiddO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc3VibWl0RmVlZGJhY2soKSB7XHJcbiAgbGV0IHN1Ym1pdEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2tfc3VibWl0X2J0blwiKTtcclxuICBsZXQgZXJyb3JNc2cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrX2Vycm9yX21zZ1wiKTtcclxuXHJcbiAgc3VibWl0QnRuLmRpc2FibGVkID0gdHJ1ZTtcclxuICBlcnJvck1zZy50ZXh0Q29udGVudCA9IFwiXCI7XHJcblxyXG4gIGxldCBmZWVkYmFja0lucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFja19pbnB1dFwiKTtcclxuXHJcbiAgLy9jaGVjayBmb3IgYSB2YWxpZCBpbnB1dFxyXG4gIGlmIChmZWVkYmFja0lucHV0LnZhbHVlLnRyaW0oKSAhPSBcIlwiKSB7XHJcbiAgICBsZXQgdmFsaWQgPSBjb25maXJtKFwiQXJlIHlvdSBzdXJlIHlvdSdyZSByZWFkeSB0byBzdWJtaXQgdGhpcyBmZWVkYmFjaz9cIik7XHJcbiAgICBpZiAodmFsaWQpIHtcclxuICAgICAgY29uc3QgZmVlZGJhY2tSZWYgPSBmaXJlYmFzZS5maXJlc3RvcmUoKS5jb2xsZWN0aW9uKFwiRmVlZGJhY2tcIikuZG9jKCk7XHJcbiAgICAgIGZlZWRiYWNrUmVmLnNldCh7XHJcbiAgICAgICAgdXNlcjogZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyLnVpZCxcclxuICAgICAgICBmZWVkYmFjazogZmVlZGJhY2tJbnB1dC52YWx1ZSxcclxuICAgICAgICB0aW1lc3RhbXA6IChuZXcgRGF0ZSgpLmdldFRpbWUoKSlcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIGZlZWRiYWNrSW5wdXQudmFsdWUgPSBcIlwiO1xyXG4gICAgICAgIHN1Ym1pdEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIGVycm9yTXNnLnRleHRDb250ZW50ID0gXCJXZSBnb3QgaXQhIFRoYW5rcyBmb3IgdGhlIGZlZWRiYWNrXCI7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgICBoYW5kbGVGaXJlYmFzZUVycm9ycyhlcnJvciwgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG4gICAgICAgIHN1Ym1pdEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIGVycm9yTXNnLnRleHRDb250ZW50ID0gXCJZb3UncmUgZmVlZGJhY2sgd2FzIHRvbyBob25lc3QgZm9yIHRoZSBjb21wdXRlciB0byBwcm9jZXNzLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLlwiO1xyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2tfZXJyb3JfbXNnXCIpLnRleHRDb250ZW50ID0gXCIuLi55b3UgZGlkbid0IGV2ZW4gd3JpdGUgYW55dGhpbmcuXCJcclxuICAgIHN1Ym1pdEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gIH1cclxufSAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=