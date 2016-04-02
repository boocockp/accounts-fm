'use strict';

class DriveInputStore extends CachedSequence {

    constructor(fileStore) {
        if (!fileStore) throw new Error("fileStore required");
        super();
        this._fileStore = fileStore;
        fileStore.updates.onChange( (data) => {
            super.add(JSON.parse(data));
        });
    }

    add(input, type) {
        let inputArray = _.isArray(input) ? input : [input];
        super.add(inputArray.map(it => ({type, data: it})));
        this._saveData();
    }

    inputsOfType(type) {
        return this.filter(it => it.type == type).map(it => it.data);
    }

    _saveData() {
        let data = JSON.stringify(this.value);
        this._fileStore.save(data);
    }
}