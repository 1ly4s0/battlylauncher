/**
 * @author TECNO BROS
 
 */

'use strict';

const { ipcRenderer } = require('electron');
class MusicSmall {
    static id = "music-small";
    async init() {
        this.ShowMusicInfo();
    }


    async ShowMusicInfo() {
        ipcRenderer.on('get-song-test', (song) => {
            document.getElementById("musicSmallName").innerText = musicList_[indexNumb - 1].name;
            document.getElementById("musicSmallDesc").innerText = musicList_[indexNumb - 1].author;
            document.getElementById("musicSmallImg").src = musicList_[indexNumb - 1].img;
        });
    }
}
export default MusicSmall;