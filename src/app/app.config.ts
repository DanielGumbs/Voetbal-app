import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { Auth, Firestore, getAuth, getFirestore } from '../services/firebase';
import { routes } from './app.routes';
import { firebaseConfig } from '../../firebase.config';
const firebaseApp = initializeApp(firebaseConfig);
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: Auth, useFactory: () => getAuth(firebaseApp) },
    { provide: Firestore, useFactory: () => getFirestore(firebaseApp) },
  ],
};
