import { UserProfileService } from '../../services/user-profile.service';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';
import { Auth, User } from '../../services/supabase';
import { ADMIN_EMAIL } from '../../services/admin.service';
describe('Navbar access', () => {
  for (const [email, allowed] of [
    [ADMIN_EMAIL, true],
    ['other@example.com', false],
  ] as const) {
    it(`shows management only to the verified admin: ${email}`, () => {
      const notify = (next: (value: User) => void) => {
        next({ email, emailVerified: true, displayName: 'Test' } as User);
        return () => {};
      };
      TestBed.configureTestingModule({
        imports: [Navbar],
        providers: [
          {
            provide: UserProfileService,
            useValue: {
              watch: (account: { email: string }) =>
                of({ email: account.email, isAdmin: account.email === 'daniel.r.gumbs@gmail.com' }),
            },
          },
          provideRouter([]),
          {
            provide: Auth,
            useValue: { onIdTokenChanged: notify, onAuthStateChanged: notify },
          },
        ],
      });
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('nav a[href="/games"]')?.textContent).toContain(
        'Wedstrijden',
      );
      expect(
        fixture.nativeElement.querySelector('nav a[href="/leaderboard"]')?.textContent,
      ).toContain('Statistieken');
      expect(!!fixture.nativeElement.querySelector('a[href="/seasons"]')).toBe(allowed);
    });
  }
});
