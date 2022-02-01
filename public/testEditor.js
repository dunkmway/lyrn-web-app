const debug = false
const spaceSize = '   '

/*********************************************************
 *                   Global Variables                    *
 *********************************************************/
const date = new Date()
let storage = firebase.storage();
let mathJaxTimer = undefined



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

    clearTimeout(mathJaxTimer);
    mathJaxTimer = setTimeout(() => { MathJax.typeset() }, 250);
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
 * This is the 'addImage' helper function. It will grab all of the needed information from the DOM
 * 
 * @param {?string} text text to search for within the textareas
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Object} the object containing all of the information needed from the DOM
 */
function getImageDomInfo(text = undefined, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getImageDomInfo()', {
			'text' : text
		})
	}

	// Find the element to add the image to
	let elements = document.querySelectorAll('textarea')
	let element = undefined
	if (text == undefined || text == '') {
		for (let i = 0; i < elements.length; i++) {
			if (elements[i].value.includes('<image')) {
				element = elements[i]
				break
			}
		}
	}
	else {
		for (let i = 0; i < elements.length; i++) {
			if (elements[i].value.includes(text)) {
				element = elements[i]
				break
			}
		}
	}

	// Verify that '<image' can be found
	if (element == undefined) {
		return false
	}

	// Identify the displayType
	let type = undefined
	if (element.id.toLowerCase().includes('passage')) {
		type = 'passage'
	}
	else if (element.id.toLowerCase().includes('question')) {
		type = 'question'
	}
	else if (element.id.toLowerCase().includes('answer')) {
		type = 'answer'
	}

	// Identify the test
	const test = document.getElementById((type == 'passage' ? 'passage' : 'questions') + 'Test').value

	// Identify the section
	const section = document.getElementById((type == 'passage' ? 'passage' : 'questions') + 'Section').value

	// Identify the passage
	const passage = parseInt(document.getElementById((type == 'passage' ? 'passageNumber' : 'questionsPassageNumber')).value)

	// Identify the question, if applicable
	let question = undefined
	if (type != 'passage') {
		question = parseInt(document.getElementById('questionList').value)
	}

	// Identify the answer, if applicable
	let answer = undefined
	if (type == 'answer') {
		answer = parseInt(element.id.split(type)[1])
	}


	// Return the needed data
	return {
		'element' : element,
		'type' : type,
		'test' : test,
		'section' : section,
		'passage' : passage,
		'question' : question,
		'answer' : answer
	}

}

/**
 * This will toggle the onclick of the HTML element whose id was passed in
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function clickInput(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'clickInput()')
	}

	const data = getImageDomInfo(undefined, spacing + spaceSize)
	// verify there is a location to place the image then click the input to find the file
	if (data == false) {
		console.log('Please type "<image>" where you want the image to be placed in the text first')
		return;
	}
	else {
		document.getElementById((data['type'] == 'passage' ? data['section'] : 'questions') + 'Image').click()
	}
}

/**
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function addImage(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'addImage()')
	}

	// Get the DOM info
	const data = getImageDomInfo(undefined, spacing + spaceSize)
	
	// Get a list of all the image ids
	let imageTextarea = data['element'].value.split('<img')
	let imageIds = []

	for (let i = 1; i < imageTextarea.length; i++) {
		let idSplit = imageTextarea[i].split('id')[1].split('image')[1]
		number = ''
		for (let j = 0; j<idSplit.length; j++) {
			if (idSplit[j] != '"') {
				number += idSplit[j]
			}
			else {
				break
			}
		}
		imageIds.push(parseInt(number))
	}

	// Sort the image IDs
	imageIds.sort((a, b) => a - b)

	// Grab the next image id
	let imageNumber = 1
	for (let i = 0; i < imageIds.length + 1; i++) {
		if ((i + 1) != imageIds[i]) {
			imageNumber = i + 1
			break
		}
	}

	// Construct the filename for firebase and grab the image
	let filename = undefined
	let image = undefined
	if (data['type'] == 'passage') {
		image = document.getElementById(data['section'] + 'Image').files[0]
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-I' + (imageNumber).toString() + '.png'
	}
	else if (data['type'] == 'question') {
		image = document.getElementById('questionsImage').files[0]
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-Q' + data['question'] + '-I' + (imageNumber).toString() + '.png'
	}
	else if (data['type'] == 'answer') {
		image = document.getElementById('questionsImage').files[0]
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-Q' + data['question'].toString() + '-A' + data['answer'].toString() + '-I' + (imageNumber).toString() + '.png'
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

			// Setting image into text
			data['element'].value = data['element'].value.replaceAll('<image>', '<br><img id = "image' + imageNumber + '" src="' + downloadURL + '"><br>')

			// Reset the display
			if (data['type'] == 'passage') {
				document.getElementById(data['section'] + 'Image').value = null
				setPassageTextHelper(spacing + spaceSize)
			}
			else {
				document.getElementById('questionsImage').value = null
				saveQuestion(false, spacing + spaceSize)
			}

		});
	});

}

/**
 * 
 * @param {string} action action to take: toggle, remove, and add
 * @param {number} x x-coordinate for the menu
 * @param {number} y y-coordinate for the menu
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function displayRemovalMenu(action = 'toggle', x = 0, y = 0, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'displayRemovalMenu()', {
			'action' : action,
			'x' : x,
			'y' : y
		})
	}

	// Find the HTML element
	let dom_menu = document.getElementById('imageRemovalPopup')

	// Take the action specified
	if (action == 'toggle') {
		dom_menu.classList.toggle('hidden')
	}
	else if (action == 'remove') {
		dom_menu.classList.add('hidden')
	}
	else if (action == 'add') {
		dom_menu.classList.remove('hidden')
	}

	// Position the menu
	dom_menu.style.left = (parseInt(x) + 30).toString() + 'px'
	dom_menu.style.top = y + 'px'
}

/**
 * 
 * @param {element} element textarea DOM element where the image to be deleted is found
 * @param {number} number Integer representing the id of the image to be deleted
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {string} the text between '<br><img' and '><br>'
 */
