const spreadsheetId = '';
const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
const config_sheet = spreadsheet.getSheetByName("Configuration");

function main() {
    pause_all_existing_ads()
    enable_newest_ads()
}

function pause_all_existing_ads(){
    const adsIterator = AdsApp.videoAds().withCondition("ad_group_ad.status = ENABLED").get();
    console.log("Found ads: "+adsIterator.totalNumEntities());
    while(adsIterator.hasNext()){
      adsIterator.next().pause();
    }
    console.log("pausing ads done");
  }
}

function enable_newest_ads(){
    const ad_name_prefix = config_sheet.getRange("C21").getValue();
  
    const adsIterator = AdsApp.videoAds()
      .withCondition("ad_group_ad.status = PAUSED")
      .withCondition(`ad_group_ad.ad.name LIKE '${ad_name_prefix}%'`)
      .get();
    console.log("Found ads: "+adsIterator.totalNumEntities());
    while(adsIterator.hasNext()){
      adsIterator.next().enable();
    }
    console.log("enabled ads done");
}