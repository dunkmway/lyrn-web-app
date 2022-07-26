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

exports.assignmentUpdated = functions.firestore
.document('/ACT-Assignments/{assignmentID}')
.onUpdate(async (change, context) => {
  const oldValues = change.before.data();
  const newValues = change.after.data();

  //handle when the assignments are submitted
  if (newValues.status == 'submitted') {
    // we want to grade this assignment and put it into a graded state
    await new_gradeAssignment(change.after);
  }
  else {
    return;
  }
})

async function new_gradeAssignment(assignmentDoc) {
  // get the assignment timeline
  const timelineDoc = await admin.firestore().collection('ACT-Assignment-Timelines').doc(assignmentDoc.id).get();
  const timeline = timelineDoc.exists ? timelineDoc.data().timeline : [];

  const questionDocs = await Promise.all(assignmentDoc.data().questions.map(async (questionID) => {
    return admin.firestore().collection('ACT-Question-Data').doc(questionID).get();
  }));

  // group the questions together by group
  let groupedQuestions = [];
  // go through the question docs and find groups of questions if applicable
  while (questionDocs.length > 0) {
    const currentDoc = questionDocs[0];
    let groupedQuestionDocs;
    // if the question is grouped
    if (currentDoc.data().isGroupedByPassage) {
      // get the other question that are grouped with this question
      const commonPassage = currentDoc.data().passage;
      groupedQuestionDocs = questionDocs.filter(doc => doc.data().passage == commonPassage);
    }
    else {
      // just pass this question in
      groupedQuestionDocs = [currentDoc];
    }

    // add this grouping into the master copy and remove the group from the docs
    groupedQuestions.push(groupedQuestionDocs);
    groupedQuestionDocs.forEach(question => {
      questionDocs.splice(questionDocs.findIndex(doc => question.id == doc.id), 1)
    })
  }


  // filter out groups where none of the questions where started on the timeline
  // only if this assignment was dynamic and the question is in the question bank
  // we'll remove these questions from the assignment question list
  const startedQuestions = groupedQuestions.filter(group => {
    if (!assignmentDoc.data().topicProportions) {
      return true;
    }
    // loop through each question
    for (let i = 0; i < group.length; i++) {
      const question = group[i];

      // determine if this question has been started or if it is not part of the question bank
      for (let j = timeline.length - 1; j > -1; j--) {
        const event = timeline[j]
        // if the question has been started then the entire group has been started
        if (!question.isQuestionBank || (event.question === question.id && event.type === 'start')) {
          return true;
        }
      }
    }

    return false;
  })

  // go through all the question and grade each
  const isAnswerCorrectList = startedQuestions.flat().map(questionDoc => {
    const questionAnswer = questionDoc.data().answer;

    // find the last timeline answer for this question
    for (let i = timeline.length - 1; i > -1; i--) {
      // if an answer is found return if the timeline answer matches the question answer
      if (timeline[i].question === questionDoc.id && timeline[i].type === 'answer') {
        return timeline[i].data === questionAnswer
      }
    }

    // if no answer was found return false
    return false
  });

  const numAnswersCorrect = isAnswerCorrectList.reduce((prev, curr) => prev + curr);

  // update the assignment with graded date
  let gradedData = {
    status: 'graded',
    score: numAnswersCorrect,
    questions: startedQuestions.flat().map(doc => doc.id)
  }

  // get the scaled score if applicable
  if (assignmentDoc.data().scaledScoreSection) {
    // get the section doc for the scaled scores
    const sectionDoc = await admin.firestore().collection('ACT-Section-Data').doc(assignmentDoc.data().scaledScoreSection).get();
    // determine the scaled score for this score
    const scaledScores = sectionDoc.data().scaledScores;
    let scaledScoreWinner = null;
    let winnerScore = Infinity;
    for (const scaledScore in scaledScores) {
      const minScore = scaledScores[scaledScore];
      if (minScore != -1) {
        let score = numAnswersCorrect - minScore
        if (score >= 0 && score < winnerScore) {
          scaledScoreWinner = Number(scaledScore);
        }
      }
    }

    if (scaledScoreWinner) {
      gradedData.scaledScore = scaledScoreWinner;
    }
  }

  // update the assignment doc
  assignmentDoc.ref.update(gradedData);
}


///////////////////
// OLD FUNCTIONS //
///////////////////

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

exports.checkAssignmentsNow = functions.https.onRequest(async (request, response) => {
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

  response.send('all assignments have been checked');
})