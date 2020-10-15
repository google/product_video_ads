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

import { Config } from './config'

export class OfferType {
    
    constructor(
        public title : string,
        public base : string,
        public configs : Array<Config>,
        public parent? : string
    ) {}
        
    public static from_offertype_array(offertype_array : Array<any>) {
        return new OfferType(
            offertype_array[0],
            offertype_array[1],
            JSON.parse(offertype_array[2] || '[]') as Array<Config>,
            offertype_array[3]
        )
    }
            
    public static to_offertype_array(offertype : OfferType) : Array<any> {
        return [
            offertype.title, 
            offertype.base, 
            JSON.stringify(offertype.configs),
            offertype.parent
        ]
    }
}