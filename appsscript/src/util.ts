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

import { ColumnName, RangeName } from './structure';

export class Util {
  /**
   * Generates a numerical array of the given integer range.
   * @param start
   * @param end
   * @returns
   */
  static generateArray(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, i) => i + start);
  }

  /**
   * Translates column headers to letters (A, B, ...) based on a mapping.
   * @param columnNames
   * @param columnName
   * @returns
   */
  static columnHeaderToLetter(
    columnNames: ColumnName[],
    columnName: ColumnName
  ): string {
    if (columnNames.length > 26) {
      throw new Error(`Cannot handle more than 26 columns on a sheet.`);
    }
    return String.fromCharCode(65 + columnNames.indexOf(columnName));
  }

  /**
   * Gets the key belonging to an enum value.
   * @param enumType
   * @param enumValue
   * @returns
   */
  static getEnumKeyByValue(
    enumType: Record<string, string>,
    enumValue: string
  ): string | undefined {
    return Object.keys(enumType).find(key => enumType[key] === enumValue);
  }

  /**
   * Converts CamelCase to lower_snake_case.
   * @param str
   * @returns
   */
  static camelCaseToSnakeCase(str: string): string {
    return str
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  /**
   * Finds an enum value's key and returns it as snake_case.
   * @param columnName
   * @returns
   */
  static deriveFieldKey(columnName: ColumnName): string {
    const key = Util.getEnumKeyByValue(ColumnName, columnName);
    if (!key) {
      throw new Error(`Unexpected column name "${columnName}".`);
    }
    return Util.camelCaseToSnakeCase(key);
  }

  /**
   * Computes a checksum of an object.
   * @param obj
   * @returns
   */
  static getChecksum(obj: object): string {
    return Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      JSON.stringify(obj)
    )
      .map(byte => (byte & 0xff).toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Checks if an array has duplicate values.
   * @param arr
   * @returns
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  static hasDuplicates(arr: any[]): boolean {
    const seen = new Set();
    for (const element of arr) {
      if (seen.has(element)) {
        return true;
      }
      seen.add(element);
    }
    return false;
  }

  /**
   * Obtains a mapping from array values to their index positions.
   * @param arr
   * @param increment
   * @returns
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  static mapValuesToIndices(
    arr: any[],
    increment: number
  ): Record<any, number> {
    const result: Record<any, number> = {};
    for (let i = 0; i < arr.length; i++) {
      result[arr[i]] = i + increment;
    }
    return result;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  /**
   * Extracts a file's name from its (Unix) path.
   * @param filenameWithPath
   * @returns
   */
  static getFilename(filenameWithPath: string): string {
    return filenameWithPath.includes('/')
      ? filenameWithPath.slice(1 + filenameWithPath.lastIndexOf('/'))
      : filenameWithPath;
  }

  /**
   * Checks if a value is valid for a specific Enum.
   * @param value
   * @param enumType
   * @returns
   */
  static isEnumValue(value: string, enumType: Record<string, string>): boolean {
    return Object.values(enumType).includes(value);
  }

  /**
   * Composes two strings in a defined way.
   * @param prefix
   * @param suffix
   * @returns
   */
  static buildRangeName(prefix: string, suffix: string): RangeName {
    return `${prefix}_${suffix}`;
  }

  /**
   * Gets a value from a nested object specified via dot notation.
   * This is a complicated way of expressing the following without "any":
   * return field.split('.').reduce((parent, key) => parent[key], obj);
   * @param obj
   * @param field
   * @returns
   */
  static getDeepValue<T>(obj: T, field: string): string {
    let pointer: unknown = obj;
    const keys = field.split('.');
    for (const key of keys) {
      if (typeof pointer !== 'object' || pointer === null) {
        throw new Error(`Object has no key "${key}".`);
      }
      const narrowedPointer = pointer as Record<string, unknown>;
      pointer = narrowedPointer[key as string];
      if (typeof pointer === 'string') {
        return pointer;
      }
    }
    throw new Error(`Object has no string at key "${field}".`);
  }

  /**
   * Generates a random (hopefully unique) string.
   * @returns
   */
  static getRandStr(): string {
    return Math.random().toString(36).slice(2);
  }
}
