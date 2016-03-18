'use strict';

var DataFormProto = Object.create(HTMLFormElement.prototype, {
    value: {
        get: function () {
            return getFormData(this);
        },
        set: function(newValue) {

        },
        enumerable: true
    }
});

var DataForm = document.registerElement('data-form', {prototype: DataFormProto, extends: 'form'});

