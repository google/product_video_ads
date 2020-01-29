import { NgModule } from '@angular/core';

import { BasesRoutingModule } from './bases-routing.module';
import { BasessComponents } from './components/bases.component';

import { SharedModule } from '../shared/shared.module';
import { BasesFacade } from './bases.facade';

@NgModule({
  declarations: [
    BasessComponents
  ],
  imports: [
    SharedModule,
    BasesRoutingModule
  ],
  providers: [
    BasesFacade
  ]
})
export class BasesModule { }