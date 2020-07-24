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
import { Campaign } from './campaign'

export class Video {

    constructor(
        public date : string = '',
        public name : string = '',
        public configs : Array<Config>,
        public base_video : string,
        public status : string,
        public campaign : Campaign = new Campaign(),
        public generated_video : string = ''
        ) {}
        
    public static from_video_array(video_array : Array<any>) : Video {
        return new Video(
            video_array[0],
            video_array[1],
            JSON.parse(video_array[12] || '[]'),
            video_array[13],
            video_array[14],
            new Campaign(
                video_array[2],
                video_array[3],
                video_array[6],
                video_array[7],
                video_array[8],
                video_array[9],
                video_array[10],
                video_array[11],
                video_array[4],
                video_array[5]
            ),
            video_array[15]
        )
    }
            
    public static to_video_array(video : Video) : Array<any> {
        return [
            video.date,
            video.name,
            video.campaign.account_id,
            video.campaign.campaign_name,
            video.campaign.adgroup_name,
            video.campaign.ad_name,
            video.campaign.target_location,
            video.campaign.target_age,
            video.campaign.target_user_interest,
            video.campaign.url,
            video.campaign.call_to_action,
            video.campaign.adgroup_type,
            JSON.stringify(video.configs),
            video.base_video,
            video.status,
            video.generated_video
        ]
    }
}