const debug = true
const spaceSize = '   '

/*********************************************************
 *                   Global Variables                    *
 *********************************************************/
const date = new Date()
let storage = firebase.storage();



/*********************************************************
 *                        Functions                      *
 *********************************************************/

/**
 * This will cause MathJax to look for unprocessed mathematics on the page and typeset it
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function resetMathJax(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'resetMathJax()')
	}

	// Re-process the HTML text on the page
	MathJax.typeset()
}

/**
 *  This will grab an image from firebase storage
 * 
 * @param {string} test The test ID (ie. B05)
 * @param {string} section The section (possible values: english, math, reading, or science)
 * @param {string} passage The passage number (possible values: 1, 2, 3, 4, 5, 6, or 7)
 * @param {number} imageNumber The image number within the passage, question, or answer
 * @param {?number} question The question number (if applicable)
 * @param {?number} answer The answer number (if applicable)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {string} returns the url of the image
 */
async function getImage(test, section, passage, imageNumber, question = undefined, answer = undefined, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getImage()', {
			'test' : test,
			'section' : section,
			'passage' : passage,
			'imageNumber' : imageNumber,
			'question' : question,
			'answer' : answer
		})
	}

	// remove case sensitivity
	test = test.toUpperCase()
	section = section.toLowerCase()

	// Create the filename from the information passed in
	let filename = test.toUpperCase() + '-' + section.toLowerCase() + '-P' + passage.toString()
	if (question != undefined) {
		filename += '-Q' + question.toString()
		if (answer != undefined) {
			filename += '-A' + answer.toString()
		}
	}

	// Add the image number and '.png' to the filename
	filename += '-I' + imageNumber.toString() + '.png'

	// Grab and return the image url from firebase storage
	return await storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename).getDownloadURL()
}

