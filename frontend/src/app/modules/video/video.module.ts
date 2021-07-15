/* 
   Copyright 2020 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   https://www.apache.org/licenses/LICENSE-2.0
 
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { NgModule } from '@angular/core';

import { VideoRoutingModule } from './video-routing.module';
import { VideoComponent } from './components/video.component';
import { InfoVideoDialog } from './components/info_video.component';
import { SharedModule } from '../shared/shared.module';
import { FilterOfferTypesPipe } from './pipes/filter-offer-types.pipe';
import { FilterVideosPipe } from './pipes/filter-videos.pipe';
import { VideoPreviewComponent } from './components/video_preview.component';
import { ImagePreviewComponent } from './components/image_preview.component';

@NgModule({
  declarations: [
    VideoComponent,
    InfoVideoDialog,
    VideoPreviewComponent,
    ImagePreviewComponent,
    FilterOfferTypesPipe,
    FilterVideosPipe
  ],
  imports: [
    SharedModule,
    VideoRoutingModule
  ]
})
export class VideoModule { }
