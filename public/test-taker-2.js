const STOPWATCH_SVG = `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
	<g>
		<g>
			<path d="M392.09,122.767l15.446-24.272c6.858-10.778,3.681-25.076-7.097-31.935c-10.777-6.86-25.076-3.681-31.935,7.099
				l-15.409,24.215c-22.708-11.316-47.642-18.798-73.962-21.58V46.265h1.448c12.775,0,23.133-10.357,23.133-23.133
				S293.356,0,280.581,0h-49.163c-12.775,0-23.133,10.357-23.133,23.133s10.357,23.133,23.133,23.133h1.45v30.029
				C123.239,87.885,37.535,180.886,37.535,293.535C37.535,413.997,135.538,512,256,512s218.465-98.003,218.465-218.465
				C474.465,224.487,442.259,162.83,392.09,122.767z M256,465.735c-94.951,0-172.2-77.249-172.2-172.2s77.249-172.2,172.2-172.2
				s172.2,77.249,172.2,172.2S350.951,465.735,256,465.735z"/>
		</g>
	</g>
	<g>
		<g>
			<path d="M333.172,205.084c-9.623-8.397-24.238-7.407-32.638,2.222l-61.964,71.02c-8.399,9.626-7.404,24.24,2.222,32.638
				c9.626,8.399,24.24,7.404,32.638-2.222l61.964-71.02C343.794,228.096,342.798,213.484,333.172,205.084z"/>
		</g>
	</g>
</svg>
`
const MINUS_BOX_SVG = `
<svg viewBox="4 4 16 16" xmlns="http://www.w3.org/2000/svg" xml:space="preserve">
  <path d="M9 11h6v2H9z"/>
  <path d="M17 5H7c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2zM7 17V7h10l.002 10H7z"/>
</svg>
`
const REFRESH_SVG = `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
<g>
	<g>
		<g>
			<path d="M426.574,403.384c-0.04-0.445-0.11-0.88-0.177-1.317c-0.039-0.253-0.068-0.506-0.115-0.757
				c-0.081-0.425-0.188-0.84-0.294-1.256c-0.066-0.261-0.125-0.524-0.201-0.783c-0.115-0.388-0.252-0.766-0.388-1.145
				c-0.101-0.282-0.195-0.565-0.309-0.843c-0.14-0.344-0.3-0.677-0.458-1.012c-0.141-0.301-0.277-0.603-0.433-0.899
				c-0.161-0.305-0.341-0.598-0.517-0.894c-0.181-0.306-0.357-0.615-0.555-0.914c-0.189-0.285-0.396-0.554-0.598-0.829
				c-0.212-0.289-0.416-0.581-0.644-0.862c-0.229-0.282-0.479-0.545-0.722-0.815c-0.203-0.225-0.388-0.46-0.602-0.679
				c-0.03-0.03-0.063-0.055-0.092-0.085c-0.216-0.218-0.451-0.415-0.677-0.623c-4.089-3.782-9.292-5.686-14.51-5.673h-85.276
				c-11.782,0-21.333,9.551-21.333,21.333c0,11.782,9.551,21.333,21.333,21.333h20.393c-26.343,13.774-55.128,21.323-84.4,21.323
				c-106.042,0-192-85.958-192-192c0-29.414,6.613-57.859,19.169-83.716c5.146-10.599,0.727-23.363-9.872-28.509
				c-10.599-5.146-23.363-0.727-28.509,9.872c-15.361,31.634-23.455,66.447-23.455,102.353
				c0,129.606,105.061,234.667,234.667,234.667c45.644,0,89.851-14.62,128.006-40.418v40.429c0,11.782,9.551,21.333,21.333,21.333
				c11.782,0,21.333-9.551,21.333-21.333v-85.333c0-0.405-0.038-0.8-0.061-1.199C426.598,403.884,426.596,403.634,426.574,403.384z"
				/>
			<path d="M256.001,21.325c-45.622,0-89.833,14.627-127.996,40.422V21.333C128.005,9.551,118.454,0,106.672,0
				C94.89,0,85.339,9.551,85.339,21.333v85.06c-0.001,0.047,0,0.094,0,0.141v0.132c0,0.134,0.018,0.264,0.02,0.398
				c0.01,0.549,0.031,1.097,0.083,1.645c0.025,0.261,0.07,0.515,0.104,0.772c0.057,0.428,0.112,0.856,0.195,1.281
				c0.06,0.308,0.14,0.608,0.213,0.912c0.089,0.369,0.174,0.737,0.283,1.101c0.095,0.319,0.209,0.628,0.319,0.94
				c0.12,0.342,0.236,0.683,0.373,1.02c0.128,0.313,0.274,0.616,0.417,0.921c0.15,0.323,0.296,0.646,0.464,0.962
				c0.165,0.312,0.348,0.611,0.528,0.913c0.173,0.292,0.34,0.585,0.529,0.87c0.221,0.334,0.461,0.651,0.7,0.972
				c0.175,0.234,0.339,0.473,0.525,0.702c0.319,0.394,0.662,0.767,1.007,1.137c0.117,0.125,0.218,0.258,0.338,0.381
				c0.017,0.017,0.036,0.032,0.053,0.049c0.461,0.467,0.944,0.91,1.446,1.333c0.039,0.033,0.076,0.072,0.115,0.105
				c3.602,2.992,8.205,4.808,13.232,4.899c0.064,0.001,0.127,0.009,0.191,0.01c0.067,0.001,0.132,0.01,0.199,0.01h85.333
				c11.782,0,21.333-9.551,21.333-21.333c0-11.782-9.551-21.333-21.333-21.333h-20.416c26.355-13.784,55.149-21.342,84.412-21.342
				c106.034,0,192,85.972,192,192c0,29.464-6.617,57.929-19.188,83.795c-5.15,10.597-0.734,23.362,9.863,28.512
				c10.597,5.15,23.362,0.734,28.512-9.863c15.381-31.649,23.479-66.486,23.479-102.445C490.668,126.4,385.6,21.325,256.001,21.325z
				"/>
		</g>
	</g>
</g>
</svg>
`

