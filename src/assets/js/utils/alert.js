

/**
 * @author TECNO BROS
 
 */
"use strict";

let isAnimating = false;
let alertQueue = [];

class Alert {
  constructor() {}

  async ShowAlert(info) {
    if (isAnimating) {
      alertQueue.push(info);
      return;
    }

    alertQueue.push(info);
    await this.showNextAlert(info);
  }

  async showNextAlert(info) {
    if (alertQueue.length <= 0) {
      isAnimating = false;
      return;
    } else {
      const info2 = alertQueue.shift();
      isAnimating = true;
      await this.displayAlert(info2);
      await this.showNextAlert(info2);
      isAnimating = false;
    }
  }

  async displayAlert(info) {
    const { title, text, icon } = info;
    let errorIcon = './assets/images/icons/error.png';
    let successIcon = './assets/images/icons/success.png';
    let warningIcon = './assets/images/icons/warning.png';
    let infoIcon = './assets/images/icons/info.png';
    let sonido_inicio = new Audio('./assets/audios/alert.mp3');
    sonido_inicio.volume = 0.8;

    let errorColor = '#fa415b';
    let successColor = '#21c179';
    let warningColor = '#ffa500';
    let infoColor = '#2196f3';

    let icontype = '';
    let color = '';

    switch (icon) {
      case 'error':
        icontype = errorIcon;
        color = errorColor;
        break;
      case 'success':
        icontype = successIcon;
        color = successColor;
        break;
      case 'warning':
        icontype = warningIcon;
        color = warningColor;
        break;
      case 'info':
        icontype = infoIcon;
        color = infoColor;
        break;
      default:
        icontype = infoIcon;
        color = infoColor;
        break;
    }

    const panel = document.getElementById('alert-panel');
    const panelbig = document.getElementById('panelbig');
    const panelIcon = document.getElementById('alert-panel-icon');
    const panelText = document.getElementById('alert-panel-text');

    panelIcon.src = icontype;
    if (text == null || text == undefined || text == '') {
      panelText.innerHTML = `<strong>${title}</strong>`;
    } else {
      panelText.innerHTML = `<strong>${title}</strong><br>${text}`;
    }
    panel.style.backgroundColor = color;

    panelbig.classList.add('normal-zoom');
    sonido_inicio.play();

    await this.wait(200);

    panelbig.classList.add('big-zoom');
    await this.wait(200);

    panelbig.classList.remove('big-zoom');

    panel.classList.add('active-alert');
    await this.wait(3600);

    panel.classList.remove('active-alert');

    await this.wait(300);

    panelbig.classList.add('big-zoom');
    await this.wait(200);

    panelbig.classList.remove('big-zoom');
    panelbig.classList.remove('normal-zoom');

    isAnimating = false;
    await this.showNextAlert();
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
}

export { Alert };
