import { UserProfileService } from './user-profile.service';
import { of } from 'rxjs';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ADMIN_EMAIL, adminGuard } from './admin.service';
import { Auth, User } from './supabase';

@Component({ template: 'Wedstrijden' })
class GamesPage {}

@Component({ template: 'Beheer' })
class AdminPage {}

describe('Admin routes', () => {
  for (const account of [
    { email: ADMIN_EMAIL, emailVerified: true },
    { email: ADMIN_EMAIL, emailVerified: false },
    { email: 'other@example.com', emailVerified: true },
    null,
  ]) {
    for (const path of ['/games/new', '/seasons']) {
      it(`protects ${path} for ${JSON.stringify(account)}`, async () => {
        TestBed.configureTestingModule({
          providers: [
            {
              provide: UserProfileService,
              useValue: {
                watch: (account: { email: string }) =>
                  of({
                    email: account.email,
                    isAdmin: account.email === 'daniel.r.gumbs@gmail.com',
                  }),
              },
            },
            provideRouter([
              { path: 'games', component: GamesPage },
              { path: 'games/new', component: AdminPage, canActivate: [adminGuard] },
              { path: 'seasons', component: AdminPage, canActivate: [adminGuard] },
            ]),
            {
              provide: Auth,
              useValue: {
                onAuthStateChanged: (next: (value: User | null) => void) => {
                  next(account as User | null);
                  return () => {};
                },
              },
            },
          ],
        });
        const harness = await RouterTestingHarness.create();
        await harness.navigateByUrl(path);
        const allowed = account?.email === ADMIN_EMAIL && account.emailVerified;
        expect(TestBed.inject(Router).url).toBe(allowed ? path : '/games');
        expect(harness.routeNativeElement?.textContent).toBe(allowed ? 'Beheer' : 'Wedstrijden');
      });
    }
  }
});
