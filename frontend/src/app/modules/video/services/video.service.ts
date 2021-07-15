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
import { VideoMetadata } from 'app/models/video_metadata'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'
import * as UUID from 'uuid/v4'
import { AdsMetadata } from 'app/models/ads_metadata'

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

    add_preview_video(video_metadata : VideoMetadata) {
        return this.add_video('Preview', video_metadata)
    }

    add_production_video(video_metadata : VideoMetadata, ads_metadata : AdsMetadata) {
        return this.add_video('On', video_metadata, ads_metadata)
    }

    private add_video(status : string, video_metadata : VideoMetadata, ads_metadata? : AdsMetadata) {

        const new_video = new Video(
            UUID(),
            ads_metadata,
            video_metadata, 
            status,
            ''
        )

        this._videos.next([...this.videos, new_video])
        
        return this.repository.save_video(this.videos, new_video.id)
    }

    public download_base_video(url : string) : Promise<string> {
        return this.repository.download_video_from_drive(url)
    }

    async update_videos() {
        this._videos.next(await this.repository.load_videos())
    }

    async load_ads_defaults() : Promise<AdsMetadata> {
        return this.repository.load_ads_defaults()
    }

    async update_logs() {
        this._logs.next(await this.repository.load_logs())
    }

    delete_video(id : string) {
        this.videos.find(v => v.id == id).status = 'Deleted'
        return this.repository.save_video(this.videos, id)
    }

    delete_all_videos() {
        this._videos.next([])
        return this.repository.save_videos(this.videos)
    }
}