let calendar_mode = "default";
let pending_calendar_event = {}
let pending_calendar_event_id = "";
let old_calendar_event = {}
let old_calendar_event_id = "";


const PRACTICE_TEST_COLOR = "#CDF7F4";
const CONFERENCE_COLOR = "#7FF3FB";
const GENRAL_INFO_COLOR = "#B3B3B3";
const TEACHER_MEETING_COLOR = "#B3B3B3"

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
  closeCalendarSidebar();
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
      // //check the calendar mode
      // switch(calendar_mode) {
      //   case "addPracticeTest":
      //     addPracticeTestDateClickCallback(info);
      //   default:
      //     //nothing
      // }
    },

    eventClick: function(info) {
      console.log("Event clicked!")
      getEvent(info.event.id)
      .then((data) => {
        setupEditSidebar(data, info.event.id)
      })
    },

    select: function(info) {
      selectCallBack(info);
    },

    unselect: function(jsEvent, view) {
      unselectCallback();
    },

    eventChange: function(changeInfo) {
      pending_calendar_event.start = changeInfo.event.start.getTime();
      pending_calendar_event.end = changeInfo.event?.end?.getTime() ?? changeInfo.event.start.getTime() + 3600000;
      pending_calendar_event.allDay = changeInfo.event.allDay;
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

function deleteEvent(eventID) {
  return firebase.firestore().collection('Events').doc(eventID).delete();
}

function deleteEventCallback() {
  if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
    const eventID = pending_calendar_event_id;
    deleteEvent(eventID)
    .then(() => {
      main_calendar.getEventById(eventID).remove()
      closeCalendarSidebar();
    })
    .catch((error) => {console.log(error)});
  }
}


function cancelSidebar() {
  //clear the input for every input
  const allInputNodes = document.getElementById('sidebar').querySelectorAll('input');
  for (let i = 0; i < allInputNodes.length; i++) {
    allInputNodes[i].value = ""
  }

  //all selects should be dynamically created on setup so we can remove all elements here
  const allSelectNodes = document.getElementById('sidebar').querySelectorAll('select');
  for (let i = 0; i < allSelectNodes.length; i++) {
    let numOptions = allSelectNodes[i].options.length;
    for (let j = numOptions; j > 0; j--) {
      allSelectNodes[i].options[j-1].remove();
    }
  }

  //clear all elements within elements with the class 'sidebarList'
  const allSidebarListNodes = document.getElementById('sidebar').querySelectorAll('.sidebarList');
  for (let i = 0; i < allSidebarListNodes.length; i++) {
    while (allSidebarListNodes[i].hasChildNodes()) {
      allSidebarListNodes[i].removeChild(allSidebarListNodes[i].lastChild);
    }
  }
}

/**
 * call this function from the button press that cancels the sidebar
 */
function cancelSidebarCallback() {
  //FIXME: Check if anything was changed then ask. I'm thinking about putting a change listener that detects changes and sets a flag
  if (confirm("Are you sure you want to cancel this event?\nAny data just entered will be lost.")) {
    closeCalendarSidebar();
  }
}

//special case for when editting since we need to cancel a possible event calendar position.
function cancelEditCallback() {
  //FIXME: Check if anything was changed then ask. I'm thinking about putting a change listener that detects changes and sets a flag
  if (confirm("Are you sure you want to cancel this event?\nAny data just entered will be lost.")) {
    //set the event back to it's original position (edit)
    main_calendar.getEventById(pending_calendar_event_id).remove();
    main_calendar.addEvent({
      id: old_calendar_event_id,
      ...old_calendar_event
    })

    closeCalendarSidebar();
  }
}

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
        allDay: eventData.allDay,
        color: eventData.color,
        textColor: eventData.textColor
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
        allDay: eventData.allDay,
        color: eventData.color,
        textColor: eventData.textColor
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

  //call the cancel function on the open sidebar
  cancelSidebar();

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

  for (let key in old_calendar_event) {
    delete old_calendar_event[key]
  }
  old_calendar_event_id = "";

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

function showEditGeneralInfoWrapper() {
  document.getElementById('editGeneralInfoWrapper').classList.remove("displayNone")
}

