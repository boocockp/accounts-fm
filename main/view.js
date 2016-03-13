'use strict';

function attributePropertyDef(name) {
    let internalName = '_' + name;
    return {
        get: function () {
            if (this[internalName]) return this[internalName];

            let propertyAttr = this.getAttribute(_.kebabCase(name));
            if (!propertyAttr) return null;

            let exprMatch = propertyAttr.match(/\{\{([a-zA-Z0-9_.]+)\}\}/);
            if (!exprMatch) return propertyAttr;
            let propertyPath = exprMatch[1];
            let firstPart = propertyPath.split('.').shift();
            if (!firstPart) return null;

            let elWithData = this.parentElement;
            while (elWithData && !_.hasIn(elWithData, firstPart)) {
                elWithData = elWithData.parentElement;
            }

            if (!elWithData) elWithData = window;

            return _.get(elWithData, propertyPath);
        },
        set: function (val) {
            this[internalName] = val;
        }
    }
}


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
        return `<tr>
                    <td>${a.details.value.name}</td>
                    <td>${a.balance.value}</td>
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


var AccountUpdateProto = Object.create(HTMLElement.prototype, {
    accountDetails: {
        get: function () {
            return this.accountDetailsChanges.value;
        },
        enumerable: true
    },
    accountDetailsChanges: {
        get: function () {
            return this._accountDetails || (this._accountDetails = new FormInputSequence(this));
        },
        enumerable: true
    }
});

AccountUpdateProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.innerHTML = this.html();
};

AccountUpdateProto.html = function () {
    return `<form action="">
        <div>
        <label>Name</label>
        <input type="text" name="name" value="">
        </div>
        <div>
        <button type="submit">Save</button>
        </div>
        </form>`;
};

var AccountUpdate = document.registerElement('account-update', {prototype: AccountUpdateProto});

var TransactionEntryProto = Object.create(HTMLElement.prototype, {
    accountInfos: attributePropertyDef('accountInfos'),
    transaction: {
        get: function () {
            return this.transactionChanges.value;
        },
        enumerable: true
    },
    transactionChanges: {
        get: function () {
            return this._transaction || (this._transaction = new FormInputSequence(this));
        },
        enumerable: true
    }
});

TransactionEntryProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.innerHTML = this.html();
};

TransactionEntryProto.html = function () {
    return `
        <form action="" is="data-form">
            <div>
                <label>Date</label>
                <input type="text" name="date" value="">
            </div>
            <div>
                <label>Description</label>
                <input type="text" name="description" value="">
            </div>

            <form-list name="postings">
            <div>
                <label>Posting 1</label>
                <form-group>
                    <account-select name="accountId" account-infos="{{accountInfos}}"></account-select>
                    <select name="type">
                        <option value="DR">Debit</option>
                        <option value="CR">Credit</option>
                    </select>
                    <input is="data-input" type="number" name="amount" value="">
                </form-group>
            </div>

            <div>
                <label>Posting 2</label>
                <form-group>
                    <account-select name="accountId" account-infos="{{accountInfos}}"></account-select>
                    <select name="type">
                        <option value="DR">Debit</option>
                        <option value="CR">Credit</option>
                    </select>
                    <input is="data-input" type="number" name="amount" value="">
                </form-group>

            </div>
            </form-list>




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
            return this._name || this.getAttribute('name');
        },
        set: function (n) {
            this._name = n;
        }
    },
    value: {
        get: function () {
            return $(this).find('select').val();
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
    this.accountInfos.onChange(() => this.innerHTML = this.html());
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

AccountSelectProto.attributeChangedCallback = function (attrName, oldVal, newVal) {
    console.log(this.tagName, 'attributeChangedCallback', attrName, oldVal, newVal);
};

var AccountSelect = document.registerElement('account-select', {prototype: AccountSelectProto});

var getFormData = function(formEl) {
    let inputs = $(formEl).find("[name]").filter(":input,form-group,form-list").filter( (i, el) => $(el).parent().closest('form-group,form-list,form').is(formEl) );
    return _.fromPairs(_.map(inputs.get(), (el) => [$(el).attr('name'), $(el).val()]));
};

var getFormList = function(formEl) {
    let inputs = $(formEl).find(":input,form-group,form-list").filter( (i, el) => $(el).parent().closest('form-group,form-list,form').is(formEl) );
    return _.map(inputs.get(), (el) => $(el).val());
};

var FormGroupProto = Object.create(HTMLElement.prototype, {
    name: {
        writable: true,
        enumerable: true
    },
    value: {
        get: function () {
            return getFormData(this);
        },
        enumerable: true
    }
});

FormGroupProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    if (this.html()) this.innerHTML = this.html();
};

FormGroupProto.html = function () {};

var FormGroup = document.registerElement('form-group', {prototype: FormGroupProto});

var FormListProto = Object.create(HTMLElement.prototype, {
    name: {
        writable: true,
        enumerable: true
    },
    value: {
        get: function () {
            return getFormList(this);
        },
        enumerable: true
    }
});

var FormList = document.registerElement('form-list', {prototype: FormListProto});



var DataFormProto = Object.create(HTMLFormElement.prototype, {
    value: {
        get: function () {
            return getFormData(this);
        },
        enumerable: true
    }
});

var DataForm = document.registerElement('data-form', {prototype: DataFormProto, extends: 'form'});

var DataInputProto = Object.create(HTMLInputElement.prototype, {
    value: {
        get: function () {
            let baseValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').get.call(this);
            if (this.type == "number") {
                return parseFloat(baseValue)
            } else {
                return baseValue;
            }
        },
        enumerable: true
    }
});

var DataInput = document.registerElement('data-input', {prototype: DataInputProto, extends: 'input'});