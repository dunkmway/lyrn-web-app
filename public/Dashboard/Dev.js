setLeadsTable();
setPracticeTestTable();
setUnsubscribeTable();
setErrorTable();
setFeedbackTable();

function setLeadsTable() {
  let tableData = [];
  const leadsCollectionRef = firebase.firestore().collection("Leads");
  leadsCollectionRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let errorData = {
        docUID : doc.id,
        Email : data.email,
        Time : convertFromDateInt(data.timestamp.toDate().getTime()).fullCalendar,
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
        const leadsDocRef = firebase.firestore().collection("Leads").doc(docUID);
        leadsDocRef.delete()
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
  const leadsCollectionRef = firebase.firestore().collection("Leads").where('type', '==', 'ACT-practiceTest');
  leadsCollectionRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let errorData = {
        docUID : doc.id,
        Email : data.email,
        Time : convertFromDateInt(data.timestamp.toDate().getTime()).fullCalendar,
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
  const unsubscribeCollectionRef = firebase.firestore().collection("Unsubscribe");
  unsubscribeCollectionRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let unsubscribeData = {
        docUID : doc.id,
        Email : data.email,
        Time : convertFromDateInt(data.createdAt.toDate().getTime()).fullCalendar,
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
  const errorCollectionRef = firebase.firestore().collection("Error-Reports");
  errorCollectionRef.get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let errorData = {
        docUID : doc.id,
        Message : data["Message"],
        Time : convertFromDateInt(parseInt(data["Timestamp"]))["fullCalendar"],
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
        time : convertFromDateInt(parseInt(data["timestamp"]))["fullCalendar"],
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

function createLocation() {
  document.getElementById("spinnyBoiLocation").style.display = "block";
  document.getElementById("locationErrMsg").textContent = null;
  let locationName = document.getElementById("locationName")

  if (locationName) {
    let locationRef = firebase.firestore().collection("Locations").doc();
    locationRef.set({
      locationName: locationName.value.trim(),
      lessonTypes: [
        {
          name: 'Comprehensive ACT',
          price: 90,
          value: 'actComprehensive',
          subtypes: [
            {
              name: 'English',
              value: 'english'
            },
            {
              name: 'Math',
              value: 'math'
            },
            {
              name: 'Reading',
              value: 'reading'
            },
            {
              name: 'Science',
              value: 'science'
            },
          ]
        },
        {
          name: 'ACT Fundamentals',
          price: 70,
          value: 'actFundamentals',
          subtypes: [
            {
              name: 'English',
              value: 'english'
            },
            {
              name: 'Math',
              value: 'math'
            },
            {
              name: 'Reading',
              value: 'reading'
            },
            {
              name: 'Science',
              value: 'science'
            },
          ]
        },
        {
          name: 'AP Exam',
          price: 60,
          value: 'apExam'
        },
        {
          name: 'Subject Tutoring',
          price: 30,
          value: 'subjectTutoring',
          subtypes: [
            {
              name: 'English',
              value: 'english'
            },
            {
              name: 'Math',
              value: 'math'
            },
            {
              name: 'Physics',
              value: 'physics'
            },
            {
              name: 'Chemistry',
              value: 'chemistry'
            },
            {
              name: 'Biology',
              value: 'biology'
            },
            {
              name: 'History',
              value: 'history'
            },
            {
              name: 'Spanish',
              value: 'spanish'
            },
            {
              name: 'French',
              value: 'french'
            },
          ]
        },
        {
          name: 'ACT Basics',
          price: 75,
          value: 'actBasics',
          subtypes: [
            {
              name: 'English',
              value: 'english'
            },
            {
              name: 'Math',
              value: 'math'
            },
            {
              name: 'Reading',
              value: 'reading'
            },
            {
              name: 'Science',
              value: 'science'
            },
          ]
        },
        {
          name: 'Guided ACT',
          price: 75,
          value: 'actGuided',
          subtypes: [
            {
              name: 'English',
              value: 'english'
            },
            {
              name: 'Math',
              value: 'math'
            },
            {
              name: 'Reading',
              value: 'reading'
            },
            {
              name: 'Science',
              value: 'science'
            },
          ]
        },
      ]
    })
    .then(() => {
      document.getElementById("spinnyBoiLocation").style.display = "none";
      closeModal("location", true);
    })
    .catch((error) => {
      handleFirebaseErrors(error, window.location.href);
      document.getElementById("locationErrMsg").textContent = error.message;
      document.getElementById("spinnyBoiLocation").style.display = "none";
    })
  }
  else {
    document.getElementById("spinnyBoiLocation").style.display = "none";
  }
}

function openModal(type) {
  document.getElementById("add-" + type + "-section").style.display = "flex";
}

function closeModal(type, submitted = false) {
  let allInputs = document.getElementById("add-" + type + "-section").querySelectorAll("input, select");
  let allClear = true;
  for(let i = 0; i < allInputs.length; i++) {
    if (allInputs[i].value != "") {
      allClear = false;
      break;
    }
  }

  if (!allClear && !submitted) {
    let confirmation = confirm("This " + type + " has not been saved.\nAre you sure you want to go back?");
    if (confirmation) {
      for(let i = 0; i < allInputs.length; i++) {
        allInputs[i].value = "";
      }
      document.getElementById("add-" + type + "-section").style.display = "none";
      let errorMessages = document.querySelectorAll("p[id$='ErrorMessage']");

      for (let err = errorMessages.length - 1; err >= 0; err--) {
        errorMessages[err].remove()
      }
    }
  }
  else {
    for(let i = 0; i < allInputs.length; i++) {
      allInputs[i].value = "";
    }
    document.getElementById("add-" + type + "-section").style.display = "none";
    let errorMessages = document.querySelectorAll("p[id$='ErrorMessage']");

    for (let err = errorMessages.length - 1; err >= 0; err--) {
      errorMessages[err].remove()
    }
  }
}


async function test() {
  const MARKETING_TEST_CODE = '76C';
  const SECTION_TIMES = {
    english: 1000 * 60 * 60 * 45,
    math: 1000 * 60 * 60 * 60,
    reading: 1000 * 60 * 60 * 35,
    science: 1000 * 60 * 60 * 35
  }

  const marketingTest = (await firebase.firestore()
  .collection('ACT-Test-Data')
  .where('code', '==', MARKETING_TEST_CODE)
  .limit(1)
  .get())
  .docs[0];

  console.log(marketingTest.data())

  const marketingSections = (await firebase.firestore()
  .collection('ACT-Section-Data')
  .where('test', '==', marketingTest.id)
  .get()).docs
  .sort((a,b) => a.data().code < b.data().code ? -1 : a.data().code > b.data().code ? 1 : 0);

  console.log(marketingSections.map(doc => doc.data()))

  const marketingQuestions = await Promise.all(marketingSections.map(async (section) => {
    return (await firebase.firestore()
    .collection('ACT-Question-Data')
    .where('test', '==', marketingTest.id)
    .where('section', '==', section.id)
    .get()).docs
    .sort((a,b) => a.data().code - b.data().code)
    .map(doc => doc.id);
  }))

  console.log(marketingQuestions)

  // set a new assignment for the lead
  // this is so the assignments come in the proper order in the test taker
  const now = new Date();

  await Promise.all(marketingSections.map((sectionDoc, index) => {
    // firebase.firestore().collection('ACT-Assignments').doc().set({
    //   open: new Date(new Date(now).setMilliseconds(now.getMilliseconds() + index)),
    //   close: new Date(new Date(now).setFullYear(time0.getFullYear() + 1)),
    //   questions: marketingQuestions[index],
    //   scaledScoreSection: sectionDoc.id,
    //   sectionCode: sectionDoc.data().code,
    //   status: 'new',
    //   student: ref.id,
    //   time: SECTION_TIMES[sectionDoc.data().code],
    //   type: 'marketing'
    // })

    console.log({
      open: new Date(new Date(now).setMilliseconds(now.getMilliseconds() + index)),
      close: new Date(new Date(now).setFullYear(now.getFullYear() + 1)),
      questions: marketingQuestions[index],
      scaledScoreSection: sectionDoc.id,
      sectionCode: sectionDoc.data().code,
      status: 'new',
      student: 'studentUID',
      time: SECTION_TIMES[sectionDoc.data().code],
      type: 'marketing'
    })
  }))
}