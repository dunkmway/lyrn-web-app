const debug = false

let tests = [];
const date = new Date()
let testList = document.getElementById('testList')
let dom_section = document.getElementById('sectionList')
let workingText = document.getElementById('passageText')
let title = document.getElementById('passageTitle')
let passageNumber = document.getElementById('passageList')
let dom_topic = document.getElementById('topic')
let dom_modifier = document.getElementById('modifier')
let dom_questionList = document.getElementById('questionList')
let dom_labelParagraphs = document.getElementById('labelParagraphs')
let dom_pText = document.getElementById('pText')
let dom_qList = document.getElementById('qList')
let dom_reference = document.getElementById('passageReference')
let dom_questionText = document.getElementById('questionText')
let dom_answer1 = document.getElementById('answer1')
let dom_answer2 = document.getElementById('answer2')
let dom_answer3 = document.getElementById('answer3')
let dom_answer4 = document.getElementById('answer4')
let dom_answer5 = document.getElementById('answer5')
//let dom_subTopic = document.getElementById('subTopic')
let editorState = 'test'
let passageReferences = []
let storage = firebase.storage();
let passageText = ''
let maxPassageImageNumber = -1;
let maxQuestionImageNumber = -1;
let maxAnswerImageNumber = [-1, -1, -1, -1, -1]
let shouldMakeBox = false

let passageImages = []
let questionImages = []
let answerImages = []

function checkThatTestExists(test) {
	const ref = firebase.firestore().collection('ACT-Tests').where('type', '==', 'test').where('test', '==', test.toUpperCase())
	return ref.get()
	.then((querySnapshot) => {
		if (querySnapshot.size > 0) {
			return true
		}
		else {
			return false
		}
	})
}

function checkThatPassageExists(test, section, passage) {
	if (debug == true) {
		console.log('checkThatPassageExists(\'' + test + '\', \'' + section + '\', \'' + passage + '\')')
	}
	const ref = firebase.firestore().collection('ACT-Tests').where('type', '==', 'passage').where('test', '==', test.toUpperCase()).where('section', '==', section).where('passageNumber', '==', passage)
	return ref.get()
	.then((querySnapshot) => {
		let id = ''
		if (querySnapshot.size == 1) {
			querySnapshot.forEach((doc) => {
				id = doc.id
				//return doc.id
			})
		}
		else {
			return false
		}
		return id
	})
}

function getTests() {
	const ref = firebase.firestore().collection('ACT-Tests').where('type', '==', 'test')
	return ref.get()
	.then((querySnapshot) => {
		querySnapshot.forEach((doc) => {
			let data = doc.data();
			if (!tests.includes(data['test'])) {
				tests.push(data['test'])
			}
		})
	})
}

/*
function addTopic(section, topic, subTopics = undefined, type = 'topic') {

	if (section != undefined && topic != undefined && subTopics != undefined) {

		if (subTopics != '') {
			data = {
				'section' : section,
				'topic' : topic,
				'subTopics' : subTopics.split(', '),
				'type' : type
			}
		}
		else {
			data = {
				'section' : section,
				'topic' : topic,
				'subTopics' : [],
				'type' : type
			}
		}

		ref = firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics').doc()
		ref.set(data)
		.then(() => {
			console.log('Set', section, ':', topic, ':', subTopics.split(', '))
		})
	}
}
*/

/*
addTopic('english', 'Redundancy', '')
addTopic('english', 'Simplicity', '')
addTopic('english', 'Pronoun Ambiguity', '')
addTopic('english', 'Adding / Deleting / Revising Sentences', '')
addTopic('english', 'Main Idea', '')
addTopic('english', 'Subject-Verb Agreement', '')
addTopic('english', 'Tense', '')
addTopic('english', 'Noun-Pronoun Agreement', '')
addTopic('english', 'Adding Sentence', '')
addTopic('english', 'Transition Phrases', '')
addTopic('english', 'Ordering', '')
addTopic('english', 'Phrase Placement', '')
addTopic('english', 'Splitting a paragraph', '')
addTopic('english', 'IC, DC, Phrases', '')
addTopic('english', 'Parts of Speech', '')
addTopic('english', 'Subject, Verb, Object', '')
addTopic('english', 'Vocab and Expressions', '', 'modifier')
addTopic('english', 'Vocab and Expressions', '')
addTopic('english', 'Connotation', '')
addTopic('english', 'Active and Passive Voice', '')
addTopic('english', 'Tone and Emphasis', '')
addTopic('english', 'Commas', '')
addTopic('english', 'Apostrophes', '')
addTopic('english', 'Citing Quotations', '')
addTopic('english', 'Semicolon', '')
addTopic('english', 'Sentence Composition', '')
addTopic('english', 'Identify IC, DC, Phrases', '')
addTopic('english', 'Transition words', '')
addTopic('english', 'Homophones', '')
addTopic('english', 'Preposition', '')
addTopic('english', 'Parallelism', '')
addTopic('english', 'Transitive vs Intransitive', '')
addTopic('english', 'Concrete vs Abstract adjectives', '')
addTopic('english', 'Identify Parts of Speech', '')
addTopic('english', 'Conjunctions', '')
addTopic('english', 'NOT', '', 'modifier')

addTopic('math', 'Word Problems', '', 'modifier')
addTopic('math', 'Arithmetic', '')
addTopic('math', 'Functions', '')
addTopic('math', 'Polygons', '')
addTopic('math', 'Trigonometry', '')
addTopic('math', 'Units', '')
addTopic('math', 'Probability', '')
addTopic('math', 'Logic', '')
addTopic('math', 'Mean', '')
addTopic('math', 'Percentages', '')
addTopic('math', 'Statistics', '')
addTopic('math', 'Proportions', '')
addTopic('math', 'Exponents', '')
addTopic('math', 'Transformations', '')
addTopic('math', 'Linear Equations - Algebra', '')
addTopic('math', 'Quadratic Equations - Algebra', '')
addTopic('math', 'Rational Functions', '')
addTopic('math', 'Midpoint', '')
addTopic('math', 'Triangles', '')
addTopic('math', 'Ellipses', '')
addTopic('math', 'Circles', '')
addTopic('math', 'Complex Numbers', '')
addTopic('math', 'Inequalities', '')
addTopic('math', 'Matrices', '')
addTopic('math', 'System of Equations', '')
addTopic('math', 'Combinatorics', '')
addTopic('math', 'Euclidean Geometry', '')
addTopic('math', 'Linear Equations - Geometry', '')
addTopic('math', 'Radicals', '')
addTopic('math', 'Real World Functions', '')
addTopic('math', 'Sets', '')
addTopic('math', 'Sequences and Series', '')
addTopic('math', 'Function Transformations', '')
addTopic('math', 'Logarithms', '')
addTopic('math', 'Number Theory', '')
addTopic('math', 'Hyperbolas', '')
addTopic('math', 'Quadratic Equations - Geometry', '')
addTopic('math', 'Vectors', '')
addTopic('math', 'Absolute Value', '')
addTopic('math', 'Distributing', '')
addTopic('math', 'Fractions', '')
addTopic('math', 'Geometry Fundamentals', '')

addTopic('reading', 'Ambiguous Pronouns', '')
addTopic('reading', 'Phrase Interpretation', '')
addTopic('reading', 'Multiple Word Definition', '')
addTopic('reading', 'Essay', '')
addTopic('reading', 'Paragraph', '')
addTopic('reading', 'Point of View', '')
addTopic('reading', 'Findable answer', '')
addTopic('reading', 'Direct inference', '')

addTopic('science', 'Graph Reading', '')
addTopic('science', 'Variable Relationships', '')
addTopic('science', 'Extrapolation', '')
addTopic('science', 'Reasoned Answer', '')
addTopic('science', 'Variable Types', '')
addTopic('science', 'Experimental Design', '')
addTopic('science', 'Conflicting Viewpoints', '')
addTopic('science', 'Modify the experiment', '')
*/



function initializeQuestionList(section) {
	let count = 40

	if (section.toLowerCase() == 'english') {
		count = 75;
	}
	else if (section.toLowerCase() == 'math') {
		count = 60;
	}

	// Delete the current list of questions
	while (dom_questionList.firstChild) {
		dom_questionList.removeChild(dom_questionList.firstChild)
	}

	// Add the needed questions
	for (let i = 0; i < count; i++) {
		dom_questionList.appendChild(createElement('option', [], ['value'], [i + 1], (i + 1).toString()))
	}
}

function initializeTopicList(section) {
  	$('.ui.dropdown').dropdown();

	const ref = firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics').where('section', '==', section).where('type', '==', 'topic')

	// Delete the current list of topics
	while (dom_topic.firstChild) {
		dom_topic.removeChild(dom_topic.firstChild)
	}

	let topics = []
	ref.get()
	.then((querySnapshot) => {
		querySnapshot.forEach((doc) => {
			topics.push(doc.data().topic)
		})

		topics.sort()
		dom_topic.appendChild(createElement('option', [], ['value'], [''], 'None Selected'))
		for (let i = 0; i < topics.length; i++) {
			dom_topic.appendChild(createElement('option', [], ['value'], [topics[i]], topics[i]))
		}
	})

	initializeModifierList(section);
}

function initializeModifierList(section) {
	const ref = firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics').where('section', '==', section).where('type', '==', 'modifier')

	// Delete the current list of topics
	while (dom_topic.firstChild) {
		dom_modifier.removeChild(dom_topic.firstChild)
	}

	let topics = []
	ref.get()
	.then((querySnapshot) => {
		querySnapshot.forEach((doc) => {
			topics.push(doc.data().topic)
		})

		topics.sort()
		dom_modifier.appendChild(createElement('option', [], ['value'], [''], 'None Selected'))
		for (let i = 0; i < topics.length; i++) {
			dom_modifier.appendChild(createElement('option', [], ['value'], [topics[i]], topics[i]))
		}
	})
}

