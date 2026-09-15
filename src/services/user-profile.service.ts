import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Database, User } from './supabase';

export const ADMIN_EMAIL = 'daniel.r.gumbs@gmail.com';
export interface UserProfile {
  email: string;
  isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private database = inject(Database);
  watch(account: User): Observable<UserProfile | null> {
    // The database creates profiles and roles; the browser cannot assign roles.
    return this.database
      .watch<UserProfile>('users', account.uid)
      .pipe(map((rows) => rows[0] ?? null));
  }
}
