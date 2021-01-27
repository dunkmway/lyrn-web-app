// https://stackoverflow.com/questions/8714090/queryselector-wildcard-element-match
//   Queryselector wild cards
/*********************************************************************
 * Description:
 *   This will add a new sibling + age label and input tag
 ********************************************************************/
function addSibling()
{
    let siblings = document.querySelectorAll("label[for^=\"sibling\"]");
    let siblingCount = siblings.length / 2;
    console.log(siblingCount);
}
addSibling()
            //<label for = "sibling1" class = "label">Sibling:</label>
            //<input type="text" id = "sibling1" class = "input">
            //<label for = "siblingAge1" class = "label">Age:</label>
            //<input type="number" min = 1 max = 130 id = "siblingAge1" class = "input"></input>