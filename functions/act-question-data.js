const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.onCreateTopicQuestion = functions.firestore
.document('/ACT-Question-Data/{questionID}')
.onCreate(async (snap, context) => {
  const questionData = snap.data();

  // check if the document is a question and if it has values in the topcs array
  if (!questionData.topic) { return };

  await admin.firestore().collection('ACT-Curriculum-Data').doc(questionData.topic).update({
    numQuestions: admin.firestore.FieldValue.increment(1)
  })
  return;
});

exports.onUpdateTopicQuestion = functions.firestore
.document('/ACT-Question-Data/{questionID}')
.onUpdate(async (change, context) => {
  const oldData = change.before.data();
  const newData = change.after.data();

  // if the topic hasn't changed then do nothing
  if (oldData.topic == newData.topic) { return }

  // if it has changed then decrement the old topic
  await admin.firestore().collection('ACT-Curriculum-Data').doc(oldData.topic).update({
    numQuestions: admin.firestore.FieldValue.increment(-1)
  })
  // and increment the new topic
  await admin.firestore().collection('ACT-Curriculum-Data').doc(newData.topic).update({
    numQuestions: admin.firestore.FieldValue.increment(1)
  })

  return;
});

exports.onDeleteTopicQuestion = functions.firestore
.document('/ACT-Question-Data/{questionID}')
.onDelete(async (snap, context) => {
  const questionData = snap.data();

  if (!questionData.topic) { return };

  await admin.firestore().collection('ACT-Curriculum-Data').doc(questionData.topic).update({
    numQuestions: admin.firestore.FieldValue.increment(-1)
  })
  return;
});