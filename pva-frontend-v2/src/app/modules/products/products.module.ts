import { NgModule } from '@angular/core';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductComponent } from './components/product.component';

import { SharedModule } from '../shared/shared.module';
import { ProductsFacade } from './products.facade';

@NgModule({
  declarations: [
    ProductComponent
  ],
  imports: [
    SharedModule,
    ProductsRoutingModule
  ],
  providers: [
    ProductsFacade
  ]
})
export class ProductsModule { }