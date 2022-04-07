const functions = require("firebase-functions");
const admin = require("firebase-admin");

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

exports.sectionAssignmentUpdated = functions.firestore
.document('/Section-Assignments/{assignmentID}')
.onUpdate(async (change, context) => {
  const oldValues = change.before.data();
  const newValues = change.after.data();

  //handle when the assignments are submitted
  if (newValues.status == 'submitted') {
    // we want to grade this assignment and put it into a graded state

    // split if it is an all assignment
    if (newValues.section == 'all') {
      // we won't grade this assignment but will look to the individual sections for the composite grade
      return;
    }
    //split if it is only a direction section
    else if (newValues.section.split('_')[1] == 'directions') {
      // these assignments will be deleted since they only are used by the test taker for navigation
      // remove them from the sectionAssignments from the all section then delete the assignment
      await admin.firestore().collection('Section-Assignments').doc(newValues.allAssignment).update({
        sectionAssignments: admin.firestore.FieldValue.arrayRemove(change.after.ref.id)
      })
      await change.after.ref.delete();
      return;
    }
    // all single sections
    else {
      await gradeAssignment(change.after.id, newValues);
    }
  }
  else {
    return;
  }
})

async function gradeAssignment(assignmentID, assignmentData) {
  // we need to get all answers that are connected to this assignmnet
  // const answerQuery = await admin.firestore().collection('ACT-Answers')
  // .where('assignment', '==', assignmentID)
  // .get();

  // we also need the test doc we that we can have the answers
  const testDoc = await admin.firestore().collection('ACT-Tests').doc(assignmentData.test).get();

  //keep track of how many questions the student got right
  let numAnswersCorrect = 0;
  // answerQuery.forEach(answerDoc => {
  //   const timeline = answerDoc.data().timeline;
  //   let studentAnswer = null;
  //   for (let i = timeline.length - 1; i >= 0 ; i--) {
  //     if (timeline[i].event == 'answer') {
  //       studentAnswer = timeline[i].answer;
  //       break;
  //     }
  //   }
  //   const correctAnswer = testDoc.data().answers[assignmentData.section][answerDoc.data().question.toString()];

  //   if (studentAnswer == correctAnswer) {
  //     numAnswersCorrect++;
  //   }
  // })

  const sectionAnswers = testDoc.data().answers[assignmentData.section];
  for (const question in sectionAnswers) {
    const correctAnswer = sectionAnswers[question];
    let studentAnswer = assignmentData.questions
    if (studentAnswer) {
      studentAnswer = studentAnswer[question]
      if (studentAnswer) {
        studentAnswer = studentAnswer.answer
      }
      else {
        studentAnswer = null;
      }
    }
    else {
      studentAnswer = null;
    }

    if (studentAnswer == correctAnswer) {
      numAnswersCorrect++;
    }
  }

  // determine the scaled score for this score
  const scaledScores = testDoc.data().scaledScores[assignmentData.section];
  let scaledScoreWinner = null;
  let winnerScore = Infinity;
  for (const scaledScore in  scaledScores) {
    const minScore = scaledScores[scaledScore];
    if (minScore != -1) {
      let score = numAnswersCorrect - minScore
      if (score >= 0 && score < winnerScore) {
        scaledScoreWinner = Number(scaledScore);
      }
    }
  }

  // update the assignment with the scores
  await admin.firestore().collection('Section-Assignments').doc(assignmentID).update({
    status: 'graded',
    score: numAnswersCorrect,
    scaledScore: scaledScoreWinner
  })
}

exports.checkAssignments = functions.pubsub.schedule('59 23 * * *').timeZone('America/Denver').onRun(async (context) => {
  // we need to update the status for new events that are past their close and started events that are past their length

  await Promise.all([
    // get all new events that are closed
    admin.firestore().collection('Section-Assignments')
    .where('status', '==', 'new')
    .where('closed', '<', new Date())
    .get()
    .then((omiitedQuery) => {
      return Promise.all(omiitedQuery.docs.map(doc => {
        return doc.ref.update({ status: 'omitted' });
      }))
    }),

    // get all started events
    admin.firestore().collection('Section-Assignments')
    .where('status', '==', 'started')
    .get()
    .then((startedQuery) => {
      return Promise.all(startedQuery.docs.map(doc => {
        if (doc.data().startedAt.toDate().getTime() + (SECTION_TIME[doc.data().section] * 60000) < new Date().getTime()) {
          return doc.ref.update({ status: 'submitted' });
        }
      }))
    })
  ])
})