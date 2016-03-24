var AccountMaintenanceProto = Object.create(HTMLElement.prototype, {
    accountInfos: attributePropertyDef('accountInfos'),
    accountErrors: attributePropertyDef('accountErrors'),
    accountErrorsForThis: {
        get: function () {
            return this._accountErrorsForThis || (this._accountErrorsForThis = this.accountErrors.filter( a => {
                    return a.data.clientId == this.clientId  && a.data.actionId == this.latestActionId
                }).latest());
        },
        enumerable: true
    },
    clientId: {
        get: function () {
            return this._clientId || (this._clientId = `CL${Date.now()}`);
        },
        enumerable: true
    },
    accountIdSelected: {
        get: function () {
            return this._accountIdSelected || (this._accountIdSelected = new ChangeInputSequence(this.getElementsByTagName('select')));
        },
        enumerable: true
    },
    accountSelected: {
        get: function () {
            return this._accountSelected || (this._accountSelected = this.accountInfos.combine(this.accountIdSelected, (infos, id) => infos.find( (info) => info.id == id)));
        },
        enumerable: true
    },
    newAccount: {
        get: function () {
            return this._newAccount || (this._newAccount = new ClickInputSequence(this.querySelector('button[name="newAccount"]')).map( () => ({}) ));
        },
        enumerable: true
    },
    accountChanged: {
        get: function () {
            return this._accountChanged || (this._accountChanged = this.accountSelected.merge(this.newAccount));
        },
        enumerable: true
    },
    accountDetailsChanges: {
        get: function () {
            return this.querySelector('account-update').accountDetailsChanges.map( a => _.merge({ clientId: this.clientId, actionId: this.newActionId()}, a));
        },
        enumerable: true
    },
    latestActionId: {
        get: function () {
            return this._actionId;
        },
        enumerable: true
    }
});

AccountMaintenanceProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.innerHTML = this.html();
};

AccountMaintenanceProto.newActionId = function() {
    this._actionId = this._actionId ? this._actionId + 1 : 1;
    return this._actionId;
};

AccountMaintenanceProto.html = function () {
    return `<div id="accountDetails" class="frame">
        <div>
            <label>Select account</label>
            <select is="data-select" items="{{accountInfos}}" option-value="id" option-label="name"></select>
        </div>

        <div>
            <button type="button" name="newAccount">New Account</button>
        </div>

        <h3>Account Details</h3>
        <account-update incoming-value="{{accountChanged}}" incoming-errors="{{accountErrorsForThis}}"></account-update>
    </div>`;
};

var AccountMaintenance = document.registerElement('account-maintenance', {prototype: AccountMaintenanceProto});
