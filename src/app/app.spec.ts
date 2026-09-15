import { UserProfileService } from '../services/user-profile.service';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { Auth } from '../services/supabase';
const signedOutAuth = {
  onIdTokenChanged: (next: (user: null) => void) => {
    next(null);
    return () => {};
  },
  onAuthStateChanged: (next: (user: null) => void) => {
    next(null);
    return () => {};
  },
};
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: UserProfileService,
          useValue: {
            watch: (account: { email: string }) =>
              of({ email: account.email, isAdmin: account.email === 'daniel.r.gumbs@gmail.com' }),
          },
        },
        provideRouter([]),
        { provide: Auth, useValue: signedOutAuth },
      ],
    }).compileComponents();
  });
  it('shows the login screen when signed out', () => {
    localStorage.setItem('voetbal.language', 'nl');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Jouw team.');
    expect(fixture.nativeElement.textContent).toContain('Doorgaan met Google');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
  });
});
