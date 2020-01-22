import { Injectable } from '@angular/core';
import { Video, Base, Product, BaseConfigs } from 'app/models/entities';
import { GoogleAPI } from './GoogleAPI';
import { environment } from 'environments/environment';
import { ConfigurationInterface } from 'app/repositories/configuration.interface';

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
    
    async load_drive_folder(): Promise<string> {
        return (await this.googleApi.get_values(environment.configuration.drive_folder))[0][0]
    }

    async load_products() : Promise<Product[]> {
        return (await this.googleApi.get_values(environment.configuration.product_range)).map(Product.from_product_array)
    }    

    async load_bases(): Promise<Base[]> {

        const bases : Array<Base> = []
  
        // Load all bases
        const results = (await this.googleApi.get_values(environment.configuration.base_videos))
        
        // Then, list all base videos files
        const drive_folder = await this.load_drive_folder()
        const files = await this.googleApi.list_files_from_folder(drive_folder, 'base_videos')
        
        // Add each base
        for (let i = 0; i < results.length; i++) {
            
            const element = results[i]
            const configs = await this.googleApi.get_values(element[0] + environment.configuration.base_range)
            
            bases.push(
            new Base(
                files[element[1]],
                element[0],
                element[1],
                element[2],
                element[3],
                configs)
            )
        }
        
        return bases
    }

    async load_videos() : Promise<Video[]> {
        return (await this.googleApi.get_values(environment.configuration.campaign_range)).map(Video.from_video_array)
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

    async save_bases(bases: Base[]): Promise<any> {
        
        const data = []
  
        // Base configurations
        const bases_configs = []

        bases.forEach(b => {

            // Base Info
            bases_configs.push([b.name, b.file, b.number_of_products, b.indexes.join(',')])

            // Configs
            data.push({
                range: b.name + environment.configuration.base_range,
                values: b.configs.map(BaseConfigs.to_base_configs_array)
            })
        })

        // Bases Infos
        data.push({
            range: environment.configuration.base_videos,
            values: bases_configs
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