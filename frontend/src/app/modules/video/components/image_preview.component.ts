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
import { Product } from 'app/models/product';

@Component({
    selector: 'app-image-preview',
    templateUrl: '../views/image_preview.component.html',
    styleUrls: ['../views/preview.component.scss'],
    providers: [VideoFacade]
})
export class ImagePreviewComponent implements OnInit {

    @Input() base: Base
    @Input() configs: Array<any>
    @Input() products : Product[]

    screenshots: Array<any>
    element_focused : any
    pos = {x_ratio: 1, y_ratio: 1}

    constructor(private facade: VideoFacade, private helper: InterfaceHelper, private _snackBar: MatSnackBar) {
        this.screenshots = []
        this.element_focused = undefined
    }

    ngOnInit() {
        // Take screenshots based on configs
        for(let c of this.configs) {
            console.log('Loading ' + c.name)
            this.take_screenshots_from_configs(c)
        }
    }

    save_changes(screenshot) {

        // To all timing positions
        for (let image of screenshot.images) {

            const adjusted_configs = this.helper.parse_elements_to_configs(image.elements, this.pos)

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

    async take_screenshots_from_configs(img) {

        // This is going to screen
        this.screenshots.push({
            name: img.name,
            images: [{
                image: this.base.url,
                elements: await this.helper.parse_configs_to_elements(img.configs as any[], this.products),
                configs: img.configs
            }]
        })
    }

    focus_element(element) {
        this.element_focused = element
    }
}