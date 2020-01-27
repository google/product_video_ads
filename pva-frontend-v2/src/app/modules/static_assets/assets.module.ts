import { NgModule } from '@angular/core';

import { AssetsRoutingModule } from './assets-routing.module';
import { AssetsComponents } from './components/assets.component';

import { SharedModule } from '../shared/shared.module';
import { AssetsFacade } from './assets.facade';

@NgModule({
  declarations: [
    AssetsComponents
  ],
  imports: [
    SharedModule,
    AssetsRoutingModule
  ],
  providers: [
    AssetsFacade
  ]
})
export class AssetsModule { }