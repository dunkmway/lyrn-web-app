import "./_authorization";
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import Dialog from "./_Dialog";
import Time from "./_Time";
import { requestSignOut } from "./_authorization";
import app from "./_firebase";

const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
  setLeadsTable();
  setPracticeTestTable();
  setUnsubscribeTable();
  setErrorTable();
  setFeedbackTable();

  document.getElementById('signOut').addEventListener('click', requestSignOut);
}

function setLeadsTable() {
  let tableData = [];
  const leadsCollectionQuery = query(collection(db, "Leads"));
  getDocs(leadsCollectionQuery)
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let errorData = {
        docUID : doc.id,
        Email : data.email,
        Time: new Time(data.timestamp.toDate()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}'),
        Page : data.page,
        Type : data.type,
      }
      tableData.push(errorData);
    });

    let leadsTable = $('#leads-table').DataTable({
      data: tableData,
      columns: [
        { data: 'Email' },
        { data: 'Time' },
        { data: 'Page'},
        { data: 'Type' },
      ],
      "autoWidth": false,
      "pageLength" : 10,
    });

    $('#leads-table tbody').on('dblclick', 'tr', (event) => {
      const row = leadsTable.row(event.target).index();
      let docUID = tableData[row].docUID;
      let confirmation = confirm("Are you sure you want to delete this lead?\nThis action cannot be undone!");
      if (confirmation) {
        const leadsDocRef = doc(db, "Leads", docUID)
        deleteDoc(leadsDocRef)
        .then(() => {
          //update the tableData array
          tableData.splice(row, 1);
          //remove the row (parent) that was clicked
          leadsTable.row($(event.target).parents('tr')).remove().draw();
        })
        .catch((error) => {
          console.log(error);
        });
      }
    });
  })
  .catch((error) => {
    console.log(error);
  });
}

function setPracticeTestTable() {
  let tableData = [];
  const leadsCollectionQuery = query(collection(db, "Leads"), where('type', '==', 'ACT-practiceTest'));
  getDocs(leadsCollectionQuery)
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let errorData = {
        docUID : doc.id,
        Email : data.email,
        Time: new Time(data.timestamp.toDate()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}'),
        Page : data.page,
        Type : data.type,
      }
      tableData.push(errorData);
    });

    let leadsTable = $('#practice-table').DataTable({
      data: tableData,
      columns: [
        { data: 'Email' },
        { data: 'Time' },
        { data: 'Page'},
        { data: 'Type' },
      ],
      "autoWidth": false,
      "pageLength" : 10,
    });

    $('#practice-table tbody').on('click', 'tr', (event) => {
      const row = leadsTable.row(event.target).index();
      let docUID = tableData[row].docUID;
      window.open(`../test-taker/${docUID}`, '_blank')
    });
  })
  .catch((error) => {
    console.log(error);
  });
}

function setUnsubscribeTable() {
  let tableData = [];
  const unsubscribeCollectionRef = collection(db, "Unsubscribe");
  getDocs(unsubscribeCollectionRef)
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let unsubscribeData = {
        docUID : doc.id,
        Email : data.email,
        Time: new Time(data.createdAt.toDate()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}'),
      }
      tableData.push(unsubscribeData);
    });

    let unsubscribeTable = $('#unsubscribe-table').DataTable({
      data: tableData,
      columns: [
        { data: 'Email' },
        { data: 'Time' },
      ],
      "autoWidth": false,
      "pageLength" : 10,
    });
  })
  .catch((error) => {
    console.log(error);
  });
}

function setErrorTable() {
  let tableData = [];
  const errorCollectionRef = collection(db, "Error-Reports");
  getDocs(errorCollectionRef)
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let errorData = {
        docUID : doc.id,
        Message : data["Message"],
        Time: new Time(data.Timestamp.toDate()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}'),
        URL : data["URL"],
        Line : data["Line"],
        Column : data["Column"],
        User : data["User"],
        UserMessage : data["UserMessage"],
        Error : data["Error"]
      }
      tableData.push(errorData);
    });

    let errorTable = $('#error-table').DataTable({
      data: tableData,
      columns: [
        { data: 'Message' },
        { data: 'Time' },
        { data: 'URL'},
        { data: 'Line' },
        { data: 'Column' },
        { data: 'User' },
        { data: 'UserMessage' },
        { data: 'Error' },
      ],
      "autoWidth": false,
      "pageLength" : 10,
    });

    $('#error-table tbody').on('dblclick', 'tr', (event) => {
      const row = errorTable.row(event.target).index();
      let docUID = tableData[row].docUID;
      let confirmation = confirm("Are you sure you want to delete this error?\nThis action cannot be undone!");
      if (confirmation) {
        const errorDocRef = doc(db, "Error-Reports", docUID);
        deleteDoc(errorDocRef)
        .then(() => {
          //update the tableData array
          tableData.splice(row, 1);
          //remove the row (parent) that was clicked
          errorTable.row($(event.target).parents('tr')).remove().draw();
        })
        .catch((error) => {
          console.log(error);
        });
      }
    });
  })
  .catch((error) => {
    console.log(error);
  });
}

function setFeedbackTable() {
  let tableData = [];
  const feedbackCollectionRef = collection(db, "Feedback")
  getDocs(feedbackCollectionRef)
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let feedbackData = {
        docUID : doc.id,
        feedback : data.message,
        time : new Time(data.time.toDate().getTime()).toFormat('{EEE} {M}/{d}/{yy}, {hh}:{mm} {a}'),
        type: data.type,
        user : data.user,
      }
      tableData.push(feedbackData);
    });

    let feedbackTable = $('#feedback-table').DataTable({
      data: tableData,
      columns: [
        { data: 'type' },
        { data: 'feedback' },
        { data: 'time' },
        { data: 'user' },
      ],
      "autoWidth": false,
      "pageLength" : 10,
    });

    $('#feedback-table tbody').on('dblclick', 'tr', (event) => {
      const row = feedbackTable.row(event.target).index();
      let docUID = tableData[row].docUID;
      let confirmation = confirm("Are you sure you want to delete this feedback?\nThis action cannot be undone!");
      if (confirmation) {
        const feedbackDocRef = doc(db, "Feedback", docUID)
        deleteDoc(feedbackDocRef)
        .then(() => {
          //update the tableData array
          tableData.splice(row, 1);
          //remove the row (parent) that was clicked
          feedbackTable.row($(event.target).parents('tr')).remove().draw();
        })
        .catch((error) => {
          console.log(error);
        });
      }
    });

    $('#feedback-table tbody').on('click', 'tr', (event) => {
      const row = feedbackTable.row(event.target).index();
      let rowData = tableData[row];
      let user = rowData.user;

      getDoc(doc(db, "Users", user))
      .then(doc => {
        const data = doc.data()
        const dataStr = JSON.stringify(data, null, 2)

        const pretty = syntaxHighlight(dataStr);
        const message = document.createElement('pre');
        message.innerHTML = pretty;

        Dialog.alert(message, {
          backgroundColor: '#1E1E1E',
          choiceColor: '#F8F8F8',
          choicesBorderTop: '1px solid #414141'
        });
      })
    });
  })
  .catch((error) => {
    console.log(error);
  });
}

function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'number';
      if (/^"/.test(match)) {
          if (/:$/.test(match)) {
              cls = 'key';
          } else {
              cls = 'string';
          }
      } else if (/true|false/.test(match)) {
          cls = 'boolean';
      } else if (/null/.test(match)) {
          cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
  });
}