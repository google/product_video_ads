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
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from '@angular/material/expansion'
import {DragDropModule} from '@angular/cdk/drag-drop';
import { NgpSortModule } from "ngp-sort-pipe";

import { DraggableElementComponent } from './draggable_element/draggable_element.component';
import { EditElementBoxComponent } from './edit_element_box/edit_element_box.component'

@NgModule({
  declarations: [
    DraggableElementComponent,
    EditElementBoxComponent
  ],
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
    DragDropModule,
    MatSliderModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatCardModule
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
    MatDialogModule,
    MatCheckboxModule,
    MatCardModule,
    MatExpansionModule,
    DragDropModule,
    NgpSortModule,
    DraggableElementComponent,
    EditElementBoxComponent
  ]
})
export class SharedModule { }
