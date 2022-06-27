const FLAG_SVG = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
viewBox="0 0 512 512" xml:space="preserve">
<g id="XMLID_1_">
<path id="XMLID_4_" class="flag" d="M378.3,35.7c0,0-84.9,40.9-170.6,11C114.9,14.5,73.2,27,33.1,75.8c-7.1-3.9-15.7-3.9-22.8,0
 C0.1,82.1-3.1,96.2,3.2,106.5l225.7,366.4c3.9,7.1,11.8,10.2,18.9,10.2c3.9,0,7.9-0.8,11.8-3.1c10.2-6.3,13.4-20.4,7.1-30.7
 l-99.1-162c39.3-48,81.8-61.3,173.8-29.1c84.9,29.9,170.6-11,170.6-11L378.3,35.7z"/>
</g>
</svg>`
const CHECK_SVG = `<svg viewBox="0 0 12 12" width="10px" height="10px" xmlns="http://www.w3.org/2000/svg">
<polygon points="4.172 9.2 10.966 0 12 1.4 4.172 12 0 6.35 1.034 4.95" style=""/>
</svg>`
const CROSS_SVG = `<svg viewBox="0 0 12 12" width="10px" height="10px" xmlns="http://www.w3.org/2000/svg">
<g transform="matrix(0.005703, 0, 0, 0.005876, -0.000137, 9.355989)" style="">
  <polygon points="2104.135 -1434.151 1941.478 -1592.342 1052.117 -729.182 162.83 -1592.342 0.024 -1434.223 889.311 -571.172 0.024 291.879 162.83 449.998 1052.117 -413.239 1941.478 449.998 2104.135 291.807 1214.96 -571.172"/>
</g>
</svg>`

const ODD_ANSWERS = ['A', 'B', 'C', 'D', 'E'];
const EVEN_ANSWERS = ['F', 'G', 'H', 'J', 'K'];
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const SECTION_NAMES = ['english_directions', 'english','math_directions', 'math', 'break_directions','reading_directions', 'reading', 'science_directions', 'science'];
const QUESTION_COUNT = {
  english: 75,
  math: 60,
  reading: 40,
  science: 40
}
const SECTION_TIME = {
  english_directions: 1,
  english: 45,
  math_directions: 1,
  math: 60,
  break_directions: 10,
  reading_directions: 1,
  reading: 35,
  science_directions: 1,
  science: 35,
  all: 189
}
const DIRECTION_TIME = 1;
const SECTION_CULMATIVE_START_TIME = { // this takes into account the breaks
  english_directions: 0,
  english: 1,
  math_directions: 46,
  math: 47,
  break_directions: 107,
  reading_directions: 117,
  reading: 118,
  science_directions: 153,
  science: 154
}
const MINIMUM_START_BUFFER = 5; // number of minutes an assignment must be started before the required time to take (35 minute section + buffer before lesson starts)
const MODE_VIEWS = {
  default: 'landing',
  section: 'main',
  worksheet: 'main',
  daily: 'main',
  all: 'full-length-landing',
  review: 'main',
}
const ACT_PROGRAMS = ['actBasics', 'actGuided', 'actFundamentals', 'actComprehensive'];

const CURRENT_STUDENT_UID = queryStrings().student;

let currentUser = null;
let currentUserRole = null;

let current_data = {
  mode: 'default',
  test: null,
  section: null,
  passage: null,
  question: null,
  assignment: null
}

async function initialSetup() {
  changeMode('default');
  initializeAssignmentsSnapshot(CURRENT_STUDENT_UID);
  setCurrentUser();
  try {
    await setLandingPage(CURRENT_STUDENT_UID);
  }
  catch (error) {
    console.log(error)
  }
}

initialSetup();

function setCurrentUser() {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      const idTokenResult = await user.getIdTokenResult()
      const role = idTokenResult.claims.role

      currentUser = user;
      currentUserRole = role;
    }
  })
}


/**
 * change the css variable --accent-color to the variable --${sectionName}-color
 * @param {String} sectionName name of section
 */
function changeAccentColor(sectionName) {
  document.querySelector(':root').style.setProperty('--accent-color', `var(--${sectionName}-color)`)
}

/**
 * change the css variable --passage-columns to the variable --${sectionName}-passage-columns
 * @param {String} sectionName name of section
 */
function changePassageColumns(sectionName) {
  document.querySelector(':root').style.setProperty('--passage-columns', `var(--${sectionName}-passage-columns)`)
}

function changeMode(mode) {
  // hide the previous view
  document.querySelector(`section.${MODE_VIEWS[current_data.mode]}`).classList.add('hide')
  //show the corresponding view
  document.querySelector(`section.${MODE_VIEWS[mode]}`).classList.remove('hide')

  //change the current_data.mode
  current_data.mode = mode;
}


/*
* Landing Page
*/

function renderStudentDetails(studentData) {
  const studentNameElement = document.getElementById('studentName');
  studentNameElement.textContent = studentData.firstName + ' ' + studentData.lastName;
}

function renderNextLessonDetails(lessonData) {
  const nextLessonWrapper = document.querySelector('.next-lesson-wrapper');
  const nextLessonElement = document.getElementById('nextLessonDetails');

  if (!lessonData) {
    nextLessonElement.innerHTML = 'Need to increase you ACT score? Check out our <a href="/pricing" target="_blank">ACT programs.</a>'
    return;
  }

  nextLessonWrapper.style.backgroundColor = `var(--${lessonData.subtype}-color)`;
  nextLessonElement.textContent = `Your next lesson is ${lessonData.subtype.toUpperCase()} - ${convertFromDateInt(lessonData.start).longReadable}`;
}

function renderSectionAssignment(assignmentData) {
  const sectionAssignmentList = document.getElementById('sectionAssignmentList');

  const assignmentElement = document.createElement('div');
  assignmentElement.classList.add('assignment', 'box');
  if (assignmentData) {
    assignmentElement.addEventListener('click', () => sectionAssignmentClickCallback(assignmentData))
    assignmentElement.style.backgroundColor = `var(--${assignmentData.section}-color)`
    assignmentElement.innerHTML = `
      <h4>${assignmentData.section.toUpperCase()}</h4>
      <div class="status">${assignmentData.status}</div>
    `
  }
  else {
    assignmentElement.style.backgroundColor = `var(--default-color)`
    assignmentElement.style.cursor = 'default';
    assignmentElement.innerHTML = `
      <h4>Hooray, no homework!</h4>
    `
  }

  sectionAssignmentList.appendChild(assignmentElement);
}

function renderPreviousAssignment(assignmentData) {
  const previousAssignmentList = document.getElementById('previousAssignmentList');

  const assignmentElement = document.createElement('div');
  assignmentElement.classList.add('assignment', 'box');
  if (assignmentData) {
    assignmentElement.style.backgroundColor = `var(--${assignmentData.section}-color)`
    if (assignmentData.section != 'all') {
      assignmentElement.addEventListener('click', () => previousAssignmentClickCallback(assignmentData))
    }
    assignmentElement.innerHTML = `
      <h4>${assignmentData.section.toUpperCase()}</h4>
      <div class="status">${assignmentData.scaledScore}</div>
    `

    const sections = ['english', 'math', 'reading', 'science'];
    if (assignmentData.section == 'all' && assignmentData.scaledScore != 'Not yet graded') {
      const subsection = document.createElement('div');
      subsection.classList.add('subsections');

      sections.forEach(sectionName => {
        const sectionElem = document.createElement('div');
        sectionElem.classList.add(`${sectionName}-background`)
        sectionElem.textContent = `${sectionName.charAt(0).toUpperCase()} : ${assignmentData.sectionAssignments.find(section => section.section == sectionName).scaledScore}`;
        sectionElem.addEventListener('click', () => previousAssignmentClickCallback(assignmentData.sectionAssignments.find(section => section.section == sectionName)));
        subsection.appendChild(sectionElem);
      })
      assignmentElement.appendChild(subsection);
    }
  }
  else {
    assignmentElement.style.backgroundColor = `var(--default-color)`
    assignmentElement.style.cursor = 'default';
    assignmentElement.innerHTML = `
      <h4>You haven't submitted any assignments yet</h4>
    `
  }

  previousAssignmentList.appendChild(assignmentElement);
}

function renderDailyAssignment(assignmentData) {
  const dailyAssignmentList = document.getElementById('dailyAssignmentList');

  const assignmentElement = document.createElement('div');
  assignmentElement.classList.add('assignment', 'box');
  if (assignmentData) {
    assignmentElement.addEventListener('click', () => dailyAssignmentClickCallback(assignmentData))
    assignmentElement.style.backgroundColor = `var(--${assignmentData.section}-color)`
    assignmentElement.innerHTML = `
      <h4>${assignmentData.section.toUpperCase()}</h4>
      <div class="status">${assignmentData.status}</div>
    `
  }
  else {
    assignmentElement.style.backgroundColor = `var(--default-color)`
    assignmentElement.innerHTML = `
      <h4>Hooray, no daily!</h4>
    `
  }

  dailyAssignmentList.appendChild(assignmentElement);
}

function sectionAssignmentClickCallback(assignmentData) {
  console.log(assignmentData)
  switch (assignmentData.status) {
    case 'new':
      customConfirm(
        `
        <h4>Important to know before starting</h4>
        <p> 
          This test will take <b>${SECTION_TIME[assignmentData.section]} minutes</b> to complete. 
          Once you start this test, you will <b>not</b> be able to pause until the entire assignment is complete.
          If you leave the page before the test is submitted, you may return to the test but the time will continue to count down while you are away.
        </p>
        <h4>Directions for the interface</h4>
        <ul>
          <li>You can flag question for review by clicking the circle above the question. </li>
          <li>You can see which questions have been answered or flagged by opening up the tab on the left side as well as see the time remaining for the current section.</li>
          <li>The test will automatically be submitted when time runs out.</li>
          <li>You will not have the ability to submit the test early.</li>
          <li>We highly recommend using the entire time allotted even if you finish early.</li>
        </ul>
        <p>
          Are you ready to start this assignment?
        </p>`,
        'NO',
        'YES',
        () => {},
        () => { beginSectionAssignment(assignmentData) }
      )
      break;
    case 'started':
      resumeSectionAssigment(assignmentData);
      break;
    default:
      alert('We are having issues with this assigment. Please try again and if the issue continues please contact us.')
  }

}

function previousAssignmentClickCallback(assignmentData) {
  console.log(assignmentData)
  if (assignmentData.scaledScore == 'Not yet graded') {
    customConfirm(
      `This test hasn't finished being graded. It should take a few more seconds.`,
      '',
      '',
      () => {},
      () => {}
    )
  }
  else if (assignmentData.section == 'all') {
    // do nothing because we don't review 'all' sections;
  }
  else if (assignmentData.status == 'graded'){
    current_data.assignment = assignmentData.assignment;
    console.log(current_data)
    changeMode('review');
    setPreviousSection(assignmentData)
  }
  else {
    alert('We are having issues with this assigment. Please try again and if the issue continues please contact us.')
  }
}

