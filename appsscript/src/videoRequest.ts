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
  CellValue,
  ColumnName,
  ColumnNameLax,
  ConfigChecksum,
  ConfigField,
  ConfigGroup,
  ConfigTables,
  ElementType,
  ErrorMessage,
  JsonFieldName,
  OfferId,
  SheetName,
} from './structure';
import { Util } from './util';

// Define property mappings for different element types to make getPlacement more declarative.
const elementPropertyConfig = {
  [ElementType.text]: {
    stringProps: [
      ColumnName.textFont,
      ColumnName.textAlignment,
      ColumnName.textColor,
    ],
    floatProps: [ColumnName.textSize, ColumnName.textWidth],
    specialValue: {
      key: JsonFieldName.textValue,
      source: 'offer',
    },
  },
  [ElementType.image]: {
    stringProps: [ColumnName.removeBackground],
    floatProps: [ColumnName.imageWidth, ColumnName.imageHeight],
    specialValue: {
      key: JsonFieldName.imageUrl,
      source: 'offer',
    },
  },
};

/**
 * Collects the data belonging to a "Placement" in the config.
 * @param placementRecord
 * @param offer
 * @returns
 */
function getPlacement(
  placementRecord: Record<string, string>,
  offer: Record<string, string>
): [Record<string, string | number> | undefined, ErrorMessage | undefined] {
  const dataField = placementRecord[ColumnName.dataField];
  const elementType = placementRecord[ColumnName.elementType] as ElementType;

  if (!offer[dataField]) {
    // Should have been caught by the 'syntax' check already.
    return [undefined, `Referenced field absent: "${dataField}"`];
  }
  const placement: Record<string, string | number> = {
    [Util.deriveFieldKey(ColumnName.offsetX)]:
      parseFloat(placementRecord[ColumnName.offsetX]) || 0,
    [Util.deriveFieldKey(ColumnName.offsetY)]:
      parseFloat(placementRecord[ColumnName.offsetY]) || 0,
    [Util.deriveFieldKey(ColumnName.rotationAngle)]:
      parseFloat(placementRecord[ColumnName.rotationAngle]) || 0,
    [Util.deriveFieldKey(ColumnName.elementId)]:
      placementRecord[ColumnName.elementId],
    [Util.deriveFieldKey(ColumnName.relativeTo)]:
      placementRecord[ColumnName.relativeTo],
    [Util.deriveFieldKey(ColumnName.elementHorizontalAnchor)]:
      placementRecord[ColumnName.elementHorizontalAnchor],
    [Util.deriveFieldKey(ColumnName.elementVerticalAnchor)]:
      placementRecord[ColumnName.elementVerticalAnchor],
    [Util.deriveFieldKey(ColumnName.relativeHorizontalAnchor)]:
      placementRecord[ColumnName.relativeHorizontalAnchor],
    [Util.deriveFieldKey(ColumnName.relativeVerticalAnchor)]:
      placementRecord[ColumnName.relativeVerticalAnchor],
  };

  const config = elementPropertyConfig[elementType];
  if (!config) {
    // Should have been caught by the 'syntax' check already.
    return [undefined, `Unknown element type: "${elementType}"`];
  }

  if (config.specialValue.source === 'offer') {
    placement[config.specialValue.key] = offer[dataField];
  }

  for (const prop of config.stringProps) {
    placement[Util.deriveFieldKey(prop)] = placementRecord[prop];
  }

  for (const prop of config.floatProps) {
    placement[Util.deriveFieldKey(prop)] =
      parseFloat(placementRecord[prop]) || 0;
  }

  return [placement, undefined];
}

/**
 * Collects configuration info from the spreadsheet suitable for later upload.
 * @param configTables
 * @param sheets
 * @param folderName
 * @returns
 */
