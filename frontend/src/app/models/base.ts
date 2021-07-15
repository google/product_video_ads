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

export class Base {
    
    constructor(public title : string,
        public file : string,
        public products : Array<any>,
        public id? : string,
        public url? : string) {}
        
    public static from_base_array(base_array : Array<any>) {
        return new Base(
            base_array[0],
            base_array[1],
            JSON.parse(base_array[2] || '[]') as Array<any>
        )
    }
            
    public static to_base_array(base : Base) : Array<any> {
        return [
            base.title, 
            base.file,
            JSON.stringify(base.products)
        ]
    }
}

