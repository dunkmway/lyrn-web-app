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
  }

  /**
   * update the timer's time then show
   */
  update() {
    this.time = this.date.getTime() - new Date().getTime();
    if (this.time <= 0) {
      this.finish();
    } else {
      this.show();
    }
  }

  /**
   * loop through all attached elements and show the time in the format mm:ss in their text content
   */
  show() {
    const ms = this.time;
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const daysms = ms % (24 * 60 * 60 * 1000);
    const hours = Math.floor(daysms / (60 * 60 * 1000));
    const hoursms = ms % (60 * 60 * 1000);
    const minutes = Math.floor(hoursms / (60 * 1000));
    const minutesms = ms % (60 * 1000);
    const seconds = Math.floor(minutesms / 1000);

    for (const element of this.elements) {
      if (days) {
        element.textContent = `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else if (hours) {
        element.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        element.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
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
    for (let i = this.elements.length - 1; i >= 0; i--) {
      this.detach(this.elements[i]);
    }
  }

  /**
   * call the given callback and stop the interval
   */
  finish() {
    this.callback()

    clearInterval(this.interval);
    this.time = 0;
    this.show()
  }
}