/**
 * This will toggle the onclick of the HTML element whose id was passed in
 * 
 * @param {string} id The id of the HTML element to click
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function clickInput(section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'toggleImageInput()', {'section' : section})
	}

	// verify there is a location to place the image then click the input to find the file
	if (!document.getElementById(section + 'PassageText').value.includes('<image')) {
		console.log('Please type "<image>" where you want the image to be placed in the text first')
		return;
	}
	else {
		document.getElementById(section + 'Image').click()
	}
}

/**
 * 
 * @param {string} type Possible values are passage, question, and answer
 * @param {string} section ACT Section (Possible Values are english, math, reading, and science)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function addImage(type, section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'addImage()', {
			'type': type,
			'section' : section
		});
	}

	// Get the image
	let image = undefined
	let imageNumber = document.querySelectorAll("img[id^='image']").length + 1

	// Construct the filename for firebase
	let filename = undefined
	if (type == 'passage') {
		image = document.getElementById(section + 'Image').files[0]
		filename = document.getElementById('passageTest').value + '-' + section.toLowerCase() + '-P' + document.getElementById('passageNumber').value + '-I' + (imageNumber).toString() + '.png'
	}
	else if (type == 'question') {
		console.log('Not working right now')
		//filename = document.getElementById('passageTest').value + '-' + section.toLowerCase() + '-P' + document.getElementById('passageNumber').value + '-I' + (imageNumber).toString() + '.png'
		//filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-I' + (maxPassageImageNumber + 1).toString() + '.png'
	}
	else if (type == 'answer') {
		console.log('Not working right now')
		//const answerNumber = Array.prototype.indexOf.call(selectedWord.parentNode.parentNode.children, selectedWord.parentNode) + 1
		//filename = testList.value + '-' + dom_section.value + '-P' + passageNumber.value + '-Q' + dom_questionList.value + '-A' + (answerNumber).toString() + '-I' + (maxPassageImageNumber + 1).toString() + '.png'
		//console.log(passageNumber.value)
		//console.log(filename)
	}
	
	// Finalize the firebase reference
	let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)

	// Save the image in firebase
	let thisref = ref.put(image)

	// Increment the image number for reference
	thisref.on('state_changed', function (snapshot) {
	}, function (error) {
		console.log(error)
	}, function () {
		// Uploaded completed successfully, now we can get the download URL
		thisref.snapshot.ref.getDownloadURL().then(function (downloadURL) {

			// Setting image
			if (type == 'passage') {
				document.getElementById(section + 'PassageText').value = document.getElementById(section + 'PassageText').value.replaceAll('<image>', '<br><img id = "image' + imageNumber + '" src="' + downloadURL + '"><br>')
				setPassageText({'title' : document.getElementById(section + 'PassageTitle').value,
								'passageText' : document.getElementById(section + 'PassageText').value,
								'reference' : document.getElementById(section + 'PassageReference').value}, spacing + spaceSize)
				//document.getElementById(section + 'ImageCount').innerHTML = (imageNumber + 1).toString()
				//passageImages.push(downloadURL)
				//maxPassageImageNumber += 1
				//updateWorkingText(selectedWord, action)
			}
			else if (type == 'question') {
				console.log('Not Working')
				//maxQuestionImageNumber += 1
				//updateQuestionText(selectedWord, action)
			}
			else if (type == 'answer') {
				console.log('Not Working')
				//const answerNumber = Array.prototype.indexOf.call(selectedWord.parentNode.parentNode.children, selectedWord.parentNode) + 1
				//maxAnswerImageNumber[answerNumber - 1] += 1
				//updateAnswerText(selectedWord, action, maxAnswerImageNumber[answerNumber - 1])
			}

			document.getElementById(section + 'Image').value = null
		});
	});

}

/**
 * This will hide all display divs (id ends in 'Display') except for the one with the id
 * that was passed in
 * 
 * @param {*} id The id of the display type that is desired to be displayed (ie. testDisplay)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function selectDisplay(id, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'selectDisplay()', {'id' : id})
	}
	// Grab all display divs
	let displays = document.querySelectorAll('*[id$="Display"]')
	
	// Hide all display divs except for the one passed in
	for (let i = 0; i < displays.length; i++) {
		if (displays[i].id != id) {
			displays[i].classList.add('hidden')
		}
		else {
			displays[i].classList.remove('hidden')
		}
	}

	// Initialize, if needed
	if (id == 'testDisplay') {
		initializeTestDisplay(spacing + spaceSize)
	}
	else if (id == 'answersDisplay') {
		initializeAnswersDisplay(spacing + spaceSize)
	}
	else if (id == 'passageDisplay') {
		initializePassageDisplay(undefined, undefined, 1, spacing + spaceSize)
	}

}

/**
 * This will remove ALL children from a given HTML element
 * 
 * @param {string} id Id of the parent element
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function removeChildren(id, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'removeChildren()', {'id' : id})
	}
	// Find the HTML element
	let dom_parent = document.getElementById(id)

	// Continue to remove the first child until there are no more children
	while(dom_parent.children.length > 0) {
		dom_parent.firstChild.remove()
	}

}

/**
 * This will grab a test document from firebase
 * 
 * @param {string} test Test Code (ie. B05)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Object | boolean} Object (firebase doc object [doc not doc.data()]) or false if it doesn't exist
 */
async function getTestDocument(test, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getTestDocument()', {'test' : test})
	}

	// remove case sensitivity
	test = test.toUpperCase()

	// Set the firebase reference
	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'test')
	.where('test', '==', test.toUpperCase())

	// Grab the data from firebase
	let querySnapshot = await ref.get()

	// Return the test document
	if (querySnapshot.size > 0) {
		return querySnapshot.docs[0]
	}
	else {
		return false
	}
}

/**
 * This will grab a list of all tests that have been added to firebase
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Array} List of all test codes in firebase
 */
async function getTests(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getTests()')
	}
	// Set the firebase reference
	const ref = firebase.firestore().collection('ACT-Tests').where('type', '==', 'test')

	// Grab the data from firebase
	let querySnapshot = await ref.get()

	// Pull out the test code from the pulled data
	let tests = []
	querySnapshot.forEach((doc) => {
		let data = doc.data();
		if (!tests.includes(data['test'])) {
			tests.push(data['test'])
		}
	})

	// Return the list of tests
	return tests
}

