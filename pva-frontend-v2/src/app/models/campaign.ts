export class Campaign {
    
    constructor(
        public account_id : string = '',
        public campaign_name : string = '',
        public target_location : string = '',
        public target_age : string = '',
        public target_user_interest : string = '',
        public url : string = '',
        public call_to_action : string = '',
        public adgroup_type : string = '',
        public adgroup_name : string = '',
        public ad_name : string = ''
        ) {}
    }