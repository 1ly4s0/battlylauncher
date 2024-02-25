
'use strict';

const { ipcMain, ipcRenderer } = require('electron');
import { database, changePanel, addAccount, accountSelect } from '../utils.js';

const Swal = require('./assets/js/libs/sweetalert/sweetalert2.all.min');
const usetube = require('./assets/js/libs/youtube/usetube');

const ytdl = require('ytdl-core');

const dataDirectory = `${process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)}/.battly`
const fs = require('fs');

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 5000,
  timerProgressBar: false,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  },
});

let musicList_ = [];       
import { Lang } from "../utils/lang.js";
let lang;

class Music {
    static id = "music";
    async init(config) {
        this.config = config
      this.database = await new database().init();
      this.lang = await new Lang().GetLang();
      lang = this.lang;
      this.load();
      this.PlayLists();
  }
  
  async PlayLists() {
    if (!fs.existsSync(`${dataDirectory}`)) {
      fs.mkdirSync(`${dataDirectory}`);
    }

    if (!fs.existsSync(`${dataDirectory}/battly`)) {
      fs.mkdirSync(`${dataDirectory}/battly`);
    }

    if (!fs.existsSync(`${dataDirectory}/battly/launcher`)) {
      fs.mkdirSync(`${dataDirectory}/battly/launcher`);
    }

    if (!fs.existsSync(`${dataDirectory}/battly/launcher/music`)) {
      fs.mkdirSync(`${dataDirectory}/battly/launcher/music`);
    }

    if (!fs.existsSync(`${dataDirectory}/battly/launcher/music/playlists.json`)) {
      fs.writeFileSync(`${dataDirectory}/battly/launcher/music/playlists.json`, JSON.stringify([]));
    }

    document.getElementById("save-playlist").addEventListener("click", async () => {
      let playlistsFile = await fs.readFileSync(`${dataDirectory}/battly/launcher/music/playlists.json`, 'utf8');
      let playlists = JSON.parse(playlistsFile);

      if (musicList_.length === 0) return Toast.fire({
        icon: 'error',
        title: lang.you_dont_have_songs_in_your_playlist
      });

      // Crear el elemento div principal con la clase "modal is-active" y estilo z-index
      const modalDiv = document.createElement('div');
      modalDiv.className = 'modal is-active';
      modalDiv.style.zIndex = '4';

      // Crear el elemento div con la clase "modal-background" y agregarlo al div principal
      const modalBackgroundDiv = document.createElement('div');
      modalBackgroundDiv.className = 'modal-background';
      modalDiv.appendChild(modalBackgroundDiv);

      // Crear el elemento div con la clase "modal-card" y estilo de fondo y agregarlo al div principal
      const modalCardDiv = document.createElement('div');
      modalCardDiv.className = 'modal-card';
      modalCardDiv.style.backgroundColor = '#444444';
      modalDiv.appendChild(modalCardDiv);

      // Crear el elemento header con la clase "modal-card-head" y estilo de fondo y agregarlo al div modal-card
      const headerDiv = document.createElement('header');
      headerDiv.className = 'modal-card-head';
      headerDiv.style.backgroundColor = '#444444';
      modalCardDiv.appendChild(headerDiv);

      let modalCloseButton = document.createElement("button");
      modalCloseButton.classList.add("delete");
      modalCloseButton.setAttribute("aria-label", "close");

      // Crear el elemento p con la clase "modal-card-title", estilo de color y texto, y agregarlo al div header
      const titleP = document.createElement('p');
      titleP.className = 'modal-card-title';
      titleP.style.color = '#fff';
      titleP.textContent = lang.save_playlist_text;
      headerDiv.appendChild(titleP);
      headerDiv.appendChild(modalCloseButton);

      // Crear el elemento section con la clase "modal-card-body" y estilos de fondo y color, y agregarlo al div modal-card
      const bodySection = document.createElement('section');
      bodySection.className = 'modal-card-body';
      bodySection.style.backgroundColor = '#444444';
      bodySection.style.color = '#fff';
      modalCardDiv.appendChild(bodySection);

      // Crear el elemento p con el título de la playlist y agregarlo al div section
      const playlistTitleP = document.createElement('p');
      playlistTitleP.textContent = lang.playlist_name;
      bodySection.appendChild(playlistTitleP);

      // Crear el elemento input con la clase "input is-info" y agregarlo al div section
      const inputText = document.createElement('input');
      inputText.type = 'text';
      inputText.className = 'input is-info';
      bodySection.appendChild(inputText);

      // Crear el elemento footer con la clase "modal-card-foot" y estilo de fondo y agregarlo al div modal-card
      const footerDiv = document.createElement('footer');
      footerDiv.className = 'modal-card-foot';
      footerDiv.style.backgroundColor = '#444444';
      modalCardDiv.appendChild(footerDiv);

      // Crear el elemento button con la clase "button is-info" y texto "Guardar", y agregarlo al div footer
      const saveButton = document.createElement('button');
      saveButton.className = 'button is-info';
      saveButton.textContent = lang.save;
      footerDiv.appendChild(saveButton);

      saveButton.addEventListener('click', () => {
        const playlistName = inputText.value;

        if (playlistName.length < 0) return Toast.fire({
          icon: 'error',
          title: lang.you_need_to_set_a_playlist_name
        });

        for (let playlist in playlists) {
          if (playlist.name === playlistName) return Toast.fire({
            icon: 'error',
            title: lang.already_have_a_playlist_with_this_name
          });
        }

        let newPlaylist = {
          name: playlistName,
          songs: musicList_,
        }

        playlists.push(newPlaylist);

        fs.writeFileSync(`${dataDirectory}/battly/launcher/music/playlists.json`, JSON.stringify(playlists));

        modalDiv.remove();

        Toast.fire({
          icon: 'success',
          title: lang.playlist_saved_correctly
        });
      });

      modalCloseButton.addEventListener('click', () => {
        modalDiv.remove();
      });

      // Crear el elemento button con la clase "button is-danger" y texto "Cancelar", y agregarlo al div footer
      const cancelButton = document.createElement('button');
      cancelButton.className = 'button is-danger';
      cancelButton.textContent = lang.cancel;
      footerDiv.appendChild(cancelButton);
      
      cancelButton.addEventListener('click', () => {
        modalDiv.remove();
      });

      // Agregar el div principal al cuerpo del documento
      document.body.appendChild(modalDiv);
    });
  }

