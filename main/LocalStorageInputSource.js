'use strict';

class LocalStorageInputSource extends InputSource {

    constructor(key) {
        if (!key) throw new Error("Local storage key required");
        let existingInputs = JSON.parse(localStorage.getItem(key)) || [];
        super(existingInputs);
        this._key = key;
    }

    add(inputs) {
        super.add(inputs);
        try {
            localStorage.setItem(this._key, JSON.stringify(this._inputs));
        } catch (e) {
            console.error('Could not save inputs', e.message);
        }
    }
}