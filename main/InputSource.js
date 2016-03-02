'use strict';

class InputSource {

    constructor(initialInputs) {
        this._inputs = initialInputs || [];
        this._listeners = [];
    }

    get latest() { return _.last(this._inputs); }

    add(inputs) {
        this._inputs =  this._inputs.concat(inputs);
        this._notifyChange(inputs);
    }

    addListener(listenerFn) {
        this._listeners.push(listenerFn);
        listenerFn(this._inputs)
    }

    _notifyChange(inputs) {
        this._listeners.forEach( l => l(inputs) );
    }
}