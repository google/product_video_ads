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

@Injectable({providedIn: 'root'})
export class CachedConfigurationRepository extends ConfigurationRepository {

    // In-Memory ephemeral cache to avoid calling network so often
    cache : Map<string, any> = new Map<string, any>();

    public clear_cache() {
        this.cache.clear()
    }

    async download_image_from_gcs(url : string) : Promise<any> {
        return (await this.load_data(url, super.download_image_from_gcs.bind(this, url)))
    }

    async download_video_from_drive(url : string) : Promise<any> {
        return (await this.load_data(url, super.download_video_from_drive.bind(this, url)))
    }

    private save_to_cache(key : string, value : any) {
        this.cache.set(key, value)
    }

    private async load_data(key : string, fallback : Function) {

        // Check local cache
        if (this.cache.has(key))
            return this.cache.get(key)

        // Fetch new data
        const fallback_data = await fallback()

        // Save locally
        this.save_to_cache(key, fallback_data)

        return fallback_data
    }
}