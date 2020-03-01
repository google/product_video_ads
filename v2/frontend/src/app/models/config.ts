export class Config {
    
    constructor(
        public key : number = 0,
        public type : string ='',
        public field : string = '',
        public x : number = 0,
        public y : number = 0,
        public start_time : number = 0.0,
        public end_time : number = 0.0,
        public font : string = '',
        public color: string = '#000',
        public size : number = 0,
        public width : number = 0,
        public height : number = 0,
        public align : string = 'center',
        public angle : number = 0
        ) {}
        
    public static from_configs_array(config : any) : Config {
        return JSON.parse(config) as Config
    }
            
    public static to_configs_array(configs : Config) : string {
        return JSON.stringify(configs)
    }
}