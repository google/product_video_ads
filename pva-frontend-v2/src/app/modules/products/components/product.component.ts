import { Component, OnInit } from '@angular/core';
import { LoginService } from 'app/modules/login/services/login.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-product',
  templateUrl: '../views/product.component.html',
  styleUrls: ['../views/product.component.scss']
})
export class ProductComponent {

  url : SafeResourceUrl

  constructor(private service : LoginService, private sanitizer: DomSanitizer) {
    this.service.ready$.subscribe(status => {
      if (status == 1)
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://docs.google.com/spreadsheets/d/'+ this.service.sheet_id +'/edit#gid=1670058881')
    })
  }
}