import { Component, Signal } from '@angular/core';

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

  constructor(
    private auth: Auth,
    private router: Router,
  ) {
    this.user = toSignal(user(this.auth));
  }

  async login() {
    try {
      await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this.router.navigateByUrl('/games', { replaceUrl: true });
    } catch (err) {
      console.error('Login error:', err);
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
