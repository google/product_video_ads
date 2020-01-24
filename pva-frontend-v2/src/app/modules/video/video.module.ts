import { NgModule } from '@angular/core';

import { VideoRoutingModule } from './video-routing.module';
import { VideoComponent } from './components/video.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [VideoComponent],
  imports: [
    SharedModule,
    VideoRoutingModule
  ]
})
export class VideoModule { }
