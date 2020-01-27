export class Config {
    
    constructor(
        public product : number,
        public field : string,
        public x : number,
        public y : number,
        public start_time : number,
        public end_time : number,
        public font : string,
        public color: string,
        public size : number = 0,
        public width : number = 0,
        public height : number = 0,
        public align : string = 'center',
        public angle : number = 0,
        public id? : number
        ) {}
        
    public static from_base_configs_array(base_config_array : Array<any>, id : number) : Config {
        return new Config(
            base_config_array[0],
            base_config_array[1],
            base_config_array[2],
            base_config_array[3],
            base_config_array[4],
            base_config_array[5],
            base_config_array[6],
            base_config_array[7],
            base_config_array[8],
            base_config_array[9],
            base_config_array[10],
            base_config_array[11],
            base_config_array[12],
            id
            )
        }
            
    public static to_base_configs_array(base_configs : Config) : Array<any> {
        return [
            base_configs.product,
            base_configs.field,
            base_configs.x,
            base_configs.y,
            base_configs.start_time,
            base_configs.end_time,
            base_configs.font,
            base_configs.color,
            base_configs.size,
            base_configs.width,
            base_configs.height,
            base_configs.align,
            base_configs.angle
        ]
    }
}