const Store = require('electron-store');
module.exports = class DB {
    store = null
    constructor() {
        this.store = new Store();
    }

    saveData(key, value) {
        this.store.set(key, value);
    }

    getData(key) {
        return this.store.get(key);
    }

    deleteData(key) {
        this.store.delete(key);
    }
}