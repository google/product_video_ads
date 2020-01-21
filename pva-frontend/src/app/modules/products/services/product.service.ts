import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Product } from 'app/models/entities'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private readonly _products = new BehaviorSubject<Product[]>([])
    
    /** Published state to application **/
    readonly products$ = this._products.asObservable()

    get products() {
        return [...this._products.getValue()]
    }

    constructor(private productsRepository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {
            if (ready == 1)
                this._products.next(await this.productsRepository.load_products())
        })
    }

    /** Actions **/
    add_product(product : Product) : Promise<any> {
        const next_id = Math.max(...this.products.map(p => p.id)) + 1
        product.id = next_id
        this._products.next([...this.products, product])
        return this.productsRepository.save_products(this.products)
    }
        
    delete_product(product : Product) : Promise<any> {
        this._products.next(this.products.filter(p => p.id != product.id))
        return this.productsRepository.save_products(this.products)
    }
    
    update_product(product : Product) : Promise<any> {
        const edited_product = this.products.filter(p => p.id == product.id)[0]
        edited_product.image = product.image
        edited_product.custom = product.custom
        edited_product.price = product.price
        edited_product.title = product.title
        this._products.next(this.products)
        return this.productsRepository.save_products(this.products)
    }
}