  async load() {

    document.getElementById("show-playlists").addEventListener("click", async () => {
      let playlistsFile = await fs.readFileSync(`${dataDirectory}/battly/launcher/music/playlists.json`, 'utf8');
      let playlists = JSON.parse(playlistsFile);
      // Crear el elemento div principal con la clase "modal is-active" y estilo z-index
      const modalDiv = document.createElement('div');
      modalDiv.className = 'modal is-active';
      modalDiv.style.zIndex = '4';

      // Crear el elemento div con la clase "modal-background" y agregarlo al div principal
      const modalBackgroundDiv = document.createElement('div');
      modalBackgroundDiv.className = 'modal-background';
      modalDiv.appendChild(modalBackgroundDiv);

      // Crear el elemento div con la clase "modal-card" y estilo de fondo y agregarlo al div principal
      const modalCardDiv = document.createElement('div');
      modalCardDiv.className = 'modal-card';
      modalCardDiv.style.backgroundColor = '#444444';
      modalDiv.appendChild(modalCardDiv);

      // Crear el elemento header con la clase "modal-card-head" y estilo de fondo y agregarlo al div modal-card
      const headerDiv = document.createElement('header');
      headerDiv.className = 'modal-card-head';
      headerDiv.style.backgroundColor = '#444444';
      modalCardDiv.appendChild(headerDiv);

      let modalCloseButton = document.createElement("button");
      modalCloseButton.classList.add("delete");
      modalCloseButton.setAttribute("aria-label", "close");

      modalCloseButton.addEventListener('click', () => {
        modalDiv.remove();
      });

      // Crear el elemento p con la clase "modal-card-title", estilo de color y texto, y agregarlo al div header
      const titleP = document.createElement('p');
      titleP.className = 'modal-card-title';
      titleP.style.color = '#fff';
      titleP.textContent = lang.saved_playlists;
      headerDiv.appendChild(titleP);
      headerDiv.appendChild(modalCloseButton);

      // Crear el elemento section con la clase "modal-card-body" y estilos de fondo y color, y agregarlo al div modal-card
      const bodySection = document.createElement('section');
      bodySection.className = 'modal-card-body';
      bodySection.style.backgroundColor = '#444444';
      bodySection.style.color = '#fff';
      modalCardDiv.appendChild(bodySection);

      // Crear el elemento p con el mensaje de bienvenida y agregarlo al div section
      const welcomeP = document.createElement('p');
      welcomeP.innerHTML = lang.welcome_to_the_new_playlists_system;
      bodySection.appendChild(welcomeP);

      for (let playlist of playlists) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        bodySection.appendChild(cardDiv);

        // Crear el elemento header con la clase "card-header is-flex" y agregarlo al div card
        const cardHeaderDiv = document.createElement('header');
        cardHeaderDiv.className = 'card-header is-flex';
        cardDiv.appendChild(cardHeaderDiv);

        // Crear el elemento p con la clase "card-header-title" y texto "Playlist 1", y agregarlo al div card-header
        const cardTitleP = document.createElement('p');
        cardTitleP.className = 'card-header-title';
        cardTitleP.textContent = playlist.name;
        cardHeaderDiv.appendChild(cardTitleP);

        // Crear el elemento div con la clase "buttons" y estilo de margen derecho, y agregarlo al div card-header
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'buttons';
        buttonsDiv.style.marginRight = '5px';
        cardHeaderDiv.appendChild(buttonsDiv);

        // Crear el elemento button con la clase "button is-info" y estilo de margen derecho, y agregarlo al div buttons
        const playButton = document.createElement('button');
        playButton.className = 'button is-info';
        playButton.style.marginRight = '0px';
        buttonsDiv.appendChild(playButton);

        playButton.addEventListener('click', async () => {
          musicList_ = playlist.songs;
          let newMusicList = [];

          // Crear el elemento modal
          const modal = document.createElement("div");
          modal.classList.add("modal", "is-active");
          modal.style.zIndex = "4";

          // Crear el fondo del modal
          const modalBackground = document.createElement("div");
          modalBackground.classList.add("modal-background");

          // Crear la tarjeta del modal
          const modalCard = document.createElement("div");
          modalCard.classList.add("modal-card");
          modalCard.style.backgroundColor = "#444444";
          modalCard.style.borderRadius = "5px";

          // Crear el cuerpo de la tarjeta del modal
          const modalCardBody = document.createElement("section");
          modalCardBody.classList.add("modal-card-body");
          modalCardBody.style.backgroundColor = "#444444";
          modalCardBody.style.textAlign = "center";

          // Crear la imagen
          const image = document.createElement("img");
          image.src = "./assets/images/icons/loading.gif";
          image.style.width = "70px";
          image.style.height = "70px";
          image.style.margin = "0 auto";
          image.alt = "";

          // Crear el párrafo
          const paragraph = document.createElement("p");
          paragraph.style.color = "#fff";
          paragraph.style.fontSize = "20px";
          paragraph.innerText = lang.getting_songs;

          // Agregar la imagen y el párrafo al cuerpo de la tarjeta del modal
          modalCardBody.appendChild(image);
          modalCardBody.appendChild(paragraph);

          // Agregar el cuerpo de la tarjeta al modal
          modalCard.appendChild(modalCardBody);

          // Agregar el fondo del modal y la tarjeta del modal al modal
          modal.appendChild(modalBackground);
          modal.appendChild(modalCard);

          // Agregar el modal al documento body
          document.body.appendChild(modal);

          modalDiv.remove();

          for (let song of playlist.songs) {
            paragraph.innerText = `${lang.getting} ${song.name} (${newMusicList.length}/${playlist.songs.length})`;
            await ytdl.getInfo(song.url, { quality: 'highestaudio' })
              .then(info => {
                const audioFormat = info.formats.find(format => format.mimeType.includes('audio/mp4'));
      
                if (!audioFormat) {
                  console.error("No se encontró un formato de audio adecuado");
                  return;
                }
      
                const audioUrl = audioFormat.url;

                newMusicList.push({
                  url: song.url,
                  name: song.name,
                  author: song.author,
                  img: song.img,
                  audio: audioUrl,
                  duration: song.duration
                });

                

                const resultsDiv = document.getElementById("playlist");
                let i = 1;

                if (newMusicList.length === playlist.songs.length) {
                  clicked(1);
                  musicList_ = newMusicList;

                  document.getElementById("playlist").innerHTML = "";
  
                  // Mapear el array original para mantener el orden
                  const orderedMusicList = playlist.songs.map((song, index) => {
                    const music = musicList_.find(item => item.name === song.name);
                    return { ...music, index }; // Añadir el índice al objeto si es necesario
                  });

                  for (let music of orderedMusicList) {
                    paragraph.innerText = `${lang.loading} ${music.name} (${i}/${orderedMusicList.length})`;
                    i++;

                    const cardDiv = document.createElement("div");
                    cardDiv.classList.add("card");
                    cardDiv.classList.add("cards");
                    cardDiv.setAttribute("data-id", i + 1);

                    const img = document.createElement("img");
                    img.src = music.img;
                    img.alt = lang.thumbnail;
                    img.classList.add("thumbnail");
                    cardDiv.appendChild(img);

                    const cardContentDiv = document.createElement("div");
                    cardContentDiv.classList.add("card-content");
                    cardContentDiv.classList.add("card-content1");

                    const songTitleDiv = document.createElement("div");
                    songTitleDiv.classList.add("song-title");
                    songTitleDiv.innerText = music.name;
                    cardContentDiv.appendChild(songTitleDiv);

                    const artistDiv = document.createElement("div");
                    artistDiv.classList.add("artist");
                    artistDiv.innerText = music.author;
                    cardContentDiv.appendChild(artistDiv);

                    const button = document.createElement("button");
                    button.classList.add("delete-button");
                    button.classList.add("button");
                    button.classList.add("is-danger");
                    button.innerText = lang.delete;

                    button.addEventListener("click", async () => {
                      button.disabled = true;
                      button.classList.add("is-loading");
                      const index = orderedMusicList.indexOf(music);
                      if (index > -1) {
                        orderedMusicList.splice(index, 1);
                      }
                      cardDiv.remove();
                      button.disabled = false;
                      button.classList.remove("is-loading");
                      button.classList.remove("is-info");
                      button.classList.add("is-success");

                      setTimeout(() => {
                        button.classList.remove("is-success");
                        button.classList.add("is-danger");
                      }, 2000);
                    });

                    cardContentDiv.appendChild(button);
                    cardDiv.appendChild(cardContentDiv);

                    resultsDiv.appendChild(cardDiv);
                  }
                }
              });
          }

          paragraph.innerHTML = `${lang.songs_loaded_playing} ${newMusicList[0].name}`;
          setTimeout(() => {
            modal.remove();
          }, 5000);
        });

        // Crear el elemento span con el ícono de reproducción y agregarlo al botón playButton
        const playIconSpan = document.createElement('span');
        playIconSpan.innerHTML = '<i class="fa-solid fa-play"></i>';
        playButton.appendChild(playIconSpan);

        // Crear el elemento button con la clase "button is-danger", y agregarlo al div buttons
        const deleteButton = document.createElement('button');
        deleteButton.className = 'button is-danger';
        buttonsDiv.appendChild(deleteButton);

        deleteButton.addEventListener('click', () => {
          const index = playlists.indexOf(playlist);
          if (index > -1) {
            playlists.splice(index, 1);
          }
          fs.writeFileSync(`${dataDirectory}/battly/launcher/music/playlists.json`, JSON.stringify(playlists));
          cardDiv.remove();
          Toast.fire({
            icon: 'success',
            title: lang.playlist_deleted_correctly
          });
        });

        // Crear el elemento span con el ícono de eliminación y agregarlo al botón deleteButton
        const deleteIconSpan = document.createElement('span');
        deleteIconSpan.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteButton.appendChild(deleteIconSpan);

        //crear un separador de 5px
        const separator = document.createElement('div');
        separator.style.height = '5px';
        bodySection.appendChild(separator);
      }
      document.body.appendChild(modalDiv);
    });
      
