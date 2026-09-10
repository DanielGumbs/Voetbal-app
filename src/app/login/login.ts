import { Component, Signal, signal } from '@angular/core';

import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
  User,
} from '../../services/firebase';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
})
export class LoginComponent {
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
      await signInWithPopup(this.auth, new GoogleAuthProvider());
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