function getImageString(element, number, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getImageString()', {
			'element' : element,
			'number' : number
		})
	}

	// Needed variables
	let finalString = '<br><img'
	const workingText = element.value.split('<img')

	// Find the image and read the text in between '<img' and '>'
	for (let i = 1; i < workingText.length; i++) {

		if (parseInt(workingText[i].split('id')[1].split('"')[1].replace('image', '')) == number) {

			let j = 0;
			while (workingText[i][j] != '>') {
				finalString += workingText[i][j]
				j += 1
			}
			finalString += '><br>'
			break
		}
	}

	// Return the image string
	return finalString
}

/**
 * This will remove the image selected
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function removeImage(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'removeImage()')
	}

	// Get the image number for the selected image
	const imageNumber = parseInt(selectedImage.id.replace('image', ''))

	// Find the element that needs the text removed
	let elements = document.querySelectorAll('textarea')
	let element = undefined
	let data = getImageDomInfo(selectedImage.src, spacing + spaceSize)
	const imageString = getImageString(data['element'], imageNumber, spacing + spaceSize)
	for (let i = 0; i < elements.length; i++) {
		if (elements[i].value.includes(imageString)) {
			element = elements[i]
			break
		}
	}

	// Remove the image from the text
	element.value = element.value.replace(imageString, '');

	let filename = undefined
	if (data['type'] == 'passage') {
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-I' + (imageNumber).toString() + '.png'
	}
	else if (data['type'] == 'question') {
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-Q' + data['question'] + '-I' + (imageNumber).toString() + '.png'
	}
	else if (data['type'] == 'answer') {
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-Q' + data['question'].toString() + '-A' + data['answer'].toString() + '-I' + (imageNumber).toString() + '.png'
	}

	let ref = storage.refFromURL('gs://lyrn-web-app.appspot.com/Images/Tests/' + filename)
	ref.delete()
		.then(() => {
			if (data['type'] == 'passage') {
				initializePassageDisplay(data['test'], data['section'], data['passage'], spacing + spaceSize)
				savePassage(spacing + spaceSize)
			}
			else {
				saveQuestion(false, spacing + spaceSize)
			}
			displayRemovalMenu('remove', spacing + spaceSize)
		})
		.catch((err) => {
			console.log(err)
		})
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

	// Reset the bottom half
	removeChildren('pText', spacing + spaceSize)
	removeChildren('qNumbers', spacing + spaceSize)
	removeChildren('qList', spacing + spaceSize)

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
	
	// Hide the semantics UI stuff manually as it's finicky
	document.getElementById('topic').parentNode.style = 'display:none'
	document.getElementById('modifier').parentNode.style = 'display:none'

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
	else if (id == 'scaledScoresDisplay') {
		initializeScaledScoresDisplay(spacing + spaceSize)
	}
	else if (id == 'questionsDisplay') {
		document.getElementById('topic').parentNode.style = ''
		document.getElementById('modifier').parentNode.style = ''
		initializeQuestionsDisplay(undefined, undefined, undefined, undefined, spacing + spaceSize)
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
 * This will initialize the dropdown of questions
 * 
 * @param {?string} section ACT section (possible values are english, math, reading, and science)
 */
function initializeQuestionList(section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeQuestionList()', {'section' : section})
	}

	// Identify the total number of questions
	let count = 40

	if (section.toLowerCase() == 'english') {
		count = 75;
	}
	else if (section.toLowerCase() == 'math') {
		count = 60;
	}

	// Delete the current list of questions
	let dom_questionList = document.getElementById('questionList')
	while (dom_questionList.firstChild) {
		dom_questionList.removeChild(dom_questionList.firstChild)
	}

	// Add the needed questions
	for (let i = 0; i < count; i++) {
		dom_questionList.appendChild(createElement('option', [], ['value'], [i + 1], (i + 1).toString()))
	}
}

/**
 * 
 * @param {element} element The ACT answer element to mark as correct
 * @param {?string} section ACT section (possible values are english, math, reading, and science)
 */
function selectAnswer(element = undefined, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'selectAnswer()', {'element' : element})
	}

	// Find the HTML elements
	let answers = document.getElementById('questionsPart2').querySelectorAll('label')

	// De-select all answers
	for (let i = 0; i < answers.length; i++) {
		answers[i].classList.remove('correctAnswer')
	}

	// select the correct answer, if applicable
	if (element != undefined) {
		element.classList.add('correctAnswer')
	}
}

/**
 * 
 * @param {number} number The question to reset
 * @param {?string} section ACT section (possible values are english, math, reading, and science)
 */
function resetQuestion(number, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'resetQuestion()', {'number' : number})
	}

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
	selectAnswer(undefined, spacing + spaceSize)

	// Set the answers
	const section = document.getElementById('questionsSection').value
	for (let i = 0; i < (section != 'math' ? 4 : 5); i++) {
		document.getElementById('answer' + (i + 1).toString()).value = ''
	}

	// Set the question text
	document.getElementById('questionText').value = ''

	// Set the question
	document.getElementById('questionList').value = number

}

/**
 * 
 * @param {string} section The section for which the topics should be initialized
 * @param {?string} section ACT section (possible values are english, math, reading, and science)
 */
async function initializeTopicList(section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeTopicList()', {'section' : section})
	}

  	$('.ui.dropdown').dropdown();

	// Grab the data from firebase
	const ref = firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics')
	.where('section', '==', section)
	.where('type', '==', 'topic')

	// Get the HTML element
	let dom_topic = document.getElementById('topic')

	// Delete the current list of topics
	removeChildren('topic', spacing + spaceSize)

	// Get the topics from firebase
	let topics = []
	let querySnapshot = await ref.get()
	querySnapshot.forEach((doc) => {
		topics.push(doc.data().topic)
	})

	// Sort the topics alphabetically
	topics.sort()

	// Add the topics to the dom
	dom_topic.appendChild(createElement('option', [], ['value'], [''], 'None Selected'))
	for (let i = 0; i < topics.length; i++) {
		dom_topic.appendChild(createElement('option', [], ['value'], [topics[i]], topics[i]))
	}

	// initialize the modifier list
	await initializeModifierList(section);
}

/**
 * 
 * @param {string} section The section for which the modifiers should be initialized
 * @param {?string} section ACT section (possible values are english, math, reading, and science)
 */
