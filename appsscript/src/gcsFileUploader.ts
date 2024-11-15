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
import { ConfigField, ConfigGroup } from './structure';

class GCSFileUploader {
  static async sendFile(bucket: string, accessToken: string, file: File) {
    const gcsApiUrl =
      'https:/' + // because everything after "//" is removed
      '/storage.googleapis.com/upload/storage/v1/b/' +
      `${bucket}/o?uploadType=media&name=${encodeURIComponent(file.name)}`;

    const response = await fetch(gcsApiUrl, {
      method: 'POST',
      body: file,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `${file.type}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
  }

  static async uploadSelectedFiles(bucket: string, accessToken: string) {
    const files = (
      document.getElementById('gcsFileUploader') as HTMLInputElement
    )?.files;

    if (files && files.length) {
      for (let i = 0; i < files.length; i++) {
        try {
          await GCSFileUploader.sendFile(bucket, accessToken, files[i]);
        } catch (e: unknown) {
          console.error(e);
          if (e instanceof Error) {
            alert(`❗ERROR: ${e.message}`);
          }
        }
      }

      alert('✅ Done');
    } else {
      alert('❗No files are selected.');
    }
  }
}

export const showGCSFileUploader = () => {
  const sheets = new Sheets();
  const storageBucket = sheets.getConfigValue(
    ConfigGroup.googleCloud,
    ConfigField.storageBucket
  );
  const html = `
    <script>${GCSFileUploader.toString()}</script>
    <style>body { font-family: sans-serif; }</style>
    <div>
        <label for="file">Select the files to upload:</label>
        <input id="gcsFileUploader" type="file" multiple="multiple" />
    </div>
    <div style="margin-top: 20px;">
        <button
            style="background-color:lightblue; border-color: darkblue; border-radius: 5px;"
            type="button"
            onClick="GCSFileUploader.uploadSelectedFiles('${storageBucket}', '${ScriptApp.getOAuthToken()}')"
        >
            Upload to GCS bucket "${storageBucket}"
        </button>
    </div>
  `;
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(300);

  SpreadsheetApp.getUi().showModelessDialog(
    htmlOutput,
    'Upload to Google Cloud Storage'
  );
};
