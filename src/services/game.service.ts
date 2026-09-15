import { Injectable } from '@angular/core';
import { Database } from './supabase';
import { combineLatest, map, Observable } from 'rxjs';
import { AdminService } from './admin.service';
import { competitionId, LEGACY_SEASON, SeasonService } from './season.service';
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
  competitionId?: string;
}
@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(
    private database: Database,
    private seasons: SeasonService,
    private admin: AdminService,
  ) {}
  getGames(all = false): Observable<Game[]> {
    const rows = this.database.watch<Game>('games');
    return all
      ? rows
      : combineLatest([rows, this.seasons.selected]).pipe(
          map(([games, season]) => games.filter((g) => (g.seasonId ?? LEGACY_SEASON) === season)),
        );
  }
  addGame(game: Game) {
    this.admin.assertAdmin();
    const seasonId = this.seasons.selected.value;
    if (seasonId === LEGACY_SEASON) throw new Error('Selecteer eerst een nieuw seizoen.');
    const clean = Object.fromEntries(Object.entries(game).filter(([, v]) => v !== undefined));
    return this.database.add('games', {
      ...clean,
      seasonId,
      competitionId: competitionId(seasonId, game.league),
    });
  }
}
