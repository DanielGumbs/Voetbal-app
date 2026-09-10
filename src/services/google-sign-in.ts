import { inject, InjectionToken } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup } from './firebase';

export const GOOGLE_SIGN_IN = new InjectionToken<() => Promise<unknown>>('Google sign-in', {
  providedIn: 'root',
  factory: () => {
    const auth = inject(Auth);
    return () => signInWithPopup(auth, new GoogleAuthProvider());
  },
});
