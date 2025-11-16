'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');

const dataDirectory = path.join(
    process.env.APPDATA ||
    (process.platform === 'darwin'
        ? path.join(process.env.HOME, "Library", "Application Support")
        : process.env.HOME),
    ".battly"
);

const BIN_DIR = path.join(dataDirectory, "battly", "launcher", "music", "bin");
const CACHE_DIR = path.join(BIN_DIR, "yt-dlp-cache");
const YTDLP_BIN_NAME = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const YTDLP_PATH = path.join(BIN_DIR, YTDLP_BIN_NAME);

function getYtDlpDownloadURL() {
    if (process.platform === 'win32') {
        return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    }
    if (process.platform === 'darwin') {
        return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    }
    return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
}

async function fileExists(p) {
    try {
        await fsp.access(p, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function ensureDir(d) {
    if (!(await fileExists(d))) {
        await fsp.mkdir(d, { recursive: true });
    }
}

async function getYtDlpVersion(binPath) {
    return new Promise((resolve) => {
        const child = spawn(binPath, ['--version'], { windowsHide: true });
        let out = '';
        child.stdout.on('data', d => out += d.toString());
        child.on('error', () => resolve(null));
        child.on('close', () => resolve(out.trim() || null));
    });
}

function runYtDlp(args, { timeoutMs = 60000, log = false } = {}) {
    return new Promise((resolve, reject) => {
        const cmd = `${YTDLP_PATH} ${args.map(a => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`;
        if (log) console.log(`[yt-dlp] ${cmd}`);

        const child = spawn(YTDLP_PATH, args, {
            windowsHide: true,
            shell: false,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error('yt-dlp timeout'));
        }, timeoutMs);

        child.stdout.on('data', data => {
            stdout += data;
        });

        child.stderr.on('data', data => {
            stderr += data;
        });

        child.on('error', err => {
            clearTimeout(timeout);
            reject(err);
        });

        child.on('close', code => {
            clearTimeout(timeout);
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                reject(new Error(`yt-dlp exited with code ${code}: ${stderr || stdout}`));
            }
        });
    });
}

async function getBestAudioURLFromYtDlp(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const out = await runYtDlp([
        '--no-playlist',
        '-f', '251',
        '--get-url',
        '--quiet',
        '--no-warnings',
        '--geo-bypass',
        '--force-ipv4',
        '--extractor-args', 'youtube:player_skip=js',
        '--cache-dir', CACHE_DIR,
        '--no-check-certificates',
        '--abort-on-error',
        url
    ]);

    const line = (out.split(/\r?\n/).find(Boolean) || '').trim();
    if (!line) throw new Error('No se recibió URL de audio de yt-dlp');
    return line;
}

async function downloadToFileWithProgress(url, destPath, onProgress) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Descarga fallida (${res.status}) de ${url}`);

    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    await ensureDir(path.dirname(destPath));
    const temp = destPath + ".tmp";
    const writable = fs.createWriteStream(temp);

    let received = 0;
    return new Promise((resolve, reject) => {
        function pump() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    writable.end(async () => {
                        try {
                            await fsp.rename(temp, destPath);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                    return;
                }
                received += value.length;
                writable.write(Buffer.from(value));
                if (total && typeof onProgress === 'function') {
                    const percent = (received / total) * 100;
                    onProgress(percent);
                } else if (typeof onProgress === 'function') {
                    onProgress(null); // indeterminado
                }
                pump();
            }).catch(err => {
                try { writable.close(); } catch { }
                reject(err);
            });
        }
        pump();
    });
}

module.exports = {
    BIN_DIR,
    YTDLP_BIN_NAME,
    YTDLP_PATH,
    getYtDlpDownloadURL,
    fileExists,
    ensureDir,
    getYtDlpVersion,
    runYtDlp,
    getBestAudioURLFromYtDlp,
    downloadToFileWithProgress
};
