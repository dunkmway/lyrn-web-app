let tests = [];
const date = new Date()
let testList = document.getElementById('testList')
let workingText = document.getElementById('passageText')
let title = document.getElementById('passageTitle')
let passageNumber = document.getElementById('passageList')
let dom_topic = document.getElementById('topic')
let dom_modifier = document.getElementById('modifier')
let dom_questionList = document.getElementById('questionList')
//let dom_subTopic = document.getElementById('subTopic')
let editorState = 'test'
let passageReferences = []

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
		passageDiv.appendChild(createElement('span', ['highlight'], ['onclick'], ['toggleParagraph(this)'], text[i]))
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
		document.getElementById('answer1Label').classList.add('hidden')
		document.getElementById('answer2').classList.add('hidden')
		document.getElementById('answer2Label').classList.add('hidden')
		document.getElementById('answer3').classList.add('hidden')
		document.getElementById('answer3Label').classList.add('hidden')
		document.getElementById('answer4').classList.add('hidden')
		document.getElementById('answer4Label').classList.add('hidden')
		document.getElementById('answer5').classList.add('hidden')
		document.getElementById('answer5Label').classList.add('hidden')
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
		document.getElementById('answer1Label').classList.add('hidden')
		document.getElementById('answer2').classList.add('hidden')
		document.getElementById('answer2Label').classList.add('hidden')
		document.getElementById('answer3').classList.add('hidden')
		document.getElementById('answer3Label').classList.add('hidden')
		document.getElementById('answer4').classList.add('hidden')
		document.getElementById('answer4Label').classList.add('hidden')
		document.getElementById('answer5').classList.add('hidden')
		document.getElementById('answer5Label').classList.add('hidden')
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
		document.getElementById('answer1Label').classList.remove('hidden')
		document.getElementById('answer2').classList.remove('hidden')
		document.getElementById('answer2Label').classList.remove('hidden')
		document.getElementById('answer3').classList.remove('hidden')
		document.getElementById('answer3Label').classList.remove('hidden')
		document.getElementById('answer4').classList.remove('hidden')
		document.getElementById('answer4Label').classList.remove('hidden')

		// Display the 5th answer if on the math section
		let section = document.getElementById('sectionList').value
		if (section == 'math') {
			document.getElementById('answer5').classList.remove('hidden')
			document.getElementById('answer5Label').classList.remove('hidden')
		}

		initializeQuestionList(section)
		initializeTopicList(section)

		let questionNumber = parseInt(dom_questionList.value)
		initializeQuestion(questionNumber)

	}
}

function initializeQuestion(number) {
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

	// Grab the data
	const section = document.getElementById('sectionList').value
	getQuestion(testList.value, section, number)
		.then((data) => {
			if (data != -1) {
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
    			$('#topic').closest(".ui.dropdown").dropdown('set selected', data['topic']);

				// Set the Modifiers
    			$('#modifier').closest(".ui.dropdown").dropdown('set selected', data['modifier']);

				// Set the correct answer
				selectAnswer(document.getElementById('answer' + questionLocations[data['correctAnswer']] + 'Label'))

				// Set the answers
				for (let i = 0; i < data['answers'].length; i++) {
					document.getElementById('answer' + (i + 1).toString()).value = data['answers'][i]
				}

				// Set the question text
				document.getElementById('questionText').value = data['questionText']

				// Highlight the Text
				highlightText(data['passageText'], true)
			}
		})



}

function getQuestion(test, section, number) {
	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test)
	.where('section', '==', section)
	.where('problem', '==', number)

	return new Promise(function(resolve, reject) {
		ref.get()
	.then((querySnapshot) => {
		if (querySnapshot.size == 1) {
			querySnapshot.forEach((doc) => {
				resolve(doc.data())
			})
		}
		else {
			resolve(-1)
		}
	})
})
}

function addQuestion() {
	const ref = firebase.firestore().collection('ACT-Tests').doc()

	const test = testList.value
	const section = document.getElementById('sectionList').value
	const number = document.getElementById('questionList').value

	let answer = document.getElementsByClassName('correctAnswer')
	if (answer.length > 0) {
		answer = answer[0].innerHTML
	}
	else {
		console.log("Please select the correct answer by clicking on its letter")
		return
	}

	const passageText = getReferenceText()
	let attempts = 0;
	let correctAttempts = 0

	let answers = []
	if (section != 'math') {
		for (let i = 0; i < 4; i++) {
			answers.push(document.getElementById('answer' + (i + 1).toString()).value)
		}
	}

	getQuestion(test, section, number)
		.then((info) => {
			if (info != -1) {
				attempts = info['attempts']
				correctAttempts = info['correctAttempts']
			}

			const topics = getDropdownValues('topic')
			const modifiers = getDropdownValues('modifier')
			if (topics.length > 0 && answers.length == (section != 'math' ? 4 : 5)) {
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
					'passageText': passageText,
					'numberOfAttempts': attempts,
					'correctAttempts': correctAttempts
				}

				ref.set(data)
					.then(() => { console.log("It is done") })
			}
		})
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

