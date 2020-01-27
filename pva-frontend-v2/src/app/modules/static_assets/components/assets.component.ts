import { Component, ViewChild, Pipe, PipeTransform, OnInit  } from '@angular/core';

import { MatTable } from '@angular/material/table'
import { AssetsFacade } from '../assets.facade';
import { Observable } from 'rxjs';
import { Asset } from 'app/models/asset';

@Component({
  selector: 'app-auxiliar',
  templateUrl: '../views/assets.component.html',
  styleUrls: ['../views/assets.component.scss']
})
export class AssetsComponents implements OnInit {

  @ViewChild(MatTable, {static: false}) table

  readonly columns = ['id','text', 'image', 'delete']
  ready : Observable<number>
  assets : Observable<Asset[]>

  constructor(private facade : AssetsFacade) {
    this.ready = this.facade.ready
    this.assets = this.facade.assets
  }

  ngOnInit() {}

  add_asset(image, custom) {
    this.facade.add_asset(image, custom)
    this.table.renderRows()
  }

  delete_asset(asset : Asset) {
    this.facade.delete_asset(asset.id)
    this.table.renderRows()
  }
}