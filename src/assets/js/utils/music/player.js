'use strict';

const AnalyticsHelper = require('./assets/js/utils/analyticsHelper.js');

function loadMusic(musicInstance, index) {
    const song = musicInstance.musicList[index - 1];
    if (!song) return;

    const musicName = document.querySelector(".b-music-name");
    const musicArtist = document.querySelector(".b-music-artist");
    const musicImg = document.querySelector(".b-music-img");
    const mainAudio = musicInstance.mainAudio;

    if (musicName) musicName.innerText = song.title;
    if (musicArtist) musicArtist.innerText = song.artist;
    if (musicImg) {
        musicImg.src = song.thumbnail;
    }
    if (mainAudio) mainAudio.src = song.src;
}

function playMusic(musicInstance) {
    if (!musicInstance.mainAudio) return;

    musicInstance.mainAudio.play();
    musicInstance.isPlaying = true;

    const playBtn = document.querySelector(".b-music-play-stop");
    if (playBtn) {
        playBtn.classList.remove('fa-play');
        playBtn.classList.add('fa-pause');
    }

    const currentSong = musicInstance.musicList[musicInstance.musicIndex - 1];
    if (currentSong) {
        AnalyticsHelper.trackMusicPlay(currentSong.title, currentSong.artist)
            .catch(err => console.error('Error tracking music play:', err));
    }
}

function pauseMusic(musicInstance) {
    if (!musicInstance.mainAudio) return;

    const currentTime = musicInstance.mainAudio.currentTime || 0;
    musicInstance.mainAudio.pause();
    musicInstance.isPlaying = false;

    const playBtn = document.querySelector(".b-music-play-stop");
    if (playBtn) {
        playBtn.classList.remove('fa-pause');
        playBtn.classList.add('fa-play');
    }

    const currentSong = musicInstance.musicList[musicInstance.musicIndex - 1];
    const currentTime = musicInstance.mainAudio.currentTime || 0;
    if (currentSong) {
        AnalyticsHelper.trackMusicPause(currentSong.title, currentTime)
            .catch(err => console.error('Error tracking music pause:', err));
    }
}

function nextMusic(musicInstance) {
    if (musicInstance.musicList.length === 0) return;

    const fromSong = musicInstance.musicList[musicInstance.musicIndex - 1];

    musicInstance.musicIndex++;
    if (musicInstance.musicIndex > musicInstance.musicList.length) {
        musicInstance.musicIndex = 1;
    }

    const toSong = musicInstance.musicList[musicInstance.musicIndex - 1];

    loadMusic(musicInstance, musicInstance.musicIndex);
    playMusic(musicInstance);

    if (fromSong && toSong) {
        AnalyticsHelper.trackMusicSkip(fromSong, toSong, 'next_button')
            .catch(err => console.error('Error tracking music skip:', err));
    }
}

function prevMusic(musicInstance) {
    if (musicInstance.musicList.length === 0) return;

    const fromSong = musicInstance.musicList[musicInstance.musicIndex - 1];

    musicInstance.musicIndex--;
    if (musicInstance.musicIndex < 1) {
        musicInstance.musicIndex = musicInstance.musicList.length;
    }

    const toSong = musicInstance.musicList[musicInstance.musicIndex - 1];

    loadMusic(musicInstance, musicInstance.musicIndex);
    playMusic(musicInstance);

    if (fromSong && toSong) {
        AnalyticsHelper.trackMusicSkip(fromSong, toSong, 'prev_button')
            .catch(err => console.error('Error tracking music skip:', err));
    }
}

function selectSong(musicInstance, index) {
    const fromSong = musicInstance.musicList[musicInstance.musicIndex - 1];
    musicInstance.musicIndex = index;
    const toSong = musicInstance.musicList[musicInstance.musicIndex - 1];

    loadMusic(musicInstance, musicInstance.musicIndex);
    playMusic(musicInstance);

    if (fromSong && toSong && fromSong !== toSong) {
        AnalyticsHelper.trackMusicSkip(fromSong, toSong, 'song_selection')
            .catch(err => console.error('Error tracking music skip:', err));
    }
}

module.exports = {
    loadMusic,
    playMusic,
    pauseMusic,
    nextMusic,
    prevMusic,
    selectSong
};

