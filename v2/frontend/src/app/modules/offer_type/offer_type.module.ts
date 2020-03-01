import { NgModule } from '@angular/core';
import { OfferTypeRoutingModule } from './offer_type-routing.module';
import { OfferTypeComponent } from './components/offer_type.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    OfferTypeComponent
  ],
  imports: [
    SharedModule,
    OfferTypeRoutingModule
  ]
})
export class OfferTypeModule { }