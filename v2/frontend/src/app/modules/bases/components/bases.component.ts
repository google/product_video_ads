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
  
  new_base = false
  bases : Observable<Base[]>
  base : Base
  seconds : any
  product = {'start_time': 0.0, 'end_time': 0.0}
  video
  video_duration
  video_url
  
  constructor(private router: Router, private facade : BasesFacade, private _snackBar : MatSnackBar) {
    this.bases = facade.bases$
  }
  
  ngOnInit() {
    this.video_url = ''
    this.seconds = 0.0
  }

  is_video_base(file : string) {
    return file.endsWith('.mp4')
  }
  
  choose_base(base : Base) {

    if (!this.is_video_base(base.file))
      return

    this.base = base
    this.video_url = base.url
  }
  
  on_video_loaded(video) {
    this.video = video
    
    this.video_duration = video.duration.toFixed(1)
    video.width = 800
    video.height = 450
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

  add_product() {
    this.base.products.push({...this.product})
  }

  delete_product(index) {
    this.base.products.splice(index, 1)
  }

  delete_base(base : Base) {
    this.facade.delete_base(base.title).then(response => {
      this._snackBar.open("Base deleted status: " + response.status, 'OK', {
        duration: 2000
      })
    })
  }

  create_base(title : string, file : File) {

    this.new_base = false

    this._snackBar.open("Creating new base...", 'OK', {
      duration: 10000,
    })

    this.facade.upload_base_file(file).then(response => {

      this._snackBar.open("Uploaded successfuly!", 'OK', {
        duration: 2000
      })

      this.facade.add_base(title, file.name, response.id).then(response => {

        this._snackBar.open("Created: " + response['status'], 'OK', {
          duration: 2000
        })

        // Handle default time to images
        if (!this.is_video_base(file.name)) {
          this.base = this.facade.bases.filter(b => b.title == title)[0]
          this.base.products.push({start_time: 0, end_time: 0})
          this.finish()
        }

      })
    }).catch(err => {
      this._snackBar.open("Fail: " + err, 'OK', {
        duration: 4000
      })
    }) 
  }
  
  finish() {

    this.facade.update_products(this.base)
    
    this._snackBar.open("Saving base", 'OK', {
      duration: 2000,
    })
    
    this.facade.save().then(response => {
      
      const status = response['status']
      
      this._snackBar.open("Saved: " + status, 'OK', {
        duration: 2000
      })
      
      if (status == 200)
        this.router.navigate(['/offer_types'])
    })
  }

}