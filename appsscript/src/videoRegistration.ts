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

import { GcsApi } from './gcsApi';
import { Sheets } from './sheetManagement';
import {
  AdGroupName,
  AdGroups,
  ColumnName,
  ConfigField,
  ConfigGroup,
  SheetName,
  StatusOption,
  VideoId,
} from './structure';
import { Util } from './util';
import { uploadFromGcs } from './youtubeUpload';

/**
 * Identifies the ad groups for which videos were requested but not yet found.
 * @param existingAdGroups
 * @returns
 */
function getAdGroupsPendingVideoUpload(
  existingAdGroups: AdGroups
): Record<string, AdGroupName[]> {
  const adGroupsPendingVideoUpload: Record<string, AdGroupName[]> = {};
  for (const [adGroupName, adGroupRecord] of Object.entries(existingAdGroups)) {
    if (
      adGroupRecord[ColumnName.outputVideoId] === '' &&
      adGroupRecord[ColumnName.gcsFolder] !== '' &&
      adGroupRecord[ColumnName.expectedStatus] === StatusOption.enabled
    ) {
      const folderName: string = adGroupRecord[ColumnName.gcsFolder]!;
      if (!adGroupsPendingVideoUpload[folderName]) {
        adGroupsPendingVideoUpload[folderName] = [];
      }
      adGroupsPendingVideoUpload[folderName].push(adGroupName);
    }
  }
  return adGroupsPendingVideoUpload;
}

/**
 * Seeks and stores info on video pending creation and upload.
 */
export function uploadVideos(): void {
  const sheets = new Sheets();
  const statusTable = sheets.getConfigTables([SheetName.status]);
  const existingAdGroups: AdGroups = sheets.getExistingAdGroups(
    statusTable[SheetName.status]!
  );
  const adGroupsPendingVideoUpload =
    getAdGroupsPendingVideoUpload(existingAdGroups);
  if (Object.keys(adGroupsPendingVideoUpload).length === 0) {
    return;
  }
  const storageBucket = sheets.getConfigValue(
    ConfigGroup.googleCloud,
    ConfigField.storageBucket
  );
  const gcsApi = new GcsApi(storageBucket);
  const adGroupsWithVideoIds: Record<AdGroupName, VideoId> = {};
  for (const [folderName, adGroupNames] of Object.entries(
    adGroupsPendingVideoUpload
  )) {
    const fileObjects: GoogleCloud.Storage.Object[] = gcsApi.listFiles(
      folderName
    ) as GoogleCloud.Storage.Object[];
    for (const fileObject of fileObjects) {
      const fileName = Util.getFilename(fileObject.name);
      if (fileName.endsWith('mp4')) {
        const adGroupName: AdGroupName = fileName.slice(
          0,
          fileName.lastIndexOf('.')
        ) as AdGroupName;
        if (!adGroupNames.includes(adGroupName)) {
          continue; // Name is not known as ad group.
        }
        const youtubeChannelId = sheets.getConfigValue(
          ConfigGroup.youtube,
          ConfigField.channelId
        );
        const videoData = uploadFromGcs(
          storageBucket,
          fileObject.name,
          youtubeChannelId,
          adGroupName,
          'Uploaded by PVA'
        );
        adGroupsWithVideoIds[adGroupName] = videoData.id!;
      }
    }
  }
  sheets.logVideos(adGroupsWithVideoIds, existingAdGroups);
}
