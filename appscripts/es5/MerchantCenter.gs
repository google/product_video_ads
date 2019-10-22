var PRODUCT_ID_PREFIX = 'online:{language}:{country}:'

function retrieveProductsInformation(spreadsheet, productIds) {
  
  const defaultMerchantId = spreadsheet.getRangeByName('MerchantCenterId').getValue()
  
  var prefix = PRODUCT_ID_PREFIX
               .replace('{language}', spreadsheet.getRangeByName('ContentLanguage').getValue())
               .replace('{country}', spreadsheet.getRangeByName('TargetCountry').getValue())
  
  // Put product ID as key for easy lookup
  var products = {}
  var requestEntries = []
  var batchMerchantIds = {}
  
  Log.output('Calling Merchant Center for products: ' + productIds)
  
  // Create one batch for each product
  productIds.forEach(function(e, i) {
  
    var composed_id = e.split(':')
    var merchantId = composed_id[composed_id.length-2]
    
    batchMerchantIds[i] = merchantId
    
    requestEntries.push({
        'batchId': i,
        'merchantId': merchantId || defaultMerchantId,
        'method': 'get',
        'productId': prefix.concat(composed_id[composed_id.length-1])
      })
  
    // Batches of 200
    if ((i+1) % 200 == 0 || i == productIds.length-1) {
      
      Logger.log('Request to shopping API with %s products: %s', requestEntries.length, requestEntries)
      Log.output('Request to Merchant: ' + JSON.stringify(requestEntries))
      var shoppingResponse = ShoppingContent.Products.custombatch({'entries': requestEntries})
    
      Logger.log('Response from shopping API: ' + JSON.stringify(shoppingResponse).substring(0,1000))
      var entries = shoppingResponse.entries
      
      entries.forEach(function(e) {
                    
        try {
          
          var product = e.product
          var productId = (batchMerchantIds[e.batchId] ? batchMerchantIds[e.batchId] + ':' : '') + product.id.replace(prefix, '')
    
          products[productId] = {
            title: get_product_title(product), 
            price: format_brazil_price(get_product_price(product)),
            image: get_product_image(product)
          }
        } catch(err) {
          Log.output(err + '\n' + JSON.stringify(shoppingResponse).substring(0,10000))
        }
    })
      
      requestEntries = []
      batchMerchantIds = {}
    }
  })
  
  return products
}

function format_brazil_price(price) {
  return 'R$ ' + price.replace(/,/g,'').replace(/\./g, ',')
}

function get_product_price(product) {

  if (product.salePrice)
    return product.salePrice.value
  
  if (product.price)
    return product.price.value
    
  return find_custom_attribute(product, 'price') || find_custom_attribute(product, 'sale price') || ''
}

function get_product_image(product) {
  if (product.imageLink)
    return product.imageLink
    
  return find_custom_attribute(product, 'image link') || ''
}

function get_product_title(product) {
  if (product.title)
    return product.title
    
  return find_custom_attribute(product, 'title') || ''
}

function find_custom_attribute(product, name) {
  
  var result = undefined
  
  product.customAttributes.some(function(field) {
    if (field['name'] == name) {
      result = field['value']
      return true
    }
  })
    
  return result
}
