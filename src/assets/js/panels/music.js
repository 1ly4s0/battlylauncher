'use strict';

const { ipcRenderer } = require('electron');
import { database, changePanel, addAccount, accountSelect, logger } from '../utils.js';
const { StringLoader } = require("./assets/js/utils/stringLoader.js");
const Swal = require('./assets/js/libs/sweetalert/sweetalert2.all.min.js');
const fs = require('fs');
const path = require('path');
let versionChecked = false;
let updateCheckedThisSession = false;

const dataDirectory = path.join(
  process.env.APPDATA ||
  (process.platform === 'darwin'
    ? path.join(process.env.HOME, "Library", "Application Support")
    : process.env.HOME),
  ".battly"
);

const { getValue, setValue } = require('./assets/js/utils/storage');

import { Alert } from "../utils/alert.js";
import { AskModal } from '../utils/askModal.js';
const modal = new AskModal();

const { getMusicAPIURL } = require('./assets/js/utils/music/config.js');
const {
  YTDLP_PATH,
  getBestAudioURLFromYtDlp,
  fileExists
} = require('./assets/js/utils/music/ytdlp');
const { runIdle } = require('./assets/js/utils/music/ui');
const { checkAndUpdateYtDlpWithUI } = require('./assets/js/utils/music/updater');
const {
  fetchLikedSongs,
  toggleLikeSong,
  createPlaylist,
  updatePlaylistSongs,
  getPlaylist,
  loadPlaylists
} = require('./assets/js/utils/music/api');
const {
  searchYouTube,
  getVideoInfo,
  getYouTubePlaylistDetails,
  infoCache
} = require('./assets/js/utils/music/youtube');
const {
  initializeNavigationEvents,
  goToPanel
} = require('./assets/js/utils/music/navigation');

function getYouTubeThumbnail(videoId, quality = 'max') {
  const qualityMap = {
    'max': 'maxresdefault',
    'hq': 'hqdefault',
    'mq': 'mqdefault',
    'default': 'default'
  };

  const qualityStr = qualityMap[quality] || 'hqdefault';
  return `https://i.ytimg.com/vi/${videoId}/${qualityStr}.jpg`;
}

function handleThumbnailError(event, videoId) {
  const img = event.target;

  if (img.dataset.fallbackAttempted) {
    return;
  }

  img.dataset.fallbackAttempted = 'true';

  if (img.src.includes('maxresdefault')) {
    img.src = getYouTubeThumbnail(videoId, 'hq');
  }

  else if (img.src.includes('hqdefault')) {
    img.src = getYouTubeThumbnail(videoId, 'mq');
  }

  else if (img.src.includes('mqdefault')) {
    img.src = getYouTubeThumbnail(videoId, 'default');
  }
}

window.handleThumbnailError = handleThumbnailError;

async function getBestAvailableThumbnail(videoId) {

  return getYouTubeThumbnail(videoId, 'hq');
}

class Music {
  static id = "music";
  static instance = null;

  constructor() {
    if (Music.instance) {
      return Music.instance;
    }
    Music.instance = this;
    window.music = this;

    this.musicList = [];
    this.musicIndex = 1;
    this.isPlaying = false;
    this.currentPlaylist = null;
    this.currentQueue = [];
    this.currentSongIndex = -1;
    this.mainAudio = null;
    this.config = null;
    this.database = null;
    this.playlists = [];
    this.likedSongIds = new Set();

    this.panelHistory = [];
    this.historyIndex = -1;
  }

  updateNowPlaying(song) {

    const titleEl = document.querySelector(".b-music-playing-song-title");
    if (titleEl && song) {
      titleEl.style.height = "25px";
      titleEl.innerText = song.title;
    }

    const homeStatusEl = document.querySelector(".status-servers-playing-song-name");
    if (homeStatusEl) {
      if (song && song.title) {
        homeStatusEl.textContent = song.title;

        homeStatusEl.removeAttribute('data-string-id');
      } else {

        homeStatusEl.setAttribute('data-string-id', 'home.playingNowBody');
        if (window.stringLoader) {
          window.stringLoader.applyStrings();
        }
      }
    }
  }

  async init(config) {
    this.config = config;
    this.database = await new database().init();

    await window.ensureStringLoader();

    await this.load();

    window.stringLoader.applyStrings();

    this.setupPlaylists();
    this.loadPlaylists().then(userLists => {
      const map = new Map(this.playlists.map(p => [p._id, p]));
      userLists.forEach(pl => map.set(pl._id, pl));
      this.playlists = [...map.values()];
    });
    await this.refreshPlaylistsGrid();
    initializeNavigationEvents(this);
    this.LoadHome();
    this.setupPlaylists();
    await this.fetchLikedSongs();
    this.renderLikedSongs();

    this.goToPanel('b-music-panel-inicio', true);

    this.setupSearch();
    this.initializeElements();
    this.initializeEvents();

    return this;
  }

  async LoadHome() {
    const API = getMusicAPIURL();
    try {
      const token = await this.database.getSelectedAccountToken();
      const headers = { "Authorization": `Bearer ${token}` };

      const { sections } = await fetch(`${API}/api/home`, { headers }).then(r => r.json());

      const inicioPanel = document.querySelector(".b-music-panel-inicio");
      if (!inicioPanel) return;

      let homeBox = inicioPanel.querySelector(".b-music-home-sections");
      if (!homeBox) {
        homeBox = document.createElement("div");
        homeBox.className = "b-music-home-sections";
        inicioPanel.appendChild(homeBox);
      }
      homeBox.innerHTML = "";

      for (const sec of sections) {
        if (sec.slug === 'recent') {
          let thiss = this;
          document.getElementById("music-btn").addEventListener("click", async () => {
            const { playlist } = await fetch(`${API}/api/home/recent`, { headers }).then(r => r.json());
            thiss.renderRecentRow(inicioPanel, playlist);

            if (!(await fileExists(YTDLP_PATH))) {
              await checkAndUpdateYtDlpWithUI();
              this._updateCheckedOnce = true;
            }

            if (!this._updateCheckedOnce) {
              this._updateCheckedOnce = true;
              checkAndUpdateYtDlpWithUI();
            }

          });
          continue;
        }

        const { playlist } = await fetch(`${API}${sec.endpoint}`, { headers }).then(r => r.json());

        this.playlists.push(playlist);

        const sectionEl = document.createElement("div");
        sectionEl.className = "b-music-section";
        sectionEl.innerHTML = `
        <div class="b-music-cards">
          <div class="b-music-playlist-card" data-playlist-id="${playlist._id}">
            <img alt="${playlist.name}">
            <p>${playlist.description || "Sin descripción"}</p>
          </div>
        </div>
      `;
        homeBox.appendChild(sectionEl);

        const img = sectionEl.querySelector("img");
        this.addImageSpinner(img);
        img.src = playlist.cover;
      }

      document.getElementById("b-music-back-btn").addEventListener("click", () => {
        changePanel("home");
      });

    } catch (err) {
      console.error("LoadHome ❌", err);
    }

    document.querySelector('[data-panel="b-music-panel-playlists"]').addEventListener('click', async () => {
      await this.refreshPlaylistsGrid();
    });
  };

