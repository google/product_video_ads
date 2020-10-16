import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { cold, getTestScheduler } from 'jasmine-marbles';

import { LoginComponent } from './components/login.component';
import { LoginFacade } from './login.facade';

describe('LoginComponent', () => {

  let component: LoginComponent
  let fixture: ComponentFixture<LoginComponent>

  const query_params = new Map<string, string>()

  let loginFacadeStub
  let matSnackBarStub

  beforeEach((() => {

    // Stubs
    loginFacadeStub = jasmine.createSpyObj(LoginFacade, ['ready'])
    matSnackBarStub = spyOnAllFunctions(MatSnackBar)

    TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      providers: [
        { 
          provide: LoginFacade, 
          useValue: loginFacadeStub
        }, 
        {
          provide: ActivatedRoute, 
          useValue: {
            snapshot: {
              queryParamMap: query_params
            }
          }
        },
        {
          provide: MatSnackBar, 
          useValue: matSnackBarStub
        }
      ]
    })
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {

    // Query Params
    query_params.set('sheet_id', 'abc123')

    fixture.detectChanges()

    expect(component).toBeTruthy()
  })

  /*it('should ask for spreadsheet ID', () => {

    // Ready observer
    const ready$ = cold('--x', {x: -1})
    loginFacadeStub.ready.and.returnValue(ready$)

    // Process events and flush time
    getTestScheduler().flush()
    fixture.detectChanges()

    const loginElement = fixture.debugElement.nativeElement
    expect(loginElement.textContent).toEqual('Insert your spreadsheet ID to login:');
  })*/
})
