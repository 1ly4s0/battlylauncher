const builder = require('electron-builder')
const { productname } = require('./package.json')


builder.build({      
    config: {
        publish: [
            {
              provider: "github",
              owner: "1ly4s0",
              repo: "battlylauncher",
              releaseType: "release"
            }
        ],
        generateUpdatesFilesForAllChannels: true,
        appId: productname,
        productName: productname,
        artifactName: '${productName}-${os}-${arch}.${ext}',
        files: ["src/**/*", "package.json", "LICENSE.md"],
        directories: { "output": "dist" },
        compression: 'maximum',
        asar: true,
        //asar unpack de 7zip-bin
        asarUnpack: [
            "node_modules/7zip-bin/**/*",
            "node_modules/7zip/**/*",
            "node_modules/electron-notifications-win/**/*",
        ],
        win: {
            icon: "./src/assets/images/icon.ico",
            target: [{
                target: "nsis",
                arch: ["x64", "ia32"]
            }]
        },
        nsis: {
            oneClick: false,
            allowToChangeInstallationDirectory: true,
            createDesktopShortcut: true,
            runAfterFinish: true,
            installerLanguages: ['es'],
            multiLanguageInstaller: true,
            license: "./LICENSE.md",
        },
        
        mac: {
            icon: "./src/assets/images/icon.icns",
            category: "public.app-category.games",
            target: [{
                target: "dmg",
                arch: ["x64", "arm64"]
            }]
        },
        linux: {
            icon: "./src/assets/images/icon.png",
            target: [{
                target: "AppImage",
                arch: ["x64"]
            }, {
                target: "tar.gz",
                arch: ["x64"]
            },
            {
                target: "deb",
                arch: ["x64"]
            },
            {
                target: "rpm",
                arch: ["x64"]
            },
            {
                target: "AppImage",
                arch: ["armv7l"]
            },
            {
                target: "tar.gz",
                arch: ["armv7l"]
            },
            {
                target: "deb",
                arch: ["armv7l"]
            },
            {
                target: "rpm",
                arch: ["armv7l"]
            },
            {
                target: "flatpak",
                arch: ["x64"]
            }
        ]
        }
    }
}).then(() => {
    console.log('El build se ha realizado correctamente.')
}).catch(err => {
    console.error('Error al realizar el build', err)
})
