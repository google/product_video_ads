const spreadsheetId = ''
const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
const config_sheet = spreadsheet.getSheetByName("CloudConfig");
const bulk_upload_wait_time = 300000; //5 minutes for campaigns and adgroups upload to go through

function main() {
  pause_all_existing_ads();
  
  const ad_name_prefix = config_sheet.getRange("B10").getValue();
  
  const adsIterator = AdsApp.videoAds()
    .withCondition("ad_group_ad.status = PAUSED")
    .withCondition(`ad_group_ad.ad.name LIKE '${ad_name_prefix}%'`)
    .get();
  console.log("Found paused video ads: "+adsIterator.totalNumEntities() +", with name prefix " + ad_name_prefix);
  while(adsIterator.hasNext()){
    adsIterator.next().enable();
  }
  console.log("enabled ads with names starting with " + ad_name_prefix);
}

function pause_all_existing_ads(){
  const adsIterator = AdsApp.videoAds().withCondition("ad_group_ad.status = ENABLED").get();
  console.log("Found enabled ads: "+adsIterator.totalNumEntities());
  while(adsIterator.hasNext()){
    adsIterator.next().pause();
  }
  console.log("pausing ads done");
}