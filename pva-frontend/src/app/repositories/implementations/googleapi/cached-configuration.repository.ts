import { Injectable, Type } from '@angular/core';
import { Video, Base, Product } from 'app/models/entities';
import { ConfigurationRepository } from './configuration.repository';
import { environment } from 'environments/environment';

@Injectable({providedIn: 'root'})
export class CachedConfigurationRepository extends ConfigurationRepository {

    public clear_cache() {
        Object.values(environment.local_storage_keys)
            .forEach(key => localStorage.removeItem(key))
    }

    async load_products() : Promise<Product[]> {
        return (await this.load_data<Product[]>(environment.local_storage_keys.products, super.load_products.bind(this)))
    }    
    
    async load_bases(): Promise<Base[]> {
        return (await this.load_data<Base[]>(environment.local_storage_keys.bases, super.load_bases.bind(this)))
    }

    async load_videos() : Promise<Video[]> {
        return (await this.load_data<Video[]>(environment.local_storage_keys.videos, super.load_videos.bind(this)))
    }

    async load_drive_folder() : Promise<string> {
        const drive_folder = localStorage.getItem(environment.local_storage_keys.drive_folder)
        return drive_folder != null ? drive_folder : super.load_drive_folder()
    }

    async save_products(products: Product[]): Promise<any> {
        this.save_to_cache(environment.local_storage_keys.products, products)
        return super.save_products(products)
    }

    async save_bases(bases: Base[]): Promise<any> {
        this.save_to_cache(environment.local_storage_keys.bases, bases)
        return super.save_bases(bases)
    }

    async save_videos(videos: Video[]): Promise<any> {
        this.save_to_cache(environment.local_storage_keys.videos, videos)
        return super.save_videos(videos)
    }

    private load_from_cache(key : string) {
        return localStorage.getItem(key)
    }

    private save_to_cache(key : string, value : Object) {
        localStorage.setItem(key, JSON.stringify(value))
    }

    private async load_data<T>(key : string, fallback : Function) : Promise<T> {

        // Check local cache
        const data = this.load_from_cache(key)

        if (data != null)
            return JSON.parse(data) as T

        // Fetch new data
        const fallback_data = await fallback()

        // Save locally
        this.save_to_cache(key, fallback_data)

        return fallback_data
    }
}