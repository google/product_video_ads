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
import { ConfigurationRepository } from './configuration.repository';
import { environment } from 'environments/environment';
import { Product } from 'app/models/product';
import { Video } from 'app/models/video';
import { OfferType } from 'app/models/offertype';
import { Asset } from 'app/models/asset';
import { Base } from 'app/models/base';

@Injectable({providedIn: 'root'})
export class CachedConfigurationRepository extends ConfigurationRepository {

    public clear_cache() {
        Object.values(environment.local_storage_keys)
            .forEach(key => localStorage.removeItem(key))
    }

    async load_fonts(): Promise<object> {
        return (await this.load_data<object>(environment.local_storage_keys.fonts, super.load_fonts.bind(this)))
    }

    async upload_base_file(file : File) : Promise<any> {
        return super.upload_base_file(file)
    }

    async load_bases(): Promise<Base[]> {
        return (await this.load_data<Base[]>(environment.local_storage_keys.bases, super.load_bases.bind(this)))
    }

    async load_offer_types(): Promise<OfferType[]> {
        return (await this.load_data<OfferType[]>(environment.local_storage_keys.offer_types, super.load_offer_types.bind(this)))
    }

    async load_assets() : Promise<Asset[]> {
        return await super.load_assets()
        // return (await this.load_data<Asset[]>(environment.local_storage_keys.static_assets, super.load_assets.bind(this)))
    }

    async load_products() : Promise<Product[]> {
        return await super.load_products()
        // return (await this.load_data<Product[]>(environment.local_storage_keys.products, super.load_products.bind(this)))
    }

    async load_videos() : Promise<Video[]> {
        return await super.load_videos()
    }

    async load_drive_folder() : Promise<string> {
        const drive_folder = localStorage.getItem(environment.local_storage_keys.drive_folder)
        return drive_folder != null ? drive_folder : super.load_drive_folder()
    }

    async save_bases(bases: Base[]): Promise<any> {
        this.save_to_cache(environment.local_storage_keys.bases, bases)
        return super.save_bases(bases)
    }

    async save_assets(assets: Asset[]): Promise<any> {
        this.save_to_cache(environment.local_storage_keys.static_assets, assets)
        return super.save_assets(assets)
    }

    async save_products(products: Product[]): Promise<any> {
        this.save_to_cache(environment.local_storage_keys.products, products)
        return super.save_products(products)
    }

    async save_offer_type(offer_types: OfferType[]): Promise<any> {
        this.save_to_cache(environment.local_storage_keys.offer_types, offer_types)
        return super.save_offer_types(offer_types)
    }

    async save_videos(videos: Video[]): Promise<any> {
        this.save_to_cache(environment.local_storage_keys.videos, videos)
        return super.save_videos(videos)
    }

    private load_from_cache(key : string) {
        return localStorage.getItem(key)
    }

    private save_to_cache(key : string, value : Object) {
        localStorage.setItem(key, JSON.stringify(value))
    }

    private async load_data<T>(key : string, fallback : Function) : Promise<T> {

        // Check local cache
        const data = this.load_from_cache(key)

        if (data != null)
            return JSON.parse(data) as T

        // Fetch new data
        const fallback_data = await fallback()

        // Save locally
        this.save_to_cache(key, fallback_data)

        return fallback_data
    }
}