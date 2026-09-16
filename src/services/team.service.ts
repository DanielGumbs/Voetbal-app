import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { AdminService } from './admin.service';
import { Auth, authState, Database } from './supabase';
import { DEFAULT_TEAMS, LEGACY_TEAM, Team } from './team.model';

const STORAGE_KEY = 'voetbal-app.selected-team';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly db = inject(Database);
  private readonly admin = inject(AdminService);
  private readonly refresh = new BehaviorSubject(0);
  private readonly pending = new Map<string, Team>();
  private accountVersion = 0;
  readonly selected = new BehaviorSubject<string>(this.savedSelection());
  private readonly selectedId = toSignal(this.selected, { requireSync: true });
  readonly teams = signal<Team[]>([...DEFAULT_TEAMS]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly currentTeam = computed(
    () => this.teams().find((team) => team.id === this.selectedId()) ?? DEFAULT_TEAMS[0],
  );

  constructor() {
    authState(inject(Auth))
      .pipe(
        map((account) => account?.uid ?? null),
        distinctUntilChanged(),
        switchMap((uid) => {
          this.accountVersion++;
          this.pending.clear();
          this.teams.set([...DEFAULT_TEAMS]);
          this.error.set('');
          if (!uid) {
            this.loading.set(false);
            return of(null);
          }
          return this.refresh.pipe(
            tap(() => {
              this.loading.set(true);
              this.error.set('');
            }),
            switchMap(() =>
              this.db.watch<Team>('teams').pipe(
                catchError(() => {
                  this.error.set('Teams konden niet worden geladen. Probeer het opnieuw.');
                  return of(null);
                }),
              ),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => {
        this.loading.set(false);
        if (rows === null) return;
        const merged = new Map(DEFAULT_TEAMS.map((team) => [team.id, team]));
        for (const row of rows) {
          const team = { ...row, logoUrl: row.logoUrl ?? null };
          const saved = this.pending.get(row.id);
          if (saved?.name === team.name && saved.logoUrl === team.logoUrl)
            this.pending.delete(row.id);
          merged.set(row.id, team);
        }
        // A read started before a successful save can arrive after the write response.
        for (const [id, team] of this.pending) merged.set(id, team);
        this.teams.set([...merged.values()]);
        if (!merged.has(this.selected.value)) this.selectTeam(LEGACY_TEAM);
      });
  }

  selectTeam(id: string) {
    if (!this.teams().some((team) => team.id === id) || this.selected.value === id) return;
    this.selected.next(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Switching teams also works when browser storage is unavailable.
    }
  }

  reload() {
    this.refresh.next(this.refresh.value + 1);
  }

  async createTeam(name: string, logoUrl: string | null) {
    const value = this.validate(name, logoUrl);
    const version = this.accountVersion;
    const { id } = await this.db.add('teams', value);
    if (version !== this.accountVersion) return;
    this.remember({ id, ...value });
    this.selectTeam(id);
  }

  async updateTeam(id: string, name: string, logoUrl: string | null) {
    if (!this.teams().some((team) => team.id === id))
      throw new Error('Dit team bestaat niet meer.');
    const value = this.validate(name, logoUrl, id);
    const version = this.accountVersion;
    await this.db.saveTeam(id, value);
    if (version !== this.accountVersion) return;
    this.remember({ id, ...value });
  }

  private validate(name: string, logoUrl: string | null, id?: string) {
    this.admin.assertAdmin();
    if (this.loading() || this.error())
      throw new Error('Laad de teams opnieuw voordat je opslaat.');
    name = name.trim().replace(/\s+/g, ' ');
    if (!name || name.length > 80) throw new Error('Vul een teamnaam in van maximaal 80 tekens.');
    if (
      this.teams().some(
        (team) =>
          team.id !== id && team.name.toLocaleLowerCase('nl') === name.toLocaleLowerCase('nl'),
      )
    )
      throw new Error('Er bestaat al een team met deze naam.');
    if (
      logoUrl !== null &&
      (logoUrl.length > 180000 ||
        (logoUrl !== '/logo/vedette-logo.jpg' &&
          !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(logoUrl)))
    )
      throw new Error('Kies een geldig PNG-, JPG- of WebP-logo.');
    return { name, logoUrl };
  }

  private remember(team: Team) {
    this.pending.set(team.id, team);
    this.teams.update((teams) =>
      [...teams.filter((item) => item.id !== team.id), team].sort((a, b) => {
        const rank = (id: string) => DEFAULT_TEAMS.findIndex((item) => item.id === id);
        const aRank = rank(a.id),
          bRank = rank(b.id);
        return (
          (aRank < 0 ? 2 : aRank) - (bRank < 0 ? 2 : bRank) || a.name.localeCompare(b.name, 'nl')
        );
      }),
    );
  }

  private savedSelection(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) || LEGACY_TEAM;
    } catch {
      return LEGACY_TEAM;
    }
  }
}
