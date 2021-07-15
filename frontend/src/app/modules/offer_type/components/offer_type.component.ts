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

import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OfferTypeFacade } from '../offer_type.facade';
import { InterfaceHelper } from '../../shared/InterfaceHelper'
import { Observable } from 'rxjs';
import { OfferType } from 'app/models/offertype';
import { Config } from 'app/models/config';
import { Base } from 'app/models/base';
import { first } from 'rxjs/operators'

@Component({
  selector: 'app-base',
  templateUrl: '../views/offer_type.component.html',
  styleUrls: ['../views/offer_type.component.scss'],
  providers: [OfferTypeFacade, InterfaceHelper]
})
export class OfferTypeComponent implements OnInit {

  // Data bindings
  offer_types: Observable<OfferType[]>
  bases: Array<Base>

  // Screen selections
  step: number
  offer_type: OfferType
  config: any = {}
  fields: Array<string>
  contents: Array<any>
  content: any
  elements: Array<any>
  parent_elements: Array<any>
  element_focused: any
  loaded_fonts: Set<string>
  locked_name: boolean
  locked_save: boolean
  base_products_timings: Array<any>
  product_shown: string
  is_video: boolean
  base_asset
  base_url
  base_specs
  base_data

  constructor(public facade: OfferTypeFacade, private helper: InterfaceHelper, private _snackBar: MatSnackBar) {

    this.offer_types = this.facade.offer_types$

    this.facade.bases.subscribe(bases => {
      this.bases = bases
    })
  }

  ngOnInit() {
    this.elements = []
    this.parent_elements = []
    this.element_focused = undefined
    this.step = 1
    this.locked_name = false
    this.locked_save = false
    this.base_url = ''
    this.base_data = undefined
    this.loaded_fonts = new Set()
    this.config = new Config()
    this.config.font = 'Ubuntu-Regular.ttf'
    this.offer_type = new OfferType('OfferType', '', [])
    this.base_asset = undefined
    this.product_shown = undefined
    this.base_products_timings = []

    window.scrollTo(0, 0)

    this.facade.update_products()
  }

  move_step(step) {
    this.step = step
  }

  async choose_base(base: Base) {

    this.base_url = base.url
    this.base_products_timings = [...base.products]

    if (!this.locked_name)
      this.offer_types.pipe(first()).subscribe(ots => {
        this.offer_type.title += ' ' + (ots.length + 1)
      })

    this.offer_type.base = base.title
    this.is_video = base.file.endsWith('.mp4')
    this.move_step(3)

    this.base_data = await `data:video/mp4;base64,${btoa(await this.facade.download_video(base.id))}`
  }

  edit_type(offer_type: OfferType) {
    this.offer_type = { ...offer_type }
    this.locked_name = true
    this.choose_base(this.bases.filter(b => b.title == offer_type.base)[0])
  }

  copy_type(offer_type: OfferType) {
    this.offer_type = { ...offer_type }
    this.move_step(2)
  }

  delete_type(offer_type: OfferType) {

    this._snackBar.open('Confirm ' + offer_type.title + ' deletion?', 'Confirm', {
      duration: 4000
    }).onAction().subscribe(() => {
      this.facade.delete_offer_type(offer_type.title, offer_type.base)
      this.save()
    })
  }

  public async on_image_loaded(img) {

    // To calculate elements positions relative
    this.base_specs = {
      width: img.width,
      height: img.height,
      x_ratio: 1,
      y_ratio: 1
    }

    // Load elements on screen
    await this.load_screen_elements()

    // Set base to this screen
    this.base_asset = img
  }

  public async on_video_loaded(video) {

    const adjust = video.videoWidth / 800
    const WIDTH = video.videoWidth / adjust
    const HEIGHT = video.videoHeight / adjust

    video.width = WIDTH
    video.height = HEIGHT

    // To calculate elements positions relative
    this.base_specs = {
      width: video.width,
      height: video.height,
      x_ratio: video.videoWidth / WIDTH,
      y_ratio: video.videoHeight / HEIGHT
    }

    // Load elements on screen
    await this.load_screen_elements()

    // Set base to this screen
    this.base_asset = video
  }

  private async load_screen_elements() {

    // Load parent offer type elements
    this.parent_elements = await this.helper.parse_configs_to_elements(this.facade.get_configs(this.offer_type.parent), this.facade.products)

    // Load chosen offer type elements
    this.elements = await this.helper.parse_configs_to_elements(this.offer_type.configs, this.facade.products)
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
        return { 'id': p.id, 'value': p.values[field] }
      })
    } else {
      this.contents = this.facade.assets.map(a => { return { 'id': a.id, 'value': a[field] || '' } })
    }

    this.contents = this.contents.filter(a => a.value != undefined).filter(a => a.value != '')
  }

  select_example(content) {
    this.config.key = content.id
    this.config.content = content.value
  }

  // Bind from view
  public is_image(content) {
    return this.helper.is_image(content)
  }

  // Bind from view
  public async create_text(product?) {
    const element = await this.helper.create_text(product ? product : this.config, this.loaded_fonts)
    
    this.elements.push(element)
    this.config.conditions = []
  }

  // Bind from view
  public async create_image(product?) {
    const element = await this.helper.create_image(product ? product : this.config)

    this.elements.push(element)
    this.config.conditions = []
  }

  public on_change_text_width(element_focused) {
    element_focused.content = this.helper.wrap_text(element_focused.content_original, element_focused.width)
  }

  public focus_element(element) {
    this.element_focused = element
    console.log('Element focused: ' + element.id)
  }

  choose_position(product) {
    console.log('Setting video position to ' + product['start_time'])
    this.base_asset.currentTime = product['start_time']
  }

  public choose_product_shown() {

    // Set all products as this
    for (let element of this.elements)
      if (element.type == 'product')
        element.key = this.product_shown

    this.finish()
  }

  public delete_element({ id, event }) {

    // Need to hold shift in order to delete element
    if(event && event.shiftKey)
      this.elements = this.elements.filter(e => e.id != id)

    return false
  }

  public send_to_back(element) {

    // Remove element
    this.elements = this.elements.filter(e => e.id != element.id)

    // Insert as first
    this.elements.unshift(element)
  }

  finish() {

    this.locked_save = true

    // Parse screen elements to offer type configuration
    this.offer_type.configs = this.helper.parse_elements_to_configs(this.elements, this.base_specs)

    // Delete any other with same title
    this.facade.delete_offer_type(this.offer_type.title, this.offer_type.base)

    // Add it
    this.facade.add_offer_type(this.offer_type)

    // Save it!
    this.save()
  }

  save() {

    this._snackBar.open("Saving...")

    this.facade.save().then(response => {

      const status = response['status']

      if (status == 200) {
        this._snackBar.open("Saved", '', { duration: 2000 })
        this.ngOnInit()
      } else
        this._snackBar.open("Error (" + status + ')', 'OK', { duration: 10000 })
    })
  }
}