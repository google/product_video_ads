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
  public sheet_id : string
  
  load(on_login : Function) {
    
    // Callback called when GAPI loaded
    window['googleSDKLoaded'] = () => {
      
      const gapi = window['gapi']
      
      gapi.load('client:auth2', () => {
        
        this.gapi = gapi
        
        gapi.client.init({
          apiKey: environment.api_key,
          clientId: environment.client_id,
          discoveryDocs: environment.discovery_docs,
          scope: environment.scopes
        }).then(() => {
          
          // Gets logged in email
          //console.log(gapi.auth2.getAuthInstance().currentUser.get())

          // Listen for sign-in state changes
          gapi.auth2.getAuthInstance().isSignedIn.listen(on_login)
          
          // If it's already logged in
          if (this.gapi.auth2.getAuthInstance().isSignedIn.get())
            on_login()
          else
            this.gapi.auth2.getAuthInstance().signIn()
        })
      })
    }
    
    (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement(s); js.id = id;
      js.src = "https://apis.google.com/js/api.js?onload=googleSDKLoaded";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'google-jssdk'));
  }
  
  /*** Spreadsheet ***/
  async get_values(range : string) : Promise<any> {
    
    const response = await this.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheet_id,
      range: range
    })
    
    return response.result.values
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
      
    resp.result.files.forEach(async f => {

      if (f.mimeType == this.FOLDER_MIME_TYPE)
        this.copy_drive_folder(f.id, f.name, response.result.id)
      else {

        console.log('creating ' + f.name + ' inside ' + response_folder_id)

        const r = await this.gapi.client.drive.files.copy({
          fileId: f.id,
          parents: [response_folder_id]
        })

        console.log(r)
      }
    })

    return response_folder_id
  }
}