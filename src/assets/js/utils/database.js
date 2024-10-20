/**
 * @author TECNO BROS
 
 */

class database {
    async init() {
        this.db = await new Promise((resolve) => {
            let request = indexedDB.open('database', 1);

            request.onupgradeneeded = (event) => {
                let db = event.target.result;

                if (!db.objectStoreNames.contains('accounts')) {
                    db.createObjectStore('accounts', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('accounts-selected')) {
                    db.createObjectStore('accounts-selected', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('java-path')) {
                    db.createObjectStore('java-path', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('java-args')) {
                    db.createObjectStore('java-args', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('launcher')) {
                    db.createObjectStore('launcher', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('profile')) {
                    db.createObjectStore('profile', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('ram')) {
                    db.createObjectStore('ram', { keyPath: "key" });
                }

                if (!db.objectStoreNames.contains('screen')) {
                    db.createObjectStore('screen', { keyPath: "key" });
                }
            }

            request.onsuccess = (event) => {
                resolve(event.target.result);
            }
        });
        return this;
    }


    addAccount(data) {
        let actualAccounts = localStorage.getItem('accounts');

        if (actualAccounts) {
            actualAccounts = JSON.parse(actualAccounts);
            actualAccounts.push(data);
        } else {
            actualAccounts = [data];
        }

        localStorage.setItem('accounts', JSON.stringify(actualAccounts));
    }

    getAccounts() {
        let actualAccounts = localStorage.getItem('accounts');
        console.log(JSON.parse(actualAccounts));
        if (actualAccounts) {
            return JSON.parse(actualAccounts);
        } else {
            return [];
        }
    }

    deleteAccount(uuid) {
        let actualAccounts = localStorage.getItem('accounts');
        actualAccounts = actualAccounts ? JSON.parse(actualAccounts) : [];

        let newAccounts = actualAccounts.filter(account => account.uuid !== uuid);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
    }

    getAccount(uuid) {
        let actualAccounts = localStorage.getItem('accounts');
        actualAccounts = actualAccounts ? JSON.parse(actualAccounts) : [];

        return actualAccounts.find(account => account.uuid === uuid);
    }

    verifyInstall() {
        let verifyInstall = localStorage.getItem('verify-install');
        if (!verifyInstall) {
            localStorage.setItem('verify-install', false);
            return false;
        } else {
            return verifyInstall;
        }
    }

    add(data, type) {
        let store = this.getStore(type);
        return store.add({ key: this.genKey(data.uuid), value: data });
    }

    get(keys, type) {
        let store = this.getStore(type);
        if (store && typeof store.get === 'function') {
            let Key = this.genKey(keys);
            return new Promise((resolve) => {
                let get = store.get(Key);
                get.onsuccess = (event) => {
                    resolve(event.target.result);
                }
            });
        } else {
            return Promise.reject(new Error('Invalid store or missing "get" method.'));
        }
    }

    getAll(type) {
        let store = this.getStore(type);
        return new Promise((resolve) => {
            let getAll = store.getAll();
            getAll.onsuccess = (event) => {
                resolve(event.target.result);
            }
        });
    }

    update(data, type) {
        let self = this;
        return new Promise(async (resolve) => {
            let store = self.getStore(type);
            if (store && store.openCursor) {
                let keyCursor = store.openCursor(self.genKey(data.uuid));
                keyCursor.onsuccess = async (event) => {
                    let cursor = event.target.result;
                    for (let [key, value] of Object.entries({ value: data })) cursor.value[key] = value;
                    resolve(cursor.update(cursor.value));
                }
            } else {
                resolve("Object store or openCursor method not found");
            }
        });
    }


    delete(key, type) {
        let store = this.getStore(type);
        return store.delete(this.genKey(key));
    }

    getStore(type) {
        const objectStoreNames = Array.from(this.db.objectStoreNames);
        if (!objectStoreNames.includes(type)) {
            return "not found";
        }
        return this.db.transaction(type, "readwrite").objectStore(type);
    }

    genKey(int) {
        var key = 0;
        for (let c of int.split("")) key = (((key << 5) - key) + c.charCodeAt()) & 0xFFFFFFFF;
        return key;
    }
}

export default database;