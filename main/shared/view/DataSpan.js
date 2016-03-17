'use strict';

var DataSpanProto = Object.create(HTMLElement.prototype, {
    content: attributePropertyDef('content'),
    contentPath: attributePropertyDef('contentPath')
});

DataSpanProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.content.onChange(() => this.innerHTML = this.html());
};

DataSpanProto.html = function () {
    let path = this.contentPath;
    let value = this.content.value;
    return path ? _.get(value, this.contentPath) : value;
};

var DataSpan = document.registerElement('data-span', {prototype: DataSpanProto});
