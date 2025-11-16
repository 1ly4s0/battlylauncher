/**
 * @author TECNO BROS
 
 */

const pkg = require('../package.json');
let url = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url

let config = 'https://api.battlylauncher.com/v3/launcher/config-launcher/config.json';
let news = 'https://api.battlylauncher.com/v3/battlylauncher/launcher/news-launcher/news.json';
const axios = require("axios")
const https = require("https")
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const fs = require("fs");
const path = require("path");
const dataDirectory = process.env.APPDATA || (process.platform == "darwin" ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);

class Config {
  async GetConfig() {
    try {
      if (!fs.existsSync(path.join(`${dataDirectory}/.battly`, "battly"))) fs.mkdirSync(path.join(`${dataDirectory}/.battly`, "battly"));
      if (!fs.existsSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher"))) fs.mkdirSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher"));
      if (!fs.existsSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher"))) fs.mkdirSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher"));


      const response = await axios.get(config, { httpsAgent });

      console.log("Configuración del launcher descargada correctamente.");
      console.log(response.data);

      fs.writeFileSync(
        path.join(
          `${dataDirectory}/.battly/battly/launcher/config-launcher`,
          "config.json"
        ),
        JSON.stringify(response.data, null, 4)
      );
      return response.data;
    } catch (error) {
      let data = fs.readFileSync(
        path.join(
          `${dataDirectory}/.battly/battly/launcher/config-launcher`,
          "config.json"
        )
      );
      return JSON.parse(data.toString());
    }
  }

  async GetNews() {
    try {
      let rss = await axios.get(news, { httpsAgent })
      let news_ = await rss.data;
      fs.writeFileSync(`${dataDirectory}/.battly/battly/launcher/config-launcher/news.json`, JSON.stringify(news_, null, 4));

      return news_;
    } catch (error) {
      try {
        const data = fs.readFileSync(`${dataDirectory}/.battly/battly/launcher/config-launcher/news.json`);
        const parsedData = JSON.parse(data);

        return parsedData;
      } catch (err) {
        console.log(err);
        return Promise.reject(err);
      }
    }
  }
}

export default new Config;