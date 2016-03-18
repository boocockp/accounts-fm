'use strict';

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

