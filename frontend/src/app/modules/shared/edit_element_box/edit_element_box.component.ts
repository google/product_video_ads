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

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-edit-element-box',
  templateUrl: './edit_element_box.html',
  styleUrls: ['./edit_element_box.scss'],
  providers: []
})
export class EditElementBoxComponent implements OnInit {

    @Input() element_focused : any

    @Output() on_change_text_width = new EventEmitter<any>()
    @Output() on_send_to_back = new EventEmitter<any>()

    ngOnInit() {
      // Bind arrow keys
      document.addEventListener('keydown', event => {
        this.control_focused_element(event)
      })
    }

    send_to_back(element) {
      this.on_send_to_back.emit(element)
    }

    change_text_width(element) {
      this.on_change_text_width.emit(element)
    }

    private control_focused_element(event) {

      if (this.element_focused == undefined)
        return
  
      let x = 0, y = 0
  
      switch (event.key) {
  
        case 'ArrowUp':
          y = -1
          break;
  
        case 'ArrowDown':
          y = 1
          break;
  
        case 'ArrowLeft':
          x = -1
          break;
  
        case 'ArrowRight':
          x = 1
          break;
      }
  
      if (x != 0 || y != 0) {
  
        // Move element
        this.element_focused.x += x
        this.element_focused.y += y
  
        // Change element visually on screen
        this.element_focused.left += x
        this.element_focused.top += y
  
        event.preventDefault()
      }
    }
}