import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Base, BaseConfigs } from 'app/models/entities'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'
import * as UUID from 'uuid/v4'

@Injectable({providedIn: 'root'})
export class BaseService {

    private readonly _bases = new BehaviorSubject<Base[]>([])
    private readonly _fonts = new BehaviorSubject<object>([])

    /** Published state to application **/
    readonly bases$ = this._bases.asObservable()
    readonly fonts$ = this._fonts.asObservable()

    get bases() {
        return [...this._bases.getValue()]
    }

    get fonts() {
        return {...this._fonts.getValue()}
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1) {
                this._bases.next(await repository.load_bases())
                this._fonts.next(await repository.load_fonts())
            }
        })
    }

    add_config(base : Base) {
        this._bases.next([...this.bases, base])
    }

    remove_config(name : string) {
        const base = this.bases.filter(b => b.name == name)[0]
        this._bases.next(this.bases.filter(b => b.name != name))
        return base
    }

    delete_config(base : Base, id : string) {

        let index = -1

        for(let i = 0; i < base.configs.length; i++) {
            if (base.configs[i].id == id) {
                index = i
                break
            }
        }

        console.log('before ' + base.configs.length)

        if (index >= 0)
            base.configs.splice(index, 1)

        console.log('after ' + base.configs.length)


    }

    save_all_configs() {

        console.log()

        return this.repository.save_bases(this.bases)
    }
}