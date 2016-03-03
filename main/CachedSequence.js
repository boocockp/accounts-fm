'use strict';

class CachedSequence {

    constructor(elements) {
            this._elements = (elements || []).slice()
    }

    add(entries) {
        this._notifyBeforeAdd();
        if (entries instanceof CachedSequence) {
            this._elements = this._elements.concat(entries._elements)
        } else if (_.isArray(entries)) {
            this._elements = this._elements.concat(entries)
        } else {
            this._elements = this._elements.concat([entries])
        }
        this._notifyAfterAdd();
    }

    get length() { return this._updatedElements.length }

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

    reduce(fn, acc) {
        return new ReduceAggregator(this, fn, acc);
    }

    join(sep) {
        var els = this.value;
        return els.join(sep);
    }

    get value() {
        return this._resolve(this._updatedElements);
    }

    get version() {
        return this._updatedElements.length;
    }

    onChange(callback) {
        let handler = this._observeHandler || (this._observeHandler = new ObserveHandler(this));
        handler.addListener(callback);
    }

    get _updatedElements() {
        this._ensureUpToDate();
        return this._elements;
    }

    _ensureUpToDate() {}

    _resolve(o) {
        if (_.isArray(o)) {
            return o.map( this._resolve );
        }

        if (_.isObject(o)) {
            return _.mapValues(o, function(v) {
                return _.hasIn(v, 'value') ? v.value : v;
            });
        }

        return o;
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


class FunctionalCachedSequence extends CachedSequence {

    constructor(sources, processElementsFn) {
        super([]);

        this._sources = sources;
        this._combineFn = processElementsFn;
        this._sourceIndexes = sources.map( () => 0 );
    }

    _ensureUpToDate() {
        this._sources.forEach( (source, i) => {
            let sourceElements = source._updatedElements;
            let unprocessedSourceElements = sourceElements.slice(this._sourceIndexes[i]);
            if (unprocessedSourceElements.length) {
                var elementsPlusNew = this._elements.concat(this._processNewElements(unprocessedSourceElements));
                this._elements = this._processAllElements(elementsPlusNew);
                this._sourceIndexes[i] = sourceElements.length;
            }
        });
    }

    _processNewElements(elements) {
        return this._combineFn(elements);
    }

    _processAllElements(elements) {
        return elements;
    }

    _observeUpdates(handler) {
        this._sources.forEach( s => s._observeUpdates(handler) );
    }

}

class FilterCachedSequence extends FunctionalCachedSequence {

    constructor(source, condition) {
        super([source], (els) => els.filter(condition));
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

    }

    get version() {
        throw new Error("Not implemented");
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

    combine(combineFn, ...others) {
        return new CombineAggregator(combineFn, [this].concat(...others));
    }

    plus(other) {
        let combineFn = (a, b) => a + b;
        return this.combine(combineFn, other);
    }

    minus(other) {
        let combineFn = (a, b) => a - b;
        return this.combine(combineFn, other);
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
        callback(this._observed.value);
    }

}

