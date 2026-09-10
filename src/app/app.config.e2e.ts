import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  GoogleAuthProvider,
  initializeAuth,
  signInWithCredential,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { Auth, Firestore } from '../services/firebase';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { GOOGLE_SIGN_IN } from '../services/google-sign-in';

if (
  environment.firebase.projectId !== 'demo-voetbal-e2e' ||
  !['127.0.0.1', 'localhost'].includes(location.hostname)
) {
  throw new Error('E2E builds may only run locally with the demo project.');
}
const app = initializeApp(environment.firebase);
const auth = initializeAuth(app, { persistence: browserLocalPersistence });
const firestore = getFirestore(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(firestore, '127.0.0.1', 8080);

// This adapter is included only by the e2e configuration. Firebase's emulator
// accepts unsigned Google credentials, so tests need no Google account/network.
function emulatorSignIn() {
  const admin = sessionStorage.getItem('e2e-role') !== 'member';
  const payload = {
    sub: admin ? 'e2e-admin' : 'e2e-member',
    email: admin ? 'daniel.r.gumbs@gmail.com' : 'member@example.test',
    email_verified: true,
    name: admin ? 'Daniel Test' : 'Member Test',
    iss: 'https://accounts.google.com',
    aud: 'demo-voetbal-e2e',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
  return signInWithCredential(auth, GoogleAuthProvider.credential(token));
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: Auth, useValue: auth },
    { provide: Firestore, useValue: firestore },
    { provide: GOOGLE_SIGN_IN, useValue: emulatorSignIn },
  ],
};