/**
 * This will save / update the test information
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function saveTest(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'saveTest()')
	}
	// Set the firebase reference
	const ref = firebase.firestore().collection('ACT-Tests')

	// set / grab needed values
	let testCode = document.getElementById('testCode')
	const numInts = testCode.value.replace(/\D/g, '').length
	let year = document.getElementById('testYear')
	let month = document.getElementById('testMonth')

	// Set the data to define
	const data = {
		'test': testCode.value.toUpperCase(),
		'type': 'test',
		'year': parseInt(year.value),
		'month': month.value
	}

	// Validate, set data, and re-initialize the test list
	if (testCode.value.length = 3 && parseInt(year.value) <= date.getFullYear() && parseInt(year.value) >= 1959 && (numInts == 1 || numInts == 2)) {
		// Check to see if the test exists
		const response = await getTestDocument(document.getElementById('testList').value != 'newTest' ? document.getElementById('testList').value : testCode.value, spacing + spaceSize)

		// Set the data
		if (response == false) {
			await ref.doc().set(data)
		}
		else {
			console.log(response.id)
			await ref.doc(response.id).set(data)
		}

		// Re-initialize the display
		initializeTestDisplay(spacing + spaceSize)
	}
	else {
		console.log("The test must have exactly 3 characters: B05, 76C, A10, etc. (1 - 2 letters and 1 - 2 numbers)")
	}
}

/**
 * This will setup the tests display
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function initializeTestDisplay(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeTestDisplay()')
	}

	// Initialize the test list from the firebase tests
	await initializeTests('testList', spacing + spaceSize)

	// Set the max year to the current year
	let testYear = document.getElementById('testYear')
	testYear.setAttribute('max', date.getFullYear())
	testYear.setAttribute('value', date.getFullYear())

	// Set the Month to the current Month
	document.getElementById('testMonth').value = convertFromDateInt(date.getTime())['monthString']

	// Reset the test code
	document.getElementById('testCode').value = ''

}

/**
 * This will grab a question document from firebase
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (Possible Values: english, math, reading, science)
 * @param {number} question Question Number
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Object | boolean} Object (firebase doc object [doc not doc.data()]) or false if it doesn't exist
 */
async function getQuestionDocument(test, section, question, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getQuestionDocument()', {
			'test' : test,
			'section' : section,
			'question' : question
		})
	}

	// remove case sensitivity
	test = test.toUpperCase()
	section = section.toLowerCase()
	question = parseInt(question)

	// Set the firebase reference
	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test)
	.where('section', '==', section)
	.where('problem', '==', question)

	// Grab the question, if it exists
	const querySnapshot = await ref.get()
	if (querySnapshot.size == 1) {
		return querySnapshot.docs[0]
	}
	else {
		return false
	}
}

/**
 * This will setup the answers display
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function initializeAnswersDisplay(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeAnswersDisplay()')
	}

	// Initialize the test list from the firebase tests
	await initializeTests('answersTest', spacing + spaceSize)

	// Display the answers
	displayAnswerKey(document.getElementById('answersTest').value, document.getElementById('answersSection').value, spacing + spaceSize)

}

/**
 * 
 * @param {string} test The test ID (ie. B05)
 * @param {string} section The section (Possible Values: english, math, reading, science)
 * @param {number} passage The passage number
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Object | boolean} Object (firebase doc object [doc not doc.data()]) or false if it doesn't exist
 */
async function getPassageDocument(test, section, passage, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getPassageDocument()', {
			'test' : test,
			'section' : section,
			'passage' : passage
		})
	}

	// Generate the firebase reference
	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'passage')
	.where('test', '==', test.toUpperCase())
	.where('section', '==', section.toLowerCase())
	.where('passageNumber', '==', parseInt(passage))

	// Grab the data from firebase
	const querySnapshot = await ref.get()

	// Either return the data or false
	if (querySnapshot.size > 0) {
		return querySnapshot.docs[0]
	}
	else {
		return false
	}
}

