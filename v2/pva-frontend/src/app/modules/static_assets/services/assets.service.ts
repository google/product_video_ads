import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'
import { Asset } from 'app/models/asset'

@Injectable({
    providedIn: 'root'
})
export class AssetsService {
    
    private readonly _assets = new BehaviorSubject<Asset[]>([])
    
    /** Published state to application **/
    readonly assets$ = this._assets.asObservable()

    get assets() {
        return [...this._assets.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1)
                this._assets.next(await this.repository.load_assets())
        })
    }

    /** Actions **/
    add_asset(asset : Asset) : Promise<any> {
        const next_id = Math.max(...this.assets.map(p => p.id)) + 1
        asset.id = next_id
        this._assets.next([...this.assets, asset])
        return this.repository.save_assets(this.assets)
    }
        
    delete_asset(id : number) : Promise<any> {
        this._assets.next(this.assets.filter(a => a.id != id))
        return this.repository.save_assets(this.assets)
    }
}