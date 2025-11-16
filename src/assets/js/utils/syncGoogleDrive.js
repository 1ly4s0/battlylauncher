const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);

function saveTokens(tokens) {
    fs.writeFileSync(`${dataDirectory}/.battly/localStorage/googleTokens.json`, JSON.stringify(tokens));
}

function getTokens() {
    if (fs.existsSync(`${dataDirectory}/.battly/localStorage/googleTokens.json`)) {
        return JSON.parse(fs.readFileSync(`${dataDirectory}/.battly/localStorage/googleTokens.json`));
    }
    return null;
}

async function renewAccessTokenIfNeeded(refresh_token) {
    try {
        const response = await fetch('https://battlylauncher.com/google-drive/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token }),
        });

        if (!response.ok) {
            throw new Error('Error al refrescar el token');
        }

        const newTokens = await response.json();
        saveTokens(newTokens);
        return newTokens;
    } catch (error) {
        console.error('Error al renovar el token de acceso:', error);
        return null;
    }
}

async function syncGoogleDrive() {
    const tokens = getTokens();
    if (!tokens) {
        console.log('No Google tokens found, skipping sync.');
        process.send('sync-completed');
        return;
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);

    if (auth.isTokenExpiring()) {
        const newTokens = await renewAccessTokenIfNeeded(tokens.refresh_token);
        if (!newTokens) {
            console.error('Failed to renew access token, skipping sync.');
            process.send({ type: 'error', error: 'Failed to renew access token' });
            return;
        }
        auth.setCredentials(newTokens);
    }

    const drive = google.drive({ version: 'v3', auth });
    const rootLocalDirectory = `${dataDirectory}/.battly/saves`;
    const battlyFolder = await findOrCreateFolder(drive, 'root', 'Battly');

    const worldFolders = fs.readdirSync(rootLocalDirectory, { withFileTypes: true }).filter(entry => entry.isDirectory());

    for (const worldFolder of worldFolders) {
        const worldFolderPath = `${rootLocalDirectory}/${worldFolder.name}`;
        const driveFolder = await findOrCreateFolder(drive, battlyFolder.id, worldFolder.name);
        await createSubfoldersRecursive(drive, driveFolder.id, worldFolderPath);
        await uploadFilesRecursive(drive, driveFolder.id, worldFolderPath);
    }

    console.log('Google Drive sync completed.');
    process.send('sync-completed');
}

async function createSubfoldersRecursive(drive, parentFolderId, localFolderPath) {
    const folderContents = fs.readdirSync(localFolderPath, { withFileTypes: true });

    for (const entry of folderContents) {
        const entryPath = `${localFolderPath}/${entry.name}`;

        if (entry.isDirectory()) {
            const folder = await findOrCreateFolder(drive, parentFolderId, entry.name);
            await createSubfoldersRecursive(drive, folder.id, entryPath);
        }
    }
}

async function uploadFilesRecursive(drive, parentFolderId, localFolderPath) {
    const folderContents = fs.readdirSync(localFolderPath, { withFileTypes: true });

    const uploadPromises = folderContents.map(async (entry) => {
        const entryPath = `${localFolderPath}/${entry.name}`;

        if (entry.isFile()) {
            const query = `name='${entry.name}' and '${parentFolderId}' in parents`;
            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name)',
            });

            if (res.data.files && res.data.files.length > 0) {
                await drive.files.update({
                    fileId: res.data.files[0].id,
                    media: {
                        body: fs.createReadStream(entryPath),
                    },
                });
            } else {
                await drive.files.create({
                    requestBody: {
                        name: entry.name,
                        parents: [parentFolderId],
                    },
                    media: {
                        body: fs.createReadStream(entryPath),
                    },
                });
            }
        } else if (entry.isDirectory()) {
            const folder = await findOrCreateFolder(drive, parentFolderId, entry.name);
            await uploadFilesRecursive(drive, folder.id, entryPath);
        }
    });

    await Promise.all(uploadPromises);
}

async function findOrCreateFolder(drive, parentFolderId, folderName) {
    const query = `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`;

    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
    });

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0];
    }

    const folder = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        },
        fields: 'id, name',
    });

    return folder.data;
}

syncGoogleDrive().catch(error => {
    console.error('Sync failed:', error);
    // process.send({ type: 'error', error: error.message });
});

module.exports = { syncGoogleDrive };
