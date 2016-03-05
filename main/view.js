'use strict';

let transactionEntryView = (accountDetails) => {
    let accountOption = a => `<option value="${a.id}">${a.name}</option>`;
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
            <select name="posting1.type">
                <option value="DR">Debit</option>
                <option value="CR">Credit</option>
            </select>
            <input type="text" name="posting1.amount" value="">
        </div>

        <div>
            <label>Posting 2</label>
            <select name="posting2.accountId">
            ${accountOptions()}
            </select>
            <select name="posting2.type">
                <option value="DR">Debit</option>
                <option value="CR">Credit</option>
            </select>
            <input type="text" name="posting2.amount" value="">
        </div>


        <div>
            <button type="submit">Save</button>
        </div>
    </form>
    `;
} ;

let accountsTableView = (accounts) =>
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


let lastRowId = 0;
let rowHtml = (acct) => {
    let rowId = "row_" + (++lastRowId);
    return `<tr>
        <td>${acct.details.name}</td>
        <td>${acct.balance}</td>
        </tr>
        `;
};






let show = function(viewFunction, dataSequence, container) {
    dataSequence.onChange( (data) => container.innerHTML = viewFunction(data) );
};

show(accountsTableView, generalLedger.accountsByName, document.getElementById('table'));
show(transactionEntryView, generalLedger.accountInfos, document.getElementById('transactions'));
