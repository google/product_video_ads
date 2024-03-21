const spreadsheetId = ''
const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
const campaigns_sheet = spreadsheet.getSheetByName("Ads_Campaigns");
const adgroups_sheet = spreadsheet.getSheetByName("Ads_Adgroups");
const ads_sheet = spreadsheet.getSheetByName("Ads_Ads");
const bulk_upload_wait_time = 300000; //5 minutes for campaigns and adgroups upload to go through

function main() {
  upload_campaigns();
  Utilities.sleep(bulk_upload_wait_time);  
  upload_adgroups();
  Utilities.sleep(bulk_upload_wait_time);
  upload_ads();
}

function upload_campaigns() {
  const upload = AdsApp.bulkUploads().newFileUpload(campaigns_sheet);
  upload.apply();  
}

function upload_adgroups() {
  const upload = AdsApp.bulkUploads().newFileUpload(adgroups_sheet);
  upload.apply();
}


function upload_ads() {
  const upload = AdsApp.bulkUploads().newFileUpload(ads_sheet);
  upload.apply();
}
