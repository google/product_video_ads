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

    login(sheet_id) : Promise<string> {
        return this.loginService.login(sheet_id)
    }

    logout() {
        this.loginService.logout()
    }

    reload() {
        this.loginService.reload()
    }
}