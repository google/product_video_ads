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

import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'

@Injectable({
    providedIn: 'root'
})
export class FontsService {
    
    private readonly _fonts = new BehaviorSubject<Map<string, any>>(null)
    
    /** Published state to application **/
    readonly fonts$ = this._fonts.asObservable()

    get fonts() {
        return {...this._fonts.getValue()}
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1)
                this._fonts.next(await repository.load_fonts())
        })
    }

    upload_font(file : File) : Promise<any> {
        return this.repository.upload_font(file)
    }

    async reload_fonts() : Promise<any> {
        return this._fonts.next(await this.repository.load_fonts())
    }
}