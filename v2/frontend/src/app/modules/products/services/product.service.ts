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
import { Product } from 'app/models/product'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private is_ready : boolean = false

    private readonly _products = new BehaviorSubject<Product[]>([])
    
    /** Published state to application **/
    readonly products$ = this._products.asObservable()

    get products() {
        return [...this._products.getValue()]
    }

    constructor(private productsRepository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {

            if (ready == 1) {
                this.is_ready = true
                this.load_products()
            }
        })
    }

    private async load_products() {
        if (this.is_ready) {
            this._products.next(await this.productsRepository.load_products())
        }
    }

    public reload_products() : void {
        this.load_products()
    }
}