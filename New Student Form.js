/*********************************************************************
 * Description:
 *   This will add a new sibling + age label and input tag
 ********************************************************************/
function addSibling()
{
    // Count how many siblings are there already and create their id: siblingName and siblingAge
    let siblings = document.querySelectorAll("label[for^=\"sibling\"]");
    let siblingCount = siblings.length / 2;
    let siblingName = "sibling" + String(siblingCount);
    let siblingAge  = "siblingAge" + String(siblingCount);



    // This will hold all of the label and input tags to iterate through
    let siblingArray = [];
    


    // Create the new labels and inputs
    let siblingLabel = document.createElement("label")
    siblingLabel.setAttribute("for", "sibling" + String(siblingCount + 1))
    siblingLabel.innerHTML = "Sibling:"
    siblingLabel.className = "label"
    siblingArray.push(siblingLabel);

    let siblingInput = document.createElement("input")
    siblingInput.setAttribute("id", "sibling" + String(siblingCount + 1))
    siblingInput.className = "input"
    siblingArray.push(siblingInput);

    let siblingAgeLabel = document.createElement("label")
    siblingLabel.setAttribute("for", "siblingAge" + String(siblingCount + 1))
    siblingAgeLabel.innerHTML = "Age:"
    siblingAgeLabel.className = "label"
    siblingArray.push(siblingAgeLabel);

    let siblingAgeInput = document.createElement("input")
    siblingAgeInput.setAttribute("id", "siblingAge" + String(siblingCount + 1))
    siblingAgeInput.className = "input"
    siblingArray.push(siblingAgeInput);



    // Add the sibling labels and tags to their div
    let siblingDiv = document.createElement("div");
    siblingDiv.className = "inline"
    for (let i = 0; i < siblingArray.length; i++)
    {
        siblingDiv.appendChild(siblingArray[i])
    }

    console.log(siblingDiv);

    // Find the Add button and insert the new sibling labels and inputs before it
    let location = document.getElementById("addSiblingButton");
    location.parentNode.insertBefore(siblingDiv, location);

}





