import { NgModule } from '@angular/core';

import { VideoRoutingModule } from './video-routing.module';
import { VideoComponent } from './components/video.component';
import { SharedModule } from '../shared/shared.module';
import { FilterOfferTypesPipe } from './pipes/filter-offer-types.pipe';


@NgModule({
  declarations: [
    VideoComponent,
    FilterOfferTypesPipe
  ],
  imports: [
    SharedModule,
    VideoRoutingModule
  ]
})
export class VideoModule { }
