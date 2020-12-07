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

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LoginPresentation } from './components/login.presentation';

describe('LoginPresentation', () => {

  let component: LoginPresentation
  let fixture: ComponentFixture<LoginPresentation>

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ LoginPresentation ]
    })
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPresentation)
    component = fixture.componentInstance

    fixture.detectChanges()
  });

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should ask for spreadsheet ID when not logged in', () => {

    // Not logged in
    component.ready = -1

    fixture.detectChanges()

    const loginElement = fixture.nativeElement.querySelector('b')
    expect(loginElement.textContent).toEqual('Insert your spreadsheet ID to login:');
  })

  it('should show sheet_id when logged in', () => {

    // Logged in
    component.ready = 1
    component.sheet_id = 'ABC123'

    fixture.detectChanges()

    const loginElement = fixture.nativeElement.querySelector('p')
    expect(loginElement.textContent).toContain(component.sheet_id);
  })
})