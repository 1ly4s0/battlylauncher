'use strict';

const {
    YTDLP_PATH,
    BIN_DIR,
    getYtDlpDownloadURL,
    fileExists,
    ensureDir,
    getYtDlpVersion,
    downloadToFileWithProgress
} = require('./ytdlp');
const { createProgressModal } = require('./ui');
const fsp = require('fs').promises;

async function checkAndUpdateYtDlpWithUI() {
    await ensureDir(BIN_DIR);

    const needDownload = !(await fileExists(YTDLP_PATH)) ||
        (await fsp.stat(YTDLP_PATH)).size < 512 * 1024;

    if (!needDownload) {
        const actualVersion = await getYtDlpVersion(YTDLP_PATH);

        const actualGitHubVersion = await fetch(
            'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'
        )
            .then(r => {
                if (!r.ok) {
                    console.warn(`GitHub API returned ${r.status}: ${r.statusText}`);
                    return null;
                }
                return r.json();
            })
            .then(j => j ? j.tag_name : null)
            .catch((err) => {
                console.warn('Error fetching GitHub version:', err.message);
                return null;
            });

        if (actualVersion && !actualGitHubVersion) {
            console.log('yt-dlp is installed locally, but could not check for updates (GitHub API unavailable)');
            return;
        }

        if (actualVersion && actualGitHubVersion &&
            actualVersion.replace(/^v/, '') >= actualGitHubVersion.replace(/^v/, '')) {
            console.log(`yt-dlp is up to date (${actualVersion})`);
            return;
        }
    }

    await window.ensureStringLoader();

    const ui = createProgressModal();
    try {
        const url = getYtDlpDownloadURL();

        await downloadToFileWithProgress(url, YTDLP_PATH, (p) => {
            if (p === null) {
                ui.setIndeterminate(window.getString("music.downloadingBattlyMusic"));
            } else {
                ui.update(p, window.getString("music.downloadingBattlyMusic"));
            }
        });

        if (process.platform !== 'win32') {
            await fsp.chmod(YTDLP_PATH, 0o755);
        }

        ui.setIndeterminate(window.getString("music.verifyingInstallation"));
        const ver = await getYtDlpVersion(YTDLP_PATH);
        console.log("yt-dlp version:", ver || window.getString("music.unknownVersion"));

        ui.done(window.getString("music.updateCompleted"));
    } catch (e) {
        console.error(window.getString("music.errorUpdating"), e);
        ui.close();

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error de actualización',
                text: e.message || 'No se pudo actualizar yt-dlp.'
            });
        } else {
            alert('Error de actualización: ' + (e.message || 'No se pudo actualizar yt-dlp.'));
        }
    }
}

module.exports = {
    checkAndUpdateYtDlpWithUI
};

