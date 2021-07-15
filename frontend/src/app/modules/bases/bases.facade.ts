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
import { BasesService } from './services/bases.service';
import { Base } from 'app/models/base';
import { FontsService } from './services/fonts.service';

@Injectable()
export class BasesFacade {
    
    constructor(private service : BasesService,
                private fontService : FontsService) {}

    get bases$() {
        return this.service.bases$
    }

    get bases() {
        return this.service.bases
    }

    get fonts$() {
        return this.fontService.fonts$
    }

    update_products(base : Base) {
        this.service.update_products(base.title, base.products)
    }

    add_base(title, file, id) {
        this.service.add_base(title, file, id)
    }

    upload_base_file(file : File) : Promise<any> {
        return this.service.upload_base_file(file)
    }

    delete_base(title : string) : Promise<any> {
        return this.service.delete_base(title)
    }

    upload_font(file : File) : Promise<any> {
        return this.fontService.upload_font(file)
    }

    update_file(base_title : string, file : string, url : string) {
        this.service.update_file(base_title, file, url)
    }

    reload_fonts() : Promise<any> {
        return this.fontService.reload_fonts()
    }

    download_video(id : string) : Promise<any> {
        return this.service.download_video(id)
    }

    save() {
        return this.service.save()
    }
}