async function initializeModifierList(section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeModifierList()', {'section' : section})
	}

	// Grab the data from firebase
	const ref = firebase.firestore().collection('Dynamic-Content').doc('curriculum-topics').collection('Topics').where('section', '==', section).where('type', '==', 'modifier')

	// Get the HTML element
	let dom_modifier = document.getElementById('modifier')

	// Delete the current list of topics
	removeChildren('modifier', spacing + spaceSize)

	let topics = []
	let querySnapshot = await ref.get()
	querySnapshot.forEach((doc) => {
		topics.push(doc.data().topic)
	})

	topics.sort()
	dom_modifier.appendChild(createElement('option', [], ['value'], [''], 'None Selected'))
	for (let i = 0; i < topics.length; i++) {
		dom_modifier.appendChild(createElement('option', [], ['value'], [topics[i]], topics[i]))
	}
}

/**
 * This will setup the display to edit questions
 * 
 * @param {?string} test ACT test ID (ie. B05)
 * @param {?string} section ACT section (possible values are english, math, reading, and science)
 * @param {?number} passageNumber This is the passage number
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function initializeQuestionsDisplay(test = undefined, section = undefined, passage = undefined, question = undefined, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeQuestionsDisplay()', {
			'test' : test,
			'section' : section,
			'passage' : passage,
			'question' : question
		})
	}

	// Find the HTML elements
	let dom_test = document.getElementById('questionsTest')
	let dom_section = document.getElementById('questionsSection')
	let dom_passage = document.getElementById('questionsPassageNumber')
	let dom_questionList = document.getElementById('questionList')

	if (test == undefined || test == '') {
		test = dom_test.value
	}

	if (section == undefined || section == '') {
		section = dom_section.value
	}

	if (passage == undefined || passage == '') {
		passage = dom_passage.value
	}

	// Display the 5th question if it's the math section
	if (section == 'math') {
		document.getElementById('answer5').classList.remove('hidden')
		document.getElementById('answer5Label').classList.remove('hidden')
	}
	else {
		document.getElementById('answer5').classList.add('hidden')
		document.getElementById('answer5Label').classList.add('hidden')
	}

	// Display the 'should highlight text' toggle if it's the reading section
	/*if (section == 'reading') {
		document.getElementById('shouldHighlightText').classList.remove('hidden')
		document.getElementById('shouldHighlightTextLabel').classList.remove('hidden')
	}
	else {
		document.getElementById('shouldHighlightText').classList.add('hidden')
		document.getElementById('shouldHighlightTextLabel').classList.add('hidden')
	}*/

	// Set the test
	await initializeTests('questionsTest', spacing + spaceSize)
	if (test != undefined && test != '') {
		dom_test.value = test.toUpperCase()
	}

	// Reset passage numbers
	removeChildren('questionsPassageNumber', spacing + spaceSize)

	// Identify how many passages there should be
	let passageCount = 0;
	switch(dom_section.value) {
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

	if (section != undefined && section != '') {
		dom_section.value = section.toLowerCase()
	}

	// Populate the question numbers dropdown and set its value
	if (dom_section.value == 'math') {
		dom_passage.appendChild(createElement('option', [], ['value'], [-1], '-1'))
	}

	for (let i = 0; i < passageCount; i++) {
		dom_passage.appendChild(createElement('option', [], ['value'], [(i + 1)], (i + 1).toString()))
	}
	if (passage != undefined && passage != '' && parseInt(passage) <= passageCount) {
		dom_passage.value = parseInt(passage)
	}

	// Initialize the topic and modifier lists
	initializeTopicList(dom_section.value, spacing + spaceSize)

	// Initialize the number of questions
	initializeQuestionList(dom_section.value, spacing + spaceSize)

	// Reset the Question
	resetQuestion(question ?? 1, spacing + spaceSize)

	// Grab the data and place it into the DOM
	let data = await getQuestionDocument(dom_test.value, dom_section.value, dom_questionList.value, spacing + spaceSize)
	if (data != false) {
		data = data.data()
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

		// Set the Passage Number
		if (dom_passage.value != data['passage']) {
			dom_passage.value = data['passage']
		}

		// Set the bottom half - passage
		setPassageText(await getPassageDocument(dom_test.value, dom_section.value, dom_passage.value, spacing + spaceSize), spacing + spaceSize)

		// Set the correct answer
		selectAnswer(document.getElementById('answer' + questionLocations[data['correctAnswer']].toString() + 'Label'), spacing + spaceSize)

		// Set the answers
		for (let i = 0; i < data['answers'].length; i++) {
			document.getElementById('answer' + (i + 1).toString()).value = data['answers'][i]
		}

		// Set the question text
		document.getElementById('questionText').value = data['questionText']

		// Initialize the Question Preview
		initializeQuestionPreview(data['questionText'], data['answers'], data['problem'], spacing + spaceSize)

		// Initialize the Question Numbers list
		initializeQuestionNumbersList(data['test'], data['section'], spacing + spaceSize)

		// Initialize whether the text should be highlighted or not
		//document.getElementById('shouldHighlightText').value = data['shouldHighlightText'] == true ? 1 : 0

		// Remove text highlighting
		let elements = document.getElementById('pText').querySelectorAll('span')
		for (let i = 0; i < elements.length; i++) {
			elements[i].classList.remove('spotlight')
			elements[i].classList.remove('box')
		}

		// Highlight the text, if necessary
		if (data['section'] == 'english' || data['section'] == 'reading') {
			/*let ele = document.querySelector('span[id="' + data['problem'].toString() + '"]')
			let ele = document.querySelector('span[data-question="' + data['problem'].toString() + '"]')
			if (ele != undefined && parseInt(ele.innerHTML) >= 1 && parseInt(ele.innerHTML) <= 75) {
				ele.classList.add('box')
			}
			else if (ele != undefined && ele.innerHTML != '' && ele.innerHTML != undefined) {
				ele.classList.add('spotlight')
			}*/
			let elements = document.querySelectorAll('span[data-question="' + data['problem'].toString() + '"]')
			elements.forEach(ele => {
				if (ele != undefined && parseInt(ele.innerHTML) >= 1 && parseInt(ele.innerHTML) <= 75) {
					ele.classList.add('box')
				}
				else if (ele != undefined && ele.innerHTML != '' && ele.innerHTML != undefined) {
					ele.classList.add('spotlight')
				}
			})
		}
	}

	// Reset Math Jax
	resetMathJax()

}

