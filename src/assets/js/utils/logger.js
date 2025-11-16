let console_log = console.log;
let console_info = console.info;
let console_warn = console.warn;
let console_debug = console.debug;
let console_error = console.error;

let consoleOutput = '';
import { database } from "../utils.js";

const AnalyticsHelper = require('./assets/js/utils/analyticsHelper.js');

async function initLogger() {
    // Logger initialization without analytics
    return true;
}

class logger {
    constructor(name, color) {
        let thiss = this;
        initLogger().then(() => {
            thiss.Logger(name, color)
        });
    }

    async Logger(name, color) {

        console.log = (value) => {
            console_log.call(console, `%c[${name}]:`, `color: ${color}; font-weight: bold; font-family: 'Poppins', sans-serif;`, value);

            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[LOG] ${new Date().toISOString()} - ${value}\n`;

            // Send to analytics
            AnalyticsHelper.log(AnalyticsHelper.LogLevel.INFO, value, { logger: name })
                .catch(err => console_error.call(console, 'Analytics log error:', err));
        };

        console.info = (value) => {
            console_info.call(console, `%c[${name}]:`, `color: ${color}; font-weight: bold; font-family: 'Poppins';`, value);

            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[INFO] ${new Date().toISOString()} - ${value}\n`;

            // Send to analytics
            AnalyticsHelper.log(AnalyticsHelper.LogLevel.INFO, value, { logger: name })
                .catch(err => console_error.call(console, 'Analytics log error:', err));
        };

        console.warn = (value) => {
            console_warn.call(console, `%c[${name}]:`, `color: ${color}; font-weight: bold; font-family: 'Poppins';`, value);

            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[WARN] ${new Date().toISOString()} - ${value}\n`;

            // Send to analytics
            AnalyticsHelper.log(AnalyticsHelper.LogLevel.WARN, value, { logger: name })
                .catch(err => console_error.call(console, 'Analytics log error:', err));
        };

        console.debug = (value) => {
            console_debug.call(console, `%c[${name}]:`, `color: ${color}; font-weight: bold; font-family: 'Poppins';`, value);

            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[DEBUG] ${new Date().toISOString()} - ${value}\n`;

            // Send to analytics
            AnalyticsHelper.log(AnalyticsHelper.LogLevel.DEBUG, value, { logger: name })
                .catch(err => console_error.call(console, 'Analytics log error:', err));
        };

        console.error = (value, error) => {
            console_error.call(console, `%c[${name}]:`, `color: ${color};`, value);

            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[ERROR] ${new Date().toISOString()} - ${value}\n`;

            // Send to analytics
            AnalyticsHelper.log(AnalyticsHelper.LogLevel.ERROR, value, { 
                logger: name, 
                error: error ? error.message : null 
            }).catch(err => console_error.call(console, 'Analytics log error:', err));
        };

        console.adv = (value) => {
            console_log.call(console, value[0], value[1]);

            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[ADV] ${new Date().toISOString()} - ${value}\n`;
        };
    }
}

export default logger;
export { consoleOutput };