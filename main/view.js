'use strict';


var AccountsTableProto = Object.create(HTMLElement.prototype, {
    accountSummaries: {
        get: function () {
            return this._accountSummaries;
        },
        set: function (as) {
            this._accountSummaries = as;
        }
    }
});

AccountsTableProto.attachedCallback = function () {
    let accToRow = a => {
        return `<tr>
                    <td>${a.details.value.name}</td>
                    <td>${a.balance.value}</td>
                    </tr>
                    `
    };

    let accountRows = this._accountSummaries.map(accToRow).join('\n').value;
    this.innerHTML = `<table>
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


var TransactionEntryProto = Object.create(HTMLElement.prototype, {
    accountInfos: {
        get: function () {
            return this._accountInfos;
        },
        set: function (ai) {
            this._accountInfos = ai;
        }
    },
    foo: {
        value: function () {
            alert('foo() called');
        }
    }
});

TransactionEntryProto.attachedCallback = function () {
    this.innerHTML = `
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
                <account-select account-infos="{{accountInfos}}"></account-select>
                <select name="posting1.type">
                    <option value="DR">Debit</option>
                    <option value="CR">Credit</option>
                </select>
                <input type="text" name="posting1.amount" value="">
            </div>

            <div>
                <label>Posting 2</label>
                <account-select account-infos="{{accountInfos}}"></account-select>
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
        `;
};

var TransactionEntry = document.registerElement('transaction-entry', {prototype: TransactionEntryProto});


var AccountSelectProto = Object.create(HTMLElement.prototype, {
    name: {
        get: function () {
            return this._name;
        },
        set: function (n) {
            this._name = n;
        }
    },
    accountInfos: {
        get: function () {
            let elWithData = this.parentElement;
            while (elWithData && !_.hasIn(elWithData, 'accountInfos')) {
                elWithData = elWithData.parentElement;
            }

            return elWithData && elWithData.accountInfos;
        }
    }
});

AccountSelectProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.accountInfos.onChange( () => this.innerHTML = this.html() );
};

AccountSelectProto.html = function () {
    let accInfoToOption = a => {
        let accInfo = a.value;
        return `<option value="${accInfo.id}">${accInfo.name}</option>`
    };

    let accountOptions = this.accountInfos ? this.accountInfos.map(accInfoToOption).join('\n').value : [];
    return `
                <select name="${this.name}">
                   ${accountOptions}
                </select>
        `;
};


AccountSelectProto.attributeChangedCallback = function(attrName, oldVal, newVal) {
    console.log(this.tagName, 'attributeChangedCallback', attrName, oldVal, newVal);
};

var AccountSelect = document.registerElement('account-select', {prototype: AccountSelectProto});



var transactionEntryView = new TransactionEntry();
transactionEntryView.accountInfos = generalLedger.accountInfos;
document.getElementById('transactions').appendChild(transactionEntryView);

let accountsTableView = new AccountsTable();
accountsTableView.accountSummaries = generalLedger.accountSummaries
document.getElementById('table').appendChild(accountsTableView);
