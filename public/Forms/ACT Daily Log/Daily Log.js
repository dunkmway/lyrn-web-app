function createElements(elementType = [], classes = [], attributes = [], values = [], text = [], flexType = "input-row") {
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

  function combineElements(objects = [], flexType = "input-row")
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

document.getElementById("homeworkStatus").addEventListener("change", target => {
    if (target.target.value == "Completed") {
        addCompletedHomework();
    }
    else {
        let completedHomeworks = document.querySelectorAll("label[for^=\"homeworkTest\"");
        for (let i = 0; i < completedHomeworks.length; i++) {
            completedHomeworks[i].parentNode.parentNode.remove();
        }

        let images = document.querySelectorAll("img[id^=\"completed\"");
        for (let i = 0; i < images.length; i++) {
            images[i].remove();
        }
    }
});

function addCompletedHomework() {
    childCount = document.querySelectorAll("label[for^=\"homeworkTest\"").length
    childCountString = (childCount + 1).toString()

    if (childCount == 0) {
        let loc = document.getElementById("homeworkStatus").parentNode;
        let add = createElement("img", "button", ["src", "alt", "height", "width", "id", "onclick"], ["../../Images/Add Button.png", "Add another completed homework", "30px", "30px", "completedHomeworkAdd", "addCompletedHomework()"], "");
        let remove = createElement("img", "button", ["src", "alt", "height", "width", "id", "onclick"], ["../../Images/Remove Button.png", "Remove the last completed homework", "30px", "30px", "completedHomeworkRemove", "removeCompletedHomework()"], "");
        //let eles = combineElements([add, remove], "input-row");
        loc.parentNode.appendChild(add);
        loc.parentNode.appendChild(remove);
    }

    let location = document.getElementById("homeworkBreak");
    //if (childCount != 0) {
        //location = document.getElementById("completedHomeworkAdd").parentNode;
    //}
    let testIDs = ["B02", "74F", "72F", "B04", "71H", "A11", "74C", "71G", "MC3", "A09", "A10", "72C", "B05", "71E", "MC2", "69A"];
    let sections = ["English", "Math", "Reading", "Science"];

    let block1 = createElements(["label", "select"], ["label", "input"], [["for"], ["id"]], [["homeworkTest" + childCountString], ["homeworkTest" + childCountString]], ["Homework Test", ""], "input-block");
    block1.childNodes[1].appendChild(createElement("option", "", "value", "", "Test"));
    for (let i = 0; i < testIDs.length; i++) {
        block1.childNodes[1].appendChild(createElement("option", "", "value", testIDs[i], testIDs[i]));
    }

    let block2 = createElements(["label", "select"], ["label", "input"], [["for"], ["id"]], [["homeworkSection" + childCountString], ["homeworkSection" + childCountString]], ["Homework Section", ""], "input-block");
    block2.childNodes[1].appendChild(createElement("option", "", "value", "", "Section"));
    for (let i = 0; i < sections.length; i++) {
        block2.childNodes[1].appendChild(createElement("option", "", "value", sections[i], sections[i]));
    }

    let block3 = createElements(["label", "select"], ["label", "input"], [["for"], ["id"]], [["homeworkScore" + childCountString], ["homeworkScore" + childCountString]], ["Homework Score", ""], "input-block");
    block3.childNodes[1].appendChild(createElement("option", "", "value", "", "Score"));
    for (let i = 0; i < 76; i++) {
        let num = i.toString();
        block3.childNodes[1].appendChild(createElement("option", "", "value", num, num));
    }

    let elements = combineElements([block1, block2, block3], "input-row");

    location.parentNode.insertBefore(elements, location);

};

function removeCompletedHomework() {
    let completedHomeworks = document.querySelectorAll("label[for^=\"homeworkTest\"");
    if (completedHomeworks.length > 1) {
        completedHomeworks[completedHomeworks.length - 1].parentNode.parentNode.remove();
    }
}

function addPracticeTest(sectionID) {
    sectionIDString = sectionID.toString();
    let location = document.getElementById("sessionPractice" + sectionIDString);

    let testIDs = ["MC3", "A09", "A10", "72C", "B05", "71E", "MC2", "69A", "B02", "74F", "72F", "B04", "71H", "A11", "74C", "71G"];
    let sections = {"English":["Passage 1", "Passage 2", "Passage 3", "Passage 4", "Passage 5"],
                    "Math": ["Q1 - Q15", "Q16 - Q30", "Q31 - 45", "Q46 - 60"],
                    "Reading": ["Passage 1", "Passage 2", "Passage 3", "Passage 4"],
                    "Science": ["Passage 1", "Passage 2", "Passage 3", "Passage 4", "Passage 5", "Passage 6", "Passage 7"]};

    let block1 = createElements(["label", "select"], ["label", "input"], [["for"], ["id"]], [["practiceTest" + sectionIDString], ["practiceTest" + sectionIDString]], ["Practice Test", ""], "input-block");
    block1.childNodes[1].appendChild(createElement("option", "", "value", "", "Test"));
    for (let i = 0; i < testIDs.length; i++) {
        block1.childNodes[1].appendChild(createElement("option", "", "value", testIDs[i], testIDs[i]));
    }

    let block2 = createElements(["label", "select"], ["label", "input"], [["for"], ["id"]], [["practiceSection" + sectionIDString], ["practiceSection" + sectionIDString]], ["Practice Section", ""], "input-block");
    //block2.childNodes[1].appendChild(createElement("option", "", "value", "", "Section"));
    //for (let i = 0; i < sections.length; i++) {
        //block2.childNodes[1].appendChild(createElement("option", "", "value", sections[i], sections[i]));
    //}

    //let block3 = createElements(["label", "select"], ["label", "input"], [["for"], ["id"]], [["homeworkScore" + childCountString], ["homeworkScore" + childCountString]], ["Homework Score", ""], "input-block");
    //block3.childNodes[1].appendChild(createElement("option", "", "value", "", "Score"));
    //for (let i = 0; i < 76; i++) {
        //let num = i.toString();
        //block3.childNodes[1].appendChild(createElement("option", "", "value", num, num));
    //}

    let elements = combineElements([block1, block2], "input-row");

    location.parentNode.parentNode.appendChild(elements);

};
