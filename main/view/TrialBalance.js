'use strict';

var TrialBalanceProto = Object.create(HTMLElement.prototype, {
    generalLedger: attributePropertyDef('generalLedger'),
    accountsIncluded: {
        get: function () {
            return this._accountsIncluded || (this._accountsIncluded = this.generalLedger.accountSummaries.filter( a => a.balance != 0));
        },
        enumerable: true
    }

});

TrialBalanceProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.accountsIncluded.onChange(() => this.innerHTML = this.html());
};

TrialBalanceProto.html = function () {
    let accToRow = a => {
        let detailsDataId = storePageObject(a.details);
        let debitDataId = storePageObject(a.debitBalance);
        let creditDataId = storePageObject(a.creditBalance);
        return `<tr>
                    <td><data-value content="{{pageStorage.${detailsDataId}}}" content-path="name"></data-value></td>
                    <td><data-value content="{{pageStorage.${debitDataId}}}" ></data-value></td>
                    <td><data-value content="{{pageStorage.${creditDataId}}}" ></data-value></td>
                    </tr>
                    `
    };

    let accountRows = this.accountsIncluded.map(accToRow).join('\n').value;
    return `<table>
            <thead>
            <tr>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
            </tr>
            </thead>
            <tbody>
            ${accountRows}
            </tbody>
        </table>
        `;
};

var TrialBalance = document.registerElement('trial-balance', {prototype: TrialBalanceProto});
