// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD8GSMZzjbubQ7AGcQKIV-enpDYpz_07mo",
    authDomain: "lyrn-web-app.firebaseapp.com",
    projectId: "lyrn-web-app",
    storageBucket: "lyrn-web-app.appspot.com",
    messagingSenderId: "80732012862",
    appId: "1:80732012862:web:22ffb978c80a1d2a0f2c6f",
    measurementId: "G-F2QZT3W2CX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

import "./_authorization";
import Dialog from "./_Dialog";

const debug = false
const spaceSize = '   '

/*********************************************************
 *                   Global Variables                    *
 *********************************************************/
const date = new Date()
let storage = firebase.storage();
let mathJaxTimer = undefined

window.selectDisplay = selectDisplay;
window.removeImage = removeImage;
window.saveTest = saveTest;
window.savePassage = savePassage;
window.clickInput = clickInput;
window.addImage = addImage;
window.saveAnswers = saveAnswers;
window.saveScaledScores = saveScaledScores;
window.previousQuestion = previousQuestion;
window.saveQuestion = saveQuestion;
window.nextQuestion = nextQuestion;
window.saveCurriculum = saveCurriculum;

/*********************************************************
 *                   General Functions                   *
 *********************************************************/
/**
 * Parse the datetime as an integer into a datetime object
 * @param {Integer} date Datetime represented as an integer
 * @returns {Object} a javascript object containing the datetime elements
 */
function convertFromDateInt(date) {

    // Make sure an integer was passed in
    if (typeof date !== "number") {
        return undefined;
    }

    // Create the date object from the date as an integer
    const current_date = new Date(date)

    // create the variables that will be called more than once
    const year = current_date.getFullYear();
    const month = current_date.getMonth() + 1;
    const dayOfMonth = current_date.getDate();
    const dayOfWeek = current_date.getDay() + 1;
    const hours = current_date.getHours();

    // Needed to get the month and day string values
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create and return the datetime object
    return {
        'year' : year,
        'monthNumber' : month,
        'monthString' : months[month - 1],
        'dayOfMonth' : dayOfMonth,
        'dayOfWeekNumber' : dayOfWeek,
        'dayOfWeekString' : days[dayOfWeek - 1],
        'hours' : hours > 12 ? hours - 12 : hours,
        'militaryHours' : hours,
        'minutes' : current_date.getMinutes(),
        'seconds' : current_date.getSeconds(),
        'milliseconds' : current_date.getMilliseconds(),
        'integerValue' : date,
        'shortDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString(),
        'time': (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? " pm" : " am"),
        'longDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? " pm" : " am"),
        'longDateMilitary' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString() + " " + hours.toString() + ":" + current_date.getMinutes().toString().padStart(2,'0'),
        'mm/dd/yyyy' : month.toString().padStart(2, '0') + "/" + dayOfMonth.toString().padStart(2, '0') + "/" + year.toString().padStart(4, '0'),
        'fullCalendar' : year.toString().padStart(4,'0') + "-" + month.toString().padStart(2, '0') + "-" + dayOfMonth.toString().padStart(2, '0') + "T" + hours.toString().padStart(2, '0') + ":" + current_date.getMinutes().toString().padStart(2, "0"),
        'completeCalendar' : year.toString().padStart(4,'0') + "-" + month.toString().padStart(2, '0') + "-" + dayOfMonth.toString().padStart(2, '0') + "T" + hours.toString().padStart(2, '0') + ":" + current_date.getMinutes().toString().padStart(2, "0") + ":" + current_date.getSeconds().toString().padStart(2, "0"),
        'shortestDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString().slice(-2),
        'startOfDayInt' : new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0).getTime(),
        'shortDateAndDay' : days[dayOfWeek - 1] + month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString(),
        'shortReadable': days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + ", " + year.toString(),
        'longReadable' : days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + ", " + year.toString() + " at " + (hours > 12 ? (hours - 12).toString() : hours.toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? ' p' : ' a') + 'm',
        'veryLongReadable' : days[dayOfWeek - 1] + ' ' + months[month - 1] + " " + dayOfMonth.toString() + ", " + year.toString() + " at " + (hours > 12 ? (hours - 12).toString() : (hours == 0 ? 12 : hours).toString()) + ":" + current_date.getMinutes().toString().padStart(2,'0') + ":" + current_date.getSeconds().toString().padStart(2,'0') + (hours >= 12 ? ' p' : ' a') + 'm',
        'dayAndDate' : days[dayOfWeek - 1] + ', ' + shortMonths[month - 1] + ' ' + dayOfMonth.toString(),
        'shortDateTime' : shortDays[dayOfWeek - 1] + ' ' + month + '/' + dayOfMonth + '/' + year.toString().slice(-2) + ', ' + (hours > 12 ? (hours - 12).toString() : (hours == 0 ? '12' : hours.toString())) + ":" + current_date.getMinutes().toString().padStart(2,'0') + (hours >= 12 ? " pm" : " am"),
    };
}

