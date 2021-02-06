function createElements(elementType = [], classes = [], attributes = [], values = [], text = [], flexType = "flexRow") {
  if (elementType.length > 0) {
    let elements = createElement("div", flexType);

    if (attributes.length == values.length && attributes.length > 0) {
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
    let formDiv = createElement("div", "flexColumn", ["id"], ["formDiv"], "")
    let questions = []
    let parentLocation = document.getElementById("form");

    // Title
    parentLocation.parentNode.insertBefore(createElements(["h2"], ["formTitle"], [[]], [[]], ["Parent Information"]), parentLocation);

    // Full Name
    let ele1 = createElements(["label", "input"], ["label", "input"], [["for"], ["id", "placeholder"]], [["firstName"], ["firstName", "First Name"]], ["Full Name:", ""], "flexColumn");
    let ele2 = createElements(["label", "input"], ["label", "input"], [["for"], ["id", "placeholder"]], [["lastName"], ["lastName", "Last Name"]], ["", ""], "flexColumn");
    questions.push(combineElements([ele1, ele2]));

    // Phone Number
    questions.push(createElements(["label", "input"], ["label", "input"], [["for"], ["id", "placeholder"]], [["phoneNumber"], ["phoneNumber", "Phone Number"]], ["Phone Number:", ""], "flexColumn"));

    // Email Address
    questions.push(createElements(["label", "input"], ["label", "input"], [["for"], ["id", "placeholder"]], [["email"], ["email", "E-mail Address"]], ["Email Address:", ""], "flexColumn"));

    // Place of Employment
    questions.push(createElements(["label", "input"], ["label", "input"], [["for"], ["id", "placeholder"]], [["employment"], ["employment", "Place of Employment"]], ["Place of Employment:", ""], "flexColumn"));

    // How they heard of Wasatch Tutors
    questions.push(createElements(["label", "input"], ["label finalInput", "input finalInput"], [["for"], ["id", "placeholder"]], [["marketing"], ["marketing", "How did you hear about us?"]], ["How did you hear about us:", ""], "flexColumn"));

    // Agreement Section
    questions.push(createElement("div", "", ["id"], ["agreementDiv"]));
    questions[questions.length - 1].appendChild(createElement("ul"));

    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["Payment may be made using cash, check, or credit card.", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["There is a $30 fee for all returned checks.", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["Payment is due on the 1st of each month and will be for the total amount for the month to come. (Session must be paid, prior to instruction)", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["Notice must be given by the end of the previous business day for <u>ALL</u> cancellations and/or schedule changes.", "", "(initials)"]));
    questions[questions.length - 1].querySelector("ul").appendChild(createElements(["li", "input", "text"], ["", "input miniBox", ""], [[], [], []], [[], [], []], ["If notice is not given the day prior, I understand that I <em>WILL</em> be charged for the full amount of the session.", "", "(initials)"]));

    let elements = createElement("div", "flexRow");
    elements.appendChild(createElements(["input", "text"], ["input signature", "signature"], [[], []], [[], []], ["", "Parent Signature"], "flexColumn"));
    elements.appendChild(createElements(["input", "text"], ["input smallBox date", "date"], [[], []], [[], []], ["", "Date"], "flexColumn"));

    questions[questions.length - 1].appendChild(elements);

    questions.push(createElement("p", "", [], [], "<b>Privacy Notice</b>"))
    questions.push(createElement("p", "", ["id"], ["statement"], "We at <em>WASATCH TUTORS</em> take the security of your personal information very seriously. We will <b>NEVER</b> share your information with any other companies or organizations, other than our own, without your written approval. Rest assured that your information is safe with us."))

    parentLocation.appendChild(formDiv);

    // Add the questions / elements to the form div
    for (let i = 0; i < questions.length; i++) {
      formDiv.appendChild(questions[i]);
    }

  
      
  }

  createParentForm();