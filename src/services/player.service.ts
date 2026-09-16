import { Injectable } from '@angular/core';
import { Database } from './supabase';
import { combineLatest, map, Observable } from 'rxjs';
import { AdminService } from './admin.service';
import { LEGACY_SEASON, SeasonService, competitionId } from './season.service';
import { TeamService } from './team.service';
import { LEGACY_TEAM } from './team.model';
export interface Player {
  id?: string;
  name: string;
  number: number;
  seasonId?: string;
  teamId?: string | null;
  competitionIds?: string[];
}
@Injectable({ providedIn: 'root' })
export class PlayerService {
  constructor(
    private database: Database,
    private seasons: SeasonService,
    private admin: AdminService,
    private teams: TeamService,
  ) {}
  getPlayers(all = false): Observable<Player[]> {
    const rows = this.database.watch<Player>('players');
    return combineLatest([rows, this.teams.selected, this.seasons.selected]).pipe(
      map(([players, teamId, season]) =>
        players.filter(
          (player) =>
            teamId === this.teams.selected.value &&
            (player.teamId ?? LEGACY_TEAM) === teamId &&
            (all || (player.seasonId ?? LEGACY_SEASON) === season),
        ),
      ),
    );
  }
  async addPlayer(name: string, number: number, types: string[]) {
    this.admin.assertAdmin();
    if (
      !name.trim() ||
      name.trim().length > 80 ||
      !Number.isInteger(number) ||
      number < 0 ||
      !types.length ||
      types.some((type) => type !== 'competitie' && type !== 'beker')
    )
      throw new Error('Vul een naam, geldig rugnummer en competitie in.');
    const { teamId, seasonId } = this.seasons.assertWritableSelection();
    return this.database.add('players', {
      name: name.trim(),
      number,
      seasonId,
      teamId,
      competitionIds: [...new Set(types)].map((t) => competitionId(seasonId, t)),
    });
  }
}
