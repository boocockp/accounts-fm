'use strict';

let DEBIT = 'DR';
let CREDIT = 'CR';

class GeneralLedger {


    constructor(accountInputsStore, transactionInputsStore) {
        this.lastId = 1000;
        this.accountInputsStore = accountInputsStore;
        this.transactionInputsStore = transactionInputsStore;

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
        let withId = this.withId.bind(this), mergeProperties = this.mergeProperties;

        let accountInputs = new DataSequence();
        let transactionInputs = new DataSequence();

        let accountInputsWithErrors = accountInputs.map(a => {
            let errors = {};
            if (!a.name) {
                errors.name = 'Required';
            }

            return { data: a, errors: errors };
        });

        let accountInputsValid = accountInputsWithErrors.filter(a => _.isEmpty(a.errors)).map( a => a.data );

        accountInputsValid.onChange( a => this.accountInputsStore.add(a));
        transactionInputs.onChange( a => this.transactionInputsStore.add(a));

        let accountDetails = this.accountInputsStore.map( withId);
        let transactions = this.transactionInputsStore.map( withId);

        let accountIds = accountDetails.property('id').distinct();

        let hasPostingFor = (transaction, accountId) => _.some(transaction.postings, p => p.accountId == accountId);
        let hasDebitPostingFor = (transaction, accountId) => _.some(transaction.postings, p => p.type == DEBIT && p.accountId == accountId);
        let hasCreditPostingFor = (transaction, accountId) => _.some(transaction.postings, p => p.type == CREDIT && p.accountId == accountId);

        let debitTotalFor = (transaction, accountId) =>_.chain(transaction.postings).filter( p => p.type == DEBIT && p.accountId == accountId).map( p => p.amount).sum();
        let creditTotalFor = (transaction, accountId) =>_.chain(transaction.postings).filter( p => p.type == CREDIT && p.accountId == accountId).map( p => p.amount).sum();

        let accountInfo = accountId =>  accountDetails.filterBy('id', accountId).reduce(mergeProperties, {});

        let accountSummary = accountId => {
            let details = accountDetails.filterBy('id', accountId).reduce(mergeProperties, {});
            let accountTransactions = transactions.filter( t => hasPostingFor(t, accountId));
            let debitTransactions = accountTransactions.filter( t => hasDebitPostingFor(t, accountId));
            let creditTransactions = accountTransactions.filter( t => hasCreditPostingFor(t, accountId));

            let debitTotal = debitTransactions.map(t => debitTotalFor(t, accountId)).sum();
            let creditTotal = creditTransactions.map(t => creditTotalFor(t, accountId)).sum();
            return {
                id: accountId,
                details,
                accountTransactions,
                debitTransactions,
                creditTransactions,
                debitTotal,
                creditTotal,
                balance: creditTotal.minus(debitTotal)
            }
        };

        let accountInfos = accountIds.map( a => accountInfo(a));
        let accountSummaries = accountIds.map( a => accountSummary(a));
        let accountsByName = accountSummaries.sort( a => a.details.name );

        return {accountInputs, transactionInputs, accountInputsWithErrors, accountIds, accountInfos, accountSummaries, accountsByName, transactions};
    }

}


