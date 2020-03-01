export class Asset {
    
    constructor(public id : number,
        public text : string,
        public image : string) {}
        
    public static from_asset_array(product_array : Array<any>) {
        return new Asset(
            parseInt(product_array[0]),
            product_array[1],
            product_array[2]
            )
        }
            
    public static to_asset_array(asset : Asset) : Array<any> {
        return [
            asset.id, 
            asset.text,
            asset.image
        ]
    }
}