/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!***************************!*\
  !*** ./src/formatting.js ***!
  \***************************/
/**
 * Description:
 *   checks if the key event is an allowed modifying key
 * @param {event} event javascript event
 */
 const isModifierKey = (event) => {
	const key = event.keyCode;
	return (key === 35 || key === 36) || // Allow Shift, Home, End
		(key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
		(key > 36 && key < 41) || // Allow left, up, right, down
		(
			// Allow Ctrl/Command + A,C,V,X,Z
			(event.ctrlKey === true || event.metaKey === true) &&
			(key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
		)
};

/**
 * Description:
 *   checks if the key event is a numeric input
 * @param {event} event javascript event
 */
const isNumericInput = (event) => {
	const key = event.keyCode;
	return (
    ((key >= 48 && key <= 57) || // Allow number line
		(key >= 96 && key <= 105)) // Allow number pad 
    && (!event.shiftKey) // Do not allow shift key
	);
};

const enforceNumericFormat = (event) => {
	// Input must be of a valid number format or a modifier key
	if(!isNumericInput(event) && !isModifierKey(event)) {
		event.preventDefault();
	}
};

const enforceDecimalFormat = (event) => {
	// Input must be of a valid number format or a modifier key or decimal point
	const key = event.keyCode;
	if(!isNumericInput(event) && !isModifierKey(event) && key != 190) {
		event.preventDefault();
	}
};

const formatToPhone = (event) => {
	// I am lazy and don't like to type things more than once
	const target = event.target;
	const input = event.target.value.replace(/\D/g,'').substring(0,10); // First ten digits of input only
	const zip = input.substring(0,3);
	const middle = input.substring(3,6);
	const last = input.substring(6,10);

	if(input.length > 6){target.value = `(${zip}) ${middle}-${last}`;}
	else if(input.length > 3){target.value = `(${zip}) ${middle}`;}
	else if(input.length > 0){target.value = `(${zip}`;}
};

const formatToDate = (event) => {
	// I am lazy and don't like to type things more than once
	const target = event.target;
	const input = event.target.value.replace(/\D/g,'').substring(0,8); // First ten digits of input only
  let month = input.substring(0,2);
	let day = input.substring(2,4);
  let year = input.substring(4,8);
  
  //enforce proper months and day values
  if (Number(month) > 12) {
    month = "12";
  }
  if (Number(day) > 31) {
    day = "31"
  }

	if(input.length > 4){target.value = `${month}/${day}/${year}`;}
	else if(input.length > 2){target.value = `${month}/${day}`;}
	else if(input.length > 0){target.value = `${month}`;}
};

const formatToInt = (event) => {
  const target = event.target;

  //remove non numbers from input if they have snuck past
  let strArray = target.value.split('');
  strArray.forEach((char, index) => {
    if (isNaN(char)) {
      strArray[index] = '';
    }
  });
  target.value = strArray.join('');
  
  const min = Number(target.getAttribute("min"));
  const max = Number(target.getAttribute("max"));
  const input = Number(target.value)

  //remove leading zeros
  if (input < min) {
    target.value = min;
  }
  else if (input > max) {
    target.value = max;
  }

}

const formatToMoney = (event) => {
	formatToInt(event);

	const target = event.target;
	const input = event.target.value;

	if (input) {
		target.value = '$' + input;
	}
	else {
		target.value = '';
	}
}

document.querySelectorAll('input[type="tel"]').forEach(telInput => {
	telInput.addEventListener('keydown',enforceNumericFormat);
	telInput.addEventListener('keyup',formatToPhone);
})
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGluZy5qcyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFFQUFxRTtBQUNyRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixtQkFBbUIsSUFBSSxJQUFJLE9BQU8sR0FBRyxLQUFLO0FBQ2hFLDJCQUEyQixtQkFBbUIsSUFBSSxJQUFJLE9BQU87QUFDN0QsMkJBQTJCLG1CQUFtQixJQUFJO0FBQ2xEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRUFBb0U7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCLGtCQUFrQixNQUFNLEdBQUcsSUFBSSxHQUFHLEtBQUs7QUFDN0QsMkJBQTJCLGtCQUFrQixNQUFNLEdBQUcsSUFBSTtBQUMxRCwyQkFBMkIsa0JBQWtCLE1BQU07QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLEMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9seXJuX3dlYl9hcHBfY2xlYW4vLi9zcmMvZm9ybWF0dGluZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogRGVzY3JpcHRpb246XHJcbiAqICAgY2hlY2tzIGlmIHRoZSBrZXkgZXZlbnQgaXMgYW4gYWxsb3dlZCBtb2RpZnlpbmcga2V5XHJcbiAqIEBwYXJhbSB7ZXZlbnR9IGV2ZW50IGphdmFzY3JpcHQgZXZlbnRcclxuICovXHJcbiBjb25zdCBpc01vZGlmaWVyS2V5ID0gKGV2ZW50KSA9PiB7XHJcblx0Y29uc3Qga2V5ID0gZXZlbnQua2V5Q29kZTtcclxuXHRyZXR1cm4gKGtleSA9PT0gMzUgfHwga2V5ID09PSAzNikgfHwgLy8gQWxsb3cgU2hpZnQsIEhvbWUsIEVuZFxyXG5cdFx0KGtleSA9PT0gOCB8fCBrZXkgPT09IDkgfHwga2V5ID09PSAxMyB8fCBrZXkgPT09IDQ2KSB8fCAvLyBBbGxvdyBCYWNrc3BhY2UsIFRhYiwgRW50ZXIsIERlbGV0ZVxyXG5cdFx0KGtleSA+IDM2ICYmIGtleSA8IDQxKSB8fCAvLyBBbGxvdyBsZWZ0LCB1cCwgcmlnaHQsIGRvd25cclxuXHRcdChcclxuXHRcdFx0Ly8gQWxsb3cgQ3RybC9Db21tYW5kICsgQSxDLFYsWCxaXHJcblx0XHRcdChldmVudC5jdHJsS2V5ID09PSB0cnVlIHx8IGV2ZW50Lm1ldGFLZXkgPT09IHRydWUpICYmXHJcblx0XHRcdChrZXkgPT09IDY1IHx8IGtleSA9PT0gNjcgfHwga2V5ID09PSA4NiB8fCBrZXkgPT09IDg4IHx8IGtleSA9PT0gOTApXHJcblx0XHQpXHJcbn07XHJcblxyXG4vKipcclxuICogRGVzY3JpcHRpb246XHJcbiAqICAgY2hlY2tzIGlmIHRoZSBrZXkgZXZlbnQgaXMgYSBudW1lcmljIGlucHV0XHJcbiAqIEBwYXJhbSB7ZXZlbnR9IGV2ZW50IGphdmFzY3JpcHQgZXZlbnRcclxuICovXHJcbmNvbnN0IGlzTnVtZXJpY0lucHV0ID0gKGV2ZW50KSA9PiB7XHJcblx0Y29uc3Qga2V5ID0gZXZlbnQua2V5Q29kZTtcclxuXHRyZXR1cm4gKFxyXG4gICAgKChrZXkgPj0gNDggJiYga2V5IDw9IDU3KSB8fCAvLyBBbGxvdyBudW1iZXIgbGluZVxyXG5cdFx0KGtleSA+PSA5NiAmJiBrZXkgPD0gMTA1KSkgLy8gQWxsb3cgbnVtYmVyIHBhZCBcclxuICAgICYmICghZXZlbnQuc2hpZnRLZXkpIC8vIERvIG5vdCBhbGxvdyBzaGlmdCBrZXlcclxuXHQpO1xyXG59O1xyXG5cclxuY29uc3QgZW5mb3JjZU51bWVyaWNGb3JtYXQgPSAoZXZlbnQpID0+IHtcclxuXHQvLyBJbnB1dCBtdXN0IGJlIG9mIGEgdmFsaWQgbnVtYmVyIGZvcm1hdCBvciBhIG1vZGlmaWVyIGtleVxyXG5cdGlmKCFpc051bWVyaWNJbnB1dChldmVudCkgJiYgIWlzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdH1cclxufTtcclxuXHJcbmNvbnN0IGVuZm9yY2VEZWNpbWFsRm9ybWF0ID0gKGV2ZW50KSA9PiB7XHJcblx0Ly8gSW5wdXQgbXVzdCBiZSBvZiBhIHZhbGlkIG51bWJlciBmb3JtYXQgb3IgYSBtb2RpZmllciBrZXkgb3IgZGVjaW1hbCBwb2ludFxyXG5cdGNvbnN0IGtleSA9IGV2ZW50LmtleUNvZGU7XHJcblx0aWYoIWlzTnVtZXJpY0lucHV0KGV2ZW50KSAmJiAhaXNNb2RpZmllcktleShldmVudCkgJiYga2V5ICE9IDE5MCkge1xyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHR9XHJcbn07XHJcblxyXG5jb25zdCBmb3JtYXRUb1Bob25lID0gKGV2ZW50KSA9PiB7XHJcblx0Ly8gSSBhbSBsYXp5IGFuZCBkb24ndCBsaWtlIHRvIHR5cGUgdGhpbmdzIG1vcmUgdGhhbiBvbmNlXHJcblx0Y29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xyXG5cdGNvbnN0IGlucHV0ID0gZXZlbnQudGFyZ2V0LnZhbHVlLnJlcGxhY2UoL1xcRC9nLCcnKS5zdWJzdHJpbmcoMCwxMCk7IC8vIEZpcnN0IHRlbiBkaWdpdHMgb2YgaW5wdXQgb25seVxyXG5cdGNvbnN0IHppcCA9IGlucHV0LnN1YnN0cmluZygwLDMpO1xyXG5cdGNvbnN0IG1pZGRsZSA9IGlucHV0LnN1YnN0cmluZygzLDYpO1xyXG5cdGNvbnN0IGxhc3QgPSBpbnB1dC5zdWJzdHJpbmcoNiwxMCk7XHJcblxyXG5cdGlmKGlucHV0Lmxlbmd0aCA+IDYpe3RhcmdldC52YWx1ZSA9IGAoJHt6aXB9KSAke21pZGRsZX0tJHtsYXN0fWA7fVxyXG5cdGVsc2UgaWYoaW5wdXQubGVuZ3RoID4gMyl7dGFyZ2V0LnZhbHVlID0gYCgke3ppcH0pICR7bWlkZGxlfWA7fVxyXG5cdGVsc2UgaWYoaW5wdXQubGVuZ3RoID4gMCl7dGFyZ2V0LnZhbHVlID0gYCgke3ppcH1gO31cclxufTtcclxuXHJcbmNvbnN0IGZvcm1hdFRvRGF0ZSA9IChldmVudCkgPT4ge1xyXG5cdC8vIEkgYW0gbGF6eSBhbmQgZG9uJ3QgbGlrZSB0byB0eXBlIHRoaW5ncyBtb3JlIHRoYW4gb25jZVxyXG5cdGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcclxuXHRjb25zdCBpbnB1dCA9IGV2ZW50LnRhcmdldC52YWx1ZS5yZXBsYWNlKC9cXEQvZywnJykuc3Vic3RyaW5nKDAsOCk7IC8vIEZpcnN0IHRlbiBkaWdpdHMgb2YgaW5wdXQgb25seVxyXG4gIGxldCBtb250aCA9IGlucHV0LnN1YnN0cmluZygwLDIpO1xyXG5cdGxldCBkYXkgPSBpbnB1dC5zdWJzdHJpbmcoMiw0KTtcclxuICBsZXQgeWVhciA9IGlucHV0LnN1YnN0cmluZyg0LDgpO1xyXG4gIFxyXG4gIC8vZW5mb3JjZSBwcm9wZXIgbW9udGhzIGFuZCBkYXkgdmFsdWVzXHJcbiAgaWYgKE51bWJlcihtb250aCkgPiAxMikge1xyXG4gICAgbW9udGggPSBcIjEyXCI7XHJcbiAgfVxyXG4gIGlmIChOdW1iZXIoZGF5KSA+IDMxKSB7XHJcbiAgICBkYXkgPSBcIjMxXCJcclxuICB9XHJcblxyXG5cdGlmKGlucHV0Lmxlbmd0aCA+IDQpe3RhcmdldC52YWx1ZSA9IGAke21vbnRofS8ke2RheX0vJHt5ZWFyfWA7fVxyXG5cdGVsc2UgaWYoaW5wdXQubGVuZ3RoID4gMil7dGFyZ2V0LnZhbHVlID0gYCR7bW9udGh9LyR7ZGF5fWA7fVxyXG5cdGVsc2UgaWYoaW5wdXQubGVuZ3RoID4gMCl7dGFyZ2V0LnZhbHVlID0gYCR7bW9udGh9YDt9XHJcbn07XHJcblxyXG5jb25zdCBmb3JtYXRUb0ludCA9IChldmVudCkgPT4ge1xyXG4gIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcclxuXHJcbiAgLy9yZW1vdmUgbm9uIG51bWJlcnMgZnJvbSBpbnB1dCBpZiB0aGV5IGhhdmUgc251Y2sgcGFzdFxyXG4gIGxldCBzdHJBcnJheSA9IHRhcmdldC52YWx1ZS5zcGxpdCgnJyk7XHJcbiAgc3RyQXJyYXkuZm9yRWFjaCgoY2hhciwgaW5kZXgpID0+IHtcclxuICAgIGlmIChpc05hTihjaGFyKSkge1xyXG4gICAgICBzdHJBcnJheVtpbmRleF0gPSAnJztcclxuICAgIH1cclxuICB9KTtcclxuICB0YXJnZXQudmFsdWUgPSBzdHJBcnJheS5qb2luKCcnKTtcclxuICBcclxuICBjb25zdCBtaW4gPSBOdW1iZXIodGFyZ2V0LmdldEF0dHJpYnV0ZShcIm1pblwiKSk7XHJcbiAgY29uc3QgbWF4ID0gTnVtYmVyKHRhcmdldC5nZXRBdHRyaWJ1dGUoXCJtYXhcIikpO1xyXG4gIGNvbnN0IGlucHV0ID0gTnVtYmVyKHRhcmdldC52YWx1ZSlcclxuXHJcbiAgLy9yZW1vdmUgbGVhZGluZyB6ZXJvc1xyXG4gIGlmIChpbnB1dCA8IG1pbikge1xyXG4gICAgdGFyZ2V0LnZhbHVlID0gbWluO1xyXG4gIH1cclxuICBlbHNlIGlmIChpbnB1dCA+IG1heCkge1xyXG4gICAgdGFyZ2V0LnZhbHVlID0gbWF4O1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmNvbnN0IGZvcm1hdFRvTW9uZXkgPSAoZXZlbnQpID0+IHtcclxuXHRmb3JtYXRUb0ludChldmVudCk7XHJcblxyXG5cdGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcclxuXHRjb25zdCBpbnB1dCA9IGV2ZW50LnRhcmdldC52YWx1ZTtcclxuXHJcblx0aWYgKGlucHV0KSB7XHJcblx0XHR0YXJnZXQudmFsdWUgPSAnJCcgKyBpbnB1dDtcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHR0YXJnZXQudmFsdWUgPSAnJztcclxuXHR9XHJcbn1cclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0W3R5cGU9XCJ0ZWxcIl0nKS5mb3JFYWNoKHRlbElucHV0ID0+IHtcclxuXHR0ZWxJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJyxlbmZvcmNlTnVtZXJpY0Zvcm1hdCk7XHJcblx0dGVsSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLGZvcm1hdFRvUGhvbmUpO1xyXG59KSJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==