async function beginSectionAssignment(assignmentData) {
  // FIXME: this information should be determined before this point
  // // decide which section should be assigned
  // const overviewDoc = await getStudentProgramOverview(assignmentData.student);
  // const overview = overviewDoc.data();
  // const completedTests = overview.completedSectionTests?.[assignmentData.section];
  // const sectionTests = overview.sectionTests;

  // //find the oldest section test that hasn't been completed yet
  // let nextTestID;
  // if (completedTests) {
  //   for (let i = sectionTests.length - 1; i >= 0; i--) {
  //     if (!completedTests.includes(sectionTests[i])) {
  //       nextTestID = sectionTests[i];
  //       break;
  //     }
  //   }
  // }
  // else {
  //   nextTestID = sectionTests[sectionTests.length - 1];
  // }

  // // create the assignment doc
  // let assignmentID = await addSectionAssignment({
  //   status: 'started',
  //   program: 'fundamentals',
  //   lesson: assignmentData.lesson,
  //   section: assignmentData.section,
  //   student: assignmentData.student,
  //   test: nextTestID,
  //   startedAt: firebase.firestore.FieldValue.serverTimestamp()
  // });

  // current_data.assignment = assignmentID;

  // assignmentData.assignment = assignmentID;
  // assignmentData.status = 'started';
  // assignmentData.program = 'fundamentals';
  // assignmentData.test = nextTestID;
  // assignmentData.startedAt = null;

  // if the assignment section is all then we need to create all of the other assignemnts
  if (assignmentData.section == 'all') {
    const sectionAssignmentData = [];
    await Promise.all(SECTION_NAMES.map(async (section) => {
      const data = {
        close: new Date(0), // impossible open and close so that this assignment never appears in the ui
        open: new Date(0),
        allAssignment: assignmentData.assignment,
        program: assignmentData.program,
        section,
        status: 'started',
        student: assignmentData.student,
        test: assignmentData.test,
        startedAt: new Date(new Date().setMinutes(new Date().getMinutes() + SECTION_CULMATIVE_START_TIME[section]))
      }
      data.assignment = await addSectionAssignment(data);
      sectionAssignmentData.push(data);
      return;
    }))

    // update the 'all' assignment to include these section assignments
    await firebase.firestore().collection('Section-Assignments').doc(assignmentData.assignment).update({
      sectionAssignments: sectionAssignmentData.map(data => data.assignment),
      startedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'started'
    })

    //update the local 'all' assignment data
    assignmentData.sectionAssignments = sectionAssignmentData.map(data => data.assignment);
    assignmentData.startedAt = new Date();
    assignmentData.status = 'started';
    current_data.allAssignment = assignmentData;
    current_data.sectionAssignments = sectionAssignmentData;


    current_data.assignment = sectionAssignmentData[0].assignment;

    changeMode('section');
    await setSectionDirections(sectionAssignmentData[0])
  }
  else {
    current_data.assignment = assignmentData.assignment;
    //assignmentData.startedAt will be handled properly by not setting it

    // start the section
    changeMode('section');
    await setSection(assignmentData);
  }
}