  async fetchLikedSongs() {
    try {
      const token = await this.database.getSelectedAccountToken();
      const res = await fetch(`${getMusicAPIURL()}/api/user/likes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      this.likedSongIds = new Set(json.songs.map(s => s.id));
      this.likedSongs = json.songs;
    } catch (e) { console.error('likes', e); }
  }

  renderLikedSongs() {
    const box = document.getElementById('library-liked-list');
    if (!box) return;
    box.innerHTML = this.likedSongs?.map(song => `
      <div class="playlist-song-item" data-song-id="${song.id}">
        <img src="${song.thumbnail || 'path/to/default/cover.jpg'}" alt="${song.title}" class="song-thumbnail">
        <div class="song-info">
          <div class="song-title">${song.title}</div>
          <div class="song-artist">${song.artist || 'Desconocido'}</div>
        </div>
        <div class="b-music-song-actions">
          <button class="like-song-btn" data-video-id="${song.id}" data-title="${song.title}" data-author="${song.artist || 'Desconocido'}" data-img="${song.thumbnail || 'path/to/default/cover.jpg'}">
            <i class="fa-${this.likedSongIds.has(song.id) ? 'solid' : 'regular'} fa-heart"></i>
          </button>
          <button class="play-song-btn" data-video-id="${song.id}" data-title="${song.title}" data-author="${song.artist || 'Desconocido'}" data-img="${song.thumbnail || 'path/to/default/cover.jpg'}">
            <i class="fa-solid fa-play"></i>
          </button>
        </div>
      </div>
    `).join('') || '<p style="color:#b3b3b3">Aún no marcaste ningún like&nbsp;💔</p>'
    box.querySelectorAll('.playlist-song-item').forEach(div => {
      div.querySelector('.play-song-btn').onclick = () => this.playAudioFromVideoId(
        div.dataset.songId,
        div.querySelector('.song-title').textContent,
        div.querySelector('.song-artist').textContent,
        div.querySelector('.song-thumbnail').src,
        false,
        true
      );
    });
  }

  goToPanel(panelClass, addToHistory = true) {
    goToPanel(this, panelClass);
  }

  updateArrowButtons() {
    const backBtn = document.getElementById('arrow-back');
    const forwardBtn = document.getElementById('arrow-forward');
    if (backBtn) {
      backBtn.disabled = this.historyIndex <= 0;
      backBtn.style.opacity = backBtn.disabled ? 0.4 : 1;
    }
    if (forwardBtn) {
      forwardBtn.disabled = this.historyIndex >= this.panelHistory.length - 1;
      forwardBtn.style.opacity = forwardBtn.disabled ? 0.4 : 1;
    }
  }

  async toggleLike(videoId, title, artist, thumbnail, btnEl) {
    try {
      const liked = this.likedSongIds.has(videoId);
      const token = await this.database.getSelectedAccountToken();
      const url = `${getMusicAPIURL()}/api/user/likes/${videoId}`;

      const res = await fetch(url, {
        method: liked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: liked ? null : JSON.stringify({ title, artist, thumbnail })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      if (liked) this.likedSongIds.delete(videoId);
      else this.likedSongIds.add(videoId);

      if (btnEl) {
        btnEl.classList.toggle('is-active', !liked);
        const i = btnEl.querySelector('i');
        i.classList.toggle('fa-solid', !liked);
        i.classList.toggle('fa-regular', liked);
      }

      await this.fetchLikedSongs();
      this.renderLikedSongs();
    } catch (e) { console.error('toggleLike', e); }
  }

  addImageSpinner(img) {
    const container = img.parentElement;
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    const spinner = document.createElement('div');
    spinner.className = 'image-spinner';
    container.appendChild(spinner);

    if (img.complete && img.naturalWidth) {
      spinner.remove();
      return;
    }
    img.addEventListener('load', () => spinner.remove());
    img.addEventListener('error', () => spinner.remove());
  }

  async saveCurrentQueueAsPlaylist() {
    try {
      if (!this.musicList || this.musicList.length === 0) {
        throw new Error(await window.getString('music.youDontHaveSongsInYourPlaylist') || "No hay canciones para guardar");
      }

      const [savePlaylistTitle, playlistNamePlaceholder, playlistDescriptionPlaceholder, saveText, cancelText, playlistNameRequiredText] = await Promise.all([
        window.getString('music.savePlaylist'),
        window.getString('music.playlistName'),
        window.getString('music.playlistDescription'),
        window.getString('common.save'),
        window.getString('common.cancel'),
        window.getString('music.playlistNameRequired')
      ]);

      const { name, description } = await modal.ask({
        title: savePlaylistTitle || 'Guardar Playlist',
        html: `
        <input type="text" id="playlist-name" class="input" placeholder="${playlistNamePlaceholder || 'Nombre de la playlist'}">
        <textarea id="playlist-description" class="textarea" placeholder="${playlistDescriptionPlaceholder || 'Descripción (opcional)'}"></textarea>
      `,
        showCancelButton: true,
        confirmButtonText: saveText || 'Guardar',
        cancelButtonText: cancelText || 'Cancelar',
        acceptButtonType: "is-info",
        rejectButtonType: "is-danger",
        preConfirm: () => {
          const name = document.getElementById('playlist-name')?.value.trim();
          const description = document.getElementById('playlist-description')?.value.trim();

          if (!name) {
            throw new Error(playlistNameRequiredText || 'El nombre es requerido');
          }

          return { name, description };
        }
      });

      const songs = this.musicList.map(song => ({
        title: song.title,
        artist: song.artist,
        url: song.src,
        thumbnail: song.thumbnail,
        id: song.id,
      }));

      const newPlaylist = await this.createPlaylist(name, description, songs);

      new Alert().ShowAlert({
        title: await window.getString('music.playlistSaved') || '¡Playlist guardada!',
        text: await window.getString('music.playlistSavedSuccessfully') || 'La playlist se ha guardado correctamente',
        icon: 'success'
      });

      this.loadPlaylists().then(userLists => {
        const map = new Map(this.playlists.map(p => [p._id, p]));
        userLists.forEach(pl => map.set(pl._id, pl));
        this.playlists = [...map.values()];
      });

    } catch (error) {
      if (error !== "cancelled") {
        console.error('Error al guardar la playlist:', error);
        new Alert().ShowAlert({
          title: await window.getString('common.error') || 'Error',
          text: error.message || await window.getString('music.errorSavingPlaylist') || 'Error al guardar la playlist',
          icon: 'error'
        });
      }
    }
  }

  async initializeElements() {
    this.mainAudio = document.getElementById("main-audio");
    if (!this.mainAudio) {
      this.mainAudio = document.createElement("audio");
      this.mainAudio.id = "main-audio";
      document.body.appendChild(this.mainAudio);
    }

    this.mainAudio.addEventListener("pause", () => {
      this.pauseMusic();
      ipcRenderer.send("pause-song");
    });

    this.mainAudio.addEventListener("play", () => {
      if (this.isPlaying) return;
      this.playMusic();
      ipcRenderer.send("play-song");
    });

    this.wrapper = document.querySelector(".b-music-player-wrapper");
    if (this.wrapper) {
      this.mainAudio = this.wrapper.querySelector("#main-audio");
      if (this.mainAudio) {
        this.mainAudio.addEventListener("ended", () => {
          this.showQueue();
        });
        this.mainAudio.addEventListener("play", () => {
          this.showQueue();
        });
        this.mainAudio.addEventListener("pause", () => {
          this.showQueue();
        });
      }
    }

    const arrowBack = document.getElementById('arrow-back');
    const arrowForward = document.getElementById('arrow-forward');

    if (arrowBack) {
      arrowBack.addEventListener('click', () => {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          const panelClass = this.panelHistory[this.historyIndex];
          this.goToPanel(panelClass, false);
        }
      });
    }

    if (arrowForward) {
      arrowForward.addEventListener('click', () => {
        if (this.historyIndex < this.panelHistory.length - 1) {
          this.historyIndex++;
          const panelClass = this.panelHistory[this.historyIndex];
          this.goToPanel(panelClass, false);
        }
      });
    }

    this.mainAudio.volume = await getValue('musicVolume') / 100 || 0.5;

    const penguRange = document.getElementById('b-music-volumen');
    if (!penguRange) return;
    penguRange.value = (this.mainAudio.volume * 100).toString();
    const TURNS = 1.5;

    function updatePengu() {
      const v = Number(penguRange.value);
      const deg = (v / 100) * (360 * TURNS);
      penguRange.style.setProperty('--rot', deg + 'deg');
    }
    updatePengu();
    penguRange.addEventListener('input', updatePengu, { passive: true });
    penguRange.addEventListener('input', () => {
      const volume = Number(penguRange.value);
      this.mainAudio.volume = volume / 100;
    });
    penguRange.addEventListener('change', async () => {
      const volume = Number(penguRange.value);
      this.mainAudio.volume = volume / 100;
      await setValue('musicVolume', volume);
    });
  }

  initializeEvents() {
    const searchInput = document.getElementById("top-search");
    const searchButton = document.getElementById("b-music-reproducir-btn");
    const searchResults = document.querySelector(".b-music-search-results");

    if (searchInput && searchButton && searchResults) {
      const overlay = document.createElement('div');
      overlay.className = 'b-music-search-overlay';
      document.body.appendChild(overlay);

      searchResults.classList.remove('show');

      searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim()) {
          searchResults.classList.remove('hide');
          searchResults.classList.add('show');
          overlay.classList.add('active');
        }
      });

      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const query = searchInput.value.trim();
          if (query) {
            this.searchAndShowResults(query);
            searchResults.classList.remove('hide');
            searchResults.classList.add('show');
            overlay.classList.add('active');
          }
        }
      });

      searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query) {
          this.searchAndShowResults(query);
          searchResults.classList.remove('hide');
          searchResults.classList.add('show');
          overlay.classList.add('active');
        }
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) &&
          !searchResults.contains(e.target) &&
          !searchButton.contains(e.target)) {
          searchResults.classList.add('hide');
          searchResults.classList.remove('show');
          overlay.classList.remove('active');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchResults.classList.add('hide');
          searchResults.classList.remove('show');
          overlay.classList.remove('active');
        }
      });
    }

    if (this.mainAudio) {
      this.mainAudio.addEventListener("ended", () => {
        if (this.musicIndex < this.musicList.length) {
          this.musicIndex++;
          this.loadMusic(this.musicIndex);
          this.playMusic();
        }
      });

      this.mainAudio.addEventListener("error", async () => {
        console.log("Error al cargar el audio, reintentando desde YouTube con yt-dlp...");
        await this.retryLoadFromYoutube();
      });
    }

    document.addEventListener('click', e => {
      const btn = e.target.closest('.like-song-btn, .like-song');
      if (!btn) return;
      const { videoId, title, author, img } = btn.dataset;
      this.toggleLike(videoId, title, author, img, btn);
    });

    ipcRenderer.on("next-song", () => {
      if (this.musicIndex < this.musicList.length) {
        this.musicIndex++;
        this.loadMusic(this.musicIndex);
        this.playMusic();
      }
    });
    ipcRenderer.on("prev-song", () => {
      if (this.musicIndex > 1) {
        this.musicIndex--;
        this.loadMusic(this.musicIndex);
        this.playMusic();
      }
    });
  }

  extractVideoId(url) {
    const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  showBattlyPlusModal() {
    Swal.fire({
      title: '<span style="color: #FFD700; font-size: 24px; font-weight: 600;">Función de Battly+</span>',
      html: `
        <div style="text-align: center; padding: 15px 10px;">
          <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.9;">
            <i class="fa-brands fa-spotify" style="color: #1DB954;"></i>
          </div>
          <h3 style="color: #fff; margin-bottom: 12px; font-size: 20px; font-weight: 500;">Importar desde Spotify</h3>
          <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            Esta es una función <span style="color: #FFD700; font-weight: 600;">exclusiva</span> para miembros de <span style="color: #FFD700; font-weight: 600;">Battly+</span>
          </p>
          <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.15)); border: 1px solid rgba(255, 215, 0, 0.3); padding: 12px; border-radius: 8px; margin-top: 15px;">
            <p style="color: #FFD700; font-weight: 500; margin: 0; font-size: 13px;">
              ✨ Únete a Battly+ y desbloquea funciones premium
            </p>
          </div>
        </div>
      `,
      icon: null,
      background: 'rgba(15, 22, 35, 0.98)',
      showCancelButton: true,
      confirmButtonText: 'Obtener Battly+',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#FFD700',
      cancelButtonColor: 'rgba(255, 255, 255, 0.1)',
      customClass: {
        popup: 'battly-plus-modal',
        confirmButton: 'battly-plus-confirm-btn',
        cancelButton: 'battly-plus-cancel-btn'
      },
      backdrop: 'rgba(0, 0, 0, 0.7)'
    }).then((result) => {
      if (result.isConfirmed) {
        const os = require('os');
        const shell = require('electron').shell;
        if (os.platform() === 'win32') {
          shell.openExternal('https://battlylauncher.com/plus?utm_source=launcher&utm_medium=music_panel&utm_campaign=spotify_import');
        } else {
          window.open('https://battlylauncher.com/plus?utm_source=launcher&utm_medium=music_panel&utm_campaign=spotify_import', '_blank');
        }
      }
    });
  }

  async importFromSpotify() {

    if (!window.stringLoader) {
      window.stringLoader = new StringLoader();
      await window.stringLoader.loadStrings();
    }

    const inputModal = document.createElement("div");
    inputModal.classList.add("modal", "is-active");
    inputModal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card modal-animated">
        <section class="modal-card-body">
          <h1 class="title is-4" style="margin-bottom: 10px; color: #fff;" data-string-id="music.importSpotifyPlaylist">${window.stringLoader.getString("music.importSpotifyPlaylist")}</h1>
          <input id="spotify-url-input" class="input" type="text" placeholder="${window.stringLoader.getString("music.enterSpotifyPlaylistUrl")}" data-string-id="music.enterSpotifyPlaylistUrl">
          <br><br>
          <div style="gap: 5px; display: flex; justify-content: flex-end;">
            <button id="cancel-spotify-import" class="button is-danger is-outlined" data-string-id="common.cancel">${window.stringLoader.getString("common.cancel")}</button>
            <button id="confirm-spotify-import" class="button is-info is-outlined" data-string-id="common.import">${window.stringLoader.getString("common.import")}</button>
          </div>
        </section>
      </div>
    `;
    document.body.appendChild(inputModal);

    const url = await new Promise((resolve) => {
      inputModal.querySelector("#confirm-spotify-import").onclick = () => {
        const val = inputModal.querySelector("#spotify-url-input").value.trim();
        if (!val) {
          inputModal.querySelector("#spotify-url-input").classList.add("is-danger");
          return;
        }
        inputModal.remove();
        resolve(val);
      };
      inputModal.querySelector("#cancel-spotify-import").onclick = () => {
        inputModal.remove();
        resolve(null);
      };
    });

    if (!url) return;

    const baseURL = `https://battlylauncher.com`;
    const selectedAccountToken = await this.database.getSelectedAccountToken();

    const progressModal = document.createElement("div");
    progressModal.classList.add("modal", "is-active");
    progressModal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card modal-animated">
        <section class="modal-card-body downloading-mod-modal-card-body has-text-centered">
          <h1 class="h1-download-mod-title" data-string-id="common.converting">${window.stringLoader.getString("common.converting")}</h1>
          <br>
          <div class="loader"></div>
          <br>
          <progress class="progress is-info" value="0" max="100" id="spotify-progress-bar">0%</progress>
          <p id="spotify-progress-text" data-string-id="common.pleaseWait">${window.stringLoader.getString("common.pleaseWait")}</p>
        </section>
      </div>
    `;
    document.body.appendChild(progressModal);

    try {
      const res = await fetch(`${baseURL}/api/spotify/playlist-to-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${selectedAccountToken}`
        },
        body: JSON.stringify({ spotifyUrl: url })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al iniciar la conversión');
      }

      const task = await res.json();
      const progressBar = progressModal.querySelector("#spotify-progress-bar");
      const progressText = progressModal.querySelector("#spotify-progress-text");

      const youtubeUrls = await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${baseURL}/api/spotify/playlist-to-youtube/${task.taskId}`, {
              headers: { Authorization: `Bearer ${selectedAccountToken}` }
            });

