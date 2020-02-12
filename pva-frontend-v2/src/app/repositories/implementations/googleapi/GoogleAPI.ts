import { Injectable } from '@angular/core'
import { environment } from 'environments/environment'

@Injectable({providedIn: 'root'})
export class GoogleAPI {
  
  private gapi : any
  private sheet_id : string
  
  load(sheet_id : string, callback : Function) {
    
    this.sheet_id = sheet_id
    
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
          
          // Listen for sign-in state changes
          gapi.auth2.getAuthInstance().isSignedIn.listen(callback)
          
          callback()
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
  
  is_logged_in() {
    return this.gapi.auth2.getAuthInstance().isSignedIn.get()
  }
  
  login(sheet_id : string) {
    this.sheet_id = sheet_id
    this.gapi.auth2.getAuthInstance().signIn()
  }
  
  /*** Spreadsheet ***/
  async get_values(range : string) : Promise<any> {
    
    const response = await this.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheet_id,
      range: range
    })
    
    return response.result.values
  }
  
  async save_values(data : Array<any>) : Promise<any> {
    
    // Clear values first
    await this.gapi.client.sheets.spreadsheets.values.batchClear({
      spreadsheetId: this.sheet_id,  
      ranges: data.map(d => d.range)
    })
    
    return this.gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: this.sheet_id,  
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
}