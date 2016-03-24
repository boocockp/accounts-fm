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
        this._ensureUpToDate();
        return _resolve(this._element);
    }

    get version() {
        this._ensureUpToDate();
        return this._version;
    }

    onChange(callback) {
        this._observeHandler = this._observeHandler|| new ObserveHandler(this);
        this._observeHandler.addListener(callback);
    }

    map(expr) {
        return new MapDataSequence(this, expr);
    }

    filter(condition) {
        return new FilterDataSequence(this, condition);
    }

    merge(otherSeq) {
        return new MergeDataSequence(this, otherSeq);
    }

    latest() {
        return this;
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

    _ensureUpToDate() {}
}

class FunctionalDataSequence extends DataSequence {

    constructor(sources, processElementFn) {
        super();
        this._sources = sources;
        this._processElementFn = processElementFn;
        this._sourceVersions = sources.map( () => 0 );
    }

    _ensureUpToDate() {
        this._sources.forEach( it => it._ensureUpToDate() );
        if (_.some(this._sources, (source, i) => source.version > this._sourceVersions[i] )) {
            this._element = this._processElementFn.apply(this, this._sources.map( s => s.value ));
            this._sourceVersions = this._sources.map( s => s.version );
            this._version = _.max(this._sourceVersions);
        }
    }

    _observeUpdates(handler) {
        this._sources.forEach( s => s._observeUpdates(handler) );
    }

    get _updatedElement() {
        this._ensureUpToDate();
        return this._element;
    }


}

class MapDataSequence extends FunctionalDataSequence {

    constructor(source, expr) {
        super([source], expr);
    }
}


class FilterDataSequence extends FunctionalDataSequence {

    constructor(source, condition) {
        super([source], (el) => condition(el) ? el : undefined);
    }

    _ensureUpToDate() {
        this._sources.forEach( it => it._ensureUpToDate() );
        if (_.some(this._sources, (source, i) => source.version > this._sourceVersions[i] )) {
            let newElement = this._processElementFn.apply(this, this._sources.map(s => s.value ));
            if (newElement !== undefined) {
                this._element = newElement;
                this._version++;
            }
            this._sourceVersions = this._sources.map( s => s.version );
        }
    }

}

class MergeDataSequence extends FunctionalDataSequence {

    constructor(...sources) {
        super(sources);
    }

    _ensureUpToDate() {
        this._sources.forEach( it => it._ensureUpToDate() );
        let updatedSources = _.filter(this._sources, (source, i) => source.version > this._sourceVersions[i] );
        if (updatedSources.length > 1) {
            console.error('Multiple sources updated in ', this, sources);
            throw new Error('Multiple sources updated');
        }

        if (updatedSources.length == 1) {
            let newElement = updatedSources[0].value;
            if (newElement !== undefined) {
                this._element = newElement;
                this._version++;
            }
            this._sourceVersions = this._sources.map( s => s.version );
        }
    }

}

class CombineDataSequence extends FunctionalDataSequence {

    constructor(combineFn, sources ) {
        super(sources, combineFn);
    }

    _ensureUpToDate() {
        this._sources.forEach( it => it._ensureUpToDate() );
        if (_.some(this._sources, (source, i) => source.version > this._sourceVersions[i] )) {
            let newElement = this._processElementFn.apply(this, this._sources.map(s => s.value ));
            if (newElement !== undefined) {
                this._element = newElement;
                this._version++;
            }
            this._sourceVersions = this._sources.map( s => s.version );
        }
    }

}



