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

import {
  AdGroupName,
  AdGroups,
  CellValue,
  ColumnName,
  ColumnNameLax,
  columnsConditionallyOmittable,
  ConfigChecksum,
  ConfigField,
  ConfigGroup,
  ConfigTables,
  ErrorMessage,
  SheetName,
  sheetsWithBespokeHeaders,
  StatusOption,
  tableStructure,
  ValueRestriction,
  ValueRestrictionParameter,
  ValueRestrictions,
  ValueRestrictionType,
  VideoId,
} from './structure';
import { Util } from './util';

export class Sheets {
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
  constructor() {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  /**
   * Creates a sheet/tab unless it already exists.
   * @param sheetName
   * @returns
   */
  ensureSheet(sheetName: SheetName): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      console.log(`Sheet ${sheetName} already exists.`);
    } else {
      sheet = this.spreadsheet.insertSheet(sheetName);
    }
    return sheet;
  }

  /**
   * Deletes a sheet/tab if it exists.
   * @param sheetName
   */
  deleteSheet(sheetName: SheetName): void {
    const sheet = this.spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      this.spreadsheet.deleteSheet(sheet);
    }
  }

  /**
   * Removes all data from a sheet/tab except the header (first row).
   * @param sheet
   */
  clearData(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  }

  /**
   * Appends data to the end of a sheet/tab.
   * @param sheet
   * @param values
   */
  appendData(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    values: (string | number)[][]
  ): void {
    if (values.length === 0) {
      return;
    }
    sheet
      .getRange(
        sheet.getDataRange().getLastRow() + 1,
        1,
        values.length,
        values[0].length
      )
      .setValues(values);
  }

  /**
   * Gets a config value from the sheet via its named range.
   * @param group
   * @param field
   * @returns
   */
  getConfigValue(group: ConfigGroup, field: ConfigField): string {
    const rangeName = Util.buildRangeName(
      Util.getEnumKeyByValue(ConfigGroup, group)!,
      Util.getEnumKeyByValue(ConfigField, field)!
    );
    return this.spreadsheet.getRangeByName(rangeName)!.getValue();
  }

  /**
   * Sets a config value on the sheet via its named range.
   * @param group
   * @param field
   * @param value
   * @returns
   */
  setConfigValue(group: ConfigGroup, field: ConfigField, value: string) {
    const rangeName = Util.buildRangeName(
      Util.getEnumKeyByValue(ConfigGroup, group)!,
      Util.getEnumKeyByValue(ConfigField, field)!
    );
    return this.spreadsheet.getRangeByName(rangeName)!.setValue(value);
  }

  /**
   * Sets Google Sheet's native data validation to avoid an invalid config.
   * @param sheet
   * @param sheetName
   * @param columnName
   * @param columnNames
   * @param valueRestriction
   */
  setDataValidation(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    sheetName: SheetName,
    columnName: ColumnName,
    columnNames: ColumnName[],
    valueRestriction: ValueRestriction | undefined
  ): void {
    if (valueRestriction === undefined) {
      return;
    }
    const [restrictionType, restriction] = valueRestriction;
    const columnChar = Util.columnHeaderToLetter(columnNames, columnName);
    const range = sheet.getRange(`${columnChar}2:${columnChar}`);
    let validationBuilder = SpreadsheetApp.newDataValidation();
    switch (restrictionType) {
      case ValueRestrictionType.enum:
        console.log(
          `Setting enum restriction for ${columnName} in ${sheetName}.`
        );
        validationBuilder = validationBuilder.requireValueInList(
          restriction,
          true
        );
        break;
      case ValueRestrictionType.numRange:
        console.log(
          `Setting range restriction for ${columnName} in ${sheetName}.`
        );
        validationBuilder = validationBuilder.requireNumberBetween(
          restriction[ValueRestrictionParameter.min],
          restriction[ValueRestrictionParameter.max]
        );
        break;
      case ValueRestrictionType.regex:
        console.log(
          `Setting regular-expression restriction for ${columnName} in ${sheetName}.`
        );
        validationBuilder = validationBuilder.requireFormulaSatisfied(
          `=REGEXMATCH(${columnChar}2, "${restriction}")`
        );
        break;
      default:
        return; // Restriction defined that cannot be enfored in the sheet.
    }
    const rule = validationBuilder.setAllowInvalid(false).build();
    range.setDataValidation(rule);
  }

  /**
   * Checks the validity of a value given its column's rules.
   * @param valueRestrictions
   * @param columnName
   * @param value
   * @param variableHeaders
   * @returns true iff the value complies with the rules
   */
  isValueValid(
    valueRestrictions: ValueRestrictions,
    columnName: ColumnName,
    value: CellValue,
    variableHeaders: Partial<Record<SheetName, ColumnNameLax[]>>
  ): boolean {
    const valueRestriction =
      valueRestrictions.getRestrictionForColumn(columnName);
    if (valueRestriction === undefined) {
      return true;
    }
    const [restrictionType, restriction] = valueRestriction;
    switch (restrictionType) {
      case ValueRestrictionType.enum:
        return restriction.includes(value);
      case ValueRestrictionType.numRange:
        return (
          parseFloat(value) >= restriction[ValueRestrictionParameter.min] &&
          parseFloat(value) <= restriction[ValueRestrictionParameter.max]
        );
      case ValueRestrictionType.regex:
        return new RegExp(restriction).test(value);
      case ValueRestrictionType.columnNames:
        return variableHeaders[restriction as SheetName]!.includes(value);
      default:
        return true; // should never happen
    }
  }

  /**
   * Validates a table record against the applicable rules.
   * @param record
   * @param sheetName
   * @param bespokeHeaders
   * @param valueRestrictions
   * @returns an array of errors found
   */
  validate(
    record: Record<string, string>,
    sheetName: SheetName,
    bespokeHeaders: Partial<Record<SheetName, string[]>>,
    valueRestrictions: ValueRestrictions
  ): ErrorMessage[] {
    const errors: ErrorMessage[] = [];
    let omittableColumns: ColumnName[] = [];
    if (columnsConditionallyOmittable[sheetName]) {
      for (const [columnName, rules] of Object.entries(
        columnsConditionallyOmittable[sheetName]
      )) {
        if (rules[record[columnName as ColumnName]] as ColumnName[]) {
          omittableColumns = rules[record[columnName]];
        }
      }
    }
    for (const [columnName, value] of Object.entries(record)) {
      // To determine when to report an error on the value, we need to
      // exclude (negate) the other cases: it's considered fine if...
      if (
        // ...the column name is not among those predefined
        // (i.e. in the Offers table, without hard-coded limitations)
        Util.isEnumValue(columnName, ColumnName) &&
        // ...the column name among those omittable
        !omittableColumns.includes(columnName as ColumnName) &&
        // ...there is a list of bespoke headers and the column name is in that
        !(
          bespokeHeaders[sheetName] !== undefined &&
          columnName in bespokeHeaders[sheetName]
        ) &&
        // ...the potential restriction rule is fulfilled
        !this.isValueValid(
          valueRestrictions,
          columnName as ColumnName,
          value,
          bespokeHeaders
        )
      ) {
        errors.push(
          `[${sheetName}] Found invalid value "${value}" as ${columnName}.`
        );
      }
    }
    return errors;
  }

  /**
   * Read the content of the specified (or all) tabular config sheets.
   * @param sheets
   * @returns
   */
  getConfigTables(
    sheets: SheetName[] = Object.keys(tableStructure) as SheetName[]
  ): ConfigTables {
    const valueRestrictions = new ValueRestrictions();
    const bespokeHeaders: Partial<Record<SheetName, ColumnNameLax[]>> = {};
    for (const sheetName of sheetsWithBespokeHeaders) {
      bespokeHeaders[sheetName] = this.spreadsheet
        .getSheetByName(sheetName)!
        .getDataRange()
        .getValues()
        .shift() as CellValue[];
    }
    const config: ConfigTables = {};
    const errors: ErrorMessage[] = [];
    for (const sheetName of sheets) {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found.`);
      }
      let columnNames: ColumnNameLax[] = tableStructure[sheetName]!;
      if (bespokeHeaders[sheetName]) {
        columnNames = columnNames.concat(
          bespokeHeaders[sheetName].slice(columnNames.length)
        );
      }
      const data = sheet.getDataRange().getDisplayValues().slice(1);
      config[sheetName] = data.map(row => {
        const obj: Record<ColumnNameLax, CellValue> = {};
        columnNames.forEach((columnName, index) => {
          obj[columnName] = row[index];
        });
        return obj;
      });
      for (const record of config[sheetName]) {
        errors.push(
          ...this.validate(record, sheetName, bespokeHeaders, valueRestrictions)
        );
      }
    }
    if (errors.length > 0) {
      console.log('Syntactical errors:');
      console.log(errors);
      throw new Error(
        `Encountered ${errors.length} cells with the wrong content – see log.`
      );
    }
    return config;
  }

  /**
   * Gets the data of ad grops stored in the Status sheet/tab.
   * @param statusTable
   * @returns
   */
  getExistingAdGroups(statusTable: Record<ColumnName, CellValue>[]): AdGroups {
    const existingAdGroups: AdGroups = {};
    for (const [rowNumber, statusRecord] of statusTable.entries()) {
      const existingAdGroup: AdGroupName = statusRecord[ColumnName.adGroup];
      if (existingAdGroup in existingAdGroups) {
        throw new Error(`Status sheet has duplicate entries.`);
      } else {
        existingAdGroups[existingAdGroup] = {
          ...statusRecord,
          rowNumber: rowNumber + 2, // accounting for header and 0-based arrays
        };
      }
    }
    return existingAdGroups;
  }

  /**
   * Update an ad group's values in the Status sheet/tab.
   * @param existingAdGroups
   * @param statuses
   */
  updateAdGroupStatus(
    existingAdGroups: AdGroups,
    statuses: Record<AdGroupName, Partial<Record<ColumnName, CellValue>>>
  ): void {
    const columnNumbers = Util.mapValuesToIndices(
      tableStructure[SheetName.status]!,
      1
    );
    const sheet = this.spreadsheet.getSheetByName(SheetName.status)!;
    let statusRows = 1 + Object.keys(existingAdGroups).length;
    for (const [adGroup, status] of Object.entries(statuses)) {
      let row: number;
      if (existingAdGroups[adGroup] === undefined) {
        row = ++statusRows;
        sheet
          .getRange(row, columnNumbers[ColumnName.adGroup])
          .setValue(adGroup);
      } else {
        row = existingAdGroups[adGroup].rowNumber;
      }
      if (
        adGroup ===
        sheet.getRange(row, columnNumbers[ColumnName.adGroup]).getValue()
      ) {
        for (const [columnName, value] of Object.entries(status)) {
          sheet.getRange(row, columnNumbers[columnName]).setValue(value);
        }
      } else {
        throw new Error(
          `Ad group "${adGroup}" not found in alleged row ${row}.`
        );
      }
    }
  }

  /**
   * Update the info in the Status sheet/tab.
   * @param agWithErrors
   * @param agWithChecksums
   * @param agWithoutChange
   * @param existingAdGroups
   * @param folderName
   */
  logAdGroups(
    agWithErrors: Record<AdGroupName, ErrorMessage>,
    agWithChecksums: Record<AdGroupName, ConfigChecksum>,
    agWithoutChange: Record<AdGroupName, null>,
    existingAdGroups: AdGroups,
    folderName: string
  ): void {
    const statuses: Record<
      AdGroupName,
      Partial<Record<ColumnName, CellValue>>
    > = {};
    for (const [adGroup, error] of Object.entries(agWithErrors)) {
      statuses[adGroup] = {
        [ColumnName.errors]: error,
        [ColumnName.expectedStatus]: StatusOption.disabled,
      };
    }
    for (const [adGroup, checksum] of Object.entries(agWithChecksums)) {
      statuses[adGroup] = {
        [ColumnName.errors]: '',
        [ColumnName.expectedStatus]: StatusOption.enabled,
        [ColumnName.contentChecksum]: checksum,
        [ColumnName.checksumCreation]: new Date().toISOString(),
        [ColumnName.gcsFolder]: folderName,
      };
    }
    for (const adGroup of Object.keys(agWithoutChange)) {
      statuses[adGroup] = {
        [ColumnName.errors]: '',
        [ColumnName.expectedStatus]: StatusOption.enabled,
      };
    }
    this.updateAdGroupStatus(existingAdGroups, statuses);
  }

  /**
   * Register the existence of videos in the Status sheet/tab.
   * @param agWithVideoIds
   * @param existingAdGroups
   */
  logVideos(
    agWithVideoIds: Record<AdGroupName, VideoId>,
    existingAdGroups: AdGroups
  ): void {
    const statuses: Record<
      AdGroupName,
      Partial<Record<ColumnName, CellValue>>
    > = {};
    for (const [adGroup, videoId] of Object.entries(agWithVideoIds)) {
      statuses[adGroup] = {
        [ColumnName.outputVideoId]: videoId,
        [ColumnName.videoCreation]: new Date().toISOString(),
        [ColumnName.adsCreation]: '',
      };
    }
    this.updateAdGroupStatus(existingAdGroups, statuses);
  }
}
