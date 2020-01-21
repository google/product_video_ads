import { Component, ViewChild, Pipe, PipeTransform, OnInit, Inject  } from '@angular/core';
import { MatTable } from '@angular/material/table'
import { ProductsFacade } from '../products.facade';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product',
  templateUrl: '../views/product.component.html',
  styleUrls: ['../views/product.component.scss']
})
export class ProductComponent implements OnInit {

  @ViewChild(MatTable, {static: false}) table
  ready_state : Observable<number>
  edit_id : number = 0

  productColumns = ['title', 'price', 'image', 'custom', 'edit', 'delete']

  constructor(private productsFacade : ProductsFacade) {}

  ngOnInit() {
    this.ready_state = this.productsFacade.ready_state()
  }

  list_products() {
    return this.productsFacade.list_products()
  }

  add_product(title, price, image, custom) {
    this.productsFacade.add_product(title, price, image, custom)
    this.table.renderRows()
  }

  delete_product(product) {
    this.productsFacade.delete_product(product)
    this.table.renderRows()
  }

  choose_edit(id) {
    this.edit_id = id
  }

  save_edit(product) {
    this.edit_id = undefined
    alert('saving ' + JSON.stringify(product))
  }
}