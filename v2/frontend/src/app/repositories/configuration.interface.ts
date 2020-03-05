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

export interface ConfigurationInterface {

    load_drive_folder() : Promise<string>
    upload_base_file(file : File) : Promise<any>
    load_fonts() : Promise<object>

    load_bases() : Promise<Base[]>
    save_bases(bases : Base[]) : Promise<any>

    load_assets() : Promise<Asset[]>
    save_assets(assets : Asset[]) : Promise<any>

    load_products() : Promise<Product[]>
    save_products(products : Product[]) : Promise<any>

    load_offer_types() : Promise<OfferType[]>
    save_offer_types(bases : OfferType[]) : Promise<any>

    load_videos() : Promise<Video[]>
    save_videos(videos : Video[]) : Promise<any>
}