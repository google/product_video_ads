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
import { AssetsService } from './services/assets.service';
import { Asset } from 'app/models/asset';

@Injectable()
export class AssetsFacade {
    
    constructor(private loginService : LoginService, private service : AssetsService) {}

    get ready() {
        return this.loginService.ready$
    }

    get assets() {
        return this.service.assets$
    }

    add_asset(image : string, text : string) {
        this.service.add_asset(new Asset(undefined, text, image))
    }
    
    delete_asset(id : number) {
        this.service.delete_asset(id)
    }
}