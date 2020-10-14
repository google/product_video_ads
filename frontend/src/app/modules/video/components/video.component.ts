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
import { VideoMetadata } from 'app/models/video_metadata';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video',
  templateUrl: '../views/video.component.html',
  styleUrls: ['../views/video.component.scss'],
  providers: [VideoFacade]
})
export class VideoComponent implements OnInit {

  drive_url = 'https://drive.google.com/uc?export=download&id='
  yt_url = 'https://www.youtube.com/embed/'
  
  visibilities = ['unlisted', 'public']

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

  // Video configuration from screen
  product_groups : Map<string, Product[]>
  product_groups_validations : Map<string, string[]>
  selected_groups : Map<string,  any> = new Map<string, any>()
  configs : Array<any>
  product_keys: Array<any>
  final_configs : Array<any>
  video_metadata : any
  
  constructor(private facade : VideoFacade, public sanitizer: DomSanitizer, private _snackBar: MatSnackBar) {
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
    
    choose_base(base : Base) {
      this.configs = new Array(base.products.length)
      this.final_configs = []
      this.selected_groups.clear()
      this.product_keys = new Array(base.products.length)

      this.base = base
      this.products = undefined
      this.product_sheet = undefined
      this.mode = ''
    }

    choose_products(key : string) {

      // Chosen product sheet
      this.product_sheet = key

      this.final_configs = []
      this.mode = ''

      // Load products chosen
      this.facade.get_products(key).then(products => this.products = products)
      this._snackBar.open('Loading products from ' + key, 'OK', { duration: 4000 })
    }

    select_single_video_mode(youtube) {
      this.mode = 'single'
      this.youtube = youtube != undefined
    }

    select_bulk_video_mode(youtube) {

      // Load avaiable products groups and their validations already
      this.product_groups = this.facade.get_available_groups_for_base(this.products)
      this.product_groups_validations = this.facade.validate_groups(this.product_groups, this.base.products.length)

      this.mode = 'bulk'
      this.youtube = youtube != undefined
    }

    is_all_filled() {
      return !this.configs.includes(undefined) && !this.product_keys.includes(undefined)
    }

    add_single_video(product_keys, configs, video_metadata) {

      // Block deletions when videos are being generated
      if(this.facade.is_generating()) {
        this._snackBar.open('Cannot add more videos while some are being generated', 'OK')
        return
      }

      // Create a single video
      this.add_video(
        video_metadata.name || 'Preview',
        this.facade.generate_final_configs(configs, this.base, product_keys),
        video_metadata.description,
        video_metadata.visibility
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
          this.selected_groups.set(group, {})
    }

    check_group(element, group) {
      if (element.checked)
        this.selected_groups.set(group, {})
      else
        this.selected_groups.delete(group)
    }

    review_create_bulk() {

      // Block deletions when videos are being generated
      if(this.facade.is_generating()) {
        this._snackBar.open('Cannot add more videos while some are being generated', 'OK')
        return
      }

      this.final_configs = []

      for(let [group, video_metadata] of this.selected_groups.entries()) {
        
        const group_products = this.product_groups.get(group)

        // Check how many videos should be created for that group
        for (let video = 0; video < group_products.length; video+=this.base.products.length) {

          let sorted_products = group_products.slice(video, video + this.base.products.length)
                                              .sort((a, b) => a.position - b.position)

          // Keys
          let product_keys = sorted_products.map(p => p.id)

          // Offer Type Configs
          let configs = sorted_products.map(p => this.facade.get_configs_from_offer_type(p.offer_type))

          this.final_configs.push({
            name: video_metadata.name || group,
            description: video_metadata.description,
            visibility: video_metadata.visibility,
            configs: this.facade.generate_final_configs(configs, this.base, product_keys)
          })
        }
      }
    }

    create_bulk() {

      // Block deletions when videos are being generated
      if(this.facade.is_generating()) {
        this._snackBar.open('Cannot add more videos while some are being generated', 'OK')
        return
      }

      // Generate all videos
      this.final_configs.forEach(final_configs => 
        this.add_video(final_configs.name,
          final_configs.configs,
          final_configs.description,
          final_configs.visibility)
      )

      // Clear selections after all
      this.clear_screen_selections()

      this._snackBar.open('Scheduled for creation (check assets section above)', 'OK', { duration: 4000 })
    }

    private clear_screen_selections() {
      this.final_configs = []
      this.video_metadata = {}
      this.base = undefined
      this.products = undefined
      this.product_sheet = undefined
      this.mode = ''
    }

    
    private add_video(name : string, final_configs : any[], description? : string, visibility? : string) {

      (this.youtube ? this.facade.add_production_video : this.facade.add_preview_video).apply(this.facade, [
        new VideoMetadata(
          name,
          this.base.title,
          this.product_sheet,
          final_configs,
          description,
          visibility
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

      // Block deletions when videos are being generated
      if (this.facade.is_generating()) {
       this._snackBar.open('Cannot make deletions while videos are being generated', 'OK')
       return
      }

      const video_name = video.generated_video || 'being generated'

      this._snackBar.open('Confirm deletion of asset ' + video_name + '?', 'Confirm', {
        duration: 4000,
      }).onAction().subscribe(() => {
        this.facade.delete_video(video.generated_video).then(response => {
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

    indexTracker(index: number, value: any) {
      return index;
    }
  }