import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common'

import { MatTableModule } from '@angular/material/table'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { ColorPickerModule } from 'ngx-color-picker';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import {MatDialogModule} from '@angular/material/dialog';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ColorPickerModule,
    MatSliderModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ColorPickerModule,
    MatSliderModule,
    MatSnackBarModule,
    MatDialogModule
  ]
})
export class SharedModule { }
