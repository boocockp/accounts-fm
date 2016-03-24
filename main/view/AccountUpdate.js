var AccountUpdateProto = Object.create(HTMLElement.prototype, {
    incomingValue: attributePropertyDef('incomingValue'),
    incomingErrors: attributePropertyDef('incomingErrors'),
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
    this.incomingValue.onChange(() => {
        this.querySelector('form').value = this.incomingValue.value
    });
};

AccountUpdateProto.html = function () {
    return `<form action="" is="data-form">
        <div>
            <label>Id</label>
            <input type="text" name="id" readonly>
        </div>
        <div>
            <label>Name</label>
            <input type="text" name="name">
            <span class="error"><data-value content="{{incomingErrors}}}" content-path="errors.name"></data-value></span>
        </div>
        <div>
            <button type="submit">Save</button>
        </div>
        </form>`;
};

var AccountUpdate = document.registerElement('account-update', {prototype: AccountUpdateProto});
