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

    add_base(title, file, id) {
        return this.service.add_base(title, file, id)
    }

    upload_base_file(file : File) : Promise<any> {
        return this.service.upload_base_file(file)
    }

    delete_base(title : string) : Promise<any> {
        return this.service.delete_base(title)
    }

    save() {
        return this.service.save()
    }
}