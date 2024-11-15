/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Sheets } from './sheetManagement';
import {
  ColumnName,
  ConfigField,
  ConfigGroup,
  SheetName,
  tableStructure,
} from './structure';
import { Util } from './util';

type ProductFilter = (
  product: GoogleAppsScript.ShoppingContent.Product
) => boolean;

type ProductsProcessor = (
  products: GoogleAppsScript.ShoppingContent.Product[]
) => void;

/**
 * Imports feed data from Merchant Center.
 */
export function getProductsFromMerchantCenter(): void {
  const sheets = new Sheets();
  const merchantCenterId = sheets.getConfigValue(
    ConfigGroup.merchantCenter,
    ConfigField.accountId
  );
  const feedSheet = prepareFeedSheet(sheets);
  retrieveMerchantCenterFeed(
    merchantCenterId,
    productsToSheetAppender(sheets, feedSheet, productFilter(sheets))
  );
}

/**
 * Ensure a useful sheet exists to host the import from Merchant Center.
 * @param sheets
 * @returns
 */
function prepareFeedSheet(sheets: Sheets): GoogleAppsScript.Spreadsheet.Sheet {
  const existingFeedSheet = sheets.spreadsheet.getSheetByName(
    SheetName.offersFeed
  );
  let feedSheet: GoogleAppsScript.Spreadsheet.Sheet;
  if (!existingFeedSheet) {
    feedSheet = sheets.ensureSheet(SheetName.offersFeed);
    // see https://developers.google.com/shopping-content/reference/rest/v2.1/products#Product
    const defaultColumnHeaders = [
      'offerId',
      'title',
      'imageLink',
      'price.value',
      'price.currency',
    ];
    // Set and format column headers
    feedSheet
      .getRange(1, 1, 1, defaultColumnHeaders.length)
      .setValues([defaultColumnHeaders])
      .setFontWeight('bold')
      .setFontFamily('Lexend');
    feedSheet
      .autoResizeColumns(1, defaultColumnHeaders.length)
      .setFrozenRows(1);
    const columnIndices = Util.generateArray(1, defaultColumnHeaders.length);
    columnIndices.forEach(col =>
      feedSheet.setColumnWidth(col, feedSheet.getColumnWidth(col) * 1.2)
    );
  } else {
    feedSheet = existingFeedSheet;
    sheets.clearData(feedSheet);
  }
  return feedSheet;
}

/**
 * Optionally excludes some products from the feed import.
 * @param sheets
 * @returns
 */
function productFilter(sheets: Sheets): ProductFilter {
  const filterFeed: boolean =
    'only mapped' ===
    sheets.getConfigValue(ConfigGroup.merchantCenter, ConfigField.filterFeed);
  if (filterFeed) {
    const offersToAdGroupsSheet = sheets.ensureSheet(
      SheetName.offersToAdGroups
    );
    const offerIdColNum = tableStructure[SheetName.offersToAdGroups]!.findIndex(
      c => c === ColumnName.offerId
    );
    const offerIds = offersToAdGroupsSheet
      .getDataRange()
      .getValues()
      .reduce((map: Record<string, boolean>, row: string[]) => {
        map[row[offerIdColNum]] = true;
        return map;
      }, {});
    return (product: GoogleAppsScript.ShoppingContent.Product): boolean => {
      return offerIds[product.offerId] === true;
    };
  }
  return (): boolean => {
    return true;
  };
}

/**
 * Writes product info to the sheet.
 * @param sheets
 * @param feedSheet
 * @param callbackFn
 * @returns
 */
function productsToSheetAppender(
  sheets: Sheets,
  feedSheet: GoogleAppsScript.Spreadsheet.Sheet,
  callbackFn: ProductFilter
): ProductsProcessor {
  const selectedFields = feedSheet.getDataRange().getValues()[0];
  return (products: GoogleAppsScript.ShoppingContent.Product[]) => {
    const productData: string[][] = products
      .filter(callbackFn)
      .map(product =>
        selectedFields.map(name => Util.getDeepValue(product, name))
      );
    sheets.appendData(feedSheet, productData);
  };
}

/**
 * Requests product data from the Content API and writes it to the sheet.
 * @param merchantId
 * @param callbackFn
 */
function retrieveMerchantCenterFeed(
  merchantId: string,
  callbackFn: ProductsProcessor
): void {
  let pageToken;
  const maxResults = 250;
  do {
    // see https://developers.google.com/shopping-content/reference/rest/v2.1/products/list
    const products: GoogleAppsScript.ShoppingContent.ProductsListResponse =
      ShoppingContent.Products.list(merchantId, {
        pageToken: pageToken,
        maxResults: maxResults,
      });
    if (products.resources) {
      callbackFn(products.resources);
    }
    pageToken = products.nextPageToken;
  } while (pageToken);
}
