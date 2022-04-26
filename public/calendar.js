let calendar_mode = "default";
let calendar_view = 'defualt';
let pending_calendar_event = {}
let pending_calendar_event_id = "";
let old_calendar_event = {}
let old_calendar_event_id = "";
let pending_recurring_times = [];
let pending_recurring_start = {};
let pending_recurring_end = {};

let current_type = null;
let current_location = null;
let current_filter = {};
let current_availability_filter = {};
let current_opening_qualification_filter = null;
let current_opening_event_length = 30;
let current_opening_recurring_weeks = 1;

const PRACTICE_TEST_COLOR = "#CDF7F4";
const CONFERENCE_COLOR = "#7FF3FB";
const GENRAL_INFO_COLOR = "#B3B3B3";
const TEACHER_MEETING_COLOR = "#B3B3B3";
const AVAILABILITY_COLOR = "#F09C99";
const TEST_COLOR = "#A985F7";

const STAFF_ROLES = ['tutor', 'secretary', 'admin'];
const LESSON_TYPES = ['act', 'subjectTutoring', 'apExam'];

let current_user;

let main_calendar;

let storage = firebase.storage();

// TEST
// firebase.firestore().collection('Locations').doc('WIZWBumUoo7Ywkc3pl2G').update({
//   lessonTypes : [
//     {
//       name: 'Comprehensive ACT',
//       price: 90,
//       value: 'actComprehensive',
//       subtypes : [
//         {
//           name: 'English',
//           value: 'english'
//         },
//         {
//           name: 'Math',
//           value: 'math'
//         },
//         {
//           name: 'Reading',
//           value: 'reading'
//         },
//         {
//           name: 'Science',
//           value: 'science'
//         },
//       ]
//     },
//     {
//       name: 'ACT Fundamentals',
//       price: 70,
//       value: 'actFundamentals',
//       subtypes : [
//         {
//           name: 'English',
//           value: 'english'
//         },
//         {
//           name: 'Math',
//           value: 'math'
//         },
//         {
//           name: 'Reading',
//           value: 'reading'
//         },
//         {
//           name: 'Science',
//           value: 'science'
//         },
//       ]
//     },
//     {
//       name: 'AP Exam',
//       price: 60,
//       value: 'apExam',
//       subtypes : [
//         {
//           name: 'Research',
//           value: 'research'
//         },
//         {
//           name: 'Seminar',
//           value: 'seminar'
//         },
//         {
//           name: 'Art and Design Program',
//           value: 'artAndDesignProgram'
//         },
//         {
//           name: 'Art History',
//           value: 'artHistory'
//         },
//         {
//           name: 'Music Theory',
//           value: 'musicTheory'
//         },
//         {
//           name: 'Language and Composition',
//           value: 'languageAndComposition'
//         },
//         {
//           name: 'Literature and Composition',
//           value: 'literatureAndComposition'
//         },
//         {
//           name: 'FIXME: add the rest...',
//           value: 'fixme'
//         },
//       ]
//     },
//     {
//       name: 'Subject Tutoring',
//       price: 50,
//       value: 'subjectTutoring',
//       subtypes : [
//         {
//           name: 'Math',
//           value: 'math'
//         },
//         {
//           name: 'Physics',
//           value: 'physics'
//         },
//         {
//           name: 'Chemistry',
//           value: 'chemistry'
//         },
//         {
//           name: 'Biology',
//           value: 'biology'
//         },
//         {
//           name: 'English',
//           value: 'english'
//         },
//         {
//           name: 'History',
//           value: 'history'
//         },
//         {
//           name: 'Spanish',
//           value: 'spanish'
//         },
//         {
//           name: 'French',
//           value: 'french'
//         },
//       ]
//     },
//   ]
// })
// .then(() => {
//   console.log('all done')
// })
// TEST


function initialSetup() {
  //set up the semantic ui dropdowns
  $('.ui.dropdown').dropdown();
  //get the blank calendar before filling in events
  initializeDefaultCalendar([]);

  firebase.auth().onAuthStateChanged((user) => {
    current_user = user;
    //Get all locations for right now
    //getLocationList(user)
    getAllLocations()
    .then((locations) => {
      let locationNames = [];
      let locationIDs = [];
      locations.forEach((location) => {
        locationNames.push(location.name);
        locationIDs.push(location.id);
      });
      addDropdownOptions(document.getElementById('calendarLocation'), locationIDs, locationNames, locationChange);
      addDropdownOptions(document.getElementById('calendarType'), ['availability', 'event', 'opening'], ['Availability', 'Event', 'Opening'], typeChange);

      //select the event calendar by default and the first location
      document.querySelector('#calendarType .dropdown-content>div[data-value="opening"]').dispatchEvent(new Event('click'));
      document.querySelector('#calendarLocation .dropdown-content>div').dispatchEvent(new Event('click'));
    })
    .catch((error) =>{
      console.log(error);
      alert("We had an issue loading the calendar events. Try refreshing the page.")
    })
  })
}

function setupNavLists(locationUID) {
  //remove the old lists and add in defualt option
  //student list
  for (let i = document.getElementById('studentFilterContent').options.length; i > 0; i--) {
    document.getElementById('studentFilterContent').options[i-1].remove();
  }
  let studentDefaultOption = document.createElement('option');
  studentDefaultOption.value = "";
  studentDefaultOption.textContent = 'select a student';
  document.getElementById('studentFilterContent').appendChild(studentDefaultOption);

  //staff list
  for (let i = document.getElementById('staffFilterContent').options.length; i > 0; i--) {
    document.getElementById('staffFilterContent').options[i-1].remove();
  }
  let staffDefaultOption = document.createElement('option');
  staffDefaultOption.value = "";
  staffDefaultOption.textContent = 'select a staff';
  document.getElementById('staffFilterContent').appendChild(staffDefaultOption);

  //type list
  let typeDefaultOption = document.createElement('option');
  typeDefaultOption.value = "";
  typeDefaultOption.textContent = 'select a type';
  document.getElementById('typeFilterContent').options[0] = typeDefaultOption;

  //filter availability list
  for (let i = document.getElementById('staffAvailabilityContent').options.length; i > 0; i--) {
    document.getElementById('staffAvailabilityContent').options[i-1].remove();
  }
  let staffAvailabilityDefaultOption = document.createElement('option');
  staffAvailabilityDefaultOption.value = "";
  staffAvailabilityDefaultOption.textContent = 'select a staff';
  document.getElementById('staffAvailabilityContent').appendChild(staffAvailabilityDefaultOption);

  //qualification list
  for (let i = document.getElementById('qualificationOpeningContent').options.length; i > 0; i--) {
    document.getElementById('qualificationOpeningContent').options[i-1].remove();
  }
  let qualificationDefaultOption = document.createElement('option');
  qualificationDefaultOption.value = "";
  qualificationDefaultOption.textContent = 'select a qualifcation';
  document.getElementById('qualificationOpeningContent').appendChild(qualificationDefaultOption);

  //add in the options for the given location
  getUserListByRole(locationUID, ['student'])
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById('studentFilterContent'), studentUIDs, studentNames);
    $('#studentFilterContent').closest(".ui.dropdown").dropdown('clear');
    $('#studentFilterContent').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
    $('#studentFilterContent').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
    $('#studentFilterContent').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
    // $('#studentFilterContent').closest(".ui.dropdown").dropdown('setting', 'placeholder', 'select a student');
    $('#studentFilterContent').closest(".ui.dropdown").dropdown('setting', 'onChange', 
      (value, text) => {
        current_filter.student = value;
        //change the filter label
        if (current_filter?.student[0] || current_filter?.staff[0] || current_filter?.type[0]) {
          document.getElementById('filterSelection').innerHTML = 'filter active';
        }
        else {
          document.getElementById('filterSelection').innerHTML = 'filter events';
        }
        
        getCurrentCalendarTypeContent();
      })
  })
  .catch((error) => {
    console.log(error)
  });

  getUserListByRole(locationUID, STAFF_ROLES)
  .then((staff) => {
    let staffNames = [];
    let staffUIDs = [];
    staff.forEach((staff) => {
      staffNames.push(staff.name);
      staffUIDs.push(staff.id);
    });

    addSelectOptions(document.getElementById('staffFilterContent'), staffUIDs, staffNames);
    $('#staffFilterContent').closest(".ui.dropdown").dropdown('clear');
    $('#staffFilterContent').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
    $('#staffFilterContent').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
    $('#staffFilterContent').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
    // $('#staffFilterContent').closest(".ui.dropdown").dropdown('setting', 'placeholder', 'select a staff');
    $('#staffFilterContent').closest(".ui.dropdown").dropdown('setting', 'onChange', 
      (value, text) => {
        current_filter.staff = value;
        //change the filter label
        if (current_filter?.student[0] || current_filter?.staff[0] || current_filter?.type[0]) {
          document.getElementById('filterSelection').innerHTML = 'filter active';
        }
        else {
          document.getElementById('filterSelection').innerHTML = 'filter events';
        }
        
        getCurrentCalendarTypeContent()
      })

    addSelectOptions(document.getElementById('staffAvailabilityContent'), staffUIDs, staffNames);
    $('#staffAvailabilityContent').closest(".ui.dropdown").dropdown('clear');
    $('#staffAvailabilityContent').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
    $('#staffAvailabilityContent').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
    $('#staffAvailabilityContent').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
    // $('#staffAvailabilityContent').closest(".ui.dropdown").dropdown('setting', 'placeholder', 'select a staff');
    //firebase will only allow 10 OR queries on a given field
    $('#staffAvailabilityContent').closest(".ui.dropdown").dropdown('setting', 'maxSelections', 10);
    $('#staffAvailabilityContent').closest(".ui.dropdown").dropdown('setting', 'onChange', 
      (value, text) => {
        current_availability_filter = value;
        
        //change the filter label
        if (current_availability_filter.length == 0) {
          document.getElementById('availabilitySelection').innerHTML = 'filter availability';
        }
        else {
          document.getElementById('availabilitySelection').innerHTML = 'filter active';
        }
        
        getCurrentCalendarTypeContent()
      })
  })
  .catch((error) => {
    console.log(error)
  });

  $('#typeFilterContent').closest(".ui.dropdown").dropdown('clear');
  $('#typeFilterContent').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
  $('#typeFilterContent').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
  $('#typeFilterContent').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
  // $('#typeFilterContent').closest(".ui.dropdown").dropdown('setting', 'placeholder', 'select a type');
  $('#typeFilterContent').closest(".ui.dropdown").dropdown('setting', 'onChange', 
    (value, text) => {
      current_filter.type = value;
      //change the filter label
      if (current_filter?.student[0] || current_filter?.staff[0] || current_filter?.type[0]) {
        document.getElementById('filterSelection').innerHTML = 'filter active';
      }
      else {
        document.getElementById('filterSelection').innerHTML = 'filter events';
      }
      
      getCurrentCalendarTypeContent()
    })

  getLessonTypeList(current_location)
  .then(lessonTypes => {
    let qualificationNames = [];
    let qualificationValues = [];

    //go through the types and append their subtypes
    lessonTypes.forEach(type => {
      if (type.subtypes) {
        type.subtypes.forEach(subtype => {
          qualificationNames.push(type.name + ' ' + subtype.name);
          qualificationValues.push(type.value + '-' + subtype.value);
        })
      }
      else {
        qualificationNames.push(type.name);
        qualificationValues.push(type.value);
      }
    })

    addSelectOptions(document.getElementById('qualificationOpeningContent'), qualificationValues, qualificationNames);
    $('#qualificationOpeningContent').closest(".ui.dropdown").dropdown('clear');
    $('#qualificationOpeningContent').closest(".ui.dropdown").dropdown('setting', 'fullTextSearch', 'exact');
    $('#qualificationOpeningContent').closest(".ui.dropdown").dropdown('setting', 'match', 'text');
    $('#qualificationOpeningContent').closest(".ui.dropdown").dropdown('setting', 'forceSelection', false);
    // $('#qualificationOpeningContent').closest(".ui.dropdown").dropdown('setting', 'placeholder', 'select a qualification');
    $('#qualificationOpeningContent').closest(".ui.dropdown").dropdown('setting', 'onChange', 
      (value, text) => {
        current_opening_qualification_filter = value;
        
        //change the filter label
        if (!current_opening_qualification_filter) {
          document.getElementById('openingSelection').innerHTML = 'filter qualification';
        }
        else {
          document.getElementById('openingSelection').innerHTML = 'filter active';
        }
        
        getCurrentCalendarTypeContent()
      })
  })
}

function clearFilter(resetCalendar = false) {
  for (key in current_filter) {
    delete key;
  }
  $('#studentFilterContent').closest(".ui.dropdown").dropdown('clear');
  $('#staffFilterContent').closest(".ui.dropdown").dropdown('clear');
  $('#typeFilterContent').closest(".ui.dropdown").dropdown('clear');

  if (resetCalendar) {
    getCurrentCalendarTypeContent()
  }
}

function clearAvailabilityFilter(resetCalendar = false) {
  while (current_availability_filter.length > 0) {
    current_availability_filter.pop();
  }
  $('#staffAvailabilityContent').closest(".ui.dropdown").dropdown('clear');

  if (resetCalendar) {
    getCurrentCalendarTypeContent()
  }
}

function clearOpeningQualificationFilter(resetCalendar = false) {
  current_opening_qualification_filter = null;;
  $('#qualificationOpeningContent').closest(".ui.dropdown").dropdown('clear');

  if (resetCalendar) {
    getCurrentCalendarTypeContent()
  }
}

