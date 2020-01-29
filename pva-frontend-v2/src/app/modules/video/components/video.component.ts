import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from 'app/modules/login/services/login.service';
import { Product } from 'app/models/product';
import { VideoFacade } from '../video.facade';
import { Observable } from 'rxjs';
import { Base } from 'app/models/base';

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

  base : Base

  constructor(private facade : VideoFacade,
              private _snackBar: MatSnackBar) {}
  
  ngOnInit() {
    this.bases = this.facade.bases
    this.products = this.facade.products
  }

  choose_base(base) {
    this.base = base
  }
}
