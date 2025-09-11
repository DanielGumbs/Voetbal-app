import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  user$: Observable<any>;

  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
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
