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