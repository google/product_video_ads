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

import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from 'app/models/product';
import { VideoFacade } from '../video.facade';
import { Observable } from 'rxjs';
import { Base } from 'app/models/base';
import { OfferType } from 'app/models/offertype';
import { Video } from 'app/models/video';
import { VideoMetadata } from 'app/models/video_metadata';
import { DomSanitizer } from '@angular/platform-browser';
import { AdsMetadata } from 'app/models/ads_metadata';
import {MatDialog} from '@angular/material/dialog';
import { InfoVideoDialog } from './info_video.component';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-video',
  templateUrl: '../views/video.component.html',
  styleUrls: ['../views/video.component.scss'],
  providers: [VideoFacade]
})
export class VideoComponent implements OnInit {

  drive_url = environment.drive_file_prefix
  yt_url = environment.youtube_prefix
  displayedColumns = ['date', 'name', 'base', 'status', 'download', 'delete', 'info']
  visibilities = ['unlisted', 'public']
  ad_group_types = [['TRUE_VIEW_IN_STREAM', 'TRUE_VIEW_IN_STREAM'],
  ['TRUE_VIEW_IN_STREAM', 'TRUE_VIEW_FOR_ACTION'],
  ['TRUE_VIEW_IN_DISPLAY', 'TRUE_VIEW_IN_DISPLAY'],
  ['NON_SKIPPABLE_IN_STREAM', 'NON_SKIPPABLE_IN_STREAM'],
  ['BUMPER', 'BUMPER']]

  // Data to view flowing from services
  bases$ : Observable<Base[]>
  products_sheets$ : Observable<string[]>
  offer_types$ : Observable<OfferType[]>
  videos$ : Observable<Video[]>
  logs$ : Observable<string[]>

  // Chosen screen options
  base : Base
  product_sheet : string
  products : Product[]
  mode : string
  youtube : boolean
  custom_dir : boolean

  // Video configuration from screen (bulk)
  product_groups : Map<string, Product[]>
  product_groups_validations : Map<string, string[]>
  selected_groups : Map<string,  any> = new Map<string, any>()
  final_configs : Array<any>

  // Video configuration from screen (single)
  selected_offer_types : Array<string>
  selected_products: Array<string>
  video_metadata : any
  ads_metadata : any
  custom_dir_name : String
  
  constructor(private facade : VideoFacade, public sanitizer: DomSanitizer, public dialog: MatDialog, private _snackBar: MatSnackBar) {
      this.bases$ = this.facade.bases$
      this.products_sheets$ = this.facade.products_sheets$
      this.offer_types$ = this.facade.offer_types$
      this.videos$ = this.facade.videos
      this.logs$ = this.facade.logs
    }
    
    ngOnInit() {
      this.clear_screen_selections()
      this.facade.reload_products_sheets()
    }

    is_video(video : Video) {
      const video_base = this.facade.bases.filter(b => b.title == video.video_metadata.base_video)[0]
      return this.is_base_video(video_base)
    }

    is_base_video(base : Base) {
      return base && base.file.endsWith('mp4')
    }
    
    is_base_image(base : Base) {
      return base && !this.is_base_video(base)
    }

    choose_base(base : Base) {
      this.base = base

      this.selected_groups.clear()
      this.final_configs = []
      this.products = undefined
      this.product_sheet = undefined
      this.mode = ''
    }

    choose_products(key : string) {

      // Chosen product sheet
      this.product_sheet = key

      this.selected_groups.clear()
      this.final_configs = []
      this.mode = ''

      // Load products chosen
      this.facade.get_products(key).then(products => this.products = products)
      this._snackBar.open('Loading products from ' + key, 'OK', { duration: 4000 })
    }

    select_single_video_mode(youtube? : boolean, custom_dir? : boolean) {

      this.selected_offer_types = new Array(this.base.products.length)
      this.selected_products = new Array(this.base.products.length)

      this.mode = 'single'
      this.youtube = youtube != undefined && youtube
      this.custom_dir = custom_dir != undefined && custom_dir

      if (this.youtube)
        this.prepare_video_ads_metadata()
    }

    select_bulk_video_mode(youtube? : boolean, custom_dir? : boolean) {

      // Load avaiable products groups and their validations already
      this.product_groups = this.facade.get_available_groups_for_base(this.products)
      this.product_groups_validations = this.facade.validate_groups(this.product_groups, this.base.products.length)

      this.mode = 'bulk'
      this.youtube = youtube != undefined && youtube
      this.custom_dir = custom_dir != undefined && custom_dir

      if (this.youtube)
        this.prepare_video_ads_metadata()
    }

    async prepare_video_ads_metadata() {
      this.ads_metadata = await this.facade.load_ads_defaults()
    }

    is_all_filled() {
      if (this.custom_dir && !this.custom_dir_name) {
        // Make sure directory name is filled if we are using custom directory feature
        return false
      }

      if (this.mode == 'bulk') {
        // Skip remaining checks if we are creating in bulk
        return true
      }

      return !this.selected_offer_types.includes(undefined) && !this.selected_products.includes(undefined)
    }

