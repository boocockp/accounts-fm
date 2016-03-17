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
    let value = this.content.value;
    return path ? _.get(value, this.contentPath) : value;
};

var DataValue = document.registerElement('data-value', {prototype: DataValueProto});
