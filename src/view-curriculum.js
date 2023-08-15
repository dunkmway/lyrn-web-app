import "./_authorization";
import app from "./_firebase";
import { collection, doc, getFirestore, query, where, getDocs, getDoc } from "firebase/firestore"

const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', initialSetup);

function initialSetup() {
  document.getElementById('sections').addEventListener('change', sectionSelectedCallback);
  document.getElementById('topics').addEventListener('change', topicSelectedCallback);
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

/**
 * 
 * @param {HTMLElement} selectElement the select element that should be populated with options
 * @param {Array} optionValues the options' values
 * @param {Array} optionTexts the options' text contents
 */
function addSelectOptions(selectElement, optionValues, optionTexts) {
  //check that the values and texts match in length
  if (optionValues.length != optionTexts.length) {throw "option values and options texts must have the same number of elements"}
  
  optionValues.forEach((optionValue, index) => {
    let option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionTexts[index];
    selectElement.appendChild(option);
  });
}

async function sectionSelectedCallback(e) {
  // remove the current topic options
  removeAllChildNodes(document.getElementById('topics'));

  // get the section
  const section = e.target.value;

  // query for the curriculum topics of this section
  const curriculumQuery = await getDocs(
    query(
      collection(db, 'ACT-Curriculum-Data'),
      where('sectionCode', '==', section)
    )
  );
  
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
  const curriculumDoc = await getDoc(doc(db, 'ACT-Curriculum-Data', topic));

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