/**
 * 
 * @param {string} question The question text to display
 * @param {string} answers The answers to display
 * @param {number} number The question at hand
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function initializeQuestionPreview(question, answers, number, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeQuestionPreview()', {
			'question' : question,
			'answers' : answers,
			'number' : number
		})

	}

	// Define the possible answers
	const answerLetters = ['F', 'G', 'H', 'J', 'K', 'A', 'B', 'C', 'D', 'E']

	// Reset the list
	removeChildren('qList', spacing + spaceSize)

	// Get the HTML elements
	const dom_qList = document.getElementById('qList')

	// Display the question
	if (question != undefined && question != '') {
		dom_qList.appendChild(createElement('p', ['questionText'], [], [], question))
	}

	// Display the answers
	let answerDiv = createElement('div', ['answerText'], [], [], '')
	for (let i = 0; i < answers.length; i++) {
		answerDiv.appendChild(createElement('p', [], [], [], answerLetters[i + ((number % 2) * 5)] + ') ' + answers[i]))
	}
	dom_qList.appendChild(answerDiv)

}

/**
 * 
 * @param {string} test The ACT test
 * @param {string} section The ACT section
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function initializeQuestionNumbersList(test, section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeQuestionNumbersList()', {
			'test' : test,
			'section' : section
		})
	}

	removeChildren('qNumbers', spacing + spaceSize)
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
				if (doc.data().answers.length == (section != 'math' ? 4 : 5) && doc.data().answers[0] != "") {
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
				dom_finishedQuestions.appendChild(createElement('div', ['problem', data[(i + 1)]], ['onclick'], ["initializeQuestionsDisplay('', '', '', " + (list[i]).toString() + ")"], list[i].toString()))
			}
		}
	})
}

/**
 * 
 * @param {string} dropdownId The id of the semantics UI dropdown (multiple) that you want the values from
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Array} Array containing all selected values
 */
function getDropdownValues(dropdownId, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getDropdownValues()', {'dropdownId' : dropdownId})
	}

	// Get the HTML element
  	const inputs = document.getElementById(dropdownId).parentNode.querySelectorAll(".ui.label");
  
	// Grab the values
  	let values = []
  	inputs.forEach((input) => {
    	values.push(input.dataset.value)
  	})

	// Return the values
  	return values;
}



/**
 * 
 * @param {boolean} goToNext Specify whether to display the next question after saving or not
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns 
 */
async function saveQuestion(goToNext = true, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'saveQuetion()', {'goToNext' : goToNext})
	}

	// Set the Firebase reference
	let ref = firebase.firestore().collection('ACT-Tests')

	// Find the HTML elements
	const test = document.getElementById('questionsTest').value
	const section = document.getElementById('questionsSection').value
	const passage = parseInt(document.getElementById('questionsPassageNumber').value)
	const number = parseInt(document.getElementById('questionList').value)

	// Get the correct Answer
	let answer = document.getElementsByClassName('correctAnswer')
	if (answer.length > 0) {
		answer = answer[0].innerHTML
	}
	else {
		console.log("Please select the correct answer by clicking on its letter")
		return
	}

	// Validate the passage Number
	if ((passage < 1 && section != 'math') || (passage > 7)) {
		console.log("Check the Passage Number")
		return
	}

	// Initialize the attempts
	let attempts = 0;
	let correctAttempts = 0

	// Get the possible answers' text
	let answers = []
	for (let i = 0; i < (section != 'math' ? 4 : 5); i++) {
		answers.push(document.getElementById('answer' + (i + 1).toString()).value)
	}

	// Check to see if the questions exists already or not; if so, grab the id and attempts
	// Otherwise, finalize the Firebase Reference
	let info = await getQuestionDocument(test, section, number, spacing + spaceSize)
	if (info != false) {
		attempts = info.data()['numberOfAttempts']
		correctAttempts = info.data()['correctAttempts']
		ref = ref.doc(info.id)
	}
	else {
		ref = ref.doc()
	}

	// Grab the topics and modifiers
	const topics = getDropdownValues('topic', spacing + spaceSize)
	const modifiers = getDropdownValues('modifier', spacing + spaceSize)

	// Identify whether the answer should be highlighted or not
	/*let shouldHighlightText = false
	if (section == 'reading' && document.getElementById('shouldHighlightText').value == 1) {
		shouldHighlightText = true
	}*/

	// Remove extra spaces
	let dom_text = document.getElementById('questionText')
	while (dom_text.value.includes('  ')) {
		dom_text.value = dom_text.value.replaceAll('  ', ' ')
	}

	for (let i = 0; i < answers.length; i++) {
		while (answers[i].includes('  ')) {
			answers[i] = answers[i].replaceAll('  ', ' ')
		}
	}

	// Create the data that will be sent to Firebase
	if (answers.length == (section != 'math' ? 4 : 5)) {
		const data = {
			'test': test,
			'section': section,
			'passage': passage,
			'type': 'question',
			'topic': topics,
			'subTopics': 'None',
			'modifier': modifiers,
			'problem': number,
			'questionText': dom_text.value,
			'answers': answers,
			'correctAnswer': answer,
			'numberOfAttempts': attempts,
			'correctAttempts': correctAttempts
			//'shouldHighlightText' : shouldHighlightText
		}

		// Set the data
		await ref.set(data)

		// Add the question to the list of questions if it isn't there already
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
		if (answers.length == (section != 'math' ? 4 : 5) && answers[0] != "") {
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

		// Reset the question display
		if (goToNext == true) {
			const counts = {'english' : 75, 'math' : 60, 'reading' : 40, 'science' : 40}
			if (number != counts[section]) {
				initializeQuestionsDisplay(test, section, passage, number + 1, spacing + spaceSize)
			}
		}
		else {
			initializeQuestionsDisplay(test, section, passage, number, spacing + spaceSize)
		}

		// Finished!!
		console.log('It is done')
	}
}

