import { Config } from './config'
import { Campaign } from './campaign'

export class Video {

    constructor(
        public configs : Array<Config>,
        public base_video : string,
        public status : string,
        public campaign : Campaign = new Campaign(),
        public generated_video : string = ''
        ) {}
        
    public static from_video_array(video_array : Array<any>) : Video {
        return new Video(
            JSON.parse(video_array[8] || '[]'),
            video_array[9],
            video_array[10],
            new Campaign(
                video_array[0],
                video_array[1],
                video_array[4],
                video_array[5],
                video_array[6],
                video_array[7],
                video_array[2],
                video_array[3]
            ),
            video_array[11]
        )
    }
            
    public static to_video_array(video : Video) : Array<any> {
        return [
            video.campaign.account_id,
            video.campaign.campaign_name,
            video.campaign.adgroup_name,
            video.campaign.ad_name,
            video.campaign.target,
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