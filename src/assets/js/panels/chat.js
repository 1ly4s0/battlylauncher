/**
 * @author TECNO BROS
 
 */

'use strict';

import { logger, database, changePanel } from '../utils.js';

const { ipcRenderer } = require('electron');
const pkg = require('../package.json');


const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)

class Chat {
    static id = "chat";
    async init(config, news) {
        this.config = config
    }
}
export default Chat;