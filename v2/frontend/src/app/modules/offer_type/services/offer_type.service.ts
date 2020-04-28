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
// import * as UUID from 'uuid/v4'

@Injectable({providedIn: 'root'})
export class OfferTypeService {

    private readonly _offer_types = new BehaviorSubject<OfferType[]>([])
    private readonly _bases = new BehaviorSubject<object>({})
    private readonly _fonts = new BehaviorSubject<object>({})

    /** Published state to application **/
    readonly offer_types$ = this._offer_types.asObservable()
    readonly bases$ = this._bases.asObservable()
    readonly fonts$ = this._fonts.asObservable()

    get bases() {
        return {...this._bases.getValue()}
    }

    get fonts() {
        return {...this._fonts.getValue()}
    }

    get offer_types() {
        return [...this._offer_types.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1) {
                this._offer_types.next(await repository.load_offer_types())
                this._bases.next(await repository.load_bases())
                this._fonts.next(await repository.load_fonts())
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
        return this.save()
    }

    save() {
        console.log('Saving offer types...')
        return this.repository.save_offer_type(this.offer_types)
    }
}