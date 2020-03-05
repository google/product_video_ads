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

import { Component } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { LoginService } from 'app/modules/login/services/login.service';

@Component({
  selector: 'app-auxiliar',
  templateUrl: '../views/assets.component.html',
  styleUrls: ['../views/assets.component.scss']
})
export class AssetsComponents {

  url : SafeResourceUrl

  constructor(private service : LoginService, private sanitizer: DomSanitizer) {
    this.service.ready$.subscribe(status => {
      if (status == 1)
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://docs.google.com/spreadsheets/d/'+ this.service.sheet_id +'/edit#gid=1412792783')
    })
  }
}