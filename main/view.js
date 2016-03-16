'use strict';

function attributePropertyDef(name) {
    let internalName = '_' + name;
    return {
        get: function () {
            if (this[internalName]) return this[internalName];

            let propertyAttr = this.getAttribute(_.kebabCase(name));
            if (!propertyAttr) return null;

            let exprMatch = propertyAttr.match(/\{\{([a-zA-Z0-9_.]+)\}\}/);
            if (!exprMatch) return propertyAttr;
            let propertyPath = exprMatch[1];
            let firstPart = propertyPath.split('.').shift();
            if (!firstPart) return null;

            let elWithData = this.parentElement;
            while (elWithData && !_.hasIn(elWithData, firstPart)) {
                elWithData = elWithData.parentElement;
            }

            if (!elWithData) elWithData = window;

            return _.get(elWithData, propertyPath);
        },
        set: function (val) {
            this[internalName] = val;
        },
        enumerable: true
    }
}

var pageStorage = [];

var storePageObject = function(obj) {
    pageStorage.push(obj);
    return pageStorage.length - 1;
};



var getFormData = function(formEl) {
    let inputs = $(formEl).find("[name]").filter(":input,form-group,form-list").filter( (i, el) => $(el).parent().closest('form-group,form-list,form').is(formEl) );
    return _.fromPairs(_.map(inputs.get(), (el) => [$(el).attr('name'), $(el).val()]));
};

var setFormData = function(formEl, data) {
    let inputs = $(formEl).find("[name]").filter(":input,form-group,form-list").filter( (i, el) => $(el).parent().closest('form-group,form-list,form').is(formEl) );
    let dataObj = data || {};
    inputs.get().forEach( (el) => {
        let inputValue = dataObj[$(el).attr('name')] || null;
        $(el).val(inputValue);
    });
};

var getFormList = function(formEl) {
    let inputs = $(formEl).find(":input,form-group,form-list").filter( (i, el) => $(el).parent().closest('form-group,form-list,form').is(formEl) );
    return _.map(inputs.get(), (el) => $(el).val());
};

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