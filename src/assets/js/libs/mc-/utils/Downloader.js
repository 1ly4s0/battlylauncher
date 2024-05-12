"use strict";
/**
 * @author TECNO BROS
 
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const events_1 = require("events");
class download {
    constructor() {
        this.on = events_1.EventEmitter.prototype.on;
        this.emit = events_1.EventEmitter.prototype.emit;
    }
    async downloadFile(url, path, fileName) {
        if (!fs_1.default.existsSync(path))
            fs_1.default.mkdirSync(path, { recursive: true });
        const writer = fs_1.default.createWriteStream(path + '/' + fileName);
        const response = await (0, node_fetch_1.default)(url);
        let size = response.headers.get('content-length');
        let downloaded = 0;
        return new Promise((resolve, reject) => {
            response.body.on('data', (chunk) => {
                downloaded += chunk.length;
                this.emit('progress', downloaded, size);
                writer.write(chunk);
            });
            response.body.on('end', () => {
                writer.end();
                resolve();
            });
            response.body.on('error', (err) => {
                this.emit('error', err);
                reject(err);
            });
        });
    }
    async downloadFileMultiple(files, size, limit = 1, timeout = 10000) {
        if (limit > files.length)
            limit = files.length;
        let completed = 0;
        let downloaded = 0;
        let queued = 0;
        let start = new Date().getTime();
        let before = 0;
        let speeds = [];
        let estimated = setInterval(() => {
            let duration = (new Date().getTime() - start) / 1000;
            let loaded = (downloaded - before) * 8;
            if (speeds.length >= 5)
                speeds = speeds.slice(1);
            speeds.push((loaded / duration) / 8);
            let speed = 0;
            for (let s of speeds)
                speed += s;
            speed /= speeds.length;
            this.emit("speed", speed);
            let time = (size - downloaded) / (speed);
            this.emit("estimated", time);
            start = new Date().getTime();
            before = downloaded;
        }, 500);
        const downloadNext = async () => {
            if (queued < files.length) {
                let file = files[queued];
                queued++;
                if (!fs_1.default.existsSync(file.foler))
                    fs_1.default.mkdirSync(file.folder, { recursive: true, mode: 0o777 });
                const writer = fs_1.default.createWriteStream(file.path, { flags: 'w', mode: 0o777 });
                try {
                    const response = await (0, node_fetch_1.default)(file.url, { timeout: timeout });
                    response.body.on('data', (chunk) => {
                        downloaded += chunk.length;
                        this.emit('progress', downloaded, size, file.type);
                        writer.write(chunk);
                    });
                    response.body.on('end', () => {
                        writer.end();
                        completed++;
                        downloadNext();
                    });
                }
                catch (e) {
                    writer.end();
                    completed++;
                    downloadNext();
                    this.emit('error', e);
                }
            }
        };
        while (queued < limit)
            downloadNext();
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (completed === files.length) {
                    clearInterval(estimated);
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
    async checkURL(url, timeout = 10000) {
        return await new Promise(async (resolve, reject) => {
            await (0, node_fetch_1.default)(url, { method: 'HEAD', timeout: timeout }).then(res => {
                if (res.status === 200) {
                    resolve({
                        size: parseInt(res.headers.get('content-length')),
                        status: res.status
                    });
                }
            });
            reject(false);
        });
    }
    async checkMirror(baseURL, mirrors) {
        for (let mirror of mirrors) {
            let url = `${mirror}/${baseURL}`;
            let res = await this.checkURL(url).then(res => res).catch(err => false);
            if (res?.status == 200) {
                return {
                    url: url,
                    size: res.size,
                    status: res.status
                };
                break;
            }
            continue;
        }
        return false;
    }
}
exports.default = download;
