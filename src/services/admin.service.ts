import { inject, Injectable } from '@angular/core';
import { Auth, authState } from './supabase';
import { toSignal } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, filter, map, of, shareReplay, startWith, switchMap, take } from 'rxjs';
import { UserProfileService } from './user-profile.service';
export { ADMIN_EMAIL } from './user-profile.service';
@Injectable({ providedIn: 'root' })
export class AdminService {
  private auth = inject(Auth);
  private profiles = inject(UserProfileService);
  readonly adminState$ = authState(this.auth).pipe(
    switchMap((account) =>
      account
        ? this.profiles.watch(account).pipe(
            map((profile) => account.emailVerified && profile?.isAdmin === true),
            catchError((error) => {
              console.error('Gebruikersrechten konden niet worden geladen:', error);
              return of(false);
            }),
            startWith(null),
          )
        : of(false),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  private adminState = toSignal(this.adminState$);
  isAdmin = () => this.adminState() === true;
  assertAdmin() {
    if (!this.isAdmin()) throw new Error('Alleen admins kunnen gegevens toevoegen.');
  }
}
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AdminService).adminState$.pipe(
    filter((allowed) => allowed !== null),
    take(1),
    map((allowed) => (allowed ? true : router.createUrlTree(['/games']))),
  );
};
