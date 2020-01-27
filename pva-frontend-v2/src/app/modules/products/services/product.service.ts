import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Product } from 'app/models/product'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { LoginService } from 'app/modules/login/services/login.service'

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private readonly _headers = new BehaviorSubject<string[]>([])
    private readonly _products = new BehaviorSubject<Product[]>([])
    
    /** Published state to application **/
    readonly headers$ = this._headers.asObservable()
    readonly products$ = this._products.asObservable()

    get headers() {
        return [...this._headers.getValue()]
    }

    get products() {
        return [...this._products.getValue()]
    }

    constructor(private productsRepository : CachedConfigurationRepository, loginService : LoginService) {
        loginService.ready$.subscribe(async ready => {

            if (ready == 1) {

                const products = await this.productsRepository.load_products()

                this._headers.next(products ? products[0].values : [])
                this._products.next(products.slice(1))
            }
        })
    }

    /** Actions **/
    add_product(product : Product) : Promise<any> {
        const next_id = Math.max(...this.products.map(p => p.id)) + 1
        product.id = next_id
        this._products.next([...this.products, product])
        return this.productsRepository.save_products(this.products)
    }
        
    delete_product(id : number) : Promise<any> {
        this._products.next(this.products.filter(p => p.id != id))
        return this.productsRepository.save_products(this.products)
    }
}