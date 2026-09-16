import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Database } from './supabase';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
  tap,
} from 'rxjs';
import { AdminService } from './admin.service';
import { TeamService } from './team.service';
import { LEGACY_TEAM } from './team.model';
export const LEGACY_SEASON = 'previous-season';
export interface Season {
  id: string;
  name: string;
  teamId?: string | null;
}
export type CompetitionType = 'competitie' | 'beker';
export const competitionId = (season: string, type: string) => `${season}_${type}`;
@Injectable({ providedIn: 'root' })
export class SeasonService {
  private db = inject(Database);
  private admin = inject(AdminService);
  private teams = inject(TeamService);
  selected = new BehaviorSubject<string>(LEGACY_SEASON);
  private needsDefault = true;
  private available: Season[] = [];
  private created = new BehaviorSubject<Season[]>([]);
  private options = combineLatest([
    this.db.watch<Season>('seasons'),
    this.teams.selected,
    this.created,
  ]).pipe(
    map(([rows, teamId, created]) => {
      const merged = new Map([...created, ...rows].map((season) => [season.id, season]));
      const seasons = [...merged.values()]
        .filter((s) => s.id !== LEGACY_SEASON && (s.teamId ?? LEGACY_TEAM) === teamId)
        .sort((a, b) => b.name.localeCompare(a.name, 'nl', { numeric: true }));
      return teamId === LEGACY_TEAM
        ? [...seasons, { id: LEGACY_SEASON, name: 'Vorig seizoen', teamId }]
        : seasons;
    }),
    tap((seasons) => {
      this.available = seasons;
      if (this.needsDefault || !seasons.some((season) => season.id === this.selected.value)) {
        const id = seasons[0]?.id ?? LEGACY_SEASON;
        this.needsDefault = id === LEGACY_SEASON;
        if (this.selected.value !== id) this.selected.next(id);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    this.teams.selected.pipe(distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => {
      // Clear the old team's season before a new list is available, including off-route changes.
      this.available = [];
      this.needsDefault = true;
      this.selected.next(LEGACY_SEASON);
    });
  }

  getSeasons(): Observable<Season[]> {
    return this.options;
  }

  assertWritableSelection(): { teamId: string; seasonId: string } {
    const teamId = this.teams.selected.value;
    const seasonId = this.selected.value;
    if (
      !teamId ||
      !seasonId ||
      seasonId === LEGACY_SEASON ||
      !this.available.some(
        (season) => season.id === seasonId && (season.teamId ?? LEGACY_TEAM) === teamId,
      )
    ) {
      throw new Error('Maak of selecteer eerst een seizoen voor dit team.');
    }
    return { teamId, seasonId };
  }

  async addSeason(name: string) {
    this.admin.assertAdmin();
    name = name.trim();
    if (!name || name.length > 80) throw new Error('Vul een seizoensnaam in (maximaal 80 tekens).');
    const teamId = this.teams.selected.value;
    const id = await this.db.addSeason(name, teamId);
    this.created.next([...this.created.value, { id, name, teamId }]);
    if (this.teams.selected.value === teamId) {
      this.needsDefault = false;
      this.selected.next(id);
    }
  }
}
