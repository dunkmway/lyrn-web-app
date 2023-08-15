class DropdownSearch extends HTMLElement {
    constructor() {
        super();

        /**
         * set this attribute to a function that will return the search results
         * results should be an array of objects with the properties "value" and "text"
         * @param {String} value the value of the input
         */
        this.onInput = (value) => { console.warn('DropdownSearch onInput not set.', this) };

        /**
         * set this attribute to a function that should be called when a result is clicked
         * @param {*} value the value of the result clicked
         */
        this.onChange = (value) => { console.warn('DropdownSearch onChange not set.', this) };

        /**
         * The minimum number of characters that need to be inputted before a query is submitted
         */
        this.minChars = 0;

        const shadow = this.attachShadow({ mode: "open" });
        const styles = document.createElement('link');
        styles.rel = "stylesheet";
        styles.href = "/components/dropdown-search.css"
        
        const wrapper = document.createElement('div');
        wrapper.id = 'wrapper';
        
        this.input = document.createElement('input');
        this.input.setAttribute('type', 'text');
        this.input.id = 'search';
        this.input.addEventListener('input', this.#debounce(() => this.#query()))
        wrapper.append(this.input);
        
        this.results = document.createElement('div');
        this.results.id = 'searchResults';
        wrapper.append(this.results);
        
        shadow.append(styles);
        shadow.append(wrapper);

        this.value = this.input.value;
        this.disabled = this.input.disabled;
    }

    get value() {
        return this.input.value;
    }

    set value(value) {
        this.input.value = value;
        this.#query();
    }

    get disabled() {
        return this.input.disabled;
    }

    set disabled(value) {
        this.input.disabled = value;
    }

    #debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    async #query() {
        while (this.results.firstChild) {
            this.results.removeChild(this.results.firstChild);
        }
        
        if (this.input.value.length < this.minChars) return;
        
        const results = await this.onInput(this.input.value);
        if (results && results.length) {
            results.forEach(result => this.#renderUserSearchResult(result.value, result.text))
        }
    }

    #renderUserSearchResult(value, text) {
        let result = document.createElement('div');
        result.classList.add('search-result');
        result.textContent = text;
        result.addEventListener('mousedown', () => {
            this.input.value = text;
            this.onChange(value)
        });
      
        this.results.appendChild(result);
    }
}

customElements.define("dropdown-search", DropdownSearch);