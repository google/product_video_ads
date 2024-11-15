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

export class GcsApi {
  _bucket: string;
  _BASE_PATH: string;

  constructor(bucket: string) {
    this._BASE_PATH = `https://storage.googleapis.com`;
    this._bucket = bucket;
  }

  /**
   * Uploads text as a file to GCS.
   *
   * @param content
   * @param gcsPath
   * @returns
   */
  uploadFile(content: string, gcsPath: string): string {
    const url = `${this._BASE_PATH}/upload/storage/v1/b/${this._bucket}/o?uploadType=media&name=${gcsPath}`;
    const accessToken = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: content,
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (200 !== response.getResponseCode()) {
      throw new Error(`GCS: Error uploading file to ${gcsPath}`);
    }
    const result = JSON.parse(response.getContentText());
    return `https://storage.cloud.google.com/${result.bucket}/${result.name}`;
  }

  /**
   * Reads a file from GCS.
   *
   * @param fileName
   * @returns
   */
  getFile(fileName: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const url = `${this._BASE_PATH}/storage/v1/b/${this._bucket}/o/${encodeURIComponent(fileName)}?alt=media`;
    const accessToken = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (200 !== response.getResponseCode()) {
      throw new Error(`GCS: Error reading file ${fileName}`);
    }
    return response;
  }

  /**
   * Reads a file from GCS as a byte array.
   * @param fileName
   * @returns
   */
  getFileContent(fileName: string): GoogleAppsScript.Byte[] {
    return this.getFile(fileName).getContent();
  }

  /**
   * Reads a file from GCS as a string.
   * @param fileName
   * @returns
   */
  getFileContentText(fileName: string): string {
    return this.getFile(fileName).getContentText();
  }

  /**
   * Yields a list of files at the given GCS location.
   * @param path
   * @returns
   */
  listFiles(path: string = ''): GoogleCloud.Storage.Object[] {
    const matchGlob = path ? `${path}/**` : '**';
    const url = `${this._BASE_PATH}/storage/v1/b/${this._bucket}/o?matchGlob=${encodeURIComponent(matchGlob)}`;
    const accessToken = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (200 !== response.getResponseCode()) {
      throw new Error(`GCS: Error listing directory ${path}`);
    }
    const result = JSON.parse(response.getContentText());
    return (result?.items ?? []) as GoogleCloud.Storage.Object[];
  }
}
