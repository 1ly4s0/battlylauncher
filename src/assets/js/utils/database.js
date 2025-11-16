const { app } = require('electron');
const Store = require('electron-store');

class Database {
    constructor() {

        this.store = new Store({ name: 'battly-data' });

        if (!this.store.has('accounts')) {
            this.store.set('accounts', []);
        }
        if (!this.store.has('verify-install')) {
            this.store.set('verify-install', false);
        }
    }

    async init() {
        this.db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('database', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const stores = [
                    'accounts', 'accounts-selected', 'java-path',
                    'java-args', 'launcher', 'profile', 'ram', 'screen',
                ];

                stores.forEach((storeName) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'key' });
                    }
                });
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });

        return this;
    }

    async performTransaction(storeName, mode, callback) {
        if (!this.db.objectStoreNames.contains(storeName)) {
            return Promise.reject(`Store '${storeName}' no existe.`);
        }

        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = callback(store);
            if (!request) return;
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async addAccount(data) {
        const accounts = this.store.get('accounts');
        accounts.push(data);
        this.store.set('accounts', accounts);
    }

    getAccounts() {
        return this.store.get('accounts');
    }

    async deleteAccount(uuid) {
        const accounts = this.store.get('accounts');
        const filtered = accounts.filter(acc => acc.uuid !== uuid);
        this.store.set('accounts', filtered);
    }

    async getAccount(uuid) {
        const accounts = this.store.get('accounts');
        return accounts.find(acc => acc.uuid === uuid) || null;
    }

    verifyInstall() {
        return this.store.get('verify-install') === true;
    }

    setVerifiedInstall(value = true) {
        this.store.set('verify-install', !!value);
    }

    async selectAccount(uuid) {
        const accounts = this.store.get('accounts');
        const selected = accounts.find(acc => acc.uuid === uuid);
        if (!selected) return null;

        this.store.set('selected-account', selected.uuid);
        return selected;
    }

    async removeAccount() {
        this.store.delete('selected-account');
        return true;
    }

    async getSelectedAccountToken() {
        const sel = await this.store.get('selected-account');
        if (!sel) return null;
        const account = await this.getAccount(sel);
        return account ? account.token : null;
    }

    async getSelectedAccount() {
        const sel = await this.store.get('selected-account');
        if (!sel) return null;
        return await this.getAccount(sel);
    }

    async add(data, type) {
        return this.performTransaction(type, 'readwrite', (store) =>
            store.add({ key: this.genKey(data.uuid), value: data })
        );
    }

    async get(keys, type) {
        return this.performTransaction(type, 'readonly', (store) =>
            store.get(this.genKey(keys))
        );
    }

    async getAll(type) {
        return this.performTransaction(type, 'readonly', (store) =>
            store.getAll()
        );
    }

    async update(data, type) {
        return this.performTransaction(type, 'readwrite', (store) => {
            const request = store.get(this.genKey(data.uuid));
            request.onsuccess = (event) => {
                const record = event.target.result;
                if (record) {
                    Object.assign(record, { value: data });
                    store.put(record);
                }
            };
        });
    }

    async delete(key, type) {
        return this.performTransaction(type, 'readwrite', (store) =>
            store.delete(this.genKey(key))
        );
    }

    genKey(uuid) {
        return uuid.split('').reduce((key, char) =>
            (((key << 5) - key) + char.charCodeAt()) & 0xFFFFFFFF
            , 0);
    }

    async updateAccount(uuid, data) {
        const accounts = this.store.get('accounts');
        const index = accounts.findIndex(acc => acc.uuid === uuid);
        if (index === -1) return false;

        accounts[index] = { ...accounts[index], ...data };
        this.store.set('accounts', accounts);
        return true;
    }
}

export default Database;