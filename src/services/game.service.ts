import { Injectable } from '@angular/core';
import { Database } from './supabase';
import { combineLatest, map, Observable } from 'rxjs';
import { AdminService } from './admin.service';
import { competitionId, LEGACY_SEASON, SeasonService } from './season.service';
import { TeamService } from './team.service';
import { LEGACY_TEAM } from './team.model';
export interface GameEvent {
  playerId: string;
  type: 'goal' | 'assist';
}
export type LeagueType = 'competitie' | 'beker' | 'friendly';
export interface Game {
  id?: string;
  opponent: string;
  date: string;
  scoreTeam?: number;
  scoreOpponent?: number;
  events: GameEvent[];
  players?: string[];
  league: LeagueType;
  seasonId?: string;
  teamId?: string | null;
  competitionId?: string;
}
@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(
    private database: Database,
    private seasons: SeasonService,
    private admin: AdminService,
    private teams: TeamService,
  ) {}
  getGames(all = false): Observable<Game[]> {
    const rows = this.database.watch<Game>('games');
    return combineLatest([rows, this.teams.selected, this.seasons.selected]).pipe(
      map(([games, teamId, season]) =>
        games.filter(
          (game) =>
            teamId === this.teams.selected.value &&
            (game.teamId ?? LEGACY_TEAM) === teamId &&
            (all || (game.seasonId ?? LEGACY_SEASON) === season),
        ),
      ),
    );
  }
  addGame(game: Game) {
    this.admin.assertAdmin();
    const { teamId, seasonId } = this.seasons.assertWritableSelection();
    if (!['competitie', 'beker'].includes(game.league)) {
      throw new Error('Selecteer een geldige competitie.');
    }
    const clean = Object.fromEntries(Object.entries(game).filter(([, v]) => v !== undefined));
    return this.database.add('games', {
      ...clean,
      seasonId,
      teamId,
      competitionId: competitionId(seasonId, game.league),
    });
  }
}
