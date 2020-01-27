import { Injectable } from '@angular/core';
import { LoginService } from '../login/services/login.service';
import { OfferTypeService } from './services/offer_type.service';
import { ProductService } from '../products/services/product.service';
import { OfferType } from 'app/models/offertype';

@Injectable()
export class OfferTypeFacade {
    
    constructor(private loginService : LoginService,
                private offerTypeService : OfferTypeService,
                private productsService : ProductService) {}

    get ready$() {
        return this.loginService.ready$
    }

    get bases$() {
        return this.offerTypeService.bases$
    }

    get fonts$() {
        return this.offerTypeService.fonts$
    }

    get offer_types$() {
        return this.offerTypeService.offer_types$
    }

    get products() {
        return this.productsService.products$
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