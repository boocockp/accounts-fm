'use strict';

let accountInputs = new LocalStorageInputSource("generalLedger.accountInputs");
let transactionInputs = new LocalStorageInputSource("generalLedger.transactionInputs");

var generalLedger = new GeneralLedger(accountInputs, transactionInputs);

