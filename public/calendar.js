let calendar_mode = "default";
let pending_calendar_event = {}
let pending_calendar_event_id = "";
let old_calendar_event = {}
let old_calendar_event_id = "";
let pending_recurring_times = [];
let pending_recurring_start = {};
let pending_recurring_end = {};

const PRACTICE_TEST_COLOR = "#CDF7F4";
const CONFERENCE_COLOR = "#7FF3FB";
const GENRAL_INFO_COLOR = "#B3B3B3";
const TEACHER_MEETING_COLOR = "#B3B3B3";

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
  getEventsLocation(location, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime())
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



function initializeDefaultCalendar(events) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  var calendarEl = document.getElementById('calendar');
  calendarEl.classList.remove('noToday');

  main_calendar = new FullCalendar.Calendar(calendarEl, {
    height: "100%",
    initialView: 'timeGridWeek',
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
        getEventsLocation(location, dateInfo.start.getTime(), dateInfo.end.getTime())
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

    // businessHours: [
    //   {
    //     daysOfWeek: [1, 2, 3, 4],
    //     startTime: '09:00',
    //     endTime: '17:00'
    //   },
    //   {
    //     daysOfWeek: [5],
    //     startTime: '9:00',
    //     endTime: '13:00'
    //   }
    // ],

    events: events
  });
  main_calendar.render();
}

function initializeWeeklyScheduleCalendar(events) {
  if (main_calendar) {
    main_calendar.destroy();
  }

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

  //add back the eventClickHandler
  main_calendar.setOption('eventClick', eventClickHandler);
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

function getEventsLocation(location, start, end) {
  return firebase.firestore().collection('Events').where("location", '==', location).where('start', '>=', start).where('start', '<', end).get()
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
    case 'lesson':
      setupAddLesson();
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

  document.getElementById('editPracticeTestStudent').textContent = data.studentName;
  document.getElementById('editPracticeTestDescription').value = data.description;

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

  document.getElementById('editConferenceStudent').textContent = data.studentName;
  document.getElementById('editConferenceDescription').value = data.description;

  showEditConferenceWrapper();
  openCalendarSidebar();
}

function setupAddTestReview() {
  //close the sidebar just in case another tab is open.
  closeCalendarSidebar();
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
  closeCalendarSidebar();
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
  closeCalendarSidebar();
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
  const description = document.getElementById('addPracticeTestDescription').value;
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
      description: description,
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
  pending_calendar_event.description = document.getElementById('editPracticeTestDescription').value;
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
  const description = document.getElementById('addConferenceDescription').value;
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
      description: description,
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
  pending_calendar_event.description = document.getElementById('editConferenceDescription').value;
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
      closeCalendarSidebar();
    })
    .catch((error) => {
      console.log(error);
      alert("We are having issues saving this test review :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
}

function updateEditTestReview() {
  pending_calendar_event.staff = getDropdownValues('editTestReviewTutor');

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
      closeCalendarSidebar();
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
      closeCalendarSidebar();
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
    const tutorColor = tutorData.calendarColor;

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

  //remove any recurring event data from pending
}

function claerAddLessonSingleSelected() {
  //remove any single event data from pending
}

function addLessonSingleSelected(target) {
  clearAddLessonRecurringSelected();

  //set up the default behavior when adding single events
  initializeDefaultCalendar([]);
  main_calendar.setOption('selectable', true);
}

function addLessonRecurringSelected(target) {
  claerAddLessonSingleSelected();
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