/*function initializeSubTopicList(section, topic) {
	const ref = firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics').where('section', '==', section).where('topic', '==', topic)

	// Delete the current list of topics
	while (dom_subTopic.firstChild) {
		dom_subTopic.removeChild(dom_subTopic.firstChild)
	}

	let topics = []
	ref.get()
	.then((querySnapshot) => {
		querySnapshot.forEach((doc) => {
			topics = doc.data().subTopics
		})

		topics.sort()
		dom_subTopic.appendChild(createElement('option', [], ['value'], [''], 'None Selected'))
		for (let i = 0; i < topics.length; i++) {
			dom_subTopic.appendChild(createElement('option', [], ['value'], [topics[i]], topics[i]))
		}
	})

}*/

function initializeTestList() {
	// Delete the current list of tests
	while (testList.firstChild) {
		testList.removeChild(testList.firstChild)
	}

	// Add 'New Test'
	testList.appendChild(createElement('option', [], ['value'], ['newTest'], "New Test"))

	// Set the max year to the current year
	let testYear = document.getElementById('testYear')
	testYear.setAttribute('max', date.getFullYear())
	testYear.setAttribute('value', date.getFullYear())

	// Get the list of tests from firebase and update the HTML with the list (only add new values)
	return getTests()
	.then(() => {
		// Sort the tests
		tests.sort()

		// Add the remaining tests
		for (let i = 0; i < tests.length; i++) {
			testList.appendChild(createElement('option', [], ['value'], [tests[i]], tests[i]))
		}
	})

}

initializeTestList()

function addTest() {
	const ref = firebase.firestore().collection('ACT-Tests').doc()

	let test = document.getElementById('test')
	const numInts = test.value.replace(/\D/g, '').length
	let year = document.getElementById('testYear')
	let month = document.getElementById('testMonth')
	const data = {
		'test': test.value.toUpperCase(),
		'type': 'test',
		'year': parseInt(year.value),
		'month': month.value
	}

	if (test.value.length = 3 && parseInt(year.value) <= date.getFullYear() && parseInt(year.value) >= 1959 && (numInts == 1 || numInts == 2)) {
		checkThatTestExists(test.value)
			.then((testExists) => {
				if (testExists == false) {
					ref.set(data)
						.then(() => {
							initializeTestList()
								.then(() => {
									testList.selectedIndex = tests.indexOf(test.value.toUpperCase()) + 1
									testList.value = test.value.toUpperCase()
								})
							formDisplay('passage')
						})
						.catch((error) => {
							console.log(error)
						})
				}
			})
	}
	else {
		console.log("The test must have exactly 3 characters: B05, 76C, A10, etc. (1 - 2 letters and 1 - 2 numbers)")
	}
}

async function setPassageText(passageText, passageTitle = undefined, passageNumber = undefined, shouldLabelParagraphs = undefined, reference = undefined) {
	if (debug == true) {
		console.log('setPassageText(' + passageText + ', ' + passageTitle + ', ' + (passageNumber ?? 'undefined').toString() + ', ' + shouldLabelParagraphs.toString())
	}

	maxPassageImageNumber = 0

	let passageDiv = document.getElementById('pText')

	// Delete the current passage text
	while (passageDiv.firstChild) {
		passageDiv.removeChild(passageDiv.firstChild)
	}

	// Add the passage Number
	if (passageNumber != undefined) {
		const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
		passageDiv.appendChild(createElement('p', ['bold'], [], [], 'Passage ' + romanNumerals[passageNumber - 1]))
	}

	// Add the passage title
	let pCount = 1
	if (passageTitle != undefined && passageTitle != '') {
		let titleText = passageTitle.split(" ")
		for (let i = 0; i < titleText.length; i++) {
			passageDiv.appendChild(createElement('span', ['bold'], [], [], titleText[i]))
			passageDiv.appendChild(createElement('span', [], [], [], ' '))
		}

		if (shouldLabelParagraphs == true) {
			passageDiv.appendChild(createElement('p', ['bold', 'paragraphLabel'], [], [], '[' + pCount + ']'))
			pCount += 1
		}

		passageDiv.appendChild(createElement('p', [], [], [], ''))

	}

	// Add the passage Text
	let text = passageText.split(" ")
	passageImages = []
	for (let i = 0; i < text.length; i++) {
		if (!text[i].includes('<image')) {
			if (!text[i].includes('&mdash;') && !text[i].includes('—')) {
				passageDiv.appendChild(createElement('span', ['highlight'], ['onclick'], ['toggleParagraph(this)'], text[i]))
				passageDiv.appendChild(createElement('span', [], [], [], ' '))
				if (shouldLabelParagraphs == true && text[i] == '<p><p>') {
					passageDiv.appendChild(createElement('p', ['bold', 'paragraphLabel'], [], [], '[' + pCount + ']'))
					pCount += 1
				}
			}
			else {
				let subSplit = text[i].split('&mdash;')
				if (subSplit.length <= 1) {
					subSplit = text[i].split('—')
				}

				passageDiv.appendChild(createElement('span', ['highlight'], ['onclick'], ['toggleParagraph(this)'], subSplit[0]))
				passageDiv.appendChild(createElement('span', ['highlight'], ['onclick'], ['toggleParagraph(this)'], '—'))
				passageDiv.appendChild(createElement('span', ['highlight'], ['onclick'], ['toggleParagraph(this)'], subSplit[1]))
				passageDiv.appendChild(createElement('span', [], [], [], ' '))
			}
		}
		else {
			const imageLocation = parseInt(text[i].replace('<image', '').replace('>'));
			if (imageLocation > maxPassageImageNumber) {
				maxPassageImageNumber = imageLocation
			}
			//if (imageLocation < passageImages.length) {
			try {
				const url = await getImage(testList.value, dom_section.value, passageNumber, imageLocation)
				passageDiv.appendChild(createElement('img', ['textImage'], ['src', 'id', 'style'], [url, 'image' + (imageLocation).toString(), 'width:100%;'], ''))
				passageImages.push(url)
			}
			catch {
				console.log("You done messed up AA-ron")
			}
		}
	}

	if (reference != undefined && reference != '') {
		passageDiv.appendChild(createElement('p', [], [], [], ''))
		passageDiv.appendChild(createElement('p', [], [], [], reference))
	}

  	/*let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Programs/ACT/Images/0xxnCYDh8XWPd3f4fKd9GxeCKtB2')
  	ref.getDownloadURL()
  	.then((url) => {
		passageDiv.appendChild(createElement('img', [], ['src', 'id', 'style'], ['https://firebasestorage.googleapis.com/v0/b/lyrn-web-app.appspot.com/o/Programs%2FACT%2FImages%2F0xxnCYDh8XWPd3f4fKd9GxeCKtB2?alt=media&token=fe90669a-3a12-41b6-b330-6a6f68f106ff', 'image1', 'width:100%;'], ''))
  	})
  	.catch((error) => {
    	console.log("No image found")
  	})*/
}

