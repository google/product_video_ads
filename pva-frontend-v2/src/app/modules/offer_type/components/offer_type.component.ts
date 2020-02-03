import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OfferTypeFacade } from '../offer_type.facade';
import { Observable } from 'rxjs';
import { OfferType } from 'app/models/offertype';
import { Config } from 'app/models/config';
import { Router } from '@angular/router';
import { Base } from 'app/models/base';

@Component({
  selector: 'app-base',
  templateUrl: '../views/offer_type.component.html',
  styleUrls: ['../views/offer_type.component.scss'],
  providers: [OfferTypeFacade]
})
export class OfferTypeComponent implements OnInit {
  
  types : Array<string> = ['product', 'asset']
  
  step : number
  offer_types : Observable<OfferType[]>
  bases : Array<Base>
  offer_type : OfferType
  config : any = {}
  example_time = {}
  fields : Array<string>
  contents : Array<any>
  content : object
  elements : Array<any>
  text_elements : Array<any>
  image_elements : Array<any>
  loaded_fonts : Set<string>
  seconds : any
  video
  video_url
  video_pos

  constructor(public facade : OfferTypeFacade, private router: Router, private _snackBar: MatSnackBar) {
    this.offer_types = this.facade.offer_types$
    this.facade.bases.subscribe(bases => {
      this.bases = bases
    })
  }

  ngOnInit() {
    this.elements = []
    this.image_elements = []
    this.text_elements = []
    this.step = 1 
    this.video_url = ''
    this.seconds = 0.0
    this.loaded_fonts = new Set()
    this.offer_type = new OfferType('Untitled', '', [])
    this.config = new Config()
  }

  move_step(step) {
    this.step = step
  }

  choose_base(base : Base) {
    this.video_url = base.file
    this.offer_type.base = base.title
    this.example_time = base.products[0]
    this.move_step(3)
  }

  edit_type(offer_type : OfferType) {
    this.offer_type = {...offer_type}
    this.choose_base(this.bases.filter(b => b.title = offer_type.base)[0])
  }

  delete_type(offer_type) {
    this.facade.delete_offer_type(offer_type.title)
    this.save()
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

    this.load_elements_on_video()
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
  select_type(type) {
    if (type == 'product')
      this.fields = this.facade.product_headers
    else
      this.fields = ['text', 'image']

    this.contents = []
  }

  select_field(field) {
    if (this.config.type == 'product') {

      const field_index = this.fields.indexOf(field)

      this.contents = this.facade.products.map(p => { 
        return {'id': p.id, 'value': p.values.length > field_index ? p.values[field_index] : ''} 
      })
    } else {
      this.contents = this.facade.assets.map(a => { return {'id': a.id, 'value': a[field] || ''} })
    }

    this.contents = this.contents.filter(a => a.value != '')
  }

  select_example(content) {
    this.config.key = content.id
    this.config.content = content.value
  }

  is_image(content) {
    return content && content.startsWith('http')
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
    
    const current_product = product ? product : this.config
    const element = this.create_element(current_product)

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
    element.content = this.wrap_text(
      current_product['content'],
      current_product['width'])
      .join('<br/>')
      
      this.text_elements.push(element)

      return element
    }
    
    // Bind from view
    create_image(product?) {
      
      const current_product = product ? product : this.config
      const element = this.create_element(current_product)
      
      this.image_elements.push(element)

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
      
      //el.addEventListener('click', this.focus_element.bind(this), false)
      //el.addEventListener('contextmenu', this.save_element.bind(this), false)
      el.addEventListener('dragstart', this.drag_start, false)
      el.addEventListener('dblclick', this.delete_element.bind(this), false)
      
      document.body.addEventListener('dragover', this.drag_over,false)
      document.body.addEventListener('drop', this.drop_event.bind(this), false)

      el.style.visibility = 'visible'
      
      this.elements.push(element)
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
      
      console.log('Dropping ' + id)

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
      
      event.preventDefault()
      return false
    }
    
    private element_position_to_style(element, interval) {

      setTimeout(() => {

        const dm = document.getElementById(element.id)

      if (this.is_image(element.content)) {
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

      // Shows it
      dm.style.visibility = 'visible'
      }, interval)
    }
    
    load_elements_on_video() {

      // Go to video position
      this.seconds = this.example_time['start_time']
      this.go_to_second()

      // Add all elements on screen
      for(let c of this.offer_type.configs) {

        let element

        // Draw assets
        if (c.type == 'asset') {
          
          const content = this.facade.assets.filter(a => a.id = c.key)[0][c.field]

          if (c.field == 'image')
            element = this.create_image({...c, content})
          else
            element = this.create_text({...c, content})
        } else {

          // Product
          const field_index = this.facade.product_headers.indexOf(c.field)
          const content = this.facade.products.filter(p => p.id == c.key)[0].values[field_index]

          if (this.is_image(content))
            element = this.create_image({...c, content})
          else
            element = this.create_text({...c, content})
        }

        this.element_position_to_style(element, 1000)
      }

      this.offer_type.configs = []
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
    
    private add_elements_to_configs() {
      
      // Add all texts
      for (let e of this.text_elements) {
        this.offer_type.configs.push(new Config(
          e.key,
          e.type,
          e.field,
          parseInt(e.x),
          parseInt(e.y),
          0,//this.offer_type.start_time,
          0,//this.offer_type.end_time,
          e.font,
          e.color,
          Math.floor(e.size * this.video_pos.x_ratio),
          e.width,
          0,
          e.align,
          e.angle
        ))
      }

      // Add all images
      for (let e of this.image_elements) {
        this.offer_type.configs.push(new Config(
          e.key,
          e.type,
          e.field,
          parseInt(e.x),
          parseInt(e.y),
          0,//this.offer_type.start_time,
          0,//this.offer_type.end_time,
          '',
          '',
          0,
          e.width * this.video_pos.x_ratio,
          e.height * this.video_pos.y_ratio,
          e.align,
          e.angle
        ))
      }

      this.text_elements = []
      this.image_elements = []
      this.elements = []
      
      // Delete any other with same title
      this.facade.delete_offer_type(this.offer_type.title)

      // Add it
      this.facade.add_offer_type(this.offer_type)
    }

      finish() {
        this.add_elements_to_configs()
        this.save()
      }
      
      save() {

        this._snackBar.open("Saving...", 'OK', {
          duration: 2000,
        })

        this.facade.save().then(response => {

          const status = response['status']

          this._snackBar.open("Saved: " + status, 'OK', {
            duration: 2000
          })

          if (status == 2002)
            this.router.navigate(['/videos'])
          
        })
      }
    }