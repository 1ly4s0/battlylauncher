/**
 * @author TECNO BROS
 
 */

let console_log = console.log;
let console_info = console.info;
let console_warn = console.warn;
let console_debug = console.debug;
let console_error = console.error;

let consoleOutput = '';

class logger {
    constructor(name, color) {
        this.Logger(name, color)
    }

    async Logger(name, color) {
        console.log = (value) => {
            console_log.call(console, `%c[${name}]:`, `color: ${color};`, value);
            //si es un objeto lo convierte a string
            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[LOG] ${new Date().toISOString()} - ${value}\n`;
        };

        console.info = (value) => {
            console_info.call(console, `%c[${name}]:`, `color: ${color};`, value);
            
            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[INFO] ${new Date().toISOString()} - ${value}\n`;
        };

        console.warn = (value) => {
            console_warn.call(console, `%c[${name}]:`, `color: ${color};`, value);
            
            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[WARN] ${new Date().toISOString()} - ${value}\n`;
        };

        console.debug = (value) => {
            console_debug.call(console, `%c[${name}]:`, `color: ${color};`, value);
            
            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[DEBUG] ${new Date().toISOString()} - ${value}\n`;
        };

        console.error = (value) => {
            console_error.call(console, `%c[${name}]:`, `color: ${color};`, value);
            
            if (typeof value === 'object') value = JSON.stringify(value);
            consoleOutput += `[ERROR] ${new Date().toISOString()} - ${value}\n`;
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