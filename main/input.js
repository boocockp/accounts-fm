'use strict';

let accountInputsStore = new LocalStorageInputSource("generalLedger.accountInputs");
let transactionInputs = new LocalStorageInputSource("generalLedger.transactionInputs");

var generalLedger = new GeneralLedger(accountInputsStore, transactionInputs);

