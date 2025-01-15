const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1Dxfbnw2fV_1I9869AtrODBK99Zg4Z9kJg0SRZcdNP-8/edit";

// Sheet names
const AD_GROUP_SHEET_NAME = "AdGroups";
const CONFIG_SHEET_NAME = "Base Config";
const STATUS_SHEET_NAME = "Status";

// Get data from sheets
const SPREADSHEET = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
const AD_GROUP_SHEET = SPREADSHEET.getSheetByName(AD_GROUP_SHEET_NAME);
const CONFIG_SHEET = SPREADSHEET.getSheetByName(CONFIG_SHEET_NAME);
const STATUS_SHEET = SPREADSHEET.getSheetByName(STATUS_SHEET_NAME);
const CAMPAIGN_NAME = CONFIG_SHEET.getRange(
  "googleAds_campaignName"
).getValue();
const AD_GROUPS = getAdGroupsFromSheet();

/**
 * Gets a campaign (object) given its name.
 * @param string name
 * @returns
 */
function getCampaignByName(name) {
  const campaignIterator = AdsApp.videoCampaigns()
    .withCondition(`Name = "${name}"`)
    .get();
  if (campaignIterator.hasNext()) {
    return campaignIterator.next();
  }
  return null;
}

/**
 * Gets information on ad groups from the PVA spreadsheet.
 * @returns object
 */
function getAdGroupsFromSheet() {
  const values = AD_GROUP_SHEET.getDataRange()
    .getValues()
    .slice(1)
    .filter((row) => row[0] !== "");
  return Object.fromEntries(
    values.map((row) => [
      row[0],
      {
        type: row[2],
        url: row[5],
        callToAction: row[6],
        targetLocation: row[3], // TODO: implement
        audienceName: row[4], // TODO: implement
        headline: row[7],
        longHeadline: row[8],
        description1: row[9],
        description2: row[10],
      },
    ])
  );
}

/**
 * Determins whether the provided status equates to "enabled".
 * @param string expectedStatus
 * @returns boolean
 */
function shouldEnable(expectedStatus) {
  return expectedStatus.toLowerCase().trim() === "enabled";
}

/**
 * Gets information on the video-related status of the desired ad groups.
 * @returns object[]
 */
function getStatusFromSheet() {
  const values = STATUS_SHEET.getDataRange()
    .getValues()
    .map((row, index) => [index + 1, ...row])
    .slice(1);
  return values.map((row) => ({
    rowNumber: row[0],
    adGroupName: row[1],
    videoId: row[2],
    shouldUpdate: row[4] === "",
    shouldEnable: shouldEnable(row[5]),
  }));
}

/**
 * Writes the current data/time to the status sheet.
 * @param string[] row
 */
function writeAdsUpdateTime(row) {
  STATUS_SHEET.getRange(row.rowNumber, 4, 1, 1).setValue(
    new Date().toISOString()
  );
}

/**
 * Obtains ad-group object, if needed by creating the ad group.
 * @param object campaign
 * @param object adGroupInfo
 * @param object item
 * @returns object
 */
function getOrCreateAdGroup(campaign, adGroupInfo, item) {
  const adGroupIterator = campaign
    .videoAdGroups()
    .withCondition(`Name = "${item.adGroupName}"`)
    .get();
  if (adGroupIterator.hasNext()) {
    return adGroupIterator.next();
  }
  const adGroupCreationOperation = campaign
    .newVideoAdGroupBuilder()
    .withAdGroupType(adGroupInfo.type)
    .withName(item.adGroupName)
    .withStatus(item.shouldEnable ? "ENABLED" : "PAUSED")
    .build();
  return getOperationResult(
    adGroupCreationOperation,
    "Ad Group",
    item.adGroupName
  );
}

/**
 * Pauses the ads in the given ad group.
 * @param object adGroup
 */
function pauseExistingAds(adGroup) {
  const adGroupAdIterator = adGroup
    .videoAds()
    .withCondition("Status = ENABLED")
    .get();
  while (adGroupAdIterator.hasNext()) {
    adGroupAdIterator.next().pause();
  }
}

/**
 * Identifies the result of the given operation.
 * @param object operation
 * @param string entityName
 * @param string entityId
 * @returns object
 */
function getOperationResult(operation, entityName, entityId) {
  if (!operation.isSuccessful()) {
    throw new Error(
      `${entityName} ${entityId} creation failed: ${operation.getErrors()}`
    );
  }
  return operation.getResult();
}

/**
 * Creates an ad in the given ad group.
 * @param object adGroup
 * @param object adGroupInfo
 * @param object item
 * @returns object
 */
