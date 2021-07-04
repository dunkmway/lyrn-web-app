let calendar_mode = "default";
let pending_calendar_event = {}
let pending_calendar_event_id = "";

let current_user;

let main_calendar;


function initialSetup() {
  //set up the semantic ui dropdowns
  $('.ui.dropdown').dropdown();
  //get the blank calendar before filling in events
  initializeCalendar([]);

  firebase.auth().onAuthStateChanged((user) => {
    current_user = user;
    getLocationList(user)
    .then((locations) => {
      let locationNames = [];
      let locationIDs = [];
      locations.forEach((location) => {
        locationNames.push(location.name);
        locationIDs.push(location.id);
      });
      addDropdownOptions(document.getElementById('calendarLocation'), locationIDs, locationNames);
    })
    .catch((error) =>{
      console.log(error);
      alert("We had an issue loading the calendar events. Try refreshing the page.")
    })

    // getEventsUser(user)
    // .then(events => {
    //   initializeCalendar(events)
    // })
    // .catch((error) =>{
    //   console.log(error);
    //   alert("We had an issue loading the calendar events. Try refreshing the page.")
    // })
  })
}

function addDropdownOptions(dropdownElement, optionValues, optionTexts, ) {
  let contentDiv = dropdownElement.querySelector('.dropdown-content');
  let dropdownBtn = dropdownElement.querySelector('.dropbtn');

  //check that the values and texts match in length
  if (optionValues.length != optionTexts.length) {throw "option values and options texts must have the same number of elements"}

  optionValues.forEach((optionValue, valueIndex) => {
    let option = document.createElement('div');
    option.setAttribute('data-value', optionValue);
    option.textContent = optionTexts[valueIndex];
    option.addEventListener('click', () => {
      locationChange(optionValue);
      dropdownElement.setAttribute('data-value', optionValue);
      dropdownBtn.textContent = optionTexts[valueIndex];

      //unhide all other options and then hide the selected one
      dropdownElement.querySelectorAll('.dropdown-content div').forEach(div => {
        div.classList.remove('selected');
      })
      option.classList.add('selected');
    })
    contentDiv.appendChild(option);
  });
}

function locationChange(location) {
  getEventsLocation(location)
  .then(events => {
    //remove the old events
    main_calendar.getEvents().forEach(event => {
      event.remove()
    });
    //add the new ones
    events.forEach(event => {
      main_calendar.addEvent(event);
    })
  })
  .catch((error) =>{
    console.log(error);
    alert("We had an issue loading the calendar events. Try refreshing the page.")
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

    dateClick: function(info) {
      // alert('Clicked on: ' + info.dateStr);
    },

    eventClick: function(info) {
      getEvent(info.event.id)
      .then((data) => {
        setupEditSidebar(data, info.event.id)
      })
    },

    select: function(info) {
      //check the calendar mode
      switch(calendar_mode) {
        case "addTeacherMeeting":
          addTeacherMeetingSelectCallback(info);
          break
        case "addGeneralInfo":
          addGeneralInfoSelectCallback(info);
          break
        default:
          //nothing
      }
    },

    unselect: function(jsEvent, view) {
      //check the calendar mode
      switch(calendar_mode) {
        case "addTeacherMeeting":
          addTeacherMeetingUnselectCallback();
          break
          case "addGeneralInfo":
            addGeneralInfoUnselectCallback();
            break
        default:
          //nothing
      }
    },

    eventChange: function(changeInfo) {
      switch (calendar_mode) {
        case 'editTeacherMeeting':
          pending_calendar_event.start = changeInfo.event.start.getTime();
          pending_calendar_event.end = changeInfo.event.end.getTime();
          pending_calendar_event.allDay = changeInfo.event.allDay;
          break
        default:
      }
    },

    selectable: false,
    unselectAuto: false,

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

function getEvent(eventID) {
  return firebase.firestore().collection('Events').doc(eventID).get()
  .then(doc => {
    return doc.data();
  });
}

/**
 * for now I'll just grab the ones that are connected to the current user
 */
function getEventsUser(user) {
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
        allDay: eventData.allDay
      });
    });
    return events;
  });
}

function getEventsLocation(location) {
  return firebase.firestore().collection('Events').where("location", '==', location).get()
  .then((eventSnapshot) => {
    let events = [];
    eventSnapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data();
      events.push({
        id: eventDoc.id,
        title: eventData.title,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
        allDay: eventData.allDay
      });
    });
    return events;
  });
}

/**
 * open the calendar sidebar
 */
function openCalendarSidebar() {
  document.getElementById('sidebar').classList.remove("closed");
  document.getElementById('sidebar').classList.add('open');
  main_calendar.updateSize();
}

/**
 * close the calendar sidebar
 */
