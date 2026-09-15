import { fakeAsync, tick } from '@angular/core/testing';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { createAuth, mapUser, User } from './supabase';

describe('Supabase authentication', () => {
  it('uses the server confirmation, not editable metadata, for verified email', () => {
    const account = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { email_verified: true, full_name: 'Test' },
    } as unknown as SupabaseUser;
    expect(mapUser(account)?.emailVerified).toBeFalse();
    expect(mapUser({ ...account, email_confirmed_at: '2026-09-15' })?.emailVerified).toBeTrue();
    expect(mapUser(null)).toBeNull();
  });

  it('delivers session changes outside the auth callback and stops after unsubscribe', fakeAsync(() => {
    let notify!: (event: string, session: unknown) => void;
    const unsubscribe = jasmine.createSpy('unsubscribe');
    const client = {
      auth: {
        onAuthStateChange: (callback: typeof notify) => {
          notify = callback;
          return { data: { subscription: { unsubscribe } } };
        },
      },
    } as unknown as SupabaseClient;
    const values: (User | null)[] = [];
    const stop = createAuth(client).onAuthStateChanged((value) => values.push(value));
    notify('INITIAL_SESSION', { user: { id: '123', user_metadata: {} } });
    expect(values.length).toBe(0);
    tick();
    expect(values[0]?.uid).toBe('123');
    notify('SIGNED_OUT', null);
    tick();
    expect(values[1]).toBeNull();
    notify('SIGNED_OUT', null);
    stop();
    tick();
    expect(values.length).toBe(2);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  }));

  it('propagates OAuth and logout failures', async () => {
    const error = new Error('network failure');
    const client = {
      auth: {
        signInWithOAuth: jasmine.createSpy().and.resolveTo({ error }),
        signOut: jasmine.createSpy().and.resolveTo({ error }),
      },
    } as unknown as SupabaseClient;
    const auth = createAuth(client);
    await expectAsync(auth.signIn()).toBeRejectedWith(error);
    await expectAsync(auth.signOut()).toBeRejectedWith(error);
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/games' },
    });
  });
});
