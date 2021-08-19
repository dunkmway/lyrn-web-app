let calendar_mode = "default";
let calendar_view = 'defualt';
let pending_calendar_event = {}
let pending_calendar_event_id = "";
let old_calendar_event = {}
let old_calendar_event_id = "";
let pending_recurring_times = [];
let pending_recurring_start = {};
let pending_recurring_end = {};

let current_filter = {};

const PRACTICE_TEST_COLOR = "#CDF7F4";
const CONFERENCE_COLOR = "#7FF3FB";
const GENRAL_INFO_COLOR = "#B3B3B3";
const TEACHER_MEETING_COLOR = "#B3B3B3";
const AVAILABILITY_COLOR = "#F09C99";

let current_user;

let main_calendar;


function initialSetup() {
  //set up the semantic ui dropdowns
  $('.ui.dropdown').dropdown();
  //get the blank calendar before filling in events
  initializeDefaultCalendar([]);

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
  })
}

function setupFilterLists(locationUID) {
  //remove the old lists and add in defualt option
  for (let i = document.getElementById('studentFilterContent').options.length; i > 0; i--) {
    document.getElementById('studentFilterContent').options[i-1].remove();
  }
  let studentDefaultOption = document.createElement('option');
  studentDefaultOption.value = "";
  studentDefaultOption.textContent = 'select a student';
  document.getElementById('studentFilterContent').appendChild(studentDefaultOption);

  for (let i = document.getElementById('tutorFilterContent').options.length; i > 0; i--) {
    document.getElementById('tutorFilterContent').options[i-1].remove();
  }
  let tutorDefaultOption = document.createElement('option');
  tutorDefaultOption.value = "";
  tutorDefaultOption.textContent = 'select a tutor';
  document.getElementById('tutorFilterContent').appendChild(tutorDefaultOption);

  let typeDefaultOption = document.createElement('option');
  typeDefaultOption.value = "";
  typeDefaultOption.textContent = 'select a type';
  document.getElementById('typeFilterContent').options[0] = typeDefaultOption;

  //add in the options for the given location
  getStudentList(locationUID)
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById('studentFilterContent'), studentUIDs, studentNames);
    $('#studentFilterContent').closest(".ui.dropdown").dropdown('clear');
    $('#studentFilterContent').closest(".ui.dropdown").dropdown('setting', 'placeholder', 'select a student');
    $('#studentFilterContent').closest(".ui.dropdown").dropdown('setting', 'onChange', 
      (value, text) => {
        current_filter.student = value;
        //change the filter label
        document.getElementById('filterSelection').innerHTML = 'filter active';
        
        //place the filtered values into the calendar
        getEventsLocation(locationUID, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_filter)
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
      })
  })
  .catch((error) => {
    console.log(error)
  });

  getTutorList(locationUID)
  .then((tutors) => {
    let tutorNames = [];
    let tutorUIDs = [];
    tutors.forEach((tutor) => {
      tutorNames.push(tutor.name);
      tutorUIDs.push(tutor.id);
    });

    addSelectOptions(document.getElementById('tutorFilterContent'), tutorUIDs, tutorNames);
    $('#tutorFilterContent').closest(".ui.dropdown").dropdown('clear');
    $('#tutorFilterContent').closest(".ui.dropdown").dropdown('setting', 'placeholder', 'select a tutor');
    $('#tutorFilterContent').closest(".ui.dropdown").dropdown('setting', 'onChange', 
      (value, text) => {
        current_filter.staff = value;
        //change the filter label
        document.getElementById('filterSelection').innerHTML = 'filter active';
        
        //place the filtered values into the calendar
        getEventsLocation(locationUID, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_filter)
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
      })
  })
  .catch((error) => {
    console.log(error)
  });

  $('#typeFilterContent').closest(".ui.dropdown").dropdown('clear');
  $('#typeFilterContent').closest(".ui.dropdown").dropdown('setting', 'placeholder', 'select a type');
  $('#typeFilterContent').closest(".ui.dropdown").dropdown('setting', 'onChange', 
      (value, text) => {
        current_filter.type = value;
        //change the filter label
        document.getElementById('filterSelection').innerHTML = 'filter active';
        
        //place the filtered values into the calendar
        getEventsLocation(locationUID, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_filter)
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
      })
}

function clearFilter() {
  for (key in current_filter) {
    delete key;
  }
  $('#studentFilterContent').closest(".ui.dropdown").dropdown('clear');
  $('#tutorFilterContent').closest(".ui.dropdown").dropdown('clear');
  $('#typeFilterContent').closest(".ui.dropdown").dropdown('clear');

  document.getElementById('filterSelection').innerHTML = 'filter events';
  const location = document.getElementById('calendarLocation').dataset.value;
  if (location) {
    getEventsLocation(location, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_filter)
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
  clearFilter();
  setupFilterLists(location);
  getEventsLocation(location, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_filter)
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



function initializeDefaultCalendar(events, initialDate = new Date()) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  calendar_view = 'default';

  var calendarEl = document.getElementById('calendar');
  calendarEl.classList.remove('noToday');

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

    // only show the day name (good for setting availability)
    // dayHeaderFormat: { weekday: 'long' },

    datesSet: function(dateInfo) {
      const location = document.getElementById('calendarLocation').dataset.value;
      if (location) {
        getEventsLocation(location, dateInfo.start.getTime(), dateInfo.end.getTime(), current_filter)
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
    },

    dateClick: function(info) {
    },

    eventClick: eventClickHandler,

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

    events: events
  });
  main_calendar.render();
}

function initializeWeeklyScheduleCalendar(events) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  calendar_view = 'week';

  var calendarEl = document.getElementById('calendar');
  calendarEl.classList.add('noToday');

  main_calendar = new FullCalendar.Calendar(calendarEl, {
    // height: "100%",
    initialView: 'timeGridWeek',
    hiddenDays: [0],
    allDaySlot: false,
    slotMinTime: "7:00:00",
    slotMaxTime: "23:00:00",
    headerToolbar: {
      start:   '',
      center: '',
      end:  ''
    },
    themeSystem: 'standard',

    // only show the day name (good for setting availability)
    dayHeaderFormat: { weekday: 'long' },

    selectable: true,

    select: function(info) {
      pending_recurring_times.push(main_calendar.addEvent({
        start: info.start,
        end: info.end,
      }));

      main_calendar.unselect();
    },

    selectOverlap: function(event) {
      pending_recurring_times.forEach((eventObj, index) => {
        if (eventObj.start.getTime() == event.start.getTime()) {
          pending_recurring_times.splice(index, 1)
        }
      })
      event.remove();
      return true;
    },

    eventClick: function(info) {
      pending_recurring_times.forEach((event, index) => {
        if (event.start.getTime() == info.event.start.getTime()) {
          pending_recurring_times.splice(index, 1)
        }
      })
      info.event.remove();
    },

    events: events
  });
  main_calendar.render();
}