async function resumeSectionAssigment(assignmentData) {
  if (assignmentData.section == 'all') {
    // get all of the section assignments connected to this all
    const sectionAssignmentDocs = await Promise.all(assignmentData.sectionAssignments.map(id => {
      return firebase.firestore().collection('Section-Assignments').doc(id).get();
    }))

    const sectionAssignments = sectionAssignmentDocs
    .filter(doc => doc.exists) // once the direction docs are submitted they are deleted
    .map(doc => {
      return {
        ...doc.data(),
        assignment: doc.id
      }
    }).sort((a, b) => a.startedAt.toDate().getTime() - b.startedAt.toDate().getTime());

    // convert all of the firebase dates to js dates
    for (let i = 0; i < sectionAssignments.length; i++) {
      sectionAssignments[i].startedAt = sectionAssignments[i].startedAt.toDate()
    }
    console.log(sectionAssignments)

    current_data.allAssignment = assignmentData;
    current_data.sectionAssignments = sectionAssignments;

    //determine the next section to take
    for (let i = 0; i < sectionAssignments.length; i++) {
      if (sectionAssignments[i].status != 'submitted' && sectionAssignments[i].status != 'graded') { // we skip over the submitted and graded sections
        if (sectionAssignments[i].section.split('_')[1] == 'directions') {
          // if the section is a direction section
          current_data.assignment = sectionAssignments[i].assignment
          changeMode('section');
          await setSectionDirections(sectionAssignments[i]);
          return
        }
        else {
          // else the section is a non direction so jump right in
          current_data.assignment = sectionAssignments[i].assignment
          changeMode('section');
          await setSection(sectionAssignments[i]);
          return
        }
      }
    }
    // if we have gotten through the entire loop then submit the assignment
    await submitSectionAssignment(assignmentData.assignment);
    changeMode('default');
    await setLandingPage(CURRENT_STUDENT_UID);
  }
  else {
    //convert firebase startAt date
    assignmentData.startedAt = assignmentData.startedAt.toDate();
    current_data.assignment = assignmentData.assignment;
    changeMode('section');
    await setSection(assignmentData)
  }
}

function dailyAssignmentClickCallback(assignmentData) {
  console.log(assignmentData)
}

async function getStudentDoc(studentUID) {
  const studentDoc = await firebase.firestore().collection('Users').doc(studentUID).get();
  return studentDoc;
}

async function getStudentProgramOverview(studentUID) {
  const overviewDoc = await firebase.firestore().collection('Users').doc(studentUID).collection('ACT-Fundamentals').doc('overview').get();
  return overviewDoc;
}

async function getTestDoc(testID) {
  const testDoc = await firebase.firestore().collection('ACT-Tests').doc(testID).get();
  return testDoc;
}

async function getNextLesson(studentUID) {
  const eventQuery = await firebase.firestore().collection('Events')
  .where('student', '==', studentUID)
  .where('type', 'in', ACT_PROGRAMS)
  .where('start', '>', new Date().getTime())
  .orderBy('start', 'asc')
  .limit(1)
  .get();

  return eventQuery.docs[0];
}

async function getPreviousLesson(studentUID) {
  const eventQuery = await firebase.firestore().collection('Events')
  .where('student', '==', studentUID)
  .where('type', 'in', ACT_PROGRAMS)
  .where('start', '<=', new Date().getTime())
  .orderBy('start', 'desc')
  .limit(1)
  .get();

  return eventQuery.docs[0];
}

function isInLesson(previousLessonData) {
  return previousLessonData ? (previousLessonData.start <= new Date().getTime() && previousLessonData.end >= new Date().getTime()) : false
}

async function getLessonsWithinRange(start, end, studentUID) {
  const eventQuery = await firebase.firestore().collection('Events')
  .where('student', '==', studentUID)
  .where('type', 'in', ACT_PROGRAMS)
  .where('start', '>=', start)
  .where('start', '<=', end)
  .orderBy('start', 'asc')
  .get();

  return eventQuery.docs;
}

async function getLessonSectionAssignment(lessonID) {
  const sectionAssignmentQuery = await firebase.firestore().collection('Section-Assignments')
  .where('lesson', '==', lessonID)
  .limit(1)
  .get();

  return sectionAssignmentQuery.docs[0];
}

async function addSectionAssignment(assignmentData) {
  const assignmentRef = firebase.firestore().collection('Section-Assignments').doc();
  await assignmentRef.set(assignmentData);
  return assignmentRef.id;
}

async function submitSectionAssignment(assignmentID) {
  const assignmentDoc = await firebase.firestore().collection('Section-Assignments').doc(assignmentID).update({ status: 'submitted' });
  return assignmentDoc;
}

async function getLessonDailyAssignment(lessonID) {
  const dailyAssignmentQuery = await firebase.firestore().collection('Daily-Assignments')
  .where('lesson', '==', lessonID)
  .limit(1)
  .get();

  return dailyAssignmentQuery.docs[0];
}

async function generateDailyAssignments(studentUID) {
  // daily assignments are given for yesterday's lesson and last week's lesson
  // each is given 2 days to complete
  let dailyAssignments = [];

  // get the date ranges for the lessons that we want to check daily assignments for
  const now = new Date();
  const beginningToday = new Date(now).setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(beginningToday).setDate(new Date(beginningToday).getDate() - (7 + 2));
  const lastWeekEnd = new Date(lastWeekStart).setDate(new Date(lastWeekStart).getDate() + 2);
  const yesterdayStart = new Date(beginningToday).setDate(new Date(beginningToday).getDate() - 2);
  const yesterdayEnd = new Date(now).getTime();

  // get the event docs that correspond to daily assignments
  const lastWeekDocs = await getLessonsWithinRange(lastWeekStart, lastWeekEnd, studentUID);
  const yesterdayDocs = await getLessonsWithinRange(yesterdayStart, yesterdayEnd, studentUID);

  const allLessonDocs = [...lastWeekDocs, ...yesterdayDocs]

  // check if the student has already done a daily for these lessons
  await Promise.all(allLessonDocs.map(async (lesson) => {
    const lessonDailyAssignment = await getLessonDailyAssignment(lesson.id);
    
    if (lessonDailyAssignment) {
      if (lessonDailyAssignment.data().status == 'started') {
        let data = lessonDailyAssignment.data()
        data.assignment = lessonDailyAssignment.id;
        dailyAssignments.push(data);
      }
    }
    else {
      dailyAssignments.push({
        status: 'new',
        lesson: lesson.id,
        assignment: null,
        section: lesson.data().subtype,
        student: studentUID
      })
    }
  }))

  return dailyAssignments;
}

