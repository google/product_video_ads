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
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video',
  templateUrl: '../views/video_campaigns.component.html',
  styleUrls: ['../views/video_campaigns.component.scss'],
  providers: [VideoFacade]
})
export class VideoCampaignsComponent implements OnInit {

  drive_url = 'https://drive.google.com/uc?export=download&id='
  yt_url = 'https://www.youtube.com/embed/'

  ad_group_types = [
    'TRUE_VIEW_IN_STREAM', 
    'TRUE_VIEW_IN_DISPLAY', 
    'NON_SKIPPABLE_IN_STREAM',
    'BUMPER'
  ]
  
  // Data to view
  bases : Observable<Base[]>
  products : Observable<Product[]>
  offer_types : Observable<OfferType[]>
  videos : Observable<Video[]>
  logs : Observable<string[]>

  product_groups : Map<string, Product[]>
  selected_groups : Map<string, any> = new Map<string, any>()
  mode : string
  
  // Chosen
  base : Base
  configs : Array<any>
  product_keys: Array<any>
  campaign : any = {}
  
  constructor(private facade : VideoFacade, public sanitizer: DomSanitizer, private _snackBar: MatSnackBar) {
      this.offer_types = this.facade.offer_types$
      this.videos = this.facade.videos
      this.logs = this.facade.logs
    }
    
    ngOnInit() {
      this.bases = this.facade.bases$
      this.products = this.facade.products

      this.facade.reload_products()
    }
    
    choose_base(base : Base) {
      this.configs = new Array(base.products.length)
      this.product_keys = new Array(base.products.length)

      this.base = base
      this.mode = ''
    }

    is_video(video : Video) {
      const video_base = this.facade.bases.filter(b => b.title == video.base_video)[0]
      return video_base && video_base.file.endsWith('mp4')
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

    add_single_video(product_keys, configs, campaign_configs) {
      this.add_video(product_keys, configs, campaign_configs)
      this._snackBar.open('Single ad scheduled (check Ads section above)', 'OK', { duration: 4000 })
    }
    
    private add_video(product_keys, configs, campaign_configs) {
      this.facade.add_production_video(configs, this.base, product_keys, campaign_configs).then(response => {
        this.mode = ''
      })
    }

    check_group(element, group) {
      if (element.checked)
        this.selected_groups.set(group, {})
      else
        this.selected_groups.delete(group)
    }

    create_bulk() {

      for(let [group, campaign_configs] of this.selected_groups.entries()) {

        const group_products = this.product_groups.get(group)

        // Check how many videos should be created for that group
        for (let video = 0; video < group_products.length; video+=this.base.products.length) {

          let sorted_products = group_products.slice(video, video + this.base.products.length)
                                              .sort((a, b) => a.position - b.position)

          this.add_video(
            sorted_products.map(p => p.id),
            sorted_products.map(p => this.facade.get_configs_from_offer_type(p.offer_type, this.base.title)),
            campaign_configs
          )
        }
      }

      this._snackBar.open('Scheduled for creation (check Ads section above)', 'OK', { duration: 4000 })
    }

    update_video() {
      this.facade.update_videos()
    }

    update_logs() {
      this.facade.update_logs()
    }

    delete_video(video : Video) {

      const video_name = video.generated_video || 'being generated'

      this._snackBar.open('Confirm deletion of asset ' + video_name + '?', 'Confirm', {
        duration: 4000,
      }).onAction().subscribe(() => {
        this.facade.delete_video(video.generated_video).then(response => {
          this._snackBar.open("Asset deleted (" + response.status + ')', 'OK', {
            duration: 2000
          })
        })
      })
    }
    
    indexTracker(index: number, value: any) {
      return index;
    }
  }
