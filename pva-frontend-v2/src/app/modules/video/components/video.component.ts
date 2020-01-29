import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from 'app/modules/login/services/login.service';
import { Product } from 'app/models/product';
import { VideoFacade } from '../video.facade';
import { Observable } from 'rxjs';
import { Base } from 'app/models/base';
import { Config } from 'app/models/config';
import { OfferType } from 'app/models/offertype';

@Component({
  selector: 'app-video',
  templateUrl: '../views/video.component.html',
  styleUrls: ['../views/video.component.scss'],
  providers: [VideoFacade]
})
export class VideoComponent implements OnInit {

  // Data to view
  bases : Observable<Base[]>
  products : Observable<Product[]>
  offer_types : Observable<OfferType[]>

  // Chosen
  base : Base
  configs : Array<any>

  constructor(private facade : VideoFacade,
              private _snackBar: MatSnackBar) {}
  
  ngOnInit() {
    this.bases = this.facade.bases
    this.products = this.facade.products
    this.offer_types = this.facade.offer_types$
  }

  choose_base(base : Base) {
    this.configs = new Array(base.products.length).fill({})

    for(let i = 0; i < this.configs.length; i++) {
      this.configs[i].start_time = base.products[i].start_time
      this.configs[i].end_time = base.products[i].end_time
    }

    this.base = base
  }

  add_video() {

    let final_configs = []

    this.configs.forEach(c => {

      c.configs.forEach(ci => {
        if (ci.type == 'product')
          ci.key = c.product

        ci.start_time = c.start_time
        ci.end_time = c.end_time
      })

      final_configs = final_configs.concat(c.configs)
    })

    this.facade.add_preview_video(final_configs as Config[], this.base.title).then(response => {
      this._snackBar.open('Saved ' + response['status'], 'OK', { duration: 2000 })
    })
  }
}
