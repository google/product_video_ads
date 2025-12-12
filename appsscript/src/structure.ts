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

// Names of the sheets/tabs.
export enum SheetName {
  adGroups = 'AdGroups',
  baseConfig = 'Base Config',
  offers = 'Offers',
  offersFeed = 'Offers Feed',
  offersToAdGroups = 'Offers to AdGroups',
  placement = 'Placement',
  status = 'Status',
  timing = 'Timing',
  dummy = '_delete_me',
}

// Names of the sheets' column headers.
export enum ColumnName {
  adGroup = 'Output AdGroup',
  adGroupType = 'AdGroup Type',
  adsCreation = 'Ad Creation',
  audienceName = 'Audience Name',
  callToAction = 'Call to Action',
  contentChecksum = 'Content Checksum',
  checksumCreation = 'Checksum Creation',
  dataField = 'Data Field',
  description1 = 'Description 1',
  description2 = 'Description 2',
  durationS = 'Duration [s]',
  elementType = 'Element Type',
  elementId = 'Element ID',
  errors = 'Error(s)',
  expectedStatus = 'Expected Status',
  gcsFolder = 'Folder Name',
  headline = 'Headline',
  longHeadline = 'Long Headline',
  imageWidth = 'Image Width',
  imageHeight = 'Image Height',
  keepRatio = 'Keep Image Ratio',
  removeBackground = 'Remove Background',
  offerId = 'Offer ID',
  offsetS = 'Offset [s]',
  outputVideoId = 'Output Video ID',
  placementId = 'Placement ID',
  offsetX = 'Offset X',
  offsetY = 'Offset Y',
  relativeTo = 'Relative To',
  elementHorizontalAnchor = 'Element Horizontal Anchor',
  elementVerticalAnchor = 'Element Vertical Anchor',
  relativeHorizontalAnchor = 'Relative Horizontal Anchor',
  relativeVerticalAnchor = 'Relative Vertical Anchor',
  targetLocation = 'Target Location',
  templateVideo = 'Template Video',
  textAlignment = 'Text Alignment',
  rotationAngle = 'Rotation Angle',
  textColor = 'Text Color',
  textFont = 'Text Font',
  textSize = 'Text Size',
  textWidth = 'Text Width',
  url = 'URL',
  videoCreation = 'Video Creation',
}

// The topical groups in the base-config sheet.
export enum ConfigGroup { // If changed, reflect in Ads Script!
  //  googleDriveFolders = 'Google Drive Folders',
  googleCloud = 'Google Cloud',
  merchantCenter = 'Google Merchant Center',
  youtube = 'YouTube',
  googleAds = 'Google Ads',
  //  other = 'Other',
}

// The actual parameters set in the base-config sheet.
export enum ConfigField { // If changed, reflect in Ads Script!
  accountId = 'Account ID',
  campaignName = 'Campaign Name',
  channelId = 'Channel ID',
  // contentLanguage = 'Content Language',
  // debugging = 'Debugging',
  filterFeed = 'Feed Filtering',
  // outputVideos = 'Output Videos',
  storageBucket = 'Storage Bucket',
  // targetCountry = 'Target Country',
  // templateVideos = 'Template Videos',
}

// The types of restrictions that can be defined on values in the config tables.
export enum ValueRestrictionType {
  enum = 'enum',
  numRange = 'number_range',
  columnNames = 'column_names',
  regex = 'regex',
}

// Parameters to define a value restriction.
export enum ValueRestrictionParameter {
  min = 'min',
  max = 'max',
}

// Types of elements to be positioned in a video.
export enum ElementType {
  text = 'Text',
  image = 'Image',
}

// Potential statuses that an ad group can have.
export enum StatusOption {
  enabled = 'ENABLED',
  disabled = 'DISABLED',
}

// Field names to be used in config output besides those auto-derived from keys.
export enum JsonFieldName {
  textValue = 'text_value',
  imageUrl = 'image_url',
  content = 'content',
  placements = 'placements',
  videoId = 'video_id',
  youtubeChannelId = 'youtube_channel_id',
  youtubeAuthToken = 'youtube_auth_token',
}

// The valid tuples of restriction types and their parameters.
export type ValueRestriction =
  | [ValueRestrictionType.enum, string[]]
  | [ValueRestrictionType.regex, string]
  | [ValueRestrictionType.columnNames, SheetName]
  | [ValueRestrictionType.numRange, Record<ValueRestrictionParameter, number>];

// Compound type definitions serving clarify and safety.
export type AdGroups = Record<
  AdGroupName,
  Record<ColumnName, CellValue> & { rowNumber: number }
>;
export type ColumnNameLax = ColumnName | string; // allows bespoke additions
export type ConfigTables = Partial<Record<SheetName, Record<string, string>[]>>;
export type VideoInfo = Record<JsonFieldName, VideoId>;

// Type aliases serving clarify and safety.
export type AdGroupName = string;
export type CellValue = string;
export type ConfigChecksum = string;
export type ErrorMessage = string;
export type OfferId = string;
export type RangeName = string;
export type VideoId = string;

// The arrangement of the groups and parameters of the base config.
export const configStructure: Partial<
  Record<SheetName, Record<ConfigGroup, ConfigField[]>>
> = {
  [SheetName.baseConfig]: {
    // [ConfigGroup.googleDriveFolders]: [
    // ConfigField.templateVideos,
    // ConfigField.outputVideos,
    // ],
    [ConfigGroup.googleCloud]: [ConfigField.storageBucket],
    [ConfigGroup.merchantCenter]: [
      // ConfigField.targetCountry,
      // ConfigField.contentLanguage,
      ConfigField.accountId,
      ConfigField.filterFeed,
    ],
    [ConfigGroup.youtube]: [ConfigField.channelId],
    [ConfigGroup.googleAds]: [ConfigField.accountId, ConfigField.campaignName],
    // [ConfigGroup.other]: [ConfigField.debugging],
  },
};

