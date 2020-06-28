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

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OfferTypeFacade } from '../offer_type.facade';
import { Observable } from 'rxjs';
import { OfferType } from 'app/models/offertype';
import { Config } from 'app/models/config';
import { Router } from '@angular/router';
import { Base } from 'app/models/base';
import { first } from 'rxjs/operators'
import * as UUID from 'uuid/v4'

@Component({
  selector: 'app-base',
  templateUrl: '../views/offer_type.component.html',
  styleUrls: ['../views/offer_type.component.scss'],
  providers: [OfferTypeFacade]
})
export class OfferTypeComponent implements OnInit {
  
  step : number
  offer_types : Observable<OfferType[]>
  bases : Array<Base>
  offer_type : OfferType
  config : any = {}
  fields : Array<string>
  contents : Array<any>
  content : any
  elements : Array<any>
  element_focused : any
  loaded_fonts : Set<string>
  locked_name : boolean
  locked_save : boolean
  base_products_timings : Array<any>
  is_video : boolean
  video
  video_url
  video_pos

  constructor(public facade : OfferTypeFacade, private router: Router, private _snackBar: MatSnackBar, private cd: ChangeDetectorRef) {
    this.offer_types = this.facade.offer_types$
    
    this.facade.bases.subscribe(bases => {
      this.bases = bases
    })
  }

  ngOnInit() {
    this.elements = []
    this.element_focused = undefined
    this.step = 1 
    this.locked_name = false
    this.locked_save = false
    this.video_url = ''
    this.loaded_fonts = new Set()
    this.config = new Config()
    this.config.font = 'Ubuntu-Regular.ttf'
    this.offer_type = new OfferType('OfferType', '', [])
    this.video = undefined
    this.base_products_timings = []

    window.scrollTo(0, 0)

    // Bind arrow keys
    document.addEventListener('keydown', event => {
      this.control_focused_element(event)
    })

    this.facade.update_products()
  }

  private control_focused_element(event) {

    if (this.element_focused == undefined)
      return

    let x = 0, y = 0

    switch (event.key) {

      case 'ArrowUp': 
        y=-1 
        break;

      case 'ArrowDown':
        y=1
          break;

      case 'ArrowLeft':
          x=-1
          break;

      case 'ArrowRight':
          x=1
          break;

      case 'Escape':
          delete this.element_focused
          break;
    }

    if (x != 0 || y != 0) {

      this.move_element_to(this.element_focused, x, y)

      // Change element visually on screen
      this.element_focused.left += x
      this.element_focused.top += y

      event.preventDefault()
    }
  }

  move_step(step) {
    this.step = step
  }

  choose_base(base : Base) {

    this.video_url = base.url
    this.base_products_timings = [...base.products]
    
    if (!this.locked_name)
      this.offer_types.pipe(first()).subscribe(ots => {
        this.offer_type.title += ' ' + (ots.length + 1)
      })
    
    this.offer_type.base = base.title
    this.is_video = base.file.endsWith('.mp4')
    this.move_step(3)
  }

  edit_type(offer_type : OfferType) {
    this.offer_type = {...offer_type}
    this.locked_name = true
    this.choose_base(this.bases.filter(b => b.title == offer_type.base)[0])
  }

  copy_type(offer_type : OfferType) {
    this.offer_type = {...offer_type}
    this.move_step(2)
  }

  delete_type(offer_type : OfferType) {

    this._snackBar.open('Confirm ' + offer_type.title + ' deletion?', 'Confirm', {
      duration: 4000
    }).onAction().subscribe(() => {
      this.facade.delete_offer_type(offer_type.title, offer_type.base)
      this.save()
    })
  }
  
  public on_image_loaded(img) {

    this.video = img

    var rect = img.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    // To calculate elements positions relative
    this.video_pos = {
      x: rect.left, 
      y: rect.top + scrollTop,
      offset_x: img.offsetLeft,
      offset_y: img.offsetTop,
      width: this.video.width,
      height: this.video.height,
      x_ratio: 1,
      y_ratio: 1
    }

    this.load_elements_on_screen()
  }

  public on_video_loaded(video) {
    
    const adjust = video.videoWidth / 800

    const WIDTH = video.videoWidth / adjust 
    const HEIGHT = video.videoHeight / adjust 

    this.video = video

    video.width = WIDTH
    video.height = HEIGHT

    var rect = video.getBoundingClientRect();

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    // To calculate elements positions relative
    this.video_pos = {
      x: rect.left, 
      y: rect.top + scrollTop,
      offset_x: video.offsetLeft,
      offset_y: video.offsetTop,
      width: this.video.width,
      height: this.video.height,
      x_ratio: video.videoWidth/WIDTH,
      y_ratio: video.videoHeight/HEIGHT
    }

    this.load_elements_on_screen()
  }

  select_type(type) {

    if (type == 'product')
      this.fields = this.facade.product_headers
    else
      this.fields = ['text', 'image']

    this.contents = []
  }

  select_field(field) {

    if (this.config.type == 'product') {

      this.contents = this.facade.products.map(p => { 
        return {'id': p.id, 'value': p.values[field] } 
      })
    } else {
      this.contents = this.facade.assets.map(a => { return {'id': a.id, 'value': a[field] || ''} })
    }

    this.contents = this.contents.filter(a => a.value != undefined).filter(a => a.value != '')
  }

  select_example(content) {
    this.config.key = content.id
    this.config.content = content.value
  }

  is_image(content) {
    return content && (content.startsWith('http') || content.startsWith('gs://'))
  }
  