/**
 * This will save the passage and all of its information to firebase
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function savePassage(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'savePassage()')
	}

	// Get the ref location
	const ref = firebase.firestore().collection('ACT-Tests')
	
	// Prepare the data
	let test = document.getElementById('passageTest').value.toUpperCase()
	let section = document.getElementById('passageSection').value
	let passageNumber = parseInt(document.getElementById('passageNumber').value)
	let text = document.getElementById(section + 'PassageText')
	let dom_reference = document.getElementById(section + 'PassageReference') ?? 'N/A'
	data = {
		'test' : test,
		'section' : section,
		'type' : 'passage',
		'title' : document.getElementById(section + 'PassageTitle').value,
		'passageText' : text.value,
		'passageNumber' : passageNumber,
		'shouldLabelParagraphs': ((section == 'english' && document.getElementById(section + 'LabelParagraphs').value == 0) ? false : true),
		'reference' : dom_reference.value ?? 'N/A'
	}

	console.log(data)

	// Validate then set the data
	if (text.value.length > 0) {
		let testResults = await getTestDocument(test, spacing + spaceSize)
		if (testResults != false) {
			let passageResults = await getPassageDocument(test, section, passageNumber, spacing + spaceSize)
			if (passageResults == false) {
				ref.doc().set(data)
				.then(() => {console.log("Set")})
			}
			else {
				ref.doc(passageResults.id).set(data)
				.then(() => {
					console.log("Updated")
				})
			}
		}
		else {
			console.log('How did you get here?!')
		}
	}
}

/**
 * This will setup the display to edit passages
 * 
 * @param {?string} test ACT test ID (ie. B05)
 * @param {?string} section ACT section (possible values are english, math, reading, and science)
 * @param {?number} passageNumber This is the passage number
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function initializePassageDisplay(test = undefined, section = undefined, passageNumber = 1, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializePassageDisplay()', {
			'test' : test,
			'section' : section,
			'passageNumber' : passageNumber
		})
	}

	// Delete any images that may remain in the DOM
	let images = document.querySelectorAll("img[id^='image']")
	for (let i = 0; i < images.length; i++ ) {
		images[images.length - i - 1].remove()
	}

	// Find the HTML elements
	let dom_test = document.getElementById('passageTest')
	let dom_section = document.getElementById('passageSection')
	let dom_passages = document.getElementById('passageNumber')

	// Display the correct section
	let passageDivs = document.querySelectorAll('div[id$="Passage"]')
	for (let i = 0; i < passageDivs.length; i++) {
		if (passageDivs[i].id != (section ?? dom_section.value) + 'Passage') {
			passageDivs[i].classList.add('hidden')
		}
		else {
			passageDivs[i].classList.remove('hidden')
		}
	}

	// Get a list of all available tests from firebase
	await initializeTests('passageTest', spacing + spaceSize)
	if (test != undefined) {
		dom_test.value = test
	}

	// Reset passage numbers
	removeChildren('passageNumber', spacing + spaceSize)

	// Identify how many passages there should be
	let passageCount = 0;
	switch(section ?? dom_section.value) {
		case 'english':
			passageCount = 5;
			break;
		case 'math':
			passageCount = 3;
			break;
		case 'reading':
			passageCount = 4;
			break
		case 'science':
			passageCount = 7;
			break;
		default:
			console.log('check your section spelling')
			return;
	}

	// Populate the passage list and set its value
	for (let i = 0; i < passageCount; i++) {
		dom_passages.appendChild(createElement('option', [], [], [], (i + 1).toString()))
	}
	dom_passages.value = passageNumber

	// Grab the passage from firebase
	let passageData = await getPassageDocument(test ?? dom_test.value, section ?? dom_section.value, passageNumber, spacing + spaceSize)
	if (passageData != false) {
		passageData = passageData.data()
	}

	// Display the title
	document.getElementById((section ?? dom_section.value) + 'PassageTitle').value = passageData['title'] ?? ''

	// Display the passage
	document.getElementById((section ?? dom_section.value) + 'PassageText').value = passageData['passageText'] ?? ''

	// Display the reference
	document.getElementById((section ?? dom_section.value) + 'PassageReference').value = passageData['reference'] ?? ''

	// Set the 'Label Paragraphs' tag
	if ((section ?? dom_section.value) == 'english') {
		document.getElementById((section ?? dom_section.value) + 'LabelParagraphs').value = (passageData['shouldLabelParagraphs'] ?? false) ? 1 : 0
	}

	// Display the info below
	setPassageText(passageData, spacing + spaceSize)
}

/**
 * This will remove all tests from the testList with the given id, get a list of all tests from firebase,
 * then repopulate the list with the current list of tests
 * 
 * @param {string} id The id of the HTML element to populate
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function initializeTests(id, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeTests()', {'id' : id})
	}

	// Delete the current list of tests
	removeChildren(id, spacing + spaceSize)

	// Find the HTML elements
	let dom_test = document.getElementById(id)

	// Add 'New Test', if applicable
	if (id == 'testList') {
		dom_test.appendChild(createElement('option', [], ['value'], ['newTest'], "New Test"))
	}

	// Get the list of tests from firebase and update the HTML with the list (only add new values)
	let tests = await getTests(spacing + spaceSize)

	// Sort the tests
	tests.sort()

	// Add the remaining tests
	for (let i = 0; i < tests.length; i++) {
		dom_test.appendChild(createElement('option', [], ['value'], [tests[i]], tests[i]))
	}

}

/**
 * This will grab the answer key from firebase
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (possible values = english, math, reading, or science)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Object} Object of answers for the given test ( { 1 : 'A', 2 : 'F', ...} )
 */
