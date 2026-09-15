import { inject, Injectable } from '@angular/core';
import { Database } from './supabase';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { AdminService } from './admin.service';
export const LEGACY_SEASON = 'previous-season';
export interface Season {
  id: string;
  name: string;
}
export type CompetitionType = 'competitie' | 'beker';
export const competitionId = (season: string, type: string) => `${season}_${type}`;
@Injectable({ providedIn: 'root' })
export class SeasonService {
  private db = inject(Database);
  private admin = inject(AdminService);
  selected = new BehaviorSubject<string>(LEGACY_SEASON);
  private defaultSelected = false;
  getSeasons(): Observable<Season[]> {
    return this.db.watch<Season>('seasons').pipe(
      map((rows) => [
        ...rows
          .filter((s) => s.id !== LEGACY_SEASON)
          .sort((a, b) => b.name.localeCompare(a.name, 'nl', { numeric: true })),
        { id: LEGACY_SEASON, name: 'Vorig seizoen' },
      ]),
      tap((seasons) => {
        // Apply the default once; keep the user's choice when navigating between tabs.
        if (!this.defaultSelected && seasons[0].id !== LEGACY_SEASON) {
          this.defaultSelected = true;
          this.selected.next(seasons[0].id);
        }
      }),
    );
  }
  async addSeason(name: string) {
    this.admin.assertAdmin();
    name = name.trim();
    if (!name || name.length > 80) throw new Error('Vul een seizoensnaam in (maximaal 80 tekens).');
    const id = await this.db.addSeason(name);
    this.selected.next(id);
  }
}
