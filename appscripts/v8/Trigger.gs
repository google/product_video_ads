// Function to install trigger to check prices every minute
function installTrigger() {

  const triggers = ScriptApp.getProjectTriggers()
  
  if (triggers.length > 0)
    return SpreadsheetApp.getActiveSpreadsheet().toast('Trigger every 5 minutes is already installed!')
  
  ScriptApp.newTrigger('main')
      .timeBased()
      .everyMinutes(5)
      .create()
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Trigger to run every 5 minutes installed successfully!');
}

// Show menu options when opening spreadsheet
function onOpen() {
  
  SpreadsheetApp.getUi().createMenu('Price Tracker')
     .addItem('Install price tracker', 'installTrigger')
     .addToUi()
  
  SpreadsheetApp.getUi().createMenu('Targets')
  .addItem('Select Target for cell', 'showDialog')
  .addToUi()
}
