const Store = require('electron-store');

const store = new Store({ name: 'battly-data' });

async function getValue(key) {
    return store.get(key);
}

async function setValue(key, value) {
    store.set(key, value);
}

module.exports = {
    getValue,
    setValue,
};

