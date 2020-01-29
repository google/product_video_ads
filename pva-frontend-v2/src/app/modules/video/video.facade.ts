import { Injectable } from '@angular/core';
import { LoginService } from '../login/services/login.service';
import { ProductService } from '../products/services/product.service';
import { OfferType } from 'app/models/offertype';
import { AssetsService } from '../static_assets/services/assets.service';
import { BasesService } from '../bases/services/bases.service';
import { OfferTypeService } from '../offer_type/services/offer_type.service';

@Injectable()
export class VideoFacade {
    
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

    get product_headers() {
        return this.productsService.headers
    }

    get products() {
        return this.productsService.products$
    }

    get assets() {
        return this.assetsService.assets
    }

    delete_offer_type(title : string) {
        this.offerTypeService.delete_offer_type(title)
    }

    add_offer_type(offer_type : OfferType) {
        this.offerTypeService.add_offer_type(offer_type)
    }

    save() {
        return this.offerTypeService.save()
    }
}