function submitPassageText() {
	if (debug == true) {
		console.log('submitPassageText()')
	}
	// Get the ref location
	const ref = firebase.firestore().collection('ACT-Tests')
	
	// Prepare the data
	let section = document.getElementById('sectionList')
	let text = document.getElementById('passageText')
	data = {
		'test' : testList.value.toUpperCase(),
		'section' : section.value,
		'type' : 'passage',
		'title' : title.value,
		'passageText' : text.value.replaceAll('\n', ' '),
		'passageNumber' : parseInt(passageNumber.value),
		'passageImages' : passageImages,
		'shouldLabelParagraphs': (dom_labelParagraphs.value == 0 ? false : true),
		'reference' : dom_reference.value
	}

	// Validate then set the data
	if (text.value.length > 0) {
	checkThatTestExists(testList.value)
		.then((testExists) => {
			if (testExists == true) {
				checkThatPassageExists(testList.value, section.value, parseInt(passageNumber.value))
					.then((passageExists) => {
						if (passageExists == false) {
							ref.doc().set(data)
							.then(() => {console.log("Set")})
						}
						else {
							ref.doc(passageExists).set(data)
							.then(() => {
								console.log("Updated")
								setPassageText(text.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
							})
						}
					})
			}
			else {
				console.log('How did you get here?!')
			}
		})
	}
}

function formDisplay(event) {
	editorState = event

	if (event == 'test') {
		document.getElementById('test').classList.remove('hidden')
		document.getElementById('testYear').classList.remove('hidden')
		document.getElementById('testMonth').classList.remove('hidden')
		document.getElementById('testLabel').classList.remove('hidden')
		document.getElementById('testYearLabel').classList.remove('hidden')
		document.getElementById('testMonthLabel').classList.remove('hidden')
		document.getElementById('testAdd').classList.remove('hidden')

		document.getElementById('sectionList').classList.add('hidden')
		document.getElementById('sectionListLabel').classList.add('hidden')

		document.getElementById('passageList').classList.add('hidden')
		document.getElementById('passageListLabel').classList.add('hidden')
		document.getElementById('passageText').classList.add('hidden')
		document.getElementById('passageTextLabel').classList.add('hidden')
		document.getElementById('passageTitle').classList.add('hidden')
		document.getElementById('passageTitleLabel').classList.add('hidden')
		document.getElementById('passageAdd').classList.add('hidden')
		document.getElementById('passageShow').classList.add('hidden')
		document.getElementById('labelParagraphs').classList.add('hidden')
		document.getElementById('labelParagraphsLabel').classList.add('hidden')
		document.getElementById('passageReference').classList.add('hidden')
		document.getElementById('passageReferenceLabel').classList.add('hidden')

		document.getElementById('questionAdd').classList.add('hidden')
		document.getElementById('questionShow').classList.add('hidden')
		document.getElementById('questionList').classList.add('hidden')
		document.getElementById('questionListLabel').classList.add('hidden')
		document.getElementById('topic').classList.add('hidden')
		document.getElementById('topic').parentNode.style = 'display:none'
		document.getElementById('topicLabel').classList.add('hidden')
		//document.getElementById('subTopic').classList.add('hidden')
		//document.getElementById('subTopicLabel').classList.add('hidden')
		document.getElementById('modifier').classList.add('hidden')
		document.getElementById('modifier').parentNode.style = 'display:none'
		document.getElementById('modifierLabel').classList.add('hidden')

		document.getElementById('questionText').classList.add('hidden')
		document.getElementById('questionTextLabel').classList.add('hidden')
		document.getElementById('answer1').classList.add('hidden')
		document.getElementById('answer1Image').classList.add('hidden')
		document.getElementById('answer1Label').classList.add('hidden')
		document.getElementById('answer2').classList.add('hidden')
		document.getElementById('answer2Image').classList.add('hidden')
		document.getElementById('answer2Label').classList.add('hidden')
		document.getElementById('answer3').classList.add('hidden')
		document.getElementById('answer3Image').classList.add('hidden')
		document.getElementById('answer3Label').classList.add('hidden')
		document.getElementById('answer4').classList.add('hidden')
		document.getElementById('answer4Image').classList.add('hidden')
		document.getElementById('answer4Label').classList.add('hidden')
		document.getElementById('answer5').classList.add('hidden')
		document.getElementById('answer5Image').classList.add('hidden')
		document.getElementById('answer5Label').classList.add('hidden')

		removeChildren('answers')

		document.getElementById('answers').classList.add('hidden')
		document.getElementById('answerShow').classList.remove('hidden')
		document.getElementById('answerAdd').classList.add('hidden')
	}
	else if (event == 'passage') {
		document.getElementById('test').classList.add('hidden')
		document.getElementById('testYear').classList.add('hidden')
		document.getElementById('testMonth').classList.add('hidden')
		document.getElementById('testLabel').classList.add('hidden')
		document.getElementById('testYearLabel').classList.add('hidden')
		document.getElementById('testMonthLabel').classList.add('hidden')
		document.getElementById('testAdd').classList.add('hidden')

		document.getElementById('sectionList').classList.remove('hidden')
		document.getElementById('sectionListLabel').classList.remove('hidden')

		document.getElementById('passageList').classList.remove('hidden')
		document.getElementById('passageListLabel').classList.remove('hidden')
		document.getElementById('passageText').classList.remove('hidden')
		document.getElementById('passageTextLabel').classList.remove('hidden')
		document.getElementById('passageTitle').classList.remove('hidden')
		document.getElementById('passageTitleLabel').classList.remove('hidden')
		document.getElementById('passageAdd').classList.remove('hidden')
		document.getElementById('passageShow').classList.add('hidden')

		if (dom_section.value == 'reading' || dom_section.value == 'science') {
			document.getElementById('passageReference').classList.remove('hidden')
			document.getElementById('passageReferenceLabel').classList.remove('hidden')
		}

		if (dom_section.value == 'english') {
			document.getElementById('labelParagraphs').classList.remove('hidden')
			document.getElementById('labelParagraphsLabel').classList.remove('hidden')
		}

		document.getElementById('questionShow').classList.remove('hidden')
		document.getElementById('questionAdd').classList.add('hidden')
		document.getElementById('questionList').classList.add('hidden')
		document.getElementById('questionListLabel').classList.add('hidden')
		document.getElementById('topic').classList.add('hidden')
		document.getElementById('topic').parentNode.style = 'display:none'
		document.getElementById('topicLabel').classList.add('hidden')
		//document.getElementById('subTopic').classList.add('hidden')
		//document.getElementById('subTopicLabel').classList.add('hidden')
		document.getElementById('modifier').classList.add('hidden')
		document.getElementById('modifier').parentNode.style = 'display:none'
		document.getElementById('modifierLabel').classList.add('hidden')

		document.getElementById('questionText').classList.add('hidden')
		document.getElementById('questionTextLabel').classList.add('hidden')
		document.getElementById('answer1').classList.add('hidden')
		document.getElementById('answer1Image').classList.add('hidden')
		document.getElementById('answer1Label').classList.add('hidden')
		document.getElementById('answer2').classList.add('hidden')
		document.getElementById('answer2Image').classList.add('hidden')
		document.getElementById('answer2Label').classList.add('hidden')
		document.getElementById('answer3').classList.add('hidden')
		document.getElementById('answer3Image').classList.add('hidden')
		document.getElementById('answer3Label').classList.add('hidden')
		document.getElementById('answer4').classList.add('hidden')
		document.getElementById('answer4Image').classList.add('hidden')
		document.getElementById('answer4Label').classList.add('hidden')
		document.getElementById('answer5').classList.add('hidden')
		document.getElementById('answer5Image').classList.add('hidden')
		document.getElementById('answer5Label').classList.add('hidden')

		document.getElementById('answers').classList.add('hidden')
		document.getElementById('answerShow').classList.remove('hidden')
		document.getElementById('answerAdd').classList.add('hidden')

		removeChildren('answers')
		removeChildren('qNumbers')
		removeChildren('qList')
	}
	else if (event == 'question') {

		document.getElementById('test').classList.add('hidden')
		document.getElementById('testYear').classList.add('hidden')
		document.getElementById('testMonth').classList.add('hidden')
		document.getElementById('testLabel').classList.add('hidden')
		document.getElementById('testYearLabel').classList.add('hidden')
		document.getElementById('testMonthLabel').classList.add('hidden')
		document.getElementById('testAdd').classList.add('hidden')

		document.getElementById('sectionList').classList.remove('hidden')
		document.getElementById('sectionListLabel').classList.remove('hidden')

		document.getElementById('passageList').classList.remove('hidden')
		document.getElementById('passageListLabel').classList.remove('hidden')
		document.getElementById('passageText').classList.add('hidden')
		document.getElementById('passageTextLabel').classList.add('hidden')
		document.getElementById('passageTitle').classList.add('hidden')
		document.getElementById('passageTitleLabel').classList.add('hidden')
		document.getElementById('passageAdd').classList.add('hidden')
		document.getElementById('passageShow').classList.remove('hidden')
		document.getElementById('labelParagraphs').classList.add('hidden')
		document.getElementById('labelParagraphsLabel').classList.add('hidden')
		document.getElementById('passageReference').classList.add('hidden')
		document.getElementById('passageReferenceLabel').classList.add('hidden')

		document.getElementById('questionAdd').classList.remove('hidden')
		document.getElementById('questionShow').classList.add('hidden')
		document.getElementById('questionList').classList.remove('hidden')
		document.getElementById('questionListLabel').classList.remove('hidden')
		document.getElementById('topic').classList.remove('hidden')
		document.getElementById('topic').parentNode.style = ''
		document.getElementById('topicLabel').classList.remove('hidden')
		//document.getElementById('subTopic').classList.remove('hidden')
		//document.getElementById('subTopicLabel').classList.remove('hidden')
		document.getElementById('modifier').classList.remove('hidden')
		document.getElementById('modifier').parentNode.style = ''
		document.getElementById('modifierLabel').classList.remove('hidden')

		document.getElementById('questionText').classList.remove('hidden')
		document.getElementById('questionTextLabel').classList.remove('hidden')
		document.getElementById('answer1').classList.remove('hidden')
		document.getElementById('answer1Image').classList.remove('hidden')
		document.getElementById('answer1Label').classList.remove('hidden')
		document.getElementById('answer2').classList.remove('hidden')
		document.getElementById('answer2Image').classList.remove('hidden')
		document.getElementById('answer2Label').classList.remove('hidden')
		document.getElementById('answer3').classList.remove('hidden')
		document.getElementById('answer3Image').classList.remove('hidden')
		document.getElementById('answer3Label').classList.remove('hidden')
		document.getElementById('answer4').classList.remove('hidden')
		document.getElementById('answer4Image').classList.remove('hidden')
		document.getElementById('answer4Label').classList.remove('hidden')

		document.getElementById('answers').classList.add('hidden')
		document.getElementById('answerShow').classList.remove('hidden')
		document.getElementById('answerAdd').classList.add('hidden')

		// Display the 5th answer if on the math section
		let section = document.getElementById('sectionList').value
		if (section == 'math') {
			document.getElementById('answer5').classList.remove('hidden')
			document.getElementById('answer5Image').classList.remove('hidden')
			document.getElementById('answer5Label').classList.remove('hidden')
		}

		removeChildren('answers')

		let questionNumber = 1
		if (dom_questionList.value != '') {
			questionNumber = parseInt(dom_questionList.value)
		}
		initializeQuestionList(section)
		initializeTopicList(section)
		initializeFinishedQuestions(testList.value, section)

		initializeQuestion(questionNumber)

	}
	else if (event == 'answer') {
		document.getElementById('test').classList.add('hidden')
		document.getElementById('testYear').classList.add('hidden')
		document.getElementById('testMonth').classList.add('hidden')
		document.getElementById('testLabel').classList.add('hidden')
		document.getElementById('testYearLabel').classList.add('hidden')
		document.getElementById('testMonthLabel').classList.add('hidden')
		document.getElementById('testAdd').classList.add('hidden')

		document.getElementById('sectionList').classList.remove('hidden')
		document.getElementById('sectionListLabel').classList.remove('hidden')

		document.getElementById('passageList').classList.remove('hidden')
		document.getElementById('passageListLabel').classList.remove('hidden')
		document.getElementById('passageText').classList.add('hidden')
		document.getElementById('passageTextLabel').classList.add('hidden')
		document.getElementById('passageTitle').classList.add('hidden')
		document.getElementById('passageTitleLabel').classList.add('hidden')
		document.getElementById('passageAdd').classList.add('hidden')
		document.getElementById('passageShow').classList.remove('hidden')
		document.getElementById('labelParagraphs').classList.add('hidden')
		document.getElementById('labelParagraphsLabel').classList.add('hidden')
		document.getElementById('passageReference').classList.add('hidden')
		document.getElementById('passageReferenceLabel').classList.add('hidden')

		document.getElementById('questionAdd').classList.add('hidden')
		document.getElementById('questionShow').classList.remove('hidden')
		document.getElementById('questionList').classList.add('hidden')
		document.getElementById('questionListLabel').classList.add('hidden')
		document.getElementById('topic').classList.add('hidden')
		document.getElementById('topic').parentNode.style = 'display:none'
		document.getElementById('topicLabel').classList.add('hidden')
		//document.getElementById('subTopic').classList.remove('hidden')
		//document.getElementById('subTopicLabel').classList.remove('hidden')
		document.getElementById('modifier').classList.add('hidden')
		document.getElementById('modifier').parentNode.style = 'display:none'
		document.getElementById('modifierLabel').classList.add('hidden')

		document.getElementById('questionText').classList.add('hidden')
		document.getElementById('questionTextLabel').classList.add('hidden')
		document.getElementById('answer1').classList.add('hidden')
		document.getElementById('answer1Image').classList.add('hidden')
		document.getElementById('answer1Label').classList.add('hidden')
		document.getElementById('answer2').classList.add('hidden')
		document.getElementById('answer2Image').classList.add('hidden')
		document.getElementById('answer2Label').classList.add('hidden')
		document.getElementById('answer3').classList.add('hidden')
		document.getElementById('answer3Image').classList.add('hidden')
		document.getElementById('answer3Label').classList.add('hidden')
		document.getElementById('answer4').classList.add('hidden')
		document.getElementById('answer4Image').classList.add('hidden')
		document.getElementById('answer4Label').classList.add('hidden')
		document.getElementById('answer5').classList.add('hidden')
		document.getElementById('answer5Image').classList.add('hidden')
		document.getElementById('answer5Label').classList.add('hidden')

		document.getElementById('answers').classList.remove('hidden')
		document.getElementById('answerShow').classList.add('hidden')
		document.getElementById('answerAdd').classList.remove('hidden')

		displayAnswerKey()
		removeChildren('answers')
		removeChildren('qNumbers')
		removeChildren('qList')
	}
}

async function getAnswers(test, section) {
	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test)
	.where('section', '==', section)

	let data = {}

	const snapshot = await ref.get()
	if (snapshot.size > 0) {
		snapshot.forEach((doc) => {
			data[doc.data()['problem']] = doc.data()['correctAnswer']
		})
	}

	return data
}

