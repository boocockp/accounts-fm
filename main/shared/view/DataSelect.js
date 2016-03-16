'use strict';

var DataSelectProto = Object.create(HTMLSelectElement.prototype, {
    items: attributePropertyDef('items'),
    optionValue: attributePropertyDef('optionValue'),
    optionLabel: attributePropertyDef('optionLabel')
});

DataSelectProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.items.onChange(() => this.innerHTML = this.html());
};

DataSelectProto.html = function () {
    let itemToOption = (a => {
        let item = a.value;
        return `<option value="${_.get(item, this.optionValue)}">${_.get(item, this.optionLabel)}</option>`
    }).bind(this);

    let dataOptions = this.items.map(itemToOption).join('\n').value;
    return dataOptions;
};

var DataSelect = document.registerElement('data-select', {prototype: DataSelectProto, extends: 'select'});