function createAd(adGroup, adGroupInfo, item) {
  const videoCreationOperation = AdsApp.adAssets()
    .newYouTubeVideoAssetBuilder()
    .withName(`${item.adGroupName} - ${item.videoId}`)
    .withYouTubeVideoId(item.videoId)
    .build();
  const video = getOperationResult(
    videoCreationOperation,
    "Video",
    item.videoId
  );
  switch (adGroupInfo.type) {
    case "VIDEO_TRUE_VIEW_IN_STREAM":
      let inStreamAdCreationOperation = adGroup
        .newVideoAd()
        .inStreamAdBuilder()
        .withAdName(item.adGroupName)
        .withDisplayUrl(adGroupInfo.url)
        .withFinalUrl(adGroupInfo.url)
        .withVideo(video);
      if (adGroupInfo.callToAction !== "") {
        inStreamAdCreationOperation =
          inStreamAdCreationOperation.withCallToAction(
            adGroupInfo.callToAction
          );
        if (adGroupInfo.headline !== "") {
          inStreamAdCreationOperation =
            inStreamAdCreationOperation.withActionHeadline(
              adGroupInfo.headline
            );
        }
      }
      inStreamAdCreationOperation = inStreamAdCreationOperation.build();
      return getOperationResult(
        inStreamAdCreationOperation,
        "Video Ad",
        item.videoId
      );
    case "VIDEO_NON_SKIPPABLE_IN_STREAM":
      let nonSkippableAdCreationOperation = adGroup
        .newVideoAd()
        .nonSkippableAdBuilder()
        .withAdName(item.adGroupName)
        .withDisplayUrl(adGroupInfo.url)
        .withFinalUrl(adGroupInfo.url)
        .withVideo(video)
        .build();
      return getOperationResult(
        nonSkippableAdCreationOperation,
        "Video Ad",
        item.videoId
      );
    case "VIDEO_TRUE_VIEW_IN_DISPLAY":
      let displayAdCreationOperation = adGroup
        .newVideoAd()
        .inFeedAdBuilder()
        .withAdName(item.adGroupName)
        .withHeadline(adGroupInfo.headline)
        .withDescription1(adGroupInfo.description1)
        .withDescription2(adGroupInfo.description2)
        .withThumbnail("DEFAULT_THUMBNAIL")
        .withVideo(video)
        .build();
      return getOperationResult(
        displayAdCreationOperation,
        "Video Ad",
        item.videoId
      );
    case "VIDEO_BUMPER":
      let bumperAdCreationOperation = adGroup
        .newVideoAd()
        .bumperAdBuilder()
        .withAdName(item.adGroupName)
        .withDisplayUrl(adGroupInfo.url)
        .withMobileFinalUrl(adGroupInfo.url)
        .withFinalUrl(adGroupInfo.url)
        .withVideo(video)
        .build();
      return getOperationResult(
        bumperAdCreationOperation,
        "Video Ad",
        item.videoId
      );
    case "VIDEO_RESPONSIVE":
      let responsiveAdCreationOperation = adGroup
        .newVideoAd()
        .responsiveVideoAdBuilder()
        .withAdName(item.adGroupName)
        .withLongHeadline(adGroupInfo.longHeadline)
        .withDescription(adGroupInfo.description1)
        .withFinalUrl(adGroupInfo.url)
        .withVideo(video);
      if (adGroupInfo.callToAction !== "") {
        responsiveAdCreationOperation =
          responsiveAdCreationOperation.withCallToAction(
            adGroupInfo.callToAction
          );
        if (adGroupInfo.headline !== "") {
          responsiveAdCreationOperation =
            responsiveAdCreationOperation.withHeadline(adGroupInfo.headline);
        }
      }
      responsiveAdCreationOperation = responsiveAdCreationOperation.build();
      return getOperationResult(
        responsiveAdCreationOperation,
        "Video Ad",
        item.videoId
      );
    default:
      throw new Error(`${adGroupInfo.type} not implemented`);
  }
}

/**
 * Pauses all given ad groups.
 * @param object adGroupIterator
 */
function pauseAdGroups(adGroupIterator) {
  while (adGroupIterator.hasNext()) {
    adGroupIterator.next().pause();
  }
}

/**
 * Logs an error message and writes it to the status sheet.
 * @param object error
 * @param number rowNumber
 */
function handleError(error, rowNumber) {
  Logger.log(`[ERROR] ${error.message}`);
  STATUS_SHEET.getRange(rowNumber, 6, 1, 1).setValue(error.message);
}

/**
 * Deletes the error output in the status sheet's given row number.
 * @param number rowNumber
 */
function clearError(rowNumber) {
  STATUS_SHEET.getRange(rowNumber, 6, 1, 1).clearContent();
}

/**
 * Updates ad groups based on the information provided in the PVA spreadsheet.
 */
function main() {
  const campaign = getCampaignByName(CAMPAIGN_NAME);
  if (!campaign) {
    Logger.log("Campaign does not exist. Please create it.");
    return;
  }
  pauseAdGroups(campaign.videoAdGroups().get()); // TODO: filter out Ad Groups which would be enabled later
  const adGroupsToProcess = getStatusFromSheet();
  adGroupsToProcess.forEach((item) => {
    try {
      const adGroupInfo = AD_GROUPS[item.adGroupName];
      if (!adGroupInfo) {
        throw new Error(
          `Ad Group ${item.adGroupName} not defined in the 'AdGroups' sheet. Skipping...`
        );
      }
      if (!item.shouldEnable) {
        return;
      }
      if (!item.videoId) {
        throw new Error(
          `Ad Group ${item.adGroupName} does not have a defined 'Output Video ID'. Skipping...`
        );
      }
      const adGroup = getOrCreateAdGroup(campaign, adGroupInfo, item);
      if (item.shouldEnable) {
        adGroup.enable();
      }
      if (!item.shouldUpdate) {
        return;
      }
      pauseExistingAds(adGroup);
      createAd(adGroup, adGroupInfo, item);
      writeAdsUpdateTime(item);
      clearError(item.rowNumber);
    } catch (error) {
      handleError(error, item.rowNumber);
    }
  });
}
