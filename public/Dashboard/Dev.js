setErrorTable();
setFeedbackTable();

function setErrorTable() {
  let tableData = [];
  const errorCollectionRef = firebase.firestore().collection("Error-Reports");
  errorCollectionRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let errorData = {
        docUID : doc.id,
        Message : data["Message"],
        Time : convertFromDateInt(parseInt(data["Timestamp"]))["longDate"],
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
        const errorDocRef = firebase.firestore().collection("Error-Reports").doc(docUID);
        errorDocRef.delete()
        .then(() => {
          //update the tableData array
          tableData.splice(row, 1);
          //remove the row (parent) that was clicked
          errorTable.row($(event.target).parents('tr')).remove().draw();
        })
        .catch((error) => {
          handleFirebaseErrors(error, window.location.href);
          console.log(error);
        });
      }
    });
  })
  .catch((error) => {
    handleFirebaseErrors(error, window.location.href);
    console.log(error);
  });
}

function setFeedbackTable() {
  let tableData = [];
  const feedbackCollectionRef = firebase.firestore().collection("Feedback");
  feedbackCollectionRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let feedbackData = {
        docUID : doc.id,
        feedback : data["feedback"],
        time : convertFromDateInt(parseInt(data["timestamp"]))["longDate"],
        user : data["user"],
      }
      tableData.push(feedbackData);
    });

    let feedbackTable = $('#feedback-table').DataTable({
      data: tableData,
      columns: [
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
        const feedbackDocRef = firebase.firestore().collection("Feedback").doc(docUID);
        feedbackDocRef.delete()
        .then(() => {
          //update the tableData array
          tableData.splice(row, 1);
          //remove the row (parent) that was clicked
          feedbackTable.row($(event.target).parents('tr')).remove().draw();
        })
        .catch((error) => {
          handleFirebaseErrors(error, window.location.href);
          console.log(error);
        });
      }
    });
  })
  .catch((error) => {
    handleFirebaseErrors(error, window.location.href);
    console.log(error);
  });
}