function setObjectValue(propertyPath, value, obj) {
  // this is a super simple parsing, you will want to make this more complex to handle correctly any path
  // it will split by the dots at first and then simply pass along the array (on next iterations)
  let properties = Array.isArray(propertyPath) ? propertyPath : propertyPath.split(".")

  // Not yet at the last property so keep digging
  if (properties.length > 1) {
    // The property doesn't exists OR is not an object (and so we overwritte it) so we create it
    if (!obj.hasOwnProperty(properties[0]) || typeof obj[properties[0]] !== "object") {
      obj[properties[0]] = {}
    } 
      // We iterate.
    return setObjectValue(properties.slice(1), value, obj[properties[0]])
      // This is the last property - the one where to set the value
  } 
  else {
    // We set the value to the last property
    if (typeof value == 'object') {
      obj[properties[0]] = JSON.parse(JSON.stringify(value))
    }
    else {
      obj[properties[0]] = value
    }
    return true // this is the end
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

/**
 * create html element
 * @param {String} elementType tag name for the element that will be created
 * @param {[String]} classes classes for the element
 * @param {[String]} attributes attributes for the element
 * @param {[String]} values values for each attribute for the element
 * @param {String} text innerhtml for the element
 * @returns {HTMLElement} html element of the given tag
 */
function createElement(elementType, classes = [], attributes = [], values = [], text = "") {
  // Initialize the element
  let element = document.createElement(elementType);

  // Set each of the specified attributes for the element
  if (attributes.length == values.length && attributes.length > 0) {
    for (let i = 0; i < attributes.length; i++) {
      element.setAttribute(attributes[i], values[i]);
    }
  }

  // Add the classes to the element
  for (let i = 0; i < classes.length; i++) {
    if (classes[i]) {
      element.classList.add(classes[i]);
    }
  }

  // Set the inner html text
  if (text != "") {
    element.innerHTML = text;
  }

  // Return the element
  return element;
}

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
	mathJaxTimer = setTimeout(async () => {
		try {
			await MathJax.typesetPromise();
			document.querySelectorAll('.MathJax').forEach((math) => {
				math.removeAttribute('tabindex');
			})
		}
		catch (err) {
			console.log(err)
		}
	}, 250);
		
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
	const test = document.getElementById((type == 'passage' ? 'passage' : 'questions') + 'Test').querySelector('option:checked').textContent

	// Identify the section
	const section = document.getElementById((type == 'passage' ? 'passage' : 'questions') + 'Section').querySelector('option:checked').textContent.toLowerCase()

	// Identify the passage
	const passageDOM = document.getElementById((type == 'passage' ? 'passageNumber' : 'questionsPassageNumber'))
	const newPassageDOM = document.getElementById((type == 'passage' ? 'newPassageNumber' : 'questionsPassageNumber'))

	let passage = null;
	if (passageDOM.querySelector('option:checked').value == 'new') {
		passage = parseInt(newPassageDOM.value);
	}
	else {
		passage = parseInt(passageDOM.querySelector('option:checked').textContent)
	}

	// Identify the question, if applicable
	let question = undefined
	if (type != 'passage') {
		question = parseInt(document.getElementById('questionList').querySelector('option:checked').textContent)
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
	console.log(data)
	// verify there is a location to place the image then click the input to find the file
	if (data == false) {
		console.log('Please type "<image>" where you want the image to be placed in the text first')
		return;
	}
	else {
		document.getElementById((data['type'] == 'passage' ? 'passage' : 'questions') + 'Image').click()
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
	console.log(data)
	
	// Get a list of all the image ids
	let imageTextarea = data['element'].value.split('<img')
	let imageIds = []

	for (let i = 1; i < imageTextarea.length; i++) {
		let idSplit = imageTextarea[i].split('id')[1].split('image')[1]
		let number = '';
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
	let image, ext, filename;
	if (data['type'] == 'passage') {
		image = document.getElementById('passageImage').files[0];
		ext = '.' + image.name.substring(image.name.lastIndexOf('.') + 1);
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-I' + (imageNumber).toString() + ext;
	}
	else if (data['type'] == 'question') {
		image = document.getElementById('questionsImage').files[0];
		ext = '.' + image.name.substring(image.name.lastIndexOf('.') + 1);
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-Q' + data['question'] + '-I' + (imageNumber).toString() + ext;
	}
	else if (data['type'] == 'answer') {
		image = document.getElementById('questionsImage').files[0];
		ext = '.' + image.name.substring(image.name.lastIndexOf('.') + 1);
		filename = data['test'] + '-' + data['section'] + '-P' + data['passage'].toString() + '-Q' + data['question'].toString() + '-A' + data['answer'].toString() + '-I' + (imageNumber).toString() + ext;
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
			data['element'].value = data['element'].value.replaceAll('<image>', '<img id = "image' + imageNumber + '" src="' + downloadURL + '">')

			// Reset the display
			if (data['type'] == 'passage') {
				document.getElementById('passageImage').value = null
				savePassage(spacing + spaceSize)
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
	let finalString = '<img'
	const workingText = element.value.split('<img')

	// Find the image and read the text in between '<img' and '>'
	for (let i = 1; i < workingText.length; i++) {

		if (parseInt(workingText[i].split('id')[1].split('"')[1].replace('image', '')) == number) {

			let j = 0;
			while (workingText[i][j] != '>') {
				finalString += workingText[i][j]
				j += 1
			}
			finalString += '>'
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
	// document.getElementById('modifier').parentNode.style = 'display:none'

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
		// document.getElementById('modifier').parentNode.style = ''
		initializeQuestionsDisplay(undefined, undefined, undefined, undefined, spacing + spaceSize)
	}
	else if (id == 'curriculumDisplay') {
		initializeCurriculumDisplay();
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
 * @param {string} testCode Test Code (ie. B05)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Object | boolean} Object (firebase doc object [doc not doc.data()]) or false if it doesn't exist
 */
async function getTestDocumentByCode(testCode, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getTestDocument()', {'test' : testCode})
	}

	// remove case sensitivity
	testCode = testCode.toUpperCase()

	// Set the firebase reference
	const ref = firebase.firestore().collection('ACT-Test-Data')
	.where('code', '==', testCode)

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
 * Query for test doc by id
 * @param {String} testID firestore document id
 * @returns {Promise(FirebaseFirestore.Document)} single firestore document by id
 */
function getTestDoc(testID) {
	return firebase.firestore().collection('ACT-Test-Data').doc(testID).get();
}

/**
 * Query for section doc by id
 * @param {String} sectionID firestore document id
 * @returns {Promise(FirebaseFirestore.Document)} single firestore document by id
 */
function getSectionDoc(sectionID) {
	return firebase.firestore().collection('ACT-Section-Data').doc(sectionID).get();
}

/**
 * Query for passage doc by id
 * @param {String} passageID firestore document id
 * @returns {Promise(FirebaseFirestore.Document)} single firestore document by id
 */
function getPassageDoc(passageID) {
	return firebase.firestore().collection('ACT-Passage-Data').doc(passageID).get();
}

/**
 * Query for question doc by id
 * @param {String} questionID firestore document id
 * @returns {Promise(FirebaseFirestore.Document)} single firestore document by id
 */
function getQuestionDoc(questionID) {
	return firebase.firestore().collection('ACT-Question-Data').doc(questionID).get();
}

/**
 * This will grab a list of all tests that have been added to firebase
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Promise(FirebaseFirestore.Document[])} List of all test docs in firebase
 */
async function getAllTestDocs(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'getTests()')
	}
	// Set the firebase reference
	const ref = firebase.firestore().collection('ACT-Test-Data')

	// Grab the data from firebase
	let querySnapshot = await ref.get()

	// Return the list of test docs
	return querySnapshot.docs;
}

async function getSectionDocsByTest(testID) {
	const sectionQuery = await firebase.firestore().collection('ACT-Section-Data')
	.where('test', '==', testID)
	.get();

	return sectionQuery.docs;
}

async function getPassageDocsByTestAndSection(testID, sectionID) {
	const passageQuery = await firebase.firestore().collection('ACT-Passage-Data')
	.where('test', '==', testID)
	.where('section', '==', sectionID)
	.get();

	return passageQuery.docs;
}

async function getQuestionDocsByTestAndSection(testID, sectionID) {
	const questionQuery = await firebase.firestore().collection('ACT-Question-Data')
	.where('test', '==', testID)
	.where('section', '==', sectionID)
	.get();

	return questionQuery.docs;
}

/**
 * This will save / update the test information
 * It will also initialize the section docs
 * 
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function saveTest(spacing = '') {
	if (debug == true) {
		console.log(spacing + 'saveTest()')
	}

	// set / grab needed values
	let testCode = document.getElementById('testCode')
	let isQuestionBank = document.getElementById('isQuestionBank')
	const numInts = testCode.value.replace(/\D/g, '').length
	let year = document.getElementById('testYear')
	let month = document.getElementById('testMonth')

	// Set the data to define
	const data = {
		code: testCode.value.toUpperCase(),
		isQuestionBank: isQuestionBank.checked,
		releaseDate: `${year.value}-${month.value}`
	}

	// Validate, set data, and re-initialize the test list
	if (testCode.value.length == 3 && parseInt(year.value) <= date.getFullYear() && parseInt(year.value) >= 1959 && (numInts == 1 || numInts == 2)) {
		// Check to see if the test exists
		const testDoc = await getTestDoc(document.getElementById('testList').value);

		// Set the data
		if (!testDoc.exists) {
			const newTestRef = firebase.firestore().collection('ACT-Test-Data').doc()
			await newTestRef.set(data)
			// since the test is new we need to save the section docs as well
			await Promise.all(['english', 'math', 'reading', 'science'].map(section => saveNewSection(section, newTestRef.id)))
		}
		else {
			// the test exists already so overwrite it
			await firebase.firestore().collection('ACT-Test-Data').doc(testDoc.id).set(data)

			// we also need to set all questions of this test to the new usQuestionBank
			const questionQuery = await firebase.firestore().collection('ACT-Question-Data')
			.where('test', '==', testDoc.id)
			.get()

			await Promise.all(questionQuery.docs.map(doc => {
				return doc.ref.update({ isQuestionBank: isQuestionBank.checked })
			}))
		}

		Dialog.toastMessage('Test successfully saved!');

		// Re-initialize the display
		initializeTestDisplay(spacing + spaceSize)
	}
	else {
		Dialog.toastError('The test code must be 3 characters long.');
		console.log("The test must have exactly 3 characters: B05, 76C, A10, etc. (1 - 2 letters and 1 - 2 numbers)")
	}
}

/**
 * Set a new section doc with the given info
 * 
 * @param {String} sectionCode
 * @param {String} testID 
 * @param {Number[]} scaledScores 
 */
function saveNewSection(sectionCode, testID, scaledScores = []) {
	firebase.firestore().collection('ACT-Section-Data').doc().set({
		code: sectionCode,
		test: testID,
		scaledScores
	})
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
	document.getElementById('testMonth').value = (date.getMonth() + 1).toString().padStart(2, '0');

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

	// Reset the answers
	selectAnswer(undefined, spacing + spaceSize)

	// Set the answers
	const sectionCode = document.getElementById('questionsSection').querySelector('option:checked').textContent.toLowerCase();
	for (let i = 0; i < (sectionCode != 'math' ? 4 : 5); i++) {
		document.getElementById('answer' + (i + 1).toString()).value = ''
	}

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
	const ref = firebase.firestore().collection('ACT-Curriculum-Data')
	.where('sectionCode', '==', section)

	// Get the HTML element
	let dom_topic = document.getElementById('topic')

	// Delete the current list of topics
	removeChildren('topic', spacing + spaceSize)

	// Get the topics from firebase
	let topicQuery = await ref.get()

	// Sort the topics alphabetically
	let topicDocs = topicQuery.docs.sort((a,b) => sortAlphabetically(a.data().code, b.data().code))

	// Add the topics to the dom
	dom_topic.appendChild(createElement('option', [], ['value'], [''], 'None Selected'))
	for (let i = 0; i < topicDocs.length; i++) {
		dom_topic.appendChild(createElement('option', [], ['value'], [topicDocs[i].id], topicDocs[i].data().code))
	}

	// // initialize the modifier list
	// await initializeModifierList(section);
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
	let dom_isGroupedByPassage = document.getElementById('isGroupedByPassage')
	let dom_questionList = document.getElementById('questionList')
	let dom_questionText = document.getElementById('questionText')
	let dom_questionExplanation = document.getElementById('questionExplanation')
	let dom_topic = document.getElementById('topic')

	// Display the 5th question if it's the math section
	if (dom_section.querySelector('option:checked')?.textContent?.toLowerCase() == 'math') {
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

	removeChildren(dom_test.id)
	removeChildren(dom_section.id)
	removeChildren(dom_passage.id)
	removeChildren(dom_questionList.id)
	removeChildren(dom_topic.id)
	removeChildren('pText')
	dom_questionText.value = null;
	dom_questionExplanation.value = null;
	dom_isGroupedByPassage.checked = false;
	document.querySelectorAll('textarea[id^="answer"]').forEach(answer => answer.value = null)
	document.getElementById('questions').dispatchEvent(new Event('input', {bubbles:true}))
	document.getElementById('questionsPart2').querySelectorAll('label').forEach(label => label.classList.remove('correctAnswer'))

	// Get a list of all available tests from firebase
	await initializeTests('questionsTest', spacing + spaceSize)
	dom_test.focus();
	if (test) {
		dom_test.value = test

		// if we have a test then we can initialize the sections
		await initializeSections('questionsSection', test);
		dom_section.focus()
		if (section) {
			dom_section.value = section

			await initializePassages('questionsPassageNumber', test, section);
			await initializeTopicList(dom_section.querySelector('option:checked').textContent.toLowerCase(), spacing + spaceSize)
			initializeQuestionNumbersList(test, section, spacing + spaceSize)

			await initializeQuestions('questionList', test, section);
			dom_questionList.focus()
			if (question) {
				dom_questionList.value = question
				dom_questionText.focus()

				const questionDoc = await getQuestionDoc(question);
				if (questionDoc.exists) {
					resetQuestion(questionDoc.data().code)

					dom_questionText.value = questionDoc.data().content ?? '';
					dom_questionExplanation.value = questionDoc.data().explanation ?? '';
					dom_isGroupedByPassage.checked = questionDoc.data().isGroupedByPassage ?? false;
					dom_topic.value = questionDoc.data().topic

					// Set the answers
					if (questionDoc.data().choices) {
						for (let i = 0; i < questionDoc.data().choices.length; i++) {
							document.getElementById('answer' + (i + 1).toString()).value = questionDoc.data().choices[i];
						}
					}
					document.getElementById('questions').dispatchEvent(new Event('input', {bubbles:true}))
					// Set the correct answer
					selectAnswer(document.getElementById('answer' + (questionDoc.data().answer + 1).toString() + 'Label'), spacing + spaceSize)

					if (questionDoc.data().passage) {
						dom_passage.value = questionDoc.data().passage
		
						// Grab the passage from firebase
						const passageDoc = await getPassageDoc(questionDoc.data().passage);
						if (passageDoc.exists) {
							setPassageText(passageDoc.data())

							// Remove text highlighting
							let elements = document.getElementById('pText').querySelectorAll('span')
							for (let i = 0; i < elements.length; i++) {
								elements[i].classList.remove('spotlight')
								elements[i].classList.remove('box')
							}

							// Highlight the text, if necessary
							if (dom_section.querySelector('option:checked').textContent.toLowerCase() == 'english' || dom_section.querySelector('option:checked').textContent.toLowerCase() == 'reading') {
								let elements = document.querySelectorAll('span[data-question="' + questionDoc.data().code.toString() + '"]')
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
					}
					else if (passage) {
						dom_passage.value = passage

						// Grab the passage from firebase
						const passageDoc = await getPassageDoc(passage);
						if (passageDoc.exists) {
							setPassageText(passageDoc.data())

							// Remove text highlighting
							let elements = document.getElementById('pText').querySelectorAll('span')
							for (let i = 0; i < elements.length; i++) {
								elements[i].classList.remove('spotlight')
								elements[i].classList.remove('box')
							}

							// Highlight the text, if necessary
							if (dom_section.querySelector('option:checked').textContent.toLowerCase() == 'english' || dom_section.querySelector('option:checked').textContent.toLowerCase() == 'reading') {
								let elements = document.querySelectorAll('span[data-question="' + questionDoc.data().code.toString() + '"]')
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
					}
				}
			}
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
async function initializeQuestionPreview(question, explanation, answers, number, spacing = '') {
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

	if (!number) return;

	// Get the HTML elements
	const dom_qList = document.getElementById('qList')
	const dom_eList = document.getElementById('eText')

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

	// Display the explanation
	dom_eList.innerHTML = explanation;
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

	let list = []
	let data = {}
	let questions = {}
	getQuestionDocsByTestAndSection(test, section)
	.then((questionDocs) => {
		if (questionDocs.length > 0) {
			questionDocs.forEach((doc) => {
				const problem = doc.data().code
				list.push(problem)
				questions[problem] = doc.id;
				const sectionCode = document.getElementById('questionsSection').querySelector('option:checked').textContent.toLowerCase();
				if (doc.data().choices.length == (sectionCode != 'math' ? 4 : 5) && doc.data().choices[0] != "") {
					if (doc.data().topic) {
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
				let element = createElement('div', ['problem', data[(i + 1)]], [], [], list[i].toString())
				element.addEventListener('click', () => {
					initializeQuestionsDisplay(test, section, null, questions[list[i]])
				})
				dom_finishedQuestions.appendChild(element)
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
 * Checks if the provided tag name wraps the given string
 * @param {string} tagname name of the tag to search for
 * @param {string} str string to test
 * @returns {boolean} whether the string is wrapped in the given tag
 */
function isWrappedInTagname(tagname, str) {
    const regex = new RegExp(`^<${tagname}>.*<\/${tagname}>$`, 'g');
  return regex.test(str)
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

	// Find the HTML elements
	const test = document.getElementById('questionsTest').value;
	const section = document.getElementById('questionsSection').value;
	const sectionCode = document.getElementById('questionsSection').querySelector('option:checked')?.textContent?.toLowerCase();
	const passage = document.getElementById('questionsPassageNumber').value || null;
	const question = document.getElementById('questionList').value;
	const topic = document.getElementById('topic').value || null;
	const isGroupedByPassage = document.getElementById('isGroupedByPassage').checked;

	if (!test || !section || !question) {
		Dialog.toastError('You are missing some data')
		return;
	}

	// Get the possible answers' text
	let choices = []
	for (let i = 0; i < (sectionCode != 'math' ? 4 : 5); i++) {
		choices.push(document.getElementById('answer' + (i + 1).toString()).value)
	}

	// Grab the topics

	// Remove extra spaces
	let dom_text = document.getElementById('questionText')
	while (dom_text.value.includes('  ')) {
		dom_text.value = dom_text.value.replaceAll('  ', ' ').replaceAll(' teh ', ' the ')
	}

	let dom_explanation = document.getElementById('questionExplanation')
	while (dom_explanation.value.includes('  ')) {
		dom_explanation.value = dom_explanation.value.replaceAll('  ', ' ').replaceAll(' teh ', ' the ')
	}

	// Clean up choices
	for (let i = 0; i < choices.length; i++) {
		if(isWrappedInTagname('p', choices[i]) == false && isWrappedInTagname('img', choices[i]) == false && isWrappedInTagname('p', choices[i]) == false) {
			choices[i] = '<p>' + choices[i] + '</p>'
		}
		while (choices[i].includes('  ')) {
			choices[i] = choices[i].replaceAll('  ', ' ')
		}
	}

	// Create the data that will be sent to Firebase
	if (choices.length == (sectionCode != 'math' ? 4 : 5)) {
		const testDoc = await firebase.firestore().collection('ACT-Test-Data').doc(test).get()
		const isQuestionBank = testDoc.data().isQuestionBank
		const data = {
			choices,
			content: dom_text.value,
			explanation: dom_explanation.value,
			passage,
			topic,
			isQuestionBank
		}

		// Set the data
		await firebase.firestore().collection('ACT-Question-Data').doc(question).update(data)

		if (passage) {
			// update all questions with this passage to have the same isGroupedByPassage boolen value
			const questionByPassageDocs = await firebase.firestore().collection('ACT-Question-Data')
			.where('passage', '==', passage)
			.get();

			await Promise.all(questionByPassageDocs.docs.map(doc => {
				doc.ref.update({ isGroupedByPassage })
			}))
		}

		if (goToNext) {
			nextQuestion();
		}

		// Finished!!
		Dialog.toastMessage('Question successfully saved!', {'justify' : 'start', 'slideOutDir' : 'left', 'timeout' : 2000})
	}
}

// all input and textarea should prevent if special keys
document.querySelectorAll('input, textarea').forEach(editable => {
	editable.addEventListener('keydown', (e) => {
		if (e.ctrlKey && e.key === 'Enter') {
			e.preventDefault();
		}
	})
})

// save the 
document.querySelector('main').addEventListener('keydown', (e) => {
	if (e.ctrlKey && e.key === 'Enter' && !e.repeat) {
		// whatever display is not hidden
		const currentDisplay = document.querySelector('main').querySelector('#firstHalf > div.columns:not(.hidden)');
		if (!currentDisplay) return;

		// save that display 
		const currentDisplayName = currentDisplay.id.split('Display')[0];
		switch(currentDisplayName) {
			case 'test':
				saveTest();
				break;
			case 'answers':
				saveAnswers();
				break;
			case 'scaledScores':
				saveScaledScores();
				break;
			case 'passage':
				savePassage();
				break;
			case 'questions':
				saveQuestion();
				break;
			case 'curriculum':
				saveCurriculum();
				break;
			default:
				Dialog.toastError('No save function for this display.')
		}
	} 
})

function nextQuestion() {
	const question = document.getElementById('questionList').querySelector('option:checked+option')?.value;
	if (question) {
		const test = document.getElementById('questionsTest').value;
		const section = document.getElementById('questionsSection').value;
		initializeQuestionsDisplay(test, section, null, question)
	}
}

function previousQuestion() {
	const parent = document.getElementById('questionList');
	const child = parent.querySelector('option:checked');
	const index = Array.from(parent.children).indexOf(child);
	const question = parent.children.item(index - 1).value;
	if (question) {
		const test = document.getElementById('questionsTest').value;
		const section = document.getElementById('questionsSection').value;
		initializeQuestionsDisplay(test, section, null, question)
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

	// Find the HTML elements
	let dom_scaledScores = document.getElementById('scaledScores')

	// Remove the current answer key
	removeChildren('scaledScores', spacing + spaceSize)

	if (!test || !section) return

	// Get the answer key from firebase
	let sectionDoc = await getSectionDoc(section);

	// Add the scaled scores in columns of 12 each
	for (let i = 0; i < 3; i++) {
		dom_labels = createElement('div', ['rows'], ['style'], ['margin-left: 50px; align-items: center;'], '')
		dom_labels.appendChild(createElement('label', [], [], [], 'Scaled Score'))
		dom_scores = createElement('div', ['rows'], ['style'], ['margin-left: 10px; align-items: center;'], '')
		dom_scores.appendChild(createElement('label', [], [], [], 'Min Score'))

		// Create the labels and inputs (12)
		for (let j = 0; j < 12; j++) {
			dom_labels.appendChild(createElement('label', [], ['for'], ['ss' + (36 - (i * 12) - j).toString()], (36 - (i * 12) - j).toString()))
			if (sectionDoc.exists && sectionDoc.data().scaledScores[(36 - (i * 12) - j)] != undefined) {
				dom_scores.appendChild(createElement('input', [], ['id', 'value'], ['ss' + (36 - (i * 12) - j).toString(), (sectionDoc.data()['scaledScores'][(36 - (i * 12) - j)] != -1) ? sectionDoc.data()['scaledScores'][(36 - (i * 12) - j)].toString() : '-'], ''))
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
async function getPassageDocumentByCode(test, section, passage, spacing = '') {
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
	
	// Prepare the data
	let test = document.getElementById('passageTest').value;
	let section = document.getElementById('passageSection').value;
	let passage = document.getElementById('passageNumber').value;
	let passageNumber = Number(document.getElementById('newPassageNumber').value);
	let text = document.getElementById('passageText').value;

	if (!test) {
		Dialog.toastError('You are missing the test')
		return;
	}
	if (!section) {
		Dialog.toastError('You are missing the section')
		return;
	}
	if (!passage) {
		Dialog.toastError('You are missing the passage')
		return;
	}
	if (passage === 'new' && (!passageNumber || passageNumber < 1)) {
		Dialog.toastError('Your new passage number is invalid')
		return
	}

	// Remove extra spaces
	while (text.includes('  ')) {
		text = text.replaceAll('  ', ' ')
	}

	// Validate then set the data
	if (text.length > 0) {
		// save different things based on if it is a new passage or not
		if (passage === 'new') {
			// save a new passage
			const newRef = firebase.firestore().collection('ACT-Passage-Data').doc()
			await newRef.set({
				test,
				section,
				code: passageNumber,
				content: text
			})
			passage = newRef.id;
		}
		else {
			// update the existing passage
			await firebase.firestore().collection('ACT-Passage-Data').doc(passage).update({
				content: text
			})
		}
	}
	else {
		Dialog.toastError('You did not input any text')
		return;
	}

	
	Dialog.toastMessage('Passage successfully saved!')
	initializePassageDisplay(test, section, passage, spacing);
}

async function saveCurriculum() {
	// get the current topic
	const topicID = document.getElementById('curriculumTopic').value;

	if (!topicID) {
		Dialog.toastError('You are missing the curriclum topic')
		return;
	}

	await firebase.firestore()
	.collection('ACT-Curriculum-Data')
	.doc(topicID)
	.update({
		content: document.getElementById('curriculumText').value
	})

	Dialog.toastMessage('Curriculum successfully saved!')
	return;
}

/**
 * This will setup the display to edit passages
 * 
 * @param {?string} test ACT test ID (ie. B05)
 * @param {?string} section ACT section (possible values are english, math, reading, and science)
 * @param {?number} passage This is the passage number
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
async function initializePassageDisplay(test = undefined, section = undefined, passage = undefined, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializePassageDisplay()', {
			'test' : test,
			'section' : section,
			'passage' : passage
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
	let dom_passage = document.getElementById('passageNumber')
	let dom_PassageNumber = document.getElementById('newPassageNumber')
	let dom_passageText = document.getElementById('passageText')

	// if (!test) {
	// 	removeChildren(dom_test.id)
	// }
	// if (!section) {
	// 	removeChildren(dom_section.id)
	// }
	// if (!passage) {
	// 	removeChildren(dom_passage.id)
	// }

	removeChildren(dom_test.id)
	removeChildren(dom_section.id)
	removeChildren(dom_passage.id)
	dom_passageText.value = null;
	dom_passageText.dispatchEvent(new Event('input', {bubbles:true}))
	dom_PassageNumber.value = null;

	// Get a list of all available tests from firebase
	await initializeTests('passageTest', spacing + spaceSize)
	if (test) {
		dom_test.value = test

		// if we have a test then we can initialize the sections
		await initializeSections('passageSection', test);
		if (section) {
			dom_section.value = section

			await initializePassages('passageNumber', test, section, true);
			if (passage) {
				dom_passage.value = passage

				// Grab the passage from firebase
				const passageDoc = await getPassageDoc(passage);
				if (passageDoc.exists) {
					const passageData = passageDoc.data()

					dom_passageText.value = passageData.content;
					dom_passageText.dispatchEvent(new Event('input', {bubbles:true}))

					// // Display the info below
					// setPassageText(passageData, spacing + spaceSize)
				}
			}
		}
	}

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
	else {
		dom_test.appendChild(createElement('option', [], ['value', 'disabled', 'selected'], ['', true, true], "select a test"))
	}

	// Get the list of tests from firebase and update the HTML with the list (only add new values)
	let testDocs = await getAllTestDocs(spacing + spaceSize)

	// Sort the tests
	testDocs.sort((a,b) => sortAlphabetically(a.data().code, b.data().code))

	// add in the test to the dom
	testDocs.forEach(testDoc => {
		dom_test.appendChild(createElement('option', [], ['value'], [testDoc.id], testDoc.data().code))
	})
}

/**
 * This will remove all sections from the sectionList with the given id, get a list of all section froma  test from firebase,
 * then repopulate the list with the current list of tests
 * 
 * @param {string} id The id of the HTML element to populate
 * @param {string} testID The id of the test the section is from
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
 async function initializeSections(id, testID, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeSections()', {'id' : id})
	}

	// Delete the current list of tests
	removeChildren(id, spacing + spaceSize)

	// Find the HTML elements
	let dom_section = document.getElementById(id)

	// Add default
	dom_section.appendChild(createElement('option', [], ['value', 'disabled', 'selected'], ['', true, true], "select a section"))

	// get all of the sections of the given test 
	let sectionDocs = await getSectionDocsByTest(testID);

	// sort the section
	sectionDocs.sort((a,b) => sortSectionCanonically(a.data().code, b.data().code));

	// add in the test to the dom
	sectionDocs.forEach(sectionDoc => {
		dom_section.appendChild(createElement('option', [], ['value'], [sectionDoc.id], capitalizeFirstChar(sectionDoc.data().code)))
	})
}

/**
 * This will remove all passages from the passageList with the given id, get a list of all passages from firebase,
 * then repopulate the list with the current list of tests
 * 
 * @param {string} id The id of the HTML element to populate
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
 async function initializePassages(id, testID, sectionID, newPassage = false, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializePassage()', {'id' : id})
	}

	// Delete the current list of tests
	removeChildren(id, spacing + spaceSize)

	// Find the HTML elements
	let dom_passage = document.getElementById(id)

	// Add default
	dom_passage.appendChild(createElement('option', [], ['value', 'disabled', 'selected'], ['', true, true], "select a passage"))

	// get all of the sections of the given test 
	let passageDocs = await getPassageDocsByTestAndSection(testID, sectionID);

	// sort the section
	passageDocs.sort((a,b) => a.data().code - b.data().code);

	// add in the test to the dom
	passageDocs.forEach(passageDoc => {
		dom_passage.appendChild(createElement('option', [], ['value'], [passageDoc.id], passageDoc.data().code))
	})

	if (newPassage) {
		// add new passage
		dom_passage.appendChild(createElement('option', [], ['value'], ['new'], "Create new passage"))
	}
}

/**
 * This will remove all questions from the questionList with the given id, get a list of all questions from firebase,
 * then repopulate the list with the current list of tests
 * 
 * @param {string} id The id of the HTML element to populate
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 */
 async function initializeQuestions(id, testID, sectionID, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'initializeQuestion()', {'id' : id})
	}

	// Delete the current list of tests
	removeChildren(id, spacing + spaceSize)

	// Find the HTML elements
	let dom_question = document.getElementById(id)

	// Add default
	dom_question.appendChild(createElement('option', [], ['value', 'disabled', 'selected'], ['', true, true], "select a question"))

	// get all of the sections of the given test 
	let questionDocs = await getQuestionDocsByTestAndSection(testID, sectionID);

	// sort the section
	questionDocs.sort((a,b) => a.data().code - b.data().code);

	// add in the test to the dom
	questionDocs.forEach(questionDoc => {
		dom_question.appendChild(createElement('option', [], ['value'], [questionDoc.id], questionDoc.data().code))
	})
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

function sortSectionCanonically(a,b) {
	const canon = {
		english: 0,
		math: 1,
		reading: 2,
		science: 3
	}

	return canon[a] - canon[b];
}

function capitalizeFirstChar(str) {
	return str[0].toUpperCase() + str.slice(1);
}

async function initializeCurriculumDisplay() {
	// clear the currciculum text
	document.getElementById('curriculumText').value = null;

	// set the section to english
	document.getElementById('curriculumSection').value = 'english';

	// add the english topics to the topics select along with a default
	const englishTopicDocs = await getTopicsBySection('english');
	const englishTopicList = englishTopicDocs
	.map(doc => {
		return {
			topic: doc.data().code,
			id: doc.id
		}
	})
	.sort((a,b) => sortAlphabetically(a.topic, b.topic));

	const topicArray = englishTopicList.map(object => object.topic);
	const idArray = englishTopicList.map(object => object.id);

	removeChildren('curriculumTopic');
	addSelectOptions(document.getElementById('curriculumTopic'), ['', ...idArray], ['select a topic', ...topicArray]);
}

/**
 * Get the array of firebase docs for all topics of a specific section
 * 
 * @param {String} section section to get topics for
 * @returns {Promise<FirebaseDoc[]>} 
 */
async function getTopicsBySection(section) {
	const query = await firebase.firestore()
	.collection('ACT-Curriculum-Data')
	.where('sectionCode', '==', section)
	.get();

	return query.docs
}

/**
 * Get the firebase doc for the given topic
 * 
 * @param {String} topicID topic to get
 * @returns {Promise<FirebaseDoc>}
 */
 async function getTopicByID(topicID) {
	const query = await firebase.firestore()
	.collection('ACT-Curriculum-Data')
	.doc(topicID)
	.get();

	return query;
}

/**
 * This will grab the answer key from firebase
 * 
 * @param {string} test Test ID (ie. B05)
 * @param {string} section Section (possible values = english, math, reading, or science)
 * @param {?string} spacing The spacing for debug purposes (ie. '  ')
 * @returns {Object} Object of answers for the given test ( { 1 : 'A', 2 : 'F', ...} )
 */
async function getAnswersByCode(test, section, spacing = '') {
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

	// Find the HTML elements
	let dom_answers = document.getElementById('answers')

	// Remove the current answer key
	removeChildren('answers', spacing + spaceSize)

	if (!test || !section) return;

	// Get the answer key from firebase
	// let answers = await getAnswersByCode(test, section, spacing + spaceSize)
	let questionQuery = await firebase.firestore()
	.collection('ACT-Question-Data')
	.where('test', '==', test)
	.where('section', '==', section)
	.get()

	// [questionCodeParity][questionAnswerIndex]
	const answer_key = {
		0: {
			0: 'F',
			1: 'G',
			2: 'H',
			3: 'J',
			4: 'K'
		},
		1: {
			0: 'A',
			1: 'B',
			2: 'C',
			3: 'D',
			4: 'E'
		}
	}

	let answers = {};
	let questionIDs = {};
	questionQuery.forEach(doc => {
		answers[doc.data().code] = answer_key[doc.data().code % 2][doc.data().answer]
		questionIDs[doc.data().code] = doc.id;
	})

	// Set the number of questions
	let count = 40;
	if (document.getElementById('answersSection').querySelector('option:checked').textContent.toLowerCase() == 'english') {
		count = 75;
	}
	else if (document.getElementById('answersSection').querySelector('option:checked').textContent.toLowerCase() == 'math') {
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
					inputDiv.appendChild(createElement('input', [], ['id', 'data-question', 'value'], ['qq' + (i * 10 + j + 1).toString(), questionIDs[i * 10 + j + 1] ?? '', answers[i * 10 + j + 1]], ''));
				}
				else {
					inputDiv.appendChild(createElement('input', [], ['id', 'data-question'], ['qq' + (i * 10 + j + 1).toString(), questionIDs[i * 10 + j + 1] ?? ''], ''));
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

	const answer_key = {
		'A': 0,
		'B': 1,
		'C': 2,
		'D': 3,
		'E': 4,

		'F': 0,
		'G': 1,
		'H': 2,
		'J': 3,
		'K': 4
	}

	// Validate that all answers inputted are valid
	// If any are not valid, reset its value
	let isValidated = true
	for (let i = 0; i < answers.length; i++) {
		if (!answers[i]) {
			isValidated = false
		}

		if (dom_section.querySelector('option:checked').textContent.toLowerCase() != 'math') {
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
		let promises = [];
		for (let i = 0; i < answers.length; i++) {
			// all answers have values because they passed validation
			// save the answers
			if (answers[i].dataset.question) {
				// the answer was initialized with a question so update
				promises.push(firebase.firestore().collection('ACT-Question-Data').doc(answers[i].dataset.question).update({
					answer: answer_key[answers[i].value.toUpperCase()]
				}))
			}
			else {
				// no question associated with this answer so set
				promises.push((async () => {
					const newRef = firebase.firestore().collection('ACT-Question-Data').doc();
					answers[i].setAttribute('data-question', newRef.id);
					const testDoc = await firebase.firestore().collection('ACT-Test-Data').doc(dom_test.value).get()
					const isQuestionBank = testDoc.data().isQuestionBank
					return newRef.set({
						answer: answer_key[answers[i].value.toUpperCase()],
						choices: [],
						code: i+1,
						content: null,
						passage: null,
						section: dom_section.value,
						test: dom_test.value,
						topic: null,
						isQuestionBank
					})
				})())
			}
		}
		Promise.all(promises)
		.then(() => {
			Dialog.toastMessage('Answers successfully saved!')
		})
		.catch((error) => {
			Dialog.toastError('Error saving answers')
			console.log(error)
		})
	}
	else {
		Dialog.toastError("Please correct your issues")
	}
	
}

async function saveAnswersToTest(test, section, answers) {
	console.log('saving answers')
	let doc = await getTestDocumentByCode(test, spaceSize)
	const id = doc.id
	let data = doc.data()

	setObjectValue(['answers', section], answers, data)

	const ref = firebase.firestore().collection('ACT-Tests').doc(id)
	ref.set(data)
}


async function saveScaledScoresToTest(test, section, scores) {
	console.log('saving scores')
	let doc = await getTestDocumentByCode(test, spaceSize)
	const id = doc.id
	let data = doc.data()

	setObjectValue(['scaledScores', section], scores, data)

	const ref = firebase.firestore().collection('ACT-Tests').doc(id)
	ref.set(data)
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
	if (document.getElementById('scaledScoresSection').querySelector('option:checked').textContent.toLowerCase() == 'english') {
		maxValue = 75;
	}
	else if (document.getElementById('scaledScoresSection').querySelector('option:checked').textContent.toLowerCase() == 'math') {
		maxValue = 60;
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
		await firebase.firestore()
		.collection('ACT-Section-Data').doc(dom_section.value)
		.update({ scaledScores })

		Dialog.toastMessage('Scaled scores successfully saved')
	}
	else {
		Dialog.toastError("Please correct your issues")
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
		ABData['preText'] = document.getElementById('readingPassagePreTextB').value
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

	// Remove the current elements
	removeChildren('pText', spacing + spaceSize)

	// Find the HTML elements
	let dom_passage = document.getElementById('pText')

	// Set the passage text
	if (data.content != undefined && data.content != '') {
		// dom_passage.appendChild(createElement('p', [], [], [], data['passageText']))
		dom_passage.innerHTML = data.content;
	}

	// Highlight the text, if necessary
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


	// Reset the MathJax
	resetMathJax(spacing + spaceSize)
}

function setPassageTextSimple(str, spacing = '') {
	if (debug == true) {
		console.log(spacing + 'setPassageTextSimple()', data)
	}

	// Remove the current elements
	removeChildren('pText', spacing + spaceSize)

	let dom_passage = document.getElementById('pText');
	dom_passage.innerHTML = str;

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

		// Reset the isQuestionBank
		document.getElementById('isQuestionBank').checked = true

	}
	else {
		// Get the test document data
		let data = await getTestDoc(dom_test.value, spaceSize)

		// Display the year and month of the test
		let year = document.getElementById('testYear')
		let month = document.getElementById('testMonth')
		let code = document.getElementById('testCode')
		let isQuestionBank = document.getElementById('isQuestionBank')

		year.value = data.data()['releaseDate'].split('-')[0]
		month.value = data.data()['releaseDate'].split('-')[1]
		code.value = data.data()['code']
		isQuestionBank.checked = data.data()['isQuestionBank']

	}
})

let dom_answersTest = document.getElementById('answersTest')
dom_answersTest.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "answersTest")', {
			'value' : dom_answersTest.value
		})
	}

	await initializeSections('answersSection', dom_answersTest.value)

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
	initializePassageDisplay(dom_passageTest.value, null, null, spaceSize)
})

let dom_passageSection = document.getElementById('passageSection')
dom_passageSection.addEventListener('change', function() {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "passageSection")')
	}

	// Re-initialize the display
	initializePassageDisplay(dom_passageTest.value, dom_passageSection.value, null, spaceSize)
})

let dom_passageNumber = document.getElementById('passageNumber')
dom_passageNumber.addEventListener('change', function() {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "passageNumber")')
	}

	// Re-initialize the display
	initializePassageDisplay(dom_passageTest.value, dom_passageSection.value, dom_passageNumber.value, spaceSize)
})

// let dom_AB = document.getElementById('hasABPassages')
// dom_AB.addEventListener('change', function() {
// 	if (debug == true) {
// 		console.log('EVENT LISTENER (id = "hasABPassages")')
// 	}

// 	// Add / Remove Passage B
// 	if (dom_AB.value == 0) {
// 		document.getElementById('passageB').classList.add('hidden')
// 	}
// 	else if (dom_AB.value == 1) {
// 		document.getElementById('passageB').classList.remove('hidden')
// 	}
// })


let dom_passageSections = document.querySelectorAll('div[id$="Passage"]')
for (let i = 0; i < dom_passageSections.length; i++) {
	dom_passageSections[i].addEventListener('input', function (event) {
		if (debug == true) {
			console.log('EVENT LISTENER (id = "' + event.target.id + '")')
		}

		//if (event.target.id == 'englishLabelParagraphs') {
			//let dom_labelParagraphs = document.getElementById('englishLabelParagraphs')

			// Grab the text
			//let text = document.getElementById('englishPassageText').value

			// Remove the paragraph labels, if needed
			/*if (dom_labelParagraphs.value == 0) {
				for (let i = 0; i < 5; i++) {
					document.getElementById('englishPassageText').value = document.getElementById('englishPassageText').value.replaceAll('<b>' + (i + 1).toString() + '</b><br> ', '')
				}
			}*/

			// Add the paragraph labels, if needed
			/*else if (dom_labelParagraphs.value == 1 && text != undefined && text != '' && !text.includes('<b>1</b>')) {
				let splitText = text.split('<br><br>')

				for (let i = 0; i < splitText.length; i++) {
					splitText[i] = '<b>' + (i + 1).toString() + '</b><br> ' + splitText[i]
				}

				document.getElementById('englishPassageText').value = splitText.join('<br><br>')
			}*/

		//}


		// Correct text
		if (!event.target.id.toLowerCase().includes('image')) {
			if (event.target.id.includes('PassageText')) {
				event.target.value = event.target.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;')
			}
			else {
				event.target.value = event.target.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;')
			}
		}

		// Update the bottom display
		setPassageText({
			content: event.target.value
		});
	})
}

let dom_scaledScoresTest = document.getElementById('scaledScoresTest')
dom_scaledScoresTest.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "scaledScoresTest")', {
			'value' : dom_scaledScoresTest.value
		})
	}

	initializeSections('scaledScoresSection', dom_scaledScoresTest.value)

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
	initializeQuestionsDisplay(dom_questionsTest.value, null, null, null, spaceSize)
})

let dom_questionsSection = document.getElementById('questionsSection')
dom_questionsSection.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "questionsSection")', {
			'value' : dom_questionsSection.value
		})
	}

	// Display the answer key for the newly selected test
	initializeQuestionsDisplay(dom_questionsTest.value, dom_questionsSection.value, null, null, spaceSize)
})

let dom_questionsPassageNumber = document.getElementById('questionsPassageNumber')
dom_questionsPassageNumber.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "questionsPassageNumber")', {
			'value' : dom_questionsPassageNumber.value
		})
	}

	// // Get the question Number
	// const number = parseInt(document.getElementById('questionList').value)

	// // Set the bottom half - passage
	// setPassageText(await getPassageDocumentByCode(dom_questionsTest.value, dom_questionsSection.value, dom_questionsPassageNumber.value, spaceSize))

	// // Get the possible answers' text
	// let answers = []
	// for (let i = 0; i < (dom_questionsSection.value != 'math' ? 4 : 5); i++) {
	// 	answers.push(document.getElementById('answer' + (i + 1).toString()).value)
	// }

	// // Get the question test
	// const questionText = document.getElementById('questionText').value

	// // Initialize the Question Preview
	// initializeQuestionPreview(questionText, answers, number, spaceSize)

	// // Initialize the Question Numbers list
	// initializeQuestionNumbersList(dom_questionsTest.value, dom_questionsSection.value, spaceSize)

	// Display the answer key for the newly selected test
	initializeQuestionsDisplay(dom_questionsTest.value, dom_questionsSection.value, dom_questionsPassageNumber.value, dom_questionList.value, spaceSize)
})

