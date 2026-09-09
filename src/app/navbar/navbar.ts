import {AdminService} from '../../services/admin.service';
import {inject} from '@angular/core';
import {Component, Signal, signal} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {Auth, signOut, user, User} from '@angular/fire/auth';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink, RouterLinkActive,
  ],
  templateUrl: './navbar.html'
})
export class Navbar {
  admin = inject(AdminService);
  public mobileOpen = signal(false);
  public user!: Signal<User | null | undefined>;

  constructor(private auth: Auth) {
    this.user = toSignal(user(this.auth));
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

