'use strict';


class CachedSequence {

    constructor(elements) {
        this._elements = (elements || []).slice();
        this._version = this._elements.length ? 1 : 0;
    }

    add(entries) {
        let oldElementCount = this._elements.length;
        this._notifyBeforeAdd();
        if (entries instanceof CachedSequence) {
            this._elements = this._elements.concat(entries._elements)
        } else if (_.isArray(entries)) {
            this._elements = this._elements.concat(entries)
        } else {
            this._elements = this._elements.concat([entries])
        }
        if (this._elements.length > oldElementCount) {
            this._version++;
        }
        this._notifyAfterAdd();
    }

    filter(cond) {
        return new FilterCachedSequence(this, cond);
    }

    // TODO make this more efficient by saving the cached for each value sequence and updating all together on one pass
    filterBy(propertyName, value) {
        return new FilterCachedSequence(this, x => x[propertyName] == value);
    }

    map(expr) {
        return new MapCachedSequence(this, expr);
    }

    property(propertyName) {
        return new PropertyCachedSequence(this, propertyName);
    }

    distinct() {
        return new DistinctCachedSequence(this);
    }

    sort(expr) {
        return new SortCachedSequence(this, expr);
    }

    merge(otherSeq) {
        return new MergeCachedSequence(this, otherSeq);
    }

    splitBy(propertyName) {
        return new SplitByAggregator(this, propertyName);
    }

    sum() {
        this._sumAggregator = this._sumAggregator || new SumAggregator(this);
        return this._sumAggregator;
    }

    count() {
        this._countAggregator = this._countAggregator || new CountAggregator(this);
        return this._countAggregator;
    }

    latest() {
        this._latestAggregator = this._latestAggregator || new LatestAggregator(this);
        return this._latestAggregator;
    }

    reduce(fn, acc) {
        return new ReduceAggregator(this, fn, acc);
    }

    join(sep) {
        this._joinAggregator = this._joinAggregator || new JoinAggregator(this, sep);
        return this._joinAggregator;
    }

    combine(other, combineFn) {
        return new CombineDataSequence(combineFn, [this, other])
    }

    get length() { return this._updatedElements.length }

    get onlyAdds() { return true; }

    get value() {
        return _resolve(this._updatedElements);
    }

    get version() {
        this._ensureUpToDate();
        return this._version;
    }

    onChange(callback) {
        this._observeHandler = this._observeHandler|| new ObserveHandler(this);
        this._observeHandler.addListener(callback);
    }

    get _updatedElements() {
        this._ensureUpToDate();
        return this._elements;
    }

    _ensureUpToDate() {}

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


class ConstantCachedSequence extends CachedSequence {

    constructor(value) {
        super([value], x => x)
    }
}


class FunctionalCachedSequence extends CachedSequence {

    constructor(sources, processElementsFn) {
        super([]);

        this._sources = sources;
        this._processElementsFn = processElementsFn;
        this._sourceIndexes = sources.map( () => 0 );
        this._sourceVersions = sources.map( () => 0 );
    }

    _ensureUpToDate() {
            this._sources.forEach( (source, i) => {
                let sourceElements = source._updatedElements;
                let unprocessedSourceElements = sourceElements.slice(this._sourceIndexes[i]);
                if (unprocessedSourceElements.length) {
                    var elementsPlusNew = this._elements.concat(this._processNewElements(unprocessedSourceElements));
                    this._elements = this._processAllElements(elementsPlusNew);
                    this._sourceIndexes[i] = sourceElements.length;
                    this._version++;
                }
            });
    }

    _processNewElements(elements) {
        return this._processElementsFn(elements);
    }

    _processAllElements(elements) {
        return elements;
    }

    _observeUpdates(handler) {
        this._sources.forEach( s => s._observeUpdates(handler) );
    }

    get onlyAdds() { return this._sources.every( e => e.onlyAdds ); }


}

class FilterCachedSequence extends FunctionalCachedSequence {

    constructor(source, condition) {
        super([source]);
        this._condition = condition;
        this._observerWrappers = [];
        this._observerWrapperVersions = [];
        this._ourObservers = new Set();
        this._sourceVersions = this._sources.map( () => 0 );
    }

