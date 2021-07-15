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

import { Component, OnInit  } from '@angular/core';
import { BasesFacade } from '../bases.facade';
import { Observable } from 'rxjs';
import { Base } from 'app/models/base';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-auxiliar',
  templateUrl: '../views/bases.component.html',
  styleUrls: ['../views/bases.component.scss']
})
export class BasessComponents implements OnInit {
  
  new_base : boolean
  new_font : boolean
  is_edit_base_file : boolean
  bases : Observable<Base[]>
  base : Base
  seconds : any
  video
  video_duration
  video_data
  loading : boolean
  
  constructor(private router: Router, public facade : BasesFacade, private _snackBar : MatSnackBar) {
    this.bases = facade.bases$
  }
  
  ngOnInit() {
    this.new_base = false
    this.new_font = false
    this.is_edit_base_file = false
    this.loading = false
    this.video = undefined
    this.video_data = undefined
    this.base = undefined
    this.seconds = 0.0

    window.scrollTo(0, 0)
  }

  is_video_base(file : string) {
    return file.endsWith('.mp4')
  }
  
  async choose_base(base : Base) {
    this.loading = true
    this.base = base
    this.video_data = `data:video/mp4;base64,${btoa(await this.facade.download_video(base.id))}`
  }
  
  on_video_loaded(video) {
    this.video_duration = video.duration.toFixed(1)
    video.width = 800
    video.height = 450

    this.video = video
    this.loading = false
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

  edit_file(base : Base) {
    this.base = base
    this.is_edit_base_file = true
  }

  edit_base_file(file : File) {

    this._snackBar.open("Editing base file, please wait...")

    this.facade.upload_base_file(file).then(response => {
      this.facade.update_file(this.base.title, file.name, response.id)
      this.save()
    })
  }

  add_product(start_time, end_time) {
    this.base.products.push({
      start_time: Math.max(start_time, 0.1), 
      end_time: end_time
    })
  }

  delete_product(index) {
    this.base.products.splice(index, 1)
  }

  delete_base(base : Base) {

    this._snackBar.open('Confirm ' + base.title + ' deletion?', 'Confirm', {
      duration: 4000,
    }).onAction().subscribe(() => {
      this.facade.delete_base(base.title).then(response => {
        this._snackBar.open("Base deleted (" + response.status + ')', 'OK', {duration: 2000})
      })
    })
  }

  create_base(title : string, file : File) {

    this.new_base = false

    this._snackBar.open("Uploading new base, please wait...")

    // Upload to drive
    this.facade.upload_base_file(file).then(response => {

      // Add to configuration
      this.facade.add_base(title, file.name, response.id)

      // Handle default time to images (fix this)
      if (!this.is_video_base(file.name)) {
        this.base = this.facade.bases.filter(b => b.title == title)[0]
        this.base.products.push({start_time: 0, end_time: 0})
        this.finish()
      } else 
        this.save()

    }).catch(err => {
      this._snackBar.open("Fail: " + err, 'OK', {
        duration: 4000
      })
    }) 
  }

  add_font(file : File) {

    this.new_font = false

    this._snackBar.open("Uploading font...", 'OK', {
      duration: 10000,
    })

    this.facade.upload_font(file).then(response => {

      this._snackBar.open("Uploaded successfuly (" + response['name'] + ')', 'OK', {
        duration: 2000
      })

      // Reload all fonts
      this.facade.reload_fonts().then(response => {
        this._snackBar.open("Fonts reloaded", 'OK', {
          duration: 2000
        })
      })

    }).catch(err => {
      this._snackBar.open("Fail: " + err, 'OK', {
        duration: 40000
      })
    }) 
  }
  
  finish() {

    this.facade.update_products(this.base)
    
    this._snackBar.open("Saving base configuration...", 'OK', {
      duration: 2000,
    })

    this.save()
  }

  save() {

    this.facade.save().then(response => {
      
      const status = response['status']
      
      this._snackBar.open("Saved (" + status + ')', 'OK', {
        duration: 2000
      })
      
      if (status == 200)
        this.ngOnInit()
    })
  }
}