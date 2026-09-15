import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Auth,
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  writeBatch,
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
  async addSeason(name: string): Promise<string> {
    const ref = doc(collection(this.firestore, 'seasons'));
    const batch = writeBatch(this.firestore);
    batch.set(ref, { name });
    batch.set(doc(this.firestore, 'seasons', 'previous-season'), { name: 'Vorig seizoen' });
    for (const seasonId of ['previous-season', ref.id]) {
      for (const type of ['competitie', 'beker']) {
        batch.set(doc(this.firestore, 'competitions', seasonId + '_' + type), { seasonId, type });
      }
    }
    await batch.commit();
    return ref.id;
  }
}
