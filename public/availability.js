let main_calendar;
let gap_events_weekly;
let new_gap_events;
let old_availability_set_until;
let new_availability_set_until;
let current_user;

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
  //make sure we have the user
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      current_user = user;
      getLastAvailableTime(user)
      .then((lastTime) => {
        console.log(lastTime)
        old_availability_set_until = lastTime;
        //show the user availability
        initializeAvailabilityCalendar();
      })
    }
  });
}

function getLastAvailableTime(user) {
  //get the current user's last available time
  return firebase.firestore().collection('Tutors').doc(user.uid).get()
  .then((tutorDoc) => {
    return tutorDoc.data().availabilitySetUntil > new Date().setHours(0,0,0,0) ? tutorDoc.data().availabilitySetUntil : new Date().setHours(0,0,0,0);
  })
}

function initializeAvailabilityCalendar() {
  if (main_calendar) {
    main_calendar.destroy();
  }

  let validStart = convertFromDateInt(new Date().setHours(0,0,0,0)).fullCalendar;
  console.log(convertFromDateInt(old_availability_set_until))
  let validEnd = convertFromDateInt(old_availability_set_until).fullCalendar;
  let validRange = {
    start: validStart,
    end: validEnd
  };

  var calendarEl = document.getElementById('calendar');

  if (validStart != validEnd) {
    main_calendar = new FullCalendar.Calendar(calendarEl, {
      height: "755px",
      initialView: 'timeGridWeek',
      validRange: validRange,
      hiddenDays: [0],
      displayEventEnd: true,
      allDaySlot: false,
      scrollTime: '09:00:00',
      slotDuration: "01:00:00",
      slotMinTime: "9:00:00",
      slotMaxTime: "21:00:00",
      nowIndicator: true,
      headerToolbar: {
        start:   'today prev,next',
        center: 'title',
        end:  'dayGridMonth,timeGridWeek'
      },
      themeSystem: 'standard',

      datesSet: function(dateInfo) {
        if (current_user) {
          getAvailability(current_user.uid, dateInfo.start.getTime(), dateInfo.end.getTime())
          .then(events => {
            //remove the old events
            main_calendar.getEvents().forEach(event => {
              event.remove()
            });
            //add the new ones
            convertEventsToFullCalendar(events).forEach(event => {
              main_calendar.addEvent(event);
            })
          })
          .catch((error) =>{
            console.log(error);
            alert("We had an issue loading the calendar events. Try refreshing the page.")
          })
        }
      },
      businessHours: CURRENT_BUSINESS_HOURS,
    });
    main_calendar.render();
  }
  else {
    // there is no availability from today so prompt the user to create it.
    document.getElementById('noAvailability').style.display = 'block';
  }
}

function convertEventsToFullCalendar(events) {
  let fullCalendarEvents = [];
  events.forEach((event) => {
    fullCalendarEvents.push({
      start: convertFromDateInt(event.start).fullCalendar,
      end: convertFromDateInt(event.end).fullCalendar,
    })
  })
  return fullCalendarEvents
}

function getAvailability(userUID, start, end) {
  return firebase.firestore().collection('Events').where("staff", 'array-contains', userUID).where('type', '==', 'unavailable').where('start', '>=', start).where('start', '<', end).get()
  .then((eventSnapshot) => {
    console.log('number of events grabbed:', eventSnapshot.size)
    let events = [];
    eventSnapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data();
      events.push(eventData);
    });
    return getAvailableEvents(events)
  });
}

function setupSetAvailability() {
  document.getElementById('noAvailability').style.display = 'none';
  document.getElementById('setUntilInstructions').style.display = 'block';
  document.querySelector('.calendarInstructions').classList.add('visibleBackground');
  //set up for picking new availability date
  setupMonthScheduleView([]);
}

