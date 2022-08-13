async function sectionSelectedCallback(e) {
  // remove the current topic options
  removeAllChildNodes(document.getElementById('topics'));

  // get the section
  const section = e.target.value;

  // query for the curriculum topics of this section
  const curriculumQuery = await firebase.firestore()
  .collection('ACT-Curriculum-Data')
  .where('sectionCode', '==', section)
  .get();

  const sortedCurriculumDocs = curriculumQuery.docs.sort((a,b) => sortAlphabetically(a.data().code, b.data().code));

  addSelectOptions(
    document.getElementById('topics'),
    sortedCurriculumDocs.map(doc => doc.id),
    sortedCurriculumDocs.map(doc => doc.data().code)
  );

  document.getElementById('topics').dispatchEvent(new Event('change'));
}

async function topicSelectedCallback(e) {
  // remove the curriculum content
  removeAllChildNodes(document.getElementById('curriculum-content'));

  // get the topic
  const topic = e.target.value;

  // get the curriculum topic
  const curriculumDoc = await firebase.firestore()
  .collection('ACT-Curriculum-Data')
  .doc(topic)
  .get();

  document.getElementById('curriculum-content').innerHTML = curriculumDoc.data().content;
}

function sortAlphabetically(a,b) {
	a = a.toString();
	b = b.toString();

	if (a < b) {
		return -1;
	}
	if (a == b) {
		return 0;
	}
	if (a > b) {
		return 1
	}
}