function showAddPracticeTestWrapper() {
  document.getElementById('addPracticeTestWrapper').classList.remove("displayNone")
}

function showEditPracticeTestWrapper() {
  document.getElementById('editPracticeTestWrapper').classList.remove("displayNone")
}

function showAddConferenceWrapper() {
  document.getElementById('addConferenceWrapper').classList.remove("displayNone")
}

function showEditConferenceWrapper() {
  document.getElementById('editConferenceWrapper').classList.remove("displayNone")
}

function setupEditSidebar(eventData, eventID) {
  console.log(eventData.type);
  switch (eventData.type) {
    case 'teacherMeeting':
      setupEditTeacherMeeting(eventData, eventID);
      break
    case 'generalInfo':
      setupEditGeneralInfo(eventData, eventID);
      break
    case 'practiceTest':
      setupEditPracticeTest(eventData, eventID);
      break
    case 'conference':
      setupEditConference(eventData, eventID);
      break
    default:
  }
}

/**
 * set up for inputing a teacher meeting
 */
function setupAddTeacherMeeting() {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
  calendar_mode = "addTeacherMeeting";
  main_calendar.setOption('selectable', true);

  showAddTeacherMeetingWrapper();
  openCalendarSidebar();
}

function setupEditTeacherMeeting(data, id) {
  closeCalendarSidebar();
  calendar_mode = 'editTeacherMeeting';
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

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
  
  //show the edit wrapper and the sidebar
  showEditTeacherMeetingWrapper();
  openCalendarSidebar();
}

function setupAddGeneralInfo() {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
  calendar_mode = "addGeneralInfo";
  main_calendar.setOption('selectable', true);

  showAddGeneralInfoWrapper();
  openCalendarSidebar();
}

function setupEditGeneralInfo(data, id) {
  closeCalendarSidebar();
  calendar_mode = 'editGeneralInfo';
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  //fill in appropriate fields
  document.getElementById('editGeneralInfoTitle').value = data.title;

  showEditGeneralInfoWrapper();
  openCalendarSidebar();
}

function setupAddPracticeTest() {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
  calendar_mode = "addPracticeTest";
  main_calendar.setOption('selectable', true);

  //add back the default option
  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "select a student"
  defaultOption.setAttribute('selected', true);
  defaultOption.setAttribute('disabled', true);
  document.getElementById('addPracticeTestStudent').appendChild(defaultOption);

  //add in the student list. If no location is selected this will reject
  getStudentList(document.getElementById('calendarLocation').dataset.value)
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById('addPracticeTestStudent'), studentUIDs, studentNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  showAddPracticeTestWrapper();
  openCalendarSidebar();
}

function setupEditPracticeTest(data, id) {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
  calendar_mode = "editPracticeTest";
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  //add back the default option
  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "select a student"
  defaultOption.setAttribute('selected', true);
  defaultOption.setAttribute('disabled', true);
  document.getElementById('editPracticeTestStudent').appendChild(defaultOption);

  //add in the student list. If no location is selected this will reject
  getStudentList(document.getElementById('calendarLocation').dataset.value)
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById('editPracticeTestStudent'), studentUIDs, studentNames);
    //select the saved student
    document.getElementById('editPracticeTestStudent').value = data.student;
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  showEditPracticeTestWrapper();
  openCalendarSidebar();
}

function setupAddConference() {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
  calendar_mode = "addConference";
  main_calendar.setOption('selectable', true);

  //add back the default option
  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "select a student"
  defaultOption.setAttribute('selected', true);
  defaultOption.setAttribute('disabled', true);
  document.getElementById('addConferenceStudent').appendChild(defaultOption);

  //add in the student list. If no location is selected this will reject
  getStudentList(document.getElementById('calendarLocation').dataset.value)
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById('addConferenceStudent'), studentUIDs, studentNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  showAddConferenceWrapper();
  openCalendarSidebar();
}