    let sortable = new Sortable(document.getElementById('playlist'), {
      animation: 250, // Duración de la animación en milisegundos
      ghostClass: 'seleccionado', // Clase de estilo para el elemento seleccionado
      chosenClass: 'seleccionado', // Clase de estilo para el elemento elegido
    });

    const playlistAudio = document.getElementById("main-audio");

        

        

    document.getElementById("return-btn").addEventListener("click", () => {
      changePanel("home");
    });

    const wrapper = document.getElementById("card-wrapper"),
      musicImg = wrapper.querySelector(".img-area img"),
      musicName = document.querySelector(".song-details .artist"),
      playPauseBtn = wrapper.querySelector(".play-pause"),
      prevBtn = wrapper.querySelector("#prev"),
      nextBtn = wrapper.querySelector("#next"),
      mainAudio = wrapper.querySelector("#main-audio"),
      progressArea = wrapper.querySelector(".progress-area"),
      progressBar = progressArea.querySelector(".progress-bar");
    
      
          
      
          
      
    function playAudioFromVideoId(videoId) {
      ytdl.getInfo(videoId, { quality: 'highestaudio' })
        .then(info => {
          const audioFormat = info.formats.find(format => format.mimeType.includes('audio/mp4'));
      
          if (!audioFormat) {
            console.error("No se encontró un formato de audio adecuado");
            return;
          }
      
          const audioUrl = audioFormat.url;
      
          /* formato: { name: "Nice piano and ukulele", author: "Royalty", img: "https://www.bensound.com/bensound-img/buddy.jpg", audio: "https://www.bensound.com/bensound-music/bensound-buddy.mp3", duration: "2:02" },
          */
      
          //convertir a minutos:segundos
          const duration = info.videoDetails.lengthSeconds;
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const durationString = minutes + ":" + seconds;
      
          musicList_.push({
            url: videoId,
            name: info.videoDetails.title,
            author: info.videoDetails.author.name,
            img: info.videoDetails.thumbnails[0].url,
            audio: audioUrl,
            duration: durationString
          });
      
          addMusicToPlaylist(musicList_.length);
        })
        .catch(error => {
          console.error("Error al obtener información del video:");
          console.error(error);
        });
    }

