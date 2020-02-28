import { Injectable } from '@angular/core';
import { LoginService } from '../login/services/login.service';
import { BaseService } from './services/base.service';
import { ProductService } from '../products/services/product.service';
import { Base, BaseConfigs } from 'app/models/entities';

@Injectable()
export class BaseFacade {
    
    constructor(private loginService : LoginService,
                private baseService : BaseService,
                private productsService : ProductService) {}

    get ready$() {
        return this.loginService.ready$
    }

    get bases$() {
        return this.baseService.bases$
    }

    get fonts$() {
        return this.baseService.fonts$
    }

    get products() {
        return this.productsService.products
    }

    delete_config(base : Base, id : string) {
        this.baseService.delete_config(base, id)
    }

    remove_config(name : string) {
        return this.baseService.remove_config(name)
    }

    add_config(base : Base) {
        this.baseService.add_config(base)
    }

    save() {
        return this.baseService.save_all_configs()
    }
}