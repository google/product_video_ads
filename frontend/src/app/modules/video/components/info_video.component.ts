import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: 'info-video-dialog',
    templateUrl: '../views/info-video-dialog.html',
    styleUrls: ['../views/info-video-dialog.scss']
  })
  export class InfoVideoDialog {
    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
  }