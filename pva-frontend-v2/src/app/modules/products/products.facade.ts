import { Injectable } from '@angular/core';
import { Product } from 'app/models/product';
import { LoginService } from '../login/services/login.service';
import { ProductService } from './services/product.service';

@Injectable()
export class ProductsFacade {
    
    constructor(private loginService : LoginService, private productService : ProductService) {}

    get ready() {
        return this.loginService.ready$
    }

    get headers() {
        return this.productService.headers$
    }

    get products() {
        return this.productService.products$
    }

    add_product(values : Array<string>) {
        this.productService.add_product(new Product(undefined, values))
    }
    
    delete_product(id : number) {
        this.productService.delete_product(id)
    }
}