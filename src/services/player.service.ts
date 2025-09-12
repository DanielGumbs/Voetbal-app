import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Player {
  id?: string;
  name: string;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  constructor(private firestore: Firestore) {}

  getPlayers(): Observable<Player[]> {
    const ref = collection(this.firestore, 'players');
    return collectionData(ref, { idField: 'id' }) as Observable<Player[]>;
  }
}
