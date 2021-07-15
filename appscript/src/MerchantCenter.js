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

function retrieveProductsInformation(productIds, contentLanguage, targetCountry) {
  
    // Put product ID as key for easy lookup
    var products = {}
    var requestEntries = []
    var batchMerchantIds = {}
    
    Log.output('Calling Merchant Center for products: ' + productIds)
    
    var product_id_prefix = 'online:' + contentLanguage + ':' + targetCountry + ':'
    
    // Create one batch for each product
    productIds.forEach(function(e, i) {
    
      var composed_id = e.split(':')
      
      var id = composed_id[0]
      var merchantId = composed_id[1]
      var offerId = composed_id[2]
      
      requestEntries.push({
          'batchId': id,
          'merchantId': merchantId,
          'method': 'get',
          'productId': product_id_prefix.concat(offerId)
        })
    
      // Batches of 500
      if ((i+1) % 500 == 0 || i == productIds.length-1) {
        
        Logger.log('Request to shopping API with %s products: %s', requestEntries.length, requestEntries)
        Log.output('Request to Merchant: ' + JSON.stringify(requestEntries))
        var shoppingResponse = ShoppingContent.Products.custombatch({'entries': requestEntries})
      
        Logger.log('Response from shopping API: ' + JSON.stringify(shoppingResponse).substring(0,1000))
        var entries = shoppingResponse.entries
        
        entries.forEach(function(e) {
                      
          try {
            
            var product = e.product
            
            products[e.batchId] = {
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
  
    if (!product.customAttributes)
      return undefined
    
    product.customAttributes.some(function(field) {
      if (field['name'] == name) {
        result = field['value']
        return true
      }
    })
      
    return result
  }