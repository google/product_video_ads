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
import { ProductService } from '../products/services/product.service';
import { BasesService } from '../bases/services/bases.service';
import { OfferTypeService } from '../offer_type/services/offer_type.service';
import { Config } from 'app/models/config';
import { VideoService } from './services/video.service';
import { Product } from 'app/models/product';
import { Base } from 'app/models/base';

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
        
        get bases$() {
            return this.basesService.bases$
        }

        get bases() {
            return this.basesService.bases
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

        get logs() {
            return this.videoService.logs$
        }

        public generate_final_configs(configs : Config[][], base : Base, product_keys : any) : Config[][] {
            
            let final_configs = []
            
            // Go through each product
            for(let i = 0; i < base.products.length; i++) {
                
                let ci : any = configs[i]
                
                // Treat each config item
                for(let config of ci) {
                    
                    let new_config : Config = {...config}
                    
                    if (new_config.type == 'product')
                        new_config.key = product_keys[i]
                    
                    new_config.start_time = base.products[i].start_time
                    new_config.end_time = base.products[i].end_time
                    
                    // Add item to final config
                    final_configs.push(new_config)
                }
            }

            return final_configs
        }
        
        add_preview_video(configs : Array<Config>, base : Base, name : string) {
            return this.videoService.add_preview_video(configs, base.title, name)
        }

        add_production_video(configs : Array<Config>, base : Base, video_metadata : any) {
            return this.videoService.add_production_video(configs, base.title, video_metadata)
        }
        
        get_available_groups_for_base() : Map<string, Product[]> {
            
            const groups : Map<string, Product[]> = new Map<string, Product[]>()

            for(let product of this.productsService.products) {
                const group_products = groups.get(product.group) || []
                group_products.push(product)
                groups.set(product.group, group_products)
            }
            
            return groups
        }
        
        get_configs_from_offer_type(offer_type_title : string) : Config[] {
            
            const offer_types = this.offerTypeService.offer_types.filter(o => o.title == offer_type_title)
            
            if (offer_types.length == 0)
                return []
            
            return offer_types[0].configs
        }
        
        update_videos() {
            this.videoService.update_videos()
        }

        update_logs() {
            this.videoService.update_logs()
        }

        reload_products() : void {
            this.productsService.reload_products()
        }
        
        delete_video(generated_video : string) {
            return this.videoService.delete_video(generated_video)
        }

        delete_all_videos() {
            return this.videoService.delete_all_videos()
        }

        get_products_by_offer_group(group : string) {
            return this.productsService.products.filter(prod => prod.group === group)
        }

        public validate_groups(product_groups : Map<string, Product[]>, base_product_count : number) : Map<string, string[]> {

            const validations = new Map<string, string[]>()

            for (const [group, products] of product_groups.entries()) {

                let errors = []

                // Validate if using inexistent offer types
                let missing_offer_types = this.validate_group_offertypes(products)

                if (missing_offer_types.length > 0)
                    errors.push(`ERROR: The offer group contains invalid offer types ${missing_offer_types}`)

                // Validate if not correct product count or invalid positions
                if (!this.validate_group_products(products, base_product_count))
                    errors.push(`ERROR: The ${base_product_count} positions configured in the offer group must be unique`)

                validations.set(group, errors)
            }

            return validations
        }

        private validate_group_offertypes(group_products : Product[]) : string[] {
            
            const offer_types = new Set(this.offerTypeService.offer_types.map(o => o.title))
            const missing_offer_types = []
            
            for (let p of group_products)
                if(!offer_types.has(p.offer_type))
                    missing_offer_types.push(p.offer_type)

            return missing_offer_types
        }
            
        private validate_group_products(group_products : Product[], base_product_count : number) {

            // Count matches?
            if (group_products.length != base_product_count)
                return false

            // Correct positions?
            let posSet = new Set();

            for(let p = 0; p < group_products.length; p++) {
                
                let pos = group_products[p].position;

                // 2. Validate uniqueness among positions in the Offer Group
                if(posSet.has(pos))
                    return false

                posSet.add(pos);
            }

            return true
        }
        
        public is_generating() : boolean {
            return this.videoService.is_generating()
        }

        public download_base_video(url : string) : Promise<string> {
            return this.videoService.download_base_video(url)
        }
    }