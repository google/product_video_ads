import { OfferType } from 'app/models/offertype';
import { Product } from 'app/models/product';
import { Video } from 'app/models/video';
import { Asset } from 'app/models/asset';
import { Base } from 'app/models/base';

export interface ConfigurationInterface {

    load_drive_folder() : Promise<string>
    upload_base_file(file : File) : Promise<any>
    load_fonts() : Promise<object>

    load_bases() : Promise<Base[]>
    save_bases(bases : Base[]) : Promise<any>

    load_assets() : Promise<Asset[]>
    save_assets(assets : Asset[]) : Promise<any>

    load_products() : Promise<Product[]>
    save_products(products : Product[]) : Promise<any>

    load_offer_types() : Promise<OfferType[]>
    save_offer_types(bases : OfferType[]) : Promise<any>

    load_videos() : Promise<Video[]>
    save_videos(videos : Video[]) : Promise<any>
}