function closeCalendarSidebar() {
  main_calendar.setOption('selectable', false);
  main_calendar.unselect();
  main_calendar.getEvents().forEach((event) => {
    event.setProp('editable', false);
  })
  calendar_mode = "default";

  for (let key in pending_calendar_event) {
    delete pending_calendar_event[key]
  }
  pending_calendar_event_id = "";

  document.getElementById('sidebar').classList.remove("open");
  document.getElementById('sidebar').classList.add("closed");
  //display none all of the children in the sidebar
  document.getElementById('sidebar').querySelectorAll(".sidebarContent").forEach(child => {
    child.classList.add("displayNone");
  });
  main_calendar.updateSize();
}

function showAddTeacherMeetingWrapper() {
  document.getElementById('addTeacherMeetingWrapper').classList.remove("displayNone")
}

function showEditTeacherMeetingWrapper() {
  document.getElementById('editTeacherMeetingWrapper').classList.remove("displayNone")
}

function showAddGeneralInfoWrapper() {
  document.getElementById('addGeneralInfoWrapper').classList.remove("displayNone")
}

function setupEditSidebar(eventData, eventID) {
  switch (eventData.type) {
    case 'teacherMeeting':
      setupEditTeacherMeeting(eventData, eventID);
      break
    default:

  }
}

/**
 * set up for inputing a teacher meeting
 */
function setupInputTeacherMeeting() {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
  calendar_mode = "addTeacherMeeting";
  main_calendar.setOption('selectable', true);

  showAddTeacherMeetingWrapper();
  getLocationList(current_user)
  .then((locations) => {
    let locationNames = [];
    let locationIDs = [];
    locations.forEach((location) => {
      locationNames.push(location.name);
      locationIDs.push(location.id);
    });
  })
  .catch((error) => {console.log(error)});

  openCalendarSidebar();
}

function setupEditTeacherMeeting(data, id) {
  closeCalendarSidebar();
  calendar_mode = 'editTeacherMeeting';

  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  pending_calendar_event_id = id;
  pending_calendar_event = data;

  document.getElementById('editTeacherMeetingLocation').value = data.meetingLocation;
  data.staff.forEach((staff, index) => {
    staffElem = document.createElement('p');
    staffElem.textContent = data.staffNames[index];
    staffElem.setAttribute('data-value', staff);
    staffElem.addEventListener('click', (event) => {
      //we'll 'remove' the staff member by setting attended to false. This way they can remain if they are added back
      if (data.attended[index]) {
        pending_calendar_event.attended[index] = false;
        event.target.classList.add('removed');
      }
      else {
        pending_calendar_event.attended[index] = true;
        event.target.classList.remove('removed');
      }
    });
    if (!data.attended[index]) {
      staffElem.classList.add('removed');
    }
    document.getElementById('editTeacherMeetingStaff').appendChild(staffElem);
  })
  document.getElementById('editTeacherMeetingStaff')

  
  //show the edit wrapper and the sidebar
  showEditTeacherMeetingWrapper();
  openCalendarSidebar();
}

function setupInputGeneralInfo() {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
  calendar_mode = "addGeneralInfo";
  main_calendar.setOption('selectable', true);

  showAddGeneralInfoWrapper();
  openCalendarSidebar();
}

function cancelAddTeacherMeeting() {
  if (confirm("Are you sure you want to cancel this event?")) {
    document.getElementById('addTeacherMeetingLocation').value = "";

    closeCalendarSidebar();
  }
}

function cancelEditTeacherMeeting() {
  document.getElementById('editTeacherMeetingLocation').value = "";
  const staffNode = document.getElementById("editTeacherMeetingStaff");
    while (staffNode.firstChild) {
      staffNode.removeChild(staffNode.lastChild);
    }

  closeCalendarSidebar();
}

function cancelAddGeneralInfo() {
  if (confirm("Are you sure you want to cancel this event?")) {
    document.getElementById('addGeneralInfoTitle').value = "";

    closeCalendarSidebar();
  }
}

