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
import { BasesService } from './services/bases.service';
import { Base } from 'app/models/base';

@Injectable()
export class BasesFacade {
    
    constructor(private loginService : LoginService, private service : BasesService) {}

    get ready() {
        return this.loginService.ready$
    }

    get bases$() {
        return this.service.bases$
    }

    get bases() {
        return this.service.bases
    }

    update_products(base : Base) {
        this.service.update_products(base.title, base.products)
    }

    add_base(title, file, id) {
        return this.service.add_base(title, file, id)
    }

    upload_base_file(file : File) : Promise<any> {
        return this.service.upload_base_file(file)
    }

    delete_base(title : string) : Promise<any> {
        return this.service.delete_base(title)
    }

    save() {
        return this.service.save()
    }
}