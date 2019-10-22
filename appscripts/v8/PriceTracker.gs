// Return all unique product IDs being used by all campaigns on 'Campaign' sheet
function findProductsBeingUsed(productsVideo) { 
  
  var productsBeingUsed = new Set()
  
  productsVideo.forEach(e => {
  
      var productId = e[0]
    
      if (productId == '')
        return
                  
      String(productId).split(',')
        .forEach(
          s => productsBeingUsed.add(s.trim())
        )                  
  })

  return [...productsBeingUsed]
}

// Include new poducts to 'Prices' sheet
function includeNewProducts(untrackedProducts, trackedProductsLength, productsPrice, productsRange) {

  var row = trackedProductsLength
  var productsValues = productsRange.getValues()
  
  untrackedProducts.forEach(function(id) {
    productsValues[row++] = [id, ...Object.values(productsPrice[id])]
  })
  
  productsRange.setValues(productsValues)
}

// Update all values to products with price change on 'Price' sheet
// Returns a list of product IDs that have changed in price
function updatePrices(productsPrice, productsRange) {

  var updatedProducts = []
  var products = productsRange.getValues()
  
  for (var row = 0; row < products.length; row++) {
    
    var id = products[row][0]
    var price = products[row][2]
    
    if (id == '' || !productsPrice[id])
      break
      
    if (price != productsPrice[id].price) {
      products[row] = [id, ...Object.values(productsPrice[id])]
      updatedProducts.push(String(id))
    }
  }
  
  productsRange.setValues(products)
  
  return updatedProducts
}

// Helper to find all rows in 'Campaigns' sheet which have products
// with price changes
function findUpdatedLines(productsVideoRange, updatedProducts) {

  var productLines = {}
  
  // Populate productLines mapping products and trix lines
  productsVideoValues = productsVideoRange.getValues()
  
  for (var row = 0; row < productsVideoValues.length; row++) {
    
    productIds = productsVideoValues[row][0]
    
    if (productIds == '')
      break
    
    String(productIds).split(',').forEach(function(e) {
      
      if (!productLines[e.trim()])
        productLines[e.trim()] = []
        
      productLines[e.trim()].push(row)
    })
  }
  
  const updatedLines = new Set()
  
  // Find updated lines
  updatedProducts.forEach(e => {
    
     const rows = productLines[e]            
      
     if (rows)
       rows.forEach(r => updatedLines.add(r))
  })
  
  return updatedLines
}

// Update 'CurrentPrices' and 'Status' accordingly
function updateStatusAndCurrentPrices(currentPricesRange, campaignStatusRange, productsInUse, trackedProductsPrice, updatedLines) {

  var currentPricesValues = currentPricesRange.getValues()
  var campaignStatusValues = campaignStatusRange.getValues()
  
  // Go throgh all lines
  for (var row = 0; row < productsInUse.length; row++) {
    
    const status = campaignStatusValues[row][0]
   
    // Line has changed prices or it's a new line
    if (updatedLines.has(row) || status == 'On') {
    
      // Update current prices
      currentPricesValues[row][0] = String(productsInUse[row][0])
        .split(',')
        .filter(f => f.trim() != '')
        .map(u => trackedProductsPrice[u.trim()].price)
        .join(',')

      // Status is now Products Ready (to new lines) or Price Changed
        campaignStatusValues[row][0] = (status == 'On' ? 'Products Ready' : (status == 'Not Started' ? status : 'Price Changed'))
     }
  } 
  
  currentPricesRange.setValues(currentPricesValues)
  campaignStatusRange.setValues(campaignStatusValues)
}
