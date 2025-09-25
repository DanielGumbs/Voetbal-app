import {Component, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Auth, GoogleAuthProvider, signInWithPopup, signOut, user} from '@angular/fire/auth';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  user!: Signal<any | undefined>;

  constructor(private auth: Auth) {
    this.user = toSignal(user(this.auth));
  }

  async login() {
    try {
      await signInWithPopup(this.auth, new GoogleAuthProvider());
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
