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
import { LoginService } from './services/login.service';

@Injectable()
export class LoginFacade {
    
    constructor(public loginService : LoginService) {}

    get ready() {
        return this.loginService.ready$
    }

    get sheet_id() {
        return this.loginService.sheet_id$
    }

    get drive_folder() {
        return this.loginService.drive_folder$
    }

    login(sheet_id) {
        this.loginService.login(sheet_id)
    }

    logout() {
        this.loginService.logout()
    }

    share_access(email) : Promise<void> {
        return this.loginService.share_access(email)
    }

    generate_new() {
        return this.loginService.generate_new()
    }
}