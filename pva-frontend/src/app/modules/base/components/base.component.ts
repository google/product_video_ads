import { Component, OnInit } from '@angular/core';
import { Base, BaseConfigs } from 'app/models/entities';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BaseFacade } from '../base.facade';

@Component({
  selector: 'app-base',
  templateUrl: '../views/base.component.html',
  styleUrls: ['../views/base.component.scss'],
  providers: [BaseFacade]
})
export class BaseComponent implements OnInit {
  
  field_options = []
  elements = []
  text_elements = []
  image_elements = []
  loaded_fonts : Set<string> = new Set()

  // Chosen base
  base : Base

  focused_element : any
  fonts : object = {}
  added_items : Map<string, Array<string>> = new Map()

  seconds : any = 0.0
  video
  video_url
  video_pos
  items_options : Array<any> = []
  contents : Array<any> = []
  current_product = {
    width: 0,
    align: 'center',
    color: '#000'
  }

  constructor(public facade : BaseFacade, private _snackBar: MatSnackBar) {}
  
  ngOnInit() {
    this.facade.fonts$.subscribe(fonts => this.fonts = fonts)
  }

  load() {
    
    // Drop down to choose what product to insert
    this.items_options.push({title: 'Auxiliar', product: 0})
    
    for(let i = 1; i <= this.base.number_of_products; i++)
      this.items_options.push({title: 'Product ' + i, product: i*-1})
    
    this.update_base_indexes()

    this.update_configs()

    // Video URL
    this.video_url = 'https://drive.google.com/uc?export=download&id=' + this.base.id
  }

  private update_base_indexes() {

    // Basic products indexes if base not yet configured
    if (this.base.indexes.length == 0)
      for(let i = 1; i <= this.base.number_of_products; i++)
        this.base.indexes.push(i*-1)
  }

  choose_base() {
    this.base = this.facade.remove_config(this.base.name)
  }

  private update_configs() {

    // Added itens with time range
    this.added_items = new Map()

    for(let config of this.base.configs) {

      const key = config.start_time + 's - ' + config.end_time + 's'

      if (!this.added_items.has(key))
        this.added_items.set(key, [])

      this.added_items.get(key).push(config.id)
    }
  }
  
  /*********** Video controls **********/
  on_video_loaded(video) {
    
    const WIDTH = 800
    const HEIGHT = 450

    this.video = video
    
    video.width = WIDTH
    video.height = HEIGHT

    // To calculate elements positions relative
    this.video_pos = {
      x: video.offsetLeft, 
      y: video.offsetTop,
      width: video.videoWidth,
      height: video.videoHeight,
      x_ratio: video.videoWidth/WIDTH,
      y_ratio: video.videoHeight/HEIGHT
    }
  }

  play_pause() {
    
    if (this.video.paused)
      this.video.play()
    else
      this.video.pause()
    
    this.seconds = this.video.currentTime.toFixed(1)
  }
  
  go_to_second() {
    this.video.currentTime = this.seconds
  }
  
  go_seconds_back(seconds_pace) {
    this.seconds = (parseFloat(this.seconds) - seconds_pace).toFixed(1)
    this.go_to_second()
  }
  
  go_seconds_forward(seconds_pace) {
    this.seconds = (parseFloat(this.seconds) + seconds_pace).toFixed(1)
    this.go_to_second()
  }

  /*********** Element choosing controls **********/
  select_element() {
    
    // Load field options based on which element to insert (product or auxiliar)
    delete this.current_product['field']
    delete this.current_product['content']
    
    // If choose auxiliar
    if (this.current_product['product'] == 0)
      this.field_options = ['custom', 'image']
    else
      this.field_options = ['title', 'price', 'custom', 'image']
  }
  
  select_field(field) {
    
    // Load content examples of chosen field
    this.current_product['field'] = field
    
    // Load content for that field
    this.contents = this.facade.products
    .filter(p => p.is_product == (this.current_product['product'] < 0) && p[field] != '')
    .map(p => { 
      return { 
        content: p[field], 
        product: p['id'] 
      }
    })
  }
  
  select_example(content) {
    
    // Set chosen content
    this.current_product['content'] = content.content
    
    // If its auxiliar, set correct product
    if (this.current_product['product'] == 0)
      this.current_product['product'] = content.product
  }
  
  private create_element(product) {
    
    const element = {
      id: Date.now(),
      x: 0,
      y: 0,
      ...product
    }

    setTimeout(() => {
      this.add_events(element)
    }, 500)
    
    return element
  }

