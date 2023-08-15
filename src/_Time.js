export default class Time extends Date {
  constructor(...args) {
    super(...args);
  }

  /**
   * formats time into string according to formatting in curly braces
   * @param {string} str string format
   * @returns formatted time string
   */
  toFormat(str) {
    const parts = {
      ['S']: this.getMilliseconds().toString(),
      ['SSS']: this.getMilliseconds().toString().padStart(3, '0'),
      ['s']: this.getSeconds().toString(),
      ['ss']: this.getSeconds().toString().padStart(2, '0'),
      ['m']: this.getMinutes().toString(),
      ['mm']: this.getMinutes().toString().padStart(2, '0'),
      ['h']: (this.getHours() % 12 || 12).toString(),
      ['hh']: (this.getHours() % 12 || 12).toString().padStart(2, '0'),
      ['H']: this.getHours().toString(),
      ['HH']: this.getHours().toString().padStart(2, '0'),
      ['a']: this.getHours() < 12 ? 'am' : 'pm',
      ['A']: this.getHours() < 12 ? 'AM' : 'PM',
      ['d']: this.getDate().toString(),
      ['dd']: this.getDate().toString().padStart(2, '0'),
      ['ddd']: 
        this.getDate() === 1 ? this.getDate().toString() + 'st' :
        this.getDate() === 2 ? this.getDate().toString() + 'nd' :
        this.getDate() === 3 ? this.getDate().toString() + 'rd' :
        this.getDate() === 21 ? this.getDate().toString() + 'st' :
        this.getDate() === 22 ? this.getDate().toString() + 'nd' :
        this.getDate() === 23 ? this.getDate().toString() + 'rd' :
        this.getDate() === 31 ? this.getDate().toString() + 'st' :
        this.getDate().toString() + 'th',
      ['o']: this.getDayOfYear().toString(),
      ['ooo']: this.getDayOfYear().toString().padStart(3, '0'),
      ['E']: (this.getDay() % 7 || 7).toString(),
      ['EEE']: this.toLocaleString('default', { weekday: 'short' }),
      ['EEEE']: this.toLocaleString('default', { weekday: 'long' }),
      ['EEEEE']: this.toLocaleString('default', { weekday: 'narrow' }),
      ['W']: this.getWeek().toString(),
      ['WW']: this.getWeek().toString().padStart(2, '0'),
      ['M']: (this.getMonth() + 1).toString(),
      ['MM']: (this.getMonth() + 1).toString().padStart(2, '0'),
      ['MMM']: this.toLocaleString('default', { month: 'short' }),
      ['MMMM']: this.toLocaleString('default', { month: 'long' }),
      ['MMMMM']: this.toLocaleString('default', { month: 'narrow' }),
      ['y']: this.getFullYear().toString(),
      ['yy']: this.getFullYear().toString().slice(-2),
      ['yyyy']: this.getFullYear().toString().padStart(4, '0'),
    }

    // split the str into outside and inside the curly braces
    const split = str.split('{').flatMap(frontSplit => frontSplit.split('}'));

    // go through all of the odd elements and replace them with the appropriate part
    for (let i = 1; i < split.length; i += 2) {
      split[i] = parts[split[i]];
    }

    return split.join('');
  }

  /**
   * Returns the week number for this time.
   * @return {number}
   */
  getWeek() {
    var target = new Date(this.valueOf());
    var dayNr = (this.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    var firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() != 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / (1000 * 60 * 60 * 24 * 7));
  }

  /**
   * return the ordinal day of the year
   * @returns {number}
   */
  getDayOfYear() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / (1000 * 60 * 60 * 24));
  }
}