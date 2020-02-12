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
  video_url
  
  constructor(private router: Router, private facade : BasesFacade, private _snackBar : MatSnackBar) {
    this.bases = facade.bases$
  }
  
  ngOnInit() {
    this.video_url = ''
    this.seconds = 0.0
  }
  
  choose_base(base : Base) {
    this.base = base
    this.video_url = base.url
  }
  
  on_video_loaded(video) {
    this.video = video
    
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