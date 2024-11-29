const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const dataDirectory = process.env.APPDATA || (process.platform === "darwin" ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
let stringsCache;
let isLoadingCache = false;

class Lang {
  GetLang() {
    const readLangFromFile = (langLocalStorage) => {
      return new Promise(async (resolve, reject) => {
        console.log("loading")
        const filePath = path.join(dataDirectory, ".battly", "battly", "launcher", "langs", `${langLocalStorage}.json`);
        console.log(filePath)

        const data = await fs.readFileSync(filePath, "utf8");
        const parsedData = JSON.parse(data);
        resolve(parsedData);
      });
    };

    return new Promise(async (resolve, reject) => {
      const langLocalStorage = localStorage.getItem("lang") || "es";


      if (!stringsCache && !isLoadingCache) {
        isLoadingCache = true;

        console.log("Cache doesn't exist, fetching from API...");
        if (localStorage.getItem("offline-mode") === "true") {
          console.log("offline mode")
          console.log(langLocalStorage)
          try {
            const fileData = await readLangFromFile(langLocalStorage);
            console.log(fileData)
            stringsCache = fileData;
            isLoadingCache = false;
            resolve(stringsCache);
          } catch (error) {
            isLoadingCache = false;
            reject(error);
          }
        } else {
          fetch(`https://api.battlylauncher.com/launcher/langs/${langLocalStorage}`)
            .then(res => res.json())
            .then(data => {
              const { strings, version } = data;
              const localStorageLangVersion = localStorage.getItem("langVersion") || 0;

              if (version !== localStorageLangVersion) {
                localStorage.setItem("langVersion", version);

                const langDir = path.join(dataDirectory, ".battly", "battly", "launcher", "langs");
                if (!fs.existsSync(langDir)) {
                  fs.mkdirSync(langDir, { recursive: true });
                }

                fs.writeFileSync(path.join(langDir, `${langLocalStorage}.json`), JSON.stringify(strings), "utf8");
              }

              stringsCache = strings;
              isLoadingCache = false;
              resolve(stringsCache);
            })
            .catch(async error => {
              console.error("Error fetching from API:", error);
              try {
                const fileData = await readLangFromFile(langLocalStorage);
                console.log(fileData)
                resolve(fileData);
              } catch (fileError) {
                reject(fileError);
              } finally {
                isLoadingCache = false;
              }
            });
        }
      } else if (stringsCache && !isLoadingCache) {
        console.log("Cache exists, returning it...");
        resolve(stringsCache);
      } else {
        console.log("Cache is loading, waiting...");
        const interval = setInterval(() => {
          if (!isLoadingCache) {
            clearInterval(interval);
            resolve(stringsCache);
          }
        }, 100);
      }
    });
  }
}

module.exports = { Lang };
