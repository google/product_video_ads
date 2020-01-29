import { Injectable } from '@angular/core';
import { LoginService } from '../login/services/login.service';
import { BasesService } from './services/bases.service';
import { Base } from 'app/models/base';

@Injectable()
export class BasesFacade {
    
    constructor(private loginService : LoginService, private service : BasesService) {}

    get ready() {
        return this.loginService.ready$
    }

    get bases$() {
        return this.service.bases$
    }

    update_products(base : Base) {
        this.service.update_products(base.title, base.products)
    }

    save() {
        return this.service.save()
    }
}