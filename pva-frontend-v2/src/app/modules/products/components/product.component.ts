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

  ready : Observable<number>
  headers : Observable<string[]>
  products : Observable<Product[]>

  constructor(private facade : ProductsFacade) {}

  ngOnInit() {
    this.ready = this.facade.ready
    this.products = this.facade.products
    this.headers = this.facade.headers
  }

  add_product(values) {
    this.facade.add_product(values)
  }

  delete_product(product) {
    this.facade.delete_product(product.id)
  }
}