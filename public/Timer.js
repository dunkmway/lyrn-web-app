class Timer {
  /**
   * Create timer object that will update every second and show the results on attached dom elements.
   * Precision is set to 1 second
   * @param {Date} date date obejct when the timer will expire
   * @param {CallableFunction} callback callback function to be called when the timer expires
   * @param {...any} args rest used for arguments for callback
   */
  constructor(date, callback = () => {}, ...args) {
    this.date = date;
    this.callback = () => callback(...args);
    this.time = this.date.getTime() - new Date().getTime();

    this.elements = [];

    this.interval = setInterval(() => {
      this.update()
    }, 500);

    // the largest a timeout can run for (signed 32 bit max)
    this.timeout = setTimeout(() => {
      this.finish()
    }, this.time > 2147483647 ? 2147483647 : this.time);
  }

  /**
   * update the timer's time then show
   */
  update() {
    this.time = this.date.getTime() - new Date().getTime();
    this.show();
  }

  /**
   * loop through all attached elements and show the time in the format mm:ss in their text content
   */
  show() {
    const minutes = Math.floor((this.time) % (1000 * 60 * 60) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((this.time) % (1000 * 60) / 1000).toString().padStart(2, '0');

    for (const element of this.elements) {
      element.textContent = `${minutes}:${seconds}`;
    }
  }

  /**
   * attach the timer to the given element so that it begins to receive updates
   * @param {HTMLElement} element an element which the timer will attach to
   */
  attach(element) {
    this.elements.push(element);
    this.show();
  }

  /**
   * detach the timer from the given element so that it no longer receives updates
   * @param {HTMLElement} element an element which the timer will detach from
   */
  detach(element) {
    const index = this.elements.indexOf(element);
    if (index === -1) return;
    this.elements[index].textContent = '';
    this.elements.splice(index, 1);
    this.show();
  }

  /**
   * stop the interval and timeout then detach all elements
   */
  cleanUp() {
    clearInterval(this.interval);
    clearTimeout(this.timeout);
    for (let i = this.elements.length - 1; i >= 0; i--) {
      this.detach(this.elements[i]);
    }
  }

  /**
   * call the given callback and stop the interval
   */
  finish() {
    // check to see if the timer should actually be finished
    // (we might have set the timer lower becuase of int overflow)
    if (this.time > 0) {
      // reset the timer
      this.timeout = setTimeout(() => {
        this.finish()
      }, this.time > 2147483647 ? 2147483647 : this.time);
    }
    else {
      this.callback()

      clearInterval(this.interval);
      this.time = 0;
      this.show()
    }
  }
}