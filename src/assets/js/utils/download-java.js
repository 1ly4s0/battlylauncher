const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const EventEmitter = require('events');
const Seven = require('node-7z');
const sevenBin = require('7zip-bin');

const fetchLike = (typeof fetch === 'function') ? fetch : (...args) => require('node-fetch')(...args);

function ensureDirSync(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function streamToPromise(stream) {
    return new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('close', resolve);
        stream.on('error', reject);
    });
}

async function getFileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        const input = fs.createReadStream(filePath);
        input.on('error', reject);
        input.on('data', chunk => hash.update(chunk));
        input.on('end', () => resolve(hash.digest('hex')));
    });
}

class Downloader extends EventEmitter {
    async downloadFile(url, destFolder, fileName) {
        ensureDirSync(destFolder);
        const filePath = path.join(destFolder, fileName);

        const res = await fetchLike(url);
        if (!res.ok || !res.body) {
            throw new Error(`Fallo al descargar: ${url} (${res.status})`);
        }

        const size = Number(res.headers.get('content-length') || 0);
        let downloaded = 0;
        const fileStream = fs.createWriteStream(filePath);

        const reader = res.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            downloaded += value.length;
            fileStream.write(value);
            this.emit('progress', downloaded, size);
        }
        fileStream.end();
        await streamToPromise(fileStream);
        return filePath;
    }
}

const MOJANG_ALL_JSON =
    'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';

const PLATFORM_MAP_ADOPTIUM = { win32: 'windows', darwin: 'mac', linux: 'linux' };
const ARCH_MAP_ADOPTIUM = { x64: 'x64', ia32: 'x32', arm64: 'aarch64', arm: 'arm' };

function mojangArchMap(intelEnabledMac) {
    return {
        win32: { x64: 'windows-x64', ia32: 'windows-x86', arm64: 'windows-arm64' },
        darwin: { x64: 'mac-os', arm64: intelEnabledMac ? 'mac-os' : 'mac-os-arm64' },
        linux: { x64: 'linux', ia32: 'linux-i386' }
    };
}

function normalizeJavaMajor(version) {
    if (!version) return 8;
    const v = String(version).trim();
    if (v === '1.8' || v.startsWith('1.8')) return 8;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 8;
}

function isWindows() { return process.platform === 'win32'; }

function getJavaExeRelative() {
    return isWindows() ? path.join('bin', 'javaw.exe') : path.join('bin', 'java');
}

function getAdoptiumJavaBinRelative(platform) {

    return platform === 'mac'
        ? path.join('Contents', 'Home', 'bin', 'java')
        : getJavaExeRelative();
}