async function getAnswers(test, section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getAnswers()', {
			'test' : test,
			'section' : section
		})
	}

	// remove case sensitivity
	test = test.toUpperCase()
	section = section.toLowerCase()

	// Set the firebase reference
	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.where('test', '==', test)
	.where('section', '==', section)

	// The object that will be return
	let data = {}

	// Grab all answers and add them to the answers object
	const snapshot = await ref.get()
	if (snapshot.size > 0) {
		snapshot.forEach((doc) => {
			data[doc.data()['problem']] = doc.data()['correctAnswer']
		})
	}

	// Return the answers object
	return data
}

/**
 * This will create and display the answer key
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (Possible Values: english, math, reading, or science)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function displayAnswerKey(test, section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'displayAnswerKey()', {
			'test' : test,
			'section' : section
		})
	}

	// remove case sensitivity
	test = test.toUpperCase()
	section = section.toLowerCase()

	// Find the HTML elements
	let dom_answers = document.getElementById('answers')

	// Remove the current answer key
	removeChildren('answers', spacing + spaceSize)

	// Get the answer key from firebase
	let answers = await getAnswers(test, section, spacing + spaceSize)

	// Set the number of questions
	let count = 40;
	if (section == 'english') {
		count = 75;
	}
	else if (section == 'math') {
		count = 60;
	}

	// Display the answer key (columns of 10 questions at a time)
	for (let i = 0; i < Math.floor((count + 6) / 10); i++) {

		// Set the labels (10 at a time)
		let labelDiv = createElement('div', ['rows'], [], [], '')
		for (let j = 0; j < 10; j++) {
			if (i * 10 + j < count) {
				labelDiv.appendChild(createElement('label', [], ['id', 'for'], ['q' + (i * 10 + j + 1).toString() + 'Label', 'q' + (i * 10 + j + 1).toString()], (i * 10 + j + 1)));
			}
		}

		// Add the set of 10 labels
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

		// Add the set of 10 inputs
		dom_answers.appendChild(inputDiv)
	}
}

/**
 * This will set / update all answers if they are all valid. Otherwise, it will
 * reset the answers that aren't valid
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function saveAnswers(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'saveAnswers()')
	}

	// Grab all answers from the DOM and find other HTML elements
	const answers = document.querySelectorAll("input[id^='q']")
	let dom_section = document.getElementById('answersSection')
	let dom_test = document.getElementById('answersTest')

	// Specify the possible answer values
	const odds  = ['A', 'B', 'C', 'D']
	const evens = ['F', 'G', 'H', 'J']

	// Validate that all answers inputted are valid
	// If any are not valid, reset its value
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

	// If all the answers have been validated, then set / update their document in firebase
	if (isValidated == true) {
		for (let i = 0; i < answers.length; i++) {
			if (answers[i].value != '') {
				getQuestionDocument(dom_test.value, dom_section.value, (i + 1), spacing + spaceSize)
					.then((results) => {

						// Preset passage numbers, to the best of my ability
						let pNumber = -1
						if (dom_section.value == 'english') {
							pNumber = Math.floor(i / 15) + 1
						}
						else if (dom_section.value == 'reading') {
							pNumber = Math.floor(i / 10) + 1
						}

						// Doc doesn't exist yet - set
						if (results == false) {
							const data = {
								'test': dom_test.value,
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
							firebase.firestore().collection('ACT-Tests').doc(results.id).update({
								['correctAnswer']: answers[i].value.toUpperCase()
							})
						}
					})
			}
			else {
				console.log("'" + answers[i].value + "'")
			}
		}
		console.log("Finished Setting / Updating Answers")
	}
	else {
		console.log("Please correct your issues")
	}
	
}

// DELETE THIS FUNCTION - POSSIBLY
/**
 * This will take a string in and split it by spaces and '&mdash;' and return an array with each word
 * 
 * @param {string} text The text that will be split by spaces and '&mdash;'
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Array} An array with each word or Mdash
 */
