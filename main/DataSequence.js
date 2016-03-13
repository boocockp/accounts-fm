'use strict';


function _resolve(o) {
    if (_.isArray(o)) {
        return o.map( _resolve );
    }

    if (o instanceof CachedSequence) {
        return o.value;
    }

    if (o instanceof DataSequence) {
        return o.value;
    }

    if (o instanceof Aggregator) {
        return o.value;
    }

    if (_.isObject(o)) {
        return _.mapValues(o, _resolve );
    }

    return o;
}

class DataSequence {

    constructor() {
        this._element = undefined;
        this._version = 0;
    }

    add(entry) {
        this._notifyBeforeAdd();
        this._element = entry;
        this._version++;
        this._notifyAfterAdd();
    }

    get value() {
        return _resolve(this._element);
    }

    get version() {
        return this._version;
    }

    onChange(callback) {
        this._observeHandler = this._observeHandler|| new ObserveHandler(this);
        this._observeHandler.addListener(callback);
    }

    _observeUpdates(handler) {
        this._updateObservers = this._updateObservers || new Set();
        this._updateObservers.add(handler);
    }

    _notifyBeforeAdd() {
        if (this._updateObservers) {
            this._updateObservers.forEach( o => o.beforeUpdates() );
        }
    }

    _notifyAfterAdd() {
        if (this._updateObservers) {
            this._updateObservers.forEach( o => o.afterUpdates() );
        }
    }

}

class FormInputSequence extends DataSequence {

    constructor(element) {
        super();
        function onSubmit(e) {
            e.preventDefault();
            this.add(e.target.value);
        }

        $(element).on('submit', onSubmit.bind(this));

    }
}
