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
let DEBUG = false;
let FILTER_MC_FEED = true;
const deep_value = (o, p) => p.split('.').reduce((a, v) => a[v], o);

function getProductsFromMerchantCenter() {
  FILTER_MC_FEED = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuration").getRange(11, 3).getValue();
  DEBUG = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuration").getRange(12, 3).getValue();
  let merchantCenterId = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuration").getRange(10, 3).getValue();
  let feedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feed');
  clearData(feedSheet);
  retrieveMerchantCenterFeed(merchantCenterId,
    productsToSheetAppender(feedSheet));
}

function productsToSheetAppender(feedSheet) {
  const selectedFields = feedSheet.getDataRange().getValues()[0];
  return products => {
    let productData = products
      .filter(includeProduct)
      .map(product => productToSheetRow(product, selectedFields));
    feedSheet.getRange(feedSheet.getDataRange().getLastRow() + 1, 1, productData.length, productData[0].length).setValues(productData);
  }
}

function clearData(sheet) {
  let headerValues = sheet.getDataRange().getValues()[0];
  sheet.getDataRange().clearContent();
  sheet.appendRow(headerValues);
  SpreadsheetApp.flush();
}

function productToSheetRow(product, selectedFields) {
  try {
    let sheetRow = selectedFields.map(name => deep_value(product, name));
    sheetRow.push(extractPvaId(product));
    if (DEBUG) {
      sheetRow.push(JSON.stringify(product));
    }
    return sheetRow;
  } catch (e) {
    console.log(e);
    return new Array(selectedFields.length + DEBUG ? 1 : 0);
  }
}

function includeProduct(product) {
  if (FILTER_MC_FEED) {
    return product.customAttributes && product.customAttributes.some(a => a.name == "pva id");
  } else {
    return true;
  }
}

function extractPvaId(product) {
  if (product.customAttributes) {
    let pvaIdObj = product.customAttributes.find(a => a.name == "pva id");
    if (pvaIdObj) {
      return pvaIdObj.value;
    }
  }
  return "";
}

function retrieveMerchantCenterFeed(merchantId, callbackFn) {
  let pageToken;
  let pageNum = 1;
  const maxResults = 250;//max 250
  do {
    const products = ShoppingContent.Products.list(merchantId, {
      pageToken: pageToken,
      maxResults: maxResults
    });
    console.log('Page ' + pageNum);
    if (products.resources) {
      callbackFn(products.resources);
    } else {
      console.log('No more products in account ' + merchantId);
    }
    pageToken = products.nextPageToken;
    pageNum++;
  } while (pageToken);
}


function retrieveProductsInformation(productIds, contentLanguage, targetCountry) {
  // Put product ID as key for easy lookup
  var products = {}
  var requestEntries = []
  var batchMerchantIds = {}

  Log.output('Calling Merchant Center for products: ' + productIds)

  var product_id_prefix = 'online:' + contentLanguage + ':' + targetCountry + ':'

  // Create one batch for each product
  productIds.forEach(function (e, i) {

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
    if ((i + 1) % 500 == 0 || i == productIds.length - 1) {

      Logger.log('Request to shopping API with %s products: %s', requestEntries.length, requestEntries)
      Log.output('Request to Merchant: ' + JSON.stringify(requestEntries))
      var shoppingResponse = ShoppingContent.Products.custombatch({ 'entries': requestEntries })

      Logger.log('Response from shopping API: ' + JSON.stringify(shoppingResponse).substring(0, 1000))
      var entries = shoppingResponse.entries

      entries.forEach(function (e) {

        try {

          var product = e.product

          products[e.batchId] = {
            title: get_product_title(product),
            price: format_brazil_price(get_product_price(product)),
            image: get_product_image(product)
          }
        } catch (err) {
          Log.output(err + '\n' + JSON.stringify(shoppingResponse).substring(0, 10000))
        }
      })

      requestEntries = []
      batchMerchantIds = {}
    }
  })

  return products
}

function format_brazil_price(price) {
  return 'R$ ' + price.replace(/,/g, '').replace(/\./g, ',')
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

  product.customAttributes.some(function (field) {
    if (field['name'] == name) {
      result = field['value']
      return true
    }
  })

  return result
}