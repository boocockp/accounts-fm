'use strict';

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
