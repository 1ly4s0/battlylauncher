const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { destinationFile, destinationFolder } = JSON.parse(process.argv[2]);

(async () => {
    try {
        if (!fs.existsSync(destinationFolder)) {
            await fs.promises.mkdir(destinationFolder, { recursive: true });
        }
        const zip = new AdmZip(destinationFile);
        const zipEntries = zip.getEntries();

        for (const zipEntry of zipEntries) {
            let fileName = zipEntry.entryName;

            if (fileName.startsWith('overrides/')) {
                fileName = fileName.replace('overrides/', '');
            }

            if (fileName === '') continue;

            process.send({ type: 'progress', fileName });

            const fileDestination = path.join(destinationFolder, fileName);

            if (zipEntry.isDirectory) {
                await fs.promises.mkdir(fileDestination, { recursive: true });
            } else {
                await fs.promises.mkdir(path.dirname(fileDestination), { recursive: true });
                await fs.promises.writeFile(fileDestination, zipEntry.getData());
            }
        }

        process.send({ type: 'done' });
        process.exit(0);
    } catch (error) {
        console.error('Error durante la extracción:', error.message);
        process.exit(1);
    }
})();