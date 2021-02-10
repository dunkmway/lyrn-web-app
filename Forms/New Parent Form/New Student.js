function createElements(elementType = [], classes = [], attributes = [], values = [], text = [], flexType = "flexRow") {
  if (elementType.length >= 0) {
    let elements = createElement("div", flexType);

    if (attributes.length == values.length && attributes.length >= 0) {
      for (let i = 0; i < elementType.length; i++) {
        elements.appendChild(createElement(elementType[i], classes[i], attributes[i], values[i], text[i]));
      }
    }

    return elements;

  }
}

  function createElement(elementType, classes = "", attributes = [], values = [], text = "") {
    let question = document.createElement(elementType);

    if (attributes.length == values.length && attributes.length > 0) {
      for (let i = 0; i < attributes.length; i++) {
        question.setAttribute(attributes[i], values[i]);
      }
    }

    if (classes != "") {
      question.className = classes;
    }

    if (text != "") {
      question.innerHTML = text;
    }
    return question;

  }

  function combineElements(objects = [], flexType = "flexRow")
  {
    let item = createElement("div", flexType, [], [], "");

    if (objects.length > 1)
    {
      for (let i = 0; i < objects.length; i++)
      {
        item.appendChild(objects[i]);
      }
    }

    return item;

  }


  function createParentForm() {
    //let formDiv = createElement("div", "flexColumn", ["id"], ["formDiv"], "")
    let questions = []
    let pageDiv = document.createElement("div")
    pageDiv.setAttribute("id", "pageDiv")

    let parentLocation = document.createElement("div");
    parentLocation.setAttribute("id", "formDiv")
    pageDiv.appendChild(parentLocation)

    let section = document.getElementById("section");
    section.appendChild(pageDiv)

    // Title
    parentLocation.parentNode.insertBefore(createElements(["h2"], ["formTitle"], [[]], [[]], ["Parent Information"], "flexColumn"), parentLocation);

    // Progress Bar
    let progress = createElements(["ul"], ["progressBar"], [], [], "", "progressBarContainer");
    progress.querySelector("ul").appendChild(createElements(["li", "li", "li"], [[],[],[]], [[],[],[]], [[],[],[]], ["Parent", "Student", "Review"], ""))
    parentLocation.parentNode.insertBefore(progress, parentLocation);

    // Full Name
    let ele1 = createElements(["label", "input"], ["label", "input"], [["for"], ["id", "placeholder"]], [["firstName"], ["firstName", "John"]], ["First Name:", ""], "flexColumn2");
    let ele2 = createElements(["label", "input"], ["label", "input input2"], [["for"], ["id", "placeholder"]], [["lastName"], ["lastName", "Doe"]], ["Last Name", ""], "flexColumn2");
    questions.push(combineElements([ele1, ele2]));

    // Phone numer and Email Address
    let ele3 = createElements(["label", "input"], ["label", "input"], [["for"], ["id", "placeholder"]], [["phoneNumber"], ["phoneNumber", "(123) 123-1234"]], ["Phone Number:", ""], "flexColumn2");
    let ele4 = createElements(["label", "input"], ["label", "input input2"], [["for"], ["id", "placeholder"]], [["email"], ["email", "John@domain.com"]], ["Email Address:", ""], "flexColumn2");
    questions.push(combineElements([ele3, ele4]));

    // Place of Employment
    let ele5 = createElements(["label", "input"], ["label", "input"], [["for"], ["id", "placeholder"]], [["employment"], ["employment", "Wasatch Tutors"]], ["Place of Employment:", ""], "flexColumn2");
    let ele6 = createElements(["label", "input"], ["label", "input finalInput input2"], [["for"], ["id", "placeholder"]], [["marketing"], ["marketing", "Referral"]], ["How did you hear about us:", ""], "flexColumn2");
    questions.push(combineElements([ele5, ele6]));

    // Agreement Section
    questions.push(createElement("div", "", ["id"], ["agreementDiv"]));
    questions[questions.length - 1].appendChild(createElement("ul"));

    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["Payment may be made using cash, check, or credit card.", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["There is a $30 fee for all returned checks.", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["Payment is due on the 1st of each month and will be for the total amount for the month to come. (Session must be paid, prior to instruction)", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["Notice must be given by the end of the previous business day for <u>ALL</u> cancellations and/or schedule changes.", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["If notice is not given the day prior, I understand that I <em>WILL</em> be charged for the full amount of the session.", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["finalLength", "input miniBox finalLength", "finalLength"], [[], [], []], [[], [], []], ["I agree to the Privacy Notice shown below.", "", "(initials)"]));

    let elements = createElement("div", "flexRow");
    elements.appendChild(createElements(["input", "text"], ["input signature", "signature"], [[], []], [[], []], ["", "Parent Signature"], "flexColumn"));
    elements.appendChild(createElements(["input", "text"], ["input smallBox date", "date"], [[], []], [[], []], ["", "Date"], "flexColumn"));

    questions[questions.length - 1].appendChild(elements);
    //questions.push(createElements(["img", "img"], [], [["src", "alt", "height", "id", "onclick"], ["src", "alt", "height", "id", "onclick"]], [["../../Images/Next Button.png", "Back Button", "75px", "backButton", "previousForm()"], ["../../Images/Next Button.png", "Next Button", "75px", "nextButton", "nextForm()"]], ["", ""], "flexRow buttonsDiv"))
    questions.push(createElements(["div", "div"], ["buttons", "buttons"], [["id", "onclick"], ["id", "onclick"]], [["backButton", "previousForm()"], ["nextButton", "nextForm()"]], ["Previous", "Next"], "flexRow buttonsDiv"))

    questions.push(createElement("p", "", [], [], "<b>Privacy Notice</b>"))
    questions.push(createElement("p", "", ["id"], ["statement"], "We at <em>WASATCH TUTORS</em> take the security of your personal information very seriously. We will <b>NEVER</b> share your information with any other companies or organizations, other than our own, without your written approval. Rest assured that your information is safe with us."))

    //parentLocation.appendChild(formDiv);

    // Add the questions / elements to the form div
    for (let i = 0; i < questions.length; i++) {
      formDiv.appendChild(questions[i]);
    }

      parentLocation.appendChild(formDiv);

    // Style the progress bar
    let sheet = window.document.styleSheets[0];
    sheet.insertRule('.progressBar li:first-child:after { background-color: rgb(2, 89, 165); color: white;')

  }

  function nextForm() {
    document.getElementById("pageDiv").remove()

  }

  function previousForm() {
    console.log("I don't feel like doing anything right now")
  }


  createParentForm();