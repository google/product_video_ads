/**

### Price Tracker App Script (part of Product Video Ads solution) ###

Here's what this script does:

1) Find new products that are being used by any configured campaign that are not price-tracked yet
2) Request fresh information about all products needed
3) Update new prices to products that have changed (and add new products too)
4) Finally, change status and currentPrice fields to all campaigns containing products with price changes

Trigger: It installs a trigger automatically to do all steps above each (1) minute

You can track all executions here: https://script.google.com/home/executions

**/

function main() {
 
  Log.init()
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  
  // Named ranges
  const productsRange = spreadsheet.getRangeByName('Products')
  const productsVideoRange = spreadsheet.getRangeByName('ProductsVideo')
  const campaignStatusRange = spreadsheet.getRangeByName('CampaignStatus')
  const currentPricesRange = spreadsheet.getRangeByName('CurrentPrices')
  
  // Any exception will be appended to output (at Configuration sheet)
  try {
     
    // Products ID with already tracked price
    var trackedProducts = productsRange.getValues().map(function(e) {
      return String(e[0])
    }).filter(function(e) {
      return e != ''
    })
    
    // Products ID being used by campaign videos
    var productsBeingUsed = findProductsBeingUsed(productsVideoRange.getValues())
    
    // Retrieve prices to all products being used
    var productsPrice = retrieveProductsInformation(spreadsheet, productsBeingUsed)
    
    Log.output('Product prices: ' + JSON.stringify(productsPrice))
    
    // Include new products being tracked to spreasheet
    var newProducts = productsBeingUsed.filter(function(e) { 
      return trackedProducts.indexOf(e) < 0
    })
    
    includeNewProducts(newProducts, trackedProducts.length, productsPrice, productsRange)
    
    // Update tracked product prices that have changed - return all updated IDs (PS: New products are NOT updated products)
    var updatedProducts = updatePrices(productsPrice, productsRange)
    
    // Update 'Status' and 'CurrentPrices' to all lines with updates 
    var updatedLines = findUpdatedLines(productsVideoRange, updatedProducts)
    
    updateStatusAndCurrentPrices(currentPricesRange, campaignStatusRange, productsVideoRange.getValues(), productsPrice, updatedLines)
    
    SpreadsheetApp.getActiveSpreadsheet().toast('Price tracker just ran successfully!');
    Log.output('Price Tracker ran successfully!')
    
  } catch(e) {
    Log.output(e)
  }
}
