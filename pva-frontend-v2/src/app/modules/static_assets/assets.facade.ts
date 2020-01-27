import { Injectable } from '@angular/core';
import { LoginService } from '../login/services/login.service';
import { AssetsService } from './services/assets.service';
import { Asset } from 'app/models/asset';

@Injectable()
export class AssetsFacade {
    
    constructor(private loginService : LoginService, private service : AssetsService) {}

    get ready() {
        return this.loginService.ready$
    }

    get assets() {
        return this.service.assets$
    }

    add_asset(image : string, text : string) {
        this.service.add_asset(new Asset(undefined, text, image))
    }
    
    delete_asset(id : number) {
        this.service.delete_asset(id)
    }
}