import { Component, ViewChild, Pipe, PipeTransform, OnInit, Inject  } from '@angular/core';
import { MatTable } from '@angular/material/table'
import { ProductsFacade } from '../products.facade';
import { Observable } from 'rxjs';
import { Product } from 'app/models/product';

@Component({
  selector: 'app-product',
  templateUrl: '../views/product.component.html',
  styleUrls: ['../views/product.component.scss']
})
export class ProductComponent implements OnInit {

  @ViewChild(MatTable, {static: false}) table

  ready : Observable<number>
  headers : Array<string>
  products : Product[] = []
  edit_id : number = 0

  constructor(private productsFacade : ProductsFacade) {}

  ngOnInit() {
    this.ready = this.productsFacade.ready

    this.productsFacade.products.subscribe(p => {

      if (p[0]) {
        this.headers = p[0].values
        this.products = p.slice(1)
      }
    })
  }

  add_product(values) {
    this.productsFacade.add_product(values)
    this.table.renderRows()
  }

  delete_product(product) {
    this.productsFacade.delete_product(product.id)
    this.table.renderRows()
  }
}