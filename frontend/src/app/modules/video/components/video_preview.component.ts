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

import { Component, OnInit, Input } from '@angular/core';
import { VideoFacade } from '../video.facade';
import { Base } from 'app/models/base';
import { InterfaceHelper } from 'app/modules/shared/InterfaceHelper';
import { MatSnackBar } from '@angular/material/snack-bar';
import VideoSnapshot from 'video-snapshot';
import { Product } from 'app/models/product';

@Component({
    selector: 'app-video-preview',
    templateUrl: '../views/video_preview.component.html',
    styleUrls: ['../views/preview.component.scss'],
    providers: [VideoFacade]
})
export class VideoPreviewComponent implements OnInit {

    @Input() base: Base
    @Input() configs: Array<any>
    @Input() products : Product[]

    snapshoter: VideoSnapshot
    base_specs: any
    screenshots: Array<any>
    element_focused : any

    constructor(private facade: VideoFacade, private helper: InterfaceHelper, private _snackBar: MatSnackBar) {
        this.snapshoter = undefined
        this.screenshots = []
        this.element_focused = undefined
    }

    ngOnInit() {

        const video_data = this.facade.download_base_video(this.base.id)

        // Load Base video
        video_data.then(async data => {

            // Parse string to unicode
            const byteNumbers = new Array(data.length)

            for (let i = 0; i < data.length; i++)
                byteNumbers[i] = data.charCodeAt(i)

            // Instantiate snapshoter
            this.snapshoter = new VideoSnapshot(new Blob([new Uint8Array(byteNumbers)]))

            // Create fake video element to get width and Height
            const video = document.createElement('video')

            // Use loaded video to retrieve width and height
            video.onloadedmetadata = async _ => {

                const adjust = video.videoWidth / 800
                const WIDTH = video.videoWidth / adjust
                const HEIGHT = video.videoHeight / adjust

                // To calculate elements positions relative
                this.base_specs = {
                    width: WIDTH,
                    height: HEIGHT,
                    x_ratio: video.videoWidth / WIDTH,
                    y_ratio: video.videoHeight / HEIGHT
                }

                // Take screenshots based on configs
                for(let c of this.configs) {
                    console.log('Loading ' + c.name)
                    await this.take_screenshots_from_configs(c)
                }
            }

            video.src = `data:video/mp4;base64,${btoa(data)}`
        })
    }

    save_changes(screenshot) {

        // To all timing positions
        for (let image of screenshot.images) {

            const adjusted_configs = this.helper.parse_elements_to_configs(image.elements, this.base_specs)

            // Copy values changed correctly
            for (let i = 0; i < image.elements.length; i++) {
                image.configs[i].x = adjusted_configs[i].x
                image.configs[i].y = adjusted_configs[i].y
                image.configs[i].color = adjusted_configs[i].color
                image.configs[i].size = adjusted_configs[i].size
                image.configs[i].width = adjusted_configs[i].width
                image.configs[i].height = adjusted_configs[i].height
                image.configs[i].align = adjusted_configs[i].align
            }
        }

        this._snackBar.open('Saved positions to ' + screenshot.name, 'OK')
    }

    async take_screenshots_from_configs(video) {

        let times: any = {}

        // Iterate each config and assing to correct timing
        for (let c of video.configs) {
            let already_added = times[c.start_time] || []
            already_added.push(c)
            times[c.start_time] = already_added
        }

        const images = []

        // Take screenshot to each timing
        for (let [time, configs] of Object.entries(times)) {
            images.push({
                image: await this.snapshoter.takeSnapshot(parseFloat(time)),
                elements: await this.helper.parse_configs_to_elements(configs as any[], this.products),
                configs: configs,
                time: time
            })
        }

        // This is going to screen
        this.screenshots.push({
            name: video.name,
            images: images.sort((a, b) => a.time - b.time)
        })
    }

    focus_element(element) {
        this.element_focused = element
    }
}