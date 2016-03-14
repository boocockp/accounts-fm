var AccountMaintenanceProto = Object.create(HTMLElement.prototype, {
    accountInfos: attributePropertyDef('accountInfos'),
    accountIdSelected: {
        get: function () {
            return this._accountIdSelected || (this._accountIdSelected = new ChangeInputSequence(this.getElementsByTagName('account-select')));
        },
        enumerable: true
    },
    accountSelected: {
        get: function () {
            return this._accountSelected || (this._accountSelected = this.accountInfos.combine(this.accountIdSelected, (infos, id) => infos.find( (info) => info.id == id)));
        },
        enumerable: true
    }
});

AccountMaintenanceProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.innerHTML = this.html();
};

AccountMaintenanceProto.html = function () {
    return `<div id="accountDetails" class="frame">
        <div>
            <label>Select account</label>
            <account-select name="accountId" account-infos="{{accountInfos}}"></account-select>
        </div>

        <h3>Account Details</h3>
        <account-update incoming-value="{{accountSelected}}"></account-update>
    </div>`;
};

var AccountMaintenance = document.registerElement('account-maintenance', {prototype: AccountMaintenanceProto});