async function generateSectionAssignment(studentUID) {
  // the section assignment is homework due for the next lesson
  // there can only be one

  // get the next lesson
  const nextLessonDoc = await getNextLesson(studentUID);
  if (!nextLessonDoc) { return null }
  
  // check if there is a section assignment already connected to the next lesson
  const nextLessonSectionAssignment = await getLessonSectionAssignment(nextLessonDoc.id);

  //there is an section assignment already attached to the next lesson
  if (nextLessonSectionAssignment) {
    if (nextLessonSectionAssignment.data().status != 'started') { return null }
    // check if the homework should be submitted
    const assignmentSection = nextLessonSectionAssignment.data().section;
    const assignmentStart = nextLessonSectionAssignment.data().startedAt.toDate();
    const assignmentEnd = new Date(assignmentStart.setMinutes(assignmentStart.getMinutes() + SECTION_TIME[assignmentSection]));

    if (assignmentEnd.getTime() <= new Date().getTime()) {
      await submitSectionAssignment(nextLessonSectionAssignment.id);
      return null;
    }
    let data = nextLessonSectionAssignment.data()
    data.assignment = nextLessonSectionAssignment.id;
    return data;
  }
  // no section assignemnt has been assigned to this lesson yet
  else {
    // check if the student has enough time to start this assignment before their lesson starts
    const assignmentSection = nextLessonDoc.data().subtype;
    const lessonStart = new Date(nextLessonDoc.data().start);
    const minimumStart = new Date(lessonStart.setMinutes(lessonStart.getMinutes() - (SECTION_TIME[assignmentSection] + MINIMUM_START_BUFFER)))
    if (minimumStart.getTime() <= new Date().getTime()) {
      // create the assignment in a incomplete state
      await addSectionAssignment({
        status: 'omitted',
        program: 'fundamentals',
        lesson: nextLessonDoc.id,
        section: assignmentSection,
        student: studentUID,
        test: null,
        startedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      return null;
    }
    return {
      status: 'new',
      lesson: nextLessonDoc.id,
      assignment: null,
      section: nextLessonDoc.data().subtype,
      student: studentUID
    }
  }
}

async function getSectionAssignments(studentUID) {
  // query the datebase for all assignments that are open right now
  const assignemntDocs = await firebase.firestore().collection('Section-Assignments')
  .where('status', 'in', ['new', 'started'])
  .where('student', '==', studentUID)
  .where('close', '>', new Date())
  .orderBy('close')
  .get()

  return assignemntDocs.docs;
}

async function getPreviousAssignments(studentUID) {
  console.log('getting previous assignments')
  // query the datebase for all assignments that are submitted or graded
  const assignemntDocs = await firebase.firestore().collection('Section-Assignments')
  .where('status', 'in', ['submitted', 'graded'])
  .where('student', '==', studentUID)
  .orderBy('open', 'desc')
  .get()

  return assignemntDocs.docs;
}

function initializeAssignmentsSnapshot(studentUID) {
  console.log('setting assignment snapshot')
  
  // they query is coming from the oldest assignment based on the close
  // this aligns with the current assignments
  firebase.firestore().collection('Section-Assignments')
  .where('status', 'in', ['new', 'started', 'submitted', 'graded'])
  .where('student', '==', studentUID)
  .orderBy('close')
  .onSnapshot((querySnapshot) => {
    // we need to separate the list into current and previous assignemnts
    let currentAssignments = [];
    let previousAssignments = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status == 'started') {
        currentAssignments.push({
          ...data,
          assignment: doc.id
        });
      }
      else if (data.status == 'new') {
        // filter out the current assignments that aren't open right now
        if (
          data.open.toDate().getTime() <= new Date().getTime() && 
          data.close.toDate().getTime() > new Date().getTime()
        ) {
          currentAssignments.push({
            ...data,
            assignment: doc.id
          });
        }
      }
      else {
        previousAssignments.push({
          ...data,
          assignment: doc.id
        })
      }
    })

    console.log({
      currentAssignments,
      previousAssignments
    })

    // we need to go through the previous assignments and connect the subsection assignments to the all assignemnt
    for (let i = 0; i < previousAssignments.length; i++) {
      // if the assignment is all we need to get the subsections as well
      if (previousAssignments[i].section == 'all') {
        const allSectionIDs = previousAssignments[i].sectionAssignments;

        const allSections = allSectionIDs.map(assignment => {
          return previousAssignments.find(assignmentData => assignmentData.assignment == assignment);
        })

        // make sure all of the subsections have been graded
        let isAllGraded = true;
        for (let j = 0; j < allSections.length; j++) {
          if (allSections[j].status != 'graded') {
            isAllGraded = false;
            break;
          }
        }

        let compositeSum = isAllGraded ? allSections.reduce((prev, curr) => prev + curr.scaledScore, 0) : 0;

        previousAssignments[i].scaledScore = Math.round(compositeSum / 4) ?? 'Not yet graded';
        previousAssignments[i].sectionAssignments = allSections;
      }
      else {
        previousAssignments[i].scaledScore = previousAssignments[i].scaledScore ?? 'Not yet graded';
      }
    }

    // we can now filter out the subsections
    // also sort the previous to be in most recent started to oldest
    previousAssignments = previousAssignments
    .filter(assignment => !assignment.allAssignment)
    .sort((a,b) => b.startedAt?.toDate()?.getTime() - a.startedAt?.toDate()?.getTime())

    // remove all the assignments
    removeAllChildNodes(document.getElementById('sectionAssignmentList'));
    removeAllChildNodes(document.getElementById('previousAssignmentList'));

    // render all of the assignments
    if (currentAssignments.length == 0) {
      renderSectionAssignment(null);
    }
    else {
      currentAssignments.forEach(currentAssignment => {
        renderSectionAssignment(currentAssignment);
      })
    }

    if (previousAssignments.length == 0) {
      renderPreviousAssignment(null);
    }
    else {
      previousAssignments.forEach(previousAssignment => {
        renderPreviousAssignment(previousAssignment);
      })
    }
  });

}

