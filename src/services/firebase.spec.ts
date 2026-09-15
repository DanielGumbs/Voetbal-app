import { UserProfileService } from './user-profile.service';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Auth, authState, user, User } from './firebase';
import { Auth as AppAuth } from './supabase';
import { AdminService, ADMIN_EMAIL } from './admin.service';

describe('Firebase authentication adapter', () => {
  it('forwards login changes and unsubscribes from Firebase', () => {
    let listener!: (value: User | null) => void;
    const stop = jasmine.createSpy('unsubscribe');
    const auth = {
      onAuthStateChanged: (next: typeof listener) => {
        listener = next;
        return stop;
      },
    } as unknown as Auth;
    const values: (User | null)[] = [];
    const subscription = authState(auth).subscribe((value) => values.push(value));
    const signedIn = { email: ADMIN_EMAIL, emailVerified: true } as User;
    listener(signedIn);
    listener(null);
    expect(values).toEqual([signedIn, null]);
    subscription.unsubscribe();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('forwards token changes to the user observable', () => {
    const signedIn = { email: ADMIN_EMAIL } as User;
    const auth = {
      onIdTokenChanged: (next: (value: User | null) => void) => {
        next(signedIn);
        return () => {};
      },
    } as unknown as Auth;
    let current: User | null = null;
    const subscription = user(auth).subscribe((value) => (current = value));
    expect<User | null>(current).toBe(signedIn);
    subscription.unsubscribe();
  });

  for (const [email, verified, allowed] of [
    [ADMIN_EMAIL, true, true],
    [ADMIN_EMAIL, false, false],
    ['other@example.com', true, false],
  ] as const) {
    it(`checks admin access for ${email}, verified=${verified}`, () => {
      const auth = {
        onAuthStateChanged: (next: (value: User) => void) => {
          next({ email, emailVerified: verified } as User);
          return () => {};
        },
      } as unknown as Auth;
      TestBed.configureTestingModule({
        providers: [
          {
            provide: UserProfileService,
            useValue: {
              watch: (account: { email: string }) =>
                of({ email: account.email, isAdmin: account.email === 'daniel.r.gumbs@gmail.com' }),
            },
          },
          { provide: AppAuth, useValue: auth },
        ],
      });
      expect(TestBed.inject(AdminService).isAdmin()).toBe(allowed);
    });
  }
});
