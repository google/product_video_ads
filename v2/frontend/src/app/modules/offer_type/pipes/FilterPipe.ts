import { PipeTransform, Pipe } from '@angular/core';

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], term: string): any {
        return items.filter(item => item.title.toLowerCase().indexOf(term.toLowerCase()) !== -1);
    }
}