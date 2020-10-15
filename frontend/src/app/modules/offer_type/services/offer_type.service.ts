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
import { OfferType } from 'app/models/offertype'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'
import { Config } from 'app/models/config'
// import * as UUID from 'uuid/v4'

@Injectable({providedIn: 'root'})
export class OfferTypeService {

    private readonly _offer_types = new BehaviorSubject<OfferType[]>([])
    private readonly _bases = new BehaviorSubject<object>({})

    /** Published state to application **/
    readonly offer_types$ = this._offer_types.asObservable()
    readonly bases$ = this._bases.asObservable()

    get bases() {
        return {...this._bases.getValue()}
    }

    get offer_types() {
        return [...this._offer_types.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1) {
                this._offer_types.next(await repository.load_offer_types())
                this._bases.next(await repository.load_bases())
            }
        })
    }

    add_offer_type(offer_type : OfferType) {
        console.log('Adding offer type...')
        this._offer_types.next([...this.offer_types, {...offer_type}])
    }

    delete_offer_type(title : string, base : string) {
        console.log('Deleting offer type...')
        this._offer_types.next(this.offer_types.filter(o => o.title != title || o.base != base))
    }

    get_configs(offer_type_title : string) : Config[] {
            
        const offer_types = this.offer_types.filter(o => o.title == offer_type_title)
        
        if (offer_types.length == 0)
            return []
        
        // Recursion to add all parent configs as well
        return this.get_configs(offer_types[0].parent).concat(offer_types[0].configs)
    }

    download_image_from_gcs(url : string) : Promise<string> {
        return this.repository.download_image_from_gcs(url)
     }

    save() {
        console.log('Saving offer types...')
        return this.repository.save_offer_types(this.offer_types)
    }
}