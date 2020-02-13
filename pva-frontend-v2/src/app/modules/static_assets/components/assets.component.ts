import { Component } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { LoginService } from 'app/modules/login/services/login.service';

@Component({
  selector: 'app-auxiliar',
  templateUrl: '../views/assets.component.html',
  styleUrls: ['../views/assets.component.scss']
})
export class AssetsComponents {

  url : SafeResourceUrl

  constructor(private service : LoginService, private sanitizer: DomSanitizer) {
    this.service.ready$.subscribe(status => {
      if (status == 1)
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://docs.google.com/spreadsheets/d/'+ this.service.sheet_id +'/edit#gid=1412792783')
    })
  }
}