async function displayAnswerKey() {
	let answers = await getAnswers(testList.value, dom_section.value)
	removeChildren('answers')
	let dom_answers = document.getElementById('answers')

	let count = 40;
	if (dom_section.value == 'english') {
		count = 75;
	}
	else if (dom_section.value == 'math') {
		count = 60;
	}

	for (let i = 0; i < Math.floor((count + 6) / 10); i++) {

		// Set the labels (10 at a time)
		let labelDiv = createElement('div', ['rows'], [], [], '')
		for (let j = 0; j < 10; j++) {
			if (i * 10 + j < count) {
				labelDiv.appendChild(createElement('label', [], ['id', 'for'], ['q' + (i * 10 + j + 1).toString() + 'Label', 'q' + (i * 10 + j + 1).toString()], (i * 10 + j + 1)));
			}
		}
		dom_answers.appendChild(labelDiv)

		// Set the inputs (10 at a time)
		let inputDiv = createElement('div', ['rows'], [], [], '')
		for (let j = 0; j < 10; j++) {
			if (i * 10 + j < count) {
				if (answers[i * 10 + j + 1]) {
					inputDiv.appendChild(createElement('input', [], ['id', 'value'], ['q' + (i * 10 + j + 1).toString(), answers[i * 10 + j + 1]], ''));
				}
				else {
					inputDiv.appendChild(createElement('input', [], ['id'], ['q' + (i * 10 + j + 1).toString()], ''));
				}
			}
		}
		dom_answers.appendChild(inputDiv)
	}
}

function addAnswers() {

	const answers = document.querySelectorAll("input[id^='q']")

	const odds  = ['A', 'B', 'C', 'D']
	const evens = ['F', 'G', 'H', 'J']

	let isValidated = true
	for (let i = 0; i < answers.length; i++) {
		if (dom_section.value != 'math') {
			if (i % 2 == 0) {
				if (!odds.includes(answers[i].value.toUpperCase())) {
					answers[i].value = ''
					isValidated = false
				}
			}
			else {
				if (!evens.includes(answers[i].value.toUpperCase())) {
					answers[i].value = ''
					isValidated = false
				}
			}
		}
		else {
			if (i % 2 == 0) {
				if (!odds.includes(answers[i].value.toUpperCase()) && answers[i].value.toUpperCase() != 'E') {
					answers[i].value = ''
					isValidated = false
				}
			}
			else {
				if (!evens.includes(answers[i].value.toUpperCase()) && answers[i].value.toUpperCase() != 'K') {
					answers[i].value = ''
					isValidated = false
				}
			}
		}
	}

	if (isValidated == true) {
		for (let i = 0; i < answers.length; i++) {
			if (answers[i].value != '') {
				getQuestion(testList.value, dom_section.value, (i + 1))
					.then((results) => {

						let pNumber = -1
						if (dom_section.value == 'english') {
							pNumber = Math.floor(i / 15) + 1
						}
						else if (dom_section.value == 'reading') {
							pNumber = Math.floor(i / 10) + 1
						}

						// Doc doesn't exist yet - set
						if (results[0] == -1) {
							const data = {
								'test': testList.value,
								'section': dom_section.value,
								'passage': pNumber,
								'type': 'question',
								'topic': [],
								'subTopics': 'None',
								'modifier': [],
								'problem': (i + 1),
								'questionText': '',
								'answers': [],
								'questionImages': [],
								'answerImages': [],
								'correctAnswer': answers[i].value.toUpperCase(),
								'passageText': '',
								'passageTextLocation': -1,
								'numberOfAttempts': 0,
								'correctAttempts': 0
							}

							firebase.firestore().collection('ACT-Tests').doc().set(data)
						}
						// Doc exists - update
						else {
							firebase.firestore().collection('ACT-Tests').doc(results[1]).update({
								['correctAnswer']: answers[i].value.toUpperCase()
							})
						}
					})
			}
			else {
				console.log("'" + answers[i].value + "'")
			}
		}
		console.log("Finished")
	}
	else {
		console.log("Please correct your issues")
	}
	
}

function removeChildren(id) {
	let dom_parent = document.getElementById(id)
	while(dom_parent.children.length > 0) {
		dom_parent.firstChild.remove()
	}

}

function initializeFinishedQuestions(test, section) {

	removeChildren('qNumbers')
	let dom_finishedQuestions = document.getElementById('qNumbers')

	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test)
	.where('section', '==', section)

	let list = []
	let data = {}
	ref.get()
	.then((querySnapshot) => {
		if (querySnapshot.size > 0) {
			querySnapshot.forEach((doc) => {
				const problem = doc.data().problem
				list.push(problem)
				if (doc.data().answers.length == (dom_section.value != 'math' ? 4 : 5) && doc.data().answers[0] != "") {
					if (doc.data().topic.length != 0) {
						data[problem] = 'stage3'
					}
					else {
						data[problem] = 'stage2'
					}
				}
				else {
					data[problem] = 'stage1'
				}
			})

			list.sort(function(a, b) {return a - b;})
			for (let i = 0; i < list.length; i++) {
				dom_finishedQuestions.appendChild(createElement('div', ['problem', data[(i + 1)]], ['onclick'], ["initializeQuestion(" + (list[i]).toString() + ")"], list[i].toString()))
			}
		}
	})
}

function resetQuestion(number) {
	// Make sure that the questions have their correct value
	if (number % 2 == 1) {
		document.getElementById('answer1Label').innerHTML = 'A'
		document.getElementById('answer2Label').innerHTML = 'B'
		document.getElementById('answer3Label').innerHTML = 'C'
		document.getElementById('answer4Label').innerHTML = 'D'
		document.getElementById('answer5Label').innerHTML = 'E'
	}
	else {
		document.getElementById('answer1Label').innerHTML = 'F'
		document.getElementById('answer2Label').innerHTML = 'G'
		document.getElementById('answer3Label').innerHTML = 'H'
		document.getElementById('answer4Label').innerHTML = 'J'
		document.getElementById('answer5Label').innerHTML = 'K'
	}

	// Reset the Topics
    $('#topic').closest(".ui.dropdown").dropdown('clear')

	// Reset the Modifiers
    $('#modifier').closest(".ui.dropdown").dropdown('clear')

	// Reset the answers
	selectAnswer()

	// Set the answers
	const section = document.getElementById('sectionList').value
	for (let i = 0; i < (section != 'math' ? 4 : 5); i++) {
		document.getElementById('answer' + (i + 1).toString()).value = ''
	}

	// Set the question text
	document.getElementById('questionText').value = ''

	// Highlight the Text
	removeHighlight()

	// Remove the passage References
	passageReferences = []

	// Set the question
	document.getElementById('questionList').value = number

}

