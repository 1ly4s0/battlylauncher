const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const dataDirectory = process.env.APPDATA || (process.platform === "darwin" ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
let stringsCache;
let isLoadingCache = false;

class Lang {
  GetLang() {
    const readLangFromFile = (langLocalStorage) => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(dataDirectory, ".battly", "battly", "launcher", "langs", `${langLocalStorage}.json`);

        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
            console.error("Error reading language file:", err);
            return reject(err);
          }

          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (parseError) {
            console.error("Error parsing JSON file:", parseError);
            reject(parseError);
          }
        });
      });
    };

    return new Promise(async (resolve, reject) => {
      const langLocalStorage = localStorage.getItem("lang") || "en";

      if (!stringsCache && !isLoadingCache) {
        isLoadingCache = true;

        console.log("Cache doesn't exist, fetching from API...");
        if (localStorage.getItem("offline-mode") === "true") {
          try {
            const fileData = await readLangFromFile(langLocalStorage);
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
