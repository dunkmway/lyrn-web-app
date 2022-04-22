const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

// classes will end right before a test as well as this number
// of weeks before the test
const CLASS_END_WEEKS_BEFORE_TEST = 4
// the sections that will be taught in all programs
const SECTIONS = ['english', 'math', 'reading', 'science'];
const CLASS_DETAILS = [
  {
    numSessions: 12,
    sessionLength: 120,
    sessionStartTime: '18:00',
    sessionDays: [1, 3],
    type: 'actClass',
    name: '3 Week ACT Class'
  },
  {
    numSessions: 12,
    sessionLength: 120,
    sessionStartTime: '13:00',
    sessionDays: [2, 4],
    type: 'actClass',
    name: '3 Week ACT Class'
  },
  {
    numSessions: 16,
    sessionLength: 120,
    sessionStartTime: '13:00',
    sessionDays: [1, 3],
    type: 'actClass',
    name: '4 Week ACT Class'
  },
  {
    numSessions: 16,
    sessionLength: 120,
    sessionStartTime: '18:00',
    sessionDays: [2, 4],
    type: 'actClass',
    name: '4 Week ACT Class'
  },
]

const STUDY_GROUP_DETAILS = [
  {
    numSessions: 12,
    sessionLength: 60,
    sessionStartTime: '13:00',
    sessionDays: [1, 3],
    type: 'actStudyGroup',
    name: '6 Week ACT Study Group'
  },
  {
    numSessions: 12,
    sessionLength: 60,
    sessionStartTime: '18:00',
    sessionDays: [2, 4],
    type: 'actStudyGroup',
    name: '6 Week ACT Study Group'
  },
  {
    numSessions: 16,
    sessionLength: 60,
    sessionStartTime: '18:00',
    sessionDays: [1, 3],
    type: 'actStudyGroup',
    name: '8 Week ACT Study Group'
  },
  {
    numSessions: 16,
    sessionLength: 60,
    sessionStartTime: '13:00',
    sessionDays: [2, 4],
    type: 'actStudyGroup',
    name: '8 Week ACT Study Group'
  },
]

exports.generatePrograms = functions.pubsub
.schedule('0 1 * * 6')
.timeZone('America/Denver')
.onRun(async (context) => {
  // we need all of the test that are coming up
  // and all of the classes and study groups that are already scheduled
  const [
    testDocs,
    classDocs,
    studyGroupDocs
  ] = await Promise.all([
    getAllFutureTests(),
    getAllFutureClasses(),
    getAllFutureStudyGroups()
  ])

  const classData = classDocs.map(doc => doc.data());
  const studyGroupData = studyGroupDocs.map(doc => doc.data());

  // we want to generate all of the possible classes and study groups
  // and if the program doesn't already exist then generate it
  let generatedClasses = [];
  let generatedStudyGroups = [];
  testDocs.forEach(testDoc => {
    const testStart = new Date(new Date(testDoc.data().start).setHours(0,0,0,0));

    CLASS_DETAILS.forEach(classDetails => {
      generatedClasses.push({
        ...classDetails,
        end: testStart
      })
      generatedClasses.push({
        ...classDetails,
        end: new Date(new Date(testStart).setDate(testStart.getDate() - (7 * CLASS_END_WEEKS_BEFORE_TEST)))
      })
    })

    STUDY_GROUP_DETAILS.forEach(studyGroupDetails => {
      generatedStudyGroups.push({
        ...studyGroupDetails,
        end: testStart
      })
    })
  })

  // compare the generated classes to the class docs and filter out any that are already set
  generatedClasses.filter(generatedClass => {
    return classData.findIndex(data => areProgramsEqual(data, generatedClass)) == -1;
  })
  // do the same for study groups
  generatedStudyGroups.filter(generatedStudyGroups => {
    return studyGroupData.findIndex(data => areProgramsEqual(data, generatedStudyGroups)) == -1;
  })

  // all of the remaining generated programs we attempt to create
  // we need to check if it is possible to assign a tutor to the potential events

  // we start by finding all of the permutation of having the lessons
  const sectionPermutations = arrayRandomOrder(arrayPermutations(SECTIONS));

  // we want to find the first permutaiton that allows for the program to be scheduled
  

});

async function getAllFutureTests() {
  const testQuery = await admin.firestore().collection('Events')
  .where('type', '==', 'test')
  .where('start', '>', new Date().getTime())
  .get();

  return testQuery.docs;
}

async function getAllFutureClasses() {
  const classesQuery = await admin.firestore().collection('Programs')
  .where('type', '==', 'actClass')
  .where('start', '>', new Date())
  .get();

  return classesQuery.docs;
}

async function getAllFutureStudyGroups() {
  const studyGroupQuery = await admin.firestore().collection('Programs')
  .where('type', '==', 'actStudyGroup')
  .where('start', '>', new Date())
  .get();

  return studyGroupQuery.docs;
}

function areProgramsEqual(program1, program2) {
  // we need to compare certain keys to determine if the program object are equivalent
  // some differences are inconsequential for our purposes

  return program1.numSessions == program2.numSessions &&
  program1.sessionLength == program2.sessionLength &&
  program1.sessionStartTime == program2.sessionStartTime &&
  program1.sessionLength == program2.sessionLength &&
  areArraysEqual(program1.sessionDays, program2.sessionDays) &&
  areDatesEqual(program1.end, program2.end)
}

/**
 * compares arrays at every index. Ensure that the values within the array can use the != operator
 * @param {any[]} array1 first array
 * @param {any[]} array2 second array
 * @returns {boolean} true if the arrays are exactly the same
 */
function areArraysEqual(array1, array2) {
  if (array1.length != array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] != array2[i]) {
      return false;
    }
  }

  return true;
}

/**
 * compares dates
 * @param {Date} date1 first date
 * @param {Date} date2 second date
 * @returns true if the two dates have exactly the same time in milliseconds since unix epoch
 */
function areDatesEqual(date1, date2) {
  return date1.getTime() == date2.getTime()
}

function arrayRandomOrder(array) {
  let tmpArray = [...array];
  let randomArray = [];

  // go through the array and choose a random index then push it to the random array
  for (let i = 0; i < array.length; i++) {
    let randomIndex = Math.floor(Math.random() * (tmpArray.length));
    randomIndex == tmpArray.length ? randomIndex-- : randomIndex;

    randomArray.push(tmpArray[randomIndex]);
    tmpArray.splice(randomIndex, 1);
  }

  return randomArray;
}

function arrayPermutations(array) {
  var results = [];

  function permute(arr, memo) {
    var cur, memo = memo || [];

    for (var i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }

    return results;
  }

  return permute(array);
}