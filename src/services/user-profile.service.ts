import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Database, User } from './supabase';
import { Language } from '../i18n/translation.service';

export const ADMIN_EMAIL = 'daniel.r.gumbs@gmail.com';
export interface UserProfile {
  email: string;
  isAdmin: boolean;
  language?: Language;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private database = inject(Database);
  async setLanguage(account: User, language: Language): Promise<void> {
    const { error } = await this.database.client.rpc('set_language', {
      preferred_language: language,
    });
    if (error) throw error;
  }
  watch(account: User): Observable<UserProfile | null> {
    // The database creates profiles and roles; the browser cannot assign roles.
    return this.database
      .watch<UserProfile>('users', account.uid)
      .pipe(map((rows) => rows[0] ?? null));
  }
}
