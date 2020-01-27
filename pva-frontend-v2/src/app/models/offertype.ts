import { Config } from './config'

export class OfferType {
    
    constructor(public title : string,
        public start_time : number,
        public end_time : number,
        public configs : Array<Config>) {}
        
    public static from_offertype_array(offertype_array : Array<any>) {
        return new OfferType(
            offertype_array[0],
            offertype_array[1],
            offertype_array[2],
            JSON.parse(offertype_array[3]) as Array<Config>,
        )
    }
            
    public static to_offertype_array(offertype : OfferType) : Array<any> {
        return [
            offertype.title, 
            offertype.start_time, 
            offertype.end_time, 
            JSON.stringify(offertype.configs)
        ]
    }
}