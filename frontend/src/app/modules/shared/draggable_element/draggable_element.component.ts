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

@Component({
  selector: 'app-draggable-element',
  templateUrl: './draggable_element.component.html',
  providers: []
})
export class DraggableElementComponent implements AfterViewInit {

    @Input() element : any
    @Input() video_pos : any
    @Input() disabled? : boolean = false

    @Output() dblclick = new EventEmitter<any>()
    @Output() singleclick = new EventEmitter<any>()
    @Output() dragEnd = new EventEmitter<any>()

    @ViewChild('html_element') html_element : ElementRef;
    
    constructor() {}

    ngAfterViewInit() {
        console.log('Element ' + this.element.id + ' initied')
        setTimeout(this.element_position_to_style.bind(this), 1000)
    }

    on_drag_element({ event, element }) {

      element.x += event.distance.x
      element.y += event.distance.y

      this.dragEnd.emit({event, element})
    }

    private element_position_to_style() {

        // Adjust loaded element to screen size
        if (this.element.loaded_element) {

          // Adjusts differences between backend and frontend (to be fixed)
          let align_adjust = this.calculate_align_adjust(this.element, this.html_element)
          let angle_adjust_y = this.calculate_angle_adjust(this.element, this.html_element)

          // Scaled X/Y 
          this.element.x = ((parseInt(this.element.x) - align_adjust) / this.video_pos.x_ratio)
          this.element.y = ((parseInt(this.element.y) + angle_adjust_y) / this.video_pos.y_ratio)
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

    calculate_align_adjust(element, html_element) {
      
      if (element.align == 'center')
        return html_element.nativeElement.offsetWidth/2

      if (element.align == 'right')
        return html_element.nativeElement.offsetWidth

      return 0
    }

    calculate_angle_adjust(element, html_element) {

      if (element.angle != 0) {
        return html_element.nativeElement.offsetWidth * (element.angle / -90)
      }

      return 0
    }
}