const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.onCreateTopicQuestionList = functions.firestore
.document('/ACT-Tests/{questionID}')
.onCreate(async (snap, context) => {
  const questionData = snap.data();

  // check if the document is a question and if it has values in the topcs array
  if (questionData.type != 'question' || questionData.topic.length == 0) { return };

  //for each topics
  const data = {}
  questionData.topic.forEach(topic => {
    data[topic] = admin.firestore.FieldValue.arrayUnion(`${questionData.test}:${questionData.passage.toString().padStart(2, '0')}:${questionData.problem.toString().padStart(2, '0')}`);
  });
  Object.keys(data).length > 0 && await admin.firestore().collection('ACT-Aggregates').doc(questionData.section).update(data);
  return;
});

exports.onUpdateTopicQuestionList = functions.firestore
.document('/ACT-Tests/{questionID}')
.onUpdate(async (change, context) => {
  const oldData = change.before.data();
  const newData = change.after.data();

  // check if the new doc is a question doc
  if (newData.type != 'question') { return };

  // compare the old topics to the new ones and decide what needs to be removed and added
  let newTopicsExistingIndices = [];
  let updateData = {};
  oldData.topic.forEach(oldTopic => {
    const newIndex = newData.topic.indexOf(oldTopic);
    if (newIndex != -1) {
      newTopicsExistingIndices.push(newIndex);
    }
    else {
      // set up the removeData object since this old topic is no longer in the topic list
      updateData[oldTopic] = admin.firestore.FieldValue.arrayRemove(`${oldData.test}:${oldData.passage.toString().padStart(2, '0')}:${oldData.problem.toString().padStart(2, '0')}`)
    }
  })

  // every index not found in the new data add this to the add data
  newData.topic.forEach((newTopic, newIndex) => {
    if (!newTopicsExistingIndices.includes(newIndex)) {
      updateData[newTopic] = admin.firestore.FieldValue.arrayUnion(`${newData.test}:${newData.passage.toString().padStart(2, '0')}:${newData.problem.toString().padStart(2, '0')}`)
    }
  })

  // perform the update operation on the database
  Object.keys(updateData).length > 0 && await admin.firestore().collection('ACT-Aggregates').doc(newData.section).update(updateData);
  return;
});

exports.onDeleteTopicQuestionList = functions.firestore
.document('/ACT-Tests/{questionID}')
.onDelete(async (snap, context) => {
  const questionData = snap.data();

  // check if the document is a question and if it has values in the topcs array
  if (questionData.type != 'question') { return };

  //for each topics
  const data = {}
  questionData.topic.forEach(topic => {
    data[topic] = admin.firestore.FieldValue.arrayRemove(`${questionData.test}:${questionData.passage.toString().padStart(2, '0')}:${questionData.problem.toString().padStart(2, '0')}`);
  });
  Object.keys(data).length > 0 && await admin.firestore().collection('ACT-Aggregates').doc(questionData.section).update(data);
  return;
});

exports.resetTopicQuestionAggregate = functions.https.onRequest(async (req, res) => {
  // go through all of the questions and build the aggregate data
  const questionSnapshot = await admin.firestore().collection('ACT-Tests').where('type', '==', 'question').where('topic', '!=', []).get();

  let data = {
    english : {},
    math : {},
    reading : {},
    science : {}
  }

  questionSnapshot.forEach(questionDoc => {
    const questionData = questionDoc.data();
    questionData.topic.forEach(topic => {
      //make an array in this topic's place if one does not already exist
      if (!data[questionData.section][topic]) {
        data[questionData.section][topic] = [];
      }
      data[questionData.section][topic].push(`${questionData.test}:${questionData.passage.toString().padStart(2, '0')}:${questionData.problem.toString().padStart(2, '0')}`)
    })
  })

  // save the data to the database
  await Promise.all([
    Object.keys(data.english).length > 0 && admin.firestore().collection('ACT-Aggregates').doc('english').update(data.english),
    Object.keys(data.math).length > 0 && admin.firestore().collection('ACT-Aggregates').doc('math').update(data.math),
    Object.keys(data.reading).length > 0 && admin.firestore().collection('ACT-Aggregates').doc('reading').update(data.reading),
    Object.keys(data.science).length > 0 && admin.firestore().collection('ACT-Aggregates').doc('science').update(data.science)
  ])

  res.send('all done')
})

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