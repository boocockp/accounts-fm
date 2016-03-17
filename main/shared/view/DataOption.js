'use strict';

var DataOptionProto = Object.create(HTMLOptionElement.prototype, {
    content: attributePropertyDef('content'),
    contentPath: attributePropertyDef('contentPath')
});

DataOptionProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.content.onChange(() => this.innerHTML = this.html());
};

DataOptionProto.html = function () {
    let path = this.contentPath;
    let value = this.content.value;
    return path ? _.get(value, this.contentPath) : value;
};

var DataOption = document.registerElement('data-option', {prototype: DataOptionProto, extends: 'option'});
