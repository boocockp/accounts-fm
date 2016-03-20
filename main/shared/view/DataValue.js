'use strict';

var DataValueProto = Object.create(HTMLElement.prototype, {
    content: attributePropertyDef('content'),
    contentPath: attributePropertyDef('contentPath')
});

DataValueProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.content.onChange(() => this.innerHTML = this.html());
};

DataValueProto.html = function () {
    let path = this.contentPath;
    let valueObject = this.content.value;
    let value = path ? _.get(valueObject, this.contentPath) : valueObject;
    let showValue = value !== undefined && value !== null;
    return showValue ? value : "";
};

var DataValue = document.registerElement('data-value', {prototype: DataValueProto});
