import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VideoComponent } from './components/video.component';
import { VideoCampaignsComponent } from './components/video_campaigns.component';

const routes: Routes = [
  { path: '', component: VideoComponent },
  { path: 'campaigns', component: VideoCampaignsComponent }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VideoRoutingModule { }
