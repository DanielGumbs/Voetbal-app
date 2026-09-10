import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, Firestore } from './firebase';
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
    private firestore: Firestore,
    private seasons: SeasonService,
    private admin: AdminService,
  ) {}
  getGames(all = false): Observable<Game[]> {
    const rows = collectionData(collection(this.firestore, 'games'), {
      idField: 'id',
    }) as Observable<Game[]>;
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
    return addDoc(collection(this.firestore, 'games'), {
      ...clean,
      seasonId,
      competitionId: competitionId(seasonId, game.league),
    });
  }
}
