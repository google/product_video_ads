var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1YmzveYJqxkPczv9tp2PqTVMZSZB_J0lFKLHQmU_XEZk/edit'
var SHEET_NAME = 'Campaigns'
var SLEEP_TIME_SECONDS = 60
var ACCOUNTS_LIMIT = 50

function main() {
  
  // It will run processAccount (for each account) for a total of 30 minutes
  // After that, will run finalize as MCC for another 30 minutes
  AdsManagerApp.accounts()
    .withLimit(ACCOUNTS_LIMIT)
    .executeInParallel('processAccount', 'finalize')
}
