import { inject } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';
import { Component, Signal, signal } from '@angular/core';

import { Auth, signIn, signOut, user, User } from '../../services/supabase';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
})
export class LoginComponent {
  readonly i18n = inject(TranslationService);
  user!: Signal<User | null | undefined>;
  readonly signingIn = signal(false);
  readonly error = signal('');

  constructor(
    private auth: Auth,
    private router: Router,
  ) {
    this.user = toSignal(user(this.auth));
  }

  async login() {
    if (this.signingIn()) return;
    this.signingIn.set(true);
    this.error.set('');
    try {
      await signIn(this.auth);
      await this.router.navigateByUrl('/games', { replaceUrl: true });
    } catch (err) {
      this.error.set('Inloggen is niet gelukt. Probeer opnieuw met Google.');
      console.error('Login error:', err);
    } finally {
      this.signingIn.set(false);
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (err) {
      this.error.set('Uitloggen is niet gelukt. Probeer opnieuw.');
      console.error('Logout error:', err);
    }
  }
}
