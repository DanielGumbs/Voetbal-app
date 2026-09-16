import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { AdminService } from './admin.service';
import { Auth, Database, User } from './supabase';
import { DEFAULT_TEAMS, IVV_TEAM, LEGACY_TEAM, Team } from './team.model';
import { TeamService } from './team.service';

describe('Team management', () => {
  const logo = 'data:image/png;base64,aGVsbG8=';
  const account = { uid: 'admin', email: 'admin@example.com', emailVerified: true } as User;
  let rows: BehaviorSubject<Team[]>;
  let notifyAuth: (value: User | null) => void;
  let initialAccount: User | null;
  let add: jasmine.Spy;
  let saveTeam: jasmine.Spy;
  let watch: jasmine.Spy;
  let assertAdmin: jasmine.Spy;
  let getStorage: jasmine.Spy;
  let setStorage: jasmine.Spy;
  let stopAuth: jasmine.Spy;

  beforeEach(() => {
    initialAccount = account;
    rows = new BehaviorSubject<Team[]>([]);
    add = jasmine.createSpy('add').and.resolveTo({ id: 'new-team' });
    saveTeam = jasmine.createSpy('saveTeam').and.resolveTo(undefined);
    watch = jasmine.createSpy('watch').and.callFake(() => rows);
    assertAdmin = jasmine.createSpy('assertAdmin');
    stopAuth = jasmine.createSpy('stopAuth');
    getStorage = spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    setStorage = spyOn(Storage.prototype, 'setItem');
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminService, useValue: { assertAdmin } },
        { provide: Database, useValue: { watch, add, saveTeam } },
        {
          provide: Auth,
          useValue: {
            onAuthStateChanged: (next: (value: User | null) => void) => {
              notifyAuth = next;
              next(initialAccount);
              return stopAuth;
            },
          },
        },
      ],
    });
  });

  it('provides both starting teams and merges stored names and logos without duplicates', () => {
    rows.next([
      { id: LEGACY_TEAM, name: 'Vedette De Remise', logoUrl: logo },
      { id: 'third-team', name: 'Derde team', logoUrl: null },
    ]);
    const service = TestBed.inject(TeamService);
    expect(service.teams()).toEqual([
      { id: LEGACY_TEAM, name: 'Vedette De Remise', logoUrl: logo },
      DEFAULT_TEAMS[1],
      { id: 'third-team', name: 'Derde team', logoUrl: null },
    ]);
    expect(service.currentTeam().logoUrl).toBe(logo);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBe('');
    expect(watch).toHaveBeenCalledWith('teams');
  });

  it('restores a saved selection, persists changes and ignores unknown teams', () => {
    getStorage.and.returnValue(IVV_TEAM);
    const service = TestBed.inject(TeamService);
    expect(service.currentTeam().id).toBe(IVV_TEAM);
    service.selectTeam('missing');
    expect(service.selected.value).toBe(IVV_TEAM);
    expect(setStorage).not.toHaveBeenCalled();
    service.selectTeam(LEGACY_TEAM);
    expect(service.currentTeam().id).toBe(LEGACY_TEAM);
    expect(setStorage).toHaveBeenCalledWith('voetbal-app.selected-team', LEGACY_TEAM);
  });

  it('recovers from a deleted saved team and from unavailable browser storage', () => {
    getStorage.and.returnValue('deleted-team');
    setStorage.and.throwError('Storage disabled');
    const service = TestBed.inject(TeamService);
    expect(service.selected.value).toBe(LEGACY_TEAM);
    expect(() => service.selectTeam(IVV_TEAM)).not.toThrow();
    expect(service.currentTeam().id).toBe(IVV_TEAM);
  });

  it('loads only while signed in and clears account data and subscriptions on sign-out', () => {
    initialAccount = null;
    const service = TestBed.inject(TeamService);
    expect(watch).not.toHaveBeenCalled();
    expect(service.teams()).toEqual(DEFAULT_TEAMS);
    notifyAuth(account);
    expect(watch).toHaveBeenCalledTimes(1);
    rows.next([{ id: 'custom', name: 'Eigen team', logoUrl: logo }]);
    expect(service.teams().length).toBe(3);
    notifyAuth(null);
    expect(service.teams()).toEqual(DEFAULT_TEAMS);
    expect(rows.observed).toBeFalse();
    expect(service.loading()).toBeFalse();
    TestBed.resetTestingModule();
    expect(stopAuth).toHaveBeenCalledTimes(1);
  });

  it('normalizes the name and selects a new team after its write succeeds', async () => {
    const service = TestBed.inject(TeamService);
    await service.createTeam('  Nieuw   team  ', logo);
    expect(add).toHaveBeenCalledWith('teams', { name: 'Nieuw team', logoUrl: logo });
    expect(service.currentTeam()).toEqual({ id: 'new-team', name: 'Nieuw team', logoUrl: logo });
    expect(service.teams().length).toBe(3);
    expect(assertAdmin).toHaveBeenCalledTimes(1);
  });

  it('updates a team and its logo without changing the active team', async () => {
    const service = TestBed.inject(TeamService);
    await service.updateTeam(IVV_TEAM, ' IVV Eerste ', logo);
    expect(saveTeam).toHaveBeenCalledWith(IVV_TEAM, { name: 'IVV Eerste', logoUrl: logo });
    expect(service.teams().find((team) => team.id === IVV_TEAM)).toEqual({
      id: IVV_TEAM,
      name: 'IVV Eerste',
      logoUrl: logo,
    });
    expect(service.selected.value).toBe(LEGACY_TEAM);
    await service.updateTeam(IVV_TEAM, 'IVV Eerste', null);
    expect(service.teams().find((team) => team.id === IVV_TEAM)?.logoUrl).toBeNull();
  });

  it('keeps the local teams and selection unchanged when a write fails', async () => {
    const service = TestBed.inject(TeamService);
    const failure = new Error('Opslaan mislukt');
    add.and.rejectWith(failure);
    saveTeam.and.rejectWith(failure);
    await expectAsync(service.createTeam('Nieuw team', null)).toBeRejectedWith(failure);
    await expectAsync(service.updateTeam(IVV_TEAM, 'IVV Eerste', logo)).toBeRejectedWith(failure);
    expect(service.teams()).toEqual(DEFAULT_TEAMS);
    expect(service.selected.value).toBe(LEGACY_TEAM);
  });

  it('retains confirmed writes through an older snapshot and accepts later server changes', async () => {
    const service = TestBed.inject(TeamService);
    await service.createTeam('Nieuw team', logo);
    rows.next([]);
    expect(service.selected.value).toBe('new-team');
    expect(service.currentTeam().logoUrl).toBe(logo);
    rows.next([{ id: 'new-team', name: 'Nieuw team', logoUrl: logo }]);
    rows.next([{ id: 'new-team', name: 'Bijgewerkt op ander apparaat', logoUrl: null }]);
    expect(service.currentTeam().name).toBe('Bijgewerkt op ander apparaat');
    expect(service.currentTeam().logoUrl).toBeNull();
  });

  it('does not restore account data when a pending save finishes after sign-out', async () => {
    const service = TestBed.inject(TeamService);
    let finishCreate!: (value: { id: string }) => void;
    let finishUpdate!: () => void;
    add.and.returnValue(new Promise<{ id: string }>((resolve) => (finishCreate = resolve)));
    saveTeam.and.returnValue(new Promise<void>((resolve) => (finishUpdate = resolve)));
    const creating = service.createTeam('Nieuw team', logo);
    const updating = service.updateTeam(IVV_TEAM, 'IVV Eerste', logo);
    notifyAuth(null);
    finishCreate({ id: 'new-team' });
    finishUpdate();
    await Promise.all([creating, updating]);
    expect(service.teams()).toEqual(DEFAULT_TEAMS);
    expect(service.selected.value).toBe(LEGACY_TEAM);
    expect(setStorage).not.toHaveBeenCalled();
  });

  it('surfaces a read failure, blocks saving and can reload the teams', async () => {
    const service = TestBed.inject(TeamService);
    rows.error(new Error('Network failure'));
    expect(service.error()).toContain('niet worden geladen');
    expect(service.loading()).toBeFalse();
    await expectAsync(service.createTeam('Nieuw team', null)).toBeRejectedWithError(/opnieuw/);
    expect(add).not.toHaveBeenCalled();
    rows = new BehaviorSubject<Team[]>([{ id: IVV_TEAM, name: 'IVV', logoUrl: logo }]);
    service.reload();
    expect(service.error()).toBe('');
    expect(service.teams().find((team) => team.id === IVV_TEAM)?.logoUrl).toBe(logo);
  });

  it('rejects empty, long and duplicate names and permits keeping an existing team name', async () => {
    const service = TestBed.inject(TeamService);
    await expectAsync(service.createTeam(' ', null)).toBeRejectedWithError(/teamnaam/);
    await expectAsync(service.createTeam('a'.repeat(81), null)).toBeRejectedWithError(/teamnaam/);
    await expectAsync(service.createTeam(' vedette  de remise ', null)).toBeRejectedWithError(
      /bestaat al/,
    );
    await expectAsync(
      service.updateTeam(IVV_TEAM, 'Vedette De Remise', null),
    ).toBeRejectedWithError(/bestaat al/);
    await expectAsync(service.updateTeam('unknown', 'Ander team', null)).toBeRejectedWithError(
      /bestaat niet/,
    );
    expect(add).not.toHaveBeenCalled();
    expect(saveTeam).not.toHaveBeenCalled();
    await expectAsync(service.updateTeam(IVV_TEAM, 'IVV', null)).toBeResolved();
  });

  it('rejects unsupported, external and oversized logos and enforces admin access', async () => {
    const service = TestBed.inject(TeamService);
    for (const invalid of [
      'https://example.com/logo.png',
      'data:image/svg+xml;base64,aGVsbG8=',
      logo + 'a'.repeat(180000),
    ]) {
      await expectAsync(service.createTeam('Nieuw team', invalid)).toBeRejectedWithError(/logo/);
    }
    expect(add).not.toHaveBeenCalled();
    assertAdmin.and.throwError('Alleen admins');
    await expectAsync(service.createTeam('Nieuw team', null)).toBeRejectedWithError(
      'Alleen admins',
    );
    await expectAsync(service.updateTeam(IVV_TEAM, 'IVV', null)).toBeRejectedWithError(
      'Alleen admins',
    );
    expect(saveTeam).not.toHaveBeenCalled();
  });
});
