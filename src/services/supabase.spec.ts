import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { createAuth, Database, mapUser, SUPABASE, User } from './supabase';

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

describe('Supabase team writes', () => {
  const database = (client: object) => {
    TestBed.configureTestingModule({ providers: [{ provide: SUPABASE, useValue: client }] });
    return TestBed.inject(Database);
  };

  it('creates a season in the selected team and retains the legacy default', async () => {
    const rpc = jasmine.createSpy('rpc').and.resolveTo({ data: 'new-season', error: null });
    const db = database({ rpc });
    expect(await db.addSeason('2026 / 2027', '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26')).toBe(
      'new-season',
    );
    expect(rpc).toHaveBeenCalledWith('add_season', {
      season_name: '2026 / 2027',
      team_id: '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26',
    });
    await db.addSeason('2025 / 2026');
    expect(rpc).toHaveBeenCalledWith('add_season', {
      season_name: '2025 / 2026',
      team_id: 'vedette',
    });
  });

  it('updates only editable team fields, including removing a logo', async () => {
    const value = { name: 'IVV', logoUrl: null };
    const select = jasmine
      .createSpy('select')
      .and.resolveTo({ data: [{ id: '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26' }], error: null });
    const eq = jasmine.createSpy('eq').and.returnValue({ select });
    const update = jasmine.createSpy('update').and.returnValue({ eq });
    const insert = jasmine.createSpy('insert');
    const from = jasmine.createSpy('from').and.returnValue({ update, insert });
    await database({ from }).saveTeam('3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26', value);
    expect(from).toHaveBeenCalledWith('teams');
    expect(update).toHaveBeenCalledWith(value);
    expect(eq).toHaveBeenCalledWith('id', '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26');
    expect(insert).not.toHaveBeenCalled();
  });

  it('creates a missing built-in team using its stable ID', async () => {
    const value = { name: 'IVV', logoUrl: 'data:image/png;base64,aGVsbG8=' };
    const select = jasmine.createSpy().and.resolveTo({ data: [], error: null });
    const update = jasmine.createSpy().and.returnValue({ eq: () => ({ select }) });
    const insert = jasmine.createSpy().and.resolveTo({ error: null });
    await database({ from: () => ({ update, insert }) }).saveTeam(
      '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26',
      value,
    );
    expect(insert).toHaveBeenCalledWith({ id: '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26', ...value });
  });

  it('retries only a concurrent insertion and propagates write failures', async () => {
    const duplicate = { code: '23505' };
    const select = jasmine
      .createSpy()
      .and.returnValues(
        Promise.resolve({ data: [], error: null }),
        Promise.resolve({ data: [{ id: '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26' }], error: null }),
      );
    const update = jasmine.createSpy().and.returnValue({ eq: () => ({ select }) });
    const insert = jasmine.createSpy().and.resolveTo({ error: duplicate });
    const rpc = jasmine.createSpy().and.resolveTo({ error: new Error('Season rejected') });
    const db = database({ from: () => ({ update, insert }), rpc });
    await db.saveTeam('3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26', { name: 'IVV', logoUrl: null });
    expect(update).toHaveBeenCalledTimes(2);
    const denied = new Error('Permission denied');
    select.and.resolveTo({ error: denied });
    await expectAsync(
      db.saveTeam('3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26', { name: 'IVV', logoUrl: null }),
    ).toBeRejectedWith(denied);
    await expectAsync(
      db.addSeason('Season', '3e50d9da-5e7a-4c3b-ab1a-ec0276b4aa26'),
    ).toBeRejectedWithError('Season rejected');
  });
});
