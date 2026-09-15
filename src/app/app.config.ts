import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { Auth, SUPABASE, createAuth } from '../services/supabase';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: SUPABASE,
      useFactory: () => {
        const { url, publishableKey } = environment.supabase;
        if (!url || !publishableKey) {
          throw new Error(
            'Configureer de Supabase-project-URL en publieke key in src/environments.',
          );
        }
        return createClient(url, publishableKey);
      },
    },
    { provide: Auth, useFactory: createAuth, deps: [SUPABASE] },
  ],
};