function initializepMonthScheduleCalendar(events) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  calendar_view = 'month';

  var calendarEl = document.getElementById('calendar');
  calendarEl.classList.add('noToday');
  
  main_calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    validRange: function(nowDate) {
      //select based on the events that are passed in
      let start = nowDate;
      let end = null;
      events.forEach(event => {
        if (event.id == 'start') {
          start = event.start;
        }
        else if (event.id == 'end') {
          end = event.end;
        }
      })

      return {
        start: start,
        end: end
      }
    },
    hiddenDays: [],
    allDaySlot: false,
    slotMinTime: "7:00:00",
    slotMaxTime: "23:00:00",
    slotDuration: "01:00:00",
    headerToolbar: {
      start:   'prev,next',
      center: 'title',
      end:  ''
    },
    themeSystem: 'standard',
    //so that start goes before end
    eventOrder: '-title',

    selectable: true,

    select: function(info) {
      //if there are no events
      if (main_calendar.getEvents().length == 0) {
        pending_recurring_start = main_calendar.addEvent({
          title: 'Start today',
          start: info.start,
          end: info.end,
          allDay: true,
          id: 'start'
        });

        //restrict valid range to after this date
        main_calendar.setOption('validRange', function() {
          return {
            start: info.start,
          };
        })
      }
      //one event
      else if (main_calendar.getEvents().length == 1) {
        pending_recurring_end = main_calendar.addEvent({
          title: 'End today',
          start: info.start,
          end: info.end,
          allDay: true,
          id: 'end'
        });

        //restrict valid range to before this date (visual help)
        main_calendar.setOption('validRange', function() {
          return {
            start: main_calendar.getEventById('start').start,
            end: info.end,
          };
        })
      }
      else {
        //unrestrict valid time
        main_calendar.setOption('validRange', function(nowDate) {
          return {
            start: nowDate,
          };
        })

        //any more events reset the events
        main_calendar.getEvents().forEach(event => {
          event.remove()
        })

        pending_recurring_start = {};
        pending_recurring_end = {};
      }
      
      main_calendar.unselect();
    },

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

function eventClickHandler(info) {
  //highlight the selected event
  info.event.setProp('borderColor', '#064AF4')
  getEvent(info.event.id)
  .then((data) => {
    setupEditSidebar(data, info.event.id)
  })
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
      closeCalendarSidebar(true);
    })
    .catch((error) => {console.log(error)});
  }
}

function deleteRecurringEventCallback() {
  if (confirm("Are you sure you want to delete all events going forward? This action cannot be undone.")) {
    const student = pending_calendar_event.student
    const type = pending_calendar_event.type;
    const start = pending_calendar_event.start;

    //query all events for this student, of this type and starting at or after this start time

    firebase.firestore().collection('Events')
    .where('student', '==', student)
    .where('type', '==', type)
    .where('start', '>=', start)
    .get()
    .then(querySnapshot => {
      let deletePromises = [];
      querySnapshot.forEach(eventDoc => {
        deletePromises.push(deleteEvent(eventDoc.id)
        .then(() => {
          main_calendar.getEventById(eventDoc.id)?.remove()
        }))
      })

      Promise.all(deletePromises)
      .then(() => {
        closeCalendarSidebar(true);
      })
    })
    .catch((error) => {console.log(error)});
  }
}


function cancelSidebar() {
  //clear the input for every input
  const allInputNodes = document.getElementById('sidebar').querySelectorAll('input');
  for (let i = 0; i < allInputNodes.length; i++) {
    if (allInputNodes[i].type != 'radio') {
      allInputNodes[i].value = ""
    }
  }

  //clear semantic ui dropdown
  $('#sidebar .ui.dropdown').dropdown('clear');

  //unselect all buttons
  const allButtonNodes = document.getElementById('sidebar').querySelectorAll('button');
  for (let i = 0; i < allButtonNodes.length; i++) {
    allButtonNodes[i].classList.remove('selected');
  }

  //bring radio buttons back to first option
  const allRadioNodes = document.getElementById('sidebar').querySelectorAll('input[type="radio"]');
  for (let i = allRadioNodes.length - 1; i > -1 ; i--) {
    allRadioNodes[i].checked = 'true';
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

  //add back the eventClickHandler
  main_calendar.setOption('eventClick', eventClickHandler);
}

/**
 * call this function from the button press that cancels the sidebar
 */
function cancelAddCallback() {
  //FIXME: Check if anything was changed then ask. I'm thinking about putting a change listener that detects changes and sets a flag
  if (confirm("Are you sure you want to cancel this event?\nAny data just entered will be lost.")) {
    cancelSidebar();
    // closeCalendarSidebar();
    return true
  }
  else {
    return false
  }
}

//special case for when editting since we need to cancel a possible event calendar position.
function cancelEditCallback() {
  //FIXME: Check if anything was changed then ask. I'm thinking about putting a change listener that detects changes and sets a flag
  if (confirm("Are you sure you want to cancel this event?\nAny data just entered will be lost.")) {
    //set the event back to it's original position (edit)
    main_calendar.getEventById(pending_calendar_event_id)?.remove();
    main_calendar.addEvent({
      id: old_calendar_event_id,
      ...old_calendar_event
    })
    cancelSidebar();
    // closeCalendarSidebar();
    return true
  }
  else {
    return false
  }
}

function getEventsUser(user) {
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

function getEventsLocation(location, start, end, filter) {
  let eventRef = firebase.firestore().collection('Events')
  .where("location", '==', location)
  .where('start', '>=', start)
  .where('start', '<', end)
  if (filter.staff) {
    eventRef = eventRef.where('staff', 'array-contains', filter.staff)
  }
  if (filter.student) {
    eventRef = eventRef.where('student', '==', filter.student)
  }
  if (filter.type) {
    eventRef = eventRef.where('type', '==', filter.type)
  }

  return eventRef.get()
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

        //FIXME: quick fix for availability view
        //ISSUE: can't query for not availability so we have to hide it after the query
        //SOLUTION: this availability feature is temporary so we can probably just keep this for now
        display: (eventData.type == 'availability' && filter.type != 'availability') ? 'none' : 'auto'
      });
    });
    return events;
  });
}

/**
 * open the calendar sidebar
 */
function openCalendarSidebar() {
  //disble filter being dropped down while sidebar open
  document.getElementById('filterSelection').parentNode.querySelector('.dropdown-content').style.display = 'none';
  document.getElementById('sidebar').classList.remove("closed");
  document.getElementById('sidebar').classList.add('open');
  main_calendar.updateSize();
}

/**
 * close the calendar sidebar
 */
