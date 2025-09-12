import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage, AsyncPipe } from '@angular/common';
import { Auth, signOut, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    AsyncPipe,
  ],
  templateUrl: './navbar.html'
})
export class Navbar {
  public mobileOpen = signal(false);
  public user$: Observable<any>;

  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
  }

  toggleMenu() {
    this.mobileOpen.update(v => !v);
  }

  closeMenu() {
    this.mobileOpen.set(false);
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
}
