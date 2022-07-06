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

import { Injectable } from '@angular/core'
import { environment } from 'environments/environment'

@Injectable({providedIn: 'root'})
export class GoogleAPI {
  
  FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'

  private gapi : any
  private token_client : any
  public sheet_id : string
  load(on_login : Function) {
         
    const gapi = window['gapi']
    const google = window['google']

    gapi.load('client', async () => {

      this.gapi = gapi

      // Starts the Google Apis
      await gapi.client.init({
        apiKey: environment.api_key,
        discoveryDocs: environment.discovery_docs,
      })

      // Initiates the token access process through GSI
      this.token_client = await google.accounts.oauth2.initTokenClient({
        client_id: environment.client_id,
        scope: environment.scopes,
        prompt: ''
      })

      // The access token is missing, invalid, or expired, prompt for user consent to obtain one.
      await new Promise((resolve, reject) => {
        try {
          // Settle this promise in the response callback for requestAccessToken()
          this.token_client.callback = (response) => {
            if (response.error)
              reject(response);
            
            // GIS has automatically updated gapi.client with the newly issued access token.
            resolve(response);
          };
          // Requests the access token
          this.token_client.requestAccessToken();
        } catch (err) {
          console.error(`Error during the signin`, err)
        }
      });

      // Proceeds to the login
      on_login()
    })
  }
  
  /*** Spreadsheet ***/
  async get_values(range : string) : Promise<any> {
    
    const response = await this.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheet_id,
      range: range
    })
    
    return response.result.values
  }

  async get_sheets_names() : Promise<string[]> {
    
    const response = await this.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: this.sheet_id
    })
    
    return response.result.sheets.map(sheet => sheet.properties.title)
  }
  
  async save_values(data : Array<any>, sheet? : string) : Promise<any> {
    
    sheet = sheet || this.sheet_id

    // Clear values first
    await this.gapi.client.sheets.spreadsheets.values.batchClear({
      spreadsheetId: sheet,  
      ranges: data.map(d => d.range)
    })
    
    return this.gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheet,  
      resource: {
        data: data,
        valueInputOption: 'RAW'
      }
    })
  }
  
  /** Drive **/
  async list_files_from_folder(start_folder : string, target_folder : string) : Promise<any> {
    
    // List files
    const response = await this.gapi.client.drive.files.list({
      q: "'" + start_folder + "' in parents and trashed = false"
    })
    
    const current_folder = response.result.files.filter(f => f.name == target_folder)
    
    // Not inside target yet, recurse
    if (current_folder.length > 0)
    return await this.list_files_from_folder(current_folder[0].id, target_folder)
    
    const files = {}
    response.result.files.forEach(f => files[f.name] = f.id)
    
    return files
  }
  
  async download_file(file_id : string) : Promise<any> {
    
    const response = await this.gapi.client.drive.files.get({
      fileId: file_id,
      alt: 'media'
    })
    
    return response.body
  }

  async download_gcs_file(url : string) : Promise<string> {

    // Divisor index between bucket and object (skipping protocol)
    const first_slash = url.indexOf('/', 5)

    const response = await this.gapi.client.storage.objects.get({
      bucket: url.substring(5, first_slash),
      object: url.substring(first_slash + 1),
      alt: 'media'
    }) 

    return response.body
  }
  
  upload_file(file : File, folder_id : string) : Promise<any> {
    
    console.log('Uploading ' + file.name + ' to ' + folder_id)
    
    return new Promise<any>((resolve, reject) => {
      
      var reader = new FileReader()
      reader.readAsArrayBuffer(file);
      
      reader.onload = e => {

        const target : any = e.target
        
        const resource = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileBuffer: target.result,
          folderId: folder_id,
          accessToken: this.gapi.auth.getToken().access_token
        }
        
        // Using assets/js/resumableupload.js to get this done right
        new window['ResumableUploadToGoogleDrive']().Do(resource, (res, err) => {
          if (err) {
            console.log(err)
            reject(err)
            return
          }
          
          console.log(res);
          
          if (res.status == "Done")
            resolve(res.result)
        })
      }
    })
  }

  /** Copy drive folder and spreadsheet for first time **/
  async copy_spreadsheet(sheet_id : string) {

    const response = await this.gapi.client.drive.files.copy({
      fileId: sheet_id,
      fields: 'id'
    })

    return response.result.id
  }

  async copy_drive_folder(folder_id : string, name : string, parent_folder_id? : string) {

    // Create new folder
    const response = await this.gapi.client.drive.files.create({
      resource: {
        'name': name,
        'parents': parent_folder_id ? [parent_folder_id] : [],
        'mimeType': 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    })

    const response_folder_id = response.result.id

    // Copy all folders and files
    const resp = await this.gapi.client.drive.files.list({
      q: "'" + folder_id + "' in parents and trashed = false",
      fields: 'files(id, mimeType, name)'
    })
      
    for (let i = 0; i < resp.result.files.length; i++) {

      let f = resp.result.files[i]

      if (f.mimeType == this.FOLDER_MIME_TYPE)
        await this.copy_drive_folder(f.id, f.name, response.result.id)
      else {

        console.log('creating ' + f.name + ' inside ' + response_folder_id)

        const r = await this.gapi.client.drive.files.copy({
          fileId: f.id,
          parents: [response_folder_id]
        })

        console.log(r)
      }
    }

    return response_folder_id
  }

  /* Check if logged user has access to the PVA Template spreadsheet before creating a copy */
  async  has_spreadsheet_access(sheet_id : string) {
    try {
      // try to read something from the trix, if the user does not have access, the catch will get the error
      const response = await this.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheet_id,
        range: 'Configuration!B4'
      });
      return this.is_valid_response(response, "range")
    } catch {
      console.log("The user does NOT have access to PVA Template spreadsheet.");
      return false
    }
  }

  async grant_editor_to(file_id : string, email : string) {

    console.log('Granting access on ' + file_id + ' to ' + email)

    return await this.gapi.client.drive.permissions.create({
      resource: {
        'type': 'user',
        'role': 'writer',
        'emailAddress': email
      },
      fileId: file_id,
      fields: 'id',
    })
  }

  is_valid_response(response : any, spec_field : string) {
    return response !== undefined && response.hasOwnProperty("status") && response.status == 200 && response.hasOwnProperty("result") && response.result.hasOwnProperty(spec_field)
  }

}