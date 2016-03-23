'use strict';

class LocalStorageInputSource extends CachedSequence {

    constructor(key) {
        if (!key) throw new Error("Local storage key required");
        let existingInputs = JSON.parse(localStorage.getItem(key)) || [];
        super(existingInputs);
        this._key = key;
    }

    add(input, type) {
        let inputArray =  _.isArray(input) ? input : [input];

        super.add(inputArray.map( it => ({type, data: it}) ));
        try {
            localStorage.setItem(this._key, JSON.stringify(this.value));
        } catch (e) {
            console.error('Could not save inputs', e.message);
        }
    }

    inputsOfType(type) {
        return this.filter( it => it.type == type).map( it => it.data );
    }
}