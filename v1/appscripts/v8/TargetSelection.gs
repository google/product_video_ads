function showDialog() {  
  var html = HtmlService.createHtmlOutputFromFile('dialog').setSandboxMode(HtmlService.SandboxMode.IFRAME)
  SpreadsheetApp.getUi().showSidebar(html)
}

function getValidationData() {
  
  try {
    const customer_targets = SpreadsheetApp.getActiveSpreadsheet().getRange("Target!A2:A").getValues().map((e) => e[0])
    const custom_targets = SpreadsheetApp.getActiveSpreadsheet().getRange("Target!B2:B").getValues().map((e) => e[0])
    
    return {
      'customer': customer_targets, 
      'custom': custom_targets
    }
  } catch(e) {
    return null
  }
}

function setValues(selectedValues) {
  if (selectedValues.length > 0)
    SpreadsheetApp.getActiveRange().setValue(selectedValues.join(','))
}
