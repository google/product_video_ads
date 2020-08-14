/* 
   Copyright 2020 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   https://www.apache.org/licenses/LICENSE-2.0
 
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Video } from 'app/models/video'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'
import { Config } from 'app/models/config'
import { Campaign } from 'app/models/campaign'

@Injectable({providedIn: 'root'})
export class VideoService {

    private readonly _videos = new BehaviorSubject<Video[]>([])
    private readonly _logs = new BehaviorSubject<string[]>([])

    /** Published state to application **/
    readonly videos$ = this._videos.asObservable()
    readonly logs$ = this._logs.asObservable()

    get videos() {
        return [...this._videos.getValue()]
    }

    get logs() {
        return [...this._logs.getValue()]
    }

    constructor(private repository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {

            if (ready == 1) {
                this.update_videos()
                this.update_logs()
            }
        })
    }

    add_preview_video(configs : Array<Config>, base : string, name : string) {
        return this.add_video(configs, base, 'Preview', name)
    }

    add_production_video(configs : Array<Config>, base : string, campaign : Campaign, name : string) {
        return this.add_video(configs, base, 'On', name, campaign)
    }

    private add_video(configs : Array<Config>, base : string, status : string, name : string, campaign? : Campaign) {
        this._videos.next([...this.videos, new Video(new Date().toLocaleString('pt-BR'), name, configs, base, status, campaign)])
        return this.repository.save_videos(this.videos)
    }

    public download_base_video(url : string) : Promise<string> {
        return this.repository.download_base_video_from_drive(url)
    }

    async update_videos() {
        this._videos.next(await this.repository.load_videos())
    }

    async update_logs() {
        this._logs.next(await this.repository.load_logs())
    }

    is_generating() : boolean {
        return this.videos.some(video => ['Preview', 'On'].indexOf(video.status) >= 0)
    }

    delete_video(generated_video : string) {
        this._videos.next(this.videos.filter(v => v.generated_video != generated_video))
        return this.repository.save_videos(this.videos)
    }
}