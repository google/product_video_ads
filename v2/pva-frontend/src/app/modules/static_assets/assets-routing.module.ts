import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AssetsComponents } from './components/assets.component';

const routes: Routes = [{ path: '', component: AssetsComponents }]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssetsRoutingModule { }