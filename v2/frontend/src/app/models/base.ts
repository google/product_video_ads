export class Base {
    
    constructor(public title : string,
        public file : string,
        public products : Array<any>,
        public url? : string) {}
        
    public static from_base_array(base_array : Array<any>) {
        return new Base(
            base_array[0],
            base_array[1],
            JSON.parse(base_array[2] || '[]') as Array<any>
        )
    }
            
    public static to_base_array(base : Base) : Array<any> {
        return [
            base.title, 
            base.file,
            JSON.stringify(base.products)
        ]
    }
}

