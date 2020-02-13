import { Injectable } from '@angular/core';
import { LoginService } from '../login/services/login.service';
import { ProductService } from '../products/services/product.service';
import { BasesService } from '../bases/services/bases.service';
import { OfferTypeService } from '../offer_type/services/offer_type.service';
import { Config } from 'app/models/config';
import { VideoService } from './services/video.service';
import { Product } from 'app/models/product';

@Injectable()
export class VideoFacade {
    
    constructor(private loginService : LoginService,
                private offerTypeService : OfferTypeService,
                private videoService : VideoService,
                private basesService : BasesService,
                private productsService : ProductService) {}

    get ready$() {
        return this.loginService.ready$
    }

    get bases() {
        return this.basesService.bases$
    }

    get offer_types$() {
        return this.offerTypeService.offer_types$
    }

    get products() {
        return this.productsService.products$
    }

    get videos() {
        return this.videoService.videos$
    }

    add_preview_video(configs : Array<Config>, base : string) {
        return this.videoService.add_preview_video(configs, base)
    }

    get_available_groups_for_base() : Map<string, Product[]> {

        const groups : Map<string, Product[]> = new Map<string, Product[]>()

        for(let product of this.productsService.products) {

            if (!product.group)
                continue

            const group_products = groups.get(product.group) || []
            group_products.push(product)
            groups.set(product.group, group_products)
        }

        return groups
    }

    get_configs_from_offer_type(offer_type_title : string, base_title : string) : Config[] {

        const offer_types = this.offerTypeService.offer_types.filter(o => o.title == offer_type_title && o.base == base_title)
        
        if (offer_types.length == 0)
            return []

        return offer_types[0].configs
    }

    update_videos() {
        this.videoService.update_videos()
    }

    delete_video(generated_video : string) {
        this.videoService.delete_video(generated_video)
    }
}