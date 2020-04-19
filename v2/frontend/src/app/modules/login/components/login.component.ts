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
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
      <login-view 
          [ready]='ready | async'
          [sheet_id]='sheet_id | async'
          [drive_folder]='drive_folder | async'
          [sheet_text]='sheet_text'
          (onlogin)='login($event)'
          (onlogout)='logout()'
          (onreload)='reload()'
          (ongeneratenew)='generate_new()'>
      </login-view>
  `,
  providers: [ LoginFacade ]
})
export class LoginComponent implements OnInit {

  ready : Observable<number>
  sheet_id : Observable<string>
  drive_folder : Observable<string>

  sheet_text : string = ''

  constructor(private loginFacade : LoginFacade, private route : ActivatedRoute) {}

  ngOnInit() {
    this.ready = this.loginFacade.ready
    this.sheet_id = this.loginFacade.sheet_id
    this.drive_folder = this.loginFacade.drive_folder

    const query_sheet_id = this.route.snapshot.queryParamMap.get('sheet_id')

    if (query_sheet_id)
      this.sheet_text = query_sheet_id
  }

  login(sheet) {
    this.loginFacade.login(sheet)
  }

  logout() {
    this.loginFacade.logout()
  }

  reload() {
    this.loginFacade.reload()
  }

  generate_new() {
    this.loginFacade.generate_new()
  }
}