// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {

  production: false,

  client_id: '82003315421-v6572ba1g7brds0umk9ovt4dlm5td5oc.apps.googleusercontent.com',
  api_key: 'AIzaSyAoPm0dMN4dHptkGJuy4Aj1Y_Y_P1tIKdk',
  discovery_docs: ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  scopes: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
  drive_file_prefix: 'https://drive.google.com/uc?export=download&id=',

  sheet_id: 'sheet_id',

  local_storage_keys: {
    products: 'products',
    static_assets: 'static_assets',
    bases: 'bases',
    offer_types: 'offer_types',
    videos: 'videos',
    drive_folder: 'drive_folder',
    fonts: 'fonts'
  },

  configuration: {
    campaign_range: 'Campaigns!A2:L',
    product_range: 'Prices!A1:Z',
    drive_folder: 'Configuration!C6',
    static_assets: 'Static!A2:C',
    offer_types_range: 'OfferTypes!A2:C',
    bases_range: 'Bases!A2:C'
  }
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