let dom_questionList = document.getElementById('questionList')
dom_questionList.addEventListener('change', async function () {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "questionList")', {
			'value' : dom_questionList.value
		})
	}

	// Display the answer key for the newly selected test
	initializeQuestionsDisplay(dom_questionsTest.value, dom_questionsSection.value, null, dom_questionList.value, spaceSize)
})

let dom_questions = document.getElementById('questions')
dom_questions.addEventListener('input', async function(event) {
	if (debug == true) {
		console.log('EVENT LISTENER (id = ' + event.target.id)
	}

	// Clean up the textarea
	if (event.target.tagName.toLowerCase() == 'textarea') {
		event.target.value = event.target.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;').replaceAll(' teh ', ' the ')
		//event.target.value = event.target.value.replaceAll('\n', ' ').replaceAll('--', '&mdash;').replaceAll('—', '&mdash;').replaceAll('  ', ' ')
	}

	// Get the answers
	let answers = []
	let answerElements = document.querySelectorAll('textarea[id^="answer"]')
	for (let i = 0; i < answerElements.length; i++) {
		answers.push(answerElements[i].value)
	}

	// Remove the last answer, if needed
	if (dom_questionsSection.querySelector('option:checked')?.textContent?.toLowerCase() != 'math') {
		answers.splice(answers.length - 1, 1)
	}

	// Initialize the Question Preview
	await initializeQuestionPreview(document.getElementById('questionText').value, document.getElementById('questionExplanation').value, answers, Number(dom_questionList.querySelector('option:checked')?.textContent), spaceSize)

	// Reset Math Jax
	resetMathJax()

})