async function initializeQuestionPreview(question, answers, number) {
	const answerLetters = ['F', 'G', 'H', 'J', 'K', 'A', 'B', 'C', 'D', 'E']

	removeChildren('qList')

	// Display the question
	if (question != undefined && question != '') {
		const text = question.split(' ')
		let questionDiv = createElement('div', ['questionText'], [], [], '')
		maxQuestionImageNumber = -1
		for (let i = 0; i < text.length; i++) {
			if (!text[i].includes('<image')) {
				questionDiv.appendChild(createElement('span', ['highlight'], [], [], text[i]))
				questionDiv.appendChild(createElement('span', [], [], [], ' '))
			}
			else {
				const imageLocation = parseInt(text[i].replace('<image', '').replace('>'));
				if (imageLocation > maxQuestionImageNumber) {
					maxQuestionImageNumber = imageLocation
				}
				try {
					const url = await getImage(testList.value, dom_section.value, passageNumber.value, imageLocation, number)
					questionDiv.appendChild(createElement('img', ['textImage'], ['src', 'id', 'style'], [url, 'image' + (imageLocation).toString(), 'width:100%;'], ''))
				}
				catch {
					console.log("You done messed up AA-ron")
				}
			}
		}
		dom_qList.appendChild(questionDiv)
	}

	// Display the answers
	for (let i = 0; i < answers.length; i++) {
		maxAnswerImageNumber = [-1, -1, -1, -1, -1]
		let answerDiv = createElement('p', ['answerText'], [], [], '')
		const text = answers[i].split(' ');
		answerDiv.appendChild(createElement('span', [], [], [], answerLetters[i + (number % 2) * 5] + '. '))
		for (let j = 0; j < text.length; j++) {
			if (!text[j].includes('<image')) {
				answerDiv.appendChild(createElement('span', ['highlight'], [], [], text[j]))
				answerDiv.appendChild(createElement('span', ['highlight'], [], [], ' '))
			}
			else {
				const imageLocation = parseInt(text[j].replace('<image', '').replace('>'));
				if (imageLocation > maxAnswerImageNumber[i]) {
					maxAnswerImageNumber[i] = imageLocation
				}
				try {
					const url = await getImage(testList.value, dom_section.value, passageNumber.value, imageLocation, number, i + 1)
					answerDiv.appendChild(createElement('img', ['textImage'], ['src', 'id', 'style'], [url, 'image' + (imageLocation).toString(), 'width:100%;'], ''))
				}
				catch {
					console.log("You done messed up AA-ron")
				}
			}
		}
		dom_qList.appendChild(answerDiv)
	}
}

function initializeQuestion(number) {
	if (debug == true) {
		console.log('initializeQuestion(' + number.toString() + ')')
	}

	resetQuestion(number)

	// Remove all boxes
	let boxes = document.getElementsByClassName('box')
	for (let i = 0; i < boxes.length; i++) {
		boxes[i].remove()
	}

	// Grab the data
	const section = document.getElementById('sectionList').value
	getQuestion(testList.value, section, number)
		.then((data) => {
			if (data[0] != -1) {
				const questionLocations = {
					'A': '1',
					'B': '2',
					'C': '3',
					'D': '4',
					'E': '5',
					'F': '1',
					'G': '2',
					'H': '3',
					'J': '4',
					'K': '5'
				}

				// Set the Topics
    			$('#topic').closest(".ui.dropdown").dropdown('set selected', data[0]['topic']);

				// Set the Modifiers
    			$('#modifier').closest(".ui.dropdown").dropdown('set selected', data[0]['modifier']);

				// Set the Passage Number
				if (passageNumber.value != data[0]['passage']) {
					passageNumber.value = data[0]['passage']
					checkForPassage(testList.value, dom_section.value, data[0]['passage'])
					.then(() => {
						// Highlight the Text
						shouldMakeBox = data[0]['makeBox'] ?? false
						if (data[0]['passageText'] != '') {
							highlightText(data[0]['passageText'], data[0]['passageTextLocation'], true)
						}
					})
				}
				else {
					// Highlight the Text
					shouldMakeBox = data[0]['makeBox'] ?? false
					if (data[0]['passageText'] != '') {
						highlightText(data[0]['passageText'], data[0]['passageTextLocation'], true)
					}
				}

				// Set the correct answer
				selectAnswer(document.getElementById('answer' + questionLocations[data[0]['correctAnswer']] + 'Label'))

				// Set the answers
				for (let i = 0; i < data[0]['answers'].length; i++) {
					document.getElementById('answer' + (i + 1).toString()).value = data[0]['answers'][i]
				}

				// Set the question text
				document.getElementById('questionText').value = data[0]['questionText']

				// Initialize the Question Preview
				initializeQuestionPreview(data[0]['questionText'], data[0]['answers'], data[0]['problem'])

			}
		})

}

async function getQuestion(test, section, number) {
	if (debug == true) {
		console.log('getQuestion(' + test + ', ' + section + ', ' + number.toString() + ')')
	}
	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test)
	.where('section', '==', section)
	.where('problem', '==', number)

	try {
		const querySnapshot = await ref.get()
		if (querySnapshot.size == 1) {
			questionImages = querySnapshot.docs[0].data()['questionImages']
			answerImages = querySnapshot.docs[0].data()['answerImages']
			return [querySnapshot.docs[0].data(), querySnapshot.docs[0].id]
		}
		else {
			return [-1]
		}
	}
	catch (error) {
		throw error
	}
}

function addQuestion(goToNext = true) {
	let ref = firebase.firestore().collection('ACT-Tests')

	const test = testList.value
	const section = document.getElementById('sectionList').value
	const number = parseInt(document.getElementById('questionList').value)

	let answer = document.getElementsByClassName('correctAnswer')
	if (answer.length > 0) {
		answer = answer[0].innerHTML
	}
	else {
		console.log("Please select the correct answer by clicking on its letter")
		return
	}

	console.log('checking')
	if (!(passageNumber.value < 1 && dom_section.value == 'math') || (passageNumber.value > 7)) {
		console.log("Check the Passage Number")
		return
	}
	console.log('good')

	const passageText = getReferenceText()[0]
	let passageTextLocation = -1
	try {
		passageTextLocation = Array.prototype.indexOf.call(passageReferences[0].parentNode.children, passageReferences[0])
	}
	catch {
		passageTextLocation = -1;
	}
	let attempts = 0;
	let correctAttempts = 0

	let answers = []
	for (let i = 0; i < (dom_section.value != 'math' ? 4 : 5); i++) {
		answers.push(document.getElementById('answer' + (i + 1).toString()).value)
	}

	getQuestion(test, section, number)
		.then((info) => {
			if (info[0] != -1) {
				attempts = info[0]['numberOfAttempts']
				correctAttempts = info[0]['correctAttempts']
				ref = ref.doc(info[1])
			}
			else {
				ref = ref.doc()
			}

			const topics = getDropdownValues('topic')
			const modifiers = getDropdownValues('modifier')
			//if (topics.length > 0 && answers.length == (section != 'math' ? 4 : 5)) {
			if (answers.length == (section != 'math' ? 4 : 5)) {
				const data = {
					'test': test,
					'section': section,
					'passage': parseInt(passageNumber.value),
					'type': 'question',
					'topic': topics,
					'subTopics': 'None',
					'modifier': modifiers,
					'problem': parseInt(number),
					'questionText': document.getElementById('questionText').value,
					'answers': answers,
					'questionImages': [],
					'answerImages': [],
					'correctAnswer': answer,
					'passageText': passageText ?? '',
					'passageTextLocation': passageTextLocation,
					'numberOfAttempts': attempts,
					'correctAttempts': correctAttempts,
					'makeBox' : shouldMakeBox
				}

				ref.set(data)
					.then(() => {
						//formDisplay('question')
						let dom_qNumbers = document.getElementById('qNumbers')
						const children = dom_qNumbers.children
						let insertedElement = false;
						let ele = undefined;
						for (let i = 0; i < children.length; i++) {
							if (parseInt(children[i].innerHTML) == number) {
								ele = children[i]
								insertedElement = true
								break;
							}
							if (parseInt(children[i].innerHTML) > number) {
								ele = createElement('div', ['problem'], ['onclick'], ["initializeQuestion(" + number.toString() + ")"], number.toString())
								dom_qNumbers.insertBefore(ele, children[i])
								insertedElement = true
								break;
							}
						}
						if (insertedElement == false) {
							ele = createElement('div', ['problem'], ['onclick'], ["initializeQuestion(" + number.toString() + ")"], number.toString())
							dom_qNumbers.appendChild(ele)
						}

						// Assign the set question a color
						ele.classList.remove('stage1')
						ele.classList.remove('stage2')
						ele.classList.remove('stage3')
						if (answers.length == (dom_section.value != 'math' ? 4 : 5) && answers[0] != "") {
							if (topics.length > 0) {
								ele.classList.add('stage3')
							}
							else {
								ele.classList.add('stage2')
							}
						}
						else {
							ele.classList.add('stage1')
						}
						if (goToNext == true) {
							const counts = {'english' : 75, 'math' : 60, 'reading' : 40, 'science' : 40}
							if (number != counts[dom_section.value]) {
								initializeQuestion(number + 1)
							}
						}
						else {
							initializeQuestion(number)
						}
						console.log('It is done')
					})
			}
		})
}

async function checkForPassage(test, section, passage) {
	if (test ?? section ?? passage) {
		const ref = firebase.firestore().collection('ACT-Tests').where('type', '==', 'passage').where('test', '==', test.toUpperCase()).where('section', '==', section.toLowerCase()).where('passageNumber', '==', parseInt(passage))
		await ref.get()
			.then((querySnapshot) => {
				if (querySnapshot.size == 1) {
					querySnapshot.forEach((doc) => {
						let text = document.getElementById('passageText')
						//passageImages = doc.data().passageImages
						title.value = doc.data().title
						text.value = doc.data().passageText
						dom_labelParagraphs.value = (doc.data().shouldLabelParagraphs == false ? 0 : 1)
						setPassageText(doc.data().passageText, title.value, parseInt(passage), dom_labelParagraphs.value, doc.data().reference)
					})
				}
				else {
					let text = document.getElementById('passageText')
					title.value = ''
					text.value = ''
					dom_labelParagraphs.value = 0
					setPassageText('', '', parseInt(passage), dom_labelParagraphs.value, dom_reference.value)
				}
			})
	}
	else {
		console.log('Totally failed!!', test, section, passage)
	}
}

function prepend(value, array) {
  var newArray = array.slice();
  newArray.unshift(value);
  return newArray;
}

function selectAnswer(element = undefined) {
	let answers = document.getElementById('questionsPart2').querySelectorAll('label')

	for (let i = 0; i < answers.length; i++) {
		answers[i].classList.remove('correctAnswer')
	}

	if (element != undefined) {
		element.classList.add('correctAnswer')
	}
}

