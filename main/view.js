'use strict';

let transactionEntryViewHtml = (accountDetails) => {
    let accountOption = a => `<option value="${a.id}">${a.details.name}</option>`;
    let accountOptions = () => accountDetails.map(accountOption);

    return `
    <h3>Transaction Entry</h3>
    <form action="">
        <div>
            <label>Date</label>
            <input type="text" name="date" value="">
        </div>
        <div>
            <label>Description</label>
            <input type="text" name="description" value="">
        </div>

        <div>
            <label>Posting 1</label>
            <select name="posting1.accountId">
            ${accountOptions()}
            </select>
            <input type="text" name="posting1.amount" value="">
        </div>
        <div>
            <button type="submit">Save</button>
        </div>
    </form>
    `;
} ;

let tableHtml = (accounts) =>
    `<table>
        <thead>
        <tr>
        <th>Name</th>
        <th>Balance</th>
        </tr>
        </thead>
        <tbody>
        ${accounts.map(function(a) { return rowHtml(a); }).join('\n')}
        </tbody>
    </table>
    `;


let rowHtml = (a) =>
    `<tr>
        <td>${a.details.name}</td>
        <td>${a.balance}</td>
        </tr>
        `;


let showAccountsTable = function(accounts) {
    document.getElementById('table').innerHTML = tableHtml(accounts);
};

let showTransactionEntry = function(accounts) {
    document.getElementById('transactions').innerHTML = transactionEntryViewHtml(accounts);
};

let updateViews = function(accounts) {
    showTransactionEntry(accounts);
    showAccountsTable(accounts);
};

generalLedger.accountsByName.onChange(updateViews);


