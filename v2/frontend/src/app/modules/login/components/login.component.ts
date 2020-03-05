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
import { LoginFacade } from '../login.facade';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  template: `
      <login-view 
          [ready]='ready | async'
          [sheet_id]='sheet_id | async'
          [drive_folder]='drive_folder | async'
          (onlogin)='login($event)'
          (onlogout)='logout()'
          (onreload)='reload()'>
      </login-view>
  `,
  providers: [ LoginFacade ]
})
export class LoginComponent implements OnInit {

  ready : Observable<number>
  sheet_id : Observable<string>
  drive_folder : Observable<string>

  constructor(private loginFacade : LoginFacade) {}

  ngOnInit() {
    this.ready = this.loginFacade.ready
    this.sheet_id = this.loginFacade.sheet_id
    this.drive_folder = this.loginFacade.drive_folder
  }

  login(sheet_id) {
    this.loginFacade.login(sheet_id)
      .catch(e => alert('Fail to load:' + e))
  }

  logout() {
    this.loginFacade.logout()
  }

  reload() {
    this.loginFacade.reload()
  }
}