/*async function updateTestStatus(test, section = undefined, passage = undefined) {
	

	if (passage == undefined) {
	}

	if (section == undefined) {
	}

	const num_questions = (section == 'english') ? 75 : ((section == 'math') ? 60 : 40)

	const stage2Count = document.getElementById('qNumbers').querySelectorAll('.stage2').length
	const stage3Count = document.getElementById('qNumbers').querySelectorAll('.stage3').length

	console.log(stage2Count)
	console.log(stage3Count)
*/
	/*let stage_counts = [0, 0, 0]
	let question_promises = []
	for (let i = 0 ; i < num_questions; i++) {
		question_promises.push(getQuestionDocument(test, section, i + 1)
		.then((doc) => {
			if (doc.data().answers.length == (section != 'math' ? 4 : 5) && doc.data().answers[0] != "") {
				if (doc.data().topic.length != 0) {
					stage_counts[2] += 1
				}
				else {
					stage_counts[1] += 1
				}
			}
			else {
				stage_counts[0] += 1
			}
		})
		)
	}

	let question_results = await Promise.all(question_promises)*/
/*
	if (stage3Count == num_questions) {
		let passageResults = await getPassageDocument(test, section, passageNumber, spacing + spaceSize)
		if (passageResults != false) {
			ref.doc(passageResults.id).update({
				'passageStatus' : 'Needs Topics'
		})
	}
	elif (stage2Count == num_questions) {
	}
	}
}*/

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
 * This will setup the scaled scores display
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function initializeScaledScoresDisplay(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeScaledScoresDisplay()')
	}

	// initialize tests by grabbing them from firebase
	await initializeTests('scaledScoresTest', spacing + spaceSize)

	// Display the scaled scores
	displayScaledScores(document.getElementById('scaledScoresTest').value, document.getElementById('scaledScoresSection').value, spacing + spaceSize)
}

/**
 * This will create and display the scaled scores key
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (Possible Values: english, math, reading, or science)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function displayScaledScores(test, section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'displayScaledScores()', {
			'test' : test,
			'section' : section
		})
	}

	// remove case sensitivity
	test = test.toUpperCase()
	section = section.toLowerCase()

	// Find the HTML elements
	let dom_scaledScores = document.getElementById('scaledScores')

	// Remove the current answer key
	removeChildren('scaledScores', spacing + spaceSize)

	// Get the answer key from firebase
	let scaledScores = await getScaledScoresDocument(test, section, spacing + spaceSize)

	// Add the scaled scores in columns of 12 each
	for (let i = 0; i < 3; i++) {
		dom_labels = createElement('div', ['rows'], ['style'], ['margin-left: 50px; align-items: center;'], '')
		dom_labels.appendChild(createElement('label', [], [], [], 'Scaled Score'))
		dom_scores = createElement('div', ['rows'], ['style'], ['margin-left: 10px; align-items: center;'], '')
		dom_scores.appendChild(createElement('label', [], [], [], 'Min Score'))

		// Create the labels and inputs (12)
		for (let j = 0; j < 12; j++) {
			dom_labels.appendChild(createElement('label', [], ['for'], ['ss' + (36 - (i * 12) - j).toString()], (36 - (i * 12) - j).toString()))
			if (scaledScores != false) {
				dom_scores.appendChild(createElement('input', [], ['id', 'value'], ['ss' + (36 - (i * 12) - j).toString(), (scaledScores.data()['scaledScores'][(36 - (i * 12) - j)] != -1) ? scaledScores.data()['scaledScores'][(36 - (i * 12) - j)].toString() : '-'], ''))
			}
			else {
				dom_scores.appendChild(createElement('input', [], ['id'], ['ss' + (36 - (i * 12) - j).toString()], ''))
			}
		}

		// Add the columns created (labels and inputs) to the dom
		dom_scaledScores.appendChild(dom_labels)
		dom_scaledScores.appendChild(dom_scores)
	}

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
	let dom_reference = document.getElementById(section + 'PassageReference') ?? ''
	const preText = (section == 'reading') ? document.getElementById('readingPassagePreText').value : ''
	let ABData = {}

	// Remove the paragraph labels, if needed
	for (let i = 0; i < 5; i++) {
		text.value = text.value.replaceAll('<b>' + (i + 1).toString() + '</b><br> ', '')
	}

	// Remove extra spaces
	let dom_abText = document.getElementById('readingPassageTextB').value
	if (dom_abText.value != undefined) {
		while (dom_abText.value.includes('  ')) {
			dom_abText.value = dom_abText.value.replaceAll('  ', ' ')
		}
	}


	// Add the A/B passage information if needed
	if (section == 'reading' && dom_AB.value == 1) {
		ABData['title'] = document.getElementById('readingPassageTitleB').value
		ABData['passageText'] = document.getElementById('readingPassageTextB').value
		ABData['reference'] = document.getElementById('readingPassageReferenceB').value
	}

	// Remove extra spaces
	while (text.value.includes('  ')) {
		text.value = text.value.replaceAll('  ', ' ')
	}

	data = {
		'test' : test,
		'section' : section,
		'type' : 'passage',
		'title' : document.getElementById(section + 'PassageTitle').value,
		'passageText' : text.value,
		'passageNumber' : passageNumber,
		'preText' : preText,
		'shouldLabelParagraphs': ((section == 'english' && document.getElementById(section + 'LabelParagraphs').value == 1) ? true : false),
		'reference' : dom_reference.value ?? '',
		'ABData' : ABData
	}

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
		dom_passages.appendChild(createElement('option', [], ['value'], [(i + 1)], (i + 1).toString()))
	}
	dom_passages.value = passageNumber

	// Grab the passage from firebase
	let passageData = await getPassageDocument(test ?? dom_test.value, section ?? dom_section.value, passageNumber, spacing + spaceSize)
	if (passageData != false) {
		passageData = passageData.data()
	}

	// Display the preText
	try {
		document.getElementById((section ?? dom_section.value) + 'PassagePreText').value = passageData['preText'] ?? ''
	}
	catch {
		//console.log('Missing ' + (section ?? dom_section.value) + 'PassagePreText')
	}

	// Display the title
	try {
		document.getElementById((section ?? dom_section.value) + 'PassageTitle').value = passageData['title'] ?? ''
	}
	catch {
		//console.log('Missing ' + (section ?? dom_section.value) + 'PassageTitle')
	}

	// Add the paragraph labels, if needed
	if (passageData['shouldLabelParagraphs'] == true && passageData['section'] == 'english' && passageData['passageText'] != undefined && passageData['passageText'] != '' && !passageData['passageText'].includes('<b>1</b>')) {
		let splitText = passageData['passageText'].split('<br><br>')
		
		for (let i = 0; i < splitText.length; i++) {
			splitText[i] = '<b>' + (i + 1).toString() + '</b><br> ' + splitText[i]
		}

		passageData['passageText'] = splitText.join('<br><br>')
	}

	// Display the passage
	try {
		document.getElementById((section ?? dom_section.value) + 'PassageText').value = passageData['passageText'] ?? ''
	}
	catch {
		//console.log('Missing ' + (section ?? dom_section.value) + 'PassageText')
	}

	// Display the reference
	try {
		document.getElementById((section ?? dom_section.value) + 'PassageReference').value = passageData['reference'] ?? ''
	}
	catch {
		//console.log('Missing ' + (section ?? dom_section.value) + 'PassageReference')
	}

	// Extra displays for reading
	if ((section ?? dom_section.value) == 'reading') {

		// Display the title - B
		if (passageData['ABData']?.['title'] != undefined && passageData['ABData']?.['title'] != '') {
			document.getElementById((section ?? dom_section.value) + 'PassageTitleB').value = passageData['ABData']['title']
		}
		else {
			document.getElementById((section ?? dom_section.value) + 'PassageTitleB').value = ''
		}

		// Display the passageText - B
		if (passageData['ABData']?.['passageText'] != undefined && passageData['ABData']?.['passageText'] != '') {
			document.getElementById((section ?? dom_section.value) + 'PassageTextB').value = passageData['ABData']['passageText']
		}
		else {
			document.getElementById((section ?? dom_section.value) + 'PassageTextB').value = ''
		}

		// Display the reference - B
		if (passageData['ABData']?.['reference'] != undefined && passageData['ABData']?.['reference'] != '') {
			document.getElementById((section ?? dom_section.value) + 'PassageReferenceB').value = passageData['ABData']['reference']
		}
		else {
			document.getElementById((section ?? dom_section.value) + 'PassageReferenceB').value = ''
		}

		// Set the 'hasABPassges' toggle - B
		if (passageData['ABData'] != undefined && Object.keys(passageData['ABData']).length > 0) {
			document.getElementById('hasABPassages').value = 1
			document.getElementById('passageB').classList.remove('hidden')
		}
		else {
			document.getElementById('hasABPassages').value = 0
			document.getElementById('passageB').classList.add('hidden')
		}

	}

	// Set the 'Label Paragraphs' tag
	if ((section ?? dom_section.value) == 'english') {
		document.getElementById((section ?? dom_section.value) + 'LabelParagraphs').value = (passageData['shouldLabelParagraphs'] ?? false) ? 1 : 0
	}

	// Display the info below
	setPassageText(passageData, spacing + spaceSize)

	// Highlight all spans
	let elements = document.getElementById('pText').querySelectorAll('span')
	for (let i = 0; i < elements.length; i++) {

		const ele = elements[i]
		if ((section ?? dom_section.value) == 'english' || (section ?? dom_section.value) == 'reading') {
			if (ele != undefined && parseInt(ele.innerHTML) >= 1 && parseInt(ele.innerHTML) <= 75) {
				ele.classList.add('box')
			}
			else if (ele != undefined && ele.innerHTML != '' && ele.innerHTML != undefined) {
				ele.classList.add('spotlight')
			}
		}

	}
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
 * This will grab the scaled scores from firebase
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (possible values = english, math, reading, or science)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Object} Firebase object with the scaled scores data
 */