async function setLandingPage(studentUID) {
  changeAccentColor('default');
  current_data.assignment = null;
  current_data.allAssignment = null;
  current_data.sectionAssignments = null;
  current_data.test = null;
  current_data.section = null;
  current_data.passage = null;
  current_data.question = null;

  // get the next lesson and render it
  getNextLesson(studentUID)
  .then(nextLessonDoc => {
    renderNextLessonDetails(nextLessonDoc?.data())
  })

  // // remove all the assignments
  // removeAllChildNodes(document.getElementById('sectionAssignmentList'));
  // // removeAllChildNodes(document.getElementById('dailyAssignmentList'));
  // removeAllChildNodes(document.getElementById('previousAssignmentList'));
  // await Promise.all([
  //   // // get the student doc
  //   // getStudentDoc(studentUID)
  //   // .then(studentDoc => {
  //   //   renderStudentDetails(studentDoc.data())
  //   // }),
  //   // get the next lesson and render it
  //   getNextLesson(studentUID)
  //   .then(nextLessonDoc => {
  //     console.log(nextLessonDoc?.data())
  //     renderNextLessonDetails(nextLessonDoc?.data())
  //   }),

  //   // get all section assignments that are open
  //   getSectionAssignments(studentUID)
  //   .then(sectionAssignmentDocs => {
  //     // filter to the events that are open right now
  //     const sectionAssignments = sectionAssignmentDocs
  //     .map(doc => {
  //       return {
  //         ...doc.data(),
  //         assignment: doc.id
  //       }
  //     })
  //     .filter(assignment => assignment.open.toDate().getTime() <= new Date().getTime());

  //     console.log(sectionAssignments);

  //     if (sectionAssignments.length == 0) {
  //       renderSectionAssignment(null);
  //     }
  //     else {
  //       sectionAssignments.forEach(sectionAssignment => {
  //         renderSectionAssignment(sectionAssignment);
  //       })
  //     }
  //   }),

  //   getPreviousAssignments(studentUID)
  //   .then(async (previousAssignmentDocs) => {
  //     const previousAssignments = previousAssignmentDocs
  //     .map(doc => {
  //       return {
  //         ...doc.data(),
  //         assignment: doc.id
  //       }
  //     })
  //     .filter(assignment => !assignment.allAssignment) // filter out the subsections to an all assignment

  //     console.log(previousAssignments)
  //     if (previousAssignments.length == 0) {
  //       renderPreviousAssignment(null);
  //       return;
  //     }

  //     for (let i = 0; i < previousAssignments.length; i++) {
  //       // if the assignment is all we need to get the subsections as well
  //       if (previousAssignments[i].section == 'all') {
  //         const allSectionIDs = previousAssignments[i].sectionAssignments;

  //         const allSectionDocs = await Promise.all(allSectionIDs.map(id => {
  //           return firebase.firestore().collection('Section-Assignments').doc(id).get();
  //         }))
  //         const allSections = allSectionDocs.map(doc => {
  //           return {
  //             ...doc.data(),
  //             assignment: doc.id
  //           }
  //         });

  //         // make sure all of the subsections have been graded
  //         let isAllGraded = true;
  //         for (let j = 0; j < allSections.length; j++) {
  //           if (allSections[j].status != 'graded') {
  //             isAllGraded = false;
  //             break;
  //           }
  //         }

  //         let compositeSum = isAllGraded ? allSections.reduce((prev, curr) => prev + curr.scaledScore, 0) : 'Not yet graded';

  //         previousAssignments[i].scaledScore = Math.round(compositeSum / 4);
  //         previousAssignments[i].sectionAssignments = allSections;
  //       }
  //       else {
  //         previousAssignments[i].scaledScore = previousAssignments[i].scaledScore ?? 'Not yet graded';
  //       }

  //       renderPreviousAssignment(previousAssignments[i]);
  //     }
  //   })


  //   //get the daily assignments and render them
  //   //FIXME: put this functionality back eventually
  //   // generateDailyAssignments(studentUID)
  //   // .then(dailyAssignments => {
  //   //   if (dailyAssignments.length == 0) {
  //   //     renderDailyAssignment(null);
  //   //   }
  //   //   else {
  //   //     dailyAssignments.forEach(dailyAssignment => {
  //   //       renderDailyAssignment(dailyAssignment);
  //   //     })
  //   //   }
  //   // }),
  //   //get the section assignment and render it
  //   //FIXME: put this functionality back eventually
  //   // generateSectionAssignment(studentUID)
  //   // .then(sectionAssignment => {
  //   //   renderSectionAssignment(sectionAssignment)
  //   // })
  // ])
}

/*
* End Landing Page
*/



/**
 * This will cause MathJax to look for unprocessed mathematics on the page and typeset it
 */
 async function resetMathJax() {
  await MathJax.typeset();
  document.querySelectorAll('.MathJax').forEach((math) => {
    math.removeAttribute('tabindex');
  })
}

/**
 * 
 * @param {string} test The test ID (ie. B05)
 * @param {string} section The section (Possible Values: english, math, reading, science)
 * @param {number} passage The passage number
 * @returns {Promise} Firebase Document
 */
 async function getPassageDocument(test, section, passage) {
	// get the passage document
	const passageQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'passage')
	.where('test', '==', test.toUpperCase())
	.where('section', '==', section.toLowerCase())
	.where('passageNumber', '==', parseInt(passage))
  .limit(1)
  .get();

  return passageQuery.docs[0];
}

/**
 * This will grab a question document from firebase
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (Possible Values: english, math, reading, science)
 * @param {number} question Question Number
 * @returns {Promise} Firebase Document
 */
 async function getQuestionDocument(test, section, question) {

	// get the question document
	const questionQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test.toUpperCase())
	.where('section', '==', section.toLowerCase())
	.where('problem', '==', parseInt(question))
  .limit(1)
  .get();

  return questionQuery.docs[0];
}

function renderSelector(test, section, questionStates) {
  removeAllChildNodes(document.querySelector('.main .panels .selector .selector-container'))
  for (let i = 1; i <= QUESTION_COUNT[section]; i++) {
    const questionRadio = document.createElement('input');
    questionRadio.setAttribute('id', 'selectorRadio-' + i);
    questionRadio.setAttribute('type', 'radio');
    questionRadio.setAttribute('name', 'questionSelector');

    const questionSelector = document.createElement('label');
    questionSelector.setAttribute('for', 'selectorRadio-' + i);
    questionSelector.classList.add('selector-wrapper');
    questionSelector.addEventListener('click', () => { setQuestion(test, section, i) })
    questionSelector.innerHTML = `
      <span>${FLAG_SVG}</span>
      Question ${i}
    `
    document.querySelector('.main .panels .selector .selector-container').appendChild(questionRadio);
    document.querySelector('.main .panels .selector .selector-container').appendChild(questionSelector);

    if (questionStates?.[i]?.answer) {
      addSelectorAnsweredCallback(i);
    }
    if (questionStates?.[i]?.flagged) {
      addSelectorFlaggedCallback(i)
    }
  }
}

