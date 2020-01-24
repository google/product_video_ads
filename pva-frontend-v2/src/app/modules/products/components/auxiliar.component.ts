import { Component, ViewChild, Pipe, PipeTransform, OnInit  } from '@angular/core';

import { MatTable } from '@angular/material/table'
import { ProductsFacade } from '../products.facade';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auxiliar',
  templateUrl: '../views/auxiliar.component.html',
  styleUrls: ['../views/auxiliar.component.scss']
})
export class AuxiliarComponent implements OnInit {

  @ViewChild(MatTable, {static: false}) table
  ready_state : Observable<number>

  columns = ['custom','image', 'delete']

  constructor(private productsFacade : ProductsFacade) {}

  ngOnInit() {
    this.ready_state = this.productsFacade.ready_state()
  }

  list_products() {
    return this.productsFacade.list_products()
  }

  add_auxiliar(image, custom) {
    this.productsFacade.add_auxiliar(image, custom)
    this.table.renderRows()
  }

  delete_auxiliar(product) {
    this.productsFacade.delete_product(product)
    this.table.renderRows()
  }
}