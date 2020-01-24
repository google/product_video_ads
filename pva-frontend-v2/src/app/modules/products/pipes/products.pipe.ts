import { Pipe, PipeTransform } from '@angular/core';
import { Product } from 'app/models/entities';

@Pipe({ name: 'products_only', pure: false })
export class ProductsPipe implements PipeTransform {
    
  transform(all_products: Product[]) {
    return all_products.filter(p => p.is_product)
  }
}

@Pipe({ name: 'auxiliars_only', pure: false })
export class AuxiliarsPipe implements PipeTransform {
  transform(all_products: Product[]) {
    return all_products.filter(p => !p.is_product)
  }
}