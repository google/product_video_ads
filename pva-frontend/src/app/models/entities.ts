import * as UUID from 'uuid/v4'

export class Product {
    
    constructor(public id : number,
        public title : string,
        public price : string,
        public image : string,
        public custom : string,
        public is_product : boolean = false) {}
        
        public static from_product_array(product_array : Array<any>) {
            return new Product(
                parseInt(product_array[0]),
                product_array[1],
                product_array[2],
                product_array[3],
                product_array[4],
                product_array[5].toLowerCase() == "true"
                )
            }
            
            public static to_product_array(product : Product) : Array<any> {
                return [
                    product.id, 
                    product.title, 
                    product.price, 
                    product.image, 
                    product.custom, 
                    product.is_product
                ]
            }
        }
        
        export class BaseConfigs {

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
                public id : string = UUID()
                ) {}

            public static from_base_configs_array(base_config_array : Array<any>) : BaseConfigs {
                return new BaseConfigs(
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
                    UUID()
                )
            }

            public static to_base_configs_array(base_configs : BaseConfigs) : Array<any> {
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
            
            export class Base {
                
                public indexes : Array<number> = []
                public configs : Array<BaseConfigs>

                constructor(
                    public id : string,
                    public name : string,
                    public file : string,
                    public number_of_products : number = 0,
                    indexes : string = '',
                    configs : Array<any> = []
                    ) {

                        if (indexes != '')
                            this.indexes = indexes.split(',').map(parseFloat)
                            
                        this.configs = configs.map(BaseConfigs.from_base_configs_array)
                    }
                }

                export class Video {
                    constructor(
                        public product_ids : string,
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
                                video.product_ids,
                                video.base_video,
                                video.status
                            ]
                        }
                    }
                
                export class Configs {
                    constructor(
                        public products : Product[],
                        public fonts : string[],
                        public campaigns : Video[],
                        public bases : Base[]
                        ) {}
                    }