function getReferenceText() {
	if (passageReferences.length == 2) {
		let text = ''

		const index1 = Array.prototype.indexOf.call(passageReferences[0].parentNode.children, passageReferences[0])
		const index2 = Array.prototype.indexOf.call(passageReferences[1].parentNode.children, passageReferences[1])

		if (index1 < index2) {
			let dom_iter = passageReferences[0]
			for (let i = 0; i <= (index2 - index1); i++) {
				text += dom_iter.innerHTML
				dom_iter = dom_iter.nextSibling
			}
			return [text, index1]
		}
		else {
			let dom_iter = passageReferences[1]
			for (let i = 0; i <= (index1 - index2); i++) {
				text += dom_iter.innerHTML
				dom_iter = dom_iter.nextSibling
			}
			return [text, index2]
		}
	}
	else if (passageReferences.length == 1) {
		return [passageReferences[0].innerHTML, Array.prototype.indexOf.call(passageReferences[0].parentNode.children, passageReferences[0])]
	}
	else {
		return -1
	}

}

function highlightText(text, textStart, setReferences = false) {
	removeHighlight()
	if (text != -1 && text != undefined) {

		text = text.replace('<p><p>', '<p></p><p></p>')
		let textArray = text.split(' ')
		let passageDiv = document.getElementById('pText')

		let iter = 0;
		while (iter < textArray.length) {
			let subSplit = ''
			if (textArray[iter].includes('—')) {
				subSplit = textArray[iter].split('—')
				if (subSplit[0] != '' && subSplit[1] != '') {
					textArray[iter] = subSplit[0]
					textArray.splice(iter + 1, 0, subSplit[1])
				}
				else if (subSplit[0] == '' && subSplit[1] != '') {
					textArray[iter] = subSplit[1]
				}
				else if (subSplit[0] != '' && subSplit[1] == '') {
					textArray[iter] = subSplit[0]
				}
				//textArray.splice(iter + 1, 0, '—')
				//iter += 1
			}
			if (textArray[iter].includes('&mdash;')) {
				subSplit = textArray[iter].split('&mdash;')
				if (subSplit[0] != '' && subSplit[1] != '') {
					textArray[iter] = subSplit[0]
					textArray.splice(iter + 1, 0, subSplit[1])
				}
				else if (subSplit[0] == '' && subSplit[1] != '') {
					textArray[iter] = subSplit[1]
				}
				else if (subSplit[0] != '' && subSplit[1] == '') {
					textArray[iter] = subSplit[0]
				}
				//textArray.splice(iter + 1, 0, '&mdash;')
				//iter += 1
			}
			iter += 1
		}

		// Find the child index for the start of the text
		let children = passageDiv.children
		let foundLocation = false
		let location = -1
		for (let i = 0; i < children.length; i++) {
			if (children[i].innerHTML == [textArray[0]]) {
				foundLocation = true
				for (let j = 0; j < textArray.length; j++) {
					if (children[i + (2 * j)].innerHTML != textArray[j] || Math.abs(textStart - i) > 5) {
						foundLocation = false
						break
					}
				}
				if (foundLocation == true) {
					location = i;
					break
				}
			}
		}

		// Add the ends if needed (just add to the length for the next section)
		if (text.length != 1) {
			if (text[0] == '—' || text[0] == '&mdash;') {
				children[location - 1].classList.add('highlight-yellow')
			}
			if (text[text.length - 1] == '—' || text[text.length - 1] == '&mdash;') {
				children[location + (2 * textArray.length) - 1].classList.add('highlight-yellow')
			}
		}

		// Highlight the text
		if (shouldMakeBox == false) {
			for (let i = 0; i < (2 * textArray.length) - 1; i++) {
				if (children[location + i] != undefined) {
					children[location + i].classList.add('highlight-yellow')
				}
			}
		}
		else {
			children[location].parentNode.insertBefore(createElement('span', ['box'], [], [], dom_questionList.value), children[location].nextSibling)
			children[location].parentNode.insertBefore(createElement('span', [], [], [], ' '), children[location].nextSibling)
		}

		// Set the passage References if needed
		if (setReferences == true) {
			if (textArray.length > 1) {
				passageReferences = [children[location], children[location + (2 * textArray.length) - 2]]
			}
			else {
				passageReferences = [children[location]]
			}
		}
	}
}

function removeHighlight() {
	let children = document.getElementById('pText').children
	for (let i = 0; i < children.length; i++) {
		children[i].classList.remove('highlight-yellow')
	}
}

function toggleQuestionText(element) {
	if (element.previousSibling && element.previousSibling.previousSibling && element.previousSibling.previousSibling.innerHTML != '') {
		element.parentNode.insertBefore(createElement('p', [], [], [], ''), element)
		element.parentNode.insertBefore(createElement('span', [], [], [], ' '), element)
	}
	else if (element.previousSibling && element.previousSibling.previousSibling && element.previousSibling.previousSibling.innerHTML == '') {
		element.previousSibling.remove()
		element.previousSibling.remove()
	}

	const children = element.parentNode.children
	let text = []
	for (let i = 0; i < children.length; i++) {
		if (children[i].innerHTML != '') {
			text.push(children[i].innerHTML)
		}
		else {
			text.push('<p><p>')
		}
	}
	
	dom_questionText.value = text.join('')
}

function toggleParagraph(element, toggleBox = false) {
	if (debug == true) {
		console.log(element)
		console.log('toggleParagraph("element", "' + toggleBox.toString() + '")')
	}
	if (editorState == 'passage') {
		let text = [element.innerHTML]
		const textCount = 7

		// They pressed the first word
		if (element.previousSibling.innerHTML == '') {
			return
		}

		const ignorables = ['[1]', '[2]', '[3]', '[4]', '[5]']

		// Grab a few elements before the selected word
		let childIter = element
		let previousCount = 0;
		for (let i = 0; i < textCount; i++) {
			if (childIter.previousSibling) {
				childIter = childIter.previousSibling
				if (!ignorables.includes(childIter.innerHTML)) {
					if (childIter.id == undefined || !childIter.id.includes('image')) {
						text = prepend(childIter.innerHTML, text)
					}
					else {
						text = prepend(' ', text)
						text = prepend('<' + childIter.id + '>', text)
					}
					previousCount += 1
				}
			}
			else {
				break
			}
		}

		// Grab a few elements after the selected word
		childIter = element
		for (let i = 0; i < textCount; i++) {
			if (childIter.nextSibling) {
				childIter = childIter.nextSibling
				if (!ignorables.includes(childIter.innerHTML)) {
					if (childIter.id == undefined || !childIter.id.includes('image')) {
						text.push(childIter.innerHTML)
					}
					else {
						text.push('<' + childIter.id + '>')
					}
				}
			}
			else {
				break
			}
		}

		// Update the working text and reset the passage
		if (previousCount > 1) {
			if (text[previousCount - 2] == '<p></p><p></p>') {
				newText = [...text]
				newText[previousCount - 2] = text[previousCount - 2].replace('<p></p><p></p>', '')
				newText.splice(previousCount - 1, 1)
				console.log(text)
				workingText.value = workingText.value.replace(text.join('').replaceAll('<p></p><p></p>', '<p><p>'), newText.join('').replaceAll('<p></p><p></p>', '<p><p>'))
				setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
			}
			else {
				let newText = [...text]
				newText[previousCount] = '<p><p> ' + text[previousCount]
				console.log(text)
				console.log(newText)
				workingText.value = workingText.value.replace(text.join('').replaceAll('<p></p><p></p>', '<p><p>'), newText.join('').replaceAll('<p></p><p></p>', '<p><p>'))
				setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
			}
		}
	}
	else if (editorState == 'question') {
		if (toggleBox == true) {
			if (shouldMakeBox == false) {
				shouldMakeBox = true;
			}
			else {
				shouldMakeBox = false;
			}
		}
		if (passageReferences.includes(element)) {

			if (passageReferences[0] == element) {
				passageReferences.splice(0, 1)
			}
			else {
				passageReferences.splice(1, 1)
			}

			const datum = getReferenceText()
			highlightText(datum[0], datum[1])
		}
		else {
			if (passageReferences.length == 0) {
				passageReferences.push(element)
				element.classList.add('highlight-yellow')
			}
			else if (passageReferences.length == 1) {
				passageReferences.push(element)
				const datum = getReferenceText()
				highlightText(datum[0], datum[1])
			}
		}
	}
}

function getDropdownValues(dropdownId) {
  const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
  let values = []
  inputs.forEach((input) => {
    values.push(input.dataset.value)
  })

  return values;
}

function displayMenu(action = 'toggle', x = 0, y = 0) {
	dom_menu = document.getElementById('imagePopup')

	if (action == 'toggle') {
		dom_menu.classList.toggle('hidden')
	}
	else if (action == 'remove') {
		dom_menu.classList.add('hidden')
	}
	else if (action == 'add') {
		dom_menu.classList.remove('hidden')
	}

	dom_menu.style.left = (parseInt(x) + 30).toString() + 'px'
	dom_menu.style.top = y + 'px'
}

function displayRemovalMenu(action = 'toggle', x = 0, y = 0) {
	dom_menu = document.getElementById('imageRemovalPopup')

	if (action == 'toggle') {
		dom_menu.classList.toggle('hidden')
	}
	else if (action == 'remove') {
		dom_menu.classList.add('hidden')
	}
	else if (action == 'add') {
		dom_menu.classList.remove('hidden')
	}

	dom_menu.style.left = (parseInt(x) + 30).toString() + 'px'
	dom_menu.style.top = y + 'px'
}