let dom_curriculumText = document.querySelector('#curriculumText')
dom_curriculumText.addEventListener('input', function (e) {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "' + e.target.id + '")')
	}

	// Correct text
	if (!e.target.id.toLowerCase().includes('image')) {
		e.target.value = e.target.value.replaceAll('--', '&mdash;').replaceAll('—', '&mdash;').replaceAll(' teh ', ' the ')

	}

	// Update the bottom display
	setPassageTextSimple(e.target.value, spaceSize);
})

dom_curriculumText.addEventListener('keydown', function(e) {
  if (e.key == 'Tab') {
    e.preventDefault();
    var start = this.selectionStart;
    var end = this.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    this.value = this.value.substring(0, start) +
      "\t" + this.value.substring(end);

    // put caret at right position again
    this.selectionStart =
      this.selectionEnd = start + 1;
  }
});

let dom_curriculumSection = document.querySelector('#curriculumSection')
dom_curriculumSection.addEventListener('change', async (event) => {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "' + event.target.id + '")')
	}

	const topicDocs = await getTopicsBySection(event.target.value);
	const topicList = topicDocs
	.map(doc => {
		return {
			topic: doc.data().code,
			id: doc.id
		}
	})
	.sort((a,b) => sortAlphabetically(a.topic, b.topic))

	const topicArray = topicList.map(object => object.topic);
	const idArray = topicList.map(object => object.id);

	removeChildren('curriculumTopic');
	addSelectOptions(document.getElementById('curriculumTopic'), ['', ...idArray], ['select a topic', ...topicArray]);
	document.getElementById('curriculumText').value = '';
	document.getElementById('curriculumText').dispatchEvent(new Event('input', {bubbles:true}));
})

