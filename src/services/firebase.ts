import { InjectionToken } from '@angular/core';
import { Auth as FirebaseAuth, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { Query, DocumentData, onSnapshot } from 'firebase/firestore';
import { Observable } from 'rxjs';

export { GoogleAuthProvider, signInWithPopup, signOut, getAuth } from 'firebase/auth';
export type { User } from 'firebase/auth';
export {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  runTransaction,
  writeBatch,
  getFirestore,
} from 'firebase/firestore';
export type Auth = FirebaseAuth;
export const Auth = new InjectionToken<FirebaseAuth>('Firebase Auth');

export function authState(auth: Auth) {
  return new Observable<import('firebase/auth').User | null>((subscriber) =>
    onAuthStateChanged(
      auth,
      (value) => subscriber.next(value),
      (error) => subscriber.error(error),
    ),
  );
}
export function user(auth: Auth) {
  return new Observable<import('firebase/auth').User | null>((subscriber) =>
    onIdTokenChanged(
      auth,
      (value) => subscriber.next(value),
      (error) => subscriber.error(error),
    ),
  );
}
export function collectionData(query: Query<DocumentData>, options: { idField: string }) {
  return new Observable<DocumentData[]>((subscriber) =>
    onSnapshot(
      query,
      (snapshot) =>
        subscriber.next(
          snapshot.docs.map((doc) => ({
            ...doc.data(),
            [options.idField]: doc.id,
          })),
        ),
      (error) => subscriber.error(error),
    ),
  );
}