function updateAnswerText(element, action, imageNumber) {
	let answerNumber = Array.prototype.indexOf.call(element.parentNode.parentNode.children, element.parentNode) + 1
	let dom_answerText = document.getElementById('answer' + (answerNumber).toString())
	let text = element.innerHTML
	const wordCount = 3
	let count = 0;
	let dom_iter = element
	while (count < wordCount) {
		if (dom_iter.nextSibling) {
			dom_iter = dom_iter.nextSibling
			text += dom_iter.innerHTML
		}
		else {
			break;
		}

		count += 1
	}

	if (count == wordCount) {
		if (action == 'before') {
			dom_answerText.value = dom_answerText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), '<image' + (imageNumber).toString() + '> ' + text.replaceAll('<p></p><p></p>', '<p><p>'))
		}
		else if (action == 'after') {
			dom_answerText.value = dom_answerText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>').replace(element.innerHTML, element.innerHTML + ' <image' + (imageNumber).toString() + '>'))
		}
	}
	else {
		let text = element.innerHTML
		const wordCount = 3
		let count = 0;
		let dom_iter = element
		while (count < wordCount) {
			if (dom_iter.previousSibling) {
				dom_iter = dom_iter.previousSibling
				text += dom_iter.innerHTML
			}
			else {
				break;
			}

			count += 1
		}

		if (action == 'before') {
			dom_answerText.value = dom_answerText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>').replace(element.innerHTML,'<image' + (imageNumber).toString() + '> ' + element.innerHTML))
		}
		else if (action == 'after') {
			dom_answerText.value = dom_answerText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>') + ' <image' + (imageNumber).toString() + '>')
		}
	}

	addQuestion(false)
}

function updateQuestionText(element, action) {
	let text = element.innerHTML
	const wordCount = 3
	let count = 0;
	let dom_iter = element
	while (count < wordCount) {
		if (dom_iter.nextSibling) {
			dom_iter = dom_iter.nextSibling
			text += dom_iter.innerHTML
		}
		else {
			break;
		}

		count += 1
	}

	if (count == wordCount) {
		if (action == 'before') {
			dom_questionText.value = dom_questionText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), '<image' + (maxQuestionImageNumber).toString() + '> ' + text.replaceAll('<p></p><p></p>', '<p><p>'))
		}
		else if (action == 'after') {
			dom_questionText.value = dom_questionText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>').replace(element.innerHTML, element.innerHTML + ' <image' + (maxQuestionImageNumber).toString() + '>'))
		}
	}
	else {
		let text = element.innerHTML
		const wordCount = 3
		let count = 0;
		let dom_iter = element
		while (count < wordCount) {
			if (dom_iter.previousSibling) {
				dom_iter = dom_iter.previousSibling
				text += dom_iter.innerHTML
			}
			else {
				break;
			}

			count += 1
		}

		if (action == 'before') {
			dom_questionText.value = dom_questionText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>').replace(element.innerHTML,'<image' + (maxQuestionImageNumber).toString() + '> ' + element.innerHTML))
		}
		else if (action == 'after') {
			dom_questionText.value = dom_questionText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>') + ' <image' + (maxQuestionImageNumber).toString() + '>')
		}
	}

	addQuestion(false)
}

function updateWorkingText(element, action) {
	if (debug == true) {
		console.log(element)
		console.log('updateWorkingText(\'element\', \'' + action + '\')')
	}

	let text = element.innerHTML
	const wordCount = 9
	let count = 0;
	let dom_iter = element
	while (count < wordCount) {
		if (dom_iter.nextSibling) {
			dom_iter = dom_iter.nextSibling
			text += dom_iter.innerHTML
		}
		else {
			break;
		}

		count += 1
	}

	if (count == wordCount) {
		if (action == 'before') {
			workingText.value = workingText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), '<image' + (maxPassageImageNumber).toString() + '> ' + text.replaceAll('<p></p><p></p>', '<p><p>'))
		}
		else if (action == 'after') {
			workingText.value = workingText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>').replace(element.innerHTML, element.innerHTML + ' <image' + (maxPassageImageNumber).toString() + '>'))
		}
	}
	else {
		let text = element.innerHTML
		const wordCount = 9
		let count = 0;
		let dom_iter = element
		while (count < wordCount) {
			if (dom_iter.previousSibling) {
				dom_iter = dom_iter.previousSibling
				text += dom_iter.innerHTML
			}
			else {
				break;
			}

			count += 1
		}

		if (action == 'before') {
			workingText.value = workingText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>').replace(element.innerHTML,'<image' + (maxPassageImageNumber).toString() + '> ' + element.innerHTML))
		}
		else if (action == 'after') {
			text = text.split(' ')
			text.reverse()
			text = text.join(' ')
			workingText.value = workingText.value.replace(text.replaceAll('<p></p><p></p>', '<p><p>'), text.replaceAll('<p></p><p></p>', '<p><p>') + ' <image' + (maxPassageImageNumber).toString() + '>')
		}
	}

	submitPassageText()
	setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
}

function addImage(action) {
	if (debug == true) {
		console.log('addImage(\'' + action + '\')')
	}

	if (dom_imageBefore.files.length > 0 || dom_imageAfter.files.length > 0){
		let type = 'passage'
		if (selectedWord.closest('.questionText') != null) {
			type = 'question'
		}
		else if (selectedWord.closest('.answerText') != null) {
			type = 'answer'
		}

		let image = undefined

		if (action == 'before') {
			image = dom_imageBefore.files[0]
		}
		else if (action == 'after') {
			image = dom_imageAfter.files[0]
		}

		let filename = undefined
		if (type == 'passage') {
			filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-I' + (maxPassageImageNumber + 1).toString() + '.png'
		}
		else if (type == 'question') {
			filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-I' + (maxPassageImageNumber + 1).toString() + '.png'
		}
		else if (type == 'answer') {
			const answerNumber = Array.prototype.indexOf.call(selectedWord.parentNode.parentNode.children, selectedWord.parentNode) + 1
			filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-A' + (answerNumber).toString() +  '-I' + (maxPassageImageNumber + 1).toString() + '.png'
			console.log(passageNumber.value)
			console.log(filename)
		}
    	let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
        let thisref = ref.put(image)

        thisref.on('state_changed', function (snapshot) {
        }, function (error) {
          console.log(error)
        }, function () {
          // Uploaded completed successfully, now we can get the download URL
          thisref.snapshot.ref.getDownloadURL().then(function (downloadURL) {

            // Setting image
			if (type == 'passage') {
				passageImages.push(downloadURL)
				maxPassageImageNumber += 1
				updateWorkingText(selectedWord, action)
			}
			else if (type == 'question') {
				maxQuestionImageNumber += 1
				updateQuestionText(selectedWord, action)
			}
			else if (type == 'answer') {
				const answerNumber = Array.prototype.indexOf.call(selectedWord.parentNode.parentNode.children, selectedWord.parentNode) + 1
				maxAnswerImageNumber[answerNumber - 1] += 1
				updateAnswerText(selectedWord, action, maxAnswerImageNumber[answerNumber - 1])
			}

			dom_imageAfter.value = null
			dom_imageBefore.value = null
          });
        });
	}

}

async function getImage(test, section, passage, imageNumber, question = undefined, answer = undefined) {
	let filename = test + '-' + section + '-P' + passage
	if (question != undefined) {
		filename += '-Q' + question.toString()
		if (answer != undefined) {
			filename += '-A' + answer.toString()
		}
	}

	filename += '-I' + imageNumber.toString() + '.png'

	return await storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename).getDownloadURL()
}

function removeImage() {
	const imageNumber = parseInt(selectedImage.id.replace('image', ''))

	let type = 'passage'
	if (selectedImage.closest('.questionText') != null) {
		type = 'question'
		dom_questionText.value = dom_questionText.value.replaceAll('<image' + imageNumber.toString() + '> ', '')
	}
	else if (selectedImage.closest('.answerText') != null) {
		type = 'answer'
		const answerNumber = Array.prototype.indexOf.call(selectedImage.parentNode.parentNode.children, selectedImage.parentNode) + 1
		let dom_answerText = document.getElementById('answer' + answerNumber.toString())
		dom_answerText.value = dom_answerText.value.replaceAll('<image' + imageNumber.toString() + '> ', '')
		dom_answerText.value = dom_answerText.value.replaceAll('<image' + imageNumber.toString() + '>', '')
	}
	else {
		workingText.value = workingText.value.replaceAll('<image' + imageNumber.toString() + '> ', '')
		passageImages.splice(imageNumber, 1)
	}

	let filename = undefined
	if (type == 'passage') {
		filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-I' + (maxPassageImageNumber).toString() + '.png'
	}
	else if (type == 'question') {
		filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-I' + (maxPassageImageNumber + 1).toString() + '.png'
	}
	else if (type == 'answer') {
		let answerNumber = Array.prototype.indexOf.call(selectedImage.parentNode.parentNode.children, selectedImage.parentNode) + 1
		filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-A' + (answerNumber).toString() +  '-I' + (maxPassageImageNumber + 1).toString() + '.png'
	}

	let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
	ref.delete()
		.then(() => {
			if (type == 'passage') {
				setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
				submitPassageText()
			}
			else {
				addQuestion(false)
			}
			displayMenu('remove')
			displayRemovalMenu('remove')
		})
		.catch((err) => {
			console.log(err)
		})
}

