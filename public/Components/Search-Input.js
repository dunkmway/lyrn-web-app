/**
 * Input that is searchable on the fly.
 * Instead of passing in pre-existing options for a select,
 * SearchInput will accept a "getResults" function that can return the list of options to display after the user has inputted.
 * 
 * this element must have it's "getResults" property set by javascript.
 */

class SearchInput extends HTMLElement {
  constructor() {
    super();

    this.value = null;
    this.text = null;
    this.isDisabled = false;

    // used for debouncing the input events on the input
    function debounce(func, timeout = 300) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
      };
    }

    // set up the shadow root
    const shadow = this.attachShadow({ mode: 'closed' });
    
    // editable is the element the user will type in
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', true);
    editable.className = 'input';

    // it will listen for input events and debounce them
    // then will call the getResults function
    editable.addEventListener('input', debounce(async () => {
      editable.classList.add('loading');
      const results = await this.getResults(editable.textContent);
      this.#renderResults(results);
      editable.classList.remove('loading');
    }, 500));

    // we also listen for focus out to return the input to the saved state
    editable.addEventListener('focusout', async() => {
      editable.textContent = this.text ?? '';
      editable.classList.add('loading');
      const results = await this.getResults(editable.textContent);
      this.#renderResults(results);
      editable.classList.remove('loading');
    })

    // set up the results wrapper
    const results = document.createElement('div');
    results.className = 'result-wrapper';

    // some style
    const style = document.createElement('style');
    style.textContent = SEARCH_INPUT_STYLE;

    // append to the shadow
    shadow.append(editable, results, style);

    // save these elements to be accessed by the class later.
    this.editable = editable;
    this.results = results;
  }

  // this get results function should be overwritten in javascript
  // here is just a default function reminding the developer to do so
  async getResults() {
    throw 'No "getResults" callback set. Set a function that takes a string (the current text of the element) and returns [{ value: Any, text: String }].'
  }

  /**
   * @typedef {Object} Result
   * @property {string} text text to be displayed in the result
   * @property {any} value value associated with the result
   */

  /**
   * 
   * @param {Result[]} results array of the results to be rendered
   */
  #renderResults(results) {
    // remove all of the old results
    while (this.results.firstChild) {
      this.results.removeChild(this.results.firstChild)
    }

    // render the new results
    results.forEach(result => {
      const {text, value} = result;
      const container = document.createElement('div');
      // each result will have a mousedown event to select the result
      container.addEventListener('mousedown', () => {
        this.value = value;
        this.text = text;
        this.editable.textContent = text;
        this.dispatchEvent(new Event('change'));
      })
      container.textContent = text;
      container.value = value;
      container.className = 'result';
      this.results.appendChild(container);
    })
  }


  /**
   * Programatically select a value from the search.
   * This will use the provided "getResults" function to search for the text paramater,
   * then match the result with the value paramater.
   * @param {string} text text to search for
   * @param {any} value value associated with that result
   */
  async select(text, value) {
    // query for the text
    this.editable.classList.add('loading');

    try {
      const results = await this.getResults(text);
      // try to find the value
      const foundResult = results.find(result => result.value === value);
      if (foundResult) {
        // if the value is found render it and set it's value and text
        this.#renderResults([foundResult]);
        this.value = foundResult.value;
        this.text = foundResult.text;
        this.editable.textContent = foundResult.text;
      }
    }
    catch (error) {
      console.log(error);
    }

    this.editable.classList.remove('loading');
  }

  /**
   * change the disbaled state of the input
   * @param {boolean} shouldDisable whether the input should be disabled
   */
  disable(shouldDisable) {
    this.editable.contentEditable = !shouldDisable;
    this.isDisabled = shouldDisable;
  }
  
}

customElements.define('search-input', SearchInput);

const SEARCH_INPUT_STYLE = `
*, *::before, *::after {
  box-sizing: border-box;
}

:host {
  display: inline-block;
  position: relative;
}

.input {
  display: block;
  padding: .5em 2em .5em 1em;
  border: 2px solid #F2F2F2;
  border-radius: 0.5em;
  width: 100%;
  position: relative;
  background-color: white;
}

.input[contenteditable='false'] {
  color: #7F7F7F;
  cursor: not-allowed;
}

.input::after {
  content: '';
  border: 3px solid transparent;
  border-top-color: #C0E7FD;
  border-radius: 50%;
  animation: spin 500ms linear infinite;
  display: none;
  width: 1.5em;
  height: 1.5em;
  position: absolute;
  right: .5em;
  top: .25em;
}

.input.loading::after {
  display: block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

:focus {
  outline: none;
  border: 2px solid #C0E7FD;
}

.result-wrapper {
  position: absolute;
  padding-top: calc(2em + 4px);
  top: 0;
  visibility: hidden;
  width: 100%;
  max-height: 10em;
  overflow-y: auto;
  border: 2px solid #F2F2F2;
  border-radius: 0.5em;
  background-color: white;
}

.input:focus {
  z-index: 2;
}

.input:focus + .result-wrapper:not(:empty) {
  visibility: visible;
  z-index: 1;
}

.result {
  width: 100%;
  cursor: pointer;
  padding: .5em 1em;
}

.result:hover {
  background-color: #F2F2F2;
}
`