    _ensureUpToDate() {
        let sourcesChanged = _.sum(this._sources.map( s => s.version )) > _.sum(this._sourceVersions);
        let sourceContentsChanged = _.sum(this._observerWrappers.map( s => s.version )) > _.sum(this._observerWrapperVersions);
        if (!sourcesChanged && !sourceContentsChanged) {
            return;
        }

        this._sources.forEach( (source, i) => {
            let sourceElements = source._updatedElements;
            let unprocessedSourceElements = sourceElements.slice(this._sourceIndexes[i]);
            if (unprocessedSourceElements.length) {
                let newWrappers = unprocessedSourceElements.map(e => new ObserverWrapper(e));
                newWrappers.forEach( w => {
                    this._ourObservers.forEach(o => w._observeUpdates(o));
                } );
                this._observerWrappers = this._observerWrappers.concat(newWrappers);
                this._observerWrapperVersions = this._observerWrapperVersions.concat(newWrappers.map( s => s.version ));
                this._sourceIndexes[i] = sourceElements.length;
            }

            this._sourceVersions[i] = source.version;
        });

        let elements = this._processAllElements(this._observerWrappers);
        if (!_.isEqualWith(elements, this._elements, (a, b) => a === b)) {
            this._elements = elements;
            this._observerWrapperVersions = this._observerWrappers.map( s => s.version );
            this._version++;
        }

    }

    _processAllElements(elements) {
        return this._observerWrappers.filter( w => this._condition(w)).map( w => w.observed );
    }

    _observeUpdates(handler) {
        super._observeUpdates(handler);
        this._ourObservers.add(handler);
        this._observerWrappers.forEach( w => w._observeUpdates(handler));
    }

    get onlyAdds() { return false; }

}

class ObserverWrapper {

    constructor(observed) {
        this.observed = observed;
        this._observedSources = new Set();
        this._ourObservers = new Set();

        _.forOwn(observed, (v, name) => {
            if (_.hasIn(v, 'value')) {
                Object.defineProperty(this, name, { get: function () {
                    this._observe(v);
                    return v.value;
                }
                });
            } else {
                this[name] = v;
            }
        });
    }

    _observeUpdates(handler) {
        this._ourObservers.add(handler);
        this._observedSources.forEach(p => p._observeUpdates(handler));
    }

    _observe(source) {
        this._observedSources.add(source);
        this._ourObservers.forEach(o => source._observeUpdates(o) );
    }

    get version() {
        let result = 0;
        for (let s of this._observedSources) {
            result = result + s.version;
        }

        return result;
    }
}

class SortCachedSequence extends FunctionalCachedSequence {

    constructor(source, expr) {
        super([source], els => els);
        this._expr = expr;
    }

    _processAllElements(elements) {
        return _.sortBy(elements, this._expr);
    }
}

class DistinctCachedSequence extends FunctionalCachedSequence {

    constructor(source) {
        let values = new Set();
        let isNew = (v) => {
            if (values.has(v)) {
                return false;
            } else {
                values.add(v);
                return true;
            }
        };
        super([source], (els) => els.filter(isNew));
    }
}

class MapCachedSequence extends FunctionalCachedSequence {

    constructor(source, expr) {
        super([source], (els) => els.map(expr));
    }
}

class PropertyCachedSequence extends FunctionalCachedSequence {

    constructor(source, propertyName) {
        super([source], (els) => els.map( e => e[propertyName]));
    }
}

class MergeCachedSequence extends FunctionalCachedSequence {

    constructor(...sources) {
        super(sources, (els) => els );
    }
}

class Aggregator {

    constructor(sources) {
        this._sources = sources;
    }

    get version() {
        return _.sum(this._sources.map( s => s.version ));
    }

    onChange(callback) {
        this._observeHandler = this._observeHandler|| new ObserveHandler(this);
        this._observeHandler.addListener(callback);
    }

    _observeUpdates(handler) {
        this._sources.forEach( s => s._observeUpdates(handler) );
    }

}

class ReduceAggregator extends Aggregator {

    constructor(source, reduceFn, initialAcc) {
        super([source]);
        this._source = source;
        this._sourceIndex = 0;
        this._reduceFn = reduceFn;
        this._value = initialAcc;
    }

    get value() {
        this._ensureUpToDate();
        return this._value;
    }

    _ensureUpToDate() {
        let sourceElements = this._source._updatedElements;
        let unprocessedSourceElements = sourceElements.slice(this._sourceIndex);
        this._value = this._processElements(this._value, unprocessedSourceElements);
        this._sourceIndex = sourceElements.length;
    }

