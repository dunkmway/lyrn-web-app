let tests = [];
const date = new Date()
let testList = document.getElementById('testList')
let workingText = document.getElementById('passageText')
let title = document.getElementById('passageTitle')
let passageNumber = document.getElementById('passageList')
let dom_topic = document.getElementById('topic')
let dom_subTopic = document.getElementById('subTopic')

let passageText = ''

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

/*function addTopic(section, topic, subTopics) {

	if (section != undefined && topic != undefined && subTopics != undefined) {

		if (subTopics != '') {
			data = {
				'section' : section,
				'topic' : topic,
				'subTopics' : subTopics.split(', ')
			}
		}
		else {
			data = {
				'section' : section,
				'topic' : topic,
				'subTopics' : []
			}
		}

		ref = firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics').doc()
		ref.set(data)
		.then(() => {
			console.log('Set', section, ':', topic, ':', subTopics.split(', '))
		})
	}
}*/


/*addTopic('english', 'Clear and Concise', 'Redundancy, Simplicity, Pronoun Ambiguity')
addTopic('english', 'Comprehension', 'Adding / Deleting / Revising Sentences, Main Idea')
addTopic('english', 'Conjugation', 'Subject-Verb Agreement, Tense, Noun-Pronoun Agreement')
addTopic('english', 'Essay Organization', 'Adding Sentence, Transition Phrases, Ordering, Phrase Placement, Splitting a paragraph')
addTopic('english', 'Fundamentals', 'IC, DC, Phrases, Parts of Speech, Subject, Verb, Object')
addTopic('english', 'Good Luck', 'Vocab and Expressions')
addTopic('english', 'Language', 'Connotation, Active and Passive Voice, Tone and Emphasis')
addTopic('english', 'Punctuation', 'Commas, Apostrophes, Citing Quotations, Semicolon')
addTopic('english', 'Sentence Structure', 'Sentence Composition, Identify IC, DC, Phrases')
addTopic('english', 'Word Choice', 'Transition words, Homophones, Preposition, Parallelism, Transitive vs Intransitive, Concrete vs Abstract adjectives, Identify Parts of Speech, Conjunctions')

addTopic('math', 'Word Problems', '')
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

addTopic('reading', 'Contextual', 'Ambiguous Pronouns, Phrase Interpretation, Multiple Word Definition')
addTopic('reading', 'Main Idea / Purpose', 'Essay, Paragraph, Point of View')
addTopic('reading', 'Fact', 'Findable answer, Direct inference')

addTopic('science', 'Graph Reading', '')
addTopic('science', 'Variable Relationships', '')
addTopic('science', 'Extrapolation', '')
addTopic('science', 'Reasoned Answer', '')
addTopic('science', 'Variable Types', '')
addTopic('science', 'Experimental Design', '')
addTopic('science', 'Conflicting Viewpoints', '')
addTopic('science', 'Modify the experiment', '')*/



function initializeQuestionList(section) {
	let count = 40
	let questions = document.getElementById('questionList')

	if (section.toLowerCase() == 'english') {
		count = 75;
	}
	else if (section.toLowerCase() == 'math') {
		count = 60;
	}

	// Delete the current list of questions
	while (questionList.firstChild) {
		questionList.removeChild(questionList.firstChild)
	}

	// Add the needed questions
	for (let i = 0; i < count; i++) {
		questions.appendChild(createElement('option', [], ['value'], [i + 1], (i + 1).toString()))
	}
}

function initializeTopicList(section) {
	const ref = firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics').where('section', '==', section)

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
}

function initializeSubTopicList(section, topic) {
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

}

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
							formDisplay('section')
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

function setPassageText(passageText, passageTitle = undefined, passageNumber = undefined) {

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
	if (passageTitle != undefined && passageTitle != '') {
		let titleText = passageTitle.split(" ")
		for (let i = 0; i < titleText.length; i++) {
			passageDiv.appendChild(createElement('span', ['bold'], [], [], titleText[i]))
			passageDiv.appendChild(createElement('span', [], [], [], ' '))
		}

		passageDiv.appendChild(createElement('p', [], [], [], ''))

	}

	// Add the passage Text
	let text = passageText.split(" ")
	for (let i = 0; i < text.length; i++) {
		passageDiv.appendChild(createElement('span', ['highlight'], [], [], text[i]))
		passageDiv.appendChild(createElement('span', [], [], [], ' '))
	}
}

