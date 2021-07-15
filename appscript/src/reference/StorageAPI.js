/*
Copyright 2021 Google LLC

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

/*
    This script is not used anymore, these functions are here as example in
    case anyone need to implement integration to Google Cloud Storage.
*/

function StorageAPI(token) {
  
    this.url = 'https://storage.googleapis.com/storage/v1/b/{bucket}/o/{object}'
    this.token = token
    
    this.call = function(gs_path, query, method) {
      
      var params = {
        method: method,
        contentType: 'application/json',
        headers: {
          Authorization: 'Bearer ' + this.token
        },
        muteHttpExceptions: true
      }
      
      // Parse GCS string to bucket and object
      gs_path = gs_path.replace('gs://', '')
      var bucket = gs_path.substring(0, gs_path.indexOf('/'))
      var object = encodeURIComponent(gs_path.substring(gs_path.indexOf('/') + 1))
      
      return UrlFetchApp.fetch(this.url.replace('{bucket}', bucket).replace('{object}', object) + query, params)
    }
  }
  
  // Checks if a GCS file exists
  StorageAPI.prototype.file_exists = function(gs_path) {
    Log.output('Checking if ' + gs_path + ' exists on GCS...')
    return this.call(gs_path, '?alt=json', 'get').getResponseCode() == 200
  }