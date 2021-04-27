setErrorTable();

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
      // "scrollY": "400px",
      // "scrollCollapse": true,
      // "paging": false,
      "autoWidth": false,
      "pageLength" : 10,
    });

    $('#error-table tbody').on('click', 'tr', (event) => {
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
          handleFirebaseErrors(error, document.currentScript.src);
          console.log(error);
        });
      }
    });
  })
  .catch((error) => {
    handleFirebaseErrors(error, document.currentScript.src);
    console.log(error);
  });
}