async function getScaledScoresDocument(test, section, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getScaledScoresDocument()', {
			'test' : test,
			'section' : section
		})
	}

	// remove case sensitivity
	test = test.toUpperCase()
	section = section.toLowerCase()

	// Set the firebase reference
	const ref = firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'scaledScores')
	.where('test', '==', test)
	.where('section', '==', section)

	// Return the false for no documents found, the data if only one document was found, or -1 for multiple documents found (should never happen)
	const snapshot = await ref.get()
	if (snapshot.size == 0) {
		return false
	}
	else if (snapshot.size == 1) {
		return snapshot.docs[0]
	}
	else {
		return -1
	}

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
				labelDiv.appendChild(createElement('label', [], ['id', 'for'], ['qq' + (i * 10 + j + 1).toString() + 'Label', 'qq' + (i * 10 + j + 1).toString()], (i * 10 + j + 1)));
			}
		}

		// Add the set of 10 labels
		dom_answers.appendChild(labelDiv)

		// Set the inputs (10 at a time)
		let inputDiv = createElement('div', ['rows'], [], [], '')
		for (let j = 0; j < 10; j++) {
			if (i * 10 + j < count) {
				if (answers[i * 10 + j + 1]) {
					inputDiv.appendChild(createElement('input', [], ['id', 'value'], ['qq' + (i * 10 + j + 1).toString(), answers[i * 10 + j + 1]], ''));
				}
				else {
					inputDiv.appendChild(createElement('input', [], ['id'], ['qq' + (i * 10 + j + 1).toString()], ''));
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
	const answers = document.querySelectorAll("input[id^='qq']")
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

/**
 * This will set / update all scaled scores if they are all valid. Otherwise, it will
 * reset the scores that aren't valid
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function saveScaledScores(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'saveScaledScores()')
	}

	// Grab all answers from the DOM and find other HTML elements
	const scores = document.querySelectorAll("input[id^='ss']")
	let dom_section = document.getElementById('scaledScoresSection')
	let dom_test = document.getElementById('scaledScoresTest')

	// Identify the max value
	let maxValue = 40;
	if (dom_section.value == 'english') {
		maxValue = 75;
	}
	else if (dom_section.value == 'math') {
		maxValue = 60
	}

	// Validate that all scaled scores inputted are valid
	// If any are not valid, reset its value
	let isValidated = true
	let scaledScores = {}
	for (let i = 0; i < scores.length; i++) {
		scaledScores[parseInt(scores[i].id.split('ss')[1])] = (scores[i].value == '' || scores[i].value == '-' ? -1 : parseInt(scores[i].value))
		if (!(scores[i].value == '' || scores[i].value == '-' || (parseInt(scores[i].value) <= maxValue && parseInt(scores[i].value) >= 0))) {
			scores[i].value = ''
			isValidated = false
		}
	}

	// Make sure the values get larger from a scaled score of 1 to 36
	let value = scaledScores[1]
	for (let i = 0; i < scores.length - 1; i++) {
		if (scaledScores[i + 2] > value) {
			value = scaledScores[i + 2]
		}
		else if (scaledScores[i + 2] != -1) {
			document.getElementById('ss' + (i + 2).toString()).value = ''
			isValidated = false
		}
	}

	// If all the answers have been validated, then set / update their document in firebase
	if (isValidated == true) {
		let response = await getScaledScoresDocument(dom_test.value, dom_section.value, spacing + spaceSize)

		const data = {
			'test': dom_test.value,
			'section': dom_section.value,
			'type': 'scaledScores',
			'scaledScores': scaledScores
		}

		// Doc doesn't exist yet - set
		if (response == false) {
			firebase.firestore().collection('ACT-Tests').doc().set(data)
		}
		// Doc exists - update
		else {
			firebase.firestore().collection('ACT-Tests').doc(response.id).set(data)
		}

		console.log("Finished Setting / Updating Answers")
	}
	else {
		console.log("Please correct your issues")
	}
	
}

/**
 * This will set the passage text without any parameters passed it. (It will grab them from the DOM)
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
function setPassageTextHelper(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'setPassageTextHelper()')
	}

	// Identify the section
	const section = document.getElementById('passageSection').value

	// Add the extra reading data (for A/B passages)
	const preText = (section == 'reading') ? document.getElementById('readingPassagePreText').value : ''
	let ABData = {}

	if (section == 'reading' && dom_AB.value == 1) {
		ABData['title'] = document.getElementById('readingPassageTitleB').value
		ABData['passageText'] = document.getElementById('readingPassageTextB').value
		ABData['reference'] = document.getElementById('readingPassageReferenceB').value
	}

	// Display the newly adjusted text
	setPassageText({
		'title': document.getElementById(section + 'PassageTitle').value,
		'passageText': document.getElementById(section + 'PassageText').value,
		'preText' : preText,
		'reference': (section == 'reading' || section == 'science') ? document.getElementById(section + 'PassageReference').value : '',
		'ABData' : ABData,
		'section' : section
	}
		, spacing + spaceSize)
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

	try {
		data = data.data()
	}
	catch {
	}

	// Remove the current elements
	removeChildren('pText', spacing + spaceSize)

	// Find the HTML elements
	let dom_passage = document.getElementById('pText')

	// Set the pre-passage text (only applicable to reading I think (1/8/22))
	if (data['preText'] != undefined && data['preText'] != '') {
		dom_passage.appendChild(createElement('p', [], [], [], data['preText']))
	}

	// Set the title
	if (data['title'] != undefined && data['title'] != '') {
		dom_passage.appendChild(createElement('p', [], [], [], data['title']))
	}

	// Set the passage text
	if (data['passageText'] != undefined && data['passageText'] != '') {
		dom_passage.appendChild(createElement('p', [], [], [], data['passageText']))
	}

	// Set the passage text
	if (data['ABData'] == undefined || data['ABData'] == {}) {
		if (data['reference'] != undefined && data['reference'] != '') {
			dom_passage.appendChild(createElement('p', [], [], [], data['reference']))
		}
	}

	// Set passage B
	if (data['ABData'] != undefined && data['ABData'] != {}) {
		if (data['ABData']?.['title'] != undefined && data['ABData']?.['title'] != '') {
			dom_passage.appendChild(createElement('p', [], [], [], data['ABData']['title']))
		}

		if (data['ABData']?.['passageText'] != undefined && data['ABData']?.['passageText'] != '') {
			dom_passage.appendChild(createElement('p', [], [], [], data['ABData']['passageText']))
		}

		if (data['reference'] != undefined && data['reference'] != '') {
			dom_passage.appendChild(createElement('p', [], [], [], data['reference']))
		}

		if (data['ABData']?.['reference'] != undefined && data['ABData']?.['reference'] != '') {
			dom_passage.appendChild(createElement('p', [], [], [], data['ABData']['reference']))
		}
	}

	// Highlight the text, if necessary
	if (data['section'] == 'english' || data['section'] == 'reading') {
		let elements = document.getElementById('pText').querySelectorAll('span')
		for (let i = 0; i < elements.length; i++) {
			let ele = elements[i]
			if (ele != undefined && parseInt(ele.innerHTML) >= 1 && parseInt(ele.innerHTML) <= 75) {
				ele.classList.add('box')
			}
			else if (ele != undefined && ele.innerHTML != '' && ele.innerHTML != undefined) {
				ele.classList.add('spotlight')
			}
		}
	}


	// Reset the MathJax
	resetMathJax(spacing + spaceSize)
}

/**
 * This will return the text that has been selected
 * 
 * @returns {string} the selected text
 */
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
    return text.trim();
}

/*********************************************************
 *                    Event Listeners                    *
 *********************************************************/
let selectedImage = undefined
document.getElementsByTagName('main')[0].addEventListener('contextmenu', function(event) {
	//if (debug == true) {
		//console.log('EVENT LISTENER (id = "main")')
	//}

	if (event.target.id.toLowerCase().includes('image')) {
		event.preventDefault()
		selectedImage = event.target
		displayRemovalMenu('toggle', event.clientX, event.clientY, spaceSize)
	}
})

document.getElementsByTagName('main')[0].addEventListener('click', function(event) {
	//if (debug == true) {
		//console.log('EVENT LISTENER (id = "main")')
	//}

	displayRemovalMenu('remove', spaceSize)
})

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

let dom_AB = document.getElementById('hasABPassages')
dom_AB.addEventListener('change', function() {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "hasABPassages")')
	}

	// Add / Remove Passage B
	if (dom_AB.value == 0) {
		document.getElementById('passageB').classList.add('hidden')
	}
	else if (dom_AB.value == 1) {
		document.getElementById('passageB').classList.remove('hidden')
	}
})


