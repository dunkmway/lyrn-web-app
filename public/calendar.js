let calendar_mode = "default"

let main_calendar;

function initialSetup() {
  //set up the semantic ui dropdowns
  $('.ui.dropdown').dropdown();
  firebase.auth().onAuthStateChanged((user) => {
    getEvents(user)
    .then(events => {
      initializeCalendar(events)
    })
    .catch((error) =>{
      console.log(error);
      alert("We had an issue loading the calendar events. Try refreshing the page.")
    })
  })
}

function initializeCalendar(events) {
  var calendarEl = document.getElementById('calendar');
  main_calendar = new FullCalendar.Calendar(calendarEl, {
    height: "100%",
    initialView: 'timeGridWeek',
    hiddenDays: [0],
    scrollTime: '09:00:00',
    nowIndicator: true,
    headerToolbar: {
      start:   'today prev,next',
      center: 'title',
      end:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    themeSystem: 'standard',
    editable: true,

    dateClick: function(info) {
      alert('Clicked on: ' + info.dateStr);
    },

    eventClick: function(info) {
      alert("ID: " + info.event.id + 
            "\nTitle: " + info.event.title +
            "\nStart: " + info.event.start +
            "\nEnd: " + info.event.end
            );
    },

    select: function(info) {
      //check the calendar mode
      switch(calendar_mode) {
        case "addTeacherMeeting":
          addTeacherMeetingSelectCallback(info);
          break
        default:
          //nothing
      }
    },

    selectable: true,
    selectMirror: true,

    businessHours: [
      {
        daysOfWeek: [1, 2, 3, 4],
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        daysOfWeek: [5],
        startTime: '9:00',
        endTime: '13:00'
      }
    ],

    events: events
  });
  main_calendar.render();
}

/**
 * for now I'll just grab the ones that are connected to the current user
 */
function getEvents(user) {
  console.log("user UID", user.uid)
  return firebase.firestore().collection('Events').where("staff", 'array-contains', user.uid).get()
  .then((eventSnapshot) => {
    let events = [];
    eventSnapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data();
      events.push({
        id: eventDoc.id,
        title: eventData.title,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
      });
    });
    console.log("events", events)
    return events;
  });
}

/**
 * open the calendar sidebar
 */
function openCalendarSidebar() {
  document.getElementById('sidebar').classList.remove("displayNone");
  main_calendar.updateSize();
}

/**
 * close the calendar sidebar
 */
function closeCalendarSidebar() {
  calendar_mode = "default";
  document.getElementById('sidebar').classList.add("displayNone");
  //display none all of the children in the sidebar
  document.getElementById('sidebar').querySelectorAll("div").forEach(child => {
    child.classList.add("displayNone");
  })
  main_calendar.updateSize();
}

function showAddTeacherMeetingWrapper() {
  document.getElementById('addTeacherMeetingWrapper').classList.remove("displayNone")
}

/**
 * set up for inputing a teacher meeting
 */
function setupInputTeacherMeeting() {
  calendar_mode = "addTeacherMeeting";
  showAddTeacherMeetingWrapper();
  getLocationList()
  .then((locations) => {
    let locationNames = [];
    let locationIDs = [];
    locations.forEach((location) => {
      locationNames.push(location.name);
      locationIDs.push(location.id);
    });
    if (document.getElementById('addTeacherMeetingCenters').options.length == 0) {addSelectOptions(document.getElementById('addTeacherMeetingCenters'), locationIDs, locationNames);}
    if (document.getElementById('addTeacherMeetingLocation').options.length == 0) {addSelectOptions(document.getElementById('addTeacherMeetingLocation'), locationIDs, locationNames);}
  })
  .catch((error) => {console.log(error)});

  openCalendarSidebar();
}

function cancelAddTeacherMeeting() {
  if (confirm("Are you sure you want to cancel this event?")) {
    document.getElementById('addTeacherMeetingStart').textContent = "";
    document.getElementById('addTeacherMeetingEnd').textContent = "";
    $('#addTeacherMeetingCenters').dropdown('clear');
    document.getElementById('addTeacherMeetingLocation').value = "";

    closeCalendarSidebar();
  }
}

