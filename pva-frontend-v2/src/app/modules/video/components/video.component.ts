import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from 'app/models/product';
import { VideoFacade } from '../video.facade';
import { Observable } from 'rxjs';
import { Base } from 'app/models/base';
import { Config } from 'app/models/config';
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
  bases : Observable<Base[]>
  products : Observable<Product[]>
  offer_types : Observable<OfferType[]>
  videos : Observable<Video[]>
  
  // Chosen
  base : Base
  configs : Array<any>
  product_keys: Array<any>
  
  constructor(private facade : VideoFacade, private _snackBar: MatSnackBar) {
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

    is_all_filled() {
      return !this.configs.includes(undefined) && !this.product_keys.includes(undefined)
    }
    
    add_video() {
      
      let final_configs = []
      
      // Go through each product
      for(let i = 0; i < this.base.products.length; i++) {
        
        let ci = this.configs[i]
        
        // Treat each config item
        for(let config of ci) {
          
          let new_config = {...config}
          
          if (new_config.type == 'product')
          new_config.key = this.product_keys[i]
          
          new_config.start_time = this.base.products[i].start_time
          new_config.end_time = this.base.products[i].end_time
          
          // Add item to final config
          final_configs.push(new_config)
        }
      }
      
      this.facade.add_preview_video(final_configs as Config[], this.base.title).then(response => {
        this._snackBar.open('Saved ' + response['status'], 'OK', { duration: 2000 })
      })

      this.base = undefined
    }

    update_video() {
      this.facade.update_videos()
    }
    
    indexTracker(index: number, value: any) {
      return index;
    }
  }
