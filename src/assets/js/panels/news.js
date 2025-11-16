'use strict';

import { logger, database, changePanel } from '../utils.js';

const { ipcRenderer } = require('electron');
const pkg = require('../package.json');
const { getValue, setValue } = require('./assets/js/utils/storage');
import { Alert } from "../utils/alert.js";
const { StringLoader } = require("./assets/js/utils/stringLoader.js");

const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);

class NewsPanel {
  static id = "news";

  constructor() {
    this.currentSlide = 0;
    this.totalSlides = 0;

    this.slides = [];
    this.isAnimating = false;
    this.database = null;
    this.accounts = [];
  }

  async init(config, news) {
    this.config = config;
    this.database = await new database().init();
    this.accounts = this.database.getAccounts();

    if (!window.stringLoader) {
      window.stringLoader = new StringLoader();
    }
    await window.stringLoader.loadStrings();

    console.log('NewsPanel init called - accounts:', this.accounts.length);

    const newsShown = await getValue('news_shown_v3.0');
    console.log('News shown status:', newsShown);

    if (newsShown) {
      console.log('News already shown, redirecting...');

      if (this.accounts.length === 0) {
        changePanel('login');
      } else {
        changePanel('home');
      }
      return;
    }

    console.log('Setting up news panel for first time viewing');

    setTimeout(() => {
      this.setupPanel();
    }, 200);
  }

  setupPanel() {

    this.slides = document.querySelectorAll('.news-slide');

    if (this.slides.length === 0) {
      console.error('No slides found!');

      setTimeout(() => {
        this.slides = document.querySelectorAll('.news-slide');
        if (this.slides.length > 0) {
          this.initializeSlides();
        }
      }, 300);
      return;
    }

    this.initializeSlides();
  }

  initializeSlides() {

    this.totalSlides = this.slides.length;
    console.log('Initializing slides - Total slides:', this.totalSlides);

    this.slides.forEach((slide, index) => {
      if (index === 0) {
        slide.style.display = 'block';
        slide.classList.add('active');
      } else {
        slide.style.display = 'none';
        slide.classList.remove('active');
      }
    });

    this.setupNavigationDots();

    this.setupButtons();

    this.setupKeyboardNavigation();

    this.updateProgressBar();
    this.updateNavigationDots();

    console.log('News panel initialized successfully with', this.slides.length, 'slides');
  }

  setupNavigationDots() {
    const navigation = document.getElementById('newsNavigation');
    if (!navigation) {
      console.error('Navigation container not found');
      return;
    }

    navigation.innerHTML = '';

    for (let i = 0; i < this.totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = 'news-nav-dot';
      if (i === 0) {
        dot.classList.add('active');
      }
      dot.dataset.slide = i;

      dot.addEventListener('click', () => {
        if (!this.isAnimating) {
          this.goToSlide(i);
        }
      });

      navigation.appendChild(dot);
    }
  }

