import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from 'app/models/product';
import { VideoFacade } from '../video.facade';
import { Observable } from 'rxjs';
import { Base } from 'app/models/base';
import { Config } from 'app/models/config';
import { OfferType } from 'app/models/offertype';
import { Video } from 'app/models/video';
import { TitleCasePipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video',
  templateUrl: '../views/video_campaigns.component.html',
  styleUrls: ['../views/video_campaigns.component.scss'],
  providers: [VideoFacade]
})
export class VideoCampaignsComponent implements OnInit {

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

  product_groups : Map<string, Product[]>
  selected_groups : Map<string, any> = new Map<string, any>()
  mode : string
  
  // Chosen
  base : Base
  configs : Array<any>
  product_keys: Array<any>
  campaign : any = {}
  
  constructor(private facade : VideoFacade, private sanitizer: DomSanitizer, private _snackBar: MatSnackBar) {
      this.offer_types = this.facade.offer_types$
      this.videos = this.facade.videos
    }
    
    ngOnInit() {
      this.bases = this.facade.bases
      this.products = this.facade.products
    }
    
    choose_base(base : Base) {
      this.configs = new Array(base.products.length)
      this.product_keys = new Array(base.products.length)

      this.base = base
    }

    select_single_video_mode() {
      this.mode = 'single'
    }

    select_bulk_video_mode() {
      this.product_groups = this.facade.get_available_groups_for_base()
      this.mode = 'bulk'
    }

    is_all_filled() {
      return !this.configs.includes(undefined) && !this.product_keys.includes(undefined)
    }
    
    add_video(product_keys, configs, campaign_configs) {
      this.facade.add_production_video(configs, this.base, product_keys, campaign_configs).then(response => {
        this.mode = ''
        this._snackBar.open('Saved ' + response['status'], 'OK', { duration: 2000 })
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

        const sorted_products = this.product_groups.get(group).sort((a, b) => a.position - b.position)

        const product_keys = sorted_products.map(p => p.id)
        const configs = sorted_products.map(p => this.facade.get_configs_from_offer_type(p.offer_type, this.base.title))

        this.add_video(product_keys, configs, campaign_configs)
      }

      this._snackBar.open('Created ' + this.selected_groups.size + ' videos!', 'OK', { duration: 4000 })
    }

    update_video() {
      this.facade.update_videos()
    }

    delete_video(video : Video) {
      this.facade.delete_video(video.generated_video)
    }
    
    indexTracker(index: number, value: any) {
      return index;
    }
  }
