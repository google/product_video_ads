function processAccount() {
  
  var currentAccount = AdsApp.currentAccount().getCustomerId()
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(SHEET_NAME)
  
  // Will run for 30 minutes then timeout
  while (true) {
    
    // Find all account IDs
    var accountIds = Util.findAccountIds(sheet)

    // Start processing line matching account ID
    for (var row = 0; row < accountIds.length; row++) {

      var accountId = accountIds[row][0]

      if (accountId == '')
        continue

      // + 2 because we need to skip header, and sheet rows start at 1 (instead of 0)
      if (accountId == currentAccount)
        processRow(new Row(row + 2, sheet))
    }

    SpreadsheetApp.flush()

    Logger.log('Processed account %s - Waiting %s seconds', currentAccount, SLEEP_TIME_SECONDS)
    Utilities.sleep(SLEEP_TIME_SECONDS * 1000)
  }
}

function processRow(row) {
  
  // Find handler based on Status
  var status = row.get('Status')
  var handler = STATUS_HANDLERS[status]
    
  if (!handler) {
    //Logger.log('Status %s is not handled to row %s', status, row.row)
    return
  }
    
  Logger.log('Handling %s to row %s', status, row.row)
  handler(row)
  
  // Persist to sheet
  row.save()
}