function submitAddTeacherMeeting() {
  const start = document.getElementById('addTeacherMeetingStart').dataset.date;
  const end = document.getElementById('addTeacherMeetingEnd').dataset.date;
  const invitedLocations = getDropdownValues('addTeacherMeetingCenters');
  const meetingLocation = document.getElementById('addTeacherMeetingLocation').value

  if (!start || !end || invitedLocations.length == 0 || !meetingLocation) {
    return alert("It looks like you're still missing some data for this teacher meeting");
  }

  if (confirm("Are you sure you want to submit this event?")) {

    eventInfo = {
      type: 'teacherMeeting',
      start: start,
      end: end,
      invitedLocations, invitedLocations,
      meetingLocation, meetingLocation,
    }

    saveTeacherMeeting(eventInfo)
    .then((event) => {
      //FIXME: This should automatically update for the client and put it in a pending status
      main_calendar.addEvent(event);
      closeCalendarSidebar();
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this teacher meeting :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function saveTeacherMeeting(eventInfo) {
  //first get all of the staff that are invited to this meeting
  let promises = [];

  let staff = [];
  let staffNames = [];
  let wages = [];
  
  

  promises.push(firebase.firestore().collection('Tutors').where("location", "in", eventInfo.invitedLocations).get()
  .then((tutorSnapshot) => {
    tutorSnapshot.forEach((tutorDoc) => {
      const tutorData = tutorDoc.data();
      staff.push(tutorDoc.id);
      staffNames.push(tutorData.tutorFirstName + " " + tutorData.tutorLastName);
      wages.push(tutorData.wage ?? '0');
    })
  }));

  promises.push(firebase.firestore().collection('Secretaries').where("location", "in", eventInfo.invitedLocations).get()
  .then((secretarySnapshot) => {
    secretarySnapshot.forEach((secretaryDoc) => {
      const secretaryData = secretaryDoc.data();
      staff.push(secretaryDoc.id);
      staffNames.push(secretaryData.secretaryFirstName + " " + secretaryData.secretaryLastName);
      wages.push(secretaryData.wage ?? '0');
    })
  }))

  promises.push(firebase.firestore().collection('Admins').where("locations", "array-contains-any", eventInfo.invitedLocations).get()
  .then((adminSnapshot) => {
    adminSnapshot.forEach((adminDoc) => {
      const adminData = adminDoc.data();
      staff.push(adminDoc.id);
      staffNames.push(adminData.adminFirstName + " " + adminData.adminLastName);
      wages.push(adminData.wage ?? '0');
    })
  }))

  return Promise.all(promises)
  .then(() => {
    //save the event
    let eventData = {
      type: "teacherMeeting",
      title: "Teacher Meeting",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      location: eventInfo.meetingLocation,

      staff: staff,
      staffNames: staffNames,
      wages: wages,

      attendees: staff,
    }
    let eventRef = firebase.firestore().collection("Events").doc();
    return eventRef.set(eventData)
    .then(() => {
      return {
        id: eventRef.id,
        title: eventData.title,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
      }
    })
  })
}

/**
 * select callback when calendar_mode is 'addTeacherMeeting'
 */
function addTeacherMeetingSelectCallback(info) {
  // if a date selection is made we use the start and start date as the start and stop of the event
  console.log(info);
  const startTime = info.start.getTime();
  const endTime = info.end.getTime();

  document.getElementById('addTeacherMeetingStart').textContent = convertFromDateInt(startTime).longDate;
  document.getElementById('addTeacherMeetingStart').setAttribute('data-date', startTime);

  document.getElementById('addTeacherMeetingEnd').textContent = convertFromDateInt(endTime).longDate;
  document.getElementById('addTeacherMeetingEnd').setAttribute('data-date', endTime);
}

function getLocationList() {
  let user = firebase.auth().currentUser;
  return firebase.firestore().collection("Admins").doc(user.uid).get()
  .then((userDoc) => {
    let userData = userDoc.data();
    let locationUIDs = userData.locations;

    let locationNameProms = [];

    locationUIDs.forEach((locationUID) => {
      locationNameProms.push(firebase.firestore().collection("Locations").doc(locationUID).get()
      .then((locationDoc) => {
        let locationData = locationDoc.data();
        return {
          id: locationUID,
          name: locationData.locationName
        }
      }));
    });
    return Promise.all(locationNameProms)
  });

}

function getDropdownValues(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let values = []
  inputs.forEach((input) => {
    values.push(input.dataset.value)
  })

  return values;
}