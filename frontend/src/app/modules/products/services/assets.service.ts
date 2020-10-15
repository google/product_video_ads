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
import { BehaviorSubject } from 'rxjs'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'
import { Asset } from 'app/models/asset'

@Injectable({
    providedIn: 'root'
})
export class AssetsService {
    
    private is_ready : boolean = false

    private readonly _assets = new BehaviorSubject<Asset[]>([])
    
    /** Published state to application **/
    readonly assets$ = this._assets.asObservable()

    get assets() {
        return [...this._assets.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1) {
                this.is_ready = true
                this.load_assets()
            }
        })
    }

    async load_assets() {
        if (this.is_ready)
            this._assets.next(await this.repository.load_assets())
    }

    reload_assets() {
        this.load_assets()
    }
}