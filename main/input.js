'use strict';

let accountInputs = new LocalStorageInputSource("generalLedger.accountInputs");
let transactionInputs = new LocalStorageInputSource("generalLedger.transactionInputs");

function enterAccountDetails(e) {
    e.preventDefault();
    let form = $(e.target);
    accountInputs.add({
        name: form.find("[name=name]").val()
    })
}

function enterTransaction(e) {
    e.preventDefault();
    let form = $(e.target);
    transactionInputs.add({
        date: form.find("[name=date]").val(),
        description: form.find("[name=description]").val(),
        postings: [{
            type: form.find("[name='posting1.type']").val(),
            accountId: form.find("[name='posting1.accountId']").val(),
            amount: parseFloat(form.find("[name='posting1.amount']").val())
            },
            {
                type: form.find("[name='posting2.type']").val(),
                accountId: form.find("[name='posting2.accountId']").val(),
                amount: parseFloat(form.find("[name='posting2.amount']").val())
            }
        ]
    });
}

let initPage = () => {
    $('#accountDetails').on('submit', enterAccountDetails);
    $('#transactions').on('submit', enterTransaction);
};

initPage();
