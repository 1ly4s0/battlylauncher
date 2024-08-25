const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const dataDirectory = process.env.APPDATA || (process.platform == "darwin" ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
let stringsCache;
let isLoadingCache = false;

class Lang {
  GetLang() {
    return new Promise((resolve, reject) => {
      const langLocalStorage = localStorage.getItem("lang") ? localStorage.getItem("lang") : "en";

      if (!stringsCache && !isLoadingCache) {
        isLoadingCache = true;
        console.log("Cache doesn't exist, fetching from API...");
        fetch(`https://api.battlylauncher.com/launcher/langs/${langLocalStorage}`)
          .then(res => res.json())
          .then(data => {
            const { strings, version } = data;
            const localStorageLangVersion = localStorage.getItem("langVersion") ? localStorage.getItem("langVersion") : 0;


            if (version !== localStorageLangVersion) {
              localStorage.setItem("langVersion", version);

              if (!fs.existsSync(path.join(dataDirectory, ".battly", "battly", "launcher", "langs"))) {
                fs.mkdirSync(path.join(dataDirectory, ".battly", "battly", "launcher", "langs"), { recursive: true });
              }

              fs.writeFileSync(path.join(dataDirectory, ".battly", "battly", "launcher", "langs", `${langLocalStorage}.json`), JSON.stringify(strings), "utf8");
            }

            stringsCache = strings;
            isLoadingCache = false;
            resolve(stringsCache);
          })
          .catch(error => {
            console.error("Error fetching from API:", error);
            this.readLangFromFile(langLocalStorage, resolve, reject);
          });
      } else if (stringsCache && !isLoadingCache) {
        console.log("Cache exists, returning it...");
        console.log(stringsCache);
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

  readLangFromFile(langLocalStorage, resolve, reject) {
    fs.readFile(path.join(dataDirectory, ".battly", "battly", "launcher", "langs", `${langLocalStorage}.json`), "utf8", (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(JSON.parse(data));
    });
  }
}

module.exports = { Lang };