function submitAddTeacherMeeting() {
  const start = pending_calendar_event.startTime;
  const end = pending_calendar_event.endTime;
  const allDay = pending_calendar_event.allDay;
  const invitedLocation = document.getElementById('calendarLocation').dataset.value
  const meetingLocation = document.getElementById('addTeacherMeetingLocation').value

  if (!start || !invitedLocation || !meetingLocation) {
    return alert("It looks like you're still missing some data for this teacher meeting");
  }

  if (confirm("Are you sure you want to submit this event?")) {

    eventInfo = {
      type: 'teacherMeeting',
      start: start,
      end: end,
      allDay: allDay,
      invitedLocation, invitedLocation,
      meetingLocation, meetingLocation,
    }

    saveTeacherMeeting(eventInfo)
    .then((event) => {
      //FIXME: This should automatically update for the client and put it in a pending status
      main_calendar.addEvent(event);
      document.getElementById('addTeacherMeetingLocation').value = "";
      closeCalendarSidebar();
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this teacher meeting :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditTeacherMeeting() {
  pending_calendar_event.meetingLocation = document.getElementById('editTeacherMeetingLocation').value;
  firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
  .then(() => {
    document.getElementById('addGeneralInfoTitle').value = "";
    const staffNode = document.getElementById("editTeacherMeetingStaff");
    while (staffNode.firstChild) {
      staffNode.removeChild(staffNode.lastChild);
    }
    closeCalendarSidebar();
  })
}

function submitAddGeneralInfo() {
  const start = pending_calendar_event.startTime;
  const end = pending_calendar_event.endTime;
  const allDay = pending_calendar_event.allDay;
  const title = document.getElementById('addGeneralInfoTitle').value
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !title || !location) {
    return alert("It looks like you're still missing some data for this general info");
  }

  if (confirm("Are you sure you want to submit this event?")) {

    eventInfo = {
      type: 'genralInfo',
      start: start,
      end: end,
      allDay, allDay,
      title: title,
      location: location
    }

    saveGeneralInfo(eventInfo)
    .then((event) => {
      //FIXME: This should automatically update for the client and put it in a pending status
      main_calendar.addEvent(event);
      document.getElementById('addGeneralInfoTitle').value = ""
      closeCalendarSidebar();
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function saveTeacherMeeting(eventInfo) {
  //first get all of the staff that are invited to this meeting
  let promises = [];

  let staff = [];
  let staffNames = [];
  let wages = [];
  
  

  promises.push(firebase.firestore().collection('Tutors').where("location", "==", eventInfo.invitedLocation).get()
  .then((tutorSnapshot) => {
    tutorSnapshot.forEach((tutorDoc) => {
      const tutorData = tutorDoc.data();
      staff.push(tutorDoc.id);
      staffNames.push(tutorData.tutorFirstName + " " + tutorData.tutorLastName);
      wages.push(tutorData.wage ?? 0);
    })
  }));

  promises.push(firebase.firestore().collection('Secretaries').where("location", "==", eventInfo.invitedLocation).get()
  .then((secretarySnapshot) => {
    secretarySnapshot.forEach((secretaryDoc) => {
      const secretaryData = secretaryDoc.data();
      staff.push(secretaryDoc.id);
      staffNames.push(secretaryData.secretaryFirstName + " " + secretaryData.secretaryLastName);
      wages.push(secretaryData.wage ?? 0);
    })
  }))

  promises.push(firebase.firestore().collection('Admins').where("locations", "array-contains", eventInfo.invitedLocation).get()
  .then((adminSnapshot) => {
    adminSnapshot.forEach((adminDoc) => {
      const adminData = adminDoc.data();
      staff.push(adminDoc.id);
      staffNames.push(adminData.adminFirstName + " " + adminData.adminLastName);
      wages.push(adminData.wage ?? 0);
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
      allDay: eventInfo.allDay,
      location: eventInfo.invitedLocation,
      meetingLocation: eventInfo.meetingLocation,

      staff: staff,
      staffNames: staffNames,
      attended: new Array(staff.length).fill(true),
      wages: wages,

      attendees: staff,
    }
    let eventRef = firebase.firestore().collection("Events").doc();
    return eventRef.set(eventData)
    .then(() => {
      return {
        id: eventRef.id,
        title: eventData.title,
        meetinglocation: eventData.meetingLocation,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
        allDay: eventData.allDay,
      }
    })
  })
}

function saveGeneralInfo(eventInfo) {
  const eventRef = firebase.firestore().collection("Events").doc()
  let eventData = {
    type: "generalInfo",
    title: eventInfo.title,
    start: parseInt(eventInfo.start),
    end: parseInt(eventInfo.end),
    allDay: eventInfo.allDay,
    location: eventInfo.location,
  }
  return eventRef.set(eventData)
  .then(() => {
    return {
      id: eventRef.id,
      title: eventData.title,
      start: eventData.start,
      start: convertFromDateInt(eventData.start).fullCalendar,
      end: convertFromDateInt(eventData.end).fullCalendar,
      allDay: eventData.allDay,
    }
  })
}

/**
 * select callback when calendar_mode is 'addTeacherMeeting'
 */
function addTeacherMeetingSelectCallback(info) {
  // if a date selection is made we use the start and start date as the start and stop of the event
  pending_calendar_event.startTime = info.start.getTime();
  pending_calendar_event.endTime = info.end.getTime();
  pending_calendar_event.allDay = info.allDay;
}

function addTeacherMeetingUnselectCallback() {
  delete pending_calendar_event.startTime
  delete pending_calendar_event.endTime
  delete pending_calendar_event.allDay
}

function addGeneralInfoSelectCallback(info) {
  // if a date selection is made we use the start and start date as the start and stop of the event
  pending_calendar_event.startTime = info.start.getTime();
  pending_calendar_event.endTime = info.end.getTime();
  pending_calendar_event.allDay = info.allDay;
}

function addGeneralInfoUnselectCallback() {
  delete pending_calendar_event.startTime
  delete pending_calendar_event.endTime
  delete pending_calendar_event.allDay
}

function getLocationList(user) {
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

window.addEventListener('keypress', (event) => {
  if (event.key == 'Enter') {
    console.log('key pressed')
    main_calendar.updateSize();
  }
})