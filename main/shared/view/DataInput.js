'use strict';

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