import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BasessComponents } from './components/bases.component';

const routes: Routes = [{ path: '', component: BasessComponents }]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BasesRoutingModule { }