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

import { Injectable } from '@angular/core';
import { LoginService } from '../login/services/login.service';
import { OfferTypeService } from './services/offer_type.service';
import { ProductService } from '../products/services/product.service';
import { OfferType } from 'app/models/offertype';
import { AssetsService } from '../static_assets/services/assets.service';
import { BasesService } from '../bases/services/bases.service';

@Injectable()
export class OfferTypeFacade {
    
    constructor(private loginService : LoginService,
                private offerTypeService : OfferTypeService,
                private assetsService : AssetsService,
                private basesService : BasesService,
                private productsService : ProductService) {}

    get ready$() {
        return this.loginService.ready$
    }

    get bases() {
        return this.basesService.bases$
    }

    get fonts() {
        return this.offerTypeService.fonts
    }

    get offer_types$() {
        return this.offerTypeService.offer_types$
    }

    get products() {
        return this.productsService.products
    }

    get product_headers() {
        return this.products.length > 0 ? Object.keys(this.products[0].values) : []
    }

    get assets() {
        return this.assetsService.assets
    }

    delete_offer_type(title : string, base : string) {
        return this.offerTypeService.delete_offer_type(title, base)
    }

    add_offer_type(offer_type : OfferType) {
        this.offerTypeService.add_offer_type(offer_type)
    }

    update_products() {
        this.assetsService.reload_assets()
        this.productsService.reload_products()
    }

    save() {
        return this.offerTypeService.save()
    }
}