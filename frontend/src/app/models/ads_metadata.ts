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

export class AdsMetadata {

    constructor(
        public account_id : string,
        public campaign_name : string,
        public ad_group_type : string,
        public url : string,
        public call_to_action : string,
        public target_location : string = '',
        public audience_name : string = '',
        public ad_group_name : string = '',
        public ad_name : string = ''
        ) {}
        
    public static from_string_object(string_object : string) : AdsMetadata {
        return JSON.parse(string_object || '{}') as AdsMetadata
    }
            
    public static to_string_object(video_metadata : AdsMetadata) : string {
        return JSON.stringify(video_metadata)
    }
}