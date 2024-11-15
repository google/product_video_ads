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
  ConfigField,
  ConfigGroup,
  configStructure,
  RangeName,
  SheetName,
  tableStructure,
  ValueRestrictions,
} from './structure';
import { Util } from './util';

/**
 * Create and set up the sheets/tabs needed for the application.
 */
export function initialiseSheets(): void {
  const sheets = new Sheets();
  const valueRestrictions = new ValueRestrictions();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  // Initialise config sheet(s)
  for (const [sheetName, configGroups] of Object.entries(configStructure)) {
    const sheet = sheets.ensureSheet(sheetName as SheetName);
    const values = [['Configuration', '']];
    const namedCells: Record<RangeName, number> = {};
    for (const [configGroup, configFields] of Object.entries(configGroups)) {
      const rangePrefix = Util.getEnumKeyByValue(ConfigGroup, configGroup);
      values.push(['', '']);
      values.push([configGroup, '']);
      for (const configField of configFields) {
        values.push(['', configField]);
        const rangeSuffix = Util.getEnumKeyByValue(ConfigField, configField);
        namedCells[Util.buildRangeName(rangePrefix!, rangeSuffix!)] =
          values.length;
      }
    }
    const range = sheet.getRange(`A1:B${values.length}`);
    range.setValues(values);
    for (const [rangeName, rowNumber] of Object.entries(namedCells)) {
      const range = sheet.getRange(`C${rowNumber}`);
      range.setBackground('#eeeeee');
      spreadsheet.setNamedRange(rangeName, range);
    }
    sheet
      .getRange(1, 1, values.length, 1)
      .setFontWeight('bold')
      .setFontFamily('Lexend');
    sheet.getRange(1, 1).setFontSize(14);
    sheet.setColumnWidth(1, 20);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 400);
    sheet.setHiddenGridlines(true);
  }
  // Initialise tabular sheets
  for (const [sheetName, columnNames] of Object.entries(tableStructure)) {
    const sheet = sheets.ensureSheet(sheetName as SheetName);
    // Set and format column headers
    sheet
      .getRange(1, 1, 1, columnNames.length)
      .setValues([columnNames])
      .setFontWeight('bold')
      .setFontFamily('Lexend');
    sheet.autoResizeColumns(1, columnNames.length).setFrozenRows(1);
    const columnIndices = Util.generateArray(1, columnNames.length);
    columnIndices.forEach(col =>
      sheet.setColumnWidth(col, sheet.getColumnWidth(col) * 1.2)
    );
    // Ensure data validation
    for (const columnName of columnNames) {
      const valueRestriction =
        valueRestrictions.getRestrictionForColumn(columnName);
      sheets.setDataValidation(
        sheet,
        sheetName as SheetName,
        columnName,
        columnNames,
        valueRestriction
      );
    }
  }
  sheets.deleteSheet(SheetName.dummy);
}