function initializeWeeklyScheduleCalendar(events) {
  if (main_calendar) {
    main_calendar.destroy();
  }

  var calendarEl = document.getElementById('calendar');
  main_calendar = new FullCalendar.Calendar(calendarEl, {
    height: "495px",
    initialView: 'timeGridWeek',
    hiddenDays: [0],
    allDaySlot: false,
    slotMinTime: "9:00:00",
    slotMaxTime: "17:00:00",
    slotDuration: "01:00:00",
    headerToolbar: {
      start:   '',
      center: '',
      end:  ''
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

function submitWeeklySchedule() {
  gap_events_weekly = getUnavailableEvents(main_calendar.getEvents());
  new_gap_events = extendGapsUntilNewAvailability();
  let testingEvents = [];

  new_gap_events.forEach((event) => {
    testingEvents.push({
      title: 'test unavailable',
      start: convertFromDateInt(event.start).fullCalendar,
      end: convertFromDateInt(event.end).fullCalendar,
    });
  });

  let promises = []

  //save the new availability
  promises.push(firebase.firestore().collection('Tutors').doc(current_user.uid).update({
    availabilitySetUntil: new_availability_set_until
  }));

  //save the unavailable events
  new_gap_events.forEach(event => {
    promises.push(firebase.firestore().collection('Events').doc().set(event));
  })

  Promise.all(promises)
  .then(() => {
    old_availability_set_until = new_availability_set_until;
    initializeAvailabilityCalendar();
  })
}

function submitAvailabilityUntil() {
  //setup calendar for selecting schedule during week
  initializeWeeklyScheduleCalendar([]);

}

function setupMonthScheduleView(events) {
  console.log(convertFromDateInt(old_availability_set_until).fullCalendar)
  main_calendar.destroy()

  var calendarEl = document.getElementById('calendar');
  main_calendar = new FullCalendar.Calendar(calendarEl, {
    // height: "495px",
    initialView: 'dayGridMonth',
    initialDate: new Date(old_availability_set_until),
    validRange: {
      start: convertFromDateInt(old_availability_set_until).fullCalendar
    },
    hiddenDays: [],
    allDaySlot: false,
    slotMinTime: "9:00:00",
    slotMaxTime: "17:00:00",
    slotDuration: "01:00:00",
    headerToolbar: {
      start:   'prev,next',
      center: 'title',
      end:  ''
    },
    themeSystem: 'standard',
    // selectConstraint: "businessHours",

    // only show the day name (good for setting availability)
    // dayHeaderFormat: { weekday: 'long' },

    selectable: true,

    select: function(info) {
      new_availability_set_until = info.end.getTime();
      //remove all other events
      main_calendar.getEvents().forEach(event => {
        event.remove();
      })

      main_calendar.addEvent({
        title: 'available until today',
        start: info.start,
        allDay: true,
      });

      main_calendar.addEvent({
        title: 'available from today',
        start: new Date(old_availability_set_until),
        allDay: true
      })
      main_calendar.unselect();
    },

    selectAllow: function(selectInfo) {
      if (selectInfo.start.getTime() < old_availability_set_until) {
        return false;
      }
      else {
        return true;
      }
    },

    businessHours: CURRENT_BUSINESS_HOURS,

    events: events
  });
  main_calendar.render();
  //add in the available from date
  main_calendar.addEvent({
    title: 'available from today',
    start: new Date(old_availability_set_until),
    allDay: true
  })
}

function setupLastCheckCalendar(events) {
  main_calendar.destroy()

  var calendarEl = document.getElementById('calendar');
  main_calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    slotDuration: "01:00:00",
    headerToolbar: {
      start:   'today prev,next',
      center: 'title',
      end:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    allDaySlot: false,
    themeSystem: 'standard',
    businessHours: CURRENT_BUSINESS_HOURS,

    events: events
  });
  main_calendar.render();
}

function getAvailableEvents(unavailableEvents) {
  let availableEvents = [];
  //divide the unavailable events into days
  let dateDivided = []
  eventLoop:
  for (let i = 0; i < unavailableEvents.length; i++) {
    //check if we already have an array for that date
    for (let j = 0; j < dateDivided.length; j++) {
      if (convertFromDateInt(dateDivided[j][0].start)['mm/dd/yyyy'] == convertFromDateInt(unavailableEvents[i].start)['mm/dd/yyyy']) {
        //if we do then push this event
        dateDivided[j].push(unavailableEvents[i]);
        continue eventLoop;
      }
    }
    //if we didnt find one then push a new array for that date
    dateDivided.push([unavailableEvents[i]])
  }

  dateDivided.forEach(date => {
    //order the dates
    date.sort((a,b) => a.start - b.start)
  });

  //run through each day of the current view. If we have a date array use that otherwise check if it is within business days and fill the entire day
  const currentViewStart = main_calendar.view.currentStart;
  const currentViewEnd = main_calendar.view.currentEnd;

  //FIXME: hour gaps not working somewhere. check the calendar and make a bunch of gaps
  const currentDates = getDatesBetween(currentViewStart, currentViewEnd);
  currentDate:
  for (let i = 0; i < currentDates.length; i++) {
    //run through each divided date and see if we have unavailable date on this date
    dividedDate:
    for (let j = 0; j < dateDivided.length; j++) {
      let date = dateDivided[j];
      if (date[0].start > currentDates[i].getTime() && date[0].end < currentDates[i].getTime() + 86400000) {
        //get the business hours
        const businessHours = getCurrentBusinessHours(new Date(date[0].start));
        // the current day needs business hours
        if (businessHours) {
          const businessStart = new Date(date[0].start).setHours(parseInt(businessHours.start));
          const businessEnd = new Date(date[0].start).setHours(parseInt(businessHours.end));

          //create events in the gaps
          //handle the gap between start of business day and first event
          if (businessStart != date[0].start) {
            availableEvents.push({
              start: businessStart,
              end: date[0].start
            });
          }
          // handle middle events
          for (let k = 0; k < date.length - 1; k++) {
            if (date[k].end != date[k + 1].start) {
              availableEvents.push({
                start: date[k].end,
                end: date[k + 1].start
              });
            }
          }
          //handle last event and end of business day
          if (date[date.length - 1].end != businessEnd) {
            availableEvents.push({
              start: date[date.length - 1].end,
              end: businessEnd
            });
          }
        }
        continue currentDate;
      }
    }

    // no unavailable date
    //check if the business hours include the date
    const businessHours = getCurrentBusinessHours(currentDates[i]);
    if (businessHours) {
      //if the hours are included then the whole day must be available
      const businessStart = currentDates[i].setHours(parseInt(businessHours.start));
      const businessEnd = currentDates[i].setHours(parseInt(businessHours.end));
      availableEvents.push({
        start: businessStart,
        end: businessEnd
      })
    }
  }

  console.log(availableEvents);
  return availableEvents;

}

/**
 * 
 * @param {Date} startDate 
 * @param {*} endDate 
 * @returns array of dates including start date, excluding end date
 */
function getDatesBetween(startDate, endDate) {
  let dates = []; 
  while(startDate.getTime() < endDate.getTime()) {
    dates.push(new Date(startDate.setHours(0,0,0,0)));
    startDate.setDate(startDate.getDate() + 1)
  }

  return dates;
}

// FIXME: Need to generalize this for choosing hours based on changing hours (right now just summer)
/**
 * Return the current business hours for the given date
 * @param {Date} date date to return current business hours for
 */
function getCurrentBusinessHours(date) {
  const day = date.getDay();
  for (let i = 0; i < CURRENT_BUSINESS_HOURS.length; i++) {
    if (CURRENT_BUSINESS_HOURS[i].daysOfWeek.indexOf(day) != -1) {
      //found the dayOfWeek in the hours
      return {
        start: CURRENT_BUSINESS_HOURS[i].startTime,
        end: CURRENT_BUSINESS_HOURS[i].endTime,
      }
    }
  }

  return null;
}

/**
 * Return the unavailable events that are the inverse of the available events that are inputted
 * @param {Array} availableEvents event that are available
 * @returns events that are unavaiable (inverse of available) 
 */
function getUnavailableEvents(availableEvents) {

  //convert the events into days and times
  let workingEvents = [];
  availableEvents.forEach(event => {
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
      staff: [current_user.uid]
    })
  })

  console.log(gapEvents);
  return gapEvents;
}

function getBeginningOfWeek(d) {
  let date = new Date(d);
  let day = date.getDay();
  return new Date(new Date(date.setDate(date.getDate() - day)).setHours(0,0,0,0));
}

function extendGapsUntilNewAvailability() {
  let allGapEvents = [];
  gap_events_weekly.forEach(gapEvent => {
    // take each event and add a week to it and continue to do so until the date time is greater than the new availability time
    let numWeeks = 0;
    const millisecondsWeek = 604800000;
    while(gapEvent.start + (numWeeks * millisecondsWeek) < new_availability_set_until) {
      newGap = {
        start: gapEvent.start + (numWeeks * millisecondsWeek),
        end: gapEvent.end + (numWeeks * millisecondsWeek),
        type: 'unavailable',
        staff: [current_user.uid]
      }
      allGapEvents.push(newGap);
      numWeeks++;
    }
  });

  //remove all dates that occur before the old available time
  const originalLength = allGapEvents.length;
  for (let i = originalLength - 1; i >=0; i--) {
    if (allGapEvents[i].start < old_availability_set_until) {
      allGapEvents.splice(i, 1);
    }
  }

  return allGapEvents;
}

var calendarInstructions = document.querySelector('.calendarInstructions');

document.addEventListener('mousemove', tooltipFollow, false);

function tooltipFollow(e) {
  calendarInstructions.style.left = e.pageX + 'px';
  calendarInstructions.style.top = e.pageY + 'px';
}