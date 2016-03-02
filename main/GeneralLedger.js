'use strict';

let DEBIT = 'DR';
let CREDIT = 'CR';

class GeneralLedger {


    constructor() {
        this.lastId = 1000;
        this._inputs = {};
        this._listeners = [];

        _.forIn(this.buildModel(), (propFn, name) => {
            this[name] = propFn;
        })
    }

    // implementation
    input(name) {
        return this._inputs[name] || (this._inputs[name] = new CachedSequence());
    }

    addInputs(name, inputs) {
        if (!this._inputs[name]) throw new Error(`Unknown input: ${name}`);
        this._inputs[name].add(inputs);
    }

    addChangeListener(listenerFn) {
        this._listeners.push(listenerFn);
        listenerFn()
    }

    _notifyChange() {
        this._listeners.forEach( l => l() );
    }

    _inputReceived() {
        this._notifyChange();
    }

    aggregate(obj) {
        let result = {};
        _.forOwn(obj, (v, name) => {
            if (_.hasIn(v, 'value')) {
                Object.defineProperty(result, name, { enumerable: true, get: function () { return v.value; } });
            } else {
                result[name] = v;
            }
        });

        return result;
    }

    withId(obj) {
        return obj.id ? obj : Object.assign({}, obj, {id: `id_${++this.lastId}`});
    }

    mergeProperties(acc, newObj) {
        return Object.assign(acc, newObj);
    }

    // model
    buildModel() {
        let aggregate = this.aggregate, input = this.input.bind(this),
            withId = this.withId.bind(this), mergeProperties = this.mergeProperties,
            DEBIT = this.DEBIT, CREDIT = this.CREDIT;

        let accountDetails = input('accountDetails').map( withId);
        let transactions = input('transactions').map( withId);

        let accountIds = accountDetails.property('id').distinct();

        let hasPostingFor = (transaction, accountId) => _.some(transaction.postings, p => p.accountId == accountId);
        let hasDebitPostingFor = (transaction, accountId) => _.some(transaction.postings, p => p.type = DEBIT && p.accountId == accountId);
        let hasCreditPostingFor = (transaction, accountId) => _.some(transaction.postings, p => p.type = CREDIT && p.accountId == accountId);

        let debitTotalFor = (transaction, accountId) =>_.chain(transaction.postings).filter( p => p.type = DEBIT && p.accountId == accountId).map( p => p.amount).sum();
        let creditTotalFor = (transaction, accountId) =>_.chain(transaction.postings).filter( p => p.type = CREDIT && p.accountId == accountId).map( p => p.amount).sum();

        let accountSummary = accountId => {
            let details = accountDetails.filterBy('id', accountId).reduce(mergeProperties, {});
            let accountTransactions = transactions.filter( t => hasPostingFor(t, accountId));
            let debitTransactions = accountTransactions.filter( t => hasDebitPostingFor(t, accountId));
            let creditTransactions = accountTransactions.filter( t => hasCreditPostingFor(t, accountId));

            let debitTotal = debitTransactions.map(t => debitTotalFor(t, accountId)).sum();
            let creditTotal = creditTransactions.map(t => creditTotalFor(t, accountId)).sum();
            return aggregate({
                id: accountId,
                details: details,
                debitTotal: debitTotal,
                creditTotal: creditTotal,
                balance: creditTotal.minus(debitTotal)
            })
        };

        let accountSummaries = accountIds.map( a => accountSummary(a));
        let accountsByName = accountSummaries.sort( a => a.name );

        return {accountIds, accountSummaries, accountsByName};
    }

}


