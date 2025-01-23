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

import { deleteAllSheets, populateConfig } from './devHelpers';
import { getProductsFromMerchantCenter } from './feedImport';
import { showGCSFileUploader } from './gcsFileUploader';
import { showVideoPlacements } from './placementPreview';
import { initialiseSheets } from './sheetInitialisation';
import { uploadVideos } from './videoRegistration';
import { exportConfig } from './videoRequest';

/**
 * Adds the application menu to that of Google Sheets.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎬 Product Video Ads')
    .addSubMenu(
      ui
        .createMenu('Initialisation')
        .addItem('⚠️ Initialise sheet', initialiseSheets.name)
    )
    .addSubMenu(
      ui
        .createMenu('Testing')
        .addItem('⚠️ Remove existing sheets', deleteAllSheets.name)
        .addItem('⚠️ Populate config', populateConfig.name)
    )
    .addItem(
      'Get products from Merchant Center',
      getProductsFromMerchantCenter.name
    )
    .addItem('Upload files to GCS', showGCSFileUploader.name) // TODO(): Add after sheet initialized.
    .addItem('Preview image and text placements', showVideoPlacements.name)
    .addItem('Request video creation', exportConfig.name)
    .addItem('Upload videos to YouTube', uploadVideos.name)
    .addToUi();
};