function submitPassageText() {
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
		'passageImages' : [],
		'shouldLabelParagraphs': false,
	}

	// Validate then set the data
	if (title.value.length > 0 && text.value.length > 0) {
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
								setPassageText(text.value, title.value, parseInt(passageNumber.value))
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

		document.getElementById('questionAdd').classList.add('hidden')
		document.getElementById('questionShow').classList.add('hidden')
		document.getElementById('questionList').classList.add('hidden')
		document.getElementById('questionListLabel').classList.add('hidden')
		document.getElementById('topic').classList.add('hidden')
		document.getElementById('topicLabel').classList.add('hidden')
		document.getElementById('subTopic').classList.add('hidden')
		document.getElementById('subTopicLabel').classList.add('hidden')
		document.getElementById('modifier').classList.add('hidden')
		document.getElementById('modifierLabel').classList.add('hidden')
	}
	else if (event == 'section') {
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

		document.getElementById('questionShow').classList.remove('hidden')
		document.getElementById('questionAdd').classList.add('hidden')
		document.getElementById('questionList').classList.add('hidden')
		document.getElementById('questionListLabel').classList.add('hidden')
		document.getElementById('topic').classList.add('hidden')
		document.getElementById('topicLabel').classList.add('hidden')
		document.getElementById('subTopic').classList.add('hidden')
		document.getElementById('subTopicLabel').classList.add('hidden')
		document.getElementById('modifier').classList.add('hidden')
		document.getElementById('modifierLabel').classList.add('hidden')
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

		document.getElementById('questionAdd').classList.remove('hidden')
		document.getElementById('questionShow').classList.add('hidden')
		document.getElementById('questionList').classList.remove('hidden')
		document.getElementById('questionListLabel').classList.remove('hidden')
		document.getElementById('topic').classList.remove('hidden')
		document.getElementById('topicLabel').classList.remove('hidden')
		document.getElementById('subTopic').classList.remove('hidden')
		document.getElementById('subTopicLabel').classList.remove('hidden')
		document.getElementById('modifier').classList.remove('hidden')
		document.getElementById('modifierLabel').classList.remove('hidden')
	}
}

function checkForPassage(test, section, passage) {
	if (test ?? section ?? passage) {
		const ref = firebase.firestore().collection('ACT-Tests').where('type', '==', 'passage').where('test', '==', test.toUpperCase()).where('section', '==', section.toLowerCase()).where('passageNumber', '==', parseInt(passage))
		ref.get()
			.then((querySnapshot) => {
				if (querySnapshot.size == 1) {
					querySnapshot.forEach((doc) => {
						let text = document.getElementById('passageText')
						title.value = doc.data().title
						text.value = doc.data().passageText
						setPassageText(doc.data().passageText, title.value, parseInt(passage))
					})
				}
			})
	}
	else {
		console.log('Totally failed!!', test, section, passage)
	}
}


/*********************************************************
 *                    Event Listeners                    *
 *********************************************************/
testList.addEventListener('change', function () {
	if (testList.value == 'newTest') {
		formDisplay('test')
	}
	else {
		formDisplay('section')

		let section = document.getElementById('sectionList')
		let pNumber = document.getElementById('passageList')
		checkForPassage(testList.value, section.value, pNumber.value)
	}
})


workingText.addEventListener('input', function () {
	setPassageText(workingText.value, title.value, parseInt(passageNumber.value))
})

title.addEventListener('input', function () {
	setPassageText(workingText.value, title.value, parseInt(passageNumber.value))
})

dom_topic.addEventListener('change', function () {
	const section = document.getElementById('sectionList').value
	const topic = dom_topic.value
	console.log(section, topic)
	initializeSubTopicList(section, topic)
})