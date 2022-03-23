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

export class VideoMetadata {

    constructor(
        public name : string,
        public base_video : string,
        public products_label : string,
        public configs : Array<Config>,
        public custom_dir : string = '',
        public description : string = '',
        public visibility : string = '',
        public date : string = new Date().toLocaleString('pt-BR')
        ) {}
        
    public static from_string_object(string_object : string) : VideoMetadata {
        return JSON.parse(string_object) as VideoMetadata
    }
            
    public static to_string_object(video_metadata : VideoMetadata) : string {
        return JSON.stringify(video_metadata)
    }
}