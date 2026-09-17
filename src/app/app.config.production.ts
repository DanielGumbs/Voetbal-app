import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { Auth, Firestore, getAuth, getFirestore } from '../services/firebase';
import { routes } from './app.routes';
import { environment } from '../environments/environment.firebase';
if (!environment.production && environment.firebase.projectId === 'voetbal-app-6fa54') {
  throw new Error('Ontwikkelmodus mag niet verbinden met de productiedatabase.');
}
if (!environment.firebase.apiKey || !environment.firebase.appId) {
  throw new Error('De aparte Firebase-testomgeving moet nog worden geconfigureerd.');
}
const firebaseApp = initializeApp(environment.firebase);
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: Auth, useFactory: () => getAuth(firebaseApp) },
    { provide: Firestore, useFactory: () => getFirestore(firebaseApp) },
  ],
};
