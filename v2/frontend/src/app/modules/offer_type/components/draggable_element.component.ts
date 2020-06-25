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

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { OfferTypeFacade } from '../offer_type.facade';

@Component({
  selector: 'app-draggable-element',
  templateUrl: '../views/draggable_element.component.html',
  styleUrls: ['../views/offer_type.component.scss'],
  providers: [OfferTypeFacade]
})
export class DraggableElementComponent implements AfterViewInit {

    @Input() element : any
    @Input() video_pos : any

    @Output() dragstart = new EventEmitter<any>()
    @Output() dblclick = new EventEmitter<any>()
    @Output() singleclick = new EventEmitter<any>()

    @ViewChild('html_element', {static: false}) html_element : ElementRef;
    
    constructor(private cd: ChangeDetectorRef) {}

    ngAfterViewInit() {
        console.log('Element ' + this.element.id + ' initied')
        setTimeout(this.element_position_to_style.bind(this), 1000)
    }

    private element_position_to_style() {

        // Set offset according to element size
        this.element.offsetWidth = this.html_element.nativeElement.offsetWidth
        this.element.offsetHeight = this.html_element.nativeElement.offsetHeight

        if (this.element.needs_screen_adjust) {

          // Adjust on align
          let align_adjust = 0
            
          if (this.element.align == 'center')
            align_adjust = this.html_element.nativeElement.offsetWidth/2
    
          if (this.element.align == 'right')
            align_adjust = this.html_element.nativeElement.offsetWidth
    
          // Position on screen 
          this.element.left = ((parseInt(this.element.x) - align_adjust) / this.video_pos.x_ratio) + this.video_pos.offset_x
          this.element.top =  (parseInt(this.element.y) / this.video_pos.y_ratio) + this.video_pos.offset_y
        
          // Resize to screen
          if (this.element.view_type == 'image') {
            this.element.width /= this.video_pos.x_ratio
            this.element.height /= this.video_pos.y_ratio
          }
      
          this.element.size /= this.video_pos.x_ratio

          this.element.offsetWidth /= this.video_pos.x_ratio
          this.element.offsetHeight /= this.video_pos.y_ratio

          this.element.needs_screen_adjust = false
        }
  
        this.html_element.nativeElement.style.visibility = 'visible'
        this.cd.detectChanges()
    }
}