'use strict';

class DriveBackedLocalStorageInputStore extends CachedSequence {

    constructor(fileStore) {
        if (!fileStore) throw new Error("fileStore required");
        super();
        this._key = `local.${fileStore.name}`;
        this._fileStore = fileStore;
        this._loadData();
    }

    add(input, type) {
        let inputArray = _.isArray(input) ? input : [input];
        super.add(inputArray.map(it => ({type, data: it})));
        this._saveData();
    }

    inputsOfType(type) {
        return this.filter(it => it.type == type).map(it => it.data);
    }

    _loadData() {
        let loaded = (data) => {
            let dataOrEmpty = data || "[]";
            this._saveInLocalStorage(dataOrEmpty);
            super.add(JSON.parse(dataOrEmpty));
        };
        let notLoaded = (err) => {
            let data = this._loadFromLocalStorage();
            super.add(JSON.parse(data));
        };
        this._loadFromFileStore().then(loaded, notLoaded);
    }

    _loadFromFileStore() {
        return this._fileStore.load().then(() => console.log('Loaded data from file store'), () => console.log('Could not load data from file store'));
    }

    _saveData() {
        let data = JSON.stringify(this.value);
        this._saveInLocalStorage(data);
        this._saveInFileStore(data);
    }

    _saveInFileStore(data) {
        return this._fileStore.save().then(() => console.log('Saved data to file store'), () => console.log('Could not save data to file store'));
    }

    _saveInLocalStorage(dataString) {
        try {
            localStorage.setItem(this._key, dataString);
        } catch (e) {
            console.error('Could not save data to local storage:', e.message);
        }
    }

    _loadFromLocalStorage() {
        let data = localStorage.getItem(this._key);
        if (!data) {
            console.error('Data not found in local storage:', e.message);
        }

        return data;
    }
}