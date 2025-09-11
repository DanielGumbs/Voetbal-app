import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface GameEvent {
  playerId: string;
  type: 'goal' | 'assist';
}

export interface Game {
  id?: string;
  opponent: string;
  date: string;
  events: GameEvent[];
}

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private firestore: Firestore) {}

  getGames(): Observable<Game[]> {
    const ref = collection(this.firestore, 'games');
    return collectionData(ref, { idField: 'id' }) as Observable<Game[]>;
  }

  addGame(game: Game) {
    const ref = collection(this.firestore, 'games');
    return addDoc(ref, game);
  }
}