function renderPassage(passageData) {
  // document.querySelector('.main .panels .passage').classList.remove('hide');

  document.getElementById('sectionTitle').innerHTML = passageData.section.toUpperCase();
  document.getElementById('passageNumber').innerHTML = ROMAN_NUMERALS[passageData.passageNumber - 1];

  document.getElementById('passageTitle-A').innerHTML = passageData.title || '';
  document.getElementById('passagePreText-A').innerHTML = passageData.preText || '';
  document.getElementById('passageText-A').innerHTML = passageData.passageText || '';
  document.getElementById('passageReference-A').innerHTML = passageData.reference || '';

  document.getElementById('passageTitle-B').innerHTML = passageData.ABData.title || '';
  document.getElementById('passagePreText-B').innerHTML = passageData.ABData.preText || '';
  document.getElementById('passageText-B').innerHTML = passageData.ABData.passageText || '';
  document.getElementById('passageReference-B').innerHTML = passageData.ABData.reference || '';

  resetMathJax();
}

function renderQuestion(questionData, answerData = null) {
  // document.querySelector('.main .panels .question').classList.remove('hide');

  //render the question text
  document.getElementById('questionNumber').textContent = questionData.problem;
  document.getElementById('questionText').innerHTML = questionData.questionText;

  // handle teh questions that have markers in the passage that need to be highlighted
  document.querySelectorAll(`.passage-container span[data-question]`).forEach(question => { question.classList.remove('highlighted') });
  document.querySelectorAll(`.passage-container span[data-question="${questionData.problem}"]`).forEach(question => { question.classList.add('highlighted'); });

  // select the question in the selecotr panel
  if (document.getElementById(`selectorRadio-${questionData.problem}`)) {
    document.getElementById(`selectorRadio-${questionData.problem}`).checked = true;
  }

  // render all of the choices
  const choiceWrapper = document.getElementById('questionChoices');
  removeAllChildNodes(choiceWrapper);

  questionData.answers.forEach((choice, index) => {
    const choiceLetter = questionData.problem % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index];

    const choiceElem = document.createElement('div');
    choiceElem.classList.add('choice');
    // choiceElem.innerHTML = `
    //   <input type="checkbox" name="strike" id="strike-${index}" value="${choiceLetter}">
    //   <input type="radio" name="choice" id="choice_${index}" value="${choiceLetter}" onclick="addSelectorAnsweredCallback(${questionData.problem})">
    //   <label for="choice_${index}"><p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}</label>
    // `
    choiceElem.innerHTML = `
      <input type="radio" name="choice" id="choice_${index}" value="${choiceLetter}" ${isChoiceSelected(choiceLetter, answerData) ? 'checked' : ''} onclick="choiceSelectedCallback(${questionData.problem}, '${choiceLetter}')">
      <label for="choice_${index}"><p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}</label>
    `
    choiceWrapper.appendChild(choiceElem);
  })

  //determine if the flag should be shown
  document.getElementById('questionFlag').checked = isFlagged(answerData);
  // enable the flag
  document.getElementById('questionFlag').disabled = false;

  resetMathJax();
}

function isChoiceSelected(choiceLetter, answerData) {
  if (answerData == null) { return false };
  return choiceLetter == lastSelectedChoice(answerData.timeline)
}

function isFlagged(answerData) {
  if (answerData == null) { return false };
  let flagCount = 0;
  answerData.timeline.forEach(event => {
    if (event.event == 'flag') {
      flagCount++;
    }
  })

  return flagCount % 2 == 1;
}

function lastSelectedChoice(answerTimeline) {
  //go through the timeline backwards and find the first answer event
  for (let i = answerTimeline.length - 1; i >= 0; i--) {
    if (answerTimeline[i].event == 'answer') {
      return answerTimeline[i].answer;
    }
  }
  return null;
}

async function choiceSelectedCallback(question, choiceLetter) {
  addSelectorAnsweredCallback(question);
  await recordAnswerEvent(
    current_data.answer,
    {
      time: new Date(),
      event: 'answer',
      answer: choiceLetter
    }
  );
  await updateSectionAssignmentAnswer(current_data.assignment, question, choiceLetter);
}

function renderNextPrevious(section, question) {
  if (question > 1) {
    document.getElementById('previousBtn').classList.remove('hide');
  }
  else {
    document.getElementById('previousBtn').classList.add('hide');
  }

  if (question < QUESTION_COUNT[section]) {
    document.getElementById('nextBtn').classList.remove('hide');
  }
  else {
    document.getElementById('nextBtn').classList.add('hide');
  }
}

function hidePassage() {
  document.querySelector('.main .panels .passage').classList.add('hide');
}

function showPassage() {
  document.querySelector('.main .panels .passage').classList.remove('hide');
}

function hideQuestion() {
  document.querySelector('.main .panels .question').classList.add('hide');
}

function showQuestion() {
  document.querySelector('.main .panels .question').classList.remove('hide');
}

function hideAllDirections() {
  document.querySelector('.main .panels .directions').classList.add('hide');
  document.querySelectorAll('.main .panels .directions > div').forEach(div => div.classList.add('hide'));
}

function showDirection(section) {
  document.querySelector('.main .panels .directions').classList.remove('hide');
  document.getElementById(`${section}Directions`).classList.remove('hide');
}

function renderError(errorMsg) {
  customConfirm(errorMsg, '', 'OK', () => {}, () => {});
}

async function setQuestion(test, section, question) {
  changeAccentColor(section);

  if (question != current_data.question || section != current_data.section) {
    try {
      showQuestion();
      renderNextPrevious(section, question);

      const questionDoc = await getQuestionDocument(test, section, question);
      const questionData = questionDoc?.data()
  
      if (!questionData) {
        renderError('We are having an issue getting this question.');
        return;
      }
  
      // if the question does have a passage
      if (questionData.passage != -1 && (questionData.passage != current_data.passage || section != current_data.section)) {
        await setPassage(test, section, questionData.passage);
      }
      if (questionData.passage == -1) {
        hidePassage();
      }
      else {
        showPassage();
      }

      const answerDoc = await getAnswerDoc(current_data.assignment, test, section, question);
      const answerData = answerDoc?.data()
      // if there already exists an answer for this question on this assignment
      if (answerData) {
        current_data.answer = answerDoc.id;
        renderQuestion(questionData, answerData)
        await recordAnswerEvent(
          answerDoc.id,
          {
            time: new Date(),
            event: 'restart'
          }  
        )
      }
      else {
        renderQuestion(questionData);
        current_data.answer = await setAnswerDoc(current_data.assignment, test, section, question);
      }
  
      current_data.test = test;
      current_data.section = section;
      current_data.question = question;
    }
    catch (error) {
      console.log(error)
    }
  }
}