function setupEditConference(data, id) {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
  calendar_mode = "editConference";
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  //add back the default option
  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "select a student"
  defaultOption.setAttribute('selected', true);
  defaultOption.setAttribute('disabled', true);
  document.getElementById('addConferenceStudent').appendChild(defaultOption);

  //add in the student list. If no location is selected this will reject
  getStudentList(document.getElementById('calendarLocation').dataset.value)
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById('editConferenceStudent'), studentUIDs, studentNames);
    //select the saved student
    document.getElementById('editConferenceStudent').value = data.student;
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  showEditConferenceWrapper();
  openCalendarSidebar();
}

function submitAddTeacherMeeting() {
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
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
      color: TEACHER_MEETING_COLOR,
      textColor: tinycolor.mostReadable(TEACHER_MEETING_COLOR, ["#FFFFFF", "000000"]).toHexString()
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

function updateEditTeacherMeeting() {
  pending_calendar_event.meetingLocation = document.getElementById('editTeacherMeetingLocation').value;
  firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
  .then(() => {
    main_calendar.getEventById(pending_calendar_event_id).remove();
    main_calendar.addEvent({
      id: pending_calendar_event_id,
      ...pending_calendar_event
    })
    closeCalendarSidebar();
  })
}

function submitAddGeneralInfo() {
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const title = document.getElementById('addGeneralInfoTitle').value
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !title || !location) {
    return alert("It looks like you're still missing some data for this general info");
  }

  if (confirm("Are you sure you want to submit this event?")) {

    eventInfo = {
      type: 'generalInfo',
      start: start,
      end: end,
      allDay, allDay,
      title: title,
      location: location,
      color: GENRAL_INFO_COLOR,
      textColor: tinycolor.mostReadable(GENRAL_INFO_COLOR, ["#FFFFFF", "000000"]).toHexString()
    }

    saveGeneralInfo(eventInfo)
    .then((event) => {
      //FIXME: This should automatically update for the client and put it in a pending status
      main_calendar.addEvent(event);
      closeCalendarSidebar();
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditGeneralInfo() {
  pending_calendar_event.title = document.getElementById('editGeneralInfoTitle').value;
  firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
  .then(() => {
    main_calendar.getEventById(pending_calendar_event_id).remove();
    main_calendar.addEvent({
      id: pending_calendar_event_id,
      ...pending_calendar_event
    })
    closeCalendarSidebar();
  })
}

function submitAddPracticeTest() {
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const student = document.getElementById('addPracticeTestStudent').value;
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !student || !location) {
    return alert("It looks like you're still missing some data for this practice test");
  }

  if (confirm("Are you sure you want to submit this event?")) {

    eventInfo = {
      type: 'practiceTest',
      start: start,
      end: end,
      allDay, allDay,
      location: location,
      student: student,
      color: PRACTICE_TEST_COLOR,
      textColor: tinycolor.mostReadable(PRACTICE_TEST_COLOR, ["#FFFFFF", "000000"]).toHexString()
    }

    savePracticeTest(eventInfo)
    .then((event) => {
      //FIXME: This should automatically update for the client and put it in a pending status
      main_calendar.addEvent(event);
      closeCalendarSidebar();
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this practice test :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditPracticeTest() {
  pending_calendar_event.student = document.getElementById('editPracticeTestStudent').value;
  pending_calendar_event.title = document.getElementById('editPracticeTestStudent').options[document.getElementById('editPracticeTestStudent').selectedIndex].text + " - Practice Test";
  firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
  .then(() => {
    main_calendar.getEventById(pending_calendar_event_id).remove();
    main_calendar.addEvent({
      id: pending_calendar_event_id,
      ...pending_calendar_event
    })
    closeCalendarSidebar();
  })
}

function submitAddConference() {
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const student = document.getElementById('addConferenceStudent').value;
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !student || !location) {
    return alert("It looks like you're still missing some data for this conference");
  }

  if (confirm("Are you sure you want to submit this event?")) {

    eventInfo = {
      type: 'conference',
      start: start,
      end: end,
      allDay, allDay,
      location: location,
      student: student,
      color: CONFERENCE_COLOR,
      textColor: tinycolor.mostReadable(CONFERENCE_COLOR, ["#FFFFFF", "000000"]).toHexString()
    }

    saveConference(eventInfo)
    .then((event) => {
      //FIXME: This should automatically update for the client and put it in a pending status
      main_calendar.addEvent(event);
      closeCalendarSidebar();
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this conference :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditConference() {
  pending_calendar_event.student = document.getElementById('editConferenceStudent').value;
  pending_calendar_event.title = document.getElementById('editConferenceStudent').options[document.getElementById('editConferenceStudent').selectedIndex].text + " - Conference";
  firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
  .then(() => {
    main_calendar.getEventById(pending_calendar_event_id).remove();
    main_calendar.addEvent({
      id: pending_calendar_event_id,
      ...pending_calendar_event
    })
    closeCalendarSidebar();
  })
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
      type: eventInfo.type,
      title: "Teacher Meeting",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.invitedLocation,
      meetingLocation: eventInfo.meetingLocation,
      color: eventInfo.color,
      textColor: eventInfo.textColor,

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
        color: eventData.color,
        textColor: eventData.textColor,
      }
    })
  })
}

function saveGeneralInfo(eventInfo) {
  const eventRef = firebase.firestore().collection("Events").doc()
  let eventData = {
    type: eventInfo.type,
    title: eventInfo.title,
    start: parseInt(eventInfo.start),
    end: parseInt(eventInfo.end),
    allDay: eventInfo.allDay,
    location: eventInfo.location,
    color: eventInfo.color,
    textColor: eventInfo.textColor,
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
      color: eventData.color,
      textColor: eventData.textColor,
    }
  })
}


function savePracticeTest(eventInfo) {
  //get the student doc for name and parent
  return firebase.firestore().collection("Students").doc(eventInfo.student).get()
  .then((studentDoc) => {
    const data = studentDoc.data();
    const studentName = data.studentLastName + ", " + data.studentFirstName;
    const studentParent = data.parent;

    const eventRef = firebase.firestore().collection("Events").doc()
    let eventData = {
      type: eventInfo.type,
      title: studentName + " - Practice Test",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      color: eventInfo.color,
      textColor: eventInfo.textColor,

      student: eventInfo.student,
      studentName: studentName,
      
      parent: studentParent,

      attendees: [eventInfo.student, studentParent]
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
        color: eventData.color,
        textColor: eventData.textColor,
      }
    })

  })
}

function saveConference(eventInfo) {
  //get the student doc for name and parent
  return firebase.firestore().collection("Students").doc(eventInfo.student).get()
  .then((studentDoc) => {
    const data = studentDoc.data();
    const studentName = data.studentLastName + ", " + data.studentFirstName;
    const studentParent = data.parent;

    const eventRef = firebase.firestore().collection("Events").doc()
    let eventData = {
      type: eventInfo.type,
      title: studentName + " - Conference",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      color: eventInfo.color,
      textColor: eventInfo.textColor,

      student: eventInfo.student,
      studentName: studentName,
      
      parent: studentParent,

      attendees: [eventInfo.student, studentParent]
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
        color: eventData.color,
        textColor: eventData.textColor,
      }
    })

  })
}

/**
 * The callback when selecting a date range
 */
function selectCallBack(info) {
  pending_calendar_event.start = info.start.getTime();
  pending_calendar_event.end = info.end.getTime();
  pending_calendar_event.allDay = info.allDay;
}

/**
 * The callback when unselecting a date range
 */
function unselectCallback() {
  delete pending_calendar_event.start
  delete pending_calendar_event.end
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

function getStudentList(location) {
  if(!location) {
    alert("Choose a location first!");
    return Promise.reject('no location selected')
  }
  return firebase.firestore().collection("Students").where("location", "==", location).orderBy("studentLastName").get()
  .then((studentSnapshot) => {
    let students = [];
    studentSnapshot.forEach((studentDoc) => {
      const data = studentDoc.data();
      students.push({
        name: data.studentLastName + ", " + data.studentFirstName,
        id: studentDoc.id
      })
    })

    return students;
  })
}

function getDropdownValues(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let values = []
  inputs.forEach((input) => {
    values.push(input.dataset.value)
  })

  return values;
}