            if (!statusRes.ok) throw new Error("Error al consultar el estado");

            const statusData = await statusRes.json();

            if (statusData.status === 'completed') {
              clearInterval(interval);
              resolve(statusData.youtubeUrls);
            } else if (statusData.status === 'pending') {
              if (typeof statusData.progress === 'number') {
                const start = parseFloat(progressBar.value);
                const end = statusData.progress;
                const duration = 5000;
                const startTime = performance.now();

                function animateProgress(now) {
                  const elapsed = now - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  const interpolated = start + (end - start) * progress;

                  progressBar.value = interpolated;
                  progressText.textContent = `${Math.round(interpolated)}%`;

                  if (progress < 1) {
                    requestAnimationFrame(animateProgress);
                  }
                }

                requestAnimationFrame(animateProgress);
              }

            } else {
              clearInterval(interval);
              reject(new Error("Estado de tarea inválido"));
            }
          } catch (err) {
            clearInterval(interval);
            reject(err);
          }
        }, 5000);
      });

      progressModal.remove();
      const importActionModal = document.createElement("div");
      importActionModal.classList.add("modal", "is-active");
      importActionModal.innerHTML = `
  <div class="modal-background"></div>
  <div class="modal-card modal-animated">
    <section class="modal-card-body has-text-centered">
      <h1 class="title is-4" style="color: #fff;" data-string-id="music.whatToDoWithSongs">${window.stringLoader.getString("music.whatToDoWithSongs")}</h1>
      <br>
      <div class="buttons is-centered">
        <button class="button is-primary" id="spotify-create-playlist" data-string-id="common.createPlaylist">${window.stringLoader.getString("common.createPlaylist")}</button>
        <button class="button is-link" id="spotify-add-to-queue" data-string-id="common.addToQueue">${window.stringLoader.getString("common.addToQueue")}</button>
      </div>
    </section>
  </div>
`;
      document.body.appendChild(importActionModal);

      importActionModal.querySelector("#spotify-create-playlist").onclick = async () => {
        importActionModal.remove();
        try {
          const { name } = await modal.ask({
            title: window.stringLoader.getString("common.createPlaylist"),
            html: `<input type="text" id="spotify-pl-name" class="input" placeholder="${window.stringLoader.getString("music.playlistName")}">`,
            showCancelButton: true,
            confirmButtonText: window.stringLoader.getString("common.create"),
            cancelButtonText: window.stringLoader.getString("common.cancel"),
            preConfirm: () => {
              const name = document.getElementById('spotify-pl-name')?.value.trim();
              if (!name) throw new Error(window.stringLoader.getString("common.playlistNameRequired"));
              return { name };
            }
          });

          const songs = youtubeUrls
            .filter(url => url && this.extractVideoId(url))
            .map(url => {
              const videoId = this.extractVideoId(url);
              return {
                id: videoId,
                title: window.stringLoader.getString("music.unknown"),
                artist: window.stringLoader.getString("music.unknown"),
                thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                url: url
              };
            });

          await this.createPlaylist(name, '', songs);
          new Alert().ShowAlert({
            title: window.stringLoader.getString("common.playlistSaved"),
            text: window.stringLoader.getString("common.playlistSavedSuccessfully"),
            icon: 'success'
          });

          await this.refreshPlaylistsGrid();
        } catch (err) {
          if (err !== 'cancelled') {
            console.error(err);
            new Alert().ShowAlert({
              title: window.stringLoader.getString("common.error"),
              text: err.message,
              icon: 'error'
            });
          }
        }
      };

      importActionModal.querySelector("#spotify-add-to-queue").onclick = async () => {
        importActionModal.remove();
        for (const url of youtubeUrls) {
          const videoId = this.extractVideoId(url);
          const title = window.stringLoader.getString("music.unknown");
          const artist = window.stringLoader.getString("music.unknown");
          const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

          try {
            await this.playAudioFromVideoId(videoId, title, artist, thumbnail, false, false);
          } catch (err) {
            console.error("Error al añadir canción a la cola:", err);
          }
        }

        new Alert().ShowAlert({
          title: window.stringLoader.getString("common.addedToQueue"),
          text: window.stringLoader.getString("common.songsAddedToQueue"),
          icon: 'success'
        });

        this.showQueue();
      };

    } catch (error) {
      console.error("Error al importar desde Spotify:", error);
      progressModal.remove();

      const errorModal = document.createElement("div");
      errorModal.classList.add("modal", "is-active");
      errorModal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card modal-animated">
          <section class="modal-card-body has-text-centered">
            <h1 class="title is-4" style="color: #fff;" data-string-id="music.importError">${window.stringLoader.getString("music.importError")}</h1>
            <p>${error.message || window.stringLoader.getString("common.errorImportingPlaylist")}</p>
            <br>
            <button class="button is-danger" id="close-error-modal" data-string-id="common.close">${window.stringLoader.getString("common.close")}</button>
          </section>
        </div>
      `;
      document.body.appendChild(errorModal);
      errorModal.querySelector("#close-error-modal").onclick = () => errorModal.remove();
    }
  }

  async importFromYouTube() {

    if (!window.stringLoader) {
      window.stringLoader = new StringLoader();
      await window.stringLoader.loadStrings();
    }

    const urlModal = document.createElement("div");
    urlModal.classList.add("modal", "is-active");
    urlModal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card modal-animated">
        <section class="modal-card-body">
          <h1 class="title is-4" style="margin-bottom:10px;color:#fff;" data-string-id="music.importYoutubePlaylist">
            ${window.stringLoader.getString("music.importYoutubePlaylist")}
          </h1>
          <input id="yt-url-input" class="input"
                 placeholder="${window.stringLoader.getString("music.enterYoutubePlaylistUrl")}" data-string-id="music.enterYoutubePlaylistUrl">
          <br><br>
          <div style="gap:5px;display:flex;justify-content:flex-end;">
            <button id="yt-url-cancel"  class="button is-danger is-outlined" data-string-id="common.cancel">
              ${window.stringLoader.getString("common.cancel")}
            </button>
            <button id="yt-url-confirm" class="button is-info is-outlined" data-string-id="common.import">
              ${window.stringLoader.getString("common.import")}
            </button>
          </div>
        </section>
      </div>`;
    document.body.appendChild(urlModal);

    const playlistUrl = await new Promise(res => {
      urlModal.querySelector("#yt-url-confirm").onclick = () => {
        const v = urlModal.querySelector("#yt-url-input").value.trim();
        if (!v) {
          urlModal.querySelector("#yt-url-input").classList.add("is-danger");
          return;
        }
        urlModal.remove();
        res(v);
      };
      urlModal.querySelector("#yt-url-cancel").onclick = () => {
        urlModal.remove();
        res(null);
      };
    });
    if (!playlistUrl) return;

    const progressModal = document.createElement("div");
    progressModal.classList.add("modal", "is-active");
    progressModal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card modal-animated">
        <section class="modal-card-body downloading-mod-modal-card-body has-text-centered">
          <h1 class="h1-download-mod-title" data-string-id="common.gettingSongs">
            ${window.stringLoader.getString("common.gettingSongs")}
          </h1>
          <br>
          <div class="loader"></div>
          <br>
          <progress id="yt-progress-bar" class="progress is-info" value="0" max="100">0%</progress>
          <p id="yt-progress-text" data-string-id="common.pleaseWait">${window.stringLoader.getString("common.pleaseWait")}</p>
        </section>
      </div>`;
    document.body.appendChild(progressModal);
    const bar = progressModal.querySelector("#yt-progress-bar");
    const label = progressModal.querySelector("#yt-progress-text");

    try {
      const playlistDetails = await getYouTubePlaylistDetails(playlistUrl);

      if (!playlistDetails.songs || !playlistDetails.songs.length) {
        throw new Error(window.stringLoader.getString("common.playlistEmpty"));
      }

      const total = playlistDetails.songs.length;
      const youtubeUrls = [];
      let done = 0;

      const animateTo = (from, to) => {
        const startTime = performance.now();
        const duration = 500;
        const step = now => {
          const p = Math.min((now - startTime) / duration, 1);
          const val = from + (to - from) * p;
          bar.value = val;
          label.textContent = `${Math.round(val)}%`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };

      for (const song of playlistDetails.songs) {
        const url = `https://www.youtube.com/watch?v=${song.id}`;
        youtubeUrls.push(url);

        done++;
        const percent = Math.round((done / total) * 100);
        animateTo(parseFloat(bar.value), percent);
        await new Promise(r => setTimeout(r, 5));
      }

      progressModal.remove();

      const actionModal = document.createElement("div");
      actionModal.classList.add("modal", "is-active");
      actionModal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card modal-animated">
          <section class="modal-card-body has-text-centered">
            <h1 class="title is-4" style="color:#fff;" data-string-id="music.whatToDoWithSongs">
              ${window.stringLoader.getString("music.whatToDoWithSongs")}
            </h1><br>
            <div class="buttons is-centered">
              <button id="yt-create-playlist" class="button is-primary" data-string-id="common.createPlaylist">
                ${window.stringLoader.getString("common.createPlaylist")}
              </button>
              <button id="yt-add-to-queue"  class="button is-link" data-string-id="common.addToQueue">
                ${window.stringLoader.getString("common.addToQueue")}
              </button>
            </div>
          </section>
        </div>`;
      document.body.appendChild(actionModal);

      actionModal.querySelector("#yt-create-playlist").onclick = async () => {
        actionModal.remove();
        try {
          const { name } = await modal.ask({
            title: window.stringLoader.getString("common.createPlaylist"),
            html: `<input id="yt-pl-name" class="input"
                          placeholder="${window.stringLoader.getString("music.playlistName")}"
                          value="${playlistDetails.title || ''}">`,
            confirmButtonText: window.stringLoader.getString("common.create"),
            cancelButtonText: window.stringLoader.getString("common.cancel"),
            showCancelButton: true,
            preConfirm: () => {
              const n = document.getElementById('yt-pl-name')?.value.trim();
              if (!n) throw new Error(window.stringLoader.getString("common.playlistNameRequired"));
              return { name: n };
            }
          });

          const songs = youtubeUrls
            .filter(u => u && this.extractVideoId(u))
            .map(u => {
              const id = this.extractVideoId(u);
              return {
                id,
                title: window.stringLoader.getString("music.unknown"),
                artist: window.stringLoader.getString("music.unknown"),
                thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
                url: u
              };
            });

          await this.createPlaylist(name, '', songs);
          new Alert().ShowAlert({
            icon: 'success',
            title: window.stringLoader.getString("common.playlistSaved"),
            text: window.stringLoader.getString("common.playlistSavedSuccessfully")
          });
          await this.refreshPlaylistsGrid();
        } catch (err) {
          if (err !== 'cancelled') {
            console.error(err);
            new Alert().ShowAlert({
              icon: 'error',
              title: window.stringLoader.getString("common.error"),
              text: err.message
            });
          }
        }
      };

      actionModal.querySelector("#yt-add-to-queue").onclick = async () => {
        actionModal.remove();
        for (const u of youtubeUrls) {
          const id = this.extractVideoId(u);
          if (!id) continue;
          const thumb = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
          try {
            await this.playAudioFromVideoId(id, window.stringLoader.getString("music.unknown"), window.stringLoader.getString("music.unknown"), thumb, false, false);
          } catch (e) { console.error('queue-add', e); }
        }
        new Alert().ShowAlert({
          icon: 'success',
          title: window.stringLoader.getString("common.addedToQueue"),
          text: window.stringLoader.getString("common.songsAddedToQueue")
        });
        this.showQueue();
      };

    } catch (err) {
      console.error("importFromYouTube error:");
      console.error(err);
      progressModal.remove();
      new Alert().ShowAlert({
        icon: 'error',
        title: await window.getString('music.importError') || 'Error al importar',
        text: err.message || 'Ocurrió un error al importar la playlist'
      });
    }
  }

  async load() {
    const thiss = this;
    if (!this.mainAudio) {
      await new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          resolve();
        }
      });
      this.initializeElements();
    }

    const navLinks = document.querySelectorAll('.b-music-nav div[data-panel]');
    navLinks.forEach((link) => {
      const targetPanel = link.getAttribute('data-panel');

      link.addEventListener('click', async (e) => {
        e.preventDefault();

        if (link.id === 'b-music-queue-panel-btn') {
          document.querySelector('.b-music-queue-panel')?.classList.add('active');
          return;
        } else if (link.id === 'b-music-import-spotify-btn') {

          const account = await thiss.database.getSelectedAccount();
          if (account && account.premium) {

            thiss.importFromSpotify();
          } else {

            thiss.showBattlyPlusModal();
          }
          return;
        } else if (link.id === 'b-music-import-youtube-btn') {
          thiss.importFromYouTube();
          return;
        }

        navLinks.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');

        this.goToPanel(targetPanel);
      });
    });

    const playlistCards = document.querySelectorAll('.b-music-playlist-card[data-panel="b-music-panel-playlist-view"]');
    playlistCards.forEach(card => {
      card.addEventListener('click', () => {
        panels.forEach(p => p.classList.remove('active'));
        const viewPanel = document.querySelector('.b-music-panel-playlist-view');
        if (viewPanel) viewPanel.classList.add('active');
      });
    });

    const carousel = document.getElementById('carousel');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (carousel && prevBtn && nextBtn) {
      let currentScroll = 0;
      const itemWidth = 180;

      prevBtn.addEventListener('click', () => {
        currentScroll -= itemWidth;
        if (currentScroll < 0) currentScroll = 0;
        carousel.style.transform = `translateX(-${currentScroll}px)`;
      });

      nextBtn.addEventListener('click', () => {
        currentScroll += itemWidth;
        carousel.style.transform = `translateX(-${currentScroll}px)`;
      });
    }

    if (this.musicList.length > 0) {
      this.musicIndex = Math.floor((Math.random() * this.musicList.length) + 1);
    } else {
      this.musicIndex = 1;
    }

    if (this.mainAudio) {
      this.mainAudio.volume = await getValue("volume") || 1;
    }

    const playlistContainer = document.getElementById("b-music-playlist");
    if (playlistContainer && window.Sortable) {
      new Sortable(playlistContainer, {
        animation: 250,
        ghostClass: 'b-music-seleccionado',
        chosenClass: 'b-music-seleccionado',
        onEnd: this.handleSortEnd.bind(this),
      });
    }

    const playStopBtn = document.querySelector(".b-music-play-stop");
    const prevSongBtn = document.getElementById("prev");
    const nextSongBtn = document.getElementById("next");

    if (playStopBtn) {
      playStopBtn.addEventListener("click", () => {
        if (!this.musicList.length) {
          return new Alert().ShowAlert({
            icon: 'warning',
            title: lang?.you_dont_have_songs_in_your_playlist || "No tienes canciones",
            text: lang?.add_songs_to_your_playlist || "Agrega canciones a tu playlist"
          });
        }
        if (this.mainAudio.paused) {
          this.playMusic();
          ipcRenderer.send('play-song');
        } else {
          this.pauseMusic();
          ipcRenderer.send('pause-song');
        }
      });
    }

    if (prevSongBtn) {
      prevSongBtn.addEventListener("click", () => {
        this.prevMusic();
      });
    }
    if (nextSongBtn) {
      nextSongBtn.addEventListener("click", () => {
        this.nextMusic();
      });
    }

    ipcRenderer.on('play-pause', () => {
      if (this.mainAudio.paused) {
        this.playMusic();
      } else {
        this.pauseMusic();
      }
    });

    ipcRenderer.on('next', () => {
      this.nextMusic();
    });

    ipcRenderer.on('prev', () => {
      this.prevMusic();
    });

    if (this.mainAudio) {
      this.mainAudio.addEventListener("timeupdate", (e) => {
        const currentTime = e.target.currentTime;
        const duration = e.target.duration;
        let progressWidth = 0;
        if (duration) {
          progressWidth = (currentTime / duration) * 100;
        }
        const progressBar = document.querySelector(".b-music-progress-bar");
        if (progressBar) {
          progressBar.style.width = `${progressWidth}%`;
        }

        const musicCurrentTime = document.querySelector(".b-music-current-time");
        const musicDuration = document.querySelector(".b-music-total-time");

        e.target.addEventListener("loadeddata", () => {
          if (!e.target.duration) return;
          let totalDuration = e.target.duration;
          let totalMin = Math.floor(totalDuration / 60);
          let totalSec = Math.floor(totalDuration % 60);
          if (totalSec < 10) totalSec = `0${totalSec}`;
          if (musicDuration) {
            musicDuration.innerText = `${totalMin}:${totalSec}`;
          }
        });

        let currentMin = Math.floor(currentTime / 60);
        let currentSec = Math.floor(currentTime % 60);
        if (currentSec < 10) currentSec = `0${currentSec}`;
        if (musicCurrentTime) {
          musicCurrentTime.innerText = `${currentMin}:${currentSec}`;
        }

        ipcRenderer.send('update-song-time', {
          currentTime: currentTime,
          duration: duration
        });
      });
    }

    const progressContainer = document.getElementById("music-panel-progress");
    if (progressContainer && this.mainAudio) {
      progressContainer.addEventListener("click", (e) => {
        const progressWidth = progressContainer.clientWidth;
        const clickedOffsetX = e.offsetX;
        const songDuration = this.mainAudio.duration;
        if (songDuration) {
          this.mainAudio.currentTime = (clickedOffsetX / progressWidth) * songDuration;
          this.playMusic();
        }
      });
    }

    if (this.mainAudio) {
      this.mainAudio.addEventListener("ended", () => {
        if (this.musicList.length > 1) {
          let randIndex;
          do {
            randIndex = Math.floor((Math.random() * this.musicList.length) + 1);
          } while (this.musicIndex === randIndex);
          this.musicIndex = randIndex;
          this.loadMusic(this.musicIndex);
          this.playMusic();
        } else {
          this.loadMusic(1);
          this.playMusic();
        }
      });
    }

    window.clicked = (index) => {
      this.selectSong(index);
    };
  }

  handleSortEnd(evt) {
    const oldIndex = evt.oldIndex;
    const newIndex = evt.newIndex;
    if (oldIndex === newIndex) return;

    const movedItem = this.musicList.splice(oldIndex, 1)[0];
    this.musicList.splice(newIndex, 0, movedItem);
    this.showQueue();
  }

  selectSong(index) {
    this.musicIndex = index;
    this.loadMusic(this.musicIndex);
    this.playMusic();
  }

  async setupPlaylists() {
    if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory);
    const battlyDir = path.join(dataDirectory, "battly");
    if (!fs.existsSync(battlyDir)) fs.mkdirSync(battlyDir);
    const launcherDir = path.join(battlyDir, "launcher");
    if (!fs.existsSync(launcherDir)) fs.mkdirSync(launcherDir);
    const musicDir = path.join(launcherDir, "music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir);

    const showPlaylistsBtn = document.getElementById("b-music-show-playlists");
    if (showPlaylistsBtn) {
      showPlaylistsBtn.addEventListener("click", async () => {
        const playlists = await this.loadPlaylists();
        const container = document.querySelector(".b-music-playlists-container");
        if (!container) return;
        container.innerHTML = "";

        for (const playlist of playlists) {
          const cardDiv = document.createElement("div");
          cardDiv.className = "b-music-playlist-card";
          cardDiv.dataset.playlistId = playlist._id;
          cardDiv.innerHTML = `
        <img alt="${playlist.name}">
        <p>${playlist.description || 'Sin descripción'}</p>
      `;
          container.appendChild(cardDiv);

          const img = cardDiv.querySelector("img");
          this.addImageSpinner(img);
          img.src = playlist.cover;
        }
      });
    }

    document.addEventListener('click', (e) => {
      const playlistCard = e.target.closest('.b-music-playlist-card');
      if (!playlistCard) return;

      const playlistId = playlistCard.getAttribute('data-playlist-id');
      if (!playlistId) return;

      const playlist = this.playlists?.find(p => p._id === playlistId);
      if (!playlist) {
        console.error('No se encontró la playlist con ID:', playlistId);
        return;
      }

      this.showPlaylistDetails(playlist);
    });
  }

  setupSearch() {
    const topSearchInput = document.getElementById("top-search");
    if (!topSearchInput) return;

    topSearchInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        const songName = topSearchInput.value.trim();
        if (songName) {
          await this.searchAndShowResults(songName);
        }
      }
    });

    const searchBtn = document.getElementById("b-music-reproducir-btn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const songName = topSearchInput.value.trim();
        if (songName) this.searchAndShowResults(songName);
      });
    }
  }

  async searchYouTube(query, maxResults = 12) {
    return await searchYouTube(query, maxResults);
  }

  async searchAndShowResults(query) {
    const resultsDiv = document.querySelector(".b-music-search-results");
    const overlay = document.querySelector(".b-music-search-overlay");
    const toggleButtonState = (
      loading = false,
      success = false,
      info = false,
      error = false
    ) => {
      const button = document.getElementById("b-music-reproducir-btn");
      if (!button) return;
      button.classList.remove("is-loading", "is-success", "is-info", "is-danger");
      if (loading) button.classList.add("is-loading");
      if (success) button.classList.add("is-success");
      if (info) button.classList.add("is-info");
      if (error) button.classList.add("is-danger");
      button.innerHTML = `<span class="icon"><i class="fa fa-search"></i></span>`;
    };

    try {
      toggleButtonState(true, false, false, false);
      const results = await this.searchYouTube(query);

      if (!results || results.length === 0) {
        toggleButtonState(false, false, false, true);
        resultsDiv.innerHTML = `
          <div class="notification is-warning">
            No se encontraron resultados para tu búsqueda.
          </div>
        `;
        if (overlay) overlay.classList.remove('active');
        return;
      }

      resultsDiv.classList.remove('show');

      let html = `
        <div class="search-results-header">
          <h3>Resultados de búsqueda</h3>
          <span class="search-results-count">${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}</span>
        </div>
        <div class="columns is-multiline">`;

      results.forEach((result) => {
        if (!result.snippet || !result.id) return;

        const title = result.snippet.title;
        const author = result.snippet.channelTitle || 'Desconocido';
        const thumbnail = result.snippet.thumbnails?.default?.url || 'path/to/default/thumbnail.jpg';
        const videoId = result.id.videoId;

        let type = "regular";
        if (this.likedSongIds.has(videoId)) {
          type = "solid";
        }

        html += `
          <div class="column is-one-third">
            <div class="b-music-cardd b-music-card">
              <div class="card-image b-music-card-image">
                <figure class="image">
                  <img data-src="${thumbnail}" alt="${title.slice(0, 30) + (result.snippet.title.length > 30 ? '...' : '') || 'Sin título'}">
                </figure>
              </div>
              <div class="card-content b-music-card-content">
                <div class="content">
                  <p class="title is-6">${title.slice(0, 30) + (result.snippet.title.length > 30 ? '...' : '') || 'Sin título'}</p>
                  <p class="subtitle is-7">${author}</p>
                </div>
              </div>
              <footer class="card-footer b-music-card-footer">
                <div class="song-actions">
                  <button class="button is-success action-btn play-now"
                          data-video-id="${videoId}"
                          data-title="${title}"
                          data-author="${author}"
                          data-img="${thumbnail}">
                    <span class="icon">
                      <i class="fa-solid fa-play"></i>
                    </span>
                  </button>
                  <button class="button is-primary action-btn add-to-queue"
                          data-video-id="${videoId}"
                          data-title="${title}"
                          data-author="${author}"
                          data-img="${thumbnail}">
                    <span class="icon">
                      <i class="fa-solid fa-plus"></i>
                    </span>
                  </button>
                  <button class="button is-info action-btn like-song" 
                          data-video-id="${videoId}"
                          data-title="${title}"
                          data-author="${author}"
                          data-img="${thumbnail}">
                    <span class="icon">
                      <i class="fa-${type} fa-heart"></i>
                    </span>
                  </button>
                </div>
              </footer>
            </div>
          </div>
        `;
      });
      html += '</div>';

      resultsDiv.innerHTML = html;

      resultsDiv.querySelectorAll('img[data-src]').forEach(img => {
        this.addImageSpinner(img);
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });

      requestAnimationFrame(() => {
        resultsDiv.classList.add('show');
      });

      document.querySelectorAll('.add-to-queue').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          document.querySelectorAll('.custom-context-menu').forEach(menu => menu.remove());
          const menu = document.createElement('div');
          menu.className = 'custom-context-menu';
          menu.style.position = 'absolute';
          menu.style.zIndex = 1000;
          const rect = button.getBoundingClientRect();
          menu.style.left = rect.left + window.scrollX + 'px';
          menu.style.top = rect.bottom + window.scrollY + 'px';
          menu.innerHTML = `
            <div class="context-option add-to-playlist">Añadir a playlist</div>
            <div class="context-option add-to-queue">Añadir a la cola</div>
          `;
          document.body.appendChild(menu);
          menu.querySelector('.add-to-playlist').addEventListener('click', async () => {
            menu.remove();
            if (window.music && window.music.addSongToPlaylist) {
              window.music.addSongToPlaylist({
                videoId: button.dataset.videoId,
                title: button.dataset.title,
                author: button.dataset.author,
                img: button.dataset.img
              });
            } else {
              alert('Funcionalidad de añadir a playlist no implementada.');
            }
          });
          menu.querySelector('.add-to-queue').addEventListener('click', async () => {
            menu.remove();
            button.classList.add("is-loading");
            try {
              await this.playAudioFromVideoId(button.dataset.videoId, button.dataset.title, button.dataset.author, button.dataset.img);
              button.classList.remove("is-loading");
              button.classList.add("is-success");
              button.innerHTML = '<span class="icon"><i class="fa-solid fa-check"></i></span>';
              setTimeout(() => {
                button.classList.remove("is-success");
                button.innerHTML = '<span class="icon"><i class="fa-solid fa-plus"></i></span>';
              }, 2000);
            } catch (error) {
              button.classList.remove("is-loading");
              button.classList.add("is-danger");
              button.innerHTML = '<span class="icon"><i class="fa-solid fa-xmark"></i></span>';
              setTimeout(() => {
                button.classList.remove("is-danger");
                button.innerHTML = '<span class="icon"><i class="fa-solid fa-plus"></i></span>';
              }, 2000);
            }
          });
          const closeMenu = (ev) => {
            if (!menu.contains(ev.target)) {
              menu.remove();
              document.removeEventListener('mousedown', closeMenu);
              const overlay = document.querySelector('.b-music-search-overlay');
              if (overlay) overlay.classList.remove('active');
            }
          };
          setTimeout(() => {
            document.addEventListener('mousedown', closeMenu);
          }, 0);
        });
      });

      document.querySelectorAll('.play-now').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          button.classList.add("is-loading");

          await this.playAudioFromVideoId(button.dataset.videoId, button.dataset.title, button.dataset.author, button.dataset.img, false, true);

          button.classList.remove("is-loading");
          button.classList.add("is-success");
          button.innerHTML = '<span class="icon"><i class="fa-solid fa-check"></i></span>';
          setTimeout(() => {
            button.classList.remove("is-success");
            button.innerHTML = '<span class="icon"><i class="fa-solid fa-play"></i></span>';
          })
        });
      });

      toggleButtonState(false, false, true, false);
    } catch (error) {
      console.log("Error al buscar en YouTube");
      console.error(error);
      const resultsDiv = document.querySelector(".b-music-search-results");
      toggleButtonState(false, false, false, true);
      resultsDiv.innerHTML = `
        <div class="notification is-danger">
          Ocurrió un error al buscar. Por favor, intenta de nuevo.
        </div>
      `;
      if (overlay) overlay.classList.remove('active');
    }
  }

  async loadMusic(index) {
    try {
      const song = this.musicList[index - 1];
      if (!song) return;

      this.updateNowPlaying(song);

      const authorEl = document.querySelector("#music-author");
      const imageEl = document.querySelector(".b-music-playing-song-image");

      if (authorEl) {
        if ((song.artist || '').length > 7) {
          authorEl.innerText = (song.artist || "").substring(0, 7) + "...";
        } else {
          authorEl.innerText = song.artist;
        }
      }
      if (imageEl) {
        imageEl.src = song.thumbnail;
      }

      if (this.mainAudio) {
        this.mainAudio.src = song.src;
        await setValue("songPlaying", JSON.stringify(song));
        ipcRenderer.send("set-song", song);
        const mi = document.getElementById("music-img");
        if (mi) mi.src = song.thumbnail;
        const pnb = document.getElementById("playing-now-body");
        if (pnb) pnb.innerText = song.title.substring(0, 30);
        this.showQueue();
      }
    } catch (error) {
      console.log("Error al cargar la música: " + error.message);
    }
  }

  async playMusic() {
    try {
      if (!this.musicList.length) return;
      if (this.mainAudio) {
        await this.mainAudio.play();
        const currentSong = this.musicList[this.musicIndex - 1];
        if (currentSong) {

          this.updateNowPlaying(currentSong);
        }
        const playStopBtn = document.querySelector(".b-music-play-stop");
        if (playStopBtn) {
          playStopBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }

        this.isPlaying = true;

        const token = await this.database.getSelectedAccountToken();
        fetch(`${getMusicAPIURL()}/api/v1/play/${currentSong.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token,
            },
          })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "ok") {
              console.log("Canción actualizada en la API");
            } else {
              console.log("Error al actualizar la canción en la API");
            }
          })
          .catch((error) => {
            console.log("Error al actualizar la canción en la API");
            console.error(error);
          });

        ipcRenderer.send("set-song", currentSong);
      }
    } catch (error) {
      console.log("Error al reproducir el audio");
      console.error(error);
      await this.retryLoadFromYoutube();
    }
  }

  pauseMusic() {
    if (!this.musicList.length) {
      new Alert().ShowAlert({
        icon: 'warning',
        title: lang?.you_dont_have_songs_in_your_playlist || "No tienes canciones",
        text: lang?.add_songs_to_your_playlist || "Agrega canciones a tu playlist"
      });
      return;
    }
    if (this.mainAudio) {
      this.mainAudio.pause();
      const playStopBtn = document.querySelector(".b-music-play-stop");
      if (playStopBtn) {
        playStopBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
      const currentSong = this.musicList[this.musicIndex - 1];
      if (currentSong) {

        this.updateNowPlaying(currentSong);
      }

      this.isPlaying = false;
    }
  }

  prevMusic() {
    if (!this.musicList.length) return;
    this.musicIndex--;
    if (this.musicIndex < 1) {
      this.musicIndex = this.musicList.length;
    }
    this.loadMusic(this.musicIndex);
    this.playMusic();
    this.showQueue();
  }

  nextMusic() {
    if (!this.musicList.length) return;
    this.musicIndex++;
    if (this.musicIndex > this.musicList.length) {
      this.musicIndex = 1;
    }
    this.loadMusic(this.musicIndex);
    this.playMusic();
    this.showQueue();
  }

  async retryLoadFromYoutube() {
    try {
      const currentSong = this.musicList[this.musicIndex - 1];
      if (!currentSong) return;
      const freshUrl = await getBestAudioURLFromYtDlp(currentSong.id);
      currentSong.src = freshUrl;
      if (this.musicIndex > 0) {
        this.loadMusic(this.musicIndex);
        await this.playMusic();
      }
    } catch (error) {
      console.log("Error al reintentar desde YouTube");
      console.error(error);
    }
  }

  async playAudioFromVideoId(videoId, title, artist, thumbnail, isFromPlaylist, playNow) {
    console.log(`Reproduciendo canción desde videoId: ${videoId}`);
    try {
      console.time('🎵 Obteniendo audio con yt-dlp (verificación)');
      if (!(await fileExists(YTDLP_PATH))) {
        await checkAndUpdateYtDlpWithUI();

      }
      console.timeEnd('🎵 Obteniendo audio con yt-dlp (verificación)');

      console.time('🎵 Obteniendo audio con yt-dlp (proceso)');
      const audioUrl = await getBestAudioURLFromYtDlp(videoId);
      console.timeEnd('🎵 Obteniendo audio con yt-dlp (proceso)');

      const song = {
        title,
        artist,
        thumbnail,
        src: audioUrl,
        id: videoId
      };

      this.musicList.push(song);

      if (!isFromPlaylist) {
        if (playNow) {
          this.musicIndex = this.musicList.length;
          this.loadMusic(this.musicIndex);
          this.playMusic();
        } else {
          this.showQueue();
        }
      } else {
        if (this.musicList.length === 1) {
          this.musicIndex = 1;
          this.loadMusic(this.musicIndex);
          this.playMusic();
        }
        this.showQueue();
      }

      return true;
    } catch (error) {
      console.error('Error al obtener audio con yt-dlp:', error);
      throw error;
    }
  }

  _normalizeSongForPlaylist(songInput) {
    if (!songInput) return null;
    if (songInput.id) {
      return {
        id: songInput.id,
        title: songInput.title || 'Desconocido',
        artist: songInput.artist || 'Desconocido',
        thumbnail: songInput.thumbnail || 'https://i.ytimg.com/vi/' + songInput.id + '/mqdefault.jpg',
        url: songInput.url || `https://www.youtube.com/watch?v=${songInput.id}`
      };
    }
    if (songInput.videoId) {
      return {
        id: songInput.videoId,
        title: songInput.title || 'Desconocido',
        artist: songInput.author || 'Desconocido',
        thumbnail: songInput.img || `https://i.ytimg.com/vi/${songInput.videoId}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${songInput.videoId}`
      };
    }
    return null;
  }

  async addSongToPlaylist(songInput, opts = {}) {
    const song = this._normalizeSongForPlaylist(songInput);
    if (!song) {
      return new Alert().ShowAlert({ icon: 'error', title: 'Error', text: 'Canción inválida.' });
    }

    const openCreatePlaylistMenu = async () => {
      try {
        const { name, desc } = await modal.ask({
          title: window.stringLoader.getString("common.createPlaylist"),
          html: `
          <div style="text-align:left">
            <label style="color:#fff;display:block;margin-bottom:6px;">
              ${window.stringLoader.getString("music.playlistName")}
            </label>
            <input id="new-pl-name" class="input" placeholder="${window.stringLoader.getString("music.name")}">
            <br><br>
            <label style="color:#fff;display:block;margin-bottom:6px;">
              ${window.stringLoader.getString("music.playlistDescription")}
            </label>
            <textarea id="new-pl-desc" class="textarea" placeholder="${window.stringLoader.getString("music.description")}"></textarea>
          </div>
        `,
          showCancelButton: true,
          confirmButtonText: window.stringLoader.getString("common.create"),
          cancelButtonText: window.stringLoader.getString("common.cancel"),
          acceptButtonType: "is-info",
          rejectButtonType: "is-danger",
          preConfirm: () => {
            const name = document.getElementById('new-pl-name')?.value.trim();
            const desc = document.getElementById('new-pl-desc')?.value.trim();
            if (!name) throw new Error(window.stringLoader.getString("common.playlistNameRequired"));
            return { name, desc };
          }
        });

        const created = await this.createPlaylist(name, desc || '', [song]);
        await this.refreshPlaylistsGrid();

        new Alert().ShowAlert({
          icon: 'success',
          title: await window.getString('music.playlistCreated') || '¡Playlist creada!',
          text: await window.getString('music.songAddedToNewPlaylist') || 'Se añadió la canción a tu nueva playlist.'
        });

        const pl = this.playlists.find(p => p._id === created._id) || created;
        if (pl) this.showPlaylistDetails(pl);

      } catch (e) {
        if (e !== 'cancelled') {
          console.error('create-new-playlist', e);
          new Alert().ShowAlert({ icon: 'error', title: await window.getString('common.error') || 'Error', text: e.message || await window.getString('music.couldNotCreatePlaylist') || 'No se pudo crear la playlist.' });
        }
      }
    };

    if (opts.createNew === true) {
      return openCreatePlaylistMenu();
    }

    const lists = await this.loadPlaylists();
    const optionsHtml = lists.map(pl => `<option value="${pl._id}">${pl.name}</option>`).join('');

    const [targetPlaylistLabel, createPlaylistText, addToPlaylistTitle, continueText, cancelText, selectPlaylistError] = await Promise.all([
      window.getString('music.targetPlaylist'),
      window.getString('music.createPlaylist'),
      window.getString('music.addToPlaylistSaved'),
      window.getString('common.continue'),
      window.getString('common.cancel'),
      window.getString('music.selectAPlaylist')
    ]);

    const html = `
    <div style="text-align:left">
      <label style="color:#fff;display:block;margin-bottom:6px;">${targetPlaylistLabel || 'Playlist de destino'}</label>
      <select id="target-playlist" class="input">
        ${optionsHtml}
        <option value="__new__">+ ${createPlaylistText || 'Crear nueva playlist'}</option>
      </select>
    </div>
  `;

    try {
      const res = await modal.ask({
        title: addToPlaylistTitle || 'Añadir a playlist',
        html,
        showCancelButton: true,
        confirmButtonText: continueText || 'Continuar',
        cancelButtonText: cancelText || 'Cancelar',
        preConfirm: () => {
          const target = document.getElementById('target-playlist')?.value;
          if (!target) throw new Error(selectPlaylistError || 'Selecciona una playlist.');
          return { target };
        }
      });

      if (res.target === '__new__') {
        return openCreatePlaylistMenu();
      }

      const playlistId = res.target;
      const pl = await this.getPlaylist(playlistId);

      const currentIds = Array.isArray(pl.songs) ? pl.songs.map(s => (typeof s === 'string' ? s : s.id)) : [];
      if (currentIds.includes(song.id)) {
        return new Alert().ShowAlert({
          icon: 'info',
          title: await window.getString('music.alreadyExists') || 'Ya existe',
          text: await window.getString('music.songAlreadyInPlaylist') || 'La canción ya estaba en esa playlist.'
        });
      }

      currentIds.push(song.id);
      await this.updatePlaylistSongs(playlistId, currentIds);
      await this.refreshPlaylistsGrid();

      new Alert().ShowAlert({
        icon: 'success',
        title: await window.getString('music.added') || 'Añadida',
        text: await window.getString('music.songAddedToPlaylist') || 'Canción añadida a la playlist.'
      });

    } catch (e) {
      if (e !== 'cancelled') {
        console.error('addSongToPlaylist', e);
        new Alert().ShowAlert({ icon: 'error', title: await window.getString('common.error') || 'Error', text: e.message || await window.getString('music.couldNotAddSong') || 'No se pudo añadir.' });
      }
    }
  }

  async showPlaylistDetails(playlist) {
    if (!playlist) return;

    this.goToPanel('b-music-panel-playlist-view');

    document.querySelectorAll('.b-music-panel').forEach(p => p.classList.remove('active'));
    const detailsPanel = document.querySelector('.b-music-panel-playlist-view');
    if (!detailsPanel) return;
    detailsPanel.classList.add('active');

    const titleEl = detailsPanel.querySelector('.playlist-title');
    const descriptionEl = detailsPanel.querySelector('.playlist-description');
    const coverEl = detailsPanel.querySelector('.playlist-cover');
    this.addImageSpinner(coverEl);
    if (titleEl) titleEl.textContent = playlist.name;
    if (descriptionEl) descriptionEl.textContent = playlist.description || 'Sin descripción';
    if (coverEl) coverEl.src = playlist.cover;

    const editBtn = detailsPanel.querySelector('#playlist-edit-btn');
    if (editBtn) {
      editBtn.onclick = async () => {
        try {
          const { name, desc } = await modal.ask({
            title: 'Editar playlist',
            html: `
            <p style="margin-bottom: 5px; color: #fff;">Nombre de la playlist</p>
            <input id="swal-pl-name" class="input" placeholder="Nombre" value="${playlist.name}">
            <br>
            <br>
            <p style="margin-bottom: 5px; color: #fff;">Descripción de la playlist</p>
            <textarea id="swal-pl-desc" class="textarea" placeholder="Descripción">${playlist.description || 'Sin descripción'}</textarea>
          `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => ({
              name: document.getElementById('swal-pl-name')?.value.trim(),
              desc: document.getElementById('swal-pl-desc')?.value.trim()
            })
          });

          const updated = await this.updatePlaylist(playlist._id, {
            name,
            description: desc
          });

          Object.assign(playlist, updated);
          titleEl.textContent = updated.name;
          descriptionEl.textContent = updated.description || 'Sin descripción';
          await this.refreshPlaylistsGrid();

          new Alert().ShowAlert({ title: '¡Actualizado!', text: '', icon: 'success' });
        } catch (err) {
          if (err !== 'cancelled') {
            console.error(err);
            new Alert().ShowAlert({ title: 'Error', text: err.message, icon: 'error' });
          }
        }
      };
    }

    const deleteBtn = detailsPanel.querySelector('#playlist-delete-btn');
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        try {
          await modal.ask({
            title: 'Eliminar playlist',
            text: '¿Seguro? Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => true
          });

          await this.deletePlaylist(playlist._id);
          this.playlists = this.playlists.filter(p => p._id !== playlist._id);
          detailsPanel.classList.remove('active');
          document.querySelector('.b-music-panel-playlists').classList.add('active');
          await this.refreshPlaylistsGrid();

          new Alert().ShowAlert({
            title: '¡Eliminada!',
            text: 'Playlist borrada correctamente',
            icon: 'success'
          });

        } catch (err) {
          if (err !== 'cancelled') {
            console.error(err);
            new Alert().ShowAlert({ title: 'Error', text: err.message, icon: 'error' });
          }
        }
      };
    }

    const songListEl = detailsPanel.querySelector('.playlist-songs');
    if (songListEl) {
      songListEl.innerHTML = '';
      playlist.songs.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'playlist-song-item';
        songItem.dataset.songId = song.id;
        songItem.dataset.songIndex = index;

        let type = this.likedSongIds.has(song.id) ? "solid" : "regular";

        songItem.innerHTML = `
        <img src="${song.thumbnail || 'path/to/default/cover.jpg'}"
             alt="${song.title}" class="song-thumbnail">
        <div class="song-info">
          <div class="song-title">${song.title}</div>
          <div class="song-artist">${song.artist || 'Desconocido'}</div>
        </div>
        <div class="b-music-song-actions">
          <button class="like-song-btn"
                  data-video-id="${song.id}"
                  data-title="${song.title}"
                  data-author="${song.artist || 'Desconocido'}"
                  data-img="${song.thumbnail || 'path/to/default/cover.jpg'}">
            <i class="fa-${type} fa-heart"></i>
          </button>
          <button class="play-song-btn" title="Reproducir">
            <i class="fa-solid fa-play"></i>
          </button>
          <button class="add-to-queue-btn" title="Añadir a la cola">
            <i class="fa-solid fa-plus"></i>
          </button>
          <button class="add-to-playlist-btn" title="Añadir a playlist (guardada)">
            <i class="fa-solid fa-list"></i>
          </button>
        </div>
      `;

        songItem.querySelector('.play-song-btn')
          .addEventListener('click', (e) => {
            e.stopPropagation();
            this.playPlaylist(playlist, index);
          });

        songItem.querySelector('.add-to-queue-btn')
          .addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
              await this.playAudioFromVideoId(
                song.id,
                song.title,
                song.artist || 'Desconocido',
                song.thumbnail || 'path/to/default/cover.jpg',
                false,
                false
              );
              new Alert().ShowAlert({
                icon: 'success',
                title: 'Añadida a la cola',
                text: `"${song.title}" se añadió a la cola de reproducción.`
              });
            } catch (err) {
              console.error('queue-add', err);
              new Alert().ShowAlert({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo añadir a la cola.'
              });
            }
          });

        songItem.querySelector('.add-to-playlist-btn')
          .addEventListener('click', (e) => {
            e.stopPropagation();
            this.addSongToPlaylist({
              id: song.id,
              title: song.title,
              artist: song.artist || 'Desconocido',
              thumbnail: song.thumbnail || 'path/to/default/cover.jpg',
              url: `https://www.youtube.com/watch?v=${song.id}`
            });
          });

        songListEl.appendChild(songItem);
      });

      if (!playlist.virtual && window.Sortable) {
        new Sortable(songListEl, {
          animation: 200,
          ghostClass: 'b-music-seleccionado',
          onEnd: async () => {
            const newOrder = [...songListEl.children].map(el => {
              return playlist.songs.find(s => s.id === el.dataset.songId);
            });

            try {
              await this.updatePlaylistSongs(
                playlist._id,
                newOrder.map(s => s.id)
              );
              playlist.songs = newOrder;

              new Alert().ShowAlert({ title: 'Orden guardado', text: '', icon: 'success' });
            } catch (err) {
              console.error('save-order', err);
              new Alert().ShowAlert({ title: 'Error', text: err.message, icon: 'error' });
            }
          }
        });
      }
    }
  }

  cleanYouTubeImageUrl(url) {
    if (!url) return null;
    if (url.includes('ytimg.com')) {
      return url.split('?')[0];
    }
    return url;
  }

  updateQueue(songs, startIndex = 0) {
    this.currentQueue = songs;
    this.currentSongIndex = startIndex;
    this.showQueue();
    const queuePanel = document.querySelector('.b-music-queue-panel');
    if (queuePanel && queuePanel.classList.contains('active')) {
      this.showQueue();
    }
  }

  showQueue() {
    const queueList = document.querySelector('.b-music-queue-list');
    if (!queueList) return;

    if (!this.musicList.length) {
      queueList.innerHTML = `
        <div class="b-music-queue-empty">
          <i class="fas fa-music"></i>
          <p>No hay canciones en la cola</p>
          <p>Añade canciones desde una playlist</p>
        </div>
      `;
      return;
    }

    queueList.innerHTML = this.musicList.map((song, index) => `
      <div class="b-music-queue-item ${index === this.musicIndex - 1 ? 'playing' : ''}"
           data-index="${index + 1}"
           onclick="clicked(${index + 1})">
        <img class="b-music-queue-item-img" src="${song.thumbnail}" alt="${song.title}">
        <div class="b-music-queue-item-info">
          <div class="b-music-queue-item-title">${song.title}</div>
          <div class="b-music-queue-item-artist">${song.artist || 'Desconocido'}</div>
        </div>
      </div>
    `).join('');
  }

  playSong(index) {
    if (index < 0 || index >= this.musicList.length) return;
    this.musicIndex = index + 1;
    const song = this.musicList[index];

    const playerInfo = document.querySelector('.b-music-player-info');
    if (playerInfo) {
      playerInfo.innerHTML = `
        <img src="${song.thumbnail}" alt="${song.title}" class="b-music-player-thumbnail">
        <div class="b-music-player-song-info">
          <span class="b-music-player-song-name">${song.title}</span>
          <span class="b-music-player-song-artist">${song.artist || 'Desconocido'}</span>
        </div>
      `;
    }
    this.showQueue();
  }

  async playPlaylist(playlist, startIndex = 0) {
    if (!playlist || !playlist.songs || !playlist.songs.length) {
      return;
    }

    this.currentPlaylist = playlist;

    if (this.mainAudio) {
      try {
        this.mainAudio.pause();
        this.mainAudio.currentTime = 0;
        this.mainAudio.src = '';
      } catch { }
    }
    this.musicList = [];
    this.musicIndex = 0;

    const ordered = [
      ...playlist.songs.slice(startIndex),
      ...playlist.songs.slice(0, startIndex)
    ];

    const first = ordered[0];
    try {
      await this.playAudioFromVideoId(first.id, first.title, first.artist || 'Desconocido', first.thumbnail, true, true);
    } catch (e) {
      console.error('Error al iniciar reproducción de la playlist:', e);
      new Alert().ShowAlert({ icon: 'error', title: 'Error', text: 'No se pudo iniciar la reproducción.' });
      return;
    }

    ordered.slice(1).forEach(s => {
      runIdle(() => this.playAudioFromVideoId(s.id, s.title, s.artist || 'Desconocido', s.thumbnail, true, false));
    });

    this.updateQueue(ordered, 0);
  }

  async createPlaylist(name, description = '', songs = [], cover = '') {
    return await createPlaylist(this.database, name, description, cover, songs);
  }

  async deletePlaylist(playlistId) {
    const token = await this.database.getSelectedAccountToken();
    const res = await fetch(`${getMusicAPIURL()}/api/user/playlist/${playlistId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`DELETE /playlist → ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Delete failed');
    return true;
  }

  async updatePlaylist(playlistId, { name, description, cover }) {
    try {
      const token = await this.database.getSelectedAccountToken();
      const response = await fetch(`${getMusicAPIURL()}/api/user/playlist/${playlistId}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          cover
        })
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar playlist: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al actualizar playlist');
      }

      return data.playlist;
    } catch (error) {
      console.error('Error al actualizar playlist:', error);
      throw error;
    }
  }

  async refreshPlaylistsGrid() {
    const userLists = await this.loadPlaylists();

    const map = new Map(this.playlists.map(p => [p._id, p]));
    userLists.forEach(pl => map.set(pl._id, pl));
    this.playlists = [...map.values()];

    const container = document.querySelector('.b-music-playlists-container');
    if (!container) return;
    container.innerHTML = '';

    userLists.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'b-music-playlist-card';
      card.dataset.playlistId = pl._id;
      card.innerHTML = `
      <img alt="${pl.name}">
      <p>${pl.description || 'Sin descripción'}</p>
    `;
      container.appendChild(card);

      const imgEl = card.querySelector('img');
      this.addImageSpinner(imgEl);
      imgEl.src = pl.cover;
    });
  }

  async updatePlaylistSongs(playlistId, songs) {
    return await updatePlaylistSongs(this.database, playlistId, songs);
  }

  async getPlaylist(playlistId) {
    return await getPlaylist(this.database, playlistId);
  }

  async loadPlaylists() {
    return await loadPlaylists(this.database);
  }

  async renderRecentRow(container, playlist) {
    const row = document.querySelector(".b-music-recent-row");
    row.innerHTML = '';

    for (const song of playlist.songs) {
      const card = document.createElement('div');
      card.className = 'b-music-recent-item';

      const img = document.createElement('img');
      img.alt = song.title;
      img.style.opacity = '0.5';

      const bestThumbnail = await getBestAvailableThumbnail(song.id);
      img.src = bestThumbnail;
      img.style.opacity = '1';

      img.addEventListener('error', (e) => handleThumbnailError(e, song.id));

      const span = document.createElement('span');
      span.textContent = song.title;

      card.appendChild(img);
      card.appendChild(span);

      card.addEventListener('click', () => {
        console.log("Reproduciendo canción reciente:");
        console.log(`ID: ${song.id}, Título: ${song.title}, Artista: ${song.artist}`);

        const thumbnail = bestThumbnail;
        window.music.playAudioFromVideoId(
          song.id, song.title, song.artist, thumbnail, false, true);
      });
      row.appendChild(card);
    }
  }
}

export default Music;