/*function removeImageOld() {
	const imageNumber = parseInt(selectedImage.id.replace('image', ''))
	const lastImageIndex = passageImages.length - 1

	if (imageNumber == lastImageIndex) {
		workingText.value = workingText.value.replaceAll('<image' + lastImageIndex.toString() + '> ', '')
		passageImages.splice(lastImageIndex, 1)

		const filename = testList.value + '-' + dom_section.value + '-' + passageNumber.value + '-' + lastImageIndex.toString() + '.png'
		console.log(filename)
		let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
		ref.delete()
			.then(() => {
				setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value)
				submitPassageText()
				displayRemovalMenu('remove')
			})
			.catch((err) => {
				console.log(err)
			})
	}
	else {

		const filename = testList.value + '-' + dom_section.value + '-' + passageNumber.value + '-' + lastImageIndex.toString() + '.png'
		storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename).getDownloadURL()
			.then((url) => {
				const oldFilename = testList.value + '-' + dom_section.value + '-' + passageNumber.value + '-' + imageNumber.toString() + '.png'
				storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + oldFilename).putFile(url)

				workingText.value = workingText.value.replaceAll('<image' + imageNumber.toString() + '> ', '')
				workingText.value = workingText.value.replaceAll('<image' + lastImageIndex.toString() + '> ', '<image' + imageNumber.toString() + '> ')

				console.log(passageImages)
				passageImages[imageNumber] = passageImages[lastImageIndex]
				passageImages.splice(lastImageIndex, 1)
				console.log(passageImages)

				// copy lastImageIndex to imageNumber

				let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
				ref.delete()
					.then(() => {
						setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value)
						submitPassageText()
						displayRemovalMenu('remove')
					})
					.catch((err) => {
						console.log(err)
					})
			})
	}

}*/

function getSelectionText() {
    var text = "";
    var activeEl = document.activeElement;
    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
      (activeElTagName == "textarea") || (activeElTagName == "input" &&
      /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
      (typeof activeEl.selectionStart == "number")
    ) {
        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    } else if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
}

function initializePassageList(sectionCount = undefined, number = 1) {
	removeChildren('passageList')

	if (sectionCount == undefined) {
		if (dom_section.value == 'english') { sectionCount = 5}
		else if (dom_section.value == 'math') { sectionCount = 2}
		else if (dom_section.value == 'reading') { sectionCount = 4}
		else if (dom_section.value == 'science') { sectionCount = 7}
	}

	for (let i = 0; i < sectionCount; i++) {
		passageNumber.appendChild(createElement('option', [], [], [], (i + 1).toString()))
	}

	passageNumber.value = number

}

/*********************************************************
 *                    Event Listeners                    *
 *********************************************************/
testList.addEventListener('change', function () {
	if (testList.value == 'newTest') {
		formDisplay('test')
	}
	else {
		formDisplay('passage')
		checkForPassage(testList.value, dom_section.value, passageNumber.value)
	}
})

dom_section.addEventListener('change', function() {
		formDisplay(editorState)
		initializePassageList()
		checkForPassage(testList.value, dom_section.value, passageNumber.value)
})

passageNumber.addEventListener('change', function() {
		//formDisplay(editorState)
		checkForPassage(testList.value, dom_section.value, passageNumber.value)
})

workingText.addEventListener('input', function () {
	workingText.value = workingText.value.replaceAll('\n', ' ').replaceAll('.', '. ').replaceAll('--', '&mdash;').replaceAll('  ', ' ')
	setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
})

title.addEventListener('input', function () {
	setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
})

dom_reference.addEventListener('input', function() {
	setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
})

dom_questionList.addEventListener('change', function () {
	initializeQuestion(parseInt(dom_questionList.value))
})

dom_labelParagraphs.addEventListener('change', function () {
	setPassageText(workingText.value, title.value, parseInt(passageNumber.value), dom_labelParagraphs.value, dom_reference.value)
})

let selectedWord = undefined
let selectedImage = undefined
dom_pText.addEventListener('contextmenu', function(event) {
	if (editorState == 'passage') {
		event.preventDefault()
		try {
			selectedWord.classList.remove('spotlight')
		}
		catch {
		}

		if (event.target.classList.contains('highlight')) {
			selectedWord = event.target
			selectedWord.classList.add('spotlight')
			displayMenu('toggle', event.clientX, event.clientY)
		}
		else if (event.target.classList.contains('textImage')) {
			selectedImage = event.target
			displayRemovalMenu('toggle', event.clientX, event.clientY)
		}
	}
	else if (editorState == 'question' && event.target != null && event.target.innerHTML.includes('.')) {
		event.preventDefault()
		toggleParagraph(event.target, true)
		addQuestion(false)
		//event.target.parentNode.insertBefore(createElement('span', ['box'], [], [], dom_questionList.value), event.target.nextSibling)
		//event.target.parentNode.insertBefore(createElement('span', [], [], [], ' '), event.target.nextSibling)
	}
})

dom_qList.addEventListener('contextmenu', function(event) {
	if (editorState == 'question') {
		try {
			selectedWord.classList.remove('spotlight')
		}
		catch {
		}

		if (event.target.classList.contains('highlight')) {
			event.preventDefault()
			selectedWord = event.target
			selectedWord.classList.add('spotlight')
			displayMenu('toggle', event.clientX, event.clientY)
		}
		else if (event.target.classList.contains('textImage')) {
			event.preventDefault()
			selectedImage = event.target
			displayRemovalMenu('toggle', event.clientX, event.clientY)
		}
	}
})

dom_qList.addEventListener('click', function(event) {
	if (event.target.parentNode.classList.contains('questionText')) {
		toggleQuestionText(event.target)
	}
})

document.getElementsByTagName('main')[0].addEventListener('click', function() {
	if (selectedWord != undefined) {
		displayMenu('remove')
		displayRemovalMenu('remove')
		selectedWord.classList.remove('spotlight')
	}
})

// Add image before text
dom_imageBefore = document.getElementById('imageBefore')
document.getElementById('before').addEventListener('click', function() {
	dom_imageBefore.click()
})

// Add image after text
dom_imageAfter = document.getElementById('imageAfter')
document.getElementById('after').addEventListener('click', function() {
	dom_imageAfter.click()
})

dom_questionText.addEventListener('input', function() {
	dom_questionText.value = dom_questionText.value.replaceAll('\n', ' ').replaceAll('.', '. ').replaceAll('--', '&mdash;').replaceAll('  ', ' ')
	if (dom_section.value != 'math') {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value], dom_questionList.value)
	}
	else {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value, dom_answer5.value], dom_questionList.value)
	}
})

dom_answer1.addEventListener('input', function() {
	dom_answer1.value = dom_answer1.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('  ', ' ')
	if (dom_section.value != 'math') {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value], dom_questionList.value)
	}
	else {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value, dom_answer5.value], dom_questionList.value)
	}
})

dom_answer2.addEventListener('input', function() {
	dom_answer2.value = dom_answer2.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('  ', ' ')
	if (dom_section.value != 'math') {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value], dom_questionList.value)
	}
	else {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value, dom_answer5.value], dom_questionList.value)
	}
})

dom_answer3.addEventListener('input', function() {
	dom_answer3.value = dom_answer3.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('  ', ' ')
	if (dom_section.value != 'math') {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value], dom_questionList.value)
	}
	else {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value, dom_answer5.value], dom_questionList.value)
	}
})

dom_answer4.addEventListener('input', function() {
	dom_answer4.value = dom_answer4.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('  ', ' ')
	if (dom_section.value != 'math') {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value], dom_questionList.value)
	}
	else {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value, dom_answer5.value], dom_questionList.value)
	}
})

dom_answer5.addEventListener('input', function() {
	dom_answer5.value = dom_answer5.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('  ', ' ')
	if (dom_section.value != 'math') {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value], dom_questionList.value)
	}
	else {
		initializeQuestionPreview(dom_questionText.value, [dom_answer1.value, dom_answer2.value, dom_answer3.value, dom_answer4.value, dom_answer5.value], dom_questionList.value)
	}
})

let answer1Image = document.getElementById('answer1Image')
answer1Image.addEventListener('change', function () {
	if (!(passageNumber.value < 1 && dom_section.value != 'math') && !(passageNumber.value > 7)) {
		filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-A1-I0.png';
		let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
		let thisref = ref.put(answer1Image.files[0])

		thisref.on('state_changed', function (snapshot) {
		}, function (error) {
			console.log(error)
		}, function () {
			document.getElementById('answer1').value = '<image0>'
			answer1Image.value = null
			addQuestion(false)
		})
	}
});

let answer2Image = document.getElementById('answer2Image')
answer2Image.addEventListener('change', function () {
	if (!(passageNumber.value < 1 && dom_section.value != 'math') && !(passageNumber.value > 7)) {
		filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-A2-I0.png';
		let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
		let thisref = ref.put(answer2Image.files[0])

		thisref.on('state_changed', function (snapshot) {
		}, function (error) {
			console.log(error)
		}, function () {
			document.getElementById('answer2').value = '<image0>'
			answer2Image.value = null
			addQuestion(false)
		})
	}
});

let answer3Image = document.getElementById('answer3Image')
answer3Image.addEventListener('change', function () {
	if (!(passageNumber.value < 1 && dom_section.value != 'math') && !(passageNumber.value > 7)) {
		filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-A3-I0.png';
		let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
		let thisref = ref.put(answer3Image.files[0])

		thisref.on('state_changed', function (snapshot) {
		}, function (error) {
			console.log(error)
		}, function () {
			document.getElementById('answer3').value = '<image0>'
			answer3Image.value = null
			addQuestion(false)
		})
	}
});

let answer4Image = document.getElementById('answer4Image')
answer4Image.addEventListener('change', function () {
	if (!(passageNumber.value < 1 && dom_section.value != 'math') && !(passageNumber.value > 7)) {
		filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-A4-I0.png';
		let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
		let thisref = ref.put(answer4Image.files[0])

		thisref.on('state_changed', function (snapshot) {
		}, function (error) {
			console.log(error)
		}, function () {
			document.getElementById('answer4').value = '<image0>'
			answer4Image.value = null
			addQuestion(false)
		})
	}
});

let answer5Image = document.getElementById('answer5Image')
answer5Image.addEventListener('change', function () {
	if (!(passageNumber.value < 1 && dom_section.value != 'math') && !(passageNumber.value > 7)) {
		filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-A5-I0.png';
		let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
		let thisref = ref.put(answer5Image.files[0])

		thisref.on('state_changed', function (snapshot) {
		}, function (error) {
			console.log(error)
		}, function () {
			document.getElementById('answer5').value = '<image0>'
			answer5Image.value = null
			addQuestion(false)
		})
	}
});