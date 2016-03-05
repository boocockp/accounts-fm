'use strict';


class AccountsTableView {
    constructor(accountSummaries) {
        this._accountSummaries = accountSummaries;
    }

    get html() {
        if (!this._html) {
            this._html = this._html || new ConstantCachedSequence(
                    `<table>
                        <thead>
                        <tr>
                        <th>Name</th>
                        <th>Balance</th>
                        </tr>
                        </thead>
                        <tbody>
                        {{accountRows}}
                        </tbody>
                    </table>
                    `);

            return this._html;
        }
    }

    get accountRows() {
        return this._accountRows || (this._accountRows = new AccountRowsView(this._accountSummaries));
    }

    get eventsRequired() {
        return [];
    }

    notifyEvent(e) {

    }
}

class AccountRowsView {
    constructor(accountSummaries) {
        let accToRow = a => {
            return `<tr>
                    <td>${a.details.value.name}</td>
                    <td>${a.balance.value}</td>
                    </tr>
                    `
        };

        this._html = accountSummaries.map(accToRow).join('\n');
    }

    get html() {
        return this._html;
    }

    get eventsRequired() {
        return [];
    }

    notifyEvent(e) {

    }

}


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

//show(accountsTableView, generalLedger.accountsByName, document.getElementById('table'));
//show(transactionEntryView, generalLedger.accountInfos, document.getElementById('transactions'));


function render(viewModel, container) {
    viewModel.html.onChange(function (html) {
        container.innerHTML = html;

        let placeholderSnapshot = document.evaluate('.//text()[contains(., "{{") and contains(., "}}")]', container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        // console.log('xpath placeholders', placeholderSnapshot);

        let placeholderNodes = [];
        for (let i = 0; i < placeholderSnapshot.snapshotLength; i++) {
            placeholderNodes.push(placeholderSnapshot.snapshotItem(i));
        }

        placeholderNodes.forEach( n => {
            let placeholderParent = n.parentNode;
            let placeholderName = n.textContent.match(/\{\{ *(\w+) *\}\}/)[1];
            let placeholderViewModel = viewModel[placeholderName];
            render(placeholderViewModel, placeholderParent);
        });
    })
}

let transactionEntryView = new TransactionEntryView(generalLedger.accountInfos);
 let accountsTableView = new AccountsTableView(generalLedger.accountSummaries);
render(transactionEntryView, document.getElementById('transactions'));
render(accountsTableView, document.getElementById('table'));