let dom_passageSections = document.querySelectorAll('div[id$="Passage"]')
for (let i = 0; i < dom_passageSections.length; i++) {
	dom_passageSections[i].addEventListener('input', function (event) {
		if (debug == true) {
			console.log('EVENT LISTENER (id = "' + event.target.id + '")')
		}

		if (event.target.id == 'englishLabelParagraphs') {
			let dom_labelParagraphs = document.getElementById('englishLabelParagraphs')

			// Grab the text
			let text = document.getElementById('englishPassageText').value

			// Remove the paragraph labels, if needed
			if (dom_labelParagraphs.value == 0) {
				for (let i = 0; i < 5; i++) {
					document.getElementById('englishPassageText').value = document.getElementById('englishPassageText').value.replaceAll('<b>' + (i + 1).toString() + '</b><br> ', '')
				}
			}

			// Add the paragraph labels, if needed
			else if (dom_labelParagraphs.value == 1 && text != undefined && text != '' && !text.includes('<b>1</b>')) {
				let splitText = text.split('<br><br>')

				for (let i = 0; i < splitText.length; i++) {
					splitText[i] = '<b>' + (i + 1).toString() + '</b><br> ' + splitText[i]
				}

				document.getElementById('englishPassageText').value = splitText.join('<br><br>')
			}

		}


		// Correct text
		if (!event.target.id.toLowerCase().includes('image')) {
			if (event.target.id.includes('PassageText')) {
				event.target.value = event.target.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;')
			}
			else {
				event.target.value = event.target.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;').replaceAll('  ', ' ')
			}
		}

		// Update the bottom display
		setPassageTextHelper(spaceSize);
	})
}

