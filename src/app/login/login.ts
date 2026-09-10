import { Component, inject, Signal, signal } from '@angular/core';

import { Auth, signOut, user, User } from '../../services/firebase';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { GOOGLE_SIGN_IN } from '../../services/google-sign-in';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly signIn = inject(GOOGLE_SIGN_IN);
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
      await this.signIn();
      await this.router.navigateByUrl('/games', { replaceUrl: true });
    } catch (err) {
      this.error.set(
        'Inloggen is niet gelukt. Sta het Google-inlogvenster toe en probeer opnieuw.',
      );
      console.error('Login error:', err);
    } finally {
      this.signingIn.set(false);
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
}
