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
    return _.get(this.content.value, this.contentPath);
};

var DataSpan = document.registerElement('data-span', {prototype: DataSpanProto});