  setupButtons() {

    const nextButtons = document.querySelectorAll('[data-next-slide]');
    nextButtons.forEach(btn => {

      btn.replaceWith(btn.cloneNode(true));
    });

    const newNextButtons = document.querySelectorAll('[data-next-slide]');
    newNextButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Next button clicked, current slide:', this.currentSlide);
        this.nextSlide();
      });
    });

    const prevButtons = document.querySelectorAll('[data-prev-slide]');
    prevButtons.forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });

    const newPrevButtons = document.querySelectorAll('[data-prev-slide]');
    newPrevButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Previous button clicked, current slide:', this.currentSlide);
        this.previousSlide();
      });
    });

    const finishBtn = document.getElementById('btnFinish');
    if (finishBtn) {
      const newFinishBtn = finishBtn.cloneNode(true);
      finishBtn.replaceWith(newFinishBtn);
      newFinishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Finish button clicked');
        this.finish();
      });
    }
  }

  setupKeyboardNavigation() {

    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }

    this.keyboardHandler = (e) => {
      if (this.isAnimating) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.previousSlide();
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  nextSlide() {
    console.log('nextSlide called - current:', this.currentSlide, 'total:', this.totalSlides, 'isAnimating:', this.isAnimating);
    if (this.currentSlide < this.totalSlides - 1) {
      this.goToSlide(this.currentSlide + 1);
    } else {
      console.log('Already at last slide');
    }
  }

  previousSlide() {
    console.log('previousSlide called - current:', this.currentSlide, 'isAnimating:', this.isAnimating);
    if (this.currentSlide > 0) {
      this.goToSlide(this.currentSlide - 1);
    } else {
      console.log('Already at first slide');
    }
  }

  goToSlide(index) {
    console.log('goToSlide called - from:', this.currentSlide, 'to:', index, 'isAnimating:', this.isAnimating);
    if (index === this.currentSlide || this.isAnimating) {
      console.log('Cannot go to slide - same slide or animating');
      return;
    }
    if (index < 0 || index >= this.totalSlides) {
      console.log('Cannot go to slide - index out of bounds');
      return;
    }

    this.showSlide(index, index > this.currentSlide);
  }

  showSlide(index, isForward = true) {
    console.log('showSlide - transitioning from', this.currentSlide, 'to', index);
    this.isAnimating = true;

    const currentSlideElement = this.slides[this.currentSlide];
    const nextSlideElement = this.slides[index];

    if (!nextSlideElement) {
      console.error('Next slide element not found at index:', index);
      this.isAnimating = false;
      return;
    }

    if (currentSlideElement) {
      currentSlideElement.classList.add('fade-out');
      currentSlideElement.classList.remove('active');
    }

    setTimeout(() => {

      if (currentSlideElement) {
        currentSlideElement.style.display = 'none';
        currentSlideElement.classList.remove('fade-out');
      }

      nextSlideElement.style.display = 'block';
      nextSlideElement.classList.add('fade-in', 'active');

      this.currentSlide = index;
      this.updateNavigationDots();
      this.updateProgressBar();

      const contentWrapper = document.querySelector('.news-content-wrapper');
      if (contentWrapper) {
        contentWrapper.scrollTop = 0;
      }

      setTimeout(() => {
        nextSlideElement.classList.remove('fade-in');
        this.isAnimating = false;
        console.log('Transition complete - now on slide', this.currentSlide);
      }, 400);
    }, 200);
  }

  updateNavigationDots() {
    const dots = document.querySelectorAll('.news-nav-dot');
    dots.forEach((dot, index) => {
      if (index === this.currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  updateProgressBar() {
    const progressBar = document.getElementById('newsProgressBar');
    if (progressBar) {
      const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  async finish() {

    let preload = document.querySelector(".preload-content");
    if (preload) {
      preload.style.display = "";
    }

    new Alert().ShowAlert({
      title: window.stringLoader.getString('news.finish.title'),
      text: window.stringLoader.getString('news.finish.text'),
      icon: 'success'
    });

    this.createImportantFile();

    setTimeout(async () => {
      console.log('Saving news_shown_v3.0 = true');
      await setValue('news_shown_v3.0', true);

      if (this.accounts.length === 0) {
        new Alert().ShowAlert({
          title: window.stringLoader.getString('news.welcome.title'),
          text: window.stringLoader.getString('news.welcome.text'),
          icon: 'info',
        });
        changePanel('login');
      } else {
        changePanel('home');
      }

      if (preload) {
        preload.style.display = "none";
      }
    }, 1500);
  }

  static async resetNewsStatus() {
    const { setValue } = require('./assets/js/utils/storage');
    await setValue('news_shown_v3.0', false);
    console.log('✅ News status reset - reload to see news again');
  }

  destroy() {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
    console.log('NewsPanel destroyed');
  }

  createImportantFile() {
    const fs = require('fs');
    const path = require('path');

    const importantText = window.stringLoader.getString('news.importantFile.content');

    try {

      if (!fs.existsSync(`${dataDirectory}/.battly`)) {
        fs.mkdirSync(path.join(`${dataDirectory}/.battly`), { recursive: true });
      }

      if (!fs.existsSync(`${dataDirectory}/.battly/battly`)) {
        fs.mkdirSync(path.join(`${dataDirectory}/.battly/battly`), { recursive: true });
      }

      if (!fs.existsSync(`${dataDirectory}/.battly/battly/mods-internos`)) {
        fs.mkdirSync(path.join(`${dataDirectory}/.battly/battly/mods-internos`), { recursive: true });
      }

      if (!fs.existsSync(`${dataDirectory}/.battly/battly/IMPORTANTE.txt`)) {
        fs.writeFileSync(
          path.join(`${dataDirectory}/.battly/battly`, 'IMPORTANTE.txt'),
          importantText,
          'utf8'
        );
      }

      console.log('✅ Important file created successfully');
    } catch (error) {
      console.error('❌ Error creating important file:', error);
    }
  }
}

export default NewsPanel;