let dom_curriculumTopic = document.querySelector('#curriculumTopic')
dom_curriculumTopic.addEventListener('change', async (event) => {
	if (debug == true) {
		console.log('EVENT LISTENER (id = "' + event.target.id + '")')
	}

	const topicDoc = await getTopicByID(event.target.value);
	document.getElementById('curriculumText').value = topicDoc.data().content ?? null;
	document.getElementById('curriculumText').dispatchEvent(new Event('input', {bubbles:true}));
})




async function transferTest() {
	// get all of the old tests
	const testQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'test')
	.get();

	// save the new test
	const months = { 
		'Practice': '00',
		'Janurary': '01',
		'February': '02',
		'March': '03',
		'April': '04',
		'May': '05',
		'June': '06',
		'July': '07',
		'August': '08',
		'September': '09',
		'October': '10',
		'November': '11',
		'December': '12',
	}
	await Promise.all(testQuery.docs.map(doc => {
		return firebase.firestore().collection('ACT-Test-Data').doc().set({
			code: doc.data().test,
			releaseDate: `${doc.data().year}-${months[doc.data().month]}`
		})
	}))
	console.log('done transferring tests')
}

async function transferSection() {
	// get all of the old tests
	const testQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'test')
	.get();

	// save the new sections
	const sections = ['english', 'math', 'reading', 'science'];
	await Promise.all(testQuery.docs.map(doc => {
		return Promise.all(sections.map(async (section) => {
			// get the new test doc
			const testDoc = await firebase.firestore().collection('ACT-Test-Data')
			.where('code', '==', doc.data().test)
			.limit(1)
			.get();

			return firebase.firestore().collection('ACT-Section-Data').doc().set({
				code: section,
				test: testDoc.docs[0].id,
				scaledScores: doc.data().scaledScores[section]
			})
		}))
	}))
	console.log('done transferring sections')
}