function prepText(text, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'prepText()', {'text' : text})
	}

	// This is the array that will be returned
	let newText = text.split(' ')

	// Go through each word (split by a space) and check to see if it has an MDash (--) in it
	for (let i = 0; i < newText.length; i++) {
		if (newText[i].includes('&mdash;')) {
			const splitText = newText[i].split('&mdash;')
			if (splitText[0] != '') {
				newText[i] = splitText[0]
				newText.splice(i + 1, 0, '&mdash;')
				if (splitText[1] != '') {
					newText.splice(i + 2, 0, splitText[1])
				}
			}
			else if (splitText[1] != '') {
				newText[i] = '&mdash;'
				newText.splice(i + 1, 0, splitText[1])
			}
			else {
				newText[i] = '&mdash;'
			}
		}
	}

	// Return the parsed string
	return newText
}

/**
 * This will display the passage information
 * 
 * @param {Object} data This will contain all of the information to display
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function setPassageText(data, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'setPassageText()', data)
	}

	// Remove the current elements
	removeChildren('pText', spacing + spaceSize)

	// Find the HTML elements
	let dom_passage = document.getElementById('pText')

	// Set the title
	if (data['title'] != undefined && data['title'] != '') {
		dom_passage.appendChild(createElement('p', [], [], [], data['title']))
	}

	// Set the passage text
	if (data['passageText'] != undefined && data['passageText'] != '') {
		dom_passage.appendChild(createElement('p', [], [], [], data['passageText']))
	}

	// Set the passage text
	if (data['reference'] != undefined && data['reference'] != '') {
		dom_passage.appendChild(createElement('p', [], [], [], data['reference']))
	}

	// Reset the MathJax
	resetMathJax(spacing + spaceSize)
}


/*********************************************************
 *                    Event Listeners                    *
 *********************************************************/
