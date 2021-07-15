/*
Copyright 2021 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Trigger to create menu option when spreadsheet opens
function onOpen() {
  
    SpreadsheetApp.getUi().createMenu('Merchant Center')
       .addItem('Run Now', 'main')
       .addToUi()
  }
  
  // Helper function to Log results on Configuration sheet
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
  
  function main() {
   
    Log.init()
  
    // Read values from spreadsheet  
    const contentLanguage = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('ContentLanguage').getValue()
    const targetCountry = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('TargetCountry').getValue()
    const productsRange = SpreadsheetApp.getActiveSpreadsheet().getRange('Prices!A1:Z')
    
    try {
  
      const products = productsRange.getValues().filter(p => p[0] != '')
      const headers = products.shift().map(h => h.toLowerCase())
  
      var productsWithCorrectIDs = products
          .map((p, index) => index + ':' + p[0])
          .filter(id => String(id).split(':').length == 3)
      
      // Calls Merchant Center API
      var productsInformation = retrieveProductsInformation(productsWithCorrectIDs, contentLanguage, targetCountry)
      
      // Bind header names to indexes
      const indexes = {
        'title': headers.indexOf('title'),
        'price': headers.indexOf('price'),
        'image': headers.indexOf('image')
      }
      
      // Write data to each product field
      Object.keys(productsInformation).forEach(i => {
        
        var product = products[i]
        var price = productsInformation[i]
        
        if (product) {
          product[indexes['title']] = price['title']
          product[indexes['price']] = price['price']
          product[indexes['image']] = price['image']
        }
      })
      
      // Save all product data to spreadsheet
      productsRange.offset(1, 0, products.length).setValues(products)
      
      Log.output('Price Tracker ran successfully')
      
    } catch(e) {
      Log.output(e)
    }
  }