    _processElements(oldValue, elements) {
        return elements.reduce(this._reduceFn, oldValue);
    }
}

class SplitByAggregator extends ReduceAggregator {

    constructor(source, propertyName) {
        function split(map, value) {
            let propertyValue = value[propertyName];
            if (!propertyValue) throw new Error(`No value for property ${propertyName} in object ${value}`);
            map[propertyValue] = map[propertyValue] || source.filter( x => x[propertyName] == propertyValue )
        }
        super(source, split, []);
    }

}

class SumAggregator extends Aggregator {

    constructor(source) {
        super([source]);
        this._source = source;
        this._sourceIndex = 0;
        this._value = 0;
    }

    combine(other, combineFn) {
        return new CombineAggregator(combineFn, [this, other]);
    }

    plus(other) {
        let combineFn = (a, b) => a + b;
        return this.combine(other, combineFn);
    }

    minus(other) {
        let combineFn = (a, b) => a - b;
        return this.combine(other, combineFn);
    }

    get value() {
        this._ensureUpToDate();
        return this._value;
    }

    _ensureUpToDate() {
        let sourceElements = this._source._updatedElements;
        let unprocessedSourceElements = sourceElements.slice(this._sourceIndex);
        this._value = this._processElements(this._value, unprocessedSourceElements);
        this._sourceIndex = sourceElements.length;
    }

    _processElements(oldValue, elements) {
        return oldValue + (_.sum(elements) || 0);
    }

}

class JoinAggregator extends Aggregator {

    constructor(source, separator) {
        super([source]);
        this._separator = separator;
        this._source = source;
        this._sourceIndex = 0;
        this._value = "";
    }

    get value() {
        this._ensureUpToDate();
        return this._value;
    }

    _ensureUpToDate() {
        let sourceElements = this._source._updatedElements;
        let unprocessedSourceElements = sourceElements.slice(this._sourceIndex);
        this._value = this._processElements(this._value, unprocessedSourceElements);
        this._sourceIndex = sourceElements.length;
    }

    _processElements(oldValue, elements) {
        let newPart = elements.join(this._separator);
        return oldValue ?  oldValue + this._separator + newPart : newPart;
    }
}

class CountAggregator extends Aggregator {

    constructor(source) {
        super([source]);
        this._source = source;
        this._sourceIndex = 0;
        this._value = 0;
    }

    get value() {
        this._ensureUpToDate();
        return this._value;
    }

    _ensureUpToDate() {
        let sourceElements = this._source._updatedElements;
        let unprocessedSourceElements = sourceElements.slice(this._sourceIndex);
        this._value = this._processElements(this._value, unprocessedSourceElements);
        this._sourceIndex = sourceElements.length;
    }

    _processElements(oldValue, elements) {
        return oldValue + elements.length;
    }

}

class LatestAggregator extends Aggregator {

    constructor(source) {
        super([source]);
        this._source = source;
        this._sourceIndex = 0;
        this._value = null;
    }

    get value() {
        this._ensureUpToDate();
        return this._value;
    }

    _ensureUpToDate() {
        let sourceElements = this._source._updatedElements;
        let unprocessedSourceElements = sourceElements.slice(this._sourceIndex);
        this._value = this._processElements(this._value, unprocessedSourceElements);
        this._sourceIndex = sourceElements.length;
    }

    _processElements(oldValue, elements) {
        return _.last(elements) || this._value;
    }

}

class CombineAggregator extends Aggregator {

    constructor(combineFn, sources ) {
        super(sources);
        this._sources = sources;
        this._combineFn = combineFn;
    }

    get value() {
        let sourceValues = this._sources.map( s => s.value );
        return this._combineFn.apply(this, sourceValues);
    }

}


class ObserveHandler {

    constructor(observed) {
        this._observed = observed;
        this._listeners = [];
        observed._observeUpdates(this);
    }

    beforeUpdates() {
        this._previousVersion = this._observed.version;
    }

    afterUpdates() {
        if (this._observed.version > this._previousVersion) {
            this.notifyChange(this._observed.value);
        }
    }

    notifyChange(newValue) {
        this._listeners.forEach( l => l(newValue) );
    }

    addListener(callback) {
        this._listeners.push(callback);
        if (this._observed.value !== undefined) {
            callback(this._observed.value);
        }
    }

}