let dom_test = document.getElementById('testList')
dom_test.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "testList")', {
			'value' : dom_test.value
		})
	}
	if (dom_test.value == 'newTest') {
		// Reset the year to the current year
		document.getElementById('testYear').value = date.getFullYear()
		
		// Reset the Month to the current Month
		document.getElementById('testMonth').value = convertFromDateInt(date.getTime())['monthString']

		// Reset the test code
		document.getElementById('testCode').value = ''

	}
	else {
		// Get the test document data
		let data = await getTestDocument(dom_test.value, spaceSize)

		// Display the year and month of the test
		let year = document.getElementById('testYear')
		let month = document.getElementById('testMonth')
		let code = document.getElementById('testCode')

		year.value = data.data()['year']
		month.value = data.data()['month']
		code.value = data.data()['test']

	}
})

let dom_answersTest = document.getElementById('answersTest')
dom_answersTest.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "answersTest")', {
			'value' : dom_answersTest.value
		})
	}

	// Display the answer key for the newly selected test
	displayAnswerKey(dom_answersTest.value, dom_answersSection.value, spaceSize)
})

let dom_answersSection = document.getElementById('answersSection')
dom_answersSection.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "answersSection")', {
			'value' : dom_answersSection.value
		})
	}

	// Display the answer key for the newly selected section
	displayAnswerKey(dom_answersTest.value, dom_answersSection.value, spaceSize)
})

let dom_titles = document.querySelectorAll('*[id$="PassageTitle"]')
for (let i = 0; i < dom_titles.length; i++) {
	dom_titles[i].addEventListener('input', function () {
		if (debug == true) {
			console.log('EVENT LISTENER (id = "' + dom_titles[i].id + '")')
		}

		// Display the newly adjusted text
		const section = document.getElementById('passageSection').value
		dom_titles[i].value = dom_titles[i].value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;').replaceAll('  ', ' ')
		setPassageText({'title' : dom_titles[i].value,
						'passageText' : document.getElementById(section + 'PassageText').value,
						'reference' : document.getElementById(section + 'PassageReference').value}
						, spaceSize)
	})
}

let dom_passages = document.querySelectorAll('*[id$="PassageText"]')
for (let i = 0; i < dom_passages.length; i++) {
	dom_passages[i].addEventListener('input', function () {
		if (debug == true) {
			console.log('EVENT LISTENER (id = "' + dom_passages[i].id + '")')
		}

		// Display the newly adjusted text
		const section = document.getElementById('passageSection').value
		dom_passages[i].value = dom_passages[i].value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;').replaceAll('  ', ' ')
		setPassageText({'title' : document.getElementById(section + 'PassageTitle').value,
						'passageText' : dom_passages[i].value,
						'reference' : document.getElementById(section + 'PassageReference').value}
						, spaceSize)
	})
}

let dom_references = document.querySelectorAll('*[id$="PassageReference"]')
for (let i = 0; i < dom_references.length; i++) {
	dom_references[i].addEventListener('input', function () {
		if (debug == true) {
			console.log('EVENT LISTENER (id = "' + dom_references[i].id + '")')
		}

		// Display the newly adjusted text
		const section = document.getElementById('passageSection').value
		dom_references[i].value = dom_references[i].value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;').replaceAll('  ', ' ')
		setPassageText({'title' : document.getElementById(section + 'PassageTitle').value,
						'passageText' : document.getElementById(section + 'PassageText').value,
						'reference' : dom_references[i].value}
						, spaceSize)
	})
}

let dom_passageTest = document.getElementById('passageTest')
dom_passageTest.addEventListener('change', function() {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "passageTest")')
	}

	// Re-initialize the display
	initializePassageDisplay(dom_passageTest.value, dom_passageSection.value, dom_passageNumber.value, spaceSize)
})

let dom_passageSection = document.getElementById('passageSection')
dom_passageSection.addEventListener('change', function() {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "passageSection")')
	}

	// Re-initialize the display
	initializePassageDisplay(dom_passageTest.value, dom_passageSection.value, dom_passageNumber.value, spaceSize)
})

let dom_passageNumber = document.getElementById('passageNumber')
dom_passageNumber.addEventListener('change', function() {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "passageNumber")')
	}

	// Re-initialize the display
	initializePassageDisplay(dom_passageTest.value, dom_passageSection.value, dom_passageNumber.value, spaceSize)
})






