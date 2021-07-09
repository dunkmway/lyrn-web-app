let main_calendar;

//these are arrays of events that give the business hours
const BUSINESS_HOURS_SUMMER = [
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
]

const BUSINESS_HOURS_FALL = [
  {
    daysOfWeek: [1, 2, 3, 4],
    startTime: '13:00',
    endTime: '21:00'
  },
  {
    daysOfWeek: [6],
    startTime: '9:00',
    endTime: '13:00'
  }
]

const BUSINESS_HOURS_WINTER = [
  {
    daysOfWeek: [1, 2, 3, 4],
    startTime: '13:00',
    endTime: '21:00'
  },
  {
    daysOfWeek: [6],
    startTime: '9:00',
    endTime: '13:00'
  }
]

const CURRENT_BUSINESS_HOURS = BUSINESS_HOURS_SUMMER;



function initialSetup() {
  //get the blank calendar before filling in events
  initializeCalendar([]);
}

function initializeCalendar(events) {
  var calendarEl = document.getElementById('calendar');
  main_calendar = new FullCalendar.Calendar(calendarEl, {
     height: "531px",
    initialView: 'timeGridWeek',
    hiddenDays: [0, 6],
    allDaySlot: false,
    slotMinTime: "9:00:00",
    slotMaxTime: "17:00:00",
    slotDuration: "01:00:00",
    headerToolbar: {
      start:   'today prev,next',
      center: 'title',
      end:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    themeSystem: 'standard',
    selectConstraint: "businessHours",

    // only show the day name (good for setting availability)
    dayHeaderFormat: { weekday: 'long' },

    selectable: true,

    select: function(info) {
      main_calendar.addEvent({
        start: info.start,
        end: info.end,
      });
      main_calendar.unselect();
    },
    selectOverlap: function(event) {
        event.remove();
        return true;
    },

    eventClick: function(info) {
      info.event.remove();
    },

    unselectAuto: false,

    businessHours: CURRENT_BUSINESS_HOURS,

    events: events
  });
  main_calendar.render();
}

function invertEvents() {
  const currentEvents = main_calendar.getEvents();

  //convert the events into days and times
  let workingEvents = [];
  currentEvents.forEach(event => {
    workingEvents.push({
      day: event.start.getDay(),
      start: event.start.getHours(),
      end: event.end.getHours(),
    });
  });

  //convert business hours into the same format
  let workingBusinessHours = [];
  CURRENT_BUSINESS_HOURS.forEach(hours => {
    hours.daysOfWeek.forEach(dayOfWeek => {
      workingBusinessHours.push({
        day: dayOfWeek,
        start: parseInt(hours.startTime),
        end: parseInt(hours.endTime)
      })
    })
  })

  //get the empty gaps
  let gaps = [];
  workingBusinessHours.forEach(businessDayHours => {
    //get all of the events on this day
    let currentDay = businessDayHours.day;
    let currentDayEvents = [];
    workingEvents.forEach(event => {
      if (event.day == currentDay) {
        currentDayEvents.push(event);
      }
    });

    //sort the currentDayEvents
    currentDayEvents.sort((a,b) => {return a.start - b.start});

    //get array of all of the event start and end time
    let boundaryTimes = [businessDayHours.start];
    currentDayEvents.forEach(event => {
      boundaryTimes.push(event.start);
      boundaryTimes.push(event.end);
    })
    boundaryTimes.push(businessDayHours.end);

    //get the gaps
    for (let i = 0; i < boundaryTimes.length; i += 2) {
      //make sure we aren't adding a gap of 0 hours
      if (boundaryTimes[i] != boundaryTimes[i+1]) {
        gaps.push({
          day: businessDayHours.day,
          start: boundaryTimes[i],
          end: boundaryTimes[i+1]
        });
      }
    }
  });

  // convert the gaps into an array of events for full calendar
  let gapEvents = []
  const currentViewStart = main_calendar.view.currentStart;
  gaps.forEach(gap => {
    let start = new Date(currentViewStart.getFullYear(), currentViewStart.getMonth(), currentViewStart.getDate() + gap.day, gap.start)
    let end = new Date(currentViewStart.getFullYear(), currentViewStart.getMonth(), currentViewStart.getDate() + gap.day, gap.end)

    //events to be saved to firebase
    gapEvents.push({
      start: start.getTime(),
      end: end.getTime(),
      type: 'unavailable',
      staff: [firebase.auth().currentUser.uid]
    })

    //temporary event to be shown while testing
    main_calendar.addEvent({
      start: convertFromDateInt(start.getTime()).fullCalendar,
      end: convertFromDateInt(end.getTime()).fullCalendar,
      color: 'red'
    })
  })

  //remove all current events
  currentEvents.forEach(event => {
    //event.remove();
  })

  console.log(gapEvents);
  return gapEvents;
}