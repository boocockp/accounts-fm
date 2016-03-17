'use strict';

var AccountsTableProto = Object.create(HTMLElement.prototype, {
    generalLedger: attributePropertyDef('generalLedger')
});

AccountsTableProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.generalLedger.accountSummaries.onChange(() => this.innerHTML = this.html());
    this.generalLedger.transactions.onChange(() => this.innerHTML = this.html());
};

AccountsTableProto.html = function () {
    let accToRow = a => {
        let detailsDataId = storePageObject(a.details);
        let balanceDataId = storePageObject(a.balance);
        return `<tr>
                    <td><data-value content="{{pageStorage.${detailsDataId}}}" content-path="name"></data-value></td>
                    <td><data-value content="{{pageStorage.${balanceDataId}}}" ></data-value></td>
                    </tr>
                    `
    };

    let accountRows = this.generalLedger.accountSummaries.map(accToRow).join('\n').value;
    return `<table>
            <thead>
            <tr>
            <th>Name</th>
            <th>Balance</th>
            </tr>
            </thead>
            <tbody>
            ${accountRows}
            </tbody>
        </table>
        `;
};

var AccountsTable = document.registerElement('accounts-table', {prototype: AccountsTableProto});