  private create_element(product) {
    
    const element = { id: UUID(), ...product }
    this.elements.push(element)

    return element
  }

  // Bind from view
  async create_text(product?) {
    
    const current_product = product ? product : this.config
    const element = this.create_element(current_product)

    element.view_type = 'text'

    // Load font for this text, if not loaded yet
    const font_name = current_product.font.split('.')[0]

    if (!this.loaded_fonts.has(font_name)) {

      const font_content = this.facade.fonts[current_product.font]

      const styles = `
      @font-face {
        font-family: ${font_name};
        src: url(data:font/truetype;charset=utf-8;base64,${btoa(font_content)}) format('truetype');
      }`

      const node = document.createElement('style');
      node.innerHTML = styles;
      document.head.appendChild(node); 

      this.loaded_fonts.add(font_name)
    }

    // Add this font to the element
    element.font_family = font_name

    // Wrap text to break into lines
    element['content_original'] = current_product['content']

    element.content = this.wrap_text(
      current_product['content'],
      current_product['width'])

    // Insert the text in black color so it is always visible in the white background
    // the selected color will be applied to the text when the element is dropped in the video.
    element.color = product ? product.color : "#000000";
    element.config_color = product ? undefined : this.config.color;
      
    return element
  }
    
    // Bind from view
    public async create_image(product?) {
      
      const current_product = product ? product : this.config

      // Download image bytes if needed (if has security)
      current_product.content = await this.download_image(current_product.content)

      const element = this.create_element(current_product)
      
      element.view_type = 'image'

      return element
    }

    private async download_image(url : string) {

      const data_uri = 'data:image/{EXTENSION};base64,{DATA}'

      // Only rule for now is download from GCS bucket
      if (url.startsWith('gs://')) {
        
        const splits = url.split('.')

        return data_uri.
            replace('{EXTENSION}', splits[splits.length-1]).
            replace('{DATA}', btoa(await this.facade.download_image_from_gcs(url)))
      }

      // Else, use url itself (for http*)
      return url
    }

    public on_change_text_width(element_focused) {
      element_focused.content = this.wrap_text(element_focused.content_original, element_focused.width)
    }
    
    private wrap_text(text, charaters_per_line) {
      
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

    public drag_end({event, element}) {

      this.move_element_to(element, event.distance.x, event.distance.y)

      // Assign selected color for the text first time
      if (element.config_color) {
        element.color = element.config_color
        element.config_color = undefined
      }
    }
    
    public focus_element(element) {
      this.element_focused = element
      console.log('Element focused: ' + element.id)
    }
    
    private move_element_to(element, offset_x, offset_y) {

      console.log('Moving element ' + element.id + 'in ' + offset_x + '/' + offset_y)

      element.x += offset_x
      element.y += offset_y
    }

    choose_position(product) {
      console.log('Setting video position to ' + product['start_time'])
      this.video.currentTime = product['start_time']
    }

    load_elements_on_screen() {

      console.log('Loading elements on screen...')

      // Add all elements on screen
      for(let c of this.offer_type.configs) {

        let element

        // Draw assets
        if (c.type == 'asset') {
          
          const content = this.facade.assets.filter(a => a.id == c.key)[0][c.field]

          if (c.field == 'image')
            element = this.create_image({...c, content, loaded_element: true})
          else
            element = this.create_text({...c, content, loaded_element: true})
        } else {

          // Product
          const current_product = this.facade.products.filter(p => p.id == c.key)[0] || this.facade.products[0]
          const content = current_product.values[c.field]

          if (this.is_image(content))
            element = this.create_image({...c, content, loaded_element: true})
          else
            element = this.create_text({...c, content, loaded_element: true})
        }
      }

      this.offer_type.configs = []
    }
    
    public delete_element(id) {
      
      event.preventDefault();
      
      // Delete from screen
      this.elements = this.elements.filter(e => e.id != id)
      
      return false;
    }
    
    private add_elements_to_configs() {
      
      for (let e of this.elements.values()) {

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
            e.x += e.align == 'center' ? htmlElement.offsetWidth/2 : htmlElement.offsetWidth
          }

          this.offer_type.configs.push(new Config(
            e.key,
            e.type,
            e.field,
            parseInt((e.x * this.video_pos.x_ratio).toFixed(0)),
            parseInt((e.y * this.video_pos.y_ratio).toFixed(0)),
            0,
            0,
            e.font,
            e.color,
            Math.floor(e.size * this.video_pos.x_ratio),
            e.width,
            0,
            e.align,
            e.angle,
            false
          ))
        }

        else {

          // Add images
          this.offer_type.configs.push(new Config(
            e.key,
            e.type,
            e.field,
            parseInt((e.x * this.video_pos.x_ratio).toFixed(0)),
            parseInt((e.y * this.video_pos.y_ratio).toFixed(0)),
            0,
            0,
            '',
            '',
            0,
            e.width * this.video_pos.x_ratio,
            e.height * this.video_pos.y_ratio,
            'left',
            e.angle,
            e.keep_ratio
          ))
        }
      }

      // Delete any other with same title
      this.facade.delete_offer_type(this.offer_type.title, this.offer_type.base)

      // Add it
      this.facade.add_offer_type(this.offer_type)
    }

    finish() {

      this.locked_save = true

      this.add_elements_to_configs()
      this.save()
    }

    save() {

      this._snackBar.open("Saving...", 'OK', {
        duration: 2000,
      })

      this.facade.save().then(response => {

        const status = response['status']

        if (status == 200)
          this.ngOnInit()
        else
          this._snackBar.open("Error (" + status + ')', 'OK', { duration: 10000 })
      })
    }
  }