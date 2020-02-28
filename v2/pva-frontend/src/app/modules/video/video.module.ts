import { NgModule } from '@angular/core';

import { VideoRoutingModule } from './video-routing.module';
import { VideoComponent } from './components/video.component';
import { SharedModule } from '../shared/shared.module';
import { FilterOfferTypesPipe } from './pipes/filter-offer-types.pipe';
import { VideoCampaignsComponent } from './components/video_campaigns.component';


@NgModule({
  declarations: [
    VideoComponent,
    VideoCampaignsComponent,
    FilterOfferTypesPipe
  ],
  imports: [
    SharedModule,
    VideoRoutingModule
  ]
})
export class VideoModule { }
