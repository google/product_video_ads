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

    add_config(base : Base, config : BaseConfigs) {
        base.configs.push(config)
        config.id = UUID()
    }

    delete_config(base : Base, id : string) {

        let index = -1

        for(let i = 0; i < base.configs.length; i++) {
            if (base.configs[i].id == id) {
                index = i
                break
            }
        }

        if (index >= 0)
            base.configs.splice(index, 1)
    }

    save_all_configs() {
        return this.repository.save_bases(this.bases)
    }
}