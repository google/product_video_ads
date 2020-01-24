import { Injectable } from '@angular/core';
import { Product } from 'app/models/entities';
import { LoginService } from '../login/services/login.service';
import { ProductService } from './services/product.service';

@Injectable()
export class ProductsFacade {
    
    constructor(private loginService : LoginService, private productService : ProductService) {}

    ready_state() {
        return this.loginService.ready$
    }

    list_products() {
        return this.productService.products
    }

    add_product(title, price, image, custom, is_product=true) {
        this.productService.add_product(new Product(undefined, title, price, image, custom, is_product))
    }
    
    delete_product(product) {
        this.productService.delete_product(product)
    }

    add_auxiliar(image, custom) {
        this.add_product('', '', image, custom, false)
    }
}