// The arrangement of the sheets and columns of the config tables.
export const tableStructure: Partial<Record<SheetName, ColumnName[]>> = {
  [SheetName.timing]: [
    ColumnName.templateVideo,
    ColumnName.offsetS,
    ColumnName.durationS,
    ColumnName.placementId,
  ],
  [SheetName.placement]: [
    ColumnName.placementId,
    ColumnName.elementId,
    ColumnName.elementType,
    ColumnName.dataField,
    ColumnName.relativeTo,
    ColumnName.elementHorizontalAnchor,
    ColumnName.elementVerticalAnchor,
    ColumnName.relativeHorizontalAnchor,
    ColumnName.relativeVerticalAnchor,
    ColumnName.offsetX,
    ColumnName.offsetY,
    ColumnName.rotationAngle,
    ColumnName.imageWidth,
    ColumnName.imageHeight,
    ColumnName.keepRatio,
    ColumnName.textFont,
    ColumnName.textSize,
    ColumnName.textWidth,
    ColumnName.textAlignment,
    ColumnName.textColor,
    ColumnName.removeBackground,
  ],
  [SheetName.offers]: [ColumnName.offerId],
  [SheetName.offersToAdGroups]: [ColumnName.offerId, ColumnName.adGroup],
  [SheetName.adGroups]: [
    // If changed, reflect in Ads Script!
    ColumnName.adGroup,
    ColumnName.templateVideo,
    ColumnName.adGroupType,
    ColumnName.targetLocation,
    ColumnName.audienceName,
    ColumnName.url,
    ColumnName.callToAction,
    ColumnName.headline,
    ColumnName.longHeadline,
    ColumnName.description1,
    ColumnName.description2,
  ],
  [SheetName.status]: [
    // If changed, reflect in Ads Script!
    ColumnName.adGroup,
    ColumnName.outputVideoId,
    ColumnName.videoCreation,
    ColumnName.adsCreation,
    ColumnName.expectedStatus,
    ColumnName.errors,
    ColumnName.contentChecksum,
    ColumnName.checksumCreation,
    ColumnName.gcsFolder,
  ],
};

// The sheets that may have headers beyond those defined here.
export const sheetsWithBespokeHeaders = [SheetName.offers];

// The columns whose value presence depends on another column's value.
export const columnsConditionallyOmittable: Partial<
  Record<SheetName, Partial<Record<ColumnName, Record<string, ColumnName[]>>>>
> = {
  [SheetName.placement]: {
    [ColumnName.elementType]: {
      [ElementType.text]: [ColumnName.imageWidth, ColumnName.imageHeight],
      [ElementType.image]: [
        ColumnName.textFont,
        ColumnName.textSize,
        ColumnName.textWidth,
        ColumnName.textAlignment,
        ColumnName.textColor,
      ],
    },
  },
};

export class ValueRestrictions {
  valueRestrictions: Partial<Record<ColumnName, ValueRestriction>> = {
    [ColumnName.elementType]: [
      ValueRestrictionType.enum,
      [ElementType.text, ElementType.image],
    ],
    [ColumnName.textAlignment]: [
      ValueRestrictionType.enum,
      ['left', 'center', 'right', ''],
    ],
    [ColumnName.textColor]: [
      ValueRestrictionType.regex,
      /* eslint-disable-next-line no-useless-escape */
      `^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|rgb\\(\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}\\)|hsl\\(\\d{1,3},\\s*\\d{1,3}%,\\s*\\d{1,3}%\\)|$`,
    ],
    [ColumnName.dataField]: [
      ValueRestrictionType.columnNames,
      SheetName.offers,
    ],
    [ColumnName.keepRatio]: [ValueRestrictionType.enum, ['Yes', 'No', '']],
    [ColumnName.removeBackground]: [
      ValueRestrictionType.enum,
      ['Yes', 'No', ''],
    ],
    [ColumnName.elementHorizontalAnchor]: [
      ValueRestrictionType.enum,
      ['left', 'center', 'right', ''],
    ],
    [ColumnName.elementVerticalAnchor]: [
      ValueRestrictionType.enum,
      ['top', 'center', 'bottom', ''],
    ],
    [ColumnName.relativeHorizontalAnchor]: [
      ValueRestrictionType.enum,
      ['left', 'center', 'right', ''],
    ],
    [ColumnName.relativeVerticalAnchor]: [
      ValueRestrictionType.enum,
      ['top', 'center', 'bottom', ''],
    ],
  };

  rangeRestrictions: [ColumnName, number, number][] = [
    [ColumnName.offsetS, 0, 3600],
    [ColumnName.durationS, 0, 3600],
    [ColumnName.placementId, 0, 1e6],
    [ColumnName.offsetX, -1e5, 1e5],
    [ColumnName.offsetY, -1e5, 1e5],
    [ColumnName.imageWidth, 0, 1e5],
    [ColumnName.imageHeight, 0, 1e5],
    [ColumnName.textSize, 1, 1000],
    [ColumnName.textWidth, 1, 1e5],
    [ColumnName.rotationAngle, 0, 360],
  ];

  constructor() {
    for (const [columnName, min, max] of this.rangeRestrictions) {
      this.valueRestrictions[columnName] = [
        ValueRestrictionType.numRange,
        {
          [ValueRestrictionParameter.min]: min,
          [ValueRestrictionParameter.max]: max,
        },
      ];
    }
  }

  getRestrictionForColumn(
    columnName: ColumnName
  ): ValueRestriction | undefined {
    return this.valueRestrictions[columnName];
  }
}
