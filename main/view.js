'use strict';


let accountsTableView = (accounts) =>
    `<table>
        <thead>
        <tr>
        <th>Name</th>
        <th>Balance</th>
        </tr>
        </thead>
        <tbody>
        ${accounts.map(function (a) {
        return rowHtml(a);
    }).join('\n')}
        </tbody>
    </table>
    `;


let lastRowId = 0;
let rowHtml = (acct) => {
    let rowId = "row_" + (++lastRowId);
    return `<tr>
        <td>${acct.details.name}</td>
        <td>${acct.balance}</td>
        </tr>
        `;
};

class TransactionEntryView {

    constructor(accountInfos) {
        this._accountInfos = accountInfos
    }

    get html() {
        this._html = this._html || new ConstantCachedSequence(`
        <h3>Transaction Entry</h3>
        <form action="">
            <div>
                <label>Date</label>
                <input type="text" name="date" value="">
            </div>
            <div>
                <label>Description</label>
                <input type="text" name="description" value="">
            </div>

            <div>
                <label>Posting 1</label>
                <select name="posting1.accountId">
                   {{accountOptions}}
                </select>
                <select name="posting1.type">
                    <option value="DR">Debit</option>
                    <option value="CR">Credit</option>
                </select>
                <input type="text" name="posting1.amount" value="">
            </div>

            <div>
                <label>Posting 2</label>
                <select name="posting2.accountId">
                    {{accountOptions}}
                </select>
                <select name="posting2.type">
                    <option value="DR">Debit</option>
                    <option value="CR">Credit</option>
                </select>
                <input type="text" name="posting2.amount" value="">
            </div>


            <div>
                <button type="submit">Save</button>
            </div>
        </form>
        `);

        return this._html;
    }

    get eventsRequired() {
        return ['change'];
    }

    get accountOptions() {
        return this._accountOptions || (this._accountOptions = new AccountOptionsView(this._accountInfos));
    }

    notifyEvent(e) {

    }
}

class AccountOptionsView {
    constructor(accountInfos) {
        this._accountInfos = accountInfos;
    }

    get html() {
        if (!this._html) {
            let accInfoToOption = a => {
                let accInfo = a.value;
                return `<option value="${accInfo.id}">${accInfo.name}</option>`
            };

            this._html = this._accountInfos.map(accInfoToOption).join('\n');
        }

        return this._html;
    }

    get eventsRequired() {
        return [];
    }

    notifyEvent(e) {

    }

}


let show = function (viewFunction, dataSequence, container) {
    dataSequence.onChange((data) => container.innerHTML = viewFunction(data));
};

show(accountsTableView, generalLedger.accountsByName, document.getElementById('table'));
//show(transactionEntryView, generalLedger.accountInfos, document.getElementById('transactions'));


function render(viewModel, container) {
    viewModel.html.onChange(function (html) {
        container.innerHTML = html;

        let placeholders = document.evaluate('//text()[contains(., "{{") and contains(., "}}")]', container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        console.log('xpath placeholders', placeholders);

        for (let i = 0; i < placeholders.snapshotLength; i++) {
            let placeholderNode = placeholders.snapshotItem(i);
            let placeholderParent = placeholderNode.parentNode;
            let placeholderName = placeholderNode.textContent.match(/\{\{ *(\w+) *\}\}/)[1];
            let placeholderViewModel = transactionEntryView[placeholderName];
            render(placeholderViewModel, placeholderParent);
        }
    })
}

let transactionEntryView = new TransactionEntryView(generalLedger.accountInfos);
render(transactionEntryView, document.getElementById('transactions'));