import { Injectable } from '@angular/core';
import { GoogleAPI } from './GoogleAPI';
import { environment } from 'environments/environment';
import { ConfigurationInterface } from 'app/repositories/configuration.interface';
import { Product } from 'app/models/product';
import { OfferType } from 'app/models/offertype';
import { Video } from 'app/models/video';
import { Asset } from 'app/models/asset';
import { Base } from 'app/models/base';

@Injectable({providedIn: 'root'})
export class ConfigurationRepository implements ConfigurationInterface {

    constructor(public googleApi : GoogleAPI) {}

    async load_fonts(): Promise<object> {
        
        const drive_folder = await this.load_drive_folder()
        const fonts = await this.googleApi.list_files_from_folder(drive_folder, 'fonts')

        // Downloads font file
        for (let [font_name, id] of Object.entries(fonts))
            fonts[font_name] = (await this.googleApi.download_file(id as string))

        return fonts
    }

    async load_bases(): Promise<Base[]> {

        // const drive_folder = await this.load_drive_folder()
        const bases = (await this.googleApi.get_values(environment.configuration.bases_range)).map(Base.from_base_array)

        return bases //(await this.googleApi.list_files_from_folder(drive_folder, 'base_videos'))
    }
    
    async load_drive_folder(): Promise<string> {
        return (await this.googleApi.get_values(environment.configuration.drive_folder))[0][0]
    }

    async load_assets(): Promise<Asset[]> {
        return (await this.googleApi.get_values(environment.configuration.static_assets)).map(Asset.from_asset_array)
    }

    async load_products() : Promise<Product[]> {
        const products = await this.googleApi.get_values(environment.configuration.product_range)
        return products.map(Product.from_product_array)
    }    
    
    async load_offer_types(): Promise<OfferType[]> {
        return (await this.googleApi.get_values(environment.configuration.offer_types_range)).map(OfferType.from_offertype_array)
    }

    async load_videos() : Promise<Video[]> {
        return (await this.googleApi.get_values(environment.configuration.campaign_range)).map(Video.from_video_array)
    }

    async save_bases(bases: Base[]): Promise<any> {

        const data = []
  
        // Bases
        data.push({
          range: environment.configuration.bases_range,
          values: bases.map(Base.to_base_array)
        })
      
        return this.googleApi.save_values(data)
    }

    async save_assets(assets: Asset[]): Promise<any> {

        const data = []
  
        // Static Assets
        data.push({
          range: environment.configuration.static_assets,
          values: assets.map(Asset.to_asset_array)
        })
      
        return this.googleApi.save_values(data)
    }

    async save_products(products: Product[]): Promise<any> {
        
        const data = []
  
        // Products
        data.push({
          range: environment.configuration.product_range,
          values: products.map(Product.to_product_array)
        })
      
        return this.googleApi.save_values(data)
    }

    async save_offer_types(offer_types: OfferType[]): Promise<any> {

        const data = []
  
        data.push({
            range: environment.configuration.offer_types_range,
            values: offer_types.map(OfferType.to_offertype_array)
        })
        
        return this.googleApi.save_values(data)
    }

    async save_videos(videos: Video[]): Promise<any> {

        const data = []
  
        // Campaigns (videos)
        data.push({
            range: environment.configuration.campaign_range,
            values: videos.map(Video.to_video_array)
        })
        
        return this.googleApi.save_values(data)
    }
}