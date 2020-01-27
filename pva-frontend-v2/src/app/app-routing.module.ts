import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule) },
  { path: 'assets', loadChildren: () => import('./modules/static_assets/assets.module').then(m => m.AssetsModule) },
  { path: 'products', loadChildren: () => import('./modules/products/products.module').then(m => m.ProductsModule) },
  { path: 'offer_types', loadChildren: () => import('./modules/offer_type/offer_type.module').then(m => m.OfferTypeModule) },
  { path: 'videos', loadChildren: () => import('./modules/video/video.module').then(m => m.VideoModule) }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}