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

import { Component, OnInit } from '@angular/core';
import { LoginService } from 'app/modules/login/services/login.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-product',
  templateUrl: '../views/product.component.html',
  styleUrls: ['../views/product.component.scss']
})
export class ProductComponent {

  url : SafeResourceUrl

  constructor(private service : LoginService, private sanitizer: DomSanitizer) {
    this.service.ready$.subscribe(status => {
      if (status == 1)
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://docs.google.com/spreadsheets/d/'+ this.service.sheet_id +'/edit#gid=1670058881')
    })
  }
}