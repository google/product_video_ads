import { Injectable } from '@angular/core';
import { LoginService } from '../login/services/login.service';
import { ProductService } from '../products/services/product.service';
import { BasesService } from '../bases/services/bases.service';
import { OfferTypeService } from '../offer_type/services/offer_type.service';
import { Config } from 'app/models/config';
import { VideoService } from './services/video.service';

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

    get product_headers() {
        return this.productsService.headers
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

    update_videos() {
        this.videoService.update_videos()
    }

    delete_video(generated_video : string) {
        this.videoService.delete_video(generated_video)
    }
}