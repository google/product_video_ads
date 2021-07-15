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
import { Base } from 'app/models/base'
import { environment } from 'environments/environment'

@Injectable({
    providedIn: 'root'
})
export class BasesService {
    
    private readonly _bases = new BehaviorSubject<Base[]>([])
    
    /** Published state to application **/
    readonly bases$ = this._bases.asObservable()

    get bases() {
        return [...this._bases.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1)
                this._bases.next(await this.repository.load_bases())
        })
    }

    /** Actions **/
    update_products(base_title : string, products : Array<any>) {
        this.bases.filter(b => b.title == base_title)[0].products = products
        this._bases.next(this.bases)
    }

    add_base(title, file, id) {
        this._bases.next([...this.bases, new Base(title, file, [], environment.drive_file_prefix + id)])
    }

    delete_base(title : string) : Promise<any> {
        this._bases.next(this.bases.filter(b => b.title != title))
        return this.save()
    }

    download_video(id : string) : Promise<any> {
        return this.repository.download_video_from_drive(id)
    }

    upload_base_file(file : File) : Promise<any> {
        return this.repository.upload_base_file(file)
    }

    update_file(base_title : string, file : string, id) {
        const base = this.bases.filter(b => b.title == base_title)[0]
        base.file = file
        base.url = environment.drive_file_prefix + id
        this._bases.next(this.bases)
    }

    save() {
        return this.repository.save_bases(this.bases)
    }
}