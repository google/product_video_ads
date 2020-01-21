import { NgModule } from '@angular/core';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './components/products.component';

import { ProductComponent } from './components/product.component';
import { AuxiliarComponent } from './components/auxiliar.component';

import { ProductsPipe } from './pipes/products.pipe';
import { AuxiliarsPipe } from './pipes/products.pipe';

import { SharedModule } from '../shared/shared.module';
import { ProductsFacade } from './products.facade';

@NgModule({
  declarations: [
    ProductsComponent,

    ProductComponent,
    AuxiliarComponent,

    ProductsPipe,
    AuxiliarsPipe
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