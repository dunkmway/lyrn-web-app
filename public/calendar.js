document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    height: "90vh",
    initialView: 'timeGridWeek',
    hiddenDays: [0, 6],
    scrollTime: '09:00:00',
    nowIndicator: true,
    headerToolbar: {
      start:   'today prev,next',
      center: 'title',
      end:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    themeSystem: 'standard',
    editable: true,

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

    events: [
      {
        id: 'a',
        title: 'my event',
        start: '2021-06-14T10:00:00',
        end: '2021-06-14T12:00:00',
        color: 'yellow',
        textColor: 'black',
      },
      {
        id: 'b',
        title: 'my second event',
        start: '2021-06-14T10:00:00',
        end: '2021-06-14T12:00:00',
      },
      {
        id: 'c',
        title: 'my third event',
        start: '2021-06-14T10:00:00',
        end: '2021-06-14T12:00:00',
      },
      {
        id: 'd',
        title: 'my fourth event',
        start: '2021-06-14T10:00:00',
        end: '2021-06-14T12:00:00',
      },
      {
        title: 'background event',
        start: '2021-06-14T10:00:00',
        end: '2021-06-14T18:00:00',
        display: 'background',
      },
      {
        title: 'background event',
        start: '2021-06-15T10:00:00',
        end: '2021-06-15T16:00:00',
        display: 'background',
        color: 'red',
      },
      {
        start: '2021-06-15T12:00:00',
        end: '2021-06-15T18:00:00',
        display: 'background',
      }
    ]
  });
  calendar.render();
});