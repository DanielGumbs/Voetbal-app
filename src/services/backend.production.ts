import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Auth,
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  setDoc,
  runTransaction,
  GoogleAuthProvider,
  signInWithPopup,
} from './firebase';
export { Auth, authState, user, signOut } from './firebase';
export type { User } from './firebase';

export const signIn = async (auth: Auth): Promise<void> => {
  await signInWithPopup(auth, new GoogleAuthProvider());
};

@Injectable({ providedIn: 'root' })
export class Database {
  private firestore = inject(Firestore);
  watch<T>(table: string): Observable<T[]> {
    return collectionData(collection(this.firestore, table), { idField: 'id' }) as Observable<T[]>;
  }
  add(table: string, value: object) {
    return addDoc(collection(this.firestore, table), value);
  }
  async saveTeam(id: string, value: { name: string; logoUrl: string | null }): Promise<void> {
    await setDoc(doc(this.firestore, 'teams', id), value);
  }
  async addSeason(name: string, teamId = 'vedette'): Promise<string> {
    const ref = doc(collection(this.firestore, 'seasons'));
    await runTransaction(this.firestore, async (transaction) => {
      const previous = doc(this.firestore, 'seasons', 'previous-season');
      const previousCompetitions = ['competitie', 'beker'].map((type) =>
        doc(this.firestore, 'competitions', 'previous-season_' + type),
      );
      // Only Vedette owns the historical records. Read before writing so concurrent
      // season creation cannot overwrite an existing season or its competitions.
      if (teamId === 'vedette') {
        const previousSnapshot = await transaction.get(previous);
        const competitionSnapshots = await Promise.all(
          previousCompetitions.map((competition) => transaction.get(competition)),
        );
        if (
          previousSnapshot.exists() &&
          (previousSnapshot.data()['teamId'] ?? 'vedette') !== teamId
        ) {
          throw new Error('Het vorige seizoen hoort bij een ander team.');
        }
        if (!previousSnapshot.exists()) {
          transaction.set(previous, { name: 'Vorig seizoen', teamId });
        }
        for (const [index, type] of ['competitie', 'beker'].entries()) {
          if (!competitionSnapshots[index].exists()) {
            transaction.set(previousCompetitions[index], {
              seasonId: 'previous-season',
              type,
              teamId,
            });
          }
        }
      }
      transaction.set(ref, { name: name.trim(), teamId });
      for (const type of ['competitie', 'beker']) {
        transaction.set(doc(this.firestore, 'competitions', ref.id + '_' + type), {
          seasonId: ref.id,
          type,
          teamId,
        });
      }
    });
    return ref.id;
  }
}
