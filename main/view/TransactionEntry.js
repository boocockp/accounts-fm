'use strict';

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
                    <select is="data-select" name="accountId" items="{{accountInfos}}" option-value="id" option-label="name"></select>
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
                    <select is="data-select" name="accountId" items="{{accountInfos}}" option-value="id" option-label="name"></select>
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
