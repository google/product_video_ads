const PRODUCT_ID_PREFIX = 'online:{language}:{country}:'

function retrieveProductsInformation(spreadsheet, productIds) {
  
  const merchantId = spreadsheet.getRangeByName('MerchantCenterId').getValue()
  
  var prefix = PRODUCT_ID_PREFIX
               .replace('{language}', spreadsheet.getRangeByName('ContentLanguage').getValue())
               .replace('{country}', spreadsheet.getRangeByName('TargetCountry').getValue())
  
  // Put product ID as key for easy lookup
  var products = {}
  var requestEntries = []
  
  // Create one batch for each product
  productIds.forEach(function(e, i) {
  
    requestEntries.push({
        'batchId': i,
        'merchantId': merchantId,
        'method': 'get',
        'productId': prefix.concat(e)
      })
  
    // Batches of 200
    if ((i+1) % 200 == 0 || i == productIds.length-1) {
      
      Logger.log('Request to shopping API with %s products: %s', requestEntries.length, requestEntries)  
      var shoppingResponse = ShoppingContent.Products.custombatch({'entries': requestEntries})
    
      Logger.log('Response from shopping API: ' + JSON.stringify(shoppingResponse).substring(0,1000))
      var entries = shoppingResponse.entries
    
      entries.forEach(e => {
                    
        try {
          var product = e.product
          var productId = product.id.replace(prefix, '')
    
          products[productId] = {
            title: product.title, 
            price: product.price ? product.price.value : '',
            image: product.imageLink
          }
        } catch(err) {Logger.log('%s: %s', err, e)}
    })
      
      requestEntries = []
    }
  })
  
  return products
}