function prepend(value, array) {
  var newArray = array.slice();
  newArray.unshift(value);
  return newArray;
}

function selectAnswer(element) {
	let answers = document.getElementById('questionsPart2').querySelectorAll('label')

	for (let i = 0; i < answers.length; i++) {
		answers[i].classList.remove('correctAnswer')
	}

	element.classList.add('correctAnswer')
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
			return text
		}
		else {
			let dom_iter = passageReferences[1]
			for (let i = 0; i <= (index1 - index2); i++) {
				text += dom_iter.innerHTML
				dom_iter = dom_iter.nextSibling
			}
			return text
		}
	}
	else if (passageReferences.length == 1) {
		return passageReferences[0].innerHTML
	}
	else {
		return -1
	}

}

function highlightText(text, setReferences = false) {
	removeHighlight()
	if (text != -1) {

		text = text.replace('<p><p>', '<p></p><p></p>')
		const textArray = text.split(' ')
		let passageDiv = document.getElementById('pText')

		// Find the child index for the start of the text
		let children = passageDiv.children
		let foundLocation = false
		let location = -1
		for (let i = 0; i < children.length; i++) {
			if (children[i].innerHTML == [textArray[0]]) {
				foundLocation = true
				for (let j = 0; j < textArray.length; j++) {
					if (children[i + (2 * j)].innerHTML != textArray[j]) {
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

		// Highlight the text
		for (let i = 0; i < (2 * textArray.length) - 1; i++) {
			children[location + i].classList.add('highlight-yellow')
		}

		// Set the passage References if needed
		if (setReferences == true) {
			passageReferences = [children[location], children[location + (2 * textArray.length) - 2]]
		}
	}
}

function removeHighlight() {
	let children = document.getElementById('pText').children
	for (let i = 0; i < children.length; i++) {
		children[i].classList.remove('highlight-yellow')
	}
}

function toggleParagraph(element) {
	if (editorState == 'passage') {
		let text = [element.innerHTML]
		const textCount = 7

		// They pressed the first word
		if (element.previousSibling.innerHTML == '') {
			return
		}

		// Grab a few elements before the selected word
		let childIter = element
		let previousCount = 0;
		for (let i = 0; i < textCount; i++) {
			if (childIter.nextSibling) {
				childIter = childIter.previousSibling
				text = prepend(childIter.innerHTML, text)
				previousCount += 1
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
				text.push(childIter.innerHTML)
			}
			else {
				break
			}
		}

		// Update the working text and reset the passage
		if (previousCount > 1) {
			if (text[previousCount - 2] == '<p></p><p></p>') {
				workingText.value = workingText.value.replace(text.join('').replace('<p></p><p></p>', '<p><p>'), text.join('').replace('<p></p><p></p> ', ''))
				setPassageText(workingText.value, title.value, parseInt(passageNumber.value))
			}
			else {
				let newText = [...text]
				newText[previousCount] = '<p><p> ' + text[previousCount]
				workingText.value = workingText.value.replace(text.join(''), newText.join(''))
				setPassageText(workingText.value, title.value, parseInt(passageNumber.value))
			}
		}
	}
	else if (editorState == 'question') {
		if (passageReferences.includes(element)) {

			if (passageReferences[0] == element) {
				passageReferences.splice(0, 1)
			}
			else {
				passageReferences.splice(1, 1)
			}

			highlightText(getReferenceText())
		}
		else {
			if (passageReferences.length == 0) {
				passageReferences.push(element)
				element.classList.add('highlight-yellow')
			}
			else if (passageReferences.length == 1) {
				passageReferences.push(element)
				highlightText(getReferenceText())
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

/*********************************************************
 *                    Event Listeners                    *
 *********************************************************/
testList.addEventListener('change', function () {
	if (testList.value == 'newTest') {
		formDisplay('test')
	}
	else {
		formDisplay('passage')

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

dom_questionList.addEventListener('change', function () {
	initializeQuestion(parseInt(dom_questionList.value))
})

/*dom_topic.addEventListener('change', function () {
	const section = document.getElementById('sectionList').value
	const topic = dom_topic.value
	console.log(section, topic)
	initializeSubTopicList(section, topic)
})*/
