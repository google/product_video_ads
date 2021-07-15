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

import { OfferType } from 'app/models/offertype';
import { Product } from 'app/models/product';
import { Video } from 'app/models/video';
import { Asset } from 'app/models/asset';
import { Base } from 'app/models/base';
import { AdsMetadata } from 'app/models/ads_metadata';

export interface ConfigurationInterface {

    load_drive_folder() : Promise<string>
    load_logs() : Promise<string[]>
    load_ads_defaults() : Promise<AdsMetadata>

    upload_font(file : File) : Promise<any>
    load_fonts() : Promise<Map<string, any>>

    upload_base_file(file : File) : Promise<any>
    load_bases() : Promise<Base[]>
    save_bases(bases : Base[]) : Promise<any>

    load_assets() : Promise<Asset[]>
    save_assets(assets : Asset[]) : Promise<any>

    load_products_sheets() : Promise<string[]>
    load_products(key? : string) : Promise<Product[]>

    load_offer_types() : Promise<OfferType[]>
    save_offer_types(bases : OfferType[]) : Promise<any>
    download_image_from_gcs(url : string) : Promise<string>

    load_videos() : Promise<Video[]>
    save_videos(videos : Video[]) : Promise<any>
    save_video(videos : Video[], id : string) : Promise<any>
    download_video_from_drive(url : string) : Promise<string>
}