function closeCalendarSidebar(force = false) {
  //call the cancel function on the open sidebar
  if (!force) {
    if (calendar_mode.includes('add')) {
      if (!cancelAddCallback()) {
        return false
      }
      else {
        calendar_mode = "default";
      }
    }
    else if (calendar_mode.includes('edit')) {
      if (!cancelEditCallback()) {
        return false
      }
      else {
        calendar_mode = "default";
      }
    }
  }
  else {
    cancelSidebar();
    calendar_mode = "default";
  }

  //if the main calendar isn't the default change it back to be
  //specifically the mode is recurring
  if (calendar_view != 'default') {
    initializeDefaultCalendar([], pending_recurring_start.start);
  }

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

  while (pending_recurring_times.length > 0) {
    pending_recurring_times.pop()
  }
  pending_recurring_start = {};
  pending_recurring_end = {};

  document.getElementById('sidebar').classList.remove("open");
  document.getElementById('sidebar').classList.add("closed");
  //display none all of the children in the sidebar
  document.getElementById('sidebar').querySelectorAll(".sidebarContent").forEach(child => {
    child.classList.add("displayNone");
  });
  main_calendar.updateSize();

  //allow for filter again
  document.getElementById('filterSelection').parentNode.querySelector('.dropdown-content').style.display = null;
  return true
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

function showAddTestReviewWrapper() {
  document.getElementById('addTestReviewWrapper').classList.remove("displayNone")
}

function showEditTestReviewWrapper() {
  document.getElementById('editTestReviewWrapper').classList.remove("displayNone")
}

function showAddLessonWrapper() {
  document.getElementById('addLessonWrapper').classList.remove("displayNone")
}

function showEditLessonWrapper() {
  document.getElementById('editLessonWrapper').classList.remove("displayNone")
}

function showAddAvailabilityWrapper() {
  document.getElementById('addAvailabilityWrapper').classList.remove("displayNone")
}

function setupEditSidebar(eventData, eventID) {
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
    case 'testReview':
      setupEditTestReview(eventData, eventID);
      break
    case 'act':
      setupEditLesson(eventData, eventID);
      break
    case 'subjectTutoring':
      setupEditLesson(eventData, eventID);
      break
    case 'mathProgram':
      setupEditLesson(eventData, eventID);
      break
    case 'phonicsProgram':
      setupEditLesson(eventData, eventID);
      break
    default:
  }

  //remove eventClickHandler
  main_calendar.setOption('eventClick', () => {});
}

function setupAddSidebar(type) {
  switch (type) {
    case 'teacherMeeting':
      setupAddTeacherMeeting();
      break
    case 'generalInfo':
      setupAddGeneralInfo();
      break
    case 'practiceTest':
      setupAddPracticeTest();
      break
    case 'conference':
      setupAddConference();
      break
    case 'testReview':
      setupAddTestReview();
      break
    case 'lesson':
      setupAddLesson();
      break
    case 'availability':
      setupAddAvailability();
      break
    default:
  }

  //remove eventClickHandler
  main_calendar.setOption('eventClick', () => {});
}

/**
 * set up for inputing a teacher meeting
 */
function setupAddTeacherMeeting() {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "addTeacherMeeting";
  main_calendar.setOption('selectable', true);

  showAddTeacherMeetingWrapper();
  openCalendarSidebar();
}

