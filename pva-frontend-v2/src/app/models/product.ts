export class Product {
    
    constructor(public id : number,
        public values : Array<string>) {}
        
    public static from_product_array(product_array : Array<any>) {
        return new Product(
            parseInt(product_array[0]),
            product_array.slice(1) as Array<string>
            )
        }
            
    public static to_product_array(product : Product) : Array<any> {
        return [
            product.id, 
            JSON.stringify(product.values)
        ]
    }
}