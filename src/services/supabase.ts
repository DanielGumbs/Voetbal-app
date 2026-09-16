import { inject, Injectable, InjectionToken } from '@angular/core';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { Observable } from 'rxjs';

export const SUPABASE = new InjectionToken<SupabaseClient>('Supabase');
export interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}
export interface Auth {
  onAuthStateChanged(next: (user: User | null) => void): () => void;
  onIdTokenChanged(next: (user: User | null) => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}
export const Auth = new InjectionToken<Auth>('Authentication');
export function mapUser(account: SupabaseUser | null): User | null {
  return account
    ? {
        uid: account.id,
        email: account.email ?? null,
        emailVerified: !!account.email_confirmed_at,
        displayName: account.user_metadata['full_name'] ?? null,
        photoURL: account.user_metadata['avatar_url'] ?? null,
      }
    : null;
}
export function createAuth(client: SupabaseClient): Auth {
  const listen = (next: (user: User | null) => void) => {
    let active = true;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      // Consumers may query the database; run outside the Auth session lock.
      setTimeout(() => {
        if (active) next(mapUser(session?.user ?? null));
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  };
  return {
    onAuthStateChanged: listen,
    onIdTokenChanged: listen,
    async signIn() {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/games' },
      });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
  };
}
export const authState = (auth: Auth) =>
  new Observable<User | null>((subscriber) =>
    auth.onAuthStateChanged((value) => subscriber.next(value)),
  );
export const user = (auth: Auth) =>
  new Observable<User | null>((subscriber) =>
    auth.onIdTokenChanged((value) => subscriber.next(value)),
  );
export const signOut = (auth: Auth) => auth.signOut();
export const signIn = (auth: Auth) => auth.signIn();

@Injectable({ providedIn: 'root' })
export class Database {
  readonly client = inject(SUPABASE);
  watch<T>(table: string, id?: string): Observable<T[]> {
    return new Observable<T[]>((subscriber) => {
      let active = true;
      let revision = 0;
      const refresh = async () => {
        const current = ++revision;
        try {
          const rows: T[] = [];
          // Fetch all pages so historical statistics do not stop at 1,000 rows.
          for (let offset = 0; ; offset += 1000) {
            let query = this.client
              .from(table)
              .select('*')
              .order('id')
              .range(offset, offset + 999);
            if (id) query = query.eq('id', id);
            const { data, error } = await query;
            if (error) throw error;
            rows.push(...(data as T[]));
            if (data.length < 1000) break;
          }
          if (active && current === revision) subscriber.next(rows);
        } catch (error) {
          if (active && current === revision) subscriber.error(error);
        }
      };
      const channel = this.client
        .channel(table + ':' + crypto.randomUUID())
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, ...(id ? { filter: 'id=eq.' + id } : {}) },
          () => void refresh(),
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') void refresh();
        });
      void refresh();
      return () => {
        active = false;
        void this.client.removeChannel(channel);
      };
    });
  }
  async add(table: string, value: object) {
    const { data, error } = await this.client.from(table).insert(value).select('id').single();
    if (error) throw error;
    return data as { id: string };
  }
  async saveTeam(id: string, value: { name: string; logoUrl: string | null }): Promise<void> {
    // Updating only editable columns keeps team IDs immutable at the database.
    const update = () => this.client.from('teams').update(value).eq('id', id).select('id');
    const updated = await update();
    if (updated.error) throw updated.error;
    if (updated.data?.length) return;
    const inserted = await this.client.from('teams').insert({ id, ...value });
    if (!inserted.error) return;
    if (inserted.error.code !== '23505') throw inserted.error;
    // Another admin may have saved a previously virtual built-in team first.
    const retried = await update();
    if (retried.error) throw retried.error;
    if (!retried.data?.length) throw inserted.error;
  }
  async addSeason(name: string, teamId = 'vedette'): Promise<string> {
    const { data, error } = await this.client.rpc('add_season', {
      season_name: name,
      team_id: teamId,
    });
    if (error) throw error;
    return data as string;
  }
}
