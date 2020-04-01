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
import { Campaign } from 'app/models/campaign';

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
        
        private add_video(configs : Array<Config>, base : Base, product_keys : any) {
            
            let final_configs = []
            
            // Go through each product
            for(let i = 0; i < base.products.length; i++) {
                
                let ci : any = configs[i]
                
                // Treat each config item
                for(let config of ci) {
                    
                    let new_config = {...config}
                    
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
        
        add_preview_video(configs : Array<Config>, base : Base, product_keys : any) {

            const final_configs = this.add_video(configs, base, product_keys)

            return this.videoService.add_preview_video(final_configs, base.title)
        }

        add_production_video(configs : Array<Config>, base : Base, product_keys : any, campaign_configs : any) {

            const final_configs = this.add_video(configs, base, product_keys)

            const campaign = new Campaign(
                campaign_configs.account,
                campaign_configs.campaign,
                campaign_configs.target_location,
                campaign_configs.target_age,
                campaign_configs.target_user_interest,
                campaign_configs.url,
                campaign_configs.call_to_action,
                campaign_configs.adgroup_type
            )

            return this.videoService.add_production_video(final_configs, base.title, campaign)
        }
        
        get_available_groups_for_base(base_title : string) : Map<string, Product[]> {
            
            const groups : Map<string, Product[]> = new Map<string, Product[]>()
            const offer_types = this.offerTypeService.offer_types.filter(o => o.base == base_title).map(o => o.title)

            for(let product of this.productsService.products) {
                
                if (!product.group || offer_types.indexOf(product.offer_type) < 0)
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