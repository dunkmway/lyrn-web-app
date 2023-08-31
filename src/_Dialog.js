export default class Dialog {
  constructor(options) {
    // content
    this.message = options.message ?? document.createElement('div');
    this.choices = options.choices ?? [];
    this.values = options.values ?? [];
    
    // transitions
    this.slideInDir = options.slideInDir ?? null;
    this.slideInDist = options.slideInDist ?? 100;
    this.slideInDuration = options.slideInDuration ?? 500;
    this.slideInTiming = options.slideInTiming ?? 'ease';

    this.slideOutDir = options.slideOutDir ?? null;
    this.slideOutDist = options.slideOutDist ?? 100;
    this.slideOutDuration = options.slideOutDuration ?? 500;
    this.slideOutTiming = options.slideOutTiming ?? 'ease';

    this.fadeIn = options.fadeIn ?? null;
    this.fadeInDuration = options.fadeInDuration ?? 500;
    this.fadeInTiming = options.fadeInTiming ?? 'ease';

    this.fadeOut = options.fadeOut ?? null;
    this.fadeOutDuration = options.fadeOutDuration ?? 500;
    this.fadeOutTiming = options.fadeOutTiming ?? 'ease';

    // container
    this.container = document.createElement('div');
    this.blocking = options.blocking ?? true;
    this.windowBackgroundColor = options.windowBackgroundColor ?? (this.blocking ? 'rgb(0, 0, 0, 0.5)' : 'transparent');
    this.windowPadding = options.windowPadding ?? '2em';
    this.hideOnWindow = options.hideOnWindow ?? this.blocking;

    // wrapper
    this.wrapper = document.createElement('div');
    this.width = options.width ?? 'auto';
    this.justify = options.justify ?? 'center';
    this.align = options.align ?? 'center';
    this.backgroundColor = options.backgroundColor ?? '#FFFFFF';
    this.messageColor = options.messageColor ?? '#5B5B5B';
    this.messageFontSize = options.messageFontSize ?? 'inherit';
    this.messageFontWeight = options.messageFontWeight ?? 'inherit';
    this.choiceColor = options.choiceColor ?? '#057AFB';
    this.choiceFontSize = options.choiceFontSize ?? 'inherit';
    this.choiceFontWeight = options.choiceFontWeight ?? 'inherit';
    this.borderRadius = options.borderRadius ?? '0.5em';
    this.shadow = options.shadow ?? '0 0 10px 1px rgba(0, 0, 0, 0.3)';
    this.padding = options.padding ?? '1em 2em';
    this.choicesBorderTop = options.choicesBorderTop ?? '1px solid #D5D5D5';
    this.justifyChoices = options.justifyChoices ?? 'end';
    this.hideOnDialog = options.hideOnDialog ?? !this.blocking;

    // timeout
    this.timeout = options.timeout ?? null;
  }

  show() {
    return new Promise((resolve, reject) => {
      // clean up the wrapper
      while (this.wrapper.firstChild) {
        this.wrapper.removeChild(this.wrapper.firstChild);
      }

      // set up the container
      this.container.style.boxSizing = 'border-box';
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'row';
      this.container.style.justifyContent = this.justify;
      this.container.style.alignItems = this.align;
      this.container.style.position = 'fixed';
      this.container.style.top = 0;
      this.container.style.left = 0;
      this.container.style.zIndex = 9999;
      this.container.style.width = '100vw';
      this.container.style.height = '100vh';
      this.container.style.padding = this.windowPadding;
      this.container.style.backgroundColor = this.windowBackgroundColor;
      if (this.blocking) {
        this.container.style.pointerEvents = 'auto';

      }
      else {
        this.container.style.pointerEvents = 'none';
      }
      if (this.hideOnWindow) {
        // if the container is clicked and not the wrapper
        this.container.addEventListener('click', (e) => {
          if (e.target !== e.currentTarget) return;
          resolve(null);
          this.hide();
        })
      }

      // set up the wrapper
      this.wrapper.style.width = this.width;
      this.wrapper.style.maxHeight = '100%';
      this.wrapper.style.overflowY = 'auto';
      this.wrapper.style.backgroundColor = this.backgroundColor;
      this.wrapper.style.color = this.messageColor;
      this.wrapper.style.borderRadius = this.borderRadius;
      this.wrapper.style.boxShadow = this.shadow;
      this.wrapper.style.pointerEvents = 'auto';

      if (this.slideInDir) {
        switch (this.slideInDir) {
          case 'down':
            this.wrapper.style.transform = `translateY(-${this.slideInDist}px)`;
            break;
          case 'right':
            this.wrapper.style.transform = `translateX(-${this.slideInDist}px)`;
            break;
          case 'up':
            this.wrapper.style.transform = `translateY(${this.slideInDist}px)`;
            break;
          case 'left':
            this.wrapper.style.transform = `translateX(${this.slideInDist}px)`;
            break;
          default:
            this.wrapper.style.transform = 'transform(0px)';
        }
      }
      if (this.fadeIn) {
        this.wrapper.style.opacity = 0;
      }
      if (this.hideOnDialog) {
        // if the container is clicked and not the wrapper
        this.wrapper.addEventListener('click', () => {
          resolve(null);
          this.hide();
        })
      }
      this.container.appendChild(this.wrapper);
      

      // set up the message
      const wrapperTop = document.createElement('div');
      wrapperTop.style.padding = this.padding;
      if (typeof this.message === 'string') {
        wrapperTop.textContent = this.message;
        wrapperTop.style.fontSize = this.messageFontSize;
        wrapperTop.style.fontWeight = this.messageFontWeight;
      }
      else {
        wrapperTop.appendChild(this.message);
      }
      this.wrapper.appendChild(wrapperTop);

      // set up the choices
      if (this.choices.length > 0) {
        const wrapperBottom = document.createElement('div');
        wrapperBottom.style.padding = this.padding;
        wrapperBottom.style.borderTop = this.choicesBorderTop;
        wrapperBottom.style.display = 'flex';
        wrapperBottom.style.flexDirection = 'row';
        wrapperBottom.style.justifyContent = this.justifyChoices;

        this.choices.forEach((choice, index) => {
          let choiceElem;
          if (typeof choice === 'string') {
            choiceElem = document.createElement('p');
            choiceElem.style.margin = '0';
            choiceElem.textContent = choice;
            choiceElem.style.fontSize = this.choiceFontSize;
            choiceElem.style.fontWeight = this.choiceFontWeight;
          }
          else {
            choiceElem = choice;
          }
          
          if (this.justifyChoices === 'end') {
            choiceElem.style.paddingLeft = '1em';
          }
          if (this.justifyChoices === 'start') {
            choiceElem.style.paddingRight = '1em';
          }

          choiceElem.style.cursor = 'pointer';
          choiceElem.style.color = this.choiceColor;
          choiceElem.addEventListener('click', () => {
            resolve(this.values[index]);
            this.hide();
          })

          wrapperBottom.appendChild(choiceElem);
        })
        this.wrapper.appendChild(wrapperBottom);
      }

      // append the container to the document body
      document.body.appendChild(this.container);

      // apply the styles that will transition the element
      let transition = null;

      // if there is a slide in dir
      if (this.slideInDir) {
        // set up for the transition
        transition = `transform ${this.slideInDuration}ms ${this.slideInTiming}`;

        // request next paint so we can start the transition
        requestAnimationFrame(() => {
          this.wrapper.style.transform = 'translate(0px)';
        })
      }
      // if there is a fade in
      if (this.fadeIn) {
        // set up for the transition
        if (transition) {
          transition += `, opacity ${this.fadeInDuration}ms ${this.fadeInTiming}`;
        }
        else {
          transition = `, opacity ${this.fadeInDuration}ms ${this.fadeInTiming}`;
        }

        // request next paint so we can start the transition
        requestAnimationFrame(() => {
          this.wrapper.style.opacity = 1;
        })
      }

      // if a transition was set up, apply the style
      if (transition) {
        this.wrapper.style.transition = transition;
      }
      

      // hide and cleanup the dialog if time
      if (this.timeout) {
        setTimeout(() => {
          resolve(null);
          this.hide(); 
        }, this.timeout);
      }
    });
  }

  hide() {
    let transition = null;

    // if there is a slide out dir
    if (this.slideOutDir) {
      // set up for the transition
      transition = `transform ${this.slideOutDuration}ms ${this.slideOutTiming}`;

      // request next paint so we can start the transition
      requestAnimationFrame(() => {
        switch (this.slideOutDir) {
          case 'up':
            this.wrapper.style.transform = `translateY(-${this.slideOutDist}px)`;
            break;
          case 'right':
            this.wrapper.style.transform = `translateX(${this.slideOutDist}px)`;
            break;
          case 'down':
            this.wrapper.style.transform = `translateY(${this.slideOutDist}px)`;
            break;
          case 'left':
            this.wrapper.style.transform = `translateX(-${this.slideOutDist}px)`;
            break;
          default:
            this.wrapper.style.transform = 'transform(0px)';
        }
      })
    }

    // if there is a fade out
    if (this.fadeOut) {
      // set up for the transition
      if (transition) {
        transition += `, opacity ${this.fadeOutDuration}ms ${this.fadeOutTiming}`;
      }
      else {
        transition = `, opacity ${this.fadeOutDuration}ms ${this.fadeOutTiming}`;
      }

      // request next paint so we can start the transition
      requestAnimationFrame(() => {
        this.wrapper.style.opacity = 0;
      })
    }

    // if a transition was set up, apply the style
    if (transition) {
      this.wrapper.style.transition = transition;
    }

    // if there is an animation playing we need to wait for it to finish before removing the container
    if (this.slideOutDir || this.fadeOut) {
      setTimeout(() => { this.container.remove() }, Math.max(
        this.slideOutDir ? this.slideOutDuration : 0,
        this.fadeOut ? this.fadeOutDuration : 0
      ));
    }
    else {
      this.container.remove();
    }
  }






  static alert(message, options = {}) {
    return new Dialog({
      message,
      choices: ['Close'],
      values: [null],
      width: '400px',
      ...options
    }).show();
  }

  static confirm(message, options = {}) {
    return new Dialog({
      message,
      choices: ['Cancel', 'OK'],
      values: [false, true],
      width: '400px',
      ...options
    }).show();
  }

  static prompt(message, options = {}) {
    const wrapper = document.createElement('div');
    const input = document.createElement('textarea');
    input.style.display = 'block';
    input.style.width = '400px';
    input.style.marginTop = '1em';
    input.style.fontSize = '16px';
    wrapper.append(message, input);

    const dialog = new Dialog({
      message: wrapper,
      choices: ['Cancel', 'OK'],
      values: [null, () => input.value],
      width: 'auto',
      ...options
    })

    const inputPromise = new Promise((resolve, reject) => {
      input.addEventListener('keyup', (e) => {
        if (e.key == 'Enter' && (e.ctrlKey || e.metaKey)) {
          resolve(input.value);
          dialog.hide();
        }
      })
    })

    const dialogPromise = dialog.show()
    .then(res => res && res());

    return Promise.race([inputPromise, dialogPromise])
  }

  static toastMessage(message, options = {}) {
    return new Dialog({
      message,
      backgroundColor: '#61A1EA',
      messageColor: '#FFFFFF',
      messageFontSize: '14px',
      messageFontWeight: 700,
      blocking: false,
      justify: 'end',
      align: 'start',
      shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
      slideInDir: 'down',
      slideInDist: 150,
      slideOutDir: 'right',
      slideOutDist: 300,
      timeout: 5000,
      ...options
    }).show();
  }

  static toastError(message, options = {}) {
    return new Dialog({
      message,
      backgroundColor: '#E36868',
      messageColor: '#FFFFFF',
      messageFontSize: '14px',
      messageFontWeight: 700,
      blocking: false,
      justify: 'end',
      align: 'start',
      shadow: '0 0 10px 1px rgba(0, 0, 0, 0.2)',
      slideInDir: 'down',
      slideInDist: 150,
      slideOutDir: 'right',
      slideOutDist: 300,
      timeout: 5000,
      ...options
    }).show();
  }
}