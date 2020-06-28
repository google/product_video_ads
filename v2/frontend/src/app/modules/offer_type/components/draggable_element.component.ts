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

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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

    @Output() dblclick = new EventEmitter<any>()
    @Output() singleclick = new EventEmitter<any>()
    @Output() dragEnd = new EventEmitter<any>()

    @ViewChild('html_element', {static: false}) html_element : ElementRef;
    
    constructor() {}

    ngAfterViewInit() {
        console.log('Element ' + this.element.id + ' initied')
        setTimeout(this.element_position_to_style.bind(this), 1000)
    }

    private element_position_to_style() {

        // Adjust loaded element to screen size
        if (this.element.loaded_element) {

          let align_adjust = 0

          if (this.element.align == 'center')
             align_adjust = this.html_element.nativeElement.offsetWidth/2
    
          if (this.element.align == 'right')
             align_adjust = this.html_element.nativeElement.offsetWidth

          // Scaled X/Y 
          this.element.x = ((parseInt(this.element.x) - align_adjust) / this.video_pos.x_ratio)
          this.element.y = (parseInt(this.element.y) / this.video_pos.y_ratio)
          this.element.left = this.element.x
          this.element.top = this.element.y
          
          // Resize image to screen
          if (this.element.view_type == 'image') {
            this.element.width /= this.video_pos.x_ratio
            this.element.height /= this.video_pos.y_ratio
          }
      
          // Resize font
          this.element.size /= this.video_pos.x_ratio
          
        } else {

          // Set initial default positions to new element
          this.element.x = 0
          this.element.y = parseInt(this.video_pos.height + 30) 
          this.element.left = 0
          this.element.top = this.video_pos.height + 30
        }
  
        this.html_element.nativeElement.style.visibility = 'visible'
    }
}