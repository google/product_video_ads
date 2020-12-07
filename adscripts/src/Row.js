// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
