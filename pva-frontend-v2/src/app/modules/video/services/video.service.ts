import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Video } from 'app/models/video'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'
import { Config } from 'app/models/config'

@Injectable({providedIn: 'root'})
export class VideoService {

    private readonly _videos = new BehaviorSubject<Video[]>([])
    
    /** Published state to application **/
    readonly videos$ = this._videos.asObservable()

    get videos() {
        return [...this._videos.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1)
                this._videos.next(await this.repository.load_videos())
            
        })
    }

    add_preview_video(configs : Array<Config>, base : string) {
        this._videos.next([...this.videos, new Video(configs, base, 'Preview')])
        return this.repository.save_videos(this.videos)
    }

    async update_videos() {
        this._videos.next(await this.repository.load_videos())
    }
}