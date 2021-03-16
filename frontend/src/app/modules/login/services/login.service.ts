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

import { Injectable, NgZone } from '@angular/core'
import { environment } from 'environments/environment'
import { BehaviorSubject } from 'rxjs'
import { GoogleAPI } from 'app/repositories/implementations/googleapi/GoogleAPI'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'

@Injectable({providedIn: 'root'})
export class LoginService {

    // -1: not loaded / 0: loading / 1: loaded
    private readonly _ready = new BehaviorSubject<number>(0)
    private readonly _sheet_id = new BehaviorSubject<string>('')
    private readonly _drive_folder = new BehaviorSubject<string>('')
    
    /** Published state to application **/
    readonly ready$ = this._ready.asObservable()
    readonly sheet_id$ = this._sheet_id.asObservable()
    readonly drive_folder$ = this._drive_folder.asObservable()

    get ready() : number {
        return this._ready.getValue()
    }

    get sheet_id() : string {
        return this._sheet_id.getValue()
    }

    get drive_folder() : string {
        return this,this._drive_folder.getValue()
    }

    // Tries to log in and load all configs automatically
    constructor(private ngZone : NgZone, 
                private googleApi : GoogleAPI,
                private repository : CachedConfigurationRepository) {
        
        // Load and authenticate Google API
        googleApi.load(this.on_login.bind(this))
    }
    
    private async load(sheet_id) : Promise<string> {
    
        // Set received sheet
        this._sheet_id.next(sheet_id)
        this.googleApi.sheet_id = sheet_id

        // Loading...
        this.emit_status_event(0)

        try {
            // Brief validation to check if sheet exists
            this._drive_folder.next(await this.repository.load_drive_folder())
            this.emit_status_event(1)
        } catch (e) {
            this.emit_status_event(-1)
            console.log(e)
            throw Error(e.result.error.message)
        }
        
        return this.sheet_id
    }

    private emit_status_event(status) {
        this.ngZone.run(() => this._ready.next(status))
    }

    on_login() : void {

        // Load sheet ID from cache
        const loaded_sheet = localStorage.getItem(environment.sheet_id)

        if (loaded_sheet) {
            this.load(loaded_sheet)
        } else {
            this.emit_status_event(-1)
        }
    }
    
    login(sheet_id) : void{
        localStorage.setItem(environment.sheet_id, sheet_id)
        this.load(sheet_id)
    }

    logout() {
        this._sheet_id.next('')
        localStorage.removeItem(environment.sheet_id)
        this.repository.clear_cache()
        this.emit_status_event(-1)
    }

    async share_access(email) : Promise<void> {
        await this.googleApi.grant_editor_to(this.sheet_id, email)
        await this.googleApi.grant_editor_to(this.drive_folder, email)
    }

    async generate_new() {

        const user_has_access = await this.googleApi.has_spreadsheet_access(environment.template_sheet_id);

        if(!user_has_access) {
            this._sheet_id.next(environment.template_sheet_id)
            this._drive_folder.next(environment.template_drive_folder)
            return false
        }

        this.emit_status_event(0)
        
        const generated_sheet_id = await this.googleApi.copy_spreadsheet(environment.template_sheet_id)
        console.log('New copied sheet_id: ' + generated_sheet_id)

        const generated_drive_folder = await this.googleApi.copy_drive_folder(environment.template_drive_folder, 'PVA')
        console.log('New copied drive folder: ' + generated_drive_folder)

        // Set drive folder ID to new spreadsheet
        await this.googleApi.save_values([{
            range: environment.configuration.drive_folder,
            values: [[generated_drive_folder]]
        }], generated_sheet_id)

        this.login(generated_sheet_id)

        return true
    }
}