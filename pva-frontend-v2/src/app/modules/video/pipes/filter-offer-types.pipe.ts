import { Pipe, PipeTransform } from '@angular/core';
import { OfferType } from 'app/models/offertype';

@Pipe({name: 'filterOfferTypes'})
export class FilterOfferTypesPipe implements PipeTransform {

  transform(offer_types: OfferType[], base: string) : OfferType[] {
    return offer_types.filter(o => o.base == base)
  }
  
}