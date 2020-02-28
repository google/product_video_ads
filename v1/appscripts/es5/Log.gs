var Log = {

  outputRange: undefined,
  
  init: function() {
    this.outputRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('Output')
    this.outputRange.setValue('Running on ' + new Date()) 
  },
  
  output: function(msg) {
    this.outputRange.setValue(this.outputRange.getValue() + '\n' + msg)
  }
}