    async function searchAndShowResults(songName) {
      let btnSearch = document.getElementById("reproducir-btn");
      btnSearch.disabled = true;
      btnSearch.classList.add("is-loading");
      let results = await usetube.searchVideo(songName)
      results = results.videos;

      if (results.length > 0) {
            

        const resultsDiv = document.getElementById("playlist");
        resultsDiv.innerHTML = "";

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const videoId = result.id;
          const title = result.title;
          const author = result.artist;
          const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

          /* crear esto:
          <div class="card cards" data-id="1">
  <!-- Datos de la primera canción -->
  <img
    src="miniatura"
    alt="Miniatura" class="thumbnail">
  <div class="card-content">
    <div class="song-title">Nombre de la Canción 1</div>
    <div class="artist">Nombre del Artista</div>
    <button class="delete-button button is-infio">Añadir</button>
  </div>
</div>
          */
                
          const cardDiv = document.createElement("div");
          cardDiv.classList.add("card");
          cardDiv.classList.add("cards");
          cardDiv.setAttribute("data-id", i + 1);

          const img = document.createElement("img");
          img.src = thumbnail;
          img.alt = lang.thumbnail;
          img.classList.add("thumbnail");
          cardDiv.appendChild(img);

          const cardContentDiv = document.createElement("div");
          cardContentDiv.classList.add("card-content");
          cardContentDiv.classList.add("card-content1");

          const songTitleDiv = document.createElement("div");
          songTitleDiv.classList.add("song-title");
          songTitleDiv.innerText = title;
          cardContentDiv.appendChild(songTitleDiv);

          const artistDiv = document.createElement("div");
          artistDiv.classList.add("artist");
          artistDiv.innerText = author;
          cardContentDiv.appendChild(artistDiv);

          const button = document.createElement("button");
          button.classList.add("delete-button");
          button.classList.add("button");
          button.classList.add("is-info");
          button.innerText = lang.add;

          button.addEventListener("click", async () => {
            button.disabled = true;
            button.classList.add("is-loading");
            await playAudioFromVideoId(videoId);
            button.disabled = false;
            button.classList.remove("is-loading");
            button.classList.remove("is-info");
            button.classList.add("is-success");

            setTimeout(() => {
              button.classList.remove("is-success");
              button.classList.add("is-info");



              sortable = new Sortable(document.getElementById('playlist'), {
                animation: 150,
                ghostClass: 'seleccionado',
                chosenClass: 'seleccionado',
                onEnd: handleSortEnd, // Llamar a la función handleSortEnd al finalizar el arrastre
              });


                  
              const resultsDiv = document.getElementById("playlist");
              resultsDiv.innerHTML = "";

              for (let music of musicList_) {

                //eliminar los elementos de la lista de reproducción
                    
                /* crear esto:
                <div class="card cards grab" data-id="1">
        <!-- Datos de la primera canción -->
        <img
          src="miniatura"
          alt="Miniatura" class="thumbnail">
        <div class="card-content">
          <div class="song-title">Nombre de la Canción 1</div>
          <div class="artist">Nombre del Artista</div>
          <button class="delete-button button is-infio">Eliminar</button>
        </div>
      </div>
                */
                    
                const cardDiv = document.createElement("div");
                cardDiv.classList.add("card");
                cardDiv.classList.add("cards");
                cardDiv.classList.add("grab");
                cardDiv.setAttribute("data-id", i + 1);
        
                const img = document.createElement("img");
                img.src = music.img;
                img.alt = lang.thumbnail;
                img.classList.add("thumbnail");
                cardDiv.appendChild(img);
        
                const cardContentDiv = document.createElement("div");
                cardContentDiv.classList.add("card-content");
                cardContentDiv.classList.add("card-content1");
        
                const songTitleDiv = document.createElement("div");
                songTitleDiv.classList.add("song-title");
                songTitleDiv.innerText = music.name;
                cardContentDiv.appendChild(songTitleDiv);
        
                const artistDiv = document.createElement("div");
                artistDiv.classList.add("artist");
                artistDiv.innerText = music.author;
                cardContentDiv.appendChild(artistDiv);
        
                const button = document.createElement("button");
                button.classList.add("delete-button");
                button.classList.add("button");
                button.classList.add("is-danger");
                button.innerText = lang.delete;
        
                button.addEventListener("click", async () => {
                  button.disabled = true;
                  button.classList.add("is-loading");
                  const index = musicList_.indexOf(music);
                  if (index > -1) {
                    musicList_.splice(index, 1);
                  }
                  cardDiv.remove();
                  button.disabled = false;
                  button.classList.remove("is-loading");
                  button.classList.remove("is-info");
                  button.classList.add("is-success");
        
                  setTimeout(() => {
                    button.classList.remove("is-success");
                    button.classList.add("is-danger");
                  }, 2000);
                });
                      
                cardContentDiv.appendChild(button);
                cardDiv.appendChild(cardContentDiv);
                      
                resultsDiv.appendChild(cardDiv);
              }

              function handleSortEnd(event) {
                const { oldIndex, newIndex } = event;

                // Actualizar el array musicList_ según la nueva ordenación
                const movedMusic = musicList_.splice(oldIndex, 1)[0];
                musicList_.splice(newIndex, 0, movedMusic);

              }

            }, 2000);
          });
                
          cardContentDiv.appendChild(button);
          cardDiv.appendChild(cardContentDiv);
                
          resultsDiv.appendChild(cardDiv);
                  
        }

        btnSearch.disabled = false;
        btnSearch.classList.remove("is-loading");
        btnSearch.classList.remove("is-info");
        btnSearch.classList.add("is-success");
        btnSearch.innerHTML = `<span><i class="fa-solid fa-circle-check"></i> ${lang.finded}</span>`;

        setTimeout(() => {
          btnSearch.classList.remove("is-success");
          btnSearch.classList.add("is-info");
          btnSearch.innerHTML = `<span><i class="fa-solid fa-search"></i> ${lang.search}</span>`;
        }, 2000);

      } else {
        btnSearch.disabled = false;
        btnSearch.classList.remove("is-loading");
        btnSearch.classList.remove("is-info");
        btnSearch.classList.add("is-danger");
        btnSearch.innerHTML = `<span><i class="fa-solid fa-xmark"></i> ${lang.not_founded}</span>`;

        setTimeout(() => {
          btnSearch.classList.remove("is-danger");
          btnSearch.classList.add("is-info");
          btnSearch.innerHTML = `<span><i class="fa-solid fa-search"></i> ${lang.search}</span>`;
        }, 3000);
      }
    }

    let volumenAudio = document.getElementById("volumen")
    volumenAudio.addEventListener("input", function (e) {
      let labelVolumen = document.getElementById("label-volumen");
      labelVolumen.innerHTML = e.target.value + "%";
      let value = e.target.value / 100;
      volumenAudio.style.setProperty("--thumb-rotate", `${value * 720}deg`);
      mainAudio.volume = value;
    });

      

    function addMusicToPlaylist(index) {
      const newMusic = musicList_[index - 1];


      //si no hay ninguna canción reproduciéndose en el array, reproducir la canción recién agregada
      if (musicList_.length === 1) {
        clicked(index);
      }
    }
      
      
      
    const btnDownload = document.getElementById("reproducir-btn");
    btnDownload.addEventListener("click", () => {
      const songName = document.getElementById("nombre-de-cancion").value;
      searchAndShowResults(songName);
    });
      
      
      
      
      
    let musicIndex = Math.floor((Math.random() * musicList_.length) + 1);
    let isMusicPaused = false;
      
    window.addEventListener("load", () => {
      loadMusic(musicIndex);
      playingSong();
    });
      
    function loadMusic(indexNumb) {
      musicName.innerText = musicList_[indexNumb - 1].name + '\n' + musicList_[indexNumb - 1].author;
      musicImg.src = musicList_[indexNumb - 1].img;
      mainAudio.src = musicList_[indexNumb - 1].audio;
      localStorage.setItem("songPlaying", musicList_[indexNumb - 1]);
      document.getElementById("music-img").src = musicList_[indexNumb - 1].img;
      /*width: 64px;
  height: 36px;*/
      //dejar sólo 30 caracteres en el título
      //document.getElementById("music-description").innerText = musicList_[indexNumb - 1].name.substring(0, 50) + "...";

      ipcRenderer.send("set-song", musicList_[indexNumb - 1]);
    }
      
    //play music function
    function playMusic() {
      wrapper.classList.add("paused");
      playPauseBtn.querySelector("i").innerText = "pause";
      mainAudio.play();
    }
      
    //pause music function
    function pauseMusic() {
      wrapper.classList.remove("paused");
      playPauseBtn.querySelector("i").innerText = "play_arrow";
      mainAudio.pause();
    }
      
    //prev music function
    function prevMusic() {
      musicIndex--; //decrement of musicIndex by 1
      //if musicIndex is less than 1 then musicIndex will be the array length so the last music play
      musicIndex < 1 ? musicIndex = musicList_.length : musicIndex = musicIndex;
      loadMusic(musicIndex);
      playMusic();
      playingSong();
    }
      
    //next music function
    function nextMusic() {
      musicIndex++; //increment of musicIndex by 1
      //if musicIndex is greater than array length then musicIndex will be 1 so the first music play
      musicIndex > musicList_.length ? musicIndex = 1 : musicIndex = musicIndex;
      loadMusic(musicIndex);
      playMusic();
      playingSong();
    }
      
      
    // play or pause button event
    playPauseBtn.addEventListener("click", () => {
      const isMusicPlay = wrapper.classList.contains("paused");
      //if isPlayMusic is true then call pauseMusic else call playMusic
      isMusicPlay ? pauseMusic() : playMusic();
      playingSong();
    });
      
    //prev music button event
    prevBtn.addEventListener("click", () => {
      prevMusic();
    });
      
    //next music button event
    nextBtn.addEventListener("click", () => {
      nextMusic();
    });

    ipcRenderer.on('play-pause', () => {
      const isMusicPlay = wrapper.classList.contains("paused");
      //if isPlayMusic is true then call pauseMusic else call playMusic
      isMusicPlay ? pauseMusic() : playMusic();
      playingSong();
    });

    ipcRenderer.on('next', () => {
      nextMusic();
    });

    ipcRenderer.on('prev', () => {
      prevMusic();
    });
      
    // update progress bar width according to music current time
    mainAudio.addEventListener("timeupdate", (e) => {
      const currentTime = e.target.currentTime; //getting playing song currentTime
      const duration = e.target.duration; //getting playing song total duration
      let progressWidth = (currentTime / duration) * 100;
      progressBar.style.width = `${progressWidth}%`;
      
      let musicCurrentTime = wrapper.querySelector(".current-time"),
        musicDuartion = wrapper.querySelector(".max-duration");
      mainAudio.addEventListener("loadeddata", () => {
        // update song total duration
        let mainAdDuration = mainAudio.duration;
        let totalMin = Math.floor(mainAdDuration / 60);
        let totalSec = Math.floor(mainAdDuration % 60);
        if (totalSec < 10) { //if sec is less than 10 then add 0 before it
          totalSec = `0${totalSec}`;
        }
        musicDuartion.innerText = `${totalMin}:${totalSec}`;
      });
      // update playing song current time
      let currentMin = Math.floor(currentTime / 60);
      let currentSec = Math.floor(currentTime % 60);
      if (currentSec < 10) { //if sec is less than 10 then add 0 before it
        currentSec = `0${currentSec}`;
      }
      musicCurrentTime.innerText = `${currentMin}:${currentSec}`;
    });
      
    // update playing song currentTime on according to the progress bar width
    progressArea.addEventListener("click", (e) => {
      let progressWidth = progressArea.clientWidth; //getting width of progress bar
      let clickedOffsetX = e.offsetX; //getting offset x value
      let songDuration = mainAudio.duration; //getting song total duration
        
      mainAudio.currentTime = (clickedOffsetX / progressWidth) * songDuration;
      playMusic(); //calling playMusic function
      playingSong();
    });
      
    //code for what to do after song ended
    mainAudio.addEventListener("ended", () => {
      let randIndex = Math.floor((Math.random() * musicList_.length) + 1); //genereting random index/numb with max range of array length
      do {
        randIndex = Math.floor((Math.random() * musicList_.length) + 1);
      } while (musicIndex == randIndex); //this loop run until the next random number won't be the same of current musicIndex
      musicIndex = randIndex; //passing randomIndex to musicIndex
      loadMusic(musicIndex);
      playMusic();
      playingSong();
    });
      
      
    const ulTag = wrapper.querySelector("ul");
    // let create li tags according to array length for list
    for (let i = 0; i < musicList_.length; i++) {
      //let's pass the song name, artist from the array
      let liTag = `<li li-index="${i + 1}">
                      <div class="row">
                        <span>${musicList_[i].name}</span>
                        <p>${musicList_[i].author}</p>
                      </div>
                      <span id="${musicList_[i].src}" class="audio-duration">${musicList_[i].duration}</span>
                      <audio class="${musicList_[i].src}" src="${musicList_[i].audio}"></audio>
                    </li>`;
      ulTag.insertAdjacentHTML("beforeend", liTag); //inserting the li inside ul tag
      
      let liAudioDuartionTag = ulTag.querySelector(`#${musicList_[i].src}`);
      let liAudioTag = ulTag.querySelector(`.${musicList_[i].src}`);
      liAudioTag.addEventListener("loadeddata", () => {
        let duration = liAudioTag.duration;
        let totalMin = Math.floor(duration / 60);
        let totalSec = Math.floor(duration % 60);
        if (totalSec < 10) { //if sec is less than 10 then add 0 before it
          totalSec = `0${totalSec}`;
        };
        liAudioDuartionTag.innerText = `${totalMin}:${totalSec}`; //passing total duation of song
        liAudioDuartionTag.setAttribute("t-duration", `${totalMin}:${totalSec}`); //adding t-duration attribute with total duration value
      });
    }
      
    //particular li clicked function
    function clicked(index) {
      musicIndex = index; // Actualiza el índice de la canción actual
      loadMusic(musicIndex);
      playMusic();
    }

    function playingSong() {
      let songPlaying = localStorage.getItem("songPlaying");
      ipcRenderer.send("song-playing", songPlaying);
    }
  }
}

export default Music;