"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const buffer_js_1 = __importDefault(require("./buffer.js"));
function ping(server, port, callback, timeout, protocol = '') {
    let start = new Date();
    let socket = net_1.default.connect({
        port: port,
        host: server
    }, () => {
        let handshakeBuffer = new buffer_js_1.default();
        handshakeBuffer.writeletInt(0);
        handshakeBuffer.writeletInt(protocol);
        handshakeBuffer.writeString(server);
        handshakeBuffer.writeUShort(port);
        handshakeBuffer.writeletInt(1);
        writePCBuffer(socket, handshakeBuffer);
        let setModeBuffer = new buffer_js_1.default();
        setModeBuffer.writeletInt(0);
        writePCBuffer(socket, setModeBuffer);
    });
    socket.setTimeout(timeout, () => {
        if (callback)
            callback(new Error("Socket timed out when connecting to " + server + ":" + port), null);
        socket.destroy();
    });
    let readingBuffer = Buffer.alloc(0);
    socket.on('data', data => {
        readingBuffer = Buffer.concat([readingBuffer, data]);
        let buffer = new buffer_js_1.default(readingBuffer);
        let length;
        try {
            length = buffer.readletInt();
        }
        catch (err) {
            return;
        }
        if (readingBuffer.length < length - buffer.offset())
            return;
        buffer.readletInt();
        try {
            let end = new Date();
            let json = JSON.parse(buffer.readString());
            callback(null, {
                error: false,
                ms: Math.round(end - start),
                version: json.version.name,
                playersConnect: json.players.online,
                playersMax: json.players.max
            });
        }
        catch (err) {
            return callback(err, null);
        }
        socket.destroy();
    });
    socket.once('error', err => {
        if (callback)
            callback(err, null);
        socket.destroy();
    });
}
;
function writePCBuffer(client, buffer) {
    let length = new buffer_js_1.default();
    length.writeletInt(buffer.buffer().length);
    client.write(Buffer.concat([length.buffer(), buffer.buffer()]));
}
class status {
    constructor(ip = '0.0.0.0', port = 25565) {
        this.ip = ip;
        this.port = port;
    }
    async getStatus() {
        return await new Promise((resolve, reject) => {
            ping(this.ip, this.port, (err, res) => {
                if (err)
                    return reject({ error: err });
                return resolve(res);
            }, 3000);
        });
    }
}
exports.default = status;
//# sourceMappingURL=status.js.map