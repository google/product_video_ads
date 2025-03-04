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
  ElementType,
  SheetName,
} from './structure';

/**
 * Deletes all existing sheets and inserts a dummy.
 */
export function deleteAllSheets() {
  const sheets = new Sheets();
  const allSheets = sheets.spreadsheet.getSheets();
  sheets.ensureSheet(SheetName.dummy);
  for (let i = 0; i < allSheets.length; i++) {
    sheets.spreadsheet.deleteSheet(allSheets[i]);
  }
}

/**
 * Writes an example configuration to the sheet.
 */
export function populateConfig() {
  const sheets = new Sheets();
  const configFields: [ConfigGroup, ConfigField, string][] = [
    [ConfigGroup.merchantCenter, ConfigField.filterFeed, 'only mapped'],
  ];
  const offerFields = [ColumnName.offerId, 'Title', 'Image', 'Price'];
  const configContent = {
    [SheetName.timing]: [
      ['template.mp4', 11, 4, 1],
      ['template.mp4', 15, 5, 1],
      ['template.mp4', 20, 4, 1],
    ],
    [SheetName.placement]: [
      [
        1,
        ElementType.text,
        'Price',
        1050,
        280,
        0,
        '',
        '',
        '',
        100,
        400,
        'left',
        '#0088ff',
      ],
      [
        1,
        ElementType.image,
        'Image',
        750,
        600,
        0,
        1000,
        1000,
        '',
        '',
        '',
        '',
        '',
      ],
      [
        1,
        ElementType.text,
        'Title',
        60,
        50,
        0,
        '',
        '',
        '',
        120,
        400,
        'left',
        '#ff8800',
      ],
    ],
    [SheetName.offers]: [
      [
        1001,
        'Apples',
        'https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/apples.png',
        '€1.09',
      ],
      [
        1002,
        'Bananas',
        'https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/bananas.png',
        '€2.09',
      ],
      [
        1003,
        'Broccoli',
        'https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/broccoli.png',
        '€1.59',
      ],
      [
        1004,
        'Oranges',
        'https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/oranges.png',
        '€1.29',
      ],
      [
        1005,
        'Papayas',
        'https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/papayas.png',
        '€2.29',
      ],
      [
        1006,
        'Watermelon',
        'https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/watermelon.png',
        '€2.89',
      ],
      [
        1007,
        'Pineapple',
        'https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/pineapple.png',
        '€1.49',
      ],
      [
        1008,
        'Dragonfruits',
        'https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/dragonfruits.png',
        '€1.99',
      ],
    ],
    [SheetName.offersToAdGroups]: [
      [1001, 'Hamburg'],
      [1002, 'Hamburg'],
      [1003, 'Hamburg'],
      [1001, 'Berlin'],
      [1002, 'Berlin'],
      [1004, 'Berlin'],
    ],
    [SheetName.adGroups]: [
      [
        'Hamburg',
        'template.mp4',
        'VIDEO_RESPONSIVE',
        '',
        '',
        'https://www.google.de/',
        'Zugreifen',
        'Frische Angebote',
        'Frische Angebote Jeden Tag',
        'Lebensmittel, Ersparnisse und mehr.',
      ],
      [
        'Berlin',
        'template.mp4',
        'VIDEO_RESPONSIVE',
        '',
        '',
        'https://www.google.de/',
        'Zugreifen',
        'Jetzt Sparen',
        'Supermarkt Angebote der Woche',
        'Riesige Auswahl, kleine Preise.',
      ],
    ],
  };

  for (const [group, field, value] of configFields) {
    sheets.setConfigValue(group, field, value);
  }
  const offerSheet = sheets.spreadsheet.getSheetByName(SheetName.offers)!;
  offerSheet.getRange(1, 1, 1, offerFields.length).setValues([offerFields]);
  for (const [sheetName, values] of Object.entries(configContent)) {
    const sheet = sheets.spreadsheet.getSheetByName(sheetName)!;
    sheets.clearData(sheet);
    sheets.appendData(sheet, values);
  }
}
