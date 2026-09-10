import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, throwError } from 'rxjs';
import { AdminService } from './admin.service';
import { Auth, User } from './firebase';
import { UserProfile, UserProfileService } from './user-profile.service';

describe('Database admin permissions', () => {
  it('uses the boolean role and immediately applies role changes', () => {
    const profile = new BehaviorSubject<UserProfile | null>({
      email: 'other@example.com',
      isAdmin: false,
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Auth,
          useValue: {
            onAuthStateChanged: (next: (value: User) => void) => {
              next({ email: 'other@example.com', emailVerified: true } as User);
              return () => {};
            },
          },
        },
        { provide: UserProfileService, useValue: { watch: () => profile } },
      ],
    });
    const admin = TestBed.inject(AdminService);
    expect(admin.isAdmin()).toBeFalse();
    profile.next({ email: 'other@example.com', isAdmin: true });
    expect(admin.isAdmin()).toBeTrue();
    profile.next({ email: 'other@example.com', isAdmin: false });
    expect(() => admin.assertAdmin()).toThrow();
    profile.next(null);
    expect(admin.isAdmin()).toBeFalse();
  });

  it('denies access when the profile cannot be read, even for Daniel', () => {
    spyOn(console, 'error');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Auth,
          useValue: {
            onAuthStateChanged: (next: (value: User) => void) => {
              next({ email: 'daniel.r.gumbs@gmail.com', emailVerified: true } as User);
              return () => {};
            },
          },
        },
        {
          provide: UserProfileService,
          useValue: { watch: () => throwError(() => new Error('permission-denied')) },
        },
      ],
    });
    expect(TestBed.inject(AdminService).isAdmin()).toBeFalse();
  });
});
