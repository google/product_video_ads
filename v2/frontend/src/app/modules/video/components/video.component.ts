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

import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from 'app/models/product';
import { VideoFacade } from '../video.facade';
import { Observable } from 'rxjs';
import { Base } from 'app/models/base';
import { OfferType } from 'app/models/offertype';
import { Video } from 'app/models/video';

@Component({
  selector: 'app-video',
  templateUrl: '../views/video.component.html',
  styleUrls: ['../views/video.component.scss'],
  providers: [VideoFacade]
})
export class VideoComponent implements OnInit {

  drive_url = 'https://drive.google.com/uc?export=download&id='
  
  // Data to view
  bases$ : Observable<Base[]>
  products : Observable<Product[]>
  offer_types : Observable<OfferType[]>
  videos : Observable<Video[]>
  logs : Observable<string[]>

  product_groups : Map<string, Product[]>
  selected_groups : Set<string> = new Set<string>()
  mode : string
  
  // Chosen
  base : Base
  configs : Array<any>
  product_keys: Array<any>
  
  constructor(private facade : VideoFacade, private _snackBar: MatSnackBar) {
      this.offer_types = this.facade.offer_types$
      this.videos = this.facade.videos
      this.logs = this.facade.logs
    }
    
    ngOnInit() {
      this.bases$ = this.facade.bases$
      this.products = this.facade.products

      this.facade.reload_products()
    }

    is_video(video : Video) {
      return this.facade.bases.filter(b => b.title == video.base_video)[0].file.endsWith('mp4')
    }
    
    choose_base(base : Base) {
      this.configs = new Array(base.products.length)
      this.product_keys = new Array(base.products.length)

      this.base = base
      this.mode = ''
    }

    select_single_video_mode() {
      this.mode = 'single'
    }

    select_bulk_video_mode() {
      this.product_groups = this.facade.get_available_groups_for_base(this.base.title)
      this.mode = 'bulk'
    }

    is_all_filled() {
      return !this.configs.includes(undefined) && !this.product_keys.includes(undefined)
    }
    
    add_video() {
      this.facade.add_preview_video(this.configs, this.base, this.product_keys)
      .then(response => { this.mode = '' })
    }

    check_group(element, group) {
      if (element.checked)
        this.selected_groups.add(group)
      else
        this.selected_groups.delete(group)
    }

    check_all(element) {

      this.selected_groups.clear()

      if (element.checked)
        for (let group of this.product_groups.keys())
          this.selected_groups.add(group)
    }

    create_bulk() {

      for(let group of this.selected_groups) {

        const sorted_products = this.product_groups.get(group).sort((a, b) => a.position - b.position)
        const product_keys = sorted_products.map(p => p.id)
        const configs = sorted_products.map(p => this.facade.get_configs_from_offer_type(p.offer_type, this.base.title))
        
        // Check how many videos should be created for that group
        for (let video = 0; video < product_keys.length; video+=this.base.products.length) {

          this.product_keys = product_keys.slice(video, video + this.base.products.length)
          this.configs = configs.slice(video, video + this.base.products.length)

          this.add_video()
        }
      }

      this._snackBar.open('Scheduled for creation (check videos section above)', 'OK', { duration: 4000 })
    }

    update_video() {
      this.facade.update_videos()
    }

    update_logs() {
      this.facade.update_logs()
    }

    delete_video(video : Video) {

      const video_name = video.generated_video || 'being generated'

      this._snackBar.open('Confirm deletion of video ' + video_name + '?', 'Confirm', {
        duration: 4000,
      }).onAction().subscribe(() => {
        this.facade.delete_video(video.generated_video).then(response => {
          this._snackBar.open("Video deleted (" + response.status + ')', 'OK', {
            duration: 2000
          })
        })
      })
    }
    
    indexTracker(index: number, value: any) {
      return index;
    }
  }