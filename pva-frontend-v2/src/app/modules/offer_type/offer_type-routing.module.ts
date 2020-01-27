import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OfferTypeComponent } from './components/offer_type.component';

const routes: Routes = [{ path: '', component: OfferTypeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OfferTypeRoutingModule { }
