import { Component, OnInit } from '@angular/core';
import { LoginFacade } from '../login.facade';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  template: `
      <login-view 
          [ready]='ready | async'
          [sheet_id]='sheet_id | async'
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

  constructor(private loginFacade : LoginFacade) {}

  ngOnInit() {
    this.ready = this.loginFacade.ready
    this.sheet_id = this.loginFacade.sheet_id
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