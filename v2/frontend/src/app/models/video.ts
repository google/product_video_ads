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

export class Video {

    constructor(
        public date : string = '',
        public name : string = '',
        public description : string = '',
        public visibility : string = '',
        public configs : Array<Config>,
        public base_video : string,
        public status : string,
        public generated_video : string = ''
        ) {}
        
    public static from_video_array(video_array : Array<any>) : Video {
        return new Video(
            video_array[0],
            video_array[1],
            video_array[2],
            video_array[3],
            JSON.parse(video_array[4] || '[]'),
            video_array[5],
            video_array[6],
            video_array[7]
        )
    }
            
    public static to_video_array(video : Video) : Array<any> {
        return [
            video.date,
            video.name,
            video.description,
            video.visibility,
            JSON.stringify(video.configs),
            video.base_video,
            video.status,
            video.generated_video
        ]
    }
}