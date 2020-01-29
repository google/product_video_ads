import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'
import { Base } from 'app/models/base'

@Injectable({
    providedIn: 'root'
})
export class BasesService {
    
    private readonly _bases = new BehaviorSubject<Base[]>([])
    
    /** Published state to application **/
    readonly bases$ = this._bases.asObservable()

    get bases() {
        return [...this._bases.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1)
                this._bases.next(await this.repository.load_bases())
        })
    }

    /** Actions **/
    update_products(base_title : string, products : Array<any>) {
        this.bases.filter(b => b.title == base_title)[0].products = products
        this._bases.next(this.bases)
    }

    save() {
        return this.repository.save_bases(this.bases)
    }
}