async function transferPassage() {
	// get all of the old passages
	const passageQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'passage')
	.get();

	const testQuery = await firebase.firestore().collection('ACT-Test-Data').get()
	const sectionQuery = await firebase.firestore().collection('ACT-Section-Data').get()

	await Promise.all(passageQuery.docs.map(async (doc) => {
		const testDoc = testQuery.docs.find(test => test.data().code == doc.data().test)
		const sectionDoc = sectionQuery.docs.find(section => section.data().test == testDoc.id && section.data().code == doc.data().section)

		return firebase.firestore().collection('ACT-Passage-Data').doc().set({
			code: doc.data().passageNumber,
			section: sectionDoc.id,
			test: testDoc.id,
			content: (doc.data().title ?? '') +
			(doc.data().preText ?? '') +
			(doc.data().passageText ?? '') +
			(doc.data().ABData.title ?? '') +
			(doc.data().ABData.preText ?? '') +
			(doc.data().ABData.passageText ?? '') +
			(doc.data().reference ?? '') +
			(doc.data().ABData.reference ?? '')
		})
	}))
	console.log('done transferring passages')
}

async function transferCurriculum() {
	// get all of the old curriculum docs
	const curriculumQuery = await firebase.firestore()
	.collection('Dynamic-Content').doc('curriculum-topics')
	.collection('Topics')
	.where('type', '==', 'topic')
	.get()

	await Promise.all(curriculumQuery.docs.map(async (doc) => {
		await firebase.firestore()
		.collection('ACT-Curriculum-Data').doc().set({
			content: doc.data().curriculum ?? '',
			code: doc.data().topic,
			sectionCode: doc.data().section
		})
	}))
}

