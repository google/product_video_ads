import { Base, Product, Video } from 'app/models/entities';

export interface ConfigurationInterface {

    load_drive_folder() : Promise<string>

    load_fonts() : Promise<string[]>

    load_products() : Promise<Product[]>
    save_products(products : Product[]) : Promise<any>

    load_bases() : Promise<Base[]>
    save_bases(bases : Base[]) : Promise<any>

    load_videos() : Promise<Video[]>
    save_videos(videos : Video[]) : Promise<any>
}