function addDropdownOptions(dropdownElement, optionValues, optionTexts, clickCallback) {
  let contentDiv = dropdownElement.querySelector('.dropdown-content');
  let dropdownBtn = dropdownElement.querySelector('.dropbtn');

  //check that the values and texts match in length
  if (optionValues.length != optionTexts.length) {throw "option values and options texts must have the same number of elements"}

  optionValues.forEach((optionValue, valueIndex) => {
    let option = document.createElement('div');
    option.setAttribute('data-value', optionValue);
    option.textContent = optionTexts[valueIndex];
    option.addEventListener('click', () => {
      clickCallback(optionValue);
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
  current_location = location;
  closeCalendarSidebar();
  clearFilter();
  clearAvailabilityFilter();
  clearOpeningQualificationFilter();
  setupNavLists(location);

  //change the calendar
  getCurrentCalendarTypeContent();
}

function typeChange(type) {
  console.log('changing type')
  current_type = type;
  closeCalendarSidebar();
  console.log('close calendar sidebar')
  clearFilter();
  console.log('clear filter')
  clearAvailabilityFilter();
  console.log('clear availability filter')

  clearOpeningQualificationFilter();

  hideAllTypeNav();
  console.log('hide nav items')

  console.log('everything is hidden or closed')

  switch(type) {
    case 'availability':
      document.querySelectorAll('.type-availability').forEach(element => {
        element.style.display = 'block';
      });
      break;
    case 'event':
      document.querySelectorAll('.type-event').forEach(element => {
        element.style.display = 'block';
      });
      break;
    case 'opening':
      document.querySelectorAll('.type-opening').forEach(element => {
        element.style.display = 'block';
      });
      break;
    default:

  }

  console.log('about to get current content')
  //change the calendar
  getCurrentCalendarTypeContent()
}

function hideAllTypeNav() {
  document.querySelector(".calendarNav").querySelectorAll("*[class*='type-']").forEach(element => {
    element.style.display = 'none';
  })
}

function getCurrentCalendarTypeContent() {
  console.log('getting current content');
  if (current_type == 'event') {
    if (current_location) {
      //initialize the new calendar if needed
      //initializing will grab events so we don't need to here
      if (calendar_view != 'event' && calendar_view != 'week' && calendar_view != 'month') {
        initializeDefaultCalendar([], main_calendar.view.activeStart)
      }
      else {
        getEventsLocationForCalendar(current_location, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_filter)
        .then(events => {
          main_calendar.getEventSources().forEach(eventSource => {
            eventSource.remove();
          })
          
          main_calendar.addEventSource(events)
          calendarNotWorking();
        })
        .catch((error) =>{
          console.log(error);
          alert("We had an issue loading the calendar events. Try refreshing the page.")
        })
      }
    }
    else {
      initializeDefaultCalendar([], main_calendar.view.activeStart)
    }
  }
  else if (current_type == 'availability' && calendar_view != 'week' && calendar_view != 'month') {
    if (current_location) {
      //initialize the new calendar if needed
      //initializing will grab events so we don't need to here
      if (calendar_view != 'availability') {
        initializeAvailabilityCalendar([], main_calendar.view.activeStart)
      }
      else {
        getAvailabilityLocationForCalendar(current_location, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_availability_filter)
        .then(events => {
          main_calendar.getEventSources().forEach(eventSource => {
            eventSource.remove();
          })
          
          main_calendar.addEventSource(events)
        })
        .catch((error) =>{
          console.log(error);
          alert("We had an issue loading the calendar events. Try refreshing the page.")
        })
      }
    }
    else {
      initializeAvailabilityCalendar([], main_calendar.view.activeStart)
    }
  }
  else if (current_type == 'opening') {
    if (current_location) {
      //initialize the new calendar if needed
      //initializing will grab events so we don't need to here
      if (calendar_view != 'opening') {
        initializeOpeningCalendar([], main_calendar.view.activeStart)
      }
      else {
        getOpeningLocation(current_location, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_opening_event_length, current_opening_recurring_weeks, current_opening_qualification_filter)
        .then(events => {
          main_calendar.getEventSources().forEach(eventSource => {
            eventSource.remove();
          })
          
          main_calendar.addEventSource(events)
        })
        .catch((error) =>{
          console.log(error);
          alert("We had an issue loading the calendar events. Try refreshing the page.")
        })
      }
    }
    else {
      initializeOpeningCalendar([], main_calendar.view.activeStart)
    }
  }
}



function initializeDefaultCalendar(events, initialDate = new Date()) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  calendar_view = 'event';

  var calendarEl = document.getElementById('calendar');
  calendarEl.classList.remove('noToday');

  main_calendar = new FullCalendar.Calendar(calendarEl, {
    height: "100%",
    initialView: 'timeGridWeek',
    initialDate:  initialDate,
    hiddenDays: [0],
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
      if (current_location) {
        getEventsLocationForCalendar(current_location, dateInfo.start.getTime(), dateInfo.end.getTime(), current_filter)
        .then(events => {
          main_calendar.getEventSources().forEach(eventSource => {
            eventSource.remove();
          })
          
          main_calendar.addEventSource(events)
          calendarNotWorking();
        })
        .catch((error) =>{
          calendarNotWorking();
          console.log(error);
          alert("We had an issue loading the calendar events. Try refreshing the page.")
        })
      }
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

    eventDidMount: function (info) {
      if (info.event.extendedProps.background) {
        info.el.style.background = info.event.extendedProps.background;
      }

      //if the event is reconciled then render the event with a (color) outline
      if (info.event.extendedProps.isReconciled) {
        info.el.style.borderColor = 'black';
        info.el.style.borderWidth = '2px';
      }
    },

    selectable: false,
    unselectAuto: false,

    events: events
  });
  main_calendar.render();
}

function initializeAvailabilityCalendar(events, initialDate = new Date()) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  calendar_view = 'availability';

  var calendarEl = document.getElementById('calendar');
  calendarEl.classList.remove('noToday');

  main_calendar = new FullCalendar.Calendar(calendarEl, {
    height: "100%",
    initialView: 'timeGridWeek',
    initialDate:  initialDate,
    hiddenDays: [0],
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
      if (current_location) {
        getAvailabilityLocationForCalendar(current_location, dateInfo.start.getTime(), dateInfo.end.getTime(), current_availability_filter)
        .then(events => {
          main_calendar.getEventSources().forEach(eventSource => {
            eventSource.remove();
          })
          
          main_calendar.addEventSource(events)
        })
        .catch((error) =>{
          calendarNotWorking();
          console.log(error);
          alert("We had an issue loading the calendar availabilities. Try refreshing the page.")
        })
      }
    },

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

function initializeMonthScheduleCalendar(events) {
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
      let start = nowDate.setDate(nowDate.getDate() + 1);
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
          //select based on the events that are passed in
          return {
            start : nowDate.setDate(nowDate.getDate() + 1)
          }
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

function initializeOpeningCalendar(events, initialDate = new Date()) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  calendar_view = 'opening';

  var calendarEl = document.getElementById('calendar');
  calendarEl.classList.remove('noToday');

  main_calendar = new FullCalendar.Calendar(calendarEl, {
    height: "100%",
    initialView: 'timeGridWeek',
    initialDate:  initialDate,
    hiddenDays: [0],
    scrollTime: '09:00:00',
    nowIndicator: true,
    headerToolbar: {
      start:   'today prev,next',
      center: 'title',
      end:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    themeSystem: 'standard',

    datesSet: function(dateInfo) {
      if (current_location) {
        getOpeningLocation(current_location, dateInfo.start.getTime(), dateInfo.end.getTime(), current_opening_event_length, current_opening_recurring_weeks, current_opening_qualification_filter)
        .then(events => {
          main_calendar.getEventSources().forEach(eventSource => {
            eventSource.remove();
          })
          
          main_calendar.addEventSource(events)
        })
        .catch((error) => {
          calendarNotWorking();
          console.log(error);
          alert("We had an issue loading the calendar openings. Try refreshing the page.")
        })
      }
    },

    eventClick: function(info) {
      //show which tutors are avaialble during this time
      console.log(info.event.extendedProps.tutors)
    },

    events: events
  });
  main_calendar.render();
}

function getEvent(eventID) {
  return firebase.firestore().collection('Events').doc(eventID).get()
  .then(doc => {
    if (doc.exists) {
      return doc.data();
    }
    else {
      return null;
    }
  });
}

function getAvailability(eventID) {
  return firebase.firestore().collection('Availabilities').doc(eventID).get()
  .then(doc => {
    if (doc.exists) {
      return doc.data();
    }
    else {
      return null;
    }
  });
}

function eventClickHandler(info) {
  //highlight the selected event
  info.event.setProp('backgroundColor', '#62DAFB')
  info.event.setProp('textColor', 'black')
  getEvent(info.event.id)
  .then((data) => {
    if (data) {
      setupEditSidebar(data, info.event.id)
    }
    else {
      alert('It appears we are having issues loading this event. Try refreshing the page if the issue persists.')
    }
  })
}

async function deleteEvent(eventID) {
  // delete the attendees then the event
  const attendeeCollectionRef = firebase.firestore().collection('Events').doc(eventID).collection('Attendees');
  const attendeeQuery = await attendeeCollectionRef.get()

  await Promise.all(attendeeQuery.docs.map(doc => doc.ref.delete()))
  await firebase.firestore().collection('Events').doc(eventID).delete();
}

function deleteAvailability(eventID) {
  return firebase.firestore().collection('Availabilities').doc(eventID).delete();
}

function deleteEventCallback() {
  sidebarWorking();
  if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
    const eventID = pending_calendar_event_id;
    deleteEvent(eventID)
    .then(() => {
      main_calendar.getEventById(eventID).remove()
      closeCalendarSidebar(true);
    })
    .catch((error) => {
      sidebarNotWorking();
      console.log(error)
    });
  }
}

function deleteRecurringLessonsCallback() {
  if (confirm("Are you sure you want to delete all events going forward? This action cannot be undone.")) {
    const student = pending_calendar_event.student
    const type = pending_calendar_event.type;
    const start = pending_calendar_event.start;

    if (!student) {
      alert('this function does not work unless we have a single student. talk to duncan about actually fixing this whole page');
    }

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

function deleteRecurringGeneralInfoCallback() {
  if (confirm("Are you sure you want to delete all events going forward? This action cannot be undone.")) {
    const staff = pending_calendar_event.staff
    const title = pending_calendar_event.title;
    const start = pending_calendar_event.start;

    //query all events for this student, of this type and starting at or after this start time

    firebase.firestore().collection('Events')
    .where('staff', '==', staff)
    .where('title', '==', title)
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
  const allInputNodes = document.getElementById('sidebar').querySelectorAll('input, textarea');
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
    main_calendar.addEventSource([{
      id: old_calendar_event_id,
      ...old_calendar_event
    }])
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

function getEventsLocationForCalendar(location, start, end, filter = {}) {
  calendarWorking();
  let events = [];
  let queryPromises = [];

  //first make sure that the filters are arrays (single null array if not so we can create the cartesian product off without filters)
  if (!filter.staff || filter?.staff?.length == 0) {
    filter.staff = [null];
  }
  if (!filter.student || filter?.student?.length == 0) {
    filter.student = [null];
  }
  if (!filter.type || filter?.type?.length == 0) {
    filter.type = [null];
  }

  //don't show anything unless a filter is active
  if (!filter.staff[0] && !filter.student[0] && !filter.type[0]) {
    console.log('no filter. do not show events')
    return Promise.resolve([]);
  }

  //get the cartesian product of the arrays to get all of the AND queries we need to make
  const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
  const filterList = cartesian(filter.staff, filter.student, filter.type);

  filterList.forEach(filterTuple => {
    let eventRef = firebase.firestore().collection('Events')
    .where("location", '==', location)
    .where('start', '>=', start)
    .where('start', '<', end)

    if (filterTuple[0]) {
      eventRef = eventRef.where('staff', 'array-contains', filterTuple[0])
    }
    if (filterTuple[1]) {
      eventRef = eventRef.where('student', '==', filterTuple[1])
    }
    if (filterTuple[2]) {
      eventRef = eventRef.where('type', '==', filterTuple[2])
    }

    queryPromises.push(eventRef.get())
  })

  console.log(current_filter)

  return Promise.all(queryPromises)
  .then((eventSnapshots) => {
    eventSnapshots.forEach(eventSnapshot => {
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
          isReconciled: eventData.isReconciled,
        });
      });
    })

    //remove duplicate events
    calendarNotWorking();

    return events.filter((event, index, array) => {
      for (let i = index + 1; i < array.length; i++) {
        if (event.id == array[i].id) { 
          return false
        }
      }
      return true
    });
  });
}

function getAvailabilityLocationForCalendar(location, start, end, staff = []) {
  calendarWorking();
  let eventRef = firebase.firestore().collection('Availabilities')
  .where("location", '==', location)
  .where('start', '>=', start)
  .where('start', '<', end)
  if (staff.length > 0) {
    eventRef = eventRef.where('staff', 'in', staff)
  }

  return eventRef.get()
  .then((eventSnapshot) => {
    console.log('number of availabilities grabbed:', eventSnapshot.size)
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
    calendarNotWorking();
    return events;
  });
}

function getEventsLocationForDocs(location, start, end, filter = {}) {

  let events = [];
  let queryPromises = [];

  //run through each filter and query for each filter (logical OR)
  // let eventRef = firebase.firestore().collection('Events')
  // .where("location", '==', location)
  // .where('start', '>=', start)
  // .where('start', '<', end)

  // if (filter?.staff?.length > 0) {
  //   filter.staff.forEach(staff => {
  //     queryPromises.push(eventRef.where('staff', 'array-contains', staff).get());
  //   })
  // }
  // if (filter?.student?.length > 0) {
  //   filter.student.forEach(student => {
  //     queryPromises.push(eventRef.where('student', '==', student).get());
  //   })
  // }
  // if (filter?.type?.length > 0) {
  //   filter.type.forEach(type => {
  //     queryPromises.push(eventRef.where('type', '==', type).get())
  //   })
  // }

  //first make sure that the filters are arrays (single null array if not so we can create the cartesian product off without filters)
  if (!filter.staff || filter?.staff?.length == 0) {
    filter.staff = [null];
  }
  if (!filter.student || filter?.student?.length == 0) {
    filter.student = [null];
  }
  if (!filter.type || filter?.type?.length == 0) {
    filter.type = [null];
  }

  //get the cartesian product of the arrays to get all of the AND queries we need to make
  const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
  console.log(cartesian(filter.staff, filter.student, filter.type))

  cartesian(filter.staff, filter.student, filter.type).forEach(filterTuple => {
    let eventRef = firebase.firestore().collection('Events')
    .where("location", '==', location)
    .where('start', '>=', start)
    .where('start', '<', end)

    if (filterTuple[0]) {
      eventRef = eventRef.where('staff', 'array-contains', filterTuple[0])
    }
    if (filterTuple[1]) {
      eventRef = eventRef.where('student', '==', filterTuple[1])
    }
    if (filterTuple[2]) {
      eventRef = eventRef.where('type', '==', filterTuple[2])
    }

    queryPromises.push(eventRef.get())
  })

  console.log(current_filter)

  // //if there is no filter
  // if ((filter?.staff?.length == 0 && filter?.student?.length == 0 && filter?.type?.length == 0) || (!filter.staff && !filter.student && !filter.type)) {
  //   queryPromises.push(eventRef.get());
  // }

  return Promise.all(queryPromises)
  .then((eventSnapshots) => {
    console.log('number of filters active', eventSnapshots.length)
    eventSnapshots.forEach((eventSnapshot, index) => {
      console.log('number of events grabbed for filter ' + (index+1), eventSnapshot.size);
      eventSnapshot.forEach((eventDoc) => {
        events.push(eventDoc)
      });
    })

    //remove duplicate events
    return events.filter((event, index, array) => {
      for (let i = index + 1; i < array.length; i++) {
        if (event.id == array[i].id) { 
          return false
        }
      }
      return true
    });
  });
}

function getAvailabilityLocationForDocs(location, start, end, staff = []) {
  let eventRef = firebase.firestore().collection('Availabilities')
  .where("location", '==', location)
  .where('start', '>=', start)
  .where('start', '<', end)
  if (staff.length > 0) {
    eventRef = eventRef.where('staff', 'in', staff)
  }

  return eventRef.get()
  .then(availabilitySnapshot => {
    let events = []
    availabilitySnapshot.forEach(availabilityDoc => {
      events.push(availabilityDoc)
    })

    return events;
  })
}

function changeEventLengthOpening(newLength) {
  current_opening_event_length = newLength;
  if (current_location) {
    calendarWorking()
    getOpeningLocation(current_location, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_opening_event_length, current_opening_recurring_weeks, current_opening_qualification_filter)
    .then(events => {
      main_calendar.getEventSources().forEach(eventSource => {
        eventSource.remove();
      })
      
      main_calendar.addEventSource(events)
      calendarNotWorking();
    })
    .catch((error) =>{
      calendarNotWorking();
      console.log(error);
      alert("We had an issue loading the calendar openings. Try refreshing the page.")
    })
  }
}

function changeRecurringWeeksOpenings(target) {
  //check that the value is valid
  if (isNaN(parseInt(target.value))) {
    target.value = 1;
    return;
  }

  current_opening_recurring_weeks = target.value;
  if (current_location) {
    calendarWorking()
    getOpeningLocation(current_location, main_calendar.view.activeStart.getTime(), main_calendar.view.activeEnd.getTime(), current_opening_event_length, current_opening_recurring_weeks, current_opening_qualification_filter)
    .then(events => {
      main_calendar.getEventSources().forEach(eventSource => {
        eventSource.remove();
      })
      
      main_calendar.addEventSource(events)
      calendarNotWorking();
    })
    .catch((error) =>{
      calendarNotWorking();
      console.log(error);
      alert("We had an issue loading the calendar openings. Try refreshing the page.")
    })
  }
}

async function getOpeningLocation(location, start, end, eventLength, recurringWeeks, qualification) {
  calendarWorking();
  if (eventLength) {

    const viewableEnd = end;
    const recurringEnd = new Date(end).setDate(new Date(end).getDate() + ((recurringWeeks - 1) * 7));

    // get all of the dates we need from Calendar-Openings
    let dateStart = new Date(start).setUTCHours(0,0,0,0);
    const dateEnd = new Date(recurringEnd).setUTCHours(24,0,0,0);
    let openingDates = [];
    while (dateStart <= dateEnd) {
      openingDates.push(dateStart);
      dateStart = new Date(dateStart).setUTCDate(new Date(dateStart).getUTCDate() + 1);
    }

    console.log(openingDates)

    // get all of the opening docs we need
    let openingDocs = [];
    for (let i = 0; i < openingDates.length; i++) {
      const openingDoc = await firebase.firestore().collection('Locations').doc(location).collection('Calendar-Openings').doc(openingDates[i].toString()).get();
      openingDocs.push(openingDoc);
    }

    //convert the opening docs to an object where the key is the doc id and the value is the doc data
    const openings = openingDocs.reduce((obj, item) => Object.assign(obj, { [item.id]: item.data() ?? {} }), {});
    const qualifiedTutorDocs = qualification ? await getTutorDocsByQualification(location, qualification) : await getUserDocsByRole(location, ['tutor']);
    const qualifiedTutors = qualifiedTutorDocs.docs.map(doc => doc.id);
    console.log('qualified tutors', qualifiedTutors)

    console.log(openings)

    let checkEvents = [];
    let viewableCheckEvents = [];

    while (new Date(start).setMinutes(new Date(start).getMinutes() + eventLength) < recurringEnd) {
      let tempDate = new Date(start).setUTCHours(0,0,0,0);
      let tempStart = start;
      let tempEnd = new Date(start).setMinutes(new Date(start).getMinutes() + eventLength);

      let availabilities = {};
      let events = {};

      // get the availability and events from the doc for each time
      for (const time in openings[tempDate]) {
        availabilities[time] = openings[tempDate][time].filter(opening => opening.type == 'availability').map(opening => opening.tutor);
        events[time] = openings[tempDate][time].filter(opening => opening.type == 'event').map(opening => opening.tutor);
      }
      
      let openTutors = qualifiedTutors
      .filter(tutor =>  availabilities?.[tempStart]?.includes(tutor) ?? false)
      .filter(tutor => !events?.[tempStart]?.includes(tutor) ?? true);

      console.log(openTutors)

      const eventData = {
        title: openTutors.length,
        start: tempStart,
        end: tempEnd,
        tutors: openTutors,
      }
      //push everything to our check array
      checkEvents.push(eventData)
      //only push the viewable days to this array
      if (tempEnd <= viewableEnd) {viewableCheckEvents.push(eventData)}
      
      //increment the start to the next time slot
      start = tempEnd
    }

    console.log({checkEvents})

    //we don't want to see the check events that don't have any tutor available (do it here first to get rid of the first week zeros - this is for optimizations)
    viewableCheckEvents = viewableCheckEvents.filter(event => event.title > 0)

    //check for the recurring weeks to filter out the times for this week down to the min of all fo the days at the given times
    viewableCheckEvents.forEach((viewableEvent) => {
      //find all of the check events that line up with this event (checking to the minute should be good for now. Must be changed if we make this more granular)
      let matchedEvents = checkEvents.filter(checkEvent => {
        return (new Date(checkEvent.start).getDay() == new Date(viewableEvent.start).getDay()) && 
        (new Date(checkEvent.start).getHours() == new Date(viewableEvent.start).getHours()) &&
        (new Date(checkEvent.start).getMinutes() == new Date(viewableEvent.start).getMinutes())
      });

      // console.log(viewableEvent)
      // console.log(matchedEvents)

      //find the lowest number of tutors avaiable to teach on any of these times
      let min = Infinity;
      matchedEvents.forEach(matchedEvent => {
        if (matchedEvent.title < min) {
          min = matchedEvent.title;
        }
      })

      //TODO: maybe keep track of which tutors are available as well
      //this doesn't make sense now because we aren't caring about keeping tutors consistent only if we have anyone

      //adjust the viewable event to match this min as well as the color
      viewableEvent.title = min;
      viewableEvent.color = "hsl(" + (Math.round((min - 1) * (240 / (qualifiedTutors.length - 1)))) + ", 100%, 50%)";
      viewableEvent.textColor = tinycolor.mostReadable(viewableEvent.color, ["#FFFFFF", "000000"]).toHexString()

      ///make sure to convert the start and end so that fullCalendar can usnertand it
      viewableEvent.start = convertFromDateInt(viewableEvent.start).fullCalendar;
      viewableEvent.end = convertFromDateInt(viewableEvent.end).fullCalendar;

    });

    //we don't want to see the check events that don't have any tutor available (do it again to remove the zeros that came from the future weeks)
    viewableCheckEvents = viewableCheckEvents.filter(event => event.title > 0)

    calendarNotWorking();
    return viewableCheckEvents;

  }
  else {
    calendarNotWorking();
    return Promise.resolve([]);
  }
}

/**
 * open the calendar sidebar
 */
function openCalendarSidebar() {
  //disble filter being dropped down while sidebar open
  //document.getElementById('filterSelection').parentNode.querySelector('.dropdown-content').style.display = 'none';
  document.getElementById('sidebar').classList.remove("closed");
  document.getElementById('sidebar').classList.add('open');
  main_calendar.updateSize();
}

/**
 * close the calendar sidebar
 */
function closeCalendarSidebar(force = false) {
  console.log('closing calendar sidebar')
  sidebarNotWorking();
  // const calendarType = document.getElementById('calendarType').dataset.value;
  const calendarType = current_type;
  
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

  //check for the calendar type and see if the calendar view matches if not change the view
  if (calendarType == 'availability' && calendar_view != 'availability') {
    initializeAvailabilityCalendar([], pending_recurring_start.start);
  }
  else if (calendarType == 'event' && calendar_view != 'event') {
    initializeDefaultCalendar([], pending_recurring_start.start);
  }
  else if (calendarType == 'opening' && calendar_view != 'opening') {
    initializeOpeningCalendar([], pending_recurring_start.start);
  }

  main_calendar.setOption('selectable', false);
  main_calendar.unselect();
  // main_calendar.getEvents().forEach((event) => {
  //   event.setProp('editable', false);
  // })
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

function showAddTestWrapper() {
  document.getElementById('addTestWrapper').classList.remove("displayNone")
}

function showEditTestWrapper() {
  document.getElementById('editTestWrapper').classList.remove("displayNone")
}

async function setupEditSidebar(eventData, eventID) {
  // switch (eventData.type) {
  //   case 'teacherMeeting':
  //     setupEditTeacherMeeting(eventData, eventID);
  //     break
  //   case 'generalInfo':
  //     setupEditGeneralInfo(eventData, eventID);
  //     break
  //   case 'practiceTest':
  //     setupEditPracticeTest(eventData, eventID);
  //     break
  //   case 'conference':
  //     setupEditConference(eventData, eventID);
  //     break
  //   case 'testReview':
  //     setupEditTestReview(eventData, eventID);
  //     break
  //   case 'act':
  //     setupEditLesson(eventData, eventID);
  //     break
  //   case 'subjectTutoring':
  //     setupEditLesson(eventData, eventID);
  //     break
  //   case 'mathProgram':
  //     setupEditLesson(eventData, eventID);
  //     break
  //   case 'phonicsProgram':
  //     setupEditLesson(eventData, eventID);
  //     break
  //   case 'test':
  //     setupEditTest(eventData, eventID);
  //     break
  //   default:
  // }

  if (eventData.type == 'teacherMeeting') setupEditTeacherMeeting(eventData, eventID);
  else if (eventData.type == 'generalInfo') setupEditGeneralInfo(eventData, eventID);
  else if (eventData.type == 'practiceTest') setupEditPracticeTest(eventData, eventID);
  else if (eventData.type == 'conference') setupEditConference(eventData, eventID);
  else if (eventData.type == 'testReview') setupEditTestReview(eventData, eventID);
  else if (eventData.type == 'test') setupEditTest(eventData, eventID);
  else if ((await getLessonTypeList(eventData.location)).some(type => type.value === eventData.type)) setupEditLesson(eventData, eventID);
  else // do nothing

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
    case 'test':
      setupAddTest();
      break
    default:
  }

  //remove eventClickHandler
  //FIXME: avaialbaility needs a event click function. Maybe not the best way to handle this
  if (type != 'availability') {
    main_calendar.setOption('eventClick', () => {});
  }
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

  //add in the staff list. If no location is selected this will reject
  getUserListByRole(current_location, STAFF_ROLES)
  .then((staff) => {
    let staffNames = [];
    let staffUIDs = [];
    staff.forEach((staff) => {
      staffNames.push(staff.name);
      staffUIDs.push(staff.id);
    });

    addSelectOptions(document.getElementById('addGeneralInfoStaff'), staffUIDs, staffNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
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

  //add back the default option (staff)
  const defaultOptionStaff = document.createElement('option');
  defaultOptionStaff.value = "";
  defaultOptionStaff.textContent = "NO STAFF"
  document.getElementById('editGeneralInfoStaff').appendChild(defaultOptionStaff);

  //add in the staff list. If no location is selected this will reject
  getUserListByRole(current_location, STAFF_ROLES)
  .then((staff) => {
    let staffNames = [];
    let staffUIDs = [];
    staff.forEach((staff) => {
      staffNames.push(staff.name);
      staffUIDs.push(staff.id);
    });

    addSelectOptions(document.getElementById('editGeneralInfoStaff'), staffUIDs, staffNames);

    //select previously saved staff
    $("#editGeneralInfoStaff").closest(".ui.dropdown").dropdown('set value', data.staff);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
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
  getUserListByRole(current_location, ['student'])
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
    return closeCalendarSidebar(true);
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
  getUserListByRole(current_location, ['student'])
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
    return closeCalendarSidebar(true);
  });

  //add in the admin list. If no location is selected this will reject
  getUserListByRole(current_location, ['admin'])
  .then((admins) => {
    let adminNames = [];
    let adminUIDs = [];
    admins.forEach((admin) => {
      adminNames.push(admin.name);
      adminUIDs.push(admin.id);
    });

    addSelectOptions(document.getElementById('addConferenceAdmin'), adminUIDs, adminNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
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

  //add in the staff list. If no location is selected this will reject
  getUserListByRole(current_location, ['admin'])
  .then((admins) => {
    let adminNames = [];
    let adminUIDs = [];
    admins.forEach((admin) => {
      adminNames.push(admin.name);
      adminUIDs.push(admin.id);
    });

    addSelectOptions(document.getElementById('editConferenceAdmin'), adminUIDs, adminNames);
    $("#editConferenceAdmin").closest(".ui.dropdown").dropdown('set value', data.staff);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
  });

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

  $('#addTestReviewStaff').closest(".ui.dropdown").dropdown('setting', 'onChange', 
    (value, text) => {
      if (value.length == $('#addTestReviewStaff > option').length) {
        $('#addTestReviewStaffSelectAll').parent()
        .checkbox('set checked');
      }
      else {
        $('#addTestReviewStaffSelectAll').parent()
        .checkbox('set unchecked');
      }
    }
  )

  $('#addTestReviewStaffSelectAll').parent()
  .checkbox({
    onChecked() {
      const options = $('#addTestReviewStaff > option').toArray().map(
        (obj) => obj.value
      );
      $('#addTestReviewStaff').dropdown('set exactly', options);
    },
    onUnchecked() {
      $('#addTestReviewStaff').dropdown('clear');
    },
  });

  //add in the student list. If no location is selected this will reject
  getUserListByRole(current_location, ['student'])
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
    return closeCalendarSidebar(true);
  });

  //add in the staff list. If no location is selected this will reject
  getUserListByRole(current_location, STAFF_ROLES)
  .then((staff) => {
    let staffNames = [];
    let staffUIDs = [];
    staff.forEach((staff) => {
      staffNames.push(staff.name);
      staffUIDs.push(staff.id);
    });

    addSelectOptions(document.getElementById('addTestReviewStaff'), staffUIDs, staffNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
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

  //add back the default option (staff)
  const defaultOptionStaff = document.createElement('option');
  defaultOptionStaff.value = "";
  defaultOptionStaff.textContent = "NO STAFF"
  document.getElementById('addTestReviewStaff').appendChild(defaultOptionStaff);

  //add in the staff list. If no location is selected this will reject
  getUserListByRole(current_location, STAFF_ROLES)
  .then((staff) => {
    let staffNames = [];
    let staffUIDs = [];
    staff.forEach((staff) => {
      staffNames.push(staff.name);
      staffUIDs.push(staff.id);
    });

    addSelectOptions(document.getElementById('editTestReviewStaff'), staffUIDs, staffNames);

    //select previously saved staff
    $("#editTestReviewStaff").closest(".ui.dropdown").dropdown('set value', data.staff);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
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
  // const defaultOptionStudent = document.createElement('option');
  // defaultOptionStudent.value = "";
  // defaultOptionStudent.setAttribute('selected', true);
  // defaultOptionStudent.setAttribute('disabled', true);
  // defaultOptionStudent.textContent = "select a student"
  // document.getElementById('addLessonStudent').appendChild(defaultOptionStudent);

  // //add the default option (staff)
  // const defaultOptionStaff = document.createElement('option');
  // defaultOptionStaff.value = "noStaff";
  // defaultOptionStaff.textContent = "NO STAFF";
  // document.getElementById('addLessonStaff').appendChild(defaultOptionStaff);

  // $('#addLessonStaff').closest(".ui.dropdown").dropdown('setting', 'onChange', 
  //   (value, text) => {
  //     if (value.length == $('#addLessonStaff > option').length) {
  //       $('#addLessonStaffSelectAll').parent()
  //       .checkbox('set checked');
  //     }
  //     else {
  //       $('#addLessonStaffSelectAll').parent()
  //       .checkbox('set unchecked');
  //     }
  //   }
  // )

  // $('#addLessonStaffSelectAll').parent()
  // .checkbox({
  //   onChecked() {
  //     const options = $('#addLessonStaff > option').toArray().map(
  //       (obj) => obj.value
  //     );
  //     $('#addLessonStaff').dropdown('set exactly', options);
  //   },
  //   onUnchecked() {
  //     $('#addLessonStaff').dropdown('clear');
  //   },
  // });

  //add in the list of lesson types. If no location is selected this will reject
  getLessonTypeList(document.getElementById('calendarLocation').dataset.value)
  .then((lessonTypes) => {
    lessonTypes.sort((a,b) => {
      if (a.name < b.name) { return -1 }
      if (a.name > b.name) { return 1 }
      return 0
    });
    let lessonNames = [];
    let lessonValues = [];
    let lessonPrice = [];
    let lessonSubtypes = [];
    lessonTypes.forEach((type) => {
      lessonNames.push(type.name);
      lessonValues.push(type.value);
      lessonPrice.push(type.price);
      lessonSubtypes.push(type.subtypes);
    });

    addSelectOptions(document.getElementById('addLessonType'), lessonValues, lessonNames);
    $('#addLessonType').closest(".ui.dropdown").dropdown('setting', 'onChange',
    (typeValue, text) => {
      if (!typeValue) return;

      document.getElementById('addLessonPrice').textContent = lessonPrice[lessonValues.indexOf(typeValue)] ?? ''

      //set up the subtypes
      let subtypeValues = ['select a subtype'];
      let subtypeNames = [null];
      lessonSubtypes[lessonValues.indexOf(typeValue)].forEach(subtype => {
        subtypeValues.push(subtype.value);
        subtypeNames.push(subtype.name);
      })

      document.getElementById('addLessonSubtype').innerHTML = null;
      $('#addLessonSubtype').closest(".ui.dropdown").dropdown('clear');
      addSelectOptions(document.getElementById('addLessonSubtype'), subtypeValues, subtypeNames);
      $('#addLessonSubtype').closest(".ui.dropdown").dropdown('setting', 'onChange',
      (subtypeValue, text) => {
        if (!subtypeValue) return;

        // get qualified tutors
        getTutorDocsByQualification(current_location, `${typeValue}-${subtypeValue}`)
        .then(tutorDocs => {
          const docs = tutorDocs.docs;
          docs.sort((a,b) => {
            if (a.data().lastName < b.data().lastName) { return -1 }
            if (a.data().lastName > b.data().lastName) { return 1 }
            return 0
          });
          let tutorNames = [];
          let tutorUIDs = [];
          docs.forEach((doc) => {
            tutorNames.push(doc.data().lastName + ', ' + doc.data().firstName);
            tutorUIDs.push(doc.id);
          });
          document.getElementById('addLessonStaff').innerHTML = null;
          $('#addLessonStaff').closest(".ui.dropdown").dropdown('clear');
          addSelectOptions(document.getElementById('addLessonStaff'), tutorUIDs, tutorNames);
        })
      });
    });
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
  });

  //remove all attendee nodes
  removeAllChildNodes(document.getElementById('addLessonAttendeeContainer'))

  //add in the student list. If no location is selected this will reject
  // getUserListByRole(current_location, ['student'])
  // .then((students) => {
  //   let studentNames = [];
  //   let studentUIDs = [];
  //   students.forEach((student) => {
  //     studentNames.push(student.name);
  //     studentUIDs.push(student.id);
  //   });

  //   addSelectOptions(document.getElementById('addLessonStudent'), studentUIDs, studentNames);
  // })
  // .catch((error) => {
  //   console.log(error)
  //   return closeCalendarSidebar(true);
  // });

  // add in the staff list. If no location is selected this will reject
  // getUserListByRole(current_location, STAFF_ROLES)
  // .then((staff) => {
  //   let staffNames = [];
  //   let staffUIDs = [];
  //   staff.forEach((staff) => {
  //     staffNames.push(staff.name);
  //     staffUIDs.push(staff.id);
  //   });

  //   addSelectOptions(document.getElementById('addLessonStaff'), staffUIDs, staffNames);
  // })
  // .catch((error) => {
  //   console.log(error)
  //   return closeCalendarSidebar(true);
  // });
  

  showAddLessonWrapper();
  openCalendarSidebar();
}

function addLessonsAddAttendeeCallback() {
  // add in a new fields for student and their price
  const attendeeContainer = document.getElementById('addLessonAttendeeContainer');
  const newChildIndex = attendeeContainer.children.length;

  let attendeeWrapper = document.createElement('div');
  attendeeWrapper.id = `addLessonAttendeeIndex_${newChildIndex}`;
  attendeeWrapper.classList.add('attendee-wrapper');
  attendeeWrapper.innerHTML = `
  <label for="addLessonStudentIndex_${newChildIndex}" class="label">Student</label>
  <select id="addLessonStudentIndex_${newChildIndex}" class="ui dropdown search selection"></select>
  <label for="addLessonPriceIndex_${newChildIndex}" class="label">Price</label>
  <input id="addLessonPriceIndex_${newChildIndex}" class="input"></select>
  <button onclick="addLessonRemoveAttendeeCallback(${newChildIndex})">remove attendee</button>
  `
  attendeeContainer.appendChild(attendeeWrapper);

  getUserListByRole(current_location, ['student'])
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById(`addLessonStudentIndex_${newChildIndex}`), studentUIDs, studentNames);
    $(`#addLessonStudentIndex_${newChildIndex}`).dropdown();
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
  });
}

function addLessonRemoveAttendeeCallback(index) {
  const attendeeWrapper = document.getElementById(`addLessonAttendeeIndex_${index}`);
  removeAllChildNodes(attendeeWrapper);
  attendeeWrapper.remove();
}

function editLessonAddAttendeeCallback() {
  // add in a new fields for student and their price
  const attendeeContainer = document.getElementById('editLessonAttendeeContainer');
  const newChildIndex = attendeeContainer.children.length;

  let attendeeWrapper = document.createElement('div');
  attendeeWrapper.id = `editLessonAttendeeIndex_${newChildIndex}`;
  attendeeWrapper.classList.add('attendee-wrapper');
  attendeeWrapper.innerHTML = `
  <label for="editLessonStudentIndex_${newChildIndex}" class="label">Student</label>
  <select id="editLessonStudentIndex_${newChildIndex}" class="ui dropdown search selection"></select>
  <label for="editLessonPriceIndex_${newChildIndex}" class="label">Price</label>
  <input id="editLessonPriceIndex_${newChildIndex}" class="input"></select>
  <button onclick="editLessonRemoveAttendeeCallback(${newChildIndex})">remove attendee</button>
  `
  attendeeContainer.appendChild(attendeeWrapper);

  return getUserListByRole(current_location, ['student'])
  .then((students) => {
    let studentNames = [];
    let studentUIDs = [];
    students.forEach((student) => {
      studentNames.push(student.name);
      studentUIDs.push(student.id);
    });

    addSelectOptions(document.getElementById(`editLessonStudentIndex_${newChildIndex}`), studentUIDs, studentNames);
    $(`#editLessonStudentIndex_${newChildIndex}`).dropdown();
    return
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
  });
}

function editLessonRemoveAttendeeCallback(index) {
  const attendeeWrapper = document.getElementById(`editLessonAttendeeIndex_${index}`);
  removeAllChildNodes(attendeeWrapper);
  attendeeWrapper.remove();
}

function copyToClipboard(element, updateText = false) {
  if (element.dataset.clipboard != 'null') {
    navigator.clipboard.writeText(element.dataset.clipboard);

    if (updateText) {
      element.textContent = 'Copied to clipboard!'
    }
  }
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

  convertLessonTypeReadable(data.location, data.type, data.subtype)
  .then(lessonTypeReadable => {
  
    document.getElementById('editLessonType').textContent = lessonTypeReadable;
    document.getElementById('editLessonDescription').textContent = data.description;
    // document.getElementById('editLessonStudent').textContent = data.studentName;
    document.getElementById('editLessonStaff').textContent = data.staffNames ?? 'No tutor assigned';
    // document.getElementById('editLessonPrice').value = data.price;

    document.getElementById('editLessonStaffLink').textContent = data.staffZoomURL ? 'Copy link to clipboard' : 'No link set yet';
    document.getElementById('editLessonStudentLink').textContent = data.studentZoomURL ? 'Copy link to clipboard' : 'No link set yet';
    document.getElementById('editLessonStaffLink').setAttribute('data-clipboard', data.staffZoomURL ? data.staffZoomURL : null);
    document.getElementById('editLessonStudentLink').setAttribute('data-clipboard', data.studentZoomURL ? data.studentZoomURL : null);
  
    // get qualified tutors
    getTutorDocsByQualification(current_location, `${data.type}-${data.subtype}`)
    .then(tutorDocs => {
      const docs = tutorDocs.docs;
      docs.sort((a,b) => {
        if (a.data().lastName < b.data().lastName) { return -1 }
        if (a.data().lastName > b.data().lastName) { return 1 }
        return 0
      });
      let tutorNames = [];
      let tutorUIDs = [];
      docs.forEach((doc) => {
        tutorNames.push(doc.data().lastName + ', ' + doc.data().firstName);
        tutorUIDs.push(doc.id);
      });
      document.getElementById('editLessonStaff').innerHTML = null;
      $('#editLessonStaff').closest(".ui.dropdown").dropdown('clear');
      addSelectOptions(document.getElementById('editLessonStaff'), tutorUIDs, tutorNames);
      $('#editLessonStaff').closest(".ui.dropdown").dropdown('set value', data.staff);
    })

    //remove all attendee nodes
    removeAllChildNodes(document.getElementById('editLessonAttendeeContainer'))

    // add in the attendees
    firebase.firestore().collection('Events').doc(id).collection('Attendees').get()
    .then((attendeeQuery) => {
      const attendees = attendeeQuery.docs.map(doc => doc.data());
      attendees.forEach((attendee, index) => {
        const passThru = (index) => {
          editLessonAddAttendeeCallback()
          .then(() => {
            $(`#editLessonStudentIndex_${index}`).closest(".ui.dropdown").dropdown('set selected', attendee.student);
            document.getElementById(`editLessonPriceIndex_${index}`).value = attendee.price;
          })
        };
        passThru(index);
      })
    })
  
    
    //show the reconciled state
    $('#editLessonReconciled').parent()
    .checkbox({
      onChecked() {
        //check if the event has started yet first
        if (pending_calendar_event.start <= new Date().getTime()) {
          pending_calendar_event.isReconciled = true;
        }
        else {
          $('#editLessonReconciled').parent().checkbox('set unchecked')
          alert("Strange things are afoot at the Circle K. You can't reconcile a lesson that hasn't started yet.")
        }
      },
      onUnchecked() {
        pending_calendar_event.isReconciled = false;
      },
    });
  
    showEditLessonWrapper();
    openCalendarSidebar();
  })
}

function setupAddAvailability() {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "addAvailability";
  main_calendar.setOption('selectable', true);

  //add in the staff list. If no location is selected this will reject
  getUserListByRole(current_location, STAFF_ROLES)
  .then((staff) => {
    let staffNames = [];
    let staffUIDs = [];
    staff.forEach((staff) => {
      staffNames.push(staff.name);
      staffUIDs.push(staff.id);
    });

    addSelectOptions(document.getElementById('addAvailabilityStaff'), staffUIDs, staffNames);
  })
  .catch((error) => {
    console.log(error)
    return closeCalendarSidebar(true);
  });
  
  recurringEventTimesClickCallback(document.getElementById('addAvailabilityRecurringWrapper').children[0]);
  showAddAvailabilityWrapper();
  openCalendarSidebar();
}

function setupAddTest() {
  //close the sidebar just in case another tab is open.
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = "addTest";
  main_calendar.setOption('selectable', true);

  showAddTestWrapper();
  openCalendarSidebar();
}

function setupEditTest(data, id) {
  if (!closeCalendarSidebar()) {
    return
  }
  calendar_mode = 'editTest';
  main_calendar.getEventById(id).setProp('editable', true);

  //fill in all saved data
  old_calendar_event_id = id;
  old_calendar_event = {...data};
  pending_calendar_event_id = id;
  pending_calendar_event = {...data};

  //fill in appropriate fields
  document.getElementById('editTestType').textContent = data.title;

  showEditTestWrapper();
  openCalendarSidebar();
}

function sidebarWorking() {
  document.getElementById('sidebar').querySelectorAll('button').forEach(button => {
    button.disabled = true;
  })

  document.getElementById('spinnyBoiSidebar').style.display = 'block';
}

function sidebarNotWorking() {
  document.getElementById('sidebar').querySelectorAll('button').forEach(button => {
    button.disabled = false;
  })

  document.getElementById('spinnyBoiSidebar').style.display = 'none';
}

function calendarWorking() {
  document.getElementById('spinnyBoiCalendarContent').style.display = 'block';
}

function calendarNotWorking() {
  document.getElementById('spinnyBoiCalendarContent').style.display = 'none';
}

function submitAddTeacherMeeting() {
  sidebarWorking();
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const invitedLocation = document.getElementById('calendarLocation').dataset.value
  const meetingLocation = document.getElementById('addTeacherMeetingLocation').value

  if (!start || !invitedLocation || !meetingLocation) {
    sidebarNotWorking()
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
      main_calendar.addEventSource([event]);
      closeCalendarSidebar(true);
    })
    .catch((error) => {
      sidebarNotWorking();
      console.log(error);
      alert("We are having issues saving this teacher meeting :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
  else {
    sidebarNotWorking();
  }
}

function updateEditTeacherMeeting() {
  sidebarWorking();
  if (!confirm('Are you sure you want to update this teacher meeting?')) {
    return sidebarNotWorking();
  }
  pending_calendar_event.meetingLocation = document.getElementById('editTeacherMeetingLocation').value;
  firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
  .then(() => {
    main_calendar.getEventById(pending_calendar_event_id).remove();
    main_calendar.addEventSource([{
      id: pending_calendar_event_id,
      ...pending_calendar_event
    }])
    closeCalendarSidebar(true);
  })
  .catch((error) => {
    sidebarNotWorking();
    console.log(error);
    alert("We are having issues saving this teacher meeting :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddGeneralInfo() {
  sidebarWorking();
  //decide if it is a single event or a recurring event
  let scheduleType = '';
  const radios = document.getElementsByName('addGeneralInfoEventSchedule');
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      scheduleType = radios[i].value
      break;
    }
  }

  const title = document.getElementById('addGeneralInfoTitle').value
  const staff = getDropdownValues('addGeneralInfoStaff');
  const staffNames = getDropdownText('addGeneralInfoStaff');
  const location = document.getElementById('calendarLocation').dataset.value;

  if (scheduleType == 'single') {
    const start = pending_calendar_event.start;
    const end = pending_calendar_event.end;
    const allDay = pending_calendar_event.allDay;

    if (!start || !title || !location) {
      sidebarNotWorking();
      return alert("It looks like you're still missing some data for this general info");
    }

    if (confirm("Are you sure you want to submit this event?")) {
      if (staff.length > 0) {
        //check for conflicts
        checkStaffConflicts(staff, start, end)
        .then((staffConflict) => {
          if (staffConflict) {
            sidebarNotWorking();
            return alert('This staff has a conflict with a(n) ' + 
              eventTypeReadable(staffConflict.data().type) + ' event from ' +
              convertFromDateInt(staffConflict.data().start).longReadable + ' to ' +
              convertFromDateInt(staffConflict.data().end).longReadable
            )
          }

          let availablePromises = [];
          for (let i = 0; i < staff.length; i++) {
            availablePromises.push(checkStaffAvailability(staff[i], pending_calendar_event.start, pending_calendar_event.end))
          }

          Promise.all(availablePromises)
          .then((areAvailable) => {
            for (let i = 0; i < areAvailable.length; i++) {
              if (!areAvailable[i].isAvailable) {
                sidebarNotWorking();
                return alert('The staff are not available at this time.')
              }
            }

            eventInfo = {
              type: 'generalInfo',
              start: start,
              end: end,
              allDay, allDay,
              title: title,
              staff: staff,
              staffNames: staffNames,
              location: location
            }

            saveGeneralInfo(eventInfo)
            .then((event) => {
              //FIXME: This should automatically update for the client and put it in a pending status
              main_calendar.addEventSource([event]);
              closeCalendarSidebar(true);
            })
          })
        })
        .catch((error) => {
          sidebarNotWorking();
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
          staffNames: staffNames,
          location: location
        }

        saveGeneralInfo(eventInfo)
        .then((event) => {
          //FIXME: This should automatically update for the client and put it in a pending status
          main_calendar.addEventSource([event]);
          closeCalendarSidebar(true);
        })
        .catch((error) => {
          sidebarNotWorking();
          console.log(error);
          alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
        })
      }
    }
    else {
      sidebarNotWorking();
    }
  }

  else if (scheduleType == 'recurring') {
    let recurringPendingEventsFulfilled = [];
    let recurringEventsFulfilled = [];

    let staffConflicts = [];
    let staffUnavailable = [];
    let pendingEvents = [];

    if (!pending_recurring_start.start || !pending_recurring_end.end || pending_recurring_times.length == 0 || !title || !location) {
      sidebarNotWorking();
      return alert("It looks like you're still missing some data for this lesson");
    }
    if (confirm("Are you sure you want to submit these events?")) {
      if (staff.length > 0) {
        //figure out all of the events that must be added based on recurring start, end, and times.

        pending_recurring_times.forEach(weekTime => {
          let start = weekTime.start.getTime();
          let end = weekTime.end.getTime();

          //get the week time up to the start of the recurring schedule
          while (start < pending_recurring_start.start.getTime()) {
            start = new Date(start).setDate(new Date(start).getDate() + 7);
            end = new Date(end).setDate(new Date(end).getDate() + 7);
          }

          //save an event for each time until the end of the recurring
          while (end < pending_recurring_end.end.getTime()) {
            let passThruTimes = (start, end) => {
              //check for conflicts
              recurringPendingEventsFulfilled.push(
                checkStaffConflicts(staff, start, end)
                .then((staffConflict) => {
                  if (staffConflict) {
                    staffConflicts.push(staffConflict)
                    // return alert('This staff has a conflict with a(n) ' + 
                    //   eventTypeReadable(staffConflict.data().type) + ' event from ' +
                    //   convertFromDateInt(staffConflict.data().start).longReadable + ' to ' +
                    //   convertFromDateInt(staffConflict.data().end).longReadable
                    // )
                  }

                  let availablePromises = [];
                  for (let i = 0; i < staff.length; i++) {
                    availablePromises.push(checkStaffAvailability(staff[i], start, end))
                  }

                  return Promise.all(availablePromises)
                  .then((areAvailable) => {
                    for (let i = 0; i < areAvailable.length; i++) {
                      if (!areAvailable[i].isAvailable) {
                        staffUnavailable.push(areAvailable[i])
                        // alert('The staff are not available at this time: staffID = ' + areAvailable[i].staff)
                      }
                    }

                    let eventInfo = {
                      type: 'generalInfo',
                      start: start,
                      end: end,
                      allDay: weekTime.allDay,
                      location: location,
                      staff: staff,
                      staffNames: staffNames,
                      title: title
                    }
                    pendingEvents.push(eventInfo);
                  })
                })
              );
            }
            passThruTimes(start, end);
            start = new Date(start).setDate(new Date(start).getDate() + 7);
            end = new Date(end).setDate(new Date(end).getDate() + 7);
          }
        })

        Promise.all(recurringPendingEventsFulfilled)
        .then(() => {
          if (staffConflicts.length == 0 && staffUnavailable.length == 0) {
            console.log(pendingEvents);
            pendingEvents.forEach(event => {
              recurringEventsFulfilled.push(saveGeneralInfo(event));
            })

            Promise.all(recurringEventsFulfilled)
            .then(events => {
              events.forEach(event => {
                main_calendar.addEventSource([event]);
              })
              closeCalendarSidebar(true);
            })
            .catch((error) => {
              sidebarNotWorking();
              console.log(error);
              alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
            })
          }
          else {
            sidebarNotWorking();
            console.log(staffConflicts);
            console.log(staffUnavailable);
            console.log(pendingEvents);

            let displayMessage = `
            <p>I'm sorry, Dave. I'm afraid I can't do that.</p>
            <p>I tried my best to schedule the events you had inputted but we ran into some issues</p>
            <p>so I aborted the entire operation. No event was saved.</p>
            <p>Here is a list of the events that had issues.</p>
            <ul>
          `
          staffConflicts.forEach(conflictDoc => {
            displayMessage += `
              <li>The staff ${conflictDoc.staffName} has a conflict with ${eventTypeReadable(conflictDoc.data().type)} on ${convertFromDateInt(conflictDoc.data().start).longReadable}.</li>
            `
          })
          staffUnavailable.forEach(unavailable => {
            displayMessage += `
              <li>One of the staff on the list is not available from ${convertFromDateInt(unavailable.start).longReadable} to ${convertFromDateInt(unavailable.end).longReadable}.
              Yeah I know I'm being super lazy by not giving the name of the staff but if you found this congratulations you can come bother me about it.
              -Duncan Morais</li>
            `
          })
          displayMessage += `
            </ul>
          `
          customConfirm(displayMessage, "", 'OK', ()=>{}, ()=>{});
          }
        })
      }
      else {
        //figure out all of the events that must be added based on recurring start, end, and times.

        pending_recurring_times.forEach(weekTime => {
          let start = weekTime.start.getTime();
          let end = weekTime.end.getTime();

          //get the week time up to the start of the recurring schedule
          while (start < pending_recurring_start.start.getTime()) {
            start = new Date(start).setDate(new Date(start).getDate() + 7);
            end = new Date(end).setDate(new Date(end).getDate() + 7);
          }

          //save an event for each time until the end of the recurring
          while (end < pending_recurring_end.end.getTime()) {
            let passThruTimes = (start, end) => {
              //check for conflicts
              let eventInfo = {
                type: 'generalInfo',
                start: start,
                end: end,
                allDay: weekTime.allDay,
                location: location,
                staff: staff,
                staffNames: staffNames,
                title: title
              }
              pendingEvents.push(eventInfo);
            }
            passThruTimes(start, end);
            start = new Date(start).setDate(new Date(start).getDate() + 7);
            end = new Date(end).setDate(new Date(end).getDate() + 7);
          }
        })

        pendingEvents.forEach(event => {
          recurringEventsFulfilled.push(saveGeneralInfo(event));
        })

        Promise.all(recurringEventsFulfilled)
        .then(events => {
          events.forEach(event => {
            main_calendar.addEventSource([event]);
          })
          closeCalendarSidebar(true);
        })
        .catch((error) => {
          sidebarNotWorking()
          console.log(error);
          alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
        })
      }
    }
    else {
      sidebarNotWorking();
    }
  }
  else {
    sidebarNotWorking();
    console.warn("no schedule type: shouldn't be possible.")
  }
}

function updateEditGeneralInfo() {
  sidebarWorking();
  if (!confirm('Are you sure you want to update this general info?')) {
    sidebarNotWorking();
    return
  }
  pending_calendar_event.title = document.getElementById('editGeneralInfoTitle').value;
  pending_calendar_event.staff = getDropdownValues('editGeneralInfoStaff');
  pending_calendar_event.staffNames = getDropdownText('editGeneralInfoStaff');

  if (pending_calendar_event.staff.length > 0) {
    //check for conflicts
    checkStaffConflicts(pending_calendar_event.staff, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
    .then((staffConflict) => {
      if (staffConflict) {
        sidebarNotWorking();
        return alert('This staff has a conflict with a(n) ' + 
          eventTypeReadable(staffConflict.data().type) + ' event from ' +
          convertFromDateInt(staffConflict.data().start).longReadable + ' to ' +
          convertFromDateInt(staffConflict.data().end).longReadable
        )
      }

      let availablePromises = [];
      for (let i = 0; i < pending_calendar_event.staff.length; i++) {
        availablePromises.push(checkStaffAvailability(pending_calendar_event.staff[i], pending_calendar_event.start, pending_calendar_event.end))
      }

      Promise.all(availablePromises)
      .then((areAvailable) => {
        for (let i = 0; i < areAvailable.length; i++) {
          if (!areAvailable[i].isAvailable) {
            sidebarNotWorking();
            return alert('The staff are not available at this time.')
          }
        }

        //get the first staff doc to grab their color
        //don't waste time if it hasn't changed
        if (pending_calendar_event.staff[0] != old_calendar_event.staff[0]) {
          firebase.firestore().collection('Users').doc(pending_calendar_event.staff[0]).get()
          .then((staffDoc) => {
            pending_calendar_event.color = staffDoc.data().color ?? null;
            pending_calendar_event.textColor = tinycolor.mostReadable(staffDoc.data().color, ["#FFFFFF", "000000"]).toHexString()

            return firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
          })
          .then(() => {
            main_calendar.getEventById(pending_calendar_event_id).remove();
            main_calendar.addEventSource([{
              id: pending_calendar_event_id,
              ...pending_calendar_event
            }])
            closeCalendarSidebar(true);
          })
        }
        // same first staff; proceed
        else {
          firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
          .then(() => {
            main_calendar.getEventById(pending_calendar_event_id).remove();
            main_calendar.addEventSource([{
              id: pending_calendar_event_id,
              ...pending_calendar_event
            }])
            closeCalendarSidebar(true);
          })
        }
      })
    })
    .catch((error) => {
      sidebarNotWorking();
      console.log(error);
      alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
  else {
    //get the first staff doc to grab their color
    //don't waste time if it hasn't changed
    if (pending_calendar_event.staff[0] != old_calendar_event.staff[0]) {
      firebase.firestore().collection('Users').doc(pending_calendar_event.staff[0]).get()
      .then((staffDoc) => {
        pending_calendar_event.color = staffDoc.data().color ?? null;
        pending_calendar_event.textColor = tinycolor.mostReadable(staffDoc.data().color, ["#FFFFFF", "000000"]).toHexString()

        return firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
      })
      .then(() => {
        main_calendar.getEventById(pending_calendar_event_id).remove();
        main_calendar.addEventSource([{
          id: pending_calendar_event_id,
          ...pending_calendar_event
        }])
        closeCalendarSidebar(true);
      })
      .catch((error) => {
        sidebarNotWorking();
        console.log(error);
        alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
      })
    }
    // same first staff; proceed
    else {
      firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
      .then(() => {
        main_calendar.getEventById(pending_calendar_event_id).remove();
        main_calendar.addEventSource([{
          id: pending_calendar_event_id,
          ...pending_calendar_event
        }])
        closeCalendarSidebar(true);
      })
      .catch((error) => {
        sidebarNotWorking();
        console.log(error);
        alert("We are having issues saving this general info :(\nPlease try again and if the issue persist please contact the devs.");
      })
    }
  }
}

function submitAddPracticeTest() {
  sidebarWorking();
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const student = document.getElementById('addPracticeTestStudent').value;
  const description = document.getElementById('addPracticeTestDescription').value;
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !student || !location) {
    sidebarNotWorking();
    return alert("It looks like you're still missing some data for this practice test");
  }

  if (confirm("Are you sure you want to submit this event?")) {
    //check for conflicts
    checkStudentConflicts(student, start, end)
    .then((studentConflict) => {
      if (studentConflict) {
        sidebarNotWorking();
        return alert('This student has a conflict with a(n) ' + 
          eventTypeReadable(studentConflict.data().type) + ' event from ' +
          convertFromDateInt(studentConflict.data().start).longReadable + ' to ' +
          convertFromDateInt(studentConflict.data().end).longReadable
        )
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
        main_calendar.addEventSource([event]);
        closeCalendarSidebar(true);
      })
    })
    .catch((error) => {
      sidebarNotWorking();
      console.log(error);
      alert("We are having issues saving this practice test :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
  else {
    sidebarNotWorking();
  }
}

function updateEditPracticeTest() {
  sidebarWorking();
  if (!confirm('Are you sure you want to update this practice test?')) {
    sidebarNotWorking();
    return
  }
  pending_calendar_event.description = document.getElementById('editPracticeTestDescription').value;
  //check for conflicts
  checkStudentConflicts(pending_calendar_event.student, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  .then((studentConflict) => {
    if (studentConflict) {
      sidebarNotWorking();
      return alert('This student has a conflict with a(n) ' + 
        eventTypeReadable(studentConflict.data().type) + ' event from ' +
        convertFromDateInt(studentConflict.data().start).longReadable + ' to ' +
        convertFromDateInt(studentConflict.data().end).longReadable
      )
    }

    firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
    .then(() => {
      main_calendar.getEventById(pending_calendar_event_id).remove();
      main_calendar.addEventSource([{
        id: pending_calendar_event_id,
        ...pending_calendar_event
      }])
      closeCalendarSidebar(true);
    })
  })
  .catch((error) => {
    sidebarNotWorking();
    console.log(error);
    alert("We are having issues saving this practice test :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddConference() {
  sidebarWorking();
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const student = document.getElementById('addConferenceStudent').value;
  const staff = getDropdownValues('addConferenceAdmin');
  const staffNames = getDropdownText('editGeneralInfoStaff');
  const description = document.getElementById('addConferenceDescription').value;
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !student || !location || staff.length == 0) {
    sidebarNotWorking();
    return alert("It looks like you're still missing some data for this test review");
  }

  if (confirm("Are you sure you want to submit this event?")) {
    //check for conflicts
    checkStudentConflicts(student, start, end)
    .then((studentConflict) => {
      if (studentConflict) {
        sidebarNotWorking();
        return alert('This student has a conflict with a(n) ' + 
          eventTypeReadable(studentConflict.data().type) + ' event from ' +
          convertFromDateInt(studentConflict.data().start).longReadable + ' to ' +
          convertFromDateInt(studentConflict.data().end).longReadable
        )
      }

      checkStaffConflicts(staff, start, end)
      .then((staffConflict) => {
        if (staffConflict) {
          sidebarNotWorking();
          return alert('This staff has a conflict with a(n) ' + 
            eventTypeReadable(staffConflict.data().type) + ' event from ' +
            convertFromDateInt(staffConflict.data().start).longReadable + ' to ' +
            convertFromDateInt(staffConflict.data().end).longReadable
          )
        }

        let availablePromises = [];
        for (let i = 0; i < staff.length; i++) {
          availablePromises.push(checkStaffAvailability(staff[i], pending_calendar_event.start, pending_calendar_event.end))
        }

        Promise.all(availablePromises)
        .then((areAvailable) => {
          for (let i = 0; i < areAvailable.length; i++) {
            if (!areAvailable[i].isAvailable) {
              sidebarNotWorking();
              return alert('The staff are not available at this time.')
            }
          }

          eventInfo = {
            type: 'conference',
            start: start,
            end: end,
            allDay, allDay,
            location: location,
            student: student,
            staff: staff,
            staffNames: staffNames,
            description: description,
            color: CONFERENCE_COLOR,
            textColor: tinycolor.mostReadable(CONFERENCE_COLOR, ["#FFFFFF", "000000"]).toHexString()
          }
    
          saveConference(eventInfo)
          .then((event) => {
            //FIXME: This should automatically update for the client and put it in a pending status
            main_calendar.addEventSource([event]);
            closeCalendarSidebar(true);
          })
        })
      })
    })
    .catch((error) => {
      sidebarNotWorking();
      console.log(error);
      alert("We are having issues saving this test review :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
  else {
    sidebarNotWorking();
  }
}

function updateEditConference() {
  sidebarWorking();
  if (!confirm('Are you sure you want to update this conference?')) {
    sidebarNotWorking();
    return
  }
  pending_calendar_event.staff = getDropdownValues('editConferenceAdmin');
  pending_calendar_event.staffNames = getDropdownText('editConferenceAdmin');

  //check for conflicts
  checkStudentConflicts(pending_calendar_event.student, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  .then((studentConflict) => {
    if (studentConflict) {
      return alert('This student has a conflict with a(n) ' + 
        eventTypeReadable(studentConflict.data().type) + ' event from ' +
        convertFromDateInt(studentConflict.data().start).longReadable + ' to ' +
        convertFromDateInt(studentConflict.data().end).longReadable
      )
    }

    checkStaffConflicts(pending_calendar_event.staff, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
    .then((staffConflict) => {
      if (staffConflict) {
        sidebarNotWorking();
        return alert('This staff has a conflict with a(n) ' + 
          eventTypeReadable(staffConflict.data().type) + ' event from ' +
          convertFromDateInt(staffConflict.data().start).longReadable + ' to ' +
          convertFromDateInt(staffConflict.data().end).longReadable
        )
      }

      let availablePromises = [];
      for (let i = 0; i < pending_calendar_event.staff.length; i++) {
        availablePromises.push(checkStaffAvailability(pending_calendar_event.staff[i], pending_calendar_event.start, pending_calendar_event.end))
      }

      Promise.all(availablePromises)
      .then((areAvailable) => {
        for (let i = 0; i < areAvailable.length; i++) {
          if (!areAvailable[i].isAvailable) {
            sidebarNotWorking();
            return alert('The staff are not available at this time.')
          }
        }

        //get the first staff doc to grab their color
        //don't waste time if it hasn't changed
        if (pending_calendar_event.staff[0] != old_calendar_event.staff[0]) {
          firebase.firestore().collection('Users').doc(pending_calendar_event.staff[0]).get()
          .then((staffDoc) => {
            pending_calendar_event.color = staffDoc.data().color ?? null;
            pending_calendar_event.textColor = tinycolor.mostReadable(staffDoc.data().color, ["#FFFFFF", "000000"]).toHexString()

            return firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
          })
          .then(() => {
            main_calendar.getEventById(pending_calendar_event_id).remove();
            main_calendar.addEventSource([{
              id: pending_calendar_event_id,
              ...pending_calendar_event
            }])
            closeCalendarSidebar(true);
          })
        }
        // same first staff; proceed
        else {
          firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
          .then(() => {
            main_calendar.getEventById(pending_calendar_event_id).remove();
            main_calendar.addEventSource([{
              id: pending_calendar_event_id,
              ...pending_calendar_event
            }])
            closeCalendarSidebar(true);
          })
        }
      })
    })
  })
  .catch((error) => {
    sidebarNotWorking();
    console.log(error);
    alert("We are having issues saving this conference :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddTestReview() {
  sidebarWorking();
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const student = document.getElementById('addTestReviewStudent').value;
  const staff = getDropdownValues('addTestReviewStaff');
  const staffNames = getDropdownText('addTestReviewStaff');
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !student || !location || staff.length == 0) {
    sidebarNotWorking();
    return alert("It looks like you're still missing some data for this test review");
  }

  if (confirm("Are you sure you want to submit this event?")) {
    //check for conflicts
    checkStudentConflicts(student, start, end)
    .then((studentConflict) => {
      if (studentConflict) {
        sidebarNotWorking();
        return alert('This student has a conflict with a(n) ' + 
          eventTypeReadable(studentConflict.data().type) + ' event from ' +
          convertFromDateInt(studentConflict.data().start).longReadable + ' to ' +
          convertFromDateInt(studentConflict.data().end).longReadable
        )
      }

      //get the list of all tutors and randomly assign a tutor to this event
      //check if there is a conflict or they are not available
      //if the tutor is not open then remove them from the list and try again
      //return if no one is open.

      getRandomOpenTutor(start, end, staff, staffNames)
      .then(tutor => {
        if (tutor) {
          eventInfo = {
            type: 'testReview',
            start: start,
            end: end,
            allDay, allDay,
            location: location,
            student: student,
            staff: [tutor.id],
            staffNames: [tutor.name]
          }

          saveTestReview(eventInfo)
          .then((event) => {
            //FIXME: This should automatically update for the client and put it in a pending status
            main_calendar.addEventSource([event]);
            closeCalendarSidebar(true);
          })
        }
        else {
          sidebarNotWorking();
          return alert('None of the tutors given are open at this time. Try adding more tutors to the options or change the time of this lesson.')
        }
      })
    })
    .catch((error) => {
      sidebarNotWorking();
      console.log(error);
      alert("We are having issues saving this lesson :(\nPlease try again and if the issue persist please contact the devs.");
    })
  }
  else {
    sidebarNotWorking();
  }
}

function updateEditTestReview() {
  sidebarWorking();
  if (!confirm('Are you sure you want to update this test review?')) {
    sidebarNotWorking();
    return
  }
  pending_calendar_event.staff = getDropdownValues('editTestReviewStaff');
  pending_calendar_event.staffNames = getDropdownText('editTestReviewStaff');

  //check for conflicts
  checkStudentConflicts(pending_calendar_event.student, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  .then((studentConflict) => {
    if (studentConflict) {
      sidebarNotWorking();
      return alert('This student has a conflict with a(n) ' + 
        eventTypeReadable(studentConflict.data().type) + ' event from ' +
        convertFromDateInt(studentConflict.data().start).longReadable + ' to ' +
        convertFromDateInt(studentConflict.data().end).longReadable
      )
    }

    checkStaffConflicts(pending_calendar_event.staff, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
    .then((staffConflict) => {
      if (staffConflict) {
        sidebarNotWorking();
        return alert('This staff has a conflict with a(n) ' + 
          eventTypeReadable(staffConflict.data().type) + ' event from ' +
          convertFromDateInt(staffConflict.data().start).longReadable + ' to ' +
          convertFromDateInt(staffConflict.data().end).longReadable
        )
      }

      let availablePromises = [];
      for (let i = 0; i < pending_calendar_event.staff.length; i++) {
        availablePromises.push(checkStaffAvailability(pending_calendar_event.staff[i], pending_calendar_event.start, pending_calendar_event.end))
      }

      Promise.all(availablePromises)
      .then((areAvailable) => {
        for (let i = 0; i < areAvailable.length; i++) {
          if (!areAvailable[i].isAvailable) {
            sidebarNotWorking();
            return alert('The staff are not available at this time.')
          }
        }

        //get the first staff doc to grab their color
        //don't waste time if it hasn't changed
        if (pending_calendar_event.staff[0] != old_calendar_event.staff[0]) {
          firebase.firestore().collection('Users').doc(pending_calendar_event.staff[0]).get()
          .then((staffDoc) => {
            pending_calendar_event.color = staffDoc.data().color ?? null;
            pending_calendar_event.textColor = tinycolor.mostReadable(staffDoc.data().color, ["#FFFFFF", "000000"]).toHexString()

            return firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
          })
          .then(() => {
            main_calendar.getEventById(pending_calendar_event_id).remove();
            main_calendar.addEventSource([{
              id: pending_calendar_event_id,
              ...pending_calendar_event
            }])
            closeCalendarSidebar(true);
          })
        }
        // same first staff; proceed
        else {
          firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
          .then(() => {
            main_calendar.getEventById(pending_calendar_event_id).remove();
            main_calendar.addEventSource([{
              id: pending_calendar_event_id,
              ...pending_calendar_event
            }])
            closeCalendarSidebar(true);
          })
        }
      })
    })
  })
  .catch((error) => {
    sidebarNotWorking();
    console.log(error);
    alert("We are having issues saving this test review :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

async function submitAddLesson() {
  sidebarWorking();
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
  const subtype = document.getElementById('addLessonSubtype').value;
  const description = document.getElementById('addLessonDescription').value;
  // const student = document.getElementById('addLessonStudent').value;
  const staff = getDropdownValues('addLessonStaff');
  // const staffNames = getDropdownText('addLessonStaff');
  // const price = Number(document.getElementById('addLessonPrice').value)
  const location = document.getElementById('calendarLocation').dataset.value;

  // we want to convert all attendee data
  const attendees = [];
  const attendeeContainer =  document.getElementById('addLessonAttendeeContainer');
  attendeeContainer.querySelectorAll('.attendee-wrapper').forEach(wrapper => {
    const index = Number(wrapper.id.split('_')[1]);
    attendees.push({
      student: document.getElementById(`addLessonStudentIndex_${index}`).value,
      price: Number(document.getElementById(`addLessonPriceIndex_${index}`).value),
    })
  })


  if (scheduleType == 'single') {
    const start = pending_calendar_event.start;
    const end = pending_calendar_event.end;
    const allDay = pending_calendar_event.allDay;

    if (!start || !type || !subtype || !location || staff.length == 0 ) {
      sidebarNotWorking();
      return alert("It looks like you're still missing some data for this lesson");
    }
    if (start < new Date().getTime()) {
      sidebarNotWorking();
      return alert("You can't create a lesson in the past");
    }

    if (confirm("Are you sure you want to submit this event?")) {
      eventInfo = {
        type,
        subtype,
        description,
        start,
        end,
        allDay,
        location,
        attendees,
        staff
      }

      const event = await saveLesson(eventInfo)
      console.log(event)
      // //FIXME: This should automatically update for the client and put it in a pending status
      // main_calendar.addEventSource([event]);
      closeCalendarSidebar(true);
      //since the defualt is to show no lesson just reload the entire calendar
      getCurrentCalendarTypeContent();



      // try {
      //   const studentConflict = await checkStudentConflicts(student, start, end)
      //   if (studentConflict) {
      //     sidebarNotWorking();
      //     return alert('This student has a conflict with a(n) ' + 
      //       eventTypeReadable(studentConflict.data().type) + ' event from ' +
      //       convertFromDateInt(studentConflict.data().start).longReadable + ' to ' +
      //       convertFromDateInt(studentConflict.data().end).longReadable
      //     )
      //   }

      //   const tutors = await getTutorsOpenByQualification(start, end, `${type}-${subtype}`, student)
      //   console.log(tutors)
      //   if (tutors.length > 0) {
      //     eventInfo = {
      //       type: type,
      //       subtype: subtype,
      //       description: description,
      //       start: start,
      //       end: end,
      //       allDay, allDay,
      //       location: location,
      //       student: student,
      //       staff: [tutors[0].tutor], // choose the first tutor since this tutor has been with the student the most or random
      //       price: price
      //     }

      //     const event = await saveLesson(eventInfo)
      //     // //FIXME: This should automatically update for the client and put it in a pending status
      //     // main_calendar.addEventSource([event]);
      //     closeCalendarSidebar(true);
      //     //since the defualt is to show no lesson just reload the entire calendar
      //     getCurrentCalendarTypeContent();
      //   }
      //   else {
      //     sidebarNotWorking();
      //     return alert("We don't have any tutors open at this time. Check the openings page for more options.")
      //   }
      // }
      // catch(error) {
      //   sidebarNotWorking();
      //   console.log(error);
      //   alert("We are having issues saving this lesson :(\nPlease try again and if the issue persist please contact the devs.");
      // }
    }
    else {
      sidebarNotWorking();
    }
  }

  else if (scheduleType == 'recurring') {
    let recurringPendingEventsFulfilled = [];
    let recurringEventsFulfilled = [];

    let studentConflicts = [];
    let staffConflicts = [];
    let pendingEvents = [];

    if (!pending_recurring_start.start || !pending_recurring_end.end || pending_recurring_times.length == 0 || !type || !subtype || staff.length == 0 || !location) {
      sidebarNotWorking();
      return alert("It looks like you're still missing some data for this lesson");
    }
    if (pending_recurring_start.start < new Date().getTime()) {
      sidebarNotWorking();
      return alert("You can't create a lesson in the past");
    }
    if (confirm("Are you sure you want to submit these events?")) {
      //figure out all of the events that must be added based on recurring start, end, and times.

      console.time('recurring')

      pending_recurring_times.forEach(weekTime => {
        let start = weekTime.start.getTime();
        let end = weekTime.end.getTime();

        //get the week time up to the start of the recurring schedule
        while (start < pending_recurring_start.start.getTime()) {
          start = new Date(start).setDate(new Date(start).getDate() + 7);
          end = new Date(end).setDate(new Date(end).getDate() + 7);
        }

        //save an event for each time until the end of the recurring
        while (end < pending_recurring_end.end.getTime()) {
          let passThruTimes = (start, end) => {
            //check for conflicts
            // console.log('start checking a lesson at', start)
            // recurringPendingEventsFulfilled.push(
            //   checkStudentConflicts(student, start, end)
            //   .then((studentConflict) => {
            //     console.log('done checking student conflicts for', start)
            //     console.timeLog('recurring')
            //     if (studentConflict) {
            //       studentConflicts.push(studentConflict);
            //       return; // since we have a student conflict just return so we don't check tutor
            //     }

            //     // return getRandomOpenTutor(start, end, staff, staffNames)
            //     // return getQualifiedOpenTutor(start, end, `${type}-${subtype}`, student)
            //     return getTutorsOpenByQualification(start, end, `${type}-${subtype}`, student)
            //     .then(tutors => {
            //       console.log('done getting tutors for', start)
            //       console.timeLog('recurring')
            //       if (tutors.length > 0) {
                    eventInfo = {
                      type,
                      subtype,
                      description,
                      start,
                      end,
                      location,
                      attendees,
                      staff,
                    }
                    pendingEvents.push(eventInfo);
            //       }
            //       else {
            //         staffConflicts.push({
            //           start : start,
            //           end : end
            //         })
            //         return;
            //       }
            //     })
            //   })
            // );
          }
          passThruTimes(start, end);
          start = new Date(start).setDate(new Date(start).getDate() + 7);
          end = new Date(end).setDate(new Date(end).getDate() + 7);
        }
      })

      try {
        // await Promise.all(recurringPendingEventsFulfilled)
        // console.log('done with prepping all events')
        // console.timeLog('recurring')
        // if (studentConflicts.length == 0 && staffConflicts.length == 0) {
        //   console.log(pendingEvents);
        //   // get a new array with only one copy of each tutor for all lesson with their new scores
        //   // convert the events just to their pending tutors and flatten so the arrays are all on the same level
        //   let allTutors = pendingEvents.flatMap(event => event.pendingStaff) 
        //   // filter out the duplicates and at the same time calculate how many times the tutor appears in the list
        //   .filter((tutor, index, tutors) => {
        //     let firstTutorIndex = tutors.findIndex(findTutor => findTutor.tutor === tutor.tutor)
        //     tutors[firstTutorIndex].num++;
        //     return firstTutorIndex === index;
        //   })
        //   // sort based on num
        //   .sort((a,b) => b.num - a.num);

          // go through each pending event and choose the tutor from that list that appears first in allTutors
          let batch = firebase.firestore().batch();
          pendingEvents.forEach(event => {
            // for (let i = 0; i < allTutors.length; i++) {
            //   if (event.pendingStaff.find(pendingTutor => pendingTutor.tutor === allTutors[i].tutor)) {
            //     event.staff = [allTutors[i].tutor];
            //     recurringEventsFulfilled.push(batchSaveLesson(event, batch));
            //     break;
            //   }
            // }
            recurringEventsFulfilled.push(batchSaveLesson(event, batch));
          })

          console.log('done with setting all events')
          console.timeLog('recurring')

          const events = await Promise.all(recurringEventsFulfilled)
          console.log(events)
          console.log('done with saving all events')
          console.timeLog('recurring')
          await batch.commit()
          // main_calendar.addEventSource(events)
          closeCalendarSidebar(true);
          console.log('done with rendering all events')
          console.timeEnd('recurring')
          getCurrentCalendarTypeContent();
        // }
        // else {
        //   sidebarNotWorking();
        //   console.log('These are the conflicts')
        //   console.log(studentConflicts);
        //   console.log(staffConflicts);
        //   console.log(pendingEvents);

        //   let displayMessage = `
        //     <p>I'm sorry, Dave. I'm afraid I can't do that.</p>
        //     <p>I tried my best to schedule the lessons you had inputted but we ran into some issues so I aborted the entire operation. No lesson was saved.</p>
        //     <p>Here is a list of the events that had issues.</p>
        //     <ul>
        //   `
        //   studentConflicts.forEach(conflictDoc => {
        //     displayMessage += `
        //       <li>The student has a conflict with ${eventTypeReadable(conflictDoc.data().type)} on ${convertFromDateInt(conflictDoc.data().start).longReadable}.</li>
        //     `
        //   })
        //   staffConflicts.forEach(conflict => {
        //     displayMessage += `
        //       <li>No tutor is available from ${convertFromDateInt(conflict.start).longReadable} to ${convertFromDateInt(conflict.end).longReadable}.</li>
        //     `
        //   })
        //   displayMessage += `
        //     </ul>
        //   `
        //   customConfirm(displayMessage, "", 'OK', ()=>{}, ()=>{});
        // }
      }
      catch(error) {
        sidebarNotWorking();
        console.log(error);
        alert("We are having issues saving this lesson :(\nPlease try again and if the issue persist please contact the devs.");
      }
    }
    else {
      sidebarNotWorking();
    }
  }

  else {
    sidebarNotWorking();
    console.warn("no schedule type: shouldn't be possible.")
  }
}

/**
 * Return a random tutor that is available to teach during the given time
 * @param {String} location 
 * @return random tutor uid and name that is open
 */
function getRandomOpenTutor(start, end, tutorList, tutorNameList) {
  //make deep copies so that the original array that are being worked on by the other functions
  let newTutorList = JSON.parse(JSON.stringify(tutorList));
  let newTutorNameList = JSON.parse(JSON.stringify(tutorNameList));

  console.log(newTutorList)
  console.log(newTutorNameList);

  if (newTutorList.length > 0) {
    let randomIndex = Math.floor(Math.random() * newTutorList.length);
    randomIndex = randomIndex == newTutorList.length ? randomIndex - 1 : randomIndex;

    const tutorUID = newTutorList[randomIndex];
    const tutorName = newTutorNameList[randomIndex];

    return checkStaffConflicts([tutorUID], start, end)
    .then((conflict) => {
      if (conflict) {
        //remove the tutor from the list and run the function again
        newTutorList.splice(randomIndex, 1);
        newTutorNameList.splice(randomIndex, 1);
        return getRandomOpenTutor(start, end, newTutorList, newTutorNameList)
      }
      else {
        return checkStaffAvailability(tutorUID, start, end)
        .then((isAvailable) => {
          if (!isAvailable.isAvailable) {
            //remove the tutor from the list and run the function again
            newTutorList.splice(randomIndex, 1);
            newTutorNameList.splice(randomIndex, 1);
            return getRandomOpenTutor(start, end, newTutorList, newTutorNameList)
          }
          else {
            return {
              id: tutorUID,
              name: tutorName,
            }
          }
        })
      }
    })
  }
  else {
    return null;
  }
}

async function getQualifiedOpenTutor(start, end, qualification, studentUID) {
  // see if we can get a definite tutor from the list of tutors that have taught this student before.
  // if not then just getRandomOpenTutor
  // to do so we'll have to get a list of tutors that are qualified passed in 


  //get the list of tutors that have tuaght this student before and order them by the number of times they have taught the student
  const studentDoc = await firebase.firestore().collection('Users').doc(studentUID).get();
  const previousTutors = studentDoc.data().previousTutors ?? {};
  const blacklistTutors = studentDoc.data().blacklistTutors ?? [];

  // sort the previous tutors
  const previousTutorList = Object.keys(previousTutors).map(tutorUID => {
    return {
      tutor: tutorUID,
      num: previousTutors[tutorUID] 
    }
  }).sort((a,b) => b.num - a.num);

  //remove the blacklist tutors
  previousTutorList.filter(previousTutor => !blacklistTutors.includes(previousTutor.tutor))
  
  //run through each tutor and check if they can teach
  for (let i = 0; i < previousTutorList.length; i++) {
    //get the tutor's name from their doc
    const tutorDoc = await firebase.firestore().collection('Users').doc(previousTutorList[i].tutor).get();
    //check if the tutor is qualified
    if (tutorDoc.data().qualifications.includes(qualification)) {
      const tutorName = tutorDoc.data().firstName + ' ' + tutorDoc.data().lastName
      //if we get a tutor that is available then return
      const availableTutor = await getRandomOpenTutor(start, end, [tutorDoc.id], [tutorName]);
      if (availableTutor) {
        console.log('returning previous tutor')
        return availableTutor;
      }
    }
  }  

  // since this student doesn't have any previous tutors just get a random one that is qualified
  const qualifiedTutorDocs = await getTutorDocsByQualification(current_location, qualification)
  let tutorNames = [];
  let tutorUIDs = [];
  qualifiedTutorDocs.forEach(tutorDoc => {
    //remove the previous tutors since we already checked them and the blacklist tutors
    if (!previousTutorList.some(previousTutor => previousTutor.tutor == tutorDoc.id) && !blacklistTutors.includes(tutorDoc.id)) {
      tutorNames.push(tutorDoc.data().firstName + ' ' + tutorDoc.data().lastName);
      tutorUIDs.push(tutorDoc.id);
    }
  })
  console.log('returning random tutor')
  return await getRandomOpenTutor(start, end, tutorUIDs, tutorNames);

}

async function getTutorsOpenByQualification(start, end, qualification, studentUID) {
  // get the blackisted tutors
  const studentDoc = await firebase.firestore().collection('Users').doc(studentUID).get();
  const blacklistTutors = studentDoc.data().blacklistTutors ?? [];

  // get the qualified tutors
  const qualifiedTutorDocs = await getTutorDocsByQualification(current_location, qualification);
  let qualifiedTutors = qualifiedTutorDocs.docs.map(doc => doc.id); 
  console.log({qualifiedTutors})

  // remove the blacklisted tutors
  qualifiedTutors = qualifiedTutors.filter(tutor => !blacklistTutors.includes(tutor));
  // no one is qualified so immediately fail
  if (qualifiedTutors.length == 0) {
    return [];
  }

  let openTutors = await getOpenTutors(current_location, start, end, qualifiedTutors);
  console.log({openTutors})

  // no need to do the following work if no tutors are open
  if (openTutors.length == 0) {
    return openTutors;
  }

  // now choose a tutor based on the studet's previous tutors or random
  const previousTutors = studentDoc.data().previousTutors ?? {};

  // sort the previous tutors
  const previousTutorList = Object.keys(previousTutors).map(tutorUID => {
    return {
      tutor: tutorUID,
      num: previousTutors[tutorUID] 
    }
  })

  // go through the list of open tutors and add in the details for the number of time the tutor has taught this student
  openTutors = openTutors.map(openTutor => {
    const previousTutor = previousTutorList.find(previousTutor => previousTutor.tutor == openTutor)
    if (previousTutor) {
      return previousTutor
    }
    else {
      return {
        tutor: openTutor,
        num: 0
      }
    }
  }).sort((a,b) => b.num - a.num);

  return openTutors;
}

async function getOpenTutors(location, start, end, tutorUIDs) {
  let dates = {};
  let tempStart = new Date(start).getTime();

  // get the intervals and the dates they are a part of that we need to check
  while (tempStart < end) {
    const date = new Date(tempStart).setUTCHours(0,0,0,0);
    if (!dates[date]) {
      dates[date] = [];
    }
    dates[date].push(tempStart);
    tempStart = new Date(tempStart).setMinutes(new Date(tempStart).getMinutes() + 30);
  }

  // run through the dates
  let tutorsOpen = [...tutorUIDs];
  for (const date in dates) {
    const totalRef = firebase.firestore().collection('Locations').doc(location).collection('Calendar-Openings').doc(date.toString());
    const totalDoc = await totalRef.get();
    if (!totalDoc.exists) {
      return [];
    }
    let totalData = totalDoc.data();
    // run through the intervals
    for (let i = 0; i < dates[date].length; i++) {
      // get the availability and events from the doc for each time
      const availabilities = totalData[dates[date][i]].filter(opening => opening.type == 'availability').map(opening => opening.tutor);
      const events = totalData[dates[date][i]].filter(opening => opening.type == 'event').map(opening => opening.tutor);

      console.log({ availabilities, events })

      // check if at least one of the provided tutors are open
      // const availabilities = totalData.availabilities?.[dates[date][i]] ?? [];
      // const events = totalData.events?.[dates[date][i]] ?? [];

      const openings = tutorUIDs.filter(tutor => !events.includes(tutor) && availabilities.includes(tutor));
      tutorsOpen = tutorsOpen.filter(tutor => openings.includes(tutor));
    }
  }
  return tutorsOpen;
}

function getTutorDocsByQualification(location, qualification) {
  return firebase.firestore().collection('Users')
  .where('role', '==', 'tutor')
  .where('location', '==', location)
  .where('qualifications', 'array-contains', qualification)
  .get()
}

async function updateEditLesson() {
  sidebarWorking();
  if (!confirm('Are you sure you want to update this lesson?')) {
    sidebarNotWorking();
    return
  }
  pending_calendar_event.description = document.getElementById('editLessonDescription').value;
  // pending_calendar_event.price = document.getElementById('editLessonPrice').value;
  pending_calendar_event.staff = getDropdownValues('editLessonStaff')

  //update the attendee list
  let attendees = [];
  const attendeeContainer =  document.getElementById('editLessonAttendeeContainer');
  attendeeContainer.querySelectorAll('.attendee-wrapper').forEach(wrapper => {
    const index = Number(wrapper.id.split('_')[1]);
    const student = document.getElementById(`editLessonStudentIndex_${index}`).value;
    attendees.push({
      student: document.getElementById(`editLessonStudentIndex_${index}`).value,
      price: Number(document.getElementById(`editLessonPriceIndex_${index}`).value),
    })
  })

  let staffNames = new Array(pending_calendar_event.staff.length);
  let studentData = new Array(attendees.length);
  let promises = [];

  // get the staff names
  pending_calendar_event.staff.forEach(async (tutorUID, index) => {
    promises.push(firebase.firestore().collection('Users').doc(tutorUID).get()
    .then(tutorDoc => {
      staffNames[index] = tutorDoc.data().firstName + ' ' + tutorDoc.data().lastName;
    }))
  })

  //get the student doc for name and parent
  attendees.forEach(async (attendee, index) => {
    promises.push(firebase.firestore().collection("Users").doc(attendee.student).get()
    .then(studentDoc => {
      studentData[index] = studentDoc.data();
    }))
  })

  await Promise.all(promises);
  

  attendees = attendees.map((attendee, index) => {
    return {
      ...attendee,
      studentName: studentData[index].firstName + ' ' + studentData[index].lastName,
      parents: studentData[index].parents
    }
  })

  // we're just going to remove all attendees and then add them back
  const attendeeCollectionRef = firebase.firestore().collection('Events').doc(pending_calendar_event_id).collection('Attendees');
  const attendeeQuery = await attendeeCollectionRef.get()
  await Promise.all(attendeeQuery.docs.map(doc => doc.ref.delete()))
  await Promise.all(attendees.map(attendee => attendeeCollectionRef.doc().set(attendee)));

  //check for conflicts
  // checkStudentConflicts(pending_calendar_event.student, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  // .then((studentConflict) => {
  //   if (studentConflict) {
  //     sidebarNotWorking();
  //     return alert('This student has a conflict with a(n) ' + 
  //       eventTypeReadable(studentConflict.data().type) + ' event from ' +
  //       convertFromDateInt(studentConflict.data().start).longReadable + ' to ' +
  //       convertFromDateInt(studentConflict.data().end).longReadable
  //     )
  //   }

  //   checkStaffConflicts(pending_calendar_event.staff, pending_calendar_event.start, pending_calendar_event.end, pending_calendar_event_id)
  //   .then((staffConflict) => {
  //     if (staffConflict) {
  //       sidebarNotWorking();
  //       return alert('This staff has a conflict with a(n) ' + 
  //         eventTypeReadable(staffConflict.data().type) + ' event from ' +
  //         convertFromDateInt(staffConflict.data().start).longReadable + ' to ' +
  //         convertFromDateInt(staffConflict.data().end).longReadable
  //       )
  //     }

  //     let availablePromises = [];
  //     for (let i = 0; i < pending_calendar_event.staff.length; i++) {
  //       availablePromises.push(checkStaffAvailability(pending_calendar_event.staff[i], pending_calendar_event.start, pending_calendar_event.end))
  //     }

  //     Promise.all(availablePromises)
  //     .then((areAvailable) => {
  //       for (let i = 0; i < areAvailable.length; i++) {
  //         if (!areAvailable[i].isAvailable) {
  //           sidebarNotWorking();
  //           return alert('The staff are not available at this time.')
  //         }
  //       }

        //update the doc with the pending event info
        firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
        .then(() => {
          main_calendar.getEventById(pending_calendar_event_id).remove();
          main_calendar.addEventSource([{
            id: pending_calendar_event_id,
            ...pending_calendar_event
          }])
          closeCalendarSidebar(true);
        })
        
  //     })
  //   })
  // })
  // .catch((error) => {
  //   sidebarNotWorking();
  //   console.log(error);
  //   alert("We are having issues saving this lesson :(\nPlease try again and if the issue persist please contact the devs.");
  // })
}

function submitAddAvailability() {
  sidebarWorking();
  const staff = document.getElementById('addAvailabilityStaff').value;
  const staffName = document.getElementById('addAvailabilityStaff').options[document.getElementById('addAvailabilityStaff').selectedIndex].text;
  const location = document.getElementById('calendarLocation').dataset.value;

  let recurringEventsFulfilled = [];

  if (!pending_recurring_start.start || !pending_recurring_end.end || !staff || !location) {
    sidebarNotWorking();
    return alert("It looks like you're still missing some data for this availability");
  }

  if (pending_recurring_times.length == 0) {
    sidebarNotWorking();
    if (!confirm('You are about to remove all availability for this staff member starting from the start date until the end date. Are you sure you want to proceed?')) {
      return
    }
  }
  else {
    sidebarNotWorking();
    if (!confirm('Are you sure you want to submit this availability? This action will remove all availability for this staff member from the start date until the end date and replace it with what was entered.')) {
      sidebarNotWorking();
      return
    }
  }

  //get the events in pending_recurring_times to combine if they are touching (start == end)
  //order the times by their start date
  pending_recurring_times.sort((a,b) => {return a.start.getTime() - b.start.getTime()});

  //combine if the end of the current event is the start of the next event
  for (let i = 0; i< pending_recurring_times.length - 1; i++) {
    if (pending_recurring_times[i].end.getTime() == pending_recurring_times[i+1].start.getTime()) {
      //extend the event to the next end
      pending_recurring_times[i].setEnd(pending_recurring_times[i+1].end);
      //remove the next event
      pending_recurring_times.splice(i+1, 1)
      //recheck this event for another touch
      i--
    }
  }


  //remove all availability for the staff member starting with the recurring start date until the end date
  firebase.firestore().collection('Availabilities')
  .where('staff', '==', staff)
  .where('start', '>=', pending_recurring_start.start.getTime())
  .where('start', '<', pending_recurring_end.end.getTime())
  .get()
  .then(querySnapshot => {
    let deletePromises = [];
    querySnapshot.forEach(eventDoc => {
      deletePromises.push(deleteAvailability(eventDoc.id)
      .then(() => {
        main_calendar.getEventById(eventDoc.id)?.remove()
      }))
    })

    Promise.all(deletePromises)
    .then(() => {
      //figure out all of the events that must be added based on recurring start, end, and times.
      pending_recurring_times.forEach(weekTime => {
        let start = weekTime.start.getTime();
        let end = weekTime.end.getTime();

        //get the week time up to the start of the recurring schedule
        while (start < pending_recurring_start.start.getTime()) {
          start = new Date(start).setDate(new Date(start).getDate() + 7);
          end = new Date(end).setDate(new Date(end).getDate() + 7);
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

          start = new Date(start).setDate(new Date(start).getDate() + 7);
          end = new Date(end).setDate(new Date(end).getDate() + 7);
        }
      })

      //then finish the availability process
      Promise.all(recurringEventsFulfilled)
      .then(events => {
        main_calendar.addEventSource(events);
        
        //try and correct the conflicts created by the change in availability
        fixAvailabilityChangeConflicts(staff, pending_recurring_start.start.getTime(), pending_recurring_end.end.getTime())
        .then(conflicts => {
          console.log('remaining conflicts', conflicts);
          if (conflicts.length > 0) {
            let displayMessage = `
              <p>I'm sorry, Dave. I'm afraid I can't do that.</p>
              <p>I tried my best to resolve the conflicts that were created by this action.</p>
              <p>Here is a list of the events I could not fix for ${staffName}.</p>
              <ul>
            `
            conflicts.forEach(conflictDoc => {
              displayMessage += `
                <li>${eventTypeReadable(conflictDoc.data().type)} on ${convertFromDateInt(conflictDoc.data().start).longReadable}</li>
              `
            })
            displayMessage += `
              </ul>
            `
            customConfirm(displayMessage, "", 'OK', ()=>{}, ()=>{});
          }
          closeCalendarSidebar(true);
        })
      })
    })
  })
  .catch((error) => {
    sidebarNotWorking();
    console.log(error);
    alert("We are having issues saving this availability :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

function submitAddTest() {
  sidebarWorking();
  const start = pending_calendar_event.start;
  const end = pending_calendar_event.end;
  const allDay = pending_calendar_event.allDay;
  const type = document.getElementById('addTestType').value;
  const location = document.getElementById('calendarLocation').dataset.value;

  if (!start || !type || !location) {
    sidebarNotWorking();
    return alert("It looks like you're still missing some data for this test");
  }

  if (confirm("Are you sure you want to submit this event?")) {
    
    eventInfo = {
      type: type,
      start: start,
      end: end,
      allDay, allDay,
      location: location,
      color: TEST_COLOR,
      textColor: tinycolor.mostReadable(TEST_COLOR, ["#FFFFFF", "000000"]).toHexString()
    }

    saveTest(eventInfo)
    .then((event) => {
      //FIXME: This should automatically update for the client and put it in a pending status
      main_calendar.addEventSource([event]);
      closeCalendarSidebar(true);
    })
  }
  else {
    sidebarNotWorking();
  }
}

function updateEditTest() {
  sidebarWorking();
  if (!confirm('Are you sure you want to update this test?')) {
    sidebarNotWorking();
    return
  }

  firebase.firestore().collection('Events').doc(pending_calendar_event_id).update(pending_calendar_event)
  .then(() => {
    main_calendar.getEventById(pending_calendar_event_id).remove();
    main_calendar.addEventSource([{
      id: pending_calendar_event_id,
      ...pending_calendar_event
    }])
    closeCalendarSidebar(true);
  })
  .catch((error) => {
    sidebarNotWorking();
    console.log(error);
    alert("We are having issues saving this test :(\nPlease try again and if the issue persist please contact the devs.");
  })
}

/**
 * Call this function after a tutor's availability has changed to try and fix conflicts by changing tutors for the lessons that now have conflicts
 * @param {String} staff staff uid 
 * @param {Number} start start time of availability change
 * @param {Number} end end time of availability change
 * @returns List of lessons that still have conflicts
 */
function fixAvailabilityChangeConflicts(staff, start, end) {
  let conflicts = [];

  //get all events that the staff has between start and end
  return firebase.firestore().collection('Events')
  .where('staff', 'array-contains', staff)
  .where('start', '>=', start)
  .where('start', '<', end)
  .get()
  .then(eventSnapshot => {
    let promises = [];
    //check if the staff member is still available to be at these lessons
    eventSnapshot.forEach(eventDoc => {
      promises.push(checkStaffAvailability(staff, eventDoc.data().start, eventDoc.data().end)
      .then((availability) => {
        //if so then do nothing
        if (availability.isAvailable) {return}
        //if not then get choose a random tutor to fill the spot if it is a lesson
        else {
          //we can only do something if the event is something where a random tutor could replace the other tutor
          if ([...LESSON_TYPES, 'testReview'].includes(eventDoc.data().type)) {
            return getUserListByRole(current_location, ['tutor'])
            .then(tutorList => {
              let tutorUIDs = [];
              let tutorNames = [];
              tutorList.forEach(tutor => {
                tutorUIDs.push(tutor.id);
                tutorNames.push(tutor.name)
              })

              // return getRandomOpenTutor(eventDoc.data().start, eventDoc.data().end, tutorUIDs, tutorNames)
              return getQualifiedOpenTutor(eventDoc.data().start, eventDoc.data().end, `${eventDoc.data().type}-${eventDoc.data().subtype}`, eventDoc.data().student)
              .then(openTutor => {
                //if a another tutor is available then update the lesson
                if (openTutor) {
                  let staffList = eventDoc.data().staff;
                  let staffNameList = eventDoc.data().staffNames;

                  const removeIndex = staffList.indexOf(staff);
                  staffList.splice(removeIndex, 1);
                  staffNameList.splice(removeIndex, 1);

                  staffList.push(openTutor.id);
                  staffNameList.push(openTutor.name);

                  //get the new tutor color
                  return firebase.firestore().collection('Users').doc(openTutor.id).get()
                  .then(tutorDoc => {
                    const color = tutorDoc.data().color;
                    const textColor = tinycolor.mostReadable(color, ["#FFFFFF", "000000"]).toHexString()

                    return firebase.firestore().collection('Events').doc(eventDoc.id).update({
                      staff : staffList,
                      staffNames : staffNameList,
                      color : color,
                      textColor : textColor
                    })
                  })
                }
                //if not then store the lessons to display to the user
                else {
                  return conflicts.push(eventDoc);
                }
              })
            })
          }
          //can't do anything so pass the issue to the user
          else {
            return conflicts.push(eventDoc);
          }
        }
      }));
    })

    return Promise.all(promises)
    .then(() => {
      return conflicts;
    })
  })
}

//SAVE FUNCTIONS

function saveTeacherMeeting(eventInfo) {
  //first get all of the staff that are invited to this meeting
  let promises = [];
  let staff = [];
  let staffNames = [];
  let wages = [];
  
  promises.push(firebase.firestore().collection('Users')
  .where("location", "==", eventInfo.invitedLocation)
  .where('roles', 'array-contains-any', ['tutor', 'secretary', 'admin'])
  .get()
  .then((staffSnapshot) => {
    staffSnapshot.forEach((staffDoc) => {
      const staffData = staffDoc.data();
      staff.push(staffDoc.id);
      staffNames.push(staffData.firstName + " " + staffData.lastName);
      wages.push(staffData.wage ?? 0);
    })
  }));

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
    return firebase.firestore().collection("Users").doc(eventInfo.staff[0]).get()
    .then((staffDoc) => {
      staffData = staffDoc.data();
      const staffColor = staffData?.color;
      eventData = {
        type: eventInfo.type,
        title: eventInfo.title,
        staff: eventInfo.staff,
        staffNames: eventInfo.staffNames,
        start: parseInt(eventInfo.start),
        end: parseInt(eventInfo.end),
        allDay: eventInfo.allDay,
        location: eventInfo.location,
        color: staffColor ?? GENRAL_INFO_COLOR,
        textColor: staffColor ? tinycolor.mostReadable(staffColor, ["#FFFFFF", "000000"]).toHexString() : tinycolor.mostReadable(GENRAL_INFO_COLOR, ["#FFFFFF", "000000"]).toHexString()
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
      staffNames: eventInfo.staffNames,
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
  return firebase.firestore().collection("Users").doc(eventInfo.student).get()
  .then((studentDoc) => {
    const data = studentDoc.data();
    const studentName = data.lastName + ", " + data.firstName;
    const studentParents = data.parents;

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
      
      parents: studentParents,

      attendees: [eventInfo.student, ...studentParents]
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
  let studentData = {};
  let staffData = {};

  //get the student doc for name and parent
  return firebase.firestore().collection("Users").doc(eventInfo.student).get()
  .then((studentDoc) => {
    studentData = studentDoc.data();
    
    //get first staff doc for color
    return firebase.firestore().collection("Users").doc(eventInfo.staff[0]).get()
  })
  .then((staffDoc) => {
    staffData = staffDoc.data();

    const studentName = studentData.lastName + ", " + studentData.firstName;
    const studentParents = studentData.parents;
    const staffColor = staffData?.color;

    const eventRef = firebase.firestore().collection("Events").doc()
    let eventData = {
      type: eventInfo.type,
      title: studentName + " - Conference",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      description: eventInfo.description,
      color: staffColor ?? eventInfo.color,
      textColor: tinycolor.mostReadable(staffColor, ["#FFFFFF", "000000"]).toHexString() ?? eventInfo.textColor,

      student: eventInfo.student,
      studentName: studentName,
      
      parents: studentParents,

      staff: eventInfo.staff,
      staffNames: eventInfo.staffNames,

      attendees: [eventInfo.student, ...studentParents, ...eventInfo.staff]
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
  let staffData = {};

  //get the student doc for name and parent
  return firebase.firestore().collection("Users").doc(eventInfo.student).get()
  .then((studentDoc) => {
    studentData = studentDoc.data();
    
    //get first staff name for color
    return firebase.firestore().collection("Users").doc(eventInfo.staff[0]).get()
  })
  .then((staffDoc) => {
    staffData = staffDoc.data();

    const studentName = studentData.lastName + ", " + studentData.firstName;
    const studentParents = studentData.parents;
    const staffColor = staffData?.color;

    const eventRef = firebase.firestore().collection("Events").doc()
    let eventData = {
      type: eventInfo.type,
      title: studentName + " - Test Review",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      color: staffColor ?? null,
      textColor: tinycolor.mostReadable(staffColor, ["#FFFFFF", "000000"]).toHexString() ?? null,

      student: eventInfo.student,
      studentName: studentName,
      
      parents: studentParents,

      staff: eventInfo.staff,
      staffNames: eventInfo.staffNames,

      attendees: [eventInfo.student, ...studentParents, ...eventInfo.staff]
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

async function batchSaveLesson(eventInfo, batch) {
  let staffNames = new Array(eventInfo.staff.length);
  let studentData = new Array(eventInfo.attendees.length);
  let lessonTypeReadable = "";
  let promises = [];

  // get the staff names
  eventInfo.staff.forEach(async (tutorUID, index) => {
    promises.push(firebase.firestore().collection('Users').doc(tutorUID).get()
    .then(tutorDoc => {
      staffNames[index] = tutorDoc.data().firstName + ' ' + tutorDoc.data().lastName;
    }))
  })

  //get the student doc for name and parent
  eventInfo.attendees.forEach(async (attendee, index) => {
    promises.push(firebase.firestore().collection("Users").doc(attendee.student).get()
    .then(studentDoc => {
      studentData[index] = studentDoc.data();
    }))
  })
  
  promises.push(convertLessonTypeReadable(eventInfo.location, eventInfo.type, eventInfo.subtype)
  .then(res => {
    lessonTypeReadable = res;
  }))

  await Promise.all(promises);
  

  const attendees = eventInfo.attendees.map((attendee, index) => {
    return {
      ...attendee,
      studentName: studentData[index].firstName + ' ' + studentData[index].lastName,
      parents: studentData[index].parents
    }
  })

  const eventRef = firebase.firestore().collection("Events").doc()
  let eventData = {
    type: eventInfo.type,
    subtype: eventInfo.subtype,
    description: eventInfo.description,
    title: lessonTypeReadable,
    start: parseInt(eventInfo.start),
    end: parseInt(eventInfo.end),
    location: eventInfo.location,

    staff: eventInfo.staff,
    staffNames,
  }

  batch.set(eventRef, eventData)
  // set the attendee docuements
  attendees.forEach(attendee => {
    batch.set(eventRef.collection('Attendees').doc(), attendee);
  })

  return {
    id: eventRef.id,
    title: eventData.title,
    start: convertFromDateInt(eventData.start).fullCalendar,
    end: convertFromDateInt(eventData.end).fullCalendar,
    allDay: eventData.allDay,
    color: eventData.color,
    textColor: eventData.textColor,
  }
}

async function saveLesson(eventInfo) {
  let staffNames = new Array(eventInfo.staff.length);
  let studentData = new Array(eventInfo.attendees.length);
  let lessonTypeReadable = "";
  let promises = [];

  // get the staff names
  eventInfo.staff.forEach(async (tutorUID, index) => {
    promises.push(firebase.firestore().collection('Users').doc(tutorUID).get()
    .then(tutorDoc => {
      staffNames[index] = tutorDoc.data().firstName + ' ' + tutorDoc.data().lastName;
    }))
  })

  //get the student doc for name and parent
  eventInfo.attendees.forEach(async (attendee, index) => {
    promises.push(firebase.firestore().collection("Users").doc(attendee.student).get()
    .then(studentDoc => {
      studentData[index] = studentDoc.data();
    }))
  })
  
  promises.push(convertLessonTypeReadable(eventInfo.location, eventInfo.type, eventInfo.subtype)
  .then(res => {
    lessonTypeReadable = res;
  }))

  await Promise.all(promises);
  

  const attendees = eventInfo.attendees.map((attendee, index) => {
    return {
      ...attendee,
      studentName: studentData[index].firstName + ' ' + studentData[index].lastName,
      parents: studentData[index].parents
    }
  })

  const eventRef = firebase.firestore().collection("Events").doc()
  let eventData = {
    type: eventInfo.type,
    subtype: eventInfo.subtype,
    description: eventInfo.description,
    title: lessonTypeReadable,
    start: parseInt(eventInfo.start),
    end: parseInt(eventInfo.end),
    location: eventInfo.location,

    staff: eventInfo.staff,
    staffNames,
  }

  // set the event
  await eventRef.set(eventData)

  // set the attendee docuements
  await Promise.all(attendees.map(attendee => {
    return eventRef.collection('Attendees').doc().set(attendee)
  }))

  return {
    id: eventRef.id,
    title: eventData.title,
    start: convertFromDateInt(eventData.start).fullCalendar,
    end: convertFromDateInt(eventData.end).fullCalendar,
    allDay: eventData.allDay,
    color: eventData.color,
    textColor: eventData.textColor,
  }
}

function saveAvailability(eventInfo) {
  let staffData = {};

  return firebase.firestore().collection("Users").doc(eventInfo.staff).get()
  .then((staffDoc) => {
    staffData = staffDoc.data();

    const staffColor = staffData?.color;
    const staffName = staffData.firstName + " " + staffData.lastName;

    const eventRef = firebase.firestore().collection("Availabilities").doc()
    let eventData = {
      type: eventInfo.type,
      title: staffName + " - Availability",
      start: parseInt(eventInfo.start),
      end: parseInt(eventInfo.end),
      allDay: eventInfo.allDay,
      location: eventInfo.location,
      color: staffColor ?? AVAILABILITY_COLOR,
      textColor: staffColor ? tinycolor.mostReadable(staffColor, ["#FFFFFF", "000000"]).toHexString() : tinycolor.mostReadable(AVAILABILITY_COLOR, ["#FFFFFF", "000000"]).toHexString(),

      staff: eventInfo.staff,
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

function saveTest(eventInfo) {
    let testTypeReadable = ""

    switch(eventInfo.type) {
      case 'actTest':
        testTypeReadable = 'ACT Test';
        break;
      case 'satTest':
        testTypeReadable = 'SAT Test';
        break;
      default:
        testTypeReadable = 'Test';
    }

    const eventRef = firebase.firestore().collection("Events").doc()
    let eventData = {
      type: 'test',
      title: testTypeReadable,
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
  return firebase.firestore().collection("Users").doc(user.uid).get()
  .then((userDoc) => {
    let userData = userDoc.data();
    let locationUID = userData.location;

    return firebase.firestore().collection("Locations").doc(locationUID).get()
    .then((locationDoc) => {
      let locationData = locationDoc.data();
      return [{
        id: locationUID,
        name: locationData.locationName
      }]
    })
  })
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

async function convertLessonTypeReadable(location, type, subtype = null) {
  // get the location's lesson types
  const lessonTypes = await getLessonTypeList(location);

  // find the type and subtype names
  const lessonType = lessonTypes.find(lesson => lesson.value == type);
  const lessonName = lessonType.name;
  const lessonSubname = subtype ? lessonType.subtypes.find(sublesson => sublesson.value == subtype).name : '';

  return lessonName + ' ' + lessonSubname;
}

/**
 * Return a list of users (name and id) for the given location and role.
 * @param {String} location location uid
 * @param {Array<String>} roles roles to get
 * @returns list of desired users with name and id properties
 */
 function getUserListByRole(location, roles) {
  if(!location) {
    alert("Choose a location first!");
    return Promise.reject('no location selected')
  }
  return firebase.firestore().collection("Users")
  .where("location", "==", location)
  // .where("roles", 'array-contains-any', roles)
  .where("role", 'in', roles)
  .orderBy("lastName").get()
  .then((userSnapshot) => {
    let users = [];
    userSnapshot.forEach((userDoc) => {
      const data = userDoc.data();
      users.push({
        name: data.lastName + ", " + data.firstName,
        id: userDoc.id
      })
    })

    return users;
  })
}

function getUserDocsByRole(location, roles) {
  if(!location) {
    alert("Choose a location first!");
    return Promise.reject('no location selected')
  }
  return firebase.firestore().collection("Users")
  .where("location", "==", location)
  // .where("roles", 'array-contains-any', roles)
  .where("role", 'in', roles)
  .orderBy("lastName")
  .get()
}

function getDropdownValues(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let values = []
  inputs.forEach((input) => {
    values.push(input.dataset.value)
  })

  return values;
}

function getDropdownText(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let texts = []
  inputs.forEach((input) => {
    texts.push(input.textContent)
  })

  return texts;
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

function clearAddGeneralInfoRecurringSelected() {
  //unselect the buttons for recurring
  unselectSiblings(document.getElementById('addGeneralInfoRecurringWrapper').children.item(0))

  //remove any recurring event data from pending?
}

function clearAddGeneralInfoSingleSelected() {
  //remove any single event data from pending?
}

function addGeneralInfoSingleSelected(target) {
  clearAddGeneralInfoRecurringSelected();

  //set up the default behavior when adding single events
  initializeDefaultCalendar([]);
  main_calendar.setOption('selectable', true);
}

function addGeneralInfoRecurringSelected(target) {
  clearAddGeneralInfoSingleSelected();

  recurringEventTimesClickCallback(document.getElementById('addGeneralInfoRecurringWrapper').children[0]);
}

function recurringEventTimesClickCallback(target) {
  unselectSiblings(target);
  target.classList.add('selected');

  initializeWeeklyScheduleCalendar(pending_recurring_times);
}

function recurringEventStartEndClickCallback(target) {
  unselectSiblings(target);
  target.classList.add('selected');

  initializeMonthScheduleCalendar([pending_recurring_start, pending_recurring_end]);
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
    if (doc.id != ignoredEventID) {
      isValid = false;
    }
  })

  return isValid;
}


function checkStaffAvailability(staffUID, start, end) {
  return firebase.firestore().collection('Availabilities')
  .where('staff', '==', staffUID)
  .where('end', '>=', end)
  .orderBy('end')
  .limit(1)
  .get()
  .then((availabilitySnapshot) => {
    //if there are no events in the snapshot then the staff is not available
    if (availabilitySnapshot.empty) {
      return {
        isAvailable: false,
        staff: staffUID,
        start: start,
        end: end
      }
    }
    else {
      //if the availability events starts before or at the same start as the event to check the staff is available
      if (availabilitySnapshot.docs[0].data().start <= start) {
        return {
          isAvailable: true,
          staff: staffUID,
          start: start,
          end: end
        }
      }
      //else they are not
      else {
        return {
          isAvailable: false,
          staff: staffUID,
          start: start,
          end: end
        }
      }
    }
  })
}

function eventTypeReadable(type) {
  switch(type) {
    case 'conference':
      return 'Conference'
    case 'generalInfo':
      return 'General Info'
    case 'practiceTest':
      return 'Practice Test'
    case 'teacherMeeting':
      return 'Teacher Meeting'
    case 'testReview':
      return 'Test Review'
    case 'act':
      return 'ACT';
    case 'subjectTutoring':
      return 'Subject Tutoring';
    case 'mathProgram':
      return 'Math Program';
    case 'phonicsProgram':
      return 'Phonics Program';
    case 'apExam':
      return 'AP Exam'
    default:
      return type;
  }
}