let dom_scaledScoresTest = document.getElementById('scaledScoresTest')
dom_scaledScoresTest.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "scaledScoresTest")', {
			'value' : dom_scaledScoresTest.value
		})
	}

	// Display the answer key for the newly selected test
	displayScaledScores(dom_scaledScoresTest.value, dom_scaledScoresSection.value, spaceSize)
})

let dom_scaledScoresSection = document.getElementById('scaledScoresSection')
dom_scaledScoresSection.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "scaledScoresSection")', {
			'value' : dom_scaledScoresSection.value
		})
	}

	// Display the answer key for the newly selected test
	displayScaledScores(dom_scaledScoresTest.value, dom_scaledScoresSection.value, spaceSize)
})

let dom_questionsTest = document.getElementById('questionsTest')
dom_questionsTest.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "questionsTest")', {
			'value' : dom_questionsTest.value
		})
	}

	// Reset the bottom display
	removeChildren('qNumbers')
	removeChildren('pText')
	removeChildren('qList')

	// Display the answer key for the newly selected test
	initializeQuestionsDisplay(dom_questionsTest.value, dom_questionsSection.value, dom_questionsPassageNumber.value, dom_questionList.value, spaceSize)
})

let dom_questionsSection = document.getElementById('questionsSection')
dom_questionsSection.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "questionsSection")', {
			'value' : dom_questionsSection.value
		})
	}

	// Display the answer key for the newly selected test
	initializeQuestionsDisplay(dom_questionsTest.value, dom_questionsSection.value, dom_questionsPassageNumber.value, dom_questionList.value, spaceSize)
})

let dom_questionsPassageNumber = document.getElementById('questionsPassageNumber')
dom_questionsPassageNumber.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "questionsPassageNumber")', {
			'value' : dom_questionsPassageNumber.value
		})
	}

	// Get the question Number
	const number = parseInt(document.getElementById('questionList').value)

	// Set the bottom half - passage
	setPassageText(await getPassageDocument(dom_questionsTest.value, dom_questionsSection.value, dom_questionsPassageNumber.value, spaceSize))

	// Get the possible answers' text
	let answers = []
	for (let i = 0; i < (dom_questionsSection.value != 'math' ? 4 : 5); i++) {
		answers.push(document.getElementById('answer' + (i + 1).toString()).value)
	}

	// Get the question test
	const questionText = document.getElementById('questionText').value

	// Initialize the Question Preview
	initializeQuestionPreview(questionText, answers, number, spaceSize)

	// Initialize the Question Numbers list
	initializeQuestionNumbersList(dom_questionsTest.value, dom_questionsSection.value, spaceSize)

	// Display the answer key for the newly selected test
	//initializeQuestionsDisplay(dom_questionsTest.value, dom_questionsSection.value, dom_questionsPassageNumber.value, dom_questionList.value, spaceSize)
})

let dom_questionList = document.getElementById('questionList')
dom_questionList.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "questionList")', {
			'value' : dom_questionList.value
		})
	}

	// Display the answer key for the newly selected test
	initializeQuestionsDisplay(dom_questionsTest.value, dom_questionsSection.value, dom_questionsPassageNumber.value, dom_questionList.value, spaceSize)
})

let dom_questions = document.getElementById('questions')
dom_questions.addEventListener('input', async function(event) {
	if (debug == true) {
		console.log('EVENT LISTENER (id = ' + event.target.id)
	}

	// Clean up the textarea
	if (event.target.tagName.toLowerCase() == 'textarea') {
		event.target.value = event.target.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;')
		//event.target.value = event.target.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;').replaceAll('  ', ' ')
	}

	// Remove text highlighting
	/*if (event.target.id == 'shouldHighlightText' && event.target.value == 0) {
		let elements = document.getElementById('pText').querySelectorAll('span')
		for (let i = 0; i < elements.length; i++) {
			elements[i].classList.remove('spotlight')
			elements[i].classList.remove('box')
		}
	}
	else if (event.target.id == 'shouldHighlightText' && event.target.value == 1) {
		// Highlight the text, if necessary
		if (dom_questionsSection.value == 'english' || dom_questionsSection.value == 'reading') {
			let ele = document.querySelector('span[id="' + dom_questionList.value.toString() + '"]')
			if (ele != undefined && parseInt(ele.innerHTML) >= 1 && parseInt(ele.innerHTML) <= 75) {
				ele.classList.add('box')
			}
			else if (ele != undefined && ele.innerHTML != '' && ele.innerHTML != undefined) {
				ele.classList.add('spotlight')
			}
		}
	}*/

	// Get the answers
	let answers = []
	let answerElements = document.querySelectorAll('textarea[id^="answer"]')
	for (let i = 0; i < answerElements.length; i++) {
		answers.push(answerElements[i].value)
	}

	// Remove the last answer, if needed
	if (dom_questionsSection.value != 'math') {
		answers.splice(answers.length - 1, 1)
	}

	// Initialize the Question Preview
	await initializeQuestionPreview(document.getElementById('questionText').value, answers, dom_questionList.value, spaceSize)

	// Reset Math Jax
	resetMathJax()

})





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