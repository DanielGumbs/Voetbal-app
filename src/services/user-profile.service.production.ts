import { inject, Injectable } from '@angular/core';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { defer, Observable, switchMap } from 'rxjs';
import { Firestore, User } from './firebase';

export const ADMIN_EMAIL = 'daniel.r.gumbs@gmail.com';
export interface UserProfile {
  email: string;
  isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private firestore = inject(Firestore);

  watch(account: User): Observable<UserProfile | null> {
    const reference = doc(this.firestore, 'users', account.uid);
    return defer(() =>
      runTransaction(this.firestore, async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists()) {
          transaction.set(reference, {
            email: account.email ?? '',
            isAdmin: account.email === ADMIN_EMAIL && account.emailVerified,
          });
        }
      }),
    ).pipe(
      switchMap(
        () =>
          new Observable<UserProfile | null>((subscriber) =>
            onSnapshot(
              reference,
              (snapshot) => {
                const data = snapshot.data();
                subscriber.next(
                  data ? { email: data['email'], isAdmin: data['isAdmin'] === true } : null,
                );
              },
              (error) => subscriber.error(error),
            ),
          ),
      ),
    );
  }
}
