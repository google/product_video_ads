import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from 'app/modules/login/services/login.service';
import { ProductService } from 'app/modules/products/services/product.service';
import { OfferTypeService } from 'app/modules/offer_type/services/offer_type.service';
import { VideoService } from '../services/video.service';
import { Product } from 'app/models/product';

@Component({
  selector: 'app-video',
  templateUrl: '../views/video.component.html',
  styleUrls: ['../views/video.component.scss']
})
export class VideoComponent implements OnInit {

  // Data to view
  bases : Array<string>
  products : Array<Product>

  // Chosen base
  current_product : number = 0
  selected_products : Array<number> = []

  constructor(private loginService : LoginService, 
              private productsService : ProductService, 
              private offerTypeService : OfferTypeService,
              private videoService : VideoService,
              private _snackBar: MatSnackBar) {}
  
  ngOnInit() {

    // Let user choose bases when ready
    this.loginService.ready$.subscribe(ready => {

      if (!ready)
        return

    //  this.bases = this.baseService.bases
    //  this.products = this.productsService.products.filter(p => p.is_product)
    })
  }

  add_product(id) {

    this.current_product++
    this.selected_products.push(id)

    /*if (this.current_product >= this.base.number_of_products) {

      const indexes = [...this.selected_products, ...this.base.indexes.filter(i => i > 0)]
      
      this.videoService.add_preview_video(indexes.join(','), this.base.name)
          .then(response => {
            this._snackBar.open("Video Scheduled: " + response['status'], 'OK', {
              duration: 5000
            })
          })
    }*/
  }
}
