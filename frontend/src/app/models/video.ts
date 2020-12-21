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

import { AdsMetadata } from './ads_metadata'
import { VideoMetadata } from './video_metadata'

export class Video {

    constructor(
        public date : string = '',
        public video_metadata : VideoMetadata,
        public status : string,
        public generated_video : string = '',
        public ads_metadata? : AdsMetadata
        ) {}
        
    public static from_video_array(video_array : Array<any>) : Video {
        return new Video(
            video_array[0],
            VideoMetadata.from_string_object(video_array[2]),
            video_array[3],
            video_array[4],
            AdsMetadata.from_string_object(video_array[1])
            
        )
    }
            
    public static to_video_array(video : Video) : Array<any> {
        return [
            video.date,
            AdsMetadata.to_string_object(video.ads_metadata),
            VideoMetadata.to_string_object(video.video_metadata),
            video.status,
            video.generated_video
        ]
    }
}