async function transferQuestion() {
	// get all of the old questions
	const questionQuery = await firebase.firestore().collection('ACT-Tests')
	.where('type', '==', 'question')
	.get();

	// for better performance get the list of test, section, and passages and load it into the client
	const testQuery = await firebase.firestore().collection('ACT-Test-Data').get()
	const sectionQuery = await firebase.firestore().collection('ACT-Section-Data').get()
	const passageQuery = await firebase.firestore().collection('ACT-Passage-Data').get()
	const curriculumQuery = await firebase.firestore().collection('ACT-Curriculum-Data').get()

	await Promise.all(questionQuery.docs.map(async (doc, index) => {
		const testDoc = testQuery.docs.find(test => test.data().code == doc.data().test);
		const sectionDoc = sectionQuery.docs.find(section => section.data().test == testDoc.id && section.data().code == doc.data().section);
		const passageDoc = passageQuery.docs.find(passage => passage.data().test == testDoc.id && passage.data().section == sectionDoc.id && passage.data().code == doc.data().passage);
		const curriculumDoc = curriculumQuery.docs.find(curriculum => doc.data().topic[0] == curriculum.data().code);

		const answers = {
			'A': 0,
			'B': 1,
			'C': 2,
			'D': 3,
			'E': 4,

			'F': 0,
			'G': 1,
			'H': 2,
			'J': 3,
			'K': 4
		}

		console.log(`setting question ${index + 1} out of ${questionQuery.size}`)

		return firebase.firestore().collection('ACT-Question-Data').doc().set({
			code: doc.data().problem,
			choices: doc.data().answers.map(ans => `<p>${ans}</p>`),
			answer: answers[doc.data().correctAnswer],
			content: doc.data().questionText,
			topic: curriculumDoc?.id ?? null,
			passage: passageDoc?.id ?? null,
			section: sectionDoc.id,
			test: testDoc.id,
			isQuestionBank: true,
			isGroupedByPassage: doc.data().section == 'reading' || doc.data().topic.includes('Conflicting Viewpoints')
		});
	}))

	console.log('done transferring questions')
}

async function transferEverything() {
	await transferTest();
	await transferSection();
	await transferPassage();
	await transferCurriculum();
	await transferQuestion();
}