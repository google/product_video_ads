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
    
    /** Published state to application **/
    readonly ready$ = this._ready.asObservable()
    readonly sheet_id$ = this._sheet_id.asObservable()

    get ready() : number {
        return this._ready.getValue()
    }

    get sheet_id() : string {
        return this._sheet_id.getValue()
    }

    // Tries to log in and load all configs automatically
    constructor(private ngZone : NgZone, 
                private googleApi : GoogleAPI,
                private repository : CachedConfigurationRepository) {
        
        // Load sheet ID from cache
        this._sheet_id.next(localStorage.getItem(environment.sheet_id))
        
        // Load and authenticate Google API
        googleApi.load(this.sheet_id, this.load.bind(this))
    }
    
    private async load() : Promise<string> {
    
        if (this.sheet_id == null || !this.googleApi.is_logged_in()) {
            this.emit_status_event(-1)
            return
        }

        // Loading...
        this.emit_status_event(0)

        try {
            // Brief validation to check if sheet exists
            await this.repository.load_drive_folder()

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
    
    login(sheet_id) : Promise<string> {

        this._sheet_id.next(sheet_id)
        localStorage.setItem(environment.sheet_id, sheet_id)

        this.googleApi.login(sheet_id)
        return this.load()
    }

    reload() {
        this.repository.clear_cache()
        this.load()
    }
    
    logout() {
        this._sheet_id.next('')
        localStorage.removeItem(environment.sheet_id)
        this.repository.clear_cache()
        this.emit_status_event(-1)
    }
}