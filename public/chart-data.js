let currentStudent = "";
let currentTutor = "";

let studentProfile = {};
let hwData = {};
let sessionData = {};
//let actProfile = {};
let studentNotes = {};

let sessionDates = [];
let hoursArray = [];
let sessionDateStr = [];

const sections = ['english', 'math', 'reading', 'science']
const allSections = ['composite', 'english', 'math', 'reading', 'science']

const sectionColors = {
  'composite': "#595959",
  'english': "#5600F7",
  'math': "#F70056",
  'reading': "#00E6BC",
  'science': "#C00BE0"
}

let sectionScores = {
  'composite': {},
  'english': {},
  'math': {},
  'reading': {},
  'science': {}
}

let sectionHours = {
  'composite': {},
  'english': {},
  'math': {},
  'reading': {},
  'science': {}
}

let testArrays = {
  'composite': [],
  'english': [],
  'math': [],
  'reading': [],
  'science': []
}

let sectionHoursArrays = {
  'composite': [],
  'english': [],
  'math': [],
  'reading': [],
  'science': []
}

let sectionHoursScores = {
  'composite': {},
  'english': {},
  'math': {},
  'reading': {},
  'science': {}
}

let sectionHoursScoresArrays = {
  'composite': [],
  'english': [],
  'math': [],
  'reading': [],
  'science': []
}

let sectionRelativeGoals = {
  'composite': undefined,
  'english': undefined,
  'math': undefined,
  'reading': undefined,
  'science': undefined
}

let borderDashGoals = [null, null, null, null, null];
let borderDashOffsetGoals = [null, null, null, null, null];

let sectionGoals = {
  'composite': undefined,
  'english': undefined,
  'math': undefined,
  'reading': undefined,
  'science': undefined
}

//let charts = {
  //'composite': undefined,
  //'english': undefined,
  //'math': undefined,
  //'reading': undefined,
  //'science': undefined
//}

var goalsChanged = false;
var initialsChanged = false;
let initialComposite = undefined;

function resetData() {
  currentStudent = "";
  currentTutor = "";

  studentProfile = {};
  hwData = {};
  sessionData = {};
  actProfile = {};
  studentNotes = {};

  sessionDates = [];
  hoursArray = [];
  sessionDateStr = [];

  sectionScores = {
    'composite': {},
    'english': {},
    'math': {},
    'reading': {},
    'science': {}
  }

  sectionHours = {
    'composite': {},
    'english': {},
    'math': {},
    'reading': {},
    'science': {}
  }

  testArrays = {
    'composite': [],
    'english': [],
    'math': [],
    'reading': [],
    'science': []
  }

  sectionHoursArrays = {
    'composite': [],
    'english': [],
    'math': [],
    'reading': [],
    'science': []
  }

  sectionHoursScores = {
    'composite': {},
    'english': {},
    'math': {},
    'reading': {},
    'science': {}
  }

  sectionHoursScoresArrays = {
    'composite': [],
    'english': [],
    'math': [],
    'reading': [],
    'science': []
  }

  sectionRelativeGoals = {
    'composite': undefined,
    'english': undefined,
    'math': undefined,
    'reading': undefined,
    'science': undefined
  }

  borderDashGoals = [null, null, null, null, null];
  borderDashOffsetGoals = [null, null, null, null, null];

  sectionGoals = {
    'composite': undefined,
    'english': undefined,
    'math': undefined,
    'reading': undefined,
    'science': undefined
  }

  charts = {
    'composite': undefined,
    'english': undefined,
    'math': undefined,
    'reading': undefined,
    'science': undefined
  }

  goalsChanged = false;
  initialsChanged = false;
  initialComposite = undefined;

  let canvasElements = document.querySelectorAll('canvas')
  let canvasParents  = document.querySelectorAll('.scores-chart')
  for (let i = 0; i < canvasElements.length; i++) {
    let id = canvasElements[i].id
    canvasElements[i].remove();
    canvasParents[i].append(createElement('canvas', [], ['id', 'style'], [id, 'flex: 1'], ''))
  }
}