function setupEditTeacherMeeting(data, id) {
  if (!closeCalendarSidebar()) {
    return
  }
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
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "addGeneralInfo";
  main_calendar.setOption('selectable', true);

  //add in the tutor list. If no location is selected this will reject
  getTutorList(document.getElementById('calendarLocation').dataset.value)
  .then((tutors) => {
    let tutorNames = [];
    let tutorUIDs = [];
    tutors.forEach((tutor) => {
      tutorNames.push(tutor.name);
      tutorUIDs.push(tutor.id);
    });

    addSelectOptions(document.getElementById('addGeneralInfoTutor'), tutorUIDs, tutorNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  showAddGeneralInfoWrapper();
  openCalendarSidebar();
}

function setupEditGeneralInfo(data, id) {
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = 'editGeneralInfo';
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  //fill in appropriate fields
  document.getElementById('editGeneralInfoTitle').value = data.title;

  //add back the default option (tutor)
  const defaultOptionTutor = document.createElement('option');
  defaultOptionTutor.value = "";
  defaultOptionTutor.textContent = "NO TUTOR"
  document.getElementById('editGeneralInfoTutor').appendChild(defaultOptionTutor);

  //add in the tutor list. If no location is selected this will reject
  getTutorList(document.getElementById('calendarLocation').dataset.value)
  .then((tutors) => {
    let tutorNames = [];
    let tutorUIDs = [];
    tutors.forEach((tutor) => {
      tutorNames.push(tutor.name);
      tutorUIDs.push(tutor.id);
    });

    addSelectOptions(document.getElementById('editGeneralInfoTutor'), tutorUIDs, tutorNames);

    //select previously saved tutors
    $("#editGeneralInfoTutor").closest(".ui.dropdown").dropdown('set value', data.staff);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  showEditGeneralInfoWrapper();
  openCalendarSidebar();
}

function setupAddPracticeTest() {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
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
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "editPracticeTest";
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  document.getElementById('editPracticeTestStudent').textContent = data.studentName;
  document.getElementById('editPracticeTestDescription').value = data.description;

  showEditPracticeTestWrapper();
  openCalendarSidebar();
}

function setupAddConference() {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
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
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "editConference";
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  document.getElementById('editConferenceStudent').textContent = data.studentName;
  document.getElementById('editConferenceDescription').value = data.description;

  showEditConferenceWrapper();
  openCalendarSidebar();
}

function setupAddTestReview() {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "addTestReview";
  main_calendar.setOption('selectable', true);

  //add back the default option
  const defaultOptionStudent = document.createElement('option');
  defaultOptionStudent.value = "";
  defaultOptionStudent.setAttribute('selected', true);
  defaultOptionStudent.setAttribute('disabled', true);
  defaultOptionStudent.textContent = "select a student"
  document.getElementById('addTestReviewStudent').appendChild(defaultOptionStudent);

  //add back the default option (tutor)
  const defaultOptionTutor = document.createElement('option');
  defaultOptionTutor.value = "";
  defaultOptionTutor.textContent = "NO TUTOR"
  document.getElementById('addTestReviewTutor').appendChild(defaultOptionTutor);

  //add in the student list. If no location is selected this will reject
  getStudentList(document.getElementById('calendarLocation').dataset.value)
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById('addTestReviewStudent'), studentUIDs, studentNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  //add in the tutor list. If no location is selected this will reject
  getTutorList(document.getElementById('calendarLocation').dataset.value)
  .then((tutors) => {
    let tutorNames = [];
    let tutorUIDs = [];
    tutors.forEach((tutor) => {
      tutorNames.push(tutor.name);
      tutorUIDs.push(tutor.id);
    });

    addSelectOptions(document.getElementById('addTestReviewTutor'), tutorUIDs, tutorNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });
  
  showAddTestReviewWrapper();
  openCalendarSidebar();
}

function setupEditTestReview(data, id) {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "editTestReview";
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  document.getElementById('editTestReviewStudent').textContent = data.studentName;

  //add back the default option (tutor)
  const defaultOptionTutor = document.createElement('option');
  defaultOptionTutor.value = "";
  defaultOptionTutor.textContent = "NO TUTOR"
  document.getElementById('addTestReviewTutor').appendChild(defaultOptionTutor);

  //add in the tutor list. If no location is selected this will reject
  getTutorList(document.getElementById('calendarLocation').dataset.value)
  .then((tutors) => {
    let tutorNames = [];
    let tutorUIDs = [];
    tutors.forEach((tutor) => {
      tutorNames.push(tutor.name);
      tutorUIDs.push(tutor.id);
    });

    addSelectOptions(document.getElementById('editTestReviewTutor'), tutorUIDs, tutorNames);

    //select previously saved tutors
    $("#editTestReviewTutor").closest(".ui.dropdown").dropdown('set value', data.staff);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  showEditTestReviewWrapper();
  openCalendarSidebar();
}

function setupAddLesson() {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "addLesson";
  main_calendar.setOption('selectable', true);

  //add back the default option (type)
  const defaultOptionType = document.createElement('option');
  defaultOptionType.value = "";
  defaultOptionType.setAttribute('selected', true);
  defaultOptionType.setAttribute('disabled', true);
  defaultOptionType.textContent = "select a type";
  document.getElementById('addLessonType').appendChild(defaultOptionType);

  //add back the default option (student)
  const defaultOptionStudent = document.createElement('option');
  defaultOptionStudent.value = "";
  defaultOptionStudent.setAttribute('selected', true);
  defaultOptionStudent.setAttribute('disabled', true);
  defaultOptionStudent.textContent = "select a student"
  document.getElementById('addLessonStudent').appendChild(defaultOptionStudent);

  //add the default option (tutor)
  const defaultOptionTutor = document.createElement('option');
  defaultOptionTutor.value = "noTutor";
  defaultOptionTutor.textContent = "NO TUTOR"
  document.getElementById('addLessonTutor').appendChild(defaultOptionTutor);

  //add in the list of lesson types. If no location is selected this will reject
  getLessonTypeList(document.getElementById('calendarLocation').dataset.value)
  .then((lessonTypes) => {
    let lessonNames = [];
    let lessonValues = [];
    lessonTypes.forEach((type) => {
      lessonNames.push(type.name);
      lessonValues.push(type.value);
    });

    addSelectOptions(document.getElementById('addLessonType'), lessonValues, lessonNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  //add in the student list. If no location is selected this will reject
  getStudentList(document.getElementById('calendarLocation').dataset.value)
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById('addLessonStudent'), studentUIDs, studentNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  //add in the tutor list. If no location is selected this will reject
  getTutorList(document.getElementById('calendarLocation').dataset.value)
  .then((tutors) => {
    let tutorNames = [];
    let tutorUIDs = [];
    tutors.forEach((tutor) => {
      tutorNames.push(tutor.name);
      tutorUIDs.push(tutor.id);
    });

    addSelectOptions(document.getElementById('addLessonTutor'), tutorUIDs, tutorNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });
  

  showAddLessonWrapper();
  openCalendarSidebar();
}

function setupEditLesson(data, id) {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "editLesson";
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  let lessonTypeReadable = '';

  switch(data.type) {
    case 'act':
      lessonTypeReadable = 'ACT';
      break;
    case 'subjectTutoring':
      lessonTypeReadable = 'Subject Tutoring';
      break;
    case 'mathProgram':
      lessonTypeReadable = 'Math Program';
      break;
    case 'phonicsProgram':
      lessonTypeReadable = 'Phonics Program';
      break;
    default:
      lessonTypeReadable = 'Lesson';
  }

  document.getElementById('editLessonType').textContent = lessonTypeReadable;
  document.getElementById('editLessonStudent').textContent = data.studentName;

  //add back the default option (tutor)
  const defaultOptionTutor = document.createElement('option');
  defaultOptionTutor.value = "noTutor";
  defaultOptionTutor.textContent = "NO TUTOR"
  document.getElementById('addLessonTutor').appendChild(defaultOptionTutor);

  //add in the tutor list. If no location is selected this will reject
  getTutorList(document.getElementById('calendarLocation').dataset.value)
  .then((tutors) => {
    let tutorNames = [];
    let tutorUIDs = [];
    tutors.forEach((tutor) => {
      tutorNames.push(tutor.name);
      tutorUIDs.push(tutor.id);
    });

    addSelectOptions(document.getElementById('editLessonTutor'), tutorUIDs, tutorNames);

    //select previously saved tutors
    $("#editLessonTutor").closest(".ui.dropdown").dropdown('set value', data.staff);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });

  showEditLessonWrapper();
  openCalendarSidebar();
}

function setupAddAvailability() {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "addAvailability";
  main_calendar.setOption('selectable', true);

  //add in the tutor list. If no location is selected this will reject
  getTutorList(document.getElementById('calendarLocation').dataset.value)
  .then((tutors) => {
    let tutorNames = [];
    let tutorUIDs = [];
    tutors.forEach((tutor) => {
      tutorNames.push(tutor.name);
      tutorUIDs.push(tutor.id);
    });

    addSelectOptions(document.getElementById('addAvailabilityTutor'), tutorUIDs, tutorNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar();
  });
  
  recurringEventTimesClickCallback(document.getElementById('addAvailabilityRecurringWrapper').children[0]);
  showAddAvailabilityWrapper();
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
      closeCalendarSidebar(true);
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this teacher meeting :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditTeacherMeeting() {
  if (!confirm('Are you sure you want to update this teacher meeting?')) {
    return
  }
  pending_calendar_event.meetingLocation = document.getElementById('editTeacherMeetingLocation').value;
  firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
  .then(() => {
    main_calendar.getEventById(pending_calendar_event_id).remove();
    main_calendar.addEvent({
      id: pending_calendar_event_id,
      ...pending_calendar_event
    })
    closeCalendarSidebar(true);
  })
  .catch((error) => {
    console.log(error);
    alert("We are having issues saving this teacher meeting :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddGeneralInfo() {
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const title = document.getElementById('addGeneralInfoTitle').value
  const staff = getDropdownValues('addGeneralInfoTutor');
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !title || !location) {
    return alert("It looks like you're still missing some data for this general info");
  }

  if (confirm("Are you sure you want to submit this event?")) {
    if (staff.length > 0) {
      //check for conflicts
      checkStaffConflicts(staff, start, end)
      .then((conflict) => {
        if (conflict) {
          return alert('There is a conflict with this staff: eventID = ' + conflict.id)
        }

        eventInfo = {
          type: 'generalInfo',
          start: start,
          end: end,
          allDay, allDay,
          title: title,
          staff: staff,
          location: location
        }

        saveGeneralInfo(eventInfo)
        .then((event) => {
          //FIXME: This should automatically update for the client and put it in a pending status
          main_calendar.addEvent(event);
          closeCalendarSidebar(true);
        })
      })
      .catch((error) => {
        console.log(error);
        alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
      })
    }
    else {
      eventInfo = {
        type: 'generalInfo',
        start: start,
        end: end,
        allDay, allDay,
        title: title,
        staff: staff,
        location: location
      }

      saveGeneralInfo(eventInfo)
      .then((event) => {
        //FIXME: This should automatically update for the client and put it in a pending status
        main_calendar.addEvent(event);
        closeCalendarSidebar(true);
      })
      .catch((error) => {
        console.log(error);
        alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
      })
    }
  }
}

function updateEditGeneralInfo() {
  if (!confirm('Are you sure you want to update this general info?')) {
    return
  }
  pending_calendar_event.title = document.getElementById('editGeneralInfoTitle').value;
  pending_calendar_event.staff = getDropdownValues('editGeneralInfoTutor');

  if (pending_calendar_event.staff.length > 0) {
    //check for conflicts
    checkStaffConflicts(pending_calendar_event.staff, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
    .then((conflict) => {
      if (conflict) {
        return alert('There is a conflict with this staff: eventID = ' + conflict.id)
      }

      //get the first tutor doc to grab their color
      //don't waste time if it hasn't changed
      if (pending_calendar_event.staff[0] != old_calendar_event.staff[0]) {
        firebase.firestore().collection('Tutors').doc(pending_calendar_event.staff[0]).get()
        .then((tutorDoc) => {
          pending_calendar_event.color = tutorDoc.data().color ?? null;
          pending_calendar_event.textColor = tinycolor.mostReadable(tutorDoc.data().color, ["#FFFFFF", "000000"]).toHexString()

          return firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
        })
        .then(() => {
          main_calendar.getEventById(pending_calendar_event_id).remove();
          main_calendar.addEvent({
            id: pending_calendar_event_id,
            ...pending_calendar_event
          })
          closeCalendarSidebar(true);
        })
      }
      // same first tutor; proceed
      else {
        firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
        .then(() => {
          main_calendar.getEventById(pending_calendar_event_id).remove();
          main_calendar.addEvent({
            id: pending_calendar_event_id,
            ...pending_calendar_event
          })
          closeCalendarSidebar(true);
        })
      }
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
  else {
    //get the first tutor doc to grab their color
    //don't waste time if it hasn't changed
    if (pending_calendar_event.staff[0] != old_calendar_event.staff[0]) {
      firebase.firestore().collection('Tutors').doc(pending_calendar_event.staff[0]).get()
      .then((tutorDoc) => {
        pending_calendar_event.color = tutorDoc.data().color ?? null;
        pending_calendar_event.textColor = tinycolor.mostReadable(tutorDoc.data().color, ["#FFFFFF", "000000"]).toHexString()

        return firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
      })
      .then(() => {
        main_calendar.getEventById(pending_calendar_event_id).remove();
        main_calendar.addEvent({
          id: pending_calendar_event_id,
          ...pending_calendar_event
        })
        closeCalendarSidebar(true);
      })
      .catch((error) => {
        console.log(error);
        alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
      })
    }
    // same first tutor; proceed
    else {
      firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
      .then(() => {
        main_calendar.getEventById(pending_calendar_event_id).remove();
        main_calendar.addEvent({
          id: pending_calendar_event_id,
          ...pending_calendar_event
        })
        closeCalendarSidebar(true);
      })
    }
  }
}

function submitAddPracticeTest() {
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const student = document.getElementById('addPracticeTestStudent').value;
  const description = document.getElementById('addPracticeTestDescription').value;
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !student || !location) {
    return alert("It looks like you're still missing some data for this practice test");
  }

  if (confirm("Are you sure you want to submit this event?")) {
    //check for conflicts
    checkStudentConflicts(student, start, end)
    .then((conflict) => {
      if (conflict) {
        return alert('There is a conflict with this student: eventID = ' + conflict.id)
      }

      eventInfo = {
        type: 'practiceTest',
        start: start,
        end: end,
        allDay, allDay,
        location: location,
        student: student,
        description: description,
        color: PRACTICE_TEST_COLOR,
        textColor: tinycolor.mostReadable(PRACTICE_TEST_COLOR, ["#FFFFFF", "000000"]).toHexString()
      }

      savePracticeTest(eventInfo)
      .then((event) => {
        //FIXME: This should automatically update for the client and put it in a pending status
        main_calendar.addEvent(event);
        closeCalendarSidebar(true);
      })
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this practice test :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditPracticeTest() {
  if (!confirm('Are you sure you want to update this practice test?')) {
    return
  }
  pending_calendar_event.description = document.getElementById('editPracticeTestDescription').value;
  //check for conflicts
  checkStudentConflicts(pending_calendar_event.student, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  .then((conflict) => {
    if (conflict) {
      return alert('There is a conflict with this student: eventID = ' + conflict.id)
    }

    firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
    .then(() => {
      main_calendar.getEventById(pending_calendar_event_id).remove();
      main_calendar.addEvent({
        id: pending_calendar_event_id,
        ...pending_calendar_event
      })
      closeCalendarSidebar(true);
    })
  })
  .catch((error) => {
    console.log(error);
    alert("We are having issues saving this practice test :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddConference() {
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const student = document.getElementById('addConferenceStudent').value;
  const description = document.getElementById('addConferenceDescription').value;
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !student || !location) {
    return alert("It looks like you're still missing some data for this conference");
  }

  if (confirm("Are you sure you want to submit this event?")) {
    //check for conflicts
    checkStudentConflicts(student, start, end)
    .then((conflict) => {
      if (conflict) {
        return alert('There is a conflict with this student: eventID = ' + conflict.id)
      }

      eventInfo = {
        type: 'conference',
        start: start,
        end: end,
        allDay, allDay,
        location: location,
        student: student,
        description: description,
        color: CONFERENCE_COLOR,
        textColor: tinycolor.mostReadable(CONFERENCE_COLOR, ["#FFFFFF", "000000"]).toHexString()
      }

      saveConference(eventInfo)
      .then((event) => {
        //FIXME: This should automatically update for the client and put it in a pending status
        main_calendar.addEvent(event);
        closeCalendarSidebar(true);
      })
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this conference :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditConference() {
  if (!confirm('Are you sure you want to update this conference?')) {
    return
  }
  pending_calendar_event.description = document.getElementById('editConferenceDescription').value;
  //check for conflicts
  checkStudentConflicts(pending_calendar_event.student, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  .then((conflict) => {
    if (conflict) {
      return alert('There is a conflict with this student: eventID = ' + conflict.id)
    }

    firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
    .then(() => {
      main_calendar.getEventById(pending_calendar_event_id).remove();
      main_calendar.addEvent({
        id: pending_calendar_event_id,
        ...pending_calendar_event
      })
      closeCalendarSidebar(true);
    })
  })
  .catch((error) => {
    console.log(error);
    alert("We are having issues saving this conference :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddTestReview() {
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const student = document.getElementById('addTestReviewStudent').value;
  const staff = getDropdownValues('addTestReviewTutor');
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !student || !location || staff.length == 0) {
    return alert("It looks like you're still missing some data for this test review");
  }

  if (confirm("Are you sure you want to submit this event?")) {
    //check for conflicts
    checkStudentConflicts(student, start, end)
    .then((conflict) => {
      if (conflict) {
        return alert('There is a conflict with this student: eventID = ' + conflict.id)
      }

      checkStaffConflicts(staff, start, end)
      .then((conflict) => {
        if (conflict) {
          return alert('There is a conflict with this staff: eventID = ' + conflict.id)
        }

        eventInfo = {
          type: 'testReview',
          start: start,
          end: end,
          allDay, allDay,
          location: location,
          student: student,
          staff: staff
        }
    
        saveTestReview(eventInfo)
        .then((event) => {
          //FIXME: This should automatically update for the client and put it in a pending status
          main_calendar.addEvent(event);
          closeCalendarSidebar(true);
        })
      })
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this test review :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditTestReview() {
  if (!confirm('Are you sure you want to update this test review?')) {
    return
  }
  pending_calendar_event.staff = getDropdownValues('editTestReviewTutor');

  //check for conflicts
  checkStudentConflicts(pending_calendar_event.student, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  .then((conflict) => {
    if (conflict) {
      return alert('There is a conflict with this student: eventID = ' + conflict.id)
    }

    checkStaffConflicts(pending_calendar_event.staff, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
    .then((conflict) => {
      if (conflict) {
        return alert('There is a conflict with this staff: eventID = ' + conflict.id)
      }

      //get the first tutor doc to grab their color
      //don't waste time if it hasn't changed
      if (pending_calendar_event.staff[0] != old_calendar_event.staff[0]) {
        firebase.firestore().collection('Tutors').doc(pending_calendar_event.staff[0]).get()
        .then((tutorDoc) => {
          pending_calendar_event.color = tutorDoc.data().color ?? null;
          pending_calendar_event.textColor = tinycolor.mostReadable(tutorDoc.data().color, ["#FFFFFF", "000000"]).toHexString()

          return firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
        })
        .then(() => {
          main_calendar.getEventById(pending_calendar_event_id).remove();
          main_calendar.addEvent({
            id: pending_calendar_event_id,
            ...pending_calendar_event
          })
          closeCalendarSidebar(true);
        })
      }
      // same first tutor; proceed
      else {
        firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
        .then(() => {
          main_calendar.getEventById(pending_calendar_event_id).remove();
          main_calendar.addEvent({
            id: pending_calendar_event_id,
            ...pending_calendar_event
          })
          closeCalendarSidebar(true);
        })
      }
    })
  })
  .catch((error) => {
    console.log(error);
    alert("We are having issues saving this test review :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddLesson() {
  ///decide if it is a single event or a recurring event
  let scheduleType = '';
  const radios = document.getElementsByName('addLessonEventSchedule');
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      scheduleType = radios[i].value
      break;
    }
  }

  const type = document.getElementById('addLessonType').value;
  const student = document.getElementById('addLessonStudent').value;
  const staff = getDropdownValues('addLessonTutor');
  const location = document.getElementById('calendarLocation').dataset.value;

  if (scheduleType == 'single') {
    const start = pending_calendar_event.start;
    const end = pending_calendar_event.end;
    const allDay = pending_calendar_event.allDay;

    if (!start || !type || !student || !location || staff.length == 0) {
      return alert("It looks like you're still missing some data for this test review");
    }

    if (confirm("Are you sure you want to submit this event?")) {
      //check for conflicts
      checkStudentConflicts(student, start, end)
      .then((conflict) => {
        if (conflict) {
          return alert('There is a conflict with this student: eventID = ' + conflict.id)
        }

        checkStaffConflicts(staff, start, end)
        .then((conflict) => {
          if (conflict) {
            return alert('There is a conflict with this staff: eventID = ' + conflict.id)
          }

          eventInfo = {
            type: type,
            start: start,
            end: end,
            allDay, allDay,
            location: location,
            student: student,
            staff: staff
          }
    
          saveLesson(eventInfo)
          .then((event) => {
            //FIXME: This should automatically update for the client and put it in a pending status
            main_calendar.addEvent(event);
            closeCalendarSidebar(true);
          })
        })
      })
      .catch((error) => {
        console.log(error);
        alert("We are having issues saving this lesson :(\nPlease try again and if the issue persist please contact the devs.");
      })
    }
  }

  else if (scheduleType == 'recurring') {
    let recurringPendingEventsFulfilled = [];
    let recurringEventsFulfilled = [];

    let studentConflicts = [];
    let staffConflicts = [];
    let pendingEvents = [];

    if (!pending_recurring_start.start || !pending_recurring_end.end || pending_recurring_times.length == 0 || !type || !student || !location || staff.length == 0) {
      return alert("It looks like you're still missing some data for this lesson");
    }
    if (confirm("Are you sure you want to submit these events?")) {
      //figure out all of the events that must be added based on recurring start, end, and times.
      const millisecondsWeek = 604800000;

      pending_recurring_times.forEach(weekTime => {
        let start = weekTime.start.getTime();
        let end = weekTime.end.getTime();

        //get the week time up to the start of the recurring schedule
        while (start < pending_recurring_start.start.getTime()) {
          start += millisecondsWeek;
          end += millisecondsWeek;
        }

        //save an event for each time until the end of the recurring
        while (end < pending_recurring_end.end.getTime()) {
          let passThruTimes = (start, end) => {
            //check for conflicts
            recurringPendingEventsFulfilled.push(
              checkStudentConflicts(student, start, end)
              .then((studentConflict) => {
                if (studentConflict) {
                  studentConflicts.push(studentConflict);
                  alert('There is a conflict with this student: eventID = ' + studentConflict.id)
                }

                return checkStaffConflicts(staff, start, end)
                .then((staffConflict) => {
                  if (staffConflict) {
                    staffConflicts.push(staffConflict)
                    alert('There is a conflict with this staff: eventID = ' + staffConflict.id)
                  }

                  let eventInfo = {
                    type: type,
                    start: start,
                    end: end,
                    allDay: weekTime.allDay,
                    location: location,
                    student: student,
                    staff: staff
                  }
                  pendingEvents.push(eventInfo);
                })
              })
            );
          }
          passThruTimes(start, end);
          start += millisecondsWeek;
          end += millisecondsWeek;
        }
      })

      Promise.all(recurringPendingEventsFulfilled)
      .then(() => {
        if (studentConflicts.length == 0 && staffConflicts.length == 0) {
          console.log(pendingEvents);
          pendingEvents.forEach(event => {
            recurringEventsFulfilled.push(saveLesson(event));
          })

          Promise.all(recurringEventsFulfilled)
          .then(events => {
            events.forEach(event => {
              main_calendar.addEvent(event);
            })
            closeCalendarSidebar(true);
          })
          .catch((error) => {
            console.log(error);
            alert("We are having issues saving this lesson :(\nPlease try again and if the issue persist please contact the devs.");
          })
        }
        else {
          console.log(studentConflicts);
          console.log(staffConflicts);
          console.log(pendingEvents);
        }
      })
    }
  }

  else {
    console.warn("no schedule type: shouldn't be possible.")
  }
}

function updateEditLesson() {
  if (!confirm('Are you sure you want to update this availability?')) {
    return
  }
  pending_calendar_event.staff = getDropdownValues('editLessonTutor');

  //check for conflicts
  checkStudentConflicts(pending_calendar_event.student, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  .then((conflict) => {
    if (conflict) {
      return alert('There is a conflict with this student: eventID = ' + conflict.id)
    }

    checkStaffConflicts(pending_calendar_event.staff, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
    .then((conflict) => {
      if (conflict) {
        return alert('There is a conflict with this staff: eventID = ' + conflict.id)
      }

      //get the first tutor doc to grab their color
      //don't waste time if it hasn't changed
      if (pending_calendar_event.staff[0] != old_calendar_event.staff[0]) {
        firebase.firestore().collection('Tutors').doc(pending_calendar_event.staff[0]).get()
        .then((tutorDoc) => {
          pending_calendar_event.color = tutorDoc.data().color ?? null;
          pending_calendar_event.textColor = tinycolor.mostReadable(tutorDoc.data().color, ["#FFFFFF", "000000"]).toHexString()

          return firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
        })
        .then(() => {
          main_calendar.getEventById(pending_calendar_event_id).remove();
          main_calendar.addEvent({
            id: pending_calendar_event_id,
            ...pending_calendar_event
          })
          closeCalendarSidebar(true);
        })
      }
      // same first tutor; proceed
      else {
        firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
        .then(() => {
          main_calendar.getEventById(pending_calendar_event_id).remove();
          main_calendar.addEvent({
            id: pending_calendar_event_id,
            ...pending_calendar_event
          })
          closeCalendarSidebar(true);
        })
      }
    })
  })
  .catch((error) => {
    console.log(error);
    alert("We are having issues saving this lesson :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddAvailability() {
  const staff = document.getElementById('addAvailabilityTutor').value;
  const location = document.getElementById('calendarLocation').dataset.value;

  let recurringEventsFulfilled = [];

  if (!pending_recurring_start.start || !pending_recurring_end.end || !staff || !location) {
    return alert("It looks like you're still missing some data for this lesson");
  }

  if (pending_recurring_times.length == 0) {
    if (!confirm('You are about to remove all availability for this staff member starting from the start date. Are you sure you want to proceed?')) {
      return
    }
  }
  else {
    if (!confirm('Are you sure you want to submit this availability? This action will remove all availability for this staff member from the start date and replace it with what was entered.')) {
      return
    }
  }

  //remove all availability for the staff member starting with the recurring start date going forward
  firebase.firestore().collection('Events')
  .where('staff', 'array-contains', staff)
  .where('type', '==', 'availability')
  .where('start', '>=', pending_recurring_start.start.getTime())
  .get()
  .then(querySnapshot => {
    let deletePromises = [];
    querySnapshot.forEach(eventDoc => {
      deletePromises.push(deleteEvent(eventDoc.id)
      .then(() => {
        main_calendar.getEventById(eventDoc.id)?.remove()
      }))
    })

    Promise.all(deletePromises)
    .then(() => {
      //figure out all of the events that must be added based on recurring start, end, and times.
      const millisecondsWeek = 604800000;

      pending_recurring_times.forEach(weekTime => {
        let start = weekTime.start.getTime();
        let end = weekTime.end.getTime();

        //get the week time up to the start of the recurring schedule
        while (start < pending_recurring_start.start.getTime()) {
          start += millisecondsWeek;
          end += millisecondsWeek;
        }

        //save an event for each time until the end of the recurring
        while (end < pending_recurring_end.end.getTime()) {
          let eventInfo = {
            type: 'availability',
            start: start,
            end: end,
            allDay: weekTime.allDay,
            location: location,
            staff: staff
          }

          recurringEventsFulfilled.push(saveAvailability(eventInfo));

          start += millisecondsWeek;
          end += millisecondsWeek;
        }

      })

      Promise.all(recurringEventsFulfilled)
      .then(events => {
        events.forEach(event => {
          main_calendar.addEvent(event);
        })
        closeCalendarSidebar(true);
      })
    })
  })
  .catch((error) => {
    console.log(error);
    alert("We are having issues saving this availability :(\nPlease try again and if the issue persist please contact the devs.");
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
  if (eventInfo.staff[0]) {
    let eventData = {};
    //get first staff name for color
    return firebase.firestore().collection("Tutors").doc(eventInfo.staff[0]).get()
    .then((tutorDoc) => {
      tutorData = tutorDoc.data();
      const tutorColor = tutorData?.color;
      eventData = {
        type: eventInfo.type,
        title: eventInfo.title,
        staff: eventInfo.staff,
        start: parseInt(eventInfo.start),
        end: parseInt(eventInfo.end),
        allDay: eventInfo.allDay,
        location: eventInfo.location,
        color: tutorColor ?? GENRAL_INFO_COLOR,
        textColor: tutorColor ? tinycolor.mostReadable(tutorColor, ["#FFFFFF", "000000"]).toHexString() : tinycolor.mostReadable(GENRAL_INFO_COLOR, ["#FFFFFF", "000000"]).toHexString()
      }
      return eventRef.set(eventData)
    })
    .then(() => {
      return {
        id: eventRef.id,
        title: eventData.title,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
        allDay: eventData.allDay,
        color: eventData.color,
        textColor: eventData.textColor,
      }
    })
  }
  else {
    let eventData = {
      type: eventInfo.type,
      title: eventInfo.title,
      staff: eventInfo.staff,
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      color: GENRAL_INFO_COLOR,
      textColor: tinycolor.mostReadable(GENRAL_INFO_COLOR, ["#FFFFFF", "000000"]).toHexString()
    }
    return eventRef.set(eventData)
    .then(() => {
      return {
        id: eventRef.id,
        title: eventData.title,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
        allDay: eventData.allDay,
        color: eventData.color,
        textColor: eventData.textColor,
      }
    })
  }
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
      description: eventInfo.description,
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
      description: eventInfo.description,
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
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
        allDay: eventData.allDay,
        color: eventData.color,
        textColor: eventData.textColor,
      }
    })

  })
}

function saveTestReview(eventInfo) {
  let studentData = {};
  let tutorData = {};

  //get the student doc for name and parent
  return firebase.firestore().collection("Students").doc(eventInfo.student).get()
  .then((studentDoc) => {
    studentData = studentDoc.data();
    
    //get first staff name for color
    return firebase.firestore().collection("Tutors").doc(eventInfo.staff[0]).get()
  })
  .then((tutorDoc) => {
    tutorData = tutorDoc.data();

    const studentName = studentData.studentLastName + ", " + studentData.studentFirstName;
    const studentParent = studentData.parent;
    const tutorColor = tutorData?.color;

    const eventRef = firebase.firestore().collection("Events").doc()
    let eventData = {
      type: eventInfo.type,
      title: studentName + " - Test Review",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      color: tutorColor ?? null,
      textColor: tinycolor.mostReadable(tutorColor, ["#FFFFFF", "000000"]).toHexString() ?? null,

      student: eventInfo.student,
      studentName: studentName,
      
      parent: studentParent,

      staff: eventInfo.staff,

      attendees: [eventInfo.student, studentParent, ...eventInfo.staff]
    }
    return eventRef.set(eventData)
    .then(() => {
      return {
        id: eventRef.id,
        title: eventData.title,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
        allDay: eventData.allDay,
        color: eventData.color,
        textColor: eventData.textColor,
      }
    })
  })
}

function saveLesson(eventInfo) {
  let studentData = {};
  let tutorData = {};

  //get the student doc for name and parent
  return firebase.firestore().collection("Students").doc(eventInfo.student).get()
  .then((studentDoc) => {
    studentData = studentDoc.data();
    
    //get first staff name for color
    return firebase.firestore().collection("Tutors").doc(eventInfo.staff[0]).get()
  })
  .then((tutorDoc) => {
    tutorData = tutorDoc.data();

    const studentName = studentData.studentLastName + ", " + studentData.studentFirstName;
    const studentParent = studentData.parent;
    const tutorColor = tutorData?.color;
    let lessonTypeReadable = ""

    switch(eventInfo.type) {
      case 'act':
        lessonTypeReadable = 'ACT';
        break;
      case 'subjectTutoring':
        lessonTypeReadable = 'Subject Tutoring';
        break;
      case 'mathProgram':
        lessonTypeReadable = 'Math Program';
        break;
      case 'phonicsProgram':
        lessonTypeReadable = 'Phonics Program';
        break;
      default:
        lessonTypeReadable = 'Lesson';
    }

    const eventRef = firebase.firestore().collection("Events").doc()
    let eventData = {
      type: eventInfo.type,
      title: studentName + " - " + lessonTypeReadable,
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      color: tutorColor ?? null,
      textColor: tinycolor.mostReadable(tutorColor, ["#FFFFFF", "000000"]).toHexString() ?? null,

      student: eventInfo.student,
      studentName: studentName,
      
      parent: studentParent,

      staff: eventInfo.staff,

      attendees: [eventInfo.student, studentParent, ...eventInfo.staff]
    }
    return eventRef.set(eventData)
    .then(() => {
      return {
        id: eventRef.id,
        title: eventData.title,
        start: convertFromDateInt(eventData.start).fullCalendar,
        end: convertFromDateInt(eventData.end).fullCalendar,
        allDay: eventData.allDay,
        color: eventData.color,
        textColor: eventData.textColor,
      }
    })
  })
}

function saveAvailability(eventInfo) {
  let tutorData = {};

  return firebase.firestore().collection("Tutors").doc(eventInfo.staff).get()
  .then((tutorDoc) => {
    tutorData = tutorDoc.data();

    const tutorColor = tutorData?.color;
    const tutorName = tutorData.tutorFirstName + " " + tutorData.tutorLastName;

    const eventRef = firebase.firestore().collection("Events").doc()
    let eventData = {
      type: eventInfo.type,
      title: tutorName + " - Availability",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      color: tutorColor ?? AVAILABILITY_COLOR,
      textColor: tutorColor ? tinycolor.mostReadable(tutorColor, ["#FFFFFF", "000000"]).toHexString() : tinycolor.mostReadable(AVAILABILITY_COLOR, ["#FFFFFF", "000000"]).toHexString(),

      staff: [eventInfo.staff],
    }
    return eventRef.set(eventData)
    .then(() => {
      return {
        id: eventRef.id,
        title: eventData.title,
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

function getLessonTypeList(location) {
  if(!location) {
    alert("Choose a location first!");
    return Promise.reject('no location selected')
  }
  return firebase.firestore().collection("Locations").doc(location).get()
  .then(locationDoc => {
    return locationDoc.data().lessonTypes;
  })
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

function getTutorList(location) {
  if(!location) {
    alert("Choose a location first!");
    return Promise.reject('no location selected')
  }
  return firebase.firestore().collection("Tutors").where("location", "==", location).orderBy("tutorLastName").get()
  .then((tutorSnapshot) => {
    let tutors = [];
    tutorSnapshot.forEach((tutorDoc) => {
      const data = tutorDoc.data();
      tutors.push({
        name: data.tutorLastName + ", " + data.tutorFirstName,
        id: tutorDoc.id
      })
    })

    return tutors;
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

/**
 * Remove the 'selected' class from all siblings and self
 * @param {Node} child child node whose siblings (including self) will have the 'selected' class removed 
 */
function unselectSiblings(child) {
  child.parentNode.querySelectorAll('*').forEach(sibling => {
    sibling.classList.remove('selected');
  })
}

function clearAddLessonRecurringSelected() {
  //unselect the buttons for recurring
  unselectSiblings(document.getElementById('addLessonRecurringWrapper').children.item(0))

  //remove any recurring event data from pending?
}

function clearAddLessonSingleSelected() {
  //remove any single event data from pending?
}

function addLessonSingleSelected(target) {
  clearAddLessonRecurringSelected();

  //set up the default behavior when adding single events
  initializeDefaultCalendar([]);
  main_calendar.setOption('selectable', true);
}

function addLessonRecurringSelected(target) {
  clearAddLessonSingleSelected();

  recurringEventTimesClickCallback(document.getElementById('addLessonRecurringWrapper').children[0]);
}

function recurringEventTimesClickCallback(target) {
  unselectSiblings(target);
  target.classList.add('selected');

  initializeWeeklyScheduleCalendar(pending_recurring_times);
}

function recurringEventStartEndClickCallback(target) {
  unselectSiblings(target);
  target.classList.add('selected');

  initializepMonthScheduleCalendar([pending_recurring_start, pending_recurring_end]);
}

//FIXME: are the assumptions good?
function checkStaffConflicts(staffUIDs, start, end, ignoredEventID = "") {
  //query for an event that starts within the start and end of the event to check
  return firebase.firestore().collection('Events')
  .where('staff', 'array-contains-any', staffUIDs)
  .where('start', '>=', start)
  .where('start', '<', end)
  .get()
  .then((startSnapshot) => {
    if (startSnapshot.empty || validConflictQuerySnapshot(startSnapshot, ignoredEventID)) {
      //if query size is 0
      //query for an event that ends within the start and end of the event to check
      return firebase.firestore().collection('Events')
      .where('staff', 'array-contains-any', staffUIDs)
      .where('end', '>', start)
      .where('end', '<=', end)
      .get()
      .then((endSnapshot) => {
        if (endSnapshot.empty || validConflictQuerySnapshot(endSnapshot, ignoredEventID)) {
          //if query size is 0
    
          //ASSUMPTION
          //this case will only work if we garuntee conflicts will never happen so we garuntee the the next event to end will not also be contained with a conflict
          //we can fix this by querying for all future events which might be a lot but less than query for all past events
    
          //query for the first event that ends after the end of the event to check
          //then see if that events start before the end or start of the event to check
          return firebase.firestore().collection('Events')
          .where('staff', 'array-contains-any', staffUIDs)
          .where('end', '>', end)
          .orderBy('end')
          .limit(10)
          .get()
          .then((outerSnapshot) => {
            for (let i = 0; i < outerSnapshot.size; i++) {
              if (outerSnapshot.docs[i].id != ignoredEventID && outerSnapshot.docs[i].data().type != 'availability' && outerSnapshot.docs[i].data().start < end) {
                return outerSnapshot.docs[i]
              }
            }
            return null
          })
        }
        else {
          return endSnapshot.docs[0];
        }
      })
    }
    else {
      return startSnapshot.docs[0];
    }
  })
}

function checkStudentConflicts(studentUID, start, end, ignoredEventID = "") {
  //query for an event that starts within the start and end of the event to check
  return firebase.firestore().collection('Events')
  .where('student', '==', studentUID)
  .where('start', '>=', start)
  .where('start', '<', end)
  .get()
  .then((startSnapshot) => {
    if (startSnapshot.empty || validConflictQuerySnapshot(startSnapshot, ignoredEventID)) {
      //if query size is 0
      //query for an event that ends within the start and end of the event to check
      return firebase.firestore().collection('Events')
      .where('student', '==', studentUID)
      .where('end', '>', start)
      .where('end', '<=', end)
      .get()
      .then((endSnapshot) => {
        if (endSnapshot.empty || validConflictQuerySnapshot(endSnapshot, ignoredEventID)) {
          //if query size is 0
    
          //ASSUMPTION
          //this case will only work if we garuntee conflicts will never happen so we garuntee the the next event to end will not also be contained with a conflict
          //we can fix this by querying for all future events which might be a lot but less than query for all past events
    
          //query for the first event that ends after the end of the event to check
          //then see if that events start before the end or start of the event to check
          return firebase.firestore().collection('Events')
          .where('student', '==', studentUID)
          .where('end', '>', end)
          .orderBy('end')
          .limit(10)
          .get()
          .then((outerSnapshot) => {
            for (let i = 0; i < outerSnapshot.size; i++) {
              if (outerSnapshot.docs[i].id != ignoredEventID && outerSnapshot.docs[i].data().type != 'availability' && outerSnapshot.docs[i].data().start < end) {
                return outerSnapshot.docs[i]
              }
            }
            return null
          })
        }
        else {
          return endSnapshot.docs[0];
        }
      })
    }
    else {
      return startSnapshot.docs[0];
    }
  })
}

function validConflictQuerySnapshot(querySnapshot, ignoredEventID) {
  let isValid = true;
  querySnapshot.forEach(doc => {
    if (doc.id != ignoredEventID && doc.data().type != 'availability') {
      isValid = false;
    }
  })

  return isValid;
}
