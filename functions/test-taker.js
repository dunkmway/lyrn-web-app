const functions = require("firebase-functions");
const admin = require("firebase-admin");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.secret);

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

exports.sendAssignmentCloseReminder = functions.pubsub.schedule('0 8 * * *').timeZone('America/Denver').onRun(async (context) => {
  // query for all assignments that close within the next 24 hours
  const startOfTomorrow = new Date(new Date().setHours(24,0,0,0));
  const endOfTomorrow = new Date(new Date().setHours(48,0,0,0));

  const assignmentQuery = await admin.firestore().collection('Section-Assignments')
  .where('close', '>=', startOfTomorrow)
  .where('close', '<', endOfTomorrow)
  .get();

  // filter out the assignments that have already been started
  const assignmentDocs = assignmentQuery.docs.filter(doc => doc.data().startedAt == undefined);

  // only send one email per student
  const students = Object.keys(assignmentDocs.reduce((prev, curr) => {
    prev[curr.data().student] = true;
    return prev;
  }, {}));

  await Promise.allSettled(students.map(student => sendAssignmentCloseReminderEmail(student)));

  return;
});

exports.sendAssignmentCloseReminderNow = functions.https.onRequest(async (request, response) => {
  const startOfTomorrow = new Date(new Date().setHours(0,0,0,0));
  const endOfTomorrow = new Date(new Date().setHours(24,0,0,0));

  console.log(startOfTomorrow)
  console.log(endOfTomorrow)

  const assignmentQuery = await admin.firestore().collection('Section-Assignments')
  .where('close', '>=', startOfTomorrow)
  .where('close', '<', endOfTomorrow)
  .get();

  // filter out the assignments that have already been started
  const assignmentDocs = assignmentQuery.docs.filter(doc => doc.data().startedAt == undefined);

  console.log(assignmentDocs.map(doc => doc.data()));

  // only send one email per student
  const students = Object.keys(assignmentDocs.reduce((prev, curr) => {
    prev[curr.data().student] = true;
    return prev;
  }, {}));

  await Promise.allSettled(students.map(student => sendAssignmentCloseReminderEmail(student)));

  response.send('good');
})

function assignmentCloseReminderEmail(userUID) {
return `
<head>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Work+Sans:300,600&display=swap');
  </style>
</head>
<body style="font-family: 'proxima-nova', sans-serif;">
  <div id="email" style="width:600px;margin: auto;background:white;">

    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td bgcolor="white" align="right" style="color:#27c03a; border-bottom: 2px solid #27c03a;">
          <a href="https://lyrnwithus.com">
            <img src="https://lyrnwithus.com/Images/Lyrn_Logo_Green.png" alt="Lyrn Logo" style="height: 3em;">
          </a>
        </td>
      </tr>
    </table>
  
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td style="padding: 30px 30px 30px 60px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">Assignment Reminder</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">
           You have an assignment that is going to close tomorrow. Below is the link to access your test taker and complete the assignment.
          </p>
        </td> 
      </tr>
    </table>

    <table role="presentation" border="0" width="100%" cellspacing="0"  style="margin-bottom: 2em;">
      <tr>
        <td align="center">
          <table role="presentation" align="center" border="0" cellspacing="0">
            <tr>
              <td align="center" bgcolor="#27c03a" style="border-radius: .5em;">
                <a style="font-size: 1em; text-decoration: none; color: white; padding: .5em 1em; border-radius: .5em; display: inline-block; border: 1px solid #27c03a;" href="https://lyrnwithus.com/test-taker?student=${userUID}">Open Test Taker</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" border="0" width="100%">
      <tr>
        <td bgcolor="#EAF0F6" align="center" style="padding: 30px 30px;">
          <h2 style="font-size: 28px; margin:0 0 20px 0;">We're here to help</h2>
          <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Give us a call or text to learn more about our programs. We can't wait to start Lyrning with you!</p>
          <a href="tel:+13853000906" style="text-decoration: underline; font-weight: bold; color: #253342;">(385) 300-0906</a>
        </td>
      </tr>
    </table>
    
    <table role="presentation" border="0" width="100%" cellspacing="0">
      <tr>
        <td class="footer" bgcolor="#F5F8FA" style="padding: 30px 30px;">
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/terms">Terms and Conditions</a>
          <a style="font-size: 12px; color: #99ACC2; margin-right: 1em;" href="lyrnwithus.com/privacy">Privacy Policy</a>
          <p style="font-size: 12px; color: #99ACC2;">Copyright © 2022 Advanced Education Solutions LLC. All rights reserved.</p>      
        </td>
      </tr>
    </table> 
  </div>
</body>
`
}

async function sendAssignmentCloseReminderEmail(userUID) {
  // get the user's doc
  const userDoc = await admin.firestore().collection('Users').doc(userUID).get();
  if (userDoc.data().parents) {
    const userParentDoc = await admin.firestore().collection('Users').doc(userDoc.data().parents[0]).get();
    if (userParentDoc.data().email) {
      await sgMail.send({
        to: userParentDoc.data().email,
        from: {
          email: 'contact@lyrnwithus.com',
          name: 'Lyrn Contact'
        },
        subject: 'Lyrn assignment due tomrrow',
        text: `You have an assignment that is about to close tomorrow. Below is the link to access your test taker to complete the assignment.\n
        https://lyrnwithus.com/test-taker?student=${userUID}`,
        html: assignmentCloseReminderEmail(userUID)
      });
    }
  }

  if (userDoc.data().email) {
    await sgMail.send({
      to: userDoc.data().email,
      from: {
        email: 'contact@lyrnwithus.com',
        name: 'Lyrn Contact'
      },
      subject: 'Lyrn assignment due tomrrow',
      text: `You have an assignment that is about to close tomorrow. Below is the link to access your test taker to complete the assignment.\n
      https://lyrnwithus.com/test-taker?student=${userUID}`,
      html: assignmentCloseReminderEmail(userUID)
    });
  }
}