async function readCachedJSON(cachePath) {
    if (!fs.existsSync(cachePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    } catch {
        return null;
    }
}

async function writeCacheJSON(cachePath, data) {
    ensureDirSync(path.dirname(cachePath));
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
}

async function extractWith7z(archivePath, destPath, onProgress) {
    if (os.platform() !== 'win32') {
        try { fs.chmodSync(sevenBin.path7za, 0o755); } catch { }
    }

    await new Promise((resolve, reject) => {
        const extractor = Seven.extractFull(archivePath, destPath, {
            $bin: sevenBin.path7za,
            recursive: true,
            $progress: true
        });

        extractor.on('error', reject);
        extractor.on('end', resolve);
        extractor.on('progress', (p) => {
            if (onProgress && typeof p.percent === 'number') {
                onProgress({ phase: 'extract', percent: Math.max(0, Math.min(100, p.percent)) });
            }
        });
    });
}

function getPlatformArchForAdoptium(intelEnabledMac) {
    const platform = PLATFORM_MAP_ADOPTIUM[os.platform()] || os.platform();
    let arch = ARCH_MAP_ADOPTIUM[os.arch()] || os.arch();

    if (os.platform() === 'darwin' && os.arch() === 'arm64' && intelEnabledMac) {
        arch = 'x64';
    }
    return { platform, arch };
}

async function tryMojang(javaBasePath, intelEnabledMac, mcJavaComponent, onProgress) {
    const platform = os.platform();
    const arch = os.arch();
    const archMap = mojangArchMap(intelEnabledMac)[platform];
    if (!archMap) return null;
    const archOs = archMap[arch];
    if (!archOs) return null;

    const component = mcJavaComponent || 'jre-legacy';
    const cacheAll = path.join(javaBasePath, 'mc-assets', 'java-runtime-all.json');

    let allJson = null;
    try {
        const res = await fetchLike(MOJANG_ALL_JSON);
        if (!res.ok) throw new Error(String(res.status));
        allJson = await res.json();
        await writeCacheJSON(cacheAll, allJson);
    } catch {
        allJson = await readCachedJSON(cacheAll);
        if (!allJson) return null;
    }

    const entry = allJson?.[archOs]?.[component]?.[0];
    const versionName = entry?.version?.name;
    const manifestUrl = entry?.manifest?.url;
    if (!versionName || !manifestUrl) return null;

    const cacheManifest = path.join(javaBasePath, 'mc-assets', `java-runtime-all-manifest-${versionName}.json`);
    let manifest = null;
    try {
        const res = await fetchLike(manifestUrl);
        if (!res.ok) throw new Error(String(res.status));
        manifest = await res.json();
        await writeCacheJSON(cacheManifest, manifest);
    } catch {
        manifest = await readCachedJSON(cacheManifest);
        if (!manifest) return null;
    }

    const entries = Object.entries(manifest.files || {});
    const exeKey = isWindows() ? 'bin/javaw.exe' : 'bin/java';
    const exeEntry = entries.find(([rel]) => rel.endsWith(exeKey));
    if (!exeEntry) return null;

    const toDeletePrefix = exeEntry[0].replace(exeKey, '');
    const files = [];
    for (const [relPath, info] of entries) {
        if (info.type === 'directory') continue;
        if (!info.downloads?.raw?.url) continue;
        files.push({
            path: path.join(`runtime/jre-${versionName}-${archOs}`, relPath.replace(toDeletePrefix, '')),
            executable: !!info.executable,
            sha1: info.downloads.raw.sha1,
            size: info.downloads.raw.size,
            url: info.downloads.raw.url,
            type: 'Java'
        });
    }

    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const destAbs = path.resolve(javaBasePath, f.path);
        ensureDirSync(path.dirname(destAbs));

        if (fs.existsSync(destAbs) && f.sha1) {
            const sha = await getFileHash(destAbs, 'sha1');
            if (sha && sha.toLowerCase() === String(f.sha1).toLowerCase()) continue;
            try { fs.unlinkSync(destAbs); } catch { }
        }

        if (onProgress) {
            onProgress({
                phase: 'file-start',
                file: path.basename(destAbs),
                fileIndex: i,
                totalFiles: files.length,
                size: (typeof f.size === 'number' ? f.size : undefined)
            });
        }

        const dl = new Downloader();
        if (onProgress) {
            dl.on('progress', (downloaded) => {
                const sizeKnown = (typeof f.size === 'number' && f.size > 0);
                const percent = sizeKnown ? (downloaded / f.size) * 100 : undefined;
                onProgress({
                    phase: 'download',
                    downloaded,
                    size: sizeKnown ? f.size : undefined,
                    percent,
                    file: path.basename(destAbs),
                    fileIndex: i,
                    totalFiles: files.length
                });
            });
        }

        await dl.downloadFile(f.url, path.dirname(destAbs), path.basename(destAbs));

        if (f.sha1) {
            const sha = await getFileHash(destAbs, 'sha1');
            if (!sha || sha.toLowerCase() !== String(f.sha1).toLowerCase()) {
                try { fs.unlinkSync(destAbs); } catch { }
                throw new Error(`Checksum SHA1 no válido para ${destAbs}`);
            }
        }

        if (!isWindows() && f.executable) {
            try { fs.chmodSync(destAbs, 0o755); } catch { }
        }

        if (onProgress) {
            onProgress({
                phase: 'file-done',
                file: path.basename(destAbs),
                fileIndex: i,
                totalFiles: files.length,
                size: (typeof f.size === 'number' ? f.size : undefined)
            });
        }
    }

    const finalPath = path.resolve(
        javaBasePath,
        `runtime/jre-${versionName}-${archOs}`,
        getJavaExeRelative()
    );
    return finalPath;
}

async function tryAdoptium(javaBasePath, majorVersion, imageType, intelEnabledMac, onProgress) {
    const { platform, arch } = getPlatformArchForAdoptium(intelEnabledMac);
    const params = new URLSearchParams({
        image_type: imageType || 'jre',
        architecture: arch,
        os: platform
    });
    const url = `https://api.adoptium.net/v3/assets/latest/${majorVersion}/hotspot?${params.toString()}`;

    const res = await fetchLike(url);
    if (!res.ok) throw new Error(`Adoptium API error ${res.status}`);
    const arr = await res.json();
    const java = arr?.[0];
    if (!java?.binary?.package?.link) {
        throw new Error('No se encontró binario en Adoptium');
    }

    const pkg = java.binary.package;
    const checksum = pkg.checksum;
    const downloadUrl = pkg.link;
    const fileName = pkg.name || `adoptium-${majorVersion}.archive`;
    const fileSize = typeof pkg.size === 'number' ? pkg.size : undefined;

    const runtimeRoot = path.resolve(javaBasePath, `runtime/jre-${majorVersion}`);
    const archivePath = path.join(runtimeRoot, fileName);
    const javaBinRelative = getAdoptiumJavaBinRelative(platform);
    const finalJavaPath = path.join(runtimeRoot, javaBinRelative);

    if (fs.existsSync(finalJavaPath)) return finalJavaPath;

    ensureDirSync(runtimeRoot);

    if (onProgress) {
        onProgress({
            phase: 'file-start',
            file: fileName,
            fileIndex: 0,
            totalFiles: 1,
            size: fileSize
        });
    }

    const dl = new Downloader();
    if (onProgress) {
        dl.on('progress', (downloaded, headerSize) => {
            const expected = fileSize || headerSize || 0;
            const percent = expected ? (downloaded / expected) * 100 : undefined;
            onProgress({
                phase: 'download',
                downloaded,
                size: expected || undefined,
                percent,
                file: fileName,
                fileIndex: 0,
                totalFiles: 1
            });
        });
    }
    await dl.downloadFile(downloadUrl, runtimeRoot, fileName);

    if (onProgress) {
        onProgress({
            phase: 'file-done',
            file: fileName,
            fileIndex: 0,
            totalFiles: 1,
            size: fileSize
        });
    }

    if (checksum) {
        const h = await getFileHash(archivePath, 'sha256');
        if (!h || h.toLowerCase() !== String(checksum).toLowerCase()) {
            try { fs.unlinkSync(archivePath); } catch { }
            throw new Error('Checksum SHA256 inválido para el paquete de Adoptium');
        }
    }

    if (onProgress) onProgress({ phase: 'extract', percent: 0, file: fileName });
    await extractWith7z(archivePath, runtimeRoot, onProgress);

    const tarCandidate = archivePath.endsWith('.gz') ? archivePath.replace(/\.gz$/i, '') : null;
    if (tarCandidate && fs.existsSync(tarCandidate)) {
        await extractWith7z(tarCandidate, runtimeRoot, onProgress);
        try { fs.unlinkSync(tarCandidate); } catch { }
    }

    try { fs.unlinkSync(archivePath); } catch { }

    const items = fs.readdirSync(runtimeRoot);
    if (items.length === 1) {
        const only = path.join(runtimeRoot, items[0]);
        try {
            const st = fs.statSync(only);
            if (st.isDirectory()) {
                for (const it of fs.readdirSync(only)) {
                    fs.renameSync(path.join(only, it), path.join(runtimeRoot, it));
                }
                fs.rmdirSync(only);
            }
        } catch { }
    }

    if (!isWindows()) {
        try { fs.chmodSync(finalJavaPath, 0o755); } catch { }
    }

    return finalJavaPath;
}

async function downloadJavaVersion(version, options = {}) {
    const {
        basePath = path.join(process.cwd(), '.java-runtime'),
        imageType = 'jre',
        intelEnabledMac = false,
        onProgress,
        minecraftVersionJSON
    } = options;

    ensureDirSync(basePath);

    if (version == null) {
        const mojangPath = await tryMojang(
            basePath,
            intelEnabledMac,
            minecraftVersionJSON?.javaVersion?.component,
            onProgress
        );
        if (mojangPath) return mojangPath;

        const mv = normalizeJavaMajor(minecraftVersionJSON?.javaVersion?.majorVersion || 8);
        return await tryAdoptium(basePath, mv, imageType, intelEnabledMac, onProgress);
    }

    const major = normalizeJavaMajor(version);

    const componentByMajor = {
        8: 'jre-legacy',
        16: 'java-runtime-alpha',
        17: 'java-runtime-gamma',
        19: 'java-runtime-alpha',
        21: 'java-runtime-delta'

    };

    const component = componentByMajor[major] || undefined;
    const mojangPath = await tryMojang(basePath, intelEnabledMac, component, onProgress);
    if (mojangPath) return mojangPath;

    return await tryAdoptium(basePath, major, imageType, intelEnabledMac, onProgress);
}

module.exports = downloadJavaVersion;