    add_single_video(selected_products : Array<string>, selected_offer_types : Array<string>, video_metadata) {

      // Create a single video
      video_metadata.name = video_metadata.name || 'Preview'
      video_metadata.custom_dir = this.custom_dir_name

      this.add_video(
        this.facade.generate_final_configs(selected_offer_types, this.base, selected_products, this.products),
        video_metadata,
        this.ads_metadata
      )

      // Clear screen selections after all
      this.clear_screen_selections()

      this._snackBar.open('Single asset scheduled (check assets section above)', 'OK', { duration: 4000 })
    }

    check_all(element) {

      this.selected_groups.clear()

      const valid_groups = Array.from(this.product_groups.keys()).filter(k => this.product_groups_validations.get(k).length == 0)

      if (element.checked)
        for (let group of valid_groups)
          this.selected_groups.set(group, this.create_default_selected_group(group))
    }

    check_group(element, group) {
      if (element.checked)
        this.selected_groups.set(group, this.create_default_selected_group(group))
      else
        this.selected_groups.delete(group)
    }

    create_default_selected_group(group : string) {
      return {...this.ads_metadata, name: group}
    }

    review_create_bulk() {

      this.final_configs = []

      for(let [group, metadata] of this.selected_groups.entries()) {
        
        const group_products = this.product_groups.get(group)

        // Check how many videos should be created for that group
        for (let video = 0; video < group_products.length; video+=this.base.products.length) {

          let sorted_products = group_products.slice(video, video + this.base.products.length)
                                              .sort((a, b) => a.position - b.position)

          // Products Keys
          let product_keys = sorted_products.map(p => p.id)

          // Offer Type Configs
          let offer_types = sorted_products.map(p => p.offer_type)

          this.final_configs.push({
            name: metadata.name || group,
            description: metadata.description,
            visibility: metadata.visibility,
            configs: this.facade.generate_final_configs(offer_types, this.base, product_keys, this.products),
            account_id: metadata.account_id,
            campaign_name: metadata.campaign_name,
            ad_group_type: metadata.ad_group_type,
            url: metadata.url,
            call_to_action: metadata.call_to_action,
            target_location: metadata.target_location,
            audience_name: metadata.audience_name,
            ad_group_name: metadata.ad_group_name,
            ad_name: metadata.ad_name,
            custom_dir: this.custom_dir_name
          })
        }
      }
    }

    create_bulk() {

      // Generate all videos
      this.final_configs.forEach(final_configs => 
        this.add_video(final_configs.configs,
          final_configs,
          final_configs
        )
      )

      // Clear selections after all
      this.clear_screen_selections()

      this._snackBar.open('Scheduled for creation (check assets section above)', 'OK', { duration: 4000 })
    }

    private clear_screen_selections() {
      this.final_configs = []
      this.video_metadata = {}
      this.ads_metadata = {}
      this.base = undefined
      this.custom_dir_name = undefined
      this.products = undefined
      this.product_sheet = undefined
      this.mode = ''
    }

    
    private add_video(final_configs : any[], video_metadata : any, ads_metadata : any) {

      (this.youtube ? this.facade.add_production_video : this.facade.add_preview_video).apply(this.facade, [
        new VideoMetadata(
          video_metadata.name,
          this.base.title,
          this.product_sheet,
          final_configs,
          video_metadata.custom_dir,
          video_metadata.description,
          video_metadata.visibility
        ),
        new AdsMetadata(
          ads_metadata.account_id,
          ads_metadata.campaign_name,
          ads_metadata.ad_group_type,
          ads_metadata.url,
          ads_metadata.call_to_action,
          ads_metadata.target_location,
          ads_metadata.audience_name
        )
      ])
    }

    update_video() {
      this.facade.update_videos()
    }

    update_logs() {
      this.facade.update_logs()
    }

    delete_video(video : Video) {

      const video_name = video.video_metadata.name

      this._snackBar.open('Confirm deletion of ' + video_name + '?', 'Confirm', {
        duration: 4000,
      }).onAction().subscribe(() => {
        this.facade.delete_video(video.id).then(response => {
          this._snackBar.open("Asset deleted (" + response.status + ')', 'OK', { duration: 2000 })
        })
      })
    }

    delete_all_videos() {

      this._snackBar.open('Confirm deletion of all assets?', 'Confirm', {
        duration: 4000,
      }).onAction().subscribe(() => {
        this.facade.delete_all_videos().then(response => {
          this._snackBar.open("Assets deleted (" + response.status + ')', 'OK', {
            duration: 2000
          })
        })
      })
    }

    find_status_color(status : string) {
      switch(status) {
        case 'Done':
          return 'green'
        case 'Running':
          return 'purple'
        case 'Video Ready':
            return 'green'
        case 'Processing':
          return 'orange'
        case 'Preview':
          return 'blue'
        case 'On':
          return 'blue'
        case 'Error':
          return 'red'
      }

      return 'black'
    }

    info_asset(video : Video) {

      let url, type

      // Reason if it's youtube or drive video hosted
      if (['Running', 'Video Ready', 'On'].indexOf(video.status) >= 0) {
        url = this.sanitizer.bypassSecurityTrustResourceUrl(this.yt_url + video.generated_video)
        type = 'youtube'
      } else {
        url = video.generated_video
        type = 'drive'
      }     

      this.dialog.open(InfoVideoDialog, {
        width: '1000px',
        data: {
          video: video,
          type: type,
          url: url
        }
      })
    }

    indexTracker(index: number, value: any) {
      return index;
    }
  }