const db = firebase.firestore();

const CURRENT_STUDENT_UID = pathParameter(1);
let assignment_listener;

let assignments = [];
let assigned_questions = [];

/**
 * This will cause MathJax to look for unprocessed mathematics on the page and typeset it
 */
async function resetMathJax() {
  try {
    await MathJax.typesetPromise();
    document.querySelectorAll('.MathJax').forEach((math) => {
      math.removeAttribute('tabindex');
    })
  } catch (error) {
    console.log(error);
  }
}


function setup() {
  // start listening for all of the assignments
  initializeAssignmentsSnapshot(CURRENT_STUDENT_UID)
}

function initializeAssignmentsSnapshot(student) {
  assignment_listener = db.collection('ACT-Assignments')
  .where('student', '==', student)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        // add the new assignment
        const assignment = new Assignment(change.doc);
        assignments.push(assignment);
      }
      if (change.type === "modified") {
        // find the correct assignment object and update it
        const updatedAssignment = assignments.find(assignment => assignment.id == change.doc.id);
        updatedAssignment.update(change.doc.data());
      }
      if (change.type === "removed") {
        console.log("removed: ", change.doc.data());
        const index = assignments.findIndex(assignment => assignment.id === change.doc.id);
        if (assignments[index].isStarted) {
          assignments[index].end();
        }
        assignments.splice(index, 1);
      }
    });
    showAssignments();
    assigned_questions = getAssignedQuestions();
  })
}

function getAssignedQuestions() {
  let newList = [];
  for (const assignment of assignments) {
    newList = newList.concat(assignment.questions);
  }

  return newList;
}

function showAssignments() {
  // filter out the assignment array into started, new, and previous lists
  let startedAssignments = [];
  let newAssignments = [];
  let previousAssignments = [];

  for (const assignment of assignments) {
    if (assignment.status === 'started') {
      startedAssignments.push(assignment);
      continue
    }
    if (assignment.status === 'new') {
      newAssignments.push(assignment);
      continue
    }
    if (assignment.status === 'submitted' || assignment.status === 'graded' || assignment.status === 'omitted') {
      previousAssignments.push(assignment);
      continue
    }
  }

  // sort each appropriately 
  startedAssignments.sort((a,b) => (a.startedAt.toDate().getTime() + (a.time ?? Infinity)) - (b.startedAt.toDate().getTime() + (b.time ?? Infinity)));
  newAssignments.sort((a,b) => a.close.toDate().getTime() - b.close.toDate().getTime());
  previousAssignments.sort((a,b) => (b.submittedAt?.toDate()?.getTime() ?? b.close.toDate().getTime()) - (a.submittedAt?.toDate()?.getTime() ?? a.close.toDate().getTime()));

  // show the assignments
  for (const assignment of startedAssignments) {
    assignment.show();
  }
  for (const assignment of newAssignments) {
    assignment.show();
  }
  for (const assignment of previousAssignments) {
    assignment.show();
  }
}

function previousQuestionCallback() {
  const currentAssignment = assignments.find(assignment => assignment.isStarted);
  const currentQuestion = currentAssignment.currentQuestion;
  const previousQuestionIndex = currentQuestion.pos - 1;
  currentAssignment.startQuestion(previousQuestionIndex);
}

function nextQuestionCallback() {
  const currentAssignment = assignments.find(assignment => assignment.isStarted);
  const currentQuestion = currentAssignment.currentQuestion;
  const nextQuestionIndex = currentQuestion.pos + 1;
  currentAssignment.startQuestion(nextQuestionIndex);
}

function goToLanding() {
  const currentAssignment = assignments.find(assignment => assignment.isStarted);
  if (currentAssignment) {
    currentAssignment.end()
  }
}

function changeSection(sectionID) {
  // hide all sections
  document.querySelectorAll('section').forEach(section => section.classList.add('hide'));
  
  // show the section
  document.getElementById(sectionID).classList.remove('hide');
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