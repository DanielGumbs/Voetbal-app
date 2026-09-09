import {inject, Injectable} from '@angular/core';
import {collection, collectionData, doc, Firestore, writeBatch} from '@angular/fire/firestore';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';
import {AdminService} from './admin.service';
export const LEGACY_SEASON = 'previous-season';
export interface Season { id: string; name: string; }
export type CompetitionType = 'competitie' | 'beker';
export const competitionId = (season: string, type: string) => `${season}_${type}`;
@Injectable({providedIn: 'root'})
export class SeasonService {
  private db = inject(Firestore);
  private admin = inject(AdminService);
  selected = new BehaviorSubject<string>(LEGACY_SEASON);
  private defaultSelected = false;
  getSeasons(): Observable<Season[]> {
    return (collectionData(collection(this.db, 'seasons'), {idField: 'id'}) as Observable<Season[]>).pipe(
      map(rows => [
        ...rows.filter(s => s.id !== LEGACY_SEASON)
          .sort((a, b) => b.name.localeCompare(a.name, 'nl', {numeric: true})),
        {id: LEGACY_SEASON, name: 'Vorig seizoen'}
      ]),
      tap(seasons => {
        // Apply the default once; keep the user's choice when navigating between tabs.
        if (!this.defaultSelected && seasons[0].id !== LEGACY_SEASON) {
          this.defaultSelected = true;
          this.selected.next(seasons[0].id);
        }
      }));
  }
  async addSeason(name: string) {
    this.admin.assertAdmin();
    name = name.trim();
    if (!name || name.length > 80) throw new Error('Vul een seizoensnaam in (maximaal 80 tekens).');
    const ref = doc(collection(this.db, 'seasons'));
    const batch = writeBatch(this.db);
    batch.set(ref, {name});
    batch.set(doc(this.db, 'seasons', LEGACY_SEASON), {name: 'Vorig seizoen'});
    for (const seasonId of [LEGACY_SEASON, ref.id]) {
      for (const type of ['competitie', 'beker']) {
        batch.set(doc(this.db, 'competitions', competitionId(seasonId, type)), {seasonId, type});
      }
    }
    await batch.commit();
    this.selected.next(ref.id);
  }
}