async function setPassage(test, section, passage) {
  changeAccentColor(section);
  changePassageColumns(section);
  try {
    const passageDoc = await getPassageDocument(test, section, passage);
    const passageData = passageDoc?.data();

    if (!passageData) {
      renderError('We are having issues getting this passage for this question.');
      return;
    }
    renderPassage(passageData);

    current_data.test = test;
    current_data.section = section;
    current_data.passage = passage;
  }
  catch (error) {
    console.log(error)
  }
}

async function setSectionDirections(assignmentData) {
  changeAccentColor(assignmentData.section.split('_')[0]);
  hideExitReview();
  // remove the selector questions
  removeAllChildNodes(document.querySelector('.main .panels .selector .selector-container'))

  await updateSectionAssignmentStatus(assignmentData);

  // show the directions for the given section
  renderSectionDirections(assignmentData.section.split('_')[0]);

  //set the timeout
  const start = assignmentData.startedAt ?? new Date();
  const end = new Date(start.setMinutes(start.getMinutes() + SECTION_TIME[assignmentData.section]));
  current_data.timeout = setTimeout(submitSection, end.getTime() - new Date().getTime());
  current_data.timer = setInterval(() => setTimer(end), 1000);
}

async function setSection(assignmentData) {
  await updateSectionAssignmentStatus(assignmentData);

  // display the section
  hideAllDirections();
  hideExitReview();
  const testDoc = await getTestDoc(assignmentData.test);
  const testCode = testDoc.data().test;

  const start = assignmentData.startedAt ?? new Date(); 
  const end = new Date(start.setMinutes(start.getMinutes() + SECTION_TIME[assignmentData.section]));
  current_data.timeout = setTimeout(submitSection, end.getTime() - new Date().getTime());
  current_data.timer = setInterval(() => setTimer(end), 1000);

  renderSelector(testCode, assignmentData.section, assignmentData.questions)
  await setQuestion(testCode, assignmentData.section, 1)
}

async function updateSectionAssignmentStatus(assignmentData) {
  const updateData = {
    status: 'started'
  }
  if (!assignmentData.startedAt) {
    updateData.startedAt = new Date();
  }

  await firebase.firestore().collection('Section-Assignments').doc(assignmentData.assignment).update(updateData);
  assignmentData.status = updateData.status;
  assignmentData.startedAt = assignmentData.startedAt ?? updateData.startedAt;
}

function setTimer(end) {
  const distance = end.getTime() - new Date().getTime();
  if (distance < 0) {
    // remove the counter and return
    clearInterval(current_data.timer);
    return;
  }

  const minutes = Math.floor(distance / (1000 * 60)).toString().padStart(2, '0');
  const seconds = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');

  document.getElementById('sectionTime').textContent = `${minutes}:${seconds}`;
}

function renderSectionDirections(section) {
  hidePassage();
  hideQuestion();
  hideAllDirections();
  renderNextPrevious('directions', -1);
  console.log(section)
  showDirection(section);
}

async function submitSection() {
  console.log('submit section');
  clearTimeout(current_data.timeout);
  clearInterval(current_data.timer);

  // if there is an all assignment we need to submit the section and then do the next section
  if (current_data.allAssignment) {
    // submit the current assignment
    await submitSectionAssignment(current_data.assignment);

    // get the next assignment
    const currentSectionIndex = current_data.sectionAssignments.findIndex(assignmentData => assignmentData.assignment == current_data.assignment);
    if (currentSectionIndex == -1) {
      // cannot find error
      console.log('cannot find current section')
      alert('We are having issues. Please contact us.')
    }
    else if (currentSectionIndex + 1 == current_data.sectionAssignments.length) {
      // the current section is the final section
      // submit the all section
      await submitSectionAssignment(current_data.allAssignment.assignment)
      changeMode('default');
      setLandingPage(CURRENT_STUDENT_UID);
    }
    else {
      // update the next section
      const nextAssignmentData = current_data.sectionAssignments[currentSectionIndex + 1];

      current_data.assignment = current_data.sectionAssignments[currentSectionIndex + 1].assignment;
      if (nextAssignmentData.section.split('_')[1] == 'directions') {
        // if the section is a direction section
        await setSectionDirections(nextAssignmentData);
        return
      }
      else {
        // else the section is a non direction so jump right in
        await setSection(nextAssignmentData);
        return
      }
    }

  }
  else {
    // submit the current assignment 
    await submitSectionAssignment(current_data.assignment);
    changeMode('default');
    setLandingPage(CURRENT_STUDENT_UID);
    console.log(current_data)
  }
}

function nextQuestionCallback() {
  switch (current_data.mode) {
    case 'section':
      setQuestion(current_data.test, current_data.section, current_data.question + 1)
      break;
    case 'review':
      setPreviousQuestion(current_data.test, current_data.section, current_data.question + 1)
      break;
    default:
      alert('We are having issues. Please try again.')
  }
}

function exitReviewCallback() {
  changeMode('default')
  setLandingPage(CURRENT_STUDENT_UID);
}

function previousQuestionCallback() {
  switch (current_data.mode) {
    case 'section':
      setQuestion(current_data.test, current_data.section, current_data.question - 1)
      break;
    case 'review':
      setPreviousQuestion(current_data.test, current_data.section, current_data.question - 1)
      break;
    default:
      alert('We are having issues. Please try again.')
  }
}

function toggleSelectorCallback() {
  document.querySelector('.main .panels .selector').classList.toggle('open')
}

function addSelectorAnsweredCallback(question) {
  // set the question in the selector as answered
  document.querySelector(`label[for="selectorRadio-${question}"] > span`).classList.add('answered')
}

function addSelectorFlaggedCallback(question) {
  // set the question in the selector as flagged
  document.querySelector(`label[for="selectorRadio-${question}"] > span`).classList.add('flagged')
}

async function setAnswerDoc(assignment, test, section, question) {
  const answerRef = firebase.firestore().collection('ACT-Answers').doc();
  await answerRef.set({
    assignment,
    test,
    section,
    question,
    timeline: [
      {
        time: new Date(),
        event: 'start'
      }
    ]
  })
  return answerRef.id;
}

async function getAnswerDoc(assignment, test, section, question) {
  const answerQuery = await firebase.firestore().collection('ACT-Answers')
  .where('assignment', '==', assignment)
  .where('test', '==', test)
  .where('section', '==', section)
  .where('question', '==', question)
  .limit(1)
  .get();

  return answerQuery.docs[0];
}

