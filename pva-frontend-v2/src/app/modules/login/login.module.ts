import { NgModule } from '@angular/core';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './components/login.component';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { LoginPresentation } from './components/login.presentation';

@NgModule({
  declarations: [
    LoginComponent,
    LoginPresentation
  ],
  imports: [
    CommonModule,
    SharedModule,
    LoginRoutingModule
  ]
})
export class LoginModule { }