function getConfigForUpload(
  configTables: ConfigTables,
  sheets: Sheets,
  folderName: string
): object[] {
  const adGroupsWithErrors: Record<AdGroupName, ErrorMessage> = {};
  const adGroupsWithNewChecksums: Record<AdGroupName, ConfigChecksum> = {};
  const adGroupsWithoutChange: Record<AdGroupName, null> = {};
  const configuredAdGroups: Record<
    AdGroupName,
    Record<ColumnName, CellValue>
  > = {};
  for (const adGroupRecord of configTables[SheetName.adGroups]!) {
    configuredAdGroups[adGroupRecord[ColumnName.adGroup as AdGroupName]] =
      adGroupRecord;
  }
  const existingAdGroups = sheets.getExistingAdGroups(
    configTables[SheetName.status]!
  );
  for (const adGroup of Object.keys(existingAdGroups)) {
    if (!(adGroup in configuredAdGroups)) {
      adGroupsWithErrors[adGroup] = 'Not configured';
    }
  }
  // Restructure offers for faster access
  const offersById: Record<OfferId, Record<ColumnNameLax, CellValue>> = {};
  for (const offerRecord of configTables[SheetName.offers]!) {
    offersById[offerRecord[ColumnName.offerId]] = offerRecord;
  }
  // Compose config per ad group
  const configForUpload = [];
  nextAdGroup: for (const adGroupRecord of configTables[SheetName.adGroups]!) {
    const adGroup = adGroupRecord[ColumnName.adGroup];
    const offerIds = configTables[SheetName.offersToAdGroups]!.filter(
      e => e[ColumnName.adGroup] === adGroup
    ).map(e => e[ColumnName.offerId]);
    const templateVideo = adGroupRecord[ColumnName.templateVideo];
    const timingRecords = configTables[SheetName.timing]!.filter(
      e => e[ColumnName.templateVideo] === templateVideo
    );
    if (timingRecords.length !== offerIds.length) {
      adGroupsWithErrors[adGroup] =
        `Offer mismatch: has ${offerIds.length}, needs ${timingRecords.length}`;
      continue nextAdGroup;
    }
    if (Util.hasDuplicates(offerIds)) {
      adGroupsWithErrors[adGroup] = `Redundant offers referenced`;
      continue nextAdGroup;
    }
    let offerIndex = 0;
    const timings = [];
    // Compose config per "Timing" record
    for (const timingRecord of timingRecords) {
      const offer = offersById[offerIds[offerIndex++]];
      if (!offer) {
        adGroupsWithErrors[adGroup] =
          `Offer referenced but absent: "${offerIds[offerIndex - 1]}"`;
        continue nextAdGroup;
      }
      const offsetS = timingRecord[ColumnName.offsetS];
      const durationS = timingRecord[ColumnName.durationS];
      const placementId = timingRecord[ColumnName.placementId];
      const placementRecords = configTables[SheetName.placement]!.filter(
        e => e[ColumnName.placementId] === placementId
      );
      const placements = [];
      // Compose config per "Placement" record
      for (const placementRecord of placementRecords) {
        const [placement, error] = getPlacement(placementRecord, offer);
        if (error) {
          adGroupsWithErrors[adGroup] = error;
          continue nextAdGroup;
        } else {
          placements.push(placement);
        }
      }
      const timing = {
        [Util.deriveFieldKey(ColumnName.offsetS)]: parseFloat(offsetS),
        [Util.deriveFieldKey(ColumnName.durationS)]: parseFloat(durationS),
        [JsonFieldName.placements]: placements,
      };
      timings.push(timing);
    }
    const adGroupConfig = {
      [Util.deriveFieldKey(ColumnName.adGroup)]: adGroup,
      [Util.deriveFieldKey(ColumnName.templateVideo)]: templateVideo,
      [JsonFieldName.content]: timings,
    };
    const checksum = Util.getChecksum(adGroupConfig);
    // Determine action depending on whether the ad group changed.
    if (
      existingAdGroups[adGroup] &&
      checksum === existingAdGroups[adGroup][ColumnName.contentChecksum]
    ) {
      adGroupsWithoutChange[adGroup] = null;
    } else {
      adGroupsWithNewChecksums[adGroup] = checksum;
      configForUpload.push(adGroupConfig);
    }
  }
  sheets.logAdGroups(
    adGroupsWithErrors,
    adGroupsWithNewChecksums,
    adGroupsWithoutChange,
    existingAdGroups,
    folderName
  );
  return configForUpload;
}

/**
 * Exports the configuration to trigger video generation.
 */
export function exportConfig() {
  const sheets = new Sheets();
  const storageBucket = sheets.getConfigValue(
    ConfigGroup.googleCloud,
    ConfigField.storageBucket
  );
  const config = sheets.getConfigTables();
  const folderName = new Date().toISOString() + ' ' + Util.getRandStr();
  const configForUpload = getConfigForUpload(config, sheets, folderName);
  if (configForUpload.length > 0) {
    const jsonForUpload = JSON.stringify(configForUpload, null, 2);
    console.log(jsonForUpload);
    const fileName = `${folderName}/config.json`;
    const gcsApi = new GcsApi(storageBucket);
    const uploadedFile = gcsApi.uploadFile(jsonForUpload, fileName);
    console.log(`Uploaded file "${uploadedFile}"`);
  }
}
