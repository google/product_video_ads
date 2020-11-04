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

import { Component, Input, OnInit } from '@angular/core';
import { Condition, ACTION_TYPES } from 'app/models/condition';

@Component({
  selector: 'offer-type-conditional',
  templateUrl: '../../views/conditions/conditional.component.html',
  styleUrls: ['../../views/offer_type.component.scss']
})
export class OfferTypeConditionalComponent implements OnInit {

  @Input() fields : Array<string>
  @Input() conditions : Array<Condition>

  public actions = ACTION_TYPES
  public condition : any = {}

  ngOnInit() {}

  public is_filled() {
    return this.condition.key && this.condition.value && this.condition.action
  }
  
  public add_condition() {

    // Add the new condition
    this.conditions.push(
      new Condition(
        this.condition.key, 
        this.condition.value,
        this.condition.action,
        this.condition.args
      )
    )

    // Clear condition
    this.condition = {}
  }

  public delete_condition(index) {
    this.conditions.splice(index, 1)
  }
}