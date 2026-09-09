import {inject, Injectable} from '@angular/core';
import {Auth, authState} from '@angular/fire/auth';
import {toSignal} from '@angular/core/rxjs-interop';
import {CanActivateFn, Router} from '@angular/router';
import {map, take} from 'rxjs';
export const ADMIN_EMAIL = 'daniel.r.gumbs@gmail.com';
@Injectable({providedIn: 'root'})
export class AdminService {
  private auth = inject(Auth);
  user = toSignal(authState(this.auth));
  isAdmin = () => this.user()?.email === ADMIN_EMAIL && this.user()?.emailVerified === true;
  assertAdmin() { if (!this.isAdmin()) throw new Error('Alleen Daniel kan gegevens toevoegen.'); }
}
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return authState(inject(Auth)).pipe(take(1), map(u =>
    u?.email === ADMIN_EMAIL && u.emailVerified ? true : router.createUrlTree(['/games'])));
};
