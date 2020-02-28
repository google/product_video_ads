function Row(row, sheet) {

  var rowRange = sheet.getRange(row, 1, 1, FIELDS.length)
  var rowData = rowRange.getValues()
  var data = {}
      
  FIELDS.forEach(function(field, index) {
  	data[field] = rowData[0][index]
  })
  
  // Class attributes
  this.row = row.toFixed(0)
  
  this.get = function(field) {
  	return data[field]
  }
  
  this.set = function(field, value) {
  	data[field] = value
    rowData[0][FIELDS.indexOf(field)] = value
  }
  
  this.save = function() {
  	rowRange.setValues(rowData)
  }
}