async function recordAnswerEvent(answerID, eventData) {
  await firebase.firestore().collection('ACT-Answers').doc(answerID).update({
    timeline: firebase.firestore.FieldValue.arrayUnion(eventData)
  })
  return;
}

async function updateSectionAssignmentAnswer(assignment, question, answer) {
  await firebase.firestore().collection('Section-Assignments').doc(assignment).update({
    [`questions.${question}.answer`]: answer 
  })
}

async function updateSectionAssignmentFlag(assignment, question, isFlagged) {
  await firebase.firestore().collection('Section-Assignments').doc(assignment).update({
    [`questions.${question}.flagged`]: isFlagged 
  })
}

function toggleSelectorFlagCallback(question) {
  document.querySelector(`label[for="selectorRadio-${question}"] > span`).classList.toggle('flagged')
}

function questionFlagChangeCallback(event) {
  toggleSelectorFlagCallback(current_data.question)
  updateSectionAssignmentFlag(current_data.assignment, current_data.question, event.target.checked);
  recordAnswerEvent(current_data.answer,
    {
      time: new Date(),
      event: 'flag'
    }
  )
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setPreviousSection(assignmentData) {
  // display the section
  hideAllDirections();
  showExitReview();
  const testDoc = await getTestDoc(assignmentData.test);
  const testData = testDoc.data();
  const testCode = testData.test;

  // go through the assignment questions and add in the correct answer

  renderPreviousSelector(testData, assignmentData.section, assignmentData.questions)
  await setPreviousQuestion(testCode, assignmentData.section, 1)
}

function showExitReview() {
  document.getElementById('exitReview').classList.remove('hide');
}

function hideExitReview() {
  document.getElementById('exitReview').classList.add('hide');
}

async function setPreviousQuestion(test, section, question) {
  changeAccentColor(section);

  if (question != current_data.question || section != current_data.section) {
    try {
      showQuestion();
      renderNextPrevious(section, question);

      const questionDoc = await getQuestionDocument(test, section, question);
      const questionData = questionDoc?.data()
  
      if (!questionData) {
        renderError('We are having an issue getting this question.');
        return;
      }
  
      // if the question does have a passage
      if (questionData.passage != -1 && (questionData.passage != current_data.passage || section != current_data.section)) {
        await setPassage(test, section, questionData.passage);
      }
      if (questionData.passage == -1) {
        hidePassage();
      }
      else {
        showPassage();
      }

      const answerDoc = await getAnswerDoc(current_data.assignment, test, section, question);
      const answerData = answerDoc?.data()
      // if there already exists an answer for this question on this assignment
      if (answerData) {
        current_data.answer = answerDoc.id;
        renderPreviousQuestion(questionData, answerData, ['tutor', 'admin', 'dev'].includes(currentUserRole))
      }
      else {
        current_data.answer = null;
        renderPreviousQuestion(questionData, null, ['tutor', 'admin', 'dev'].includes(currentUserRole));
      }
  
      current_data.test = test;
      current_data.section = section;
      current_data.question = question;
    }
    catch (error) {
      console.log(error)
    }
  }
}

function renderPreviousQuestion(questionData, answerData = null, showCorrectAnswer = false) {
  // document.querySelector('.main .panels .question').classList.remove('hide');

  //render the question text
  document.getElementById('questionNumber').textContent = questionData.problem;
  document.getElementById('questionText').innerHTML = questionData.questionText;

  // handle the questions that have markers in the passage that need to be highlighted
  document.querySelectorAll(`.passage-container span[data-question]`).forEach(question => { question.classList.remove('highlighted') });
  document.querySelectorAll(`.passage-container span[data-question="${questionData.problem}"]`).forEach(question => { question.classList.add('highlighted'); });

  // select the question in the selecotr panel
  if (document.getElementById(`selectorRadio-${questionData.problem}`)) {
    document.getElementById(`selectorRadio-${questionData.problem}`).checked = true;
  }

  // render all of the choices
  const choiceWrapper = document.getElementById('questionChoices');
  removeAllChildNodes(choiceWrapper);

  questionData.answers.forEach((choice, index) => {
    const choiceLetter = questionData.problem % 2 == 0 ? EVEN_ANSWERS[index] : ODD_ANSWERS[index];
    const isCorrectChoice = questionData.correctAnswer == choiceLetter;

    const choiceElem = document.createElement('div');
    choiceElem.classList.add('choice');
    if (isCorrectChoice && showCorrectAnswer) {
      choiceElem.classList.add('correct');
    }
    // choiceElem.innerHTML = `
    //   <input type="checkbox" name="strike" id="strike-${index}" value="${choiceLetter}">
    //   <input type="radio" name="choice" id="choice_${index}" value="${choiceLetter}" onclick="addSelectorAnsweredCallback(${questionData.problem})">
    //   <label for="choice_${index}"><p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}</label>
    // `
    if (answerData) {
      console.log(answerData)
    }
    choiceElem.innerHTML = `
      <input type="radio" name="choice" id="choice_${index}" value="${choiceLetter}" ${isChoiceSelected(choiceLetter, answerData) ? 'checked' : ''} disabled>
      <label for="choice_${index}"><p class="choice-letter"><b>${choiceLetter}.</b></p>${choice}</label>
    `
    choiceWrapper.appendChild(choiceElem);
  })

  //determine if the flag should be shown
  document.getElementById('questionFlag').checked = isFlagged(answerData);
  // disable the flag
  document.getElementById('questionFlag').disabled = true;

  resetMathJax();
}

function renderPreviousSelector(testData, section, questionStates) {
  removeAllChildNodes(document.querySelector('.main .panels .selector .selector-container'))
  for (let i = 1; i <= QUESTION_COUNT[section]; i++) {
    const questionRadio = document.createElement('input');
    questionRadio.setAttribute('id', 'selectorRadio-' + i);
    questionRadio.setAttribute('type', 'radio');
    questionRadio.setAttribute('name', 'questionSelector');

    const questionSelector = document.createElement('label');
    questionSelector.setAttribute('for', 'selectorRadio-' + i);
    questionSelector.classList.add('selector-wrapper');
    questionSelector.addEventListener('click', () => { setPreviousQuestion(testData.test, section, i) })
    questionSelector.innerHTML = `
      <span>${FLAG_SVG}</span>
      Question ${i}
      <span>${testData.answers[section][i] != questionStates?.[i]?.answer ? CROSS_SVG : ''}</span>
    `
    document.querySelector('.main .panels .selector .selector-container').appendChild(questionRadio);
    document.querySelector('.main .panels .selector .selector-container').appendChild(questionSelector);

    if (questionStates?.[i]?.answer) {
      addSelectorAnsweredCallback(i);
    }
    if (questionStates?.[i]?.flagged) {
      addSelectorFlaggedCallback(i)
    }
  }
}