document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    scrollTime: '07:00:00',
    nowIndicator: true,
    headerToolbar: {
      start:   'today prev,next',
      center: 'title',
      end:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    themeSystem: 'standard',
    editable: true,

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