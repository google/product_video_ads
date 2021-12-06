/*
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  
  production: true,

  client_id: window['__env'].client_id,
  api_key: window['__env'].api_key,
  
  discovery_docs: ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://www.googleapis.com/discovery/v1/apis/storage/v1/rest"],
  scopes: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/devstorage.read_only",
  drive_file_prefix: 'https://drive.google.com/u/0/uc?export=download&id=',
  youtube_prefix: 'https://www.youtube.com/embed/',

  sheet_id: 'sheet_id',

  template_drive_folder: '1fG2pUo5obYJDkZmyoxhjVc_h9-WuW5Xr',
  template_sheet_id: '1JAGj6lpR1Ghz943fzBF3SMEuxxMn8aiY77GVNKdP_9Q',

  configuration: {
    campaign_range: 'Campaigns!A2:E',
    campaign_single_range: 'Campaigns!A$INDEX:E$INDEX',
    product_range: '!A1:ZZ',
    drive_folder: 'Configuration!C6',
    static_assets: 'Static!A2:C',
    offer_types_range: 'OfferTypes!A2:D',
    bases_range: 'Bases!A2:C',
    logs_range: 'Generator!A1:A',
    ads_defaults: 'Ads!C3:C9'
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