  // Bind from view
  create_text(product?) {
    
    const current_product = product ? product : this.current_product
    const element = this.create_element(current_product)

    // Load font for this text, if not loaded yet
    const font_name = current_product.font.split('.')[0]

    if (!this.loaded_fonts.has(font_name)) {

      const font_content = this.fonts[current_product.font]

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
    element.content = this.wrap_text(
      current_product['content'],
      current_product['width'])
      .join('<br/>')
      
      this.text_elements.push(element)
      this.clear_temporary_product(current_product)

      return element
    }
    
    // Bind from view
    create_image(product?) {
      
      const current_product = product ? product : this.current_product
      const element = this.create_element(current_product)
      
      this.image_elements.push(element)
      this.clear_temporary_product(current_product)

      return element
    }
    
    private wrap_text(text, charaters_per_line) {
      
      const words = []
      
      if (charaters_per_line == 0)
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
      
      return words
    }

    // View events to elements added
    private add_events(element) {
      
      const el = document.getElementById(element.id)
      
      el.addEventListener('click', this.focus_element.bind(this), false)
      el.addEventListener('dragstart', this.drag_start, false)
      el.addEventListener('contextmenu', this.save_element.bind(this), false)
      el.addEventListener('dblclick', this.delete_element.bind(this), false)
      
      document.body.addEventListener('dragover', this.drag_over,false)
      document.body.addEventListener('drop', this.drop_event.bind(this), false)
      
      this.elements.push(element)
    }

    private focus_element(event) {
      this.focused_element = this.elements.filter(e => e.id == event.target.id)[0]
    }
    
    private drag_start(event) {
      event.dataTransfer.setData("text/plain", event.target.id)
    }
    
    private drag_over(event) {
      event.preventDefault();
      return false;
    }
    
    private drop_event(event) {
      
      var id = event.dataTransfer.getData("text/plain")
      
      // Element on screen
      const dm = document.getElementById(id)
      dm.style.left = (event.clientX - dm.offsetWidth/2) + 'px';
      dm.style.top = (event.clientY - dm.offsetHeight/2) + 'px';
      
      // Element saved
      const element = this.elements.filter(e => e.id == id)[0]
    
      // Adjust on align
      let align_adjust = 0
      
      if (element.align && element.align == 'left')
        align_adjust = dm.offsetWidth/2

      if (element.align && element.align == 'right')
        align_adjust = -dm.offsetWidth/2

      element.x = ((event.clientX - this.video_pos.x - align_adjust) * this.video_pos.x_ratio).toFixed(0)
      element.y = ((event.clientY - dm.offsetHeight/2 - this.video_pos.y) * this.video_pos.y_ratio).toFixed(0)
      
      this.focused_element = element

      event.preventDefault()
      return false
    }
    
    private element_position_to_style(element) {

      const dm = document.getElementById(element.id)

      if (element.field == 'image') {
        element.width /= this.video_pos.x_ratio
        element.height /= this.video_pos.y_ratio
      }

      element.size /= this.video_pos.x_ratio

      // Adjust on align
      let align_adjust = 0
      
      if (element.align == 'center')
        align_adjust = dm.offsetWidth/2

      if (element.align == 'right')
        align_adjust = dm.offsetWidth

      dm.style.left = ((parseInt(element.x) - align_adjust) / this.video_pos.x_ratio) + this.video_pos.x + 'px'
      dm.style.top =  (parseInt(element.y) / this.video_pos.y_ratio) + this.video_pos.y + 'px';
    }
    
    private clear_temporary_product(product) {
      delete product['field']
      delete product['product']
      delete product['content']
    }

    edit_row(key) {

      // Edit all itens on that key
      for(let id of this.added_items.get(key)) {

        const row = this.base.configs.filter(c => c.id == id)[0]
        const product_index = this.base.indexes[row.product - 1]

        let content
        
        // Fix product ID to differ from auxiliar
        if (product_index < 0) {
          row.product = product_index
          content = this.facade.products.filter(p => p.is_product)[product_index*-1-1][row.field]
        } else {
          row.product = product_index
          content  =  this.facade.products.filter(p => p.id == product_index)[0][row.field]
        }

        const element = row.field == 'image' ? 
                        this.create_image({content, ...row}) : 
                        this.create_text({content, ...row})

        setTimeout(() => {
          this.element_position_to_style(element)
        }, 500)
      }

      // Now that element is on screen, delete from configs
      this.delete_row(key)
    }
    
    delete_row(key) {

      // Delete all itens on key
      for(let id of this.added_items.get(key)) {
        this.facade.delete_config(this.base, id)
      }

      this.update_configs()
    }
    
    private save_element(event) {
      
      event.preventDefault();
      
      const id = event.target.id
      const el = this.elements.filter(e => e.id == id)[0]
      
      // Set times
      if (!el.start_time) {
        el.start_time = this.seconds
        this._snackBar.open("Start time saved to element", 'OK', {
          duration: 2000,
        })
        return
      }
      
      if (!el.end_time) {
        el.end_time = this.seconds
        this._snackBar.open("End time saved to element", 'OK', {
          duration: 2000,
        })
        return
      }
      
      this.add_element_to_configs(el)
      
      this.delete_element(event)
      
      return false;
    }
    
    private delete_element(event) {
      
      event.preventDefault();
      
      const id = event.target.id
      
      // Delete from screen
      this.elements = this.elements.filter(e => e.id != id)
      this.text_elements = this.text_elements.filter(e => e.id != id)
      this.image_elements = this.image_elements.filter(e => e.id != id)
      
      return false;
    }
    
    private add_element_to_configs(element) {
      
      const alreadyExistIndex = this.base.indexes.indexOf(element.product)
      
      if (alreadyExistIndex > -1)
        element.product = alreadyExistIndex + 1
      else
        element.product = this.base.indexes.push(element.product)
      
      this.base.configs.push(new BaseConfigs(
        element.product,
        element.field,
        parseInt(element.x),
        parseInt(element.y),
        element.start_time,
        element.end_time,
        element.font,
        element.color,
        Math.floor(element.size*this.video_pos.x_ratio),
        element.field == 'image' ? Math.floor(element.width*this.video_pos.x_ratio) : element.width,
        element.field == 'image' ? Math.floor(element.height*this.video_pos.y_ratio) : element.height,
        element.align,
        element.angle
        ))
        
        this._snackBar.open("Element added!", 'OK', {
          duration: 2000,
        })

        this.update_configs()
      }
      
      finish() {

        this._snackBar.open("Saving configuration...", 'OK', {
          duration: 2000,
        })

        this.facade.add_config(this.base)

        this.facade.save().then(response => {
          this._snackBar.open("Saved: " + response['status'], 'OK', {
            duration: 2000
          })
        })
      }
    }