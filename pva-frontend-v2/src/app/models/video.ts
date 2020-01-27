import { Config } from './config'

export class Video {

    constructor(
        public configs : Array<Config>,
        public base_video : string,
        public status : string,
        public account_id : string = '',
        public campaign_name : string = '',
        public target : string = '',
        public url : string = '',
        public call_to_action : string = '',
        public adgroup_type : string = '',
        public adgroup_name : string = '',
        public ad_name : string = ''
        ) {}
        
    public static from_video_array(video_array : Array<any>) : Video {
        return new Video(
            video_array[8],
            video_array[9],
            video_array[10],
            video_array[0],
            video_array[1],
            video_array[2],
            video_array[3],
            video_array[4],
            video_array[5],
            video_array[6],
            video_array[7]
        )
    }
            
    public static to_video_array(video : Video) : Array<any> {
        return [
            video.account_id,
            video.campaign_name,
            video.adgroup_name,
            video.ad_name,
            video.target,
            video.url,
            video.call_to_action,
            video.adgroup_type,
            video.configs,
            video.base_video,
            video.status
        ]
    }
}