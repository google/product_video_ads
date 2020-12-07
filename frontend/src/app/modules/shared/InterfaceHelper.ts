/*
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Injectable } from '@angular/core'
import { FontsService } from '../bases/services/fonts.service'
import { CachedConfigurationRepository } from 'app/repositories/implementations/googleapi/cached-configuration.repository'
import { AssetsService } from '../products/services/assets.service'
import { Config } from 'app/models/config'
import * as UUID from 'uuid/v4'
import { Product } from 'app/models/product'

@Injectable({providedIn: 'root'})
export class InterfaceHelper {

    constructor(private fontsService : FontsService, 
                private repository : CachedConfigurationRepository,
                private assetsService : AssetsService) {}

    async create_text(product, loaded_fonts) {

        const current_product = product
        const element = { id: UUID(), ...product }

        element.view_type = 'text'

        // Load font for this text, if not loaded yet
        const font_name = current_product.font.split('.')[0]

        if (!loaded_fonts.has(font_name)) {

            const font_content = this.fontsService.fonts[current_product.font]

            const styles = `
          @font-face {
            font-family: ${font_name};
            src: url(data:font/truetype;charset=utf-8;base64,${btoa(font_content)}) format('truetype');
          }`

            const node = document.createElement('style');
            node.innerHTML = styles;
            document.head.appendChild(node);

            loaded_fonts.add(font_name)
        }

        // Add this font to the element
        element.font_family = font_name

        // Wrap text to break into lines
        element['content_original'] = current_product['content']

        element.content = this.wrap_text(
            current_product['content'],
            current_product['width'])

        return element
    }

    async create_image(product?) {

        const current_product = product

        // Download image bytes if needed (if has security)
        current_product.content = await this.download_image(current_product.content)

        const element = { id: UUID(), ...product }

        element.view_type = 'image'

        return element
    }

    async download_image(url: string) {

      const data_uri = 'data:image/{EXTENSION};base64,{DATA}'
  
      // Only rule for now is download from GCS bucket
      if (url.startsWith('gs://')) {
  
        const splits = url.split('.')
  
        return data_uri.
          replace('{EXTENSION}', splits[splits.length - 1]).
          replace('{DATA}', btoa(await this.repository.download_image_from_gcs(url)))
      }
  
      // Else, use url itself (for http*)
      return url
    }

     wrap_text(text, charaters_per_line) {
      
        const words = []
        
        if (charaters_per_line == 0 || text == undefined)
          return [text]
        
        const all_words = text.split(' ')
        let curr_chars = 0
        let last_index = 0
        
        all_words.forEach((word, i) => {
          
          if (curr_chars + word.length >= charaters_per_line) {
            words.push(all_words.slice(last_index, i).join(' '))
            last_index = i
            curr_chars = 0
          }
          
          if (i == all_words.length - 1)
          words.push(all_words.slice(last_index, i+1).join(' '))
          
          curr_chars += word.length
        })
        
        return words.join('<br/>')
    }

    is_image(content) : boolean {
        return content && (content.startsWith('http') || content.startsWith('gs://'))
    }

    async parse_configs_to_elements(configs : Array<Config>, products : Product[]) : Promise<Array<any>> {

        const elements = []
        const loaded_fonts : Set<string> = new Set<string>()

        // Add all elements on screen
        for (let c of configs) {
    
          // Draw assets
          if (c.type == 'asset') {
    
            const content = this.assetsService.assets.filter(a => a.id == c.key)[0][c.field]
    
            if (c.field == 'image')
                elements.push(await this.create_image({ ...c, content, loaded_element: true }))
            else
                elements.push(await this.create_text({ ...c, content, loaded_element: true }, loaded_fonts))

          } else {
    
            // Product
            const current_product = products.filter(p => p.id == c.key)[0] || products[0]
            const content = current_product.values[c.field]
    
            if (this.is_image(content))
                elements.push(await this.create_image({ ...c, content, loaded_element: true }))
            else
                elements.push(await this.create_text({ ...c, content, loaded_element: true }, loaded_fonts))
          }
        }
    
        return elements
    }

    parse_elements_to_configs(elements, base_specs) : Array<Config> {

        const configs : Array<Config> = []

        for (let e of elements.values()) {
    
          // When flipped or rotated, adjust height
          if (e.flip || e.angle != 0) {
            e.angle = -90
            e.align = 'left'
            e.y -= document.getElementById(e.id).offsetWidth
          }

          // Add texts
          if (e.view_type == 'text') {
    
            // Adjust X if alignment is center or right for texts
            if (e.align == 'center' || e.align == 'right') {
              const htmlElement = document.getElementById(e.id)
              e.x += e.align == 'center' ? htmlElement.offsetWidth / 2 : htmlElement.offsetWidth
            }
    
            configs.push(new Config(
              e.key,
              e.type,
              e.field,
              parseInt((e.x * base_specs.x_ratio).toFixed(0)),
              parseInt((e.y * base_specs.y_ratio).toFixed(0)),
              0,
              0,
              e.font,
              e.color,
              Math.floor(e.size * base_specs.x_ratio),
              e.width,
              e.height,
              e.align,
              e.angle,
              e.keep_ratio,
              e.conditions
            ))
          }
    
          else {
    
            // Add images
            configs.push(new Config(
              e.key,
              e.type,
              e.field,
              parseInt((e.x * base_specs.x_ratio).toFixed(0)),
              parseInt((e.y * base_specs.y_ratio).toFixed(0)),
              0,
              0,
              '',
              '',
              0,
              e.width * base_specs.x_ratio,
              e.height * base_specs.y_ratio,
              'left',
              e.angle,
              e.keep_ratio,
              e.conditions
            ))
          }
        }

        return configs
    }
} 