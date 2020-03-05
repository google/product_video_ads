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
    
    private readonly _assets = new BehaviorSubject<Asset[]>([])
    
    /** Published state to application **/
    readonly assets$ = this._assets.asObservable()

    get assets() {
        return [...this._assets.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1)
                this._assets.next(await this.repository.load_assets())
        })
    }

    /** Actions **/
    add_asset(asset : Asset) : Promise<any> {
        const next_id = Math.max(...this.assets.map(p => p.id)) + 1
        asset.id = next_id
        this._assets.next([...this.assets, asset])
        return this.repository.save_assets(this.assets)
    }
        
    delete_asset(id : number) : Promise<any> {
        this._assets.next(this.assets.filter(a => a.id != id))
        return this.repository.save_assets(this.assets)
    }
}