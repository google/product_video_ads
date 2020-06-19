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

@Injectable({providedIn: 'root'})
export class CachedConfigurationRepository extends ConfigurationRepository {

    public clear_cache() {
        Object.values(environment.local_storage_keys)
            .forEach(key => localStorage.removeItem(key))
    }

    async load_fonts(evict : boolean = false): Promise<Map<string, any>> {

        if (evict)
            localStorage.removeItem(environment.local_storage_keys.fonts)

        return (await this.load_data<Map<string, any>>(environment.local_storage_keys.fonts, super.load_fonts.bind(this)))
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