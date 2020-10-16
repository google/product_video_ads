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