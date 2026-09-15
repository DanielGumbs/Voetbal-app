import { inject, Injectable } from '@angular/core';
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { Language } from '../i18n/translation.service';
import { defer, Observable, switchMap } from 'rxjs';
import { Firestore, User } from './firebase';

export const ADMIN_EMAIL = 'daniel.r.gumbs@gmail.com';
export interface UserProfile {
  email: string;
  isAdmin: boolean;
  language?: Language;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private firestore = inject(Firestore);
  async setLanguage(account: User, language: Language): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', account.uid), { language });
  }

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
                  data
                    ? {
                        email: data['email'],
                        isAdmin: data['isAdmin'] === true,
                        language: data['language'],
                      }
                    : null,
                );
              },
              (error) => subscriber.error(error),
            ),
          ),
      ),
    );
  }
}
