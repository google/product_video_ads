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

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LoginFacade } from '../login.facade';

@Component({
  selector: 'login-view',
  templateUrl: '../views/login.component.html',
  styleUrls: ['../views/login.component.scss'],
  providers: [ LoginFacade ]
})
export class LoginPresentation {

  @Input() ready : number
  @Input() sheet_id : string
  @Input() drive_folder : string

  @Output() onlogin = new EventEmitter<string>()
  @Output() onlogout = new EventEmitter()
  @Output() onreload = new EventEmitter()

  login(sheet_id) {
    this.onlogin.emit(sheet_id)
  }

  logout() {
    this.onlogout.emit()
  }

  reload() {
    this.onreload.emit()
  }
}