'use strict';

let DEBIT = 'DR';
let CREDIT = 'CR';

class GeneralLedger {


    constructor(accountInputs, transactionInputs) {
        this.lastId = 1000;
        this.accountInputs = accountInputs;
        this.transactionInputs = transactionInputs || new CachedSequence();

        _.forIn(this.buildModel(), (propFn, name) => {
            this[name] = propFn;
        })
    }

    withId(obj) {
        return obj.id ? obj : Object.assign({}, obj, {id: `id_${++this.lastId}`});
    }

    mergeProperties(acc, newObj) {
        return Object.assign(acc, newObj);
    }

    // model
    buildModel() {
        let withId = this.withId.bind(this), mergeProperties = this.mergeProperties,
            DEBIT = this.DEBIT, CREDIT = this.CREDIT;

        let accountDetails = this.accountInputs.map( withId);
        let transactions = this.transactionInputs.map( withId);

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
            return {
                id: accountId,
                details: details,
                debitTotal: debitTotal,
                creditTotal: creditTotal,
                balance: creditTotal.minus(debitTotal)
            }
        };

        let accountSummaries = accountIds.map( a => accountSummary(a));
        let accountsByName = accountSummaries.sort( a => a.details.name );

        return {accountIds, accountSummaries, accountsByName};
    }

}


