import { OfferType } from 'app/models/offertype';
import { Product } from 'app/models/product';
import { Video } from 'app/models/video';
import { Asset } from 'app/models/asset';

export interface ConfigurationInterface {

    load_drive_folder() : Promise<string>

    load_bases() : Promise<object>
    load_fonts() : Promise<object>

    load_assets() : Promise<Asset[]>
    save_assets(assets : Asset[]) : Promise<any>

    load_products() : Promise<Product[]>
    save_products(products : Product[]) : Promise<any>

    load_offer_types() : Promise<OfferType[]>
    save_offer_types(bases : OfferType[]) : Promise<any>

    load_videos() : Promise<Video[]>
    save_videos(videos : Video[]) : Promise<any>
}