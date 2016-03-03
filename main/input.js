'use strict';

let generalLedgerInputs = new LocalStorageInputSource("generalLedger.inputs");

function enterAccountDetails(e) {
    e.preventDefault();
    let form = $(e.target);
    generalLedgerInputs.add({
        name: form.find("[name=name]").val()
    })
}

function enterTransaction(e) {
    e.preventDefault();
    let form = $(e.target);
}

let initPage = () => {
    $('#accountDetails').on('submit', enterAccountDetails);
    $('#transactions').on('submit', enterTransaction);
};

initPage();
