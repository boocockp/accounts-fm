'use strict';

var pageStorage = [];

function storePageObject(obj) {
    pageStorage.push(obj);
    return pageStorage.length - 1;
}

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

function getFormData(formEl) {
    let inputs = $(formEl).find("[name]").filter(":input,form-group,form-list").filter( (i, el) => $(el).parent().closest('form-group,form-list,form').is(formEl) );
    return _.fromPairs(_.map(inputs.get(), (el) => [$(el).attr('name'), $(el).val()]));
}

function setFormData(formEl, data) {
    let inputs = $(formEl).find("[name]").filter(":input,form-group,form-list").filter( (i, el) => $(el).parent().closest('form-group,form-list,form').is(formEl) );
    let dataObj = data || {};
    inputs.get().forEach( (el) => {
        let inputValue = dataObj[$(el).attr('name')] || null;
        $(el).val(inputValue);
    });
}

function getFormList(formEl) {
    let inputs = $(formEl).find(":input,form-group,form-list").filter( (i, el) => $(el).parent().closest('form-group,form-list,form').is(formEl) );
    return _.map(inputs.get(), (el) => $(el).val());
}

