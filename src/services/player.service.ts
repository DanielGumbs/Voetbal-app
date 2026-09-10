import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, Firestore } from './firebase';
import { combineLatest, map, Observable } from 'rxjs';
import { AdminService } from './admin.service';
import { LEGACY_SEASON, SeasonService, competitionId } from './season.service';
export interface Player {
  id?: string;
  name: string;
  number: number;
  seasonId?: string;
  competitionIds?: string[];
}
@Injectable({ providedIn: 'root' })
export class PlayerService {
  constructor(
    private firestore: Firestore,
    private seasons: SeasonService,
    private admin: AdminService,
  ) {}
  getPlayers(all = false): Observable<Player[]> {
    const rows = collectionData(collection(this.firestore, 'players'), {
      idField: 'id',
    }) as Observable<Player[]>;
    return all
      ? rows
      : combineLatest([rows, this.seasons.selected]).pipe(
          map(([players, season]) =>
            players.filter((p) => (p.seasonId ?? LEGACY_SEASON) === season),
          ),
        );
  }
  async addPlayer(name: string, number: number, types: string[]) {
    this.admin.assertAdmin();
    if (!name.trim() || !Number.isInteger(number) || number < 0 || !types.length)
      throw new Error('Vul een naam, geldig rugnummer en competitie in.');
    const seasonId = this.seasons.selected.value;
    if (seasonId === LEGACY_SEASON) throw new Error('Maak eerst een nieuw seizoen aan.');
    return addDoc(collection(this.firestore, 'players'), {
      name: name.trim(),
      number,
      seasonId,
      competitionIds: types.map((